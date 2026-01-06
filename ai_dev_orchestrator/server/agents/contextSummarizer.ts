import { invokeLLM } from "../_core/llm";

/**
 * Context Summarizer Service
 * Prevents token overflow by summarizing context when it grows too large
 */

const MAX_CONTEXT_TOKENS = 100000; // Configurable limit
const SUMMARIZE_THRESHOLD = 0.8; // Summarize when 80% full

export class ContextSummarizer {
    /**
     * Estimate token count (rough approximation: 1 token ≈ 4 characters)
     */
    private static estimateTokens(text: string): number {
        return Math.ceil(text.length / 4);
    }

    /**
     * Check if context needs summarization
     */
    static needsSummarization(context: string): boolean {
        const tokens = this.estimateTokens(context);
        return tokens > MAX_CONTEXT_TOKENS * SUMMARIZE_THRESHOLD;
    }

    /**
     * Summarize context to reduce token count
     * Keeps recent 20% verbatim, summarizes older 80%
     */
    static async summarize(context: string, maxTokens: number = MAX_CONTEXT_TOKENS): Promise<string> {
        const currentTokens = this.estimateTokens(context);

        if (currentTokens <= maxTokens) {
            return context;
        }

        // Split context into sections
        const lines = context.split("\n");
        const recentLines = Math.floor(lines.length * 0.2); // Keep 20% recent
        const oldLines = lines.slice(0, lines.length - recentLines);
        const recentContent = lines.slice(lines.length - recentLines).join("\n");

        // Summarize old content using LLM
        const oldContent = oldLines.join("\n");
        const summaryPrompt = `Summarize the following context, preserving key decisions, requirements, and technical details. Be concise but comprehensive:\n\n${oldContent}`;

        try {
            const summary = await invokeLLM({
                messages: [
                    { role: "system", content: "You are a technical summarizer. Create concise summaries that preserve essential information." },
                    { role: "user", content: summaryPrompt }
                ],
                maxTokens: Math.floor(maxTokens * 0.3), // Use 30% of budget for summary
            });

            // Combine summary with recent content
            return `# Context Summary\n\n${summary}\n\n# Recent Context (Verbatim)\n\n${recentContent}`;
        } catch (error) {
            console.error("Failed to summarize context:", error);
            // Fallback: just truncate
            return `${context.substring(0, maxTokens * 4)}...\n\n[Context truncated due to length]`;
        }
    }

    /**
     * Extract key points from text
     */
    static async extractKeyPoints(text: string): Promise<string[]> {
        const prompt = `Extract 5-10 key points from the following text. Format as bullet points:\n\n${text}`;

        try {
            const result = await invokeLLM({
                messages: [
                    { role: "system", content: "Extract key points from text." },
                    { role: "user", content: prompt }
                ],
                maxTokens: 500,
            });

            return result.split("\n").filter(line => line.trim().startsWith("-") || line.trim().startsWith("•"));
        } catch (error) {
            console.error("Failed to extract key points:", error);
            return [];
        }
    }

    /**
     * Create a checkpoint summary for a task
     * Stores the summarized context in knowledge base
     */
    static async checkpoint(taskId: number, context: string): Promise<void> {
        const summary = await this.summarize(context, MAX_CONTEXT_TOKENS * 0.5);
        const keyPoints = await this.extractKeyPoints(context);

        // Store in knowledge base
        const db = await import("../db");
        const task = await db.getTaskById(taskId);

        if (!task) return;

        // Get project ID from task -> module -> subsystem -> project
        const module = await db.getDb()
            .select()
            .from((await import("../../drizzle/schema-sqlite")).modules)
            .where((await import("drizzle-orm")).eq((await import("../../drizzle/schema-sqlite")).modules.id, task.moduleId))
            .limit(1);

        if (!module[0]) return;

        const subsystem = await db.getDb()
            .select()
            .from((await import("../../drizzle/schema-sqlite")).subsystems)
            .where((await import("drizzle-orm")).eq((await import("../../drizzle/schema-sqlite")).subsystems.id, module[0].subsystemId))
            .limit(1);

        if (!subsystem[0]) return;

        await db.addKnowledge({
            projectId: subsystem[0].projectId,
            key: `task_${taskId}_checkpoint`,
            value: JSON.stringify({
                summary,
                keyPoints,
                timestamp: new Date().toISOString(),
            }),
            source: "context_summarizer",
        });
    }

    /**
     * Restore context from checkpoint
     */
    static async restoreCheckpoint(taskId: number): Promise<string | null> {
        const db = await import("../db");
        const task = await db.getTaskById(taskId);

        if (!task) return null;

        // Get project ID
        const module = await db.getDb()
            .select()
            .from((await import("../../drizzle/schema-sqlite")).modules)
            .where((await import("drizzle-orm")).eq((await import("../../drizzle/schema-sqlite")).modules.id, task.moduleId))
            .limit(1);

        if (!module[0]) return null;

        const subsystem = await db.getDb()
            .select()
            .from((await import("../../drizzle/schema-sqlite")).subsystems)
            .where((await import("drizzle-orm")).eq((await import("../../drizzle/schema-sqlite")).subsystems.id, module[0].subsystemId))
            .limit(1);

        if (!subsystem[0]) return null;

        // Get checkpoint from knowledge base
        const knowledge = await db.getProjectKnowledge(subsystem[0].projectId);
        const checkpoint = knowledge.find(k => k.key === `task_${taskId}_checkpoint`);

        if (!checkpoint) return null;

        const data = JSON.parse(checkpoint.value);
        return data.summary;
    }
}
