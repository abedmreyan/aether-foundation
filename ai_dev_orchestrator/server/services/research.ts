import * as db from "../db-sqlite";

/**
 * Research Service
 * Handles on-demand research using Perplexity MCP
 */

export interface ResearchRequest {
    projectId: number;
    title: string;
    description: string;
    type: "market" | "technical" | "competitive";
}

export interface ResearchResult {
    id: number;
    summary: string;
    findings: string[];
    sources: Array<{
        title: string;
        url: string;
        snippet: string;
    }>;
    recommendations?: string[];
}

export class ResearchService {
    /**
     * Create a research task and execute it using Perplexity
     */
    static async conductResearch(request: ResearchRequest): Promise<number> {
        // Create research task in database
        const researchId = await db.createResearchTask({
            projectId: request.projectId,
            title: request.title,
            description: request.description,
            type: request.type,
            status: "pending",
            assignedAgentId: null,
        });

        // Assign to appropriate research agent
        const agentRole =
            request.type === "market"
                ? "market_research"
                : request.type === "technical"
                    ? "technical_research"
                    : "business_analyst";

        const agent = await db.getAgentByRole(agentRole);
        if (agent) {
            await db.updateResearchStatus(researchId, "in_progress", agent.id);
            await db.updateAgentStatus(agent.id, "working", undefined);
        }

        // Execute research using Perplexity MCP (async)
        this.executePerplexityResearch(researchId, request).catch((err) => {
            console.error(`Research ${researchId} failed:`, err);
            db.updateResearchStatus(researchId, "failed", agent?.id);
        });

        return researchId;
    }

    /**
     * Execute research using Perplexity MCP
     */
    private static async executePerplexityResearch(
        researchId: number,
        request: ResearchRequest
    ): Promise<void> {
        try {
            // Try to use Perplexity MCP if available
            const perplexityResult = await this.queryPerplexity(
                request.description,
                request.type
            );

            // Parse and structure results
            const result: ResearchResult = {
                id: researchId,
                summary: perplexityResult.summary || "Research completed",
                findings: perplexityResult.findings || [],
                sources: perplexityResult.sources || [],
                recommendations: perplexityResult.recommendations,
            };

            // Update database with results
            await db.updateResearchResult(researchId, JSON.stringify(result));
            await db.updateResearchStatus(researchId, "completed");

            // Update agent status
            const research = await db.getResearchById(researchId);
            if (research?.assignedAgentId) {
                await db.updateAgentStatus(research.assignedAgentId, "idle");
            }
        } catch (error) {
            console.error("Perplexity research failed:", error);
            await db.updateResearchStatus(researchId, "failed");
            throw error;
        }
    }

    /**
     * Query Perplexity MCP
     */
    private static async queryPerplexity(
        query: string,
        type: string
    ): Promise<any> {
        try {
            // Try to use perplexity-ask MCP server
            const { getMCPClient } = await import("../mcp/client");
            const mcp = getMCPClient();

            await mcp.connect();

            const result = await mcp.callTool({
                tool: "mcp_perplexity-ask_perplexity_ask",
                parameters: {
                    messages: [
                        {
                            role: "system",
                            content: `You are a ${type} research assistant. Provide comprehensive, well-sourced research.`,
                        },
                        {
                            role: "user",
                            content: query,
                        },
                    ],
                },
            });

            await mcp.disconnect();

            if (result.success && result.data) {
                return this.parsePerplexityResponse(result.data);
            } else {
                throw new Error("Perplexity query failed");
            }
        } catch (error) {
            console.error("Perplexity MCP not available:", error);
            // Fallback to mock research
            return this.mockResearch(query, type);
        }
    }

    /**
     * Parse Perplexity API response
     */
    private static parsePerplexityResponse(data: any): any {
        // Extract content from Perplexity response
        const content =
            data.choices?.[0]?.message?.content ||
            data.content ||
            "No results found";

        // Try to structure the response
        const lines = content.split("\n").filter((l: string) => l.trim());
        const findings: string[] = [];
        const sources: any[] = [];
        let summary = "";

        // Simple parsing - look for bullet points and citations
        for (const line of lines) {
            if (line.startsWith("- ") || line.startsWith("* ")) {
                findings.push(line.substring(2));
            } else if (line.includes("http")) {
                // Extract URLs as sources
                const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
                if (urlMatch) {
                    sources.push({
                        title: "Source",
                        url: urlMatch[1],
                        snippet: line,
                    });
                }
            } else if (!summary && line.length > 50) {
                summary = line;
            }
        }

        return {
            summary: summary || content.substring(0, 200),
            findings: findings.length > 0 ? findings : [content],
            sources,
        };
    }

    /**
     * Mock research for testing (fallback when Perplexity unavailable)
     */
    private static async mockResearch(query: string, type: string): Promise<any> {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate delay

        return {
            summary: `Mock ${type} research results for: ${query}`,
            findings: [
                `Finding 1: ${type} analysis shows promising trends`,
                `Finding 2: Key competitors identified in the space`,
                `Finding 3: Market opportunity estimated at $X million`,
            ],
            sources: [
                {
                    title: "Industry Report 2024",
                    url: "https://example.com/report",
                    snippet: "Overview of market trends...",
                },
            ],
            recommendations: [
                "Consider focusing on niche market segment",
                "Monitor competitor X closely",
            ],
        };
    }

    /**
     * Get research results
     */
    static async getResearchResults(researchId: number): Promise<ResearchResult | null> {
        const research = await db.getResearchById(researchId);
        if (!research || !research.result) {
            return null;
        }

        try {
            return JSON.parse(research.result);
        } catch {
            return null;
        }
    }
}
