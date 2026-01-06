import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import * as db from "../db";

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

export interface ProjectStatus {
    health: "healthy" | "needs_attention" | "blocked";
    summary: string;
    recentChanges: FileChange[];
    todos: TodoItem[];
    openIssues: string[];
    suggestedTasks: SuggestedTask[];
    contextFiles: ContextFile[];
    documentation: DocAnalysis;
}

export interface FileChange {
    file: string;
    modified: Date;
    type: "added" | "modified" | "deleted";
}

export interface TodoItem {
    file: string;
    line: number;
    text: string;
    priority: "high" | "medium" | "low";
}

export interface SuggestedTask {
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
    type: "bug" | "feature" | "refactor" | "docs";
    source: string;
}

export interface ContextFile {
    name: string;
    path: string;
    content: string;
    type: "task" | "config" | "doc" | "workflow";
}

export interface DocAnalysis {
    files: DocFile[];
    staleCount: number;
    missingDocs: string[];
    coverage: number;
}

export interface DocFile {
    path: string;
    title: string;
    lastModified: Date;
    isStale: boolean;
    sections: string[];
    wordCount: number;
}

/**
 * Dynamic Context Analysis Service
 * Scans project files in real-time to understand current status
 */
export class DynamicContextService {
    private projectPath: string;

    constructor(projectPath: string) {
        this.projectPath = projectPath;
    }

    /**
     * Get complete project status with dynamic analysis
     */
    async getProjectStatus(): Promise<ProjectStatus> {
        const [recentChanges, todos, contextFiles, documentation] = await Promise.all([
            this.getRecentChanges(),
            this.findTodos(),
            this.readContextFiles(),
            this.analyzeDocumentation(),
        ]);

        const suggestedTasks = this.generateSuggestedTasks(todos, contextFiles, documentation);
        const openIssues = this.extractOpenIssues(contextFiles);
        const health = this.calculateHealth(todos, openIssues, recentChanges, documentation);
        const summary = this.generateSummary(recentChanges, todos, contextFiles, documentation);

        return {
            health,
            summary,
            recentChanges,
            todos,
            openIssues,
            suggestedTasks,
            contextFiles,
            documentation,
        };
    }

    /**
     * Get recently modified files
     */
    private async getRecentChanges(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<FileChange[]> {
        const changes: FileChange[] = [];
        const now = Date.now();
        const IGNORE_DIRS = ["node_modules", ".git", "dist", "build", ".next", "__pycache__"];

        const walk = async (dir: string, depth: number = 0) => {
            if (depth > 5) return;

            try {
                const entries = await readdir(dir, { withFileTypes: true });

                for (const entry of entries) {
                    if (IGNORE_DIRS.includes(entry.name)) continue;

                    const fullPath = path.join(dir, entry.name);

                    if (entry.isDirectory()) {
                        await walk(fullPath, depth + 1);
                    } else if (entry.isFile()) {
                        const stats = await stat(fullPath);
                        if (now - stats.mtimeMs < maxAge) {
                            changes.push({
                                file: path.relative(this.projectPath, fullPath),
                                modified: stats.mtime,
                                type: "modified",
                            });
                        }
                    }
                }
            } catch (e) {
                // Skip directories we can't read
            }
        };

        await walk(this.projectPath);

        // Sort by most recent first
        return changes
            .sort((a, b) => b.modified.getTime() - a.modified.getTime())
            .slice(0, 20);
    }

    /**
     * Find TODO, FIXME, HACK comments in code
     */
    private async findTodos(): Promise<TodoItem[]> {
        const todos: TodoItem[] = [];
        const CODE_EXTS = [".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java"];
        const IGNORE_DIRS = ["node_modules", ".git", "dist", "build"];
        const TODO_PATTERNS = [
            { pattern: /\/\/\s*TODO:?\s*(.+)/gi, priority: "medium" as const },
            { pattern: /\/\/\s*FIXME:?\s*(.+)/gi, priority: "high" as const },
            { pattern: /\/\/\s*HACK:?\s*(.+)/gi, priority: "high" as const },
            { pattern: /\/\/\s*XXX:?\s*(.+)/gi, priority: "medium" as const },
            { pattern: /#\s*TODO:?\s*(.+)/gi, priority: "medium" as const },
            { pattern: /#\s*FIXME:?\s*(.+)/gi, priority: "high" as const },
        ];

        const scanFile = async (filePath: string) => {
            try {
                const content = await readFile(filePath, "utf-8");
                const lines = content.split("\n");

                lines.forEach((line, index) => {
                    for (const { pattern, priority } of TODO_PATTERNS) {
                        const match = pattern.exec(line);
                        if (match) {
                            todos.push({
                                file: path.relative(this.projectPath, filePath),
                                line: index + 1,
                                text: match[1].trim(),
                                priority,
                            });
                        }
                        pattern.lastIndex = 0; // Reset regex
                    }
                });
            } catch (e) {
                // Skip files we can't read
            }
        };

        const walk = async (dir: string, depth: number = 0) => {
            if (depth > 5) return;

            try {
                const entries = await readdir(dir, { withFileTypes: true });

                for (const entry of entries) {
                    if (IGNORE_DIRS.includes(entry.name)) continue;

                    const fullPath = path.join(dir, entry.name);

                    if (entry.isDirectory()) {
                        await walk(fullPath, depth + 1);
                    } else if (entry.isFile()) {
                        const ext = path.extname(entry.name).toLowerCase();
                        if (CODE_EXTS.includes(ext)) {
                            await scanFile(fullPath);
                        }
                    }
                }
            } catch (e) {
                // Skip directories we can't read
            }
        };

        await walk(this.projectPath);
        return todos.slice(0, 50);
    }

    /**
     * Read context files (.tasks/, .agent/, workflows, etc.)
     */
    private async readContextFiles(): Promise<ContextFile[]> {
        const files: ContextFile[] = [];

        const contextPaths = [
            { dir: ".tasks", type: "task" as const },
            { dir: ".agent", type: "workflow" as const },
            { dir: ".agent/workflows", type: "workflow" as const },
            { dir: ".cursor", type: "config" as const },
            { dir: ".github", type: "config" as const },
        ];

        // Read directories
        for (const { dir, type } of contextPaths) {
            const fullDir = path.join(this.projectPath, dir);
            if (fs.existsSync(fullDir)) {
                try {
                    const entries = await readdir(fullDir, { withFileTypes: true });

                    for (const entry of entries) {
                        if (entry.isFile() && (entry.name.endsWith(".md") || entry.name.endsWith(".json") || entry.name.endsWith(".yaml"))) {
                            const filePath = path.join(fullDir, entry.name);
                            try {
                                const content = await readFile(filePath, "utf-8");
                                files.push({
                                    name: entry.name,
                                    path: path.relative(this.projectPath, filePath),
                                    content: content.substring(0, 5000), // Limit size
                                    type,
                                });
                            } catch (e) { }
                        }
                    }
                } catch (e) { }
            }
        }

        // Read specific files
        const specificFiles = [
            { file: "README.md", type: "doc" as const },
            { file: "CHANGELOG.md", type: "doc" as const },
            { file: "TODO.md", type: "task" as const },
            { file: "ROADMAP.md", type: "task" as const },
        ];

        for (const { file, type } of specificFiles) {
            const filePath = path.join(this.projectPath, file);
            if (fs.existsSync(filePath)) {
                try {
                    const content = await readFile(filePath, "utf-8");
                    files.push({
                        name: file,
                        path: file,
                        content: content.substring(0, 5000),
                        type,
                    });
                } catch (e) { }
            }
        }

        return files;
    }

    /**
     * Analyze documentation files for freshness and coverage
     */
    private async analyzeDocumentation(): Promise<DocAnalysis> {
        const docFiles: DocFile[] = [];
        const DOC_EXTS = [".md", ".mdx", ".rst", ".txt"];
        const IGNORE_DIRS = ["node_modules", ".git", "dist", "build"];

        // Get most recent code change for staleness comparison
        const codeChanges = await this.getRecentChanges(30 * 24 * 60 * 60 * 1000); // 30 days
        const mostRecentCodeChange = codeChanges[0]?.modified || new Date(0);

        const scanDoc = async (filePath: string) => {
            try {
                const stats = await stat(filePath);
                const content = await readFile(filePath, "utf-8");

                // Extract title (first H1)
                const titleMatch = content.match(/^#\s+(.+)$/m);
                const title = titleMatch ? titleMatch[1] : path.basename(filePath, path.extname(filePath));

                // Extract sections (H2s)
                const sections = (content.match(/^##\s+(.+)$/gm) || []).map(s => s.replace(/^##\s+/, ""));

                // Count words
                const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

                // Check if stale (doc older than code changes)
                const isStale = stats.mtime < mostRecentCodeChange;

                docFiles.push({
                    path: path.relative(this.projectPath, filePath),
                    title,
                    lastModified: stats.mtime,
                    isStale,
                    sections,
                    wordCount,
                });
            } catch (e) { }
        };

        const walk = async (dir: string, depth: number = 0) => {
            if (depth > 4) return;

            try {
                const entries = await readdir(dir, { withFileTypes: true });

                for (const entry of entries) {
                    if (IGNORE_DIRS.includes(entry.name)) continue;

                    const fullPath = path.join(dir, entry.name);

                    if (entry.isDirectory()) {
                        // Prioritize docs directories
                        if (["docs", "documentation", ".github"].includes(entry.name)) {
                            await walk(fullPath, depth + 1);
                        } else if (depth < 2) {
                            await walk(fullPath, depth + 1);
                        }
                    } else if (entry.isFile()) {
                        const ext = path.extname(entry.name).toLowerCase();
                        if (DOC_EXTS.includes(ext)) {
                            await scanDoc(fullPath);
                        }
                    }
                }
            } catch (e) { }
        };

        await walk(this.projectPath);

        // Check for missing common docs
        const missingDocs: string[] = [];
        const expectedDocs = ["README.md", "CONTRIBUTING.md", "CHANGELOG.md", "docs/"];
        for (const expected of expectedDocs) {
            const fullPath = path.join(this.projectPath, expected);
            if (!fs.existsSync(fullPath)) {
                missingDocs.push(expected);
            }
        }

        // Calculate coverage (% of code files with corresponding docs)
        const codeFileCount = codeChanges.length || 1;
        const docFileCount = docFiles.length;
        const coverage = Math.min(100, Math.round((docFileCount / codeFileCount) * 100));

        const staleCount = docFiles.filter(d => d.isStale).length;

        return {
            files: docFiles.slice(0, 20),
            staleCount,
            missingDocs,
            coverage,
        };
    }

    /**
     * Generate suggested tasks from analysis
     */
    private generateSuggestedTasks(todos: TodoItem[], contextFiles: ContextFile[], documentation: DocAnalysis): SuggestedTask[] {
        const tasks: SuggestedTask[] = [];

        // Convert high-priority TODOs to tasks
        const highPriorityTodos = todos.filter(t => t.priority === "high");
        for (const todo of highPriorityTodos.slice(0, 5)) {
            tasks.push({
                title: todo.text.substring(0, 100),
                description: `Found in ${todo.file}:${todo.line}`,
                priority: "high",
                type: todo.text.toLowerCase().includes("fix") ? "bug" : "refactor",
                source: `${todo.file}:${todo.line}`,
            });
        }

        // Parse task files
        for (const file of contextFiles.filter(f => f.type === "task")) {
            const uncheckedTasks = file.content.match(/- \[ \] .+/g) || [];
            for (const task of uncheckedTasks.slice(0, 5)) {
                const text = task.replace("- [ ] ", "").trim();
                tasks.push({
                    title: text.substring(0, 100),
                    description: `From ${file.name}`,
                    priority: "medium",
                    type: "feature",
                    source: file.path,
                });
            }
        }

        // Add stale documentation tasks
        for (const doc of documentation.files.filter(d => d.isStale).slice(0, 3)) {
            tasks.push({
                title: `Update ${doc.title} documentation`,
                description: `Last updated ${doc.lastModified.toLocaleDateString()}, code has changed since`,
                priority: "medium",
                type: "docs",
                source: doc.path,
            });
        }

        // Add missing docs tasks
        for (const missing of documentation.missingDocs.slice(0, 2)) {
            tasks.push({
                title: `Create ${missing}`,
                description: `Missing recommended documentation file`,
                priority: "low",
                type: "docs",
                source: "project",
            });
        }

        return tasks.slice(0, 10);
    }

    /**
     * Extract open issues from context files
     */
    private extractOpenIssues(contextFiles: ContextFile[]): string[] {
        const issues: string[] = [];

        for (const file of contextFiles) {
            // Look for "Issue:" or "Bug:" patterns
            const issueMatches = file.content.match(/(?:Issue|Bug|Problem|Error):\s*(.+)/gi) || [];
            for (const match of issueMatches) {
                issues.push(match);
            }
        }

        return issues.slice(0, 10);
    }

    /**
     * Calculate project health
     */
    private calculateHealth(
        todos: TodoItem[],
        issues: string[],
        changes: FileChange[],
        documentation: DocAnalysis
    ): "healthy" | "needs_attention" | "blocked" {
        const highPriorityCount = todos.filter(t => t.priority === "high").length;
        const issueCount = issues.length;
        const staleDocsCount = documentation.staleCount;

        if (highPriorityCount > 10 || issueCount > 5 || staleDocsCount > 10) {
            return "blocked";
        }
        if (highPriorityCount > 3 || issueCount > 2 || staleDocsCount > 5) {
            return "needs_attention";
        }
        return "healthy";
    }

    /**
     * Generate status summary
     */
    private generateSummary(
        changes: FileChange[],
        todos: TodoItem[],
        contextFiles: ContextFile[],
        documentation: DocAnalysis
    ): string {
        const parts: string[] = [];

        if (changes.length > 0) {
            parts.push(`${changes.length} files modified recently`);
        }

        const highTodos = todos.filter(t => t.priority === "high").length;
        if (highTodos > 0) {
            parts.push(`${highTodos} high-priority TODOs`);
        }

        if (documentation.staleCount > 0) {
            parts.push(`${documentation.staleCount} docs need updating`);
        }

        const taskFiles = contextFiles.filter(f => f.type === "task");
        if (taskFiles.length > 0) {
            parts.push(`${taskFiles.length} task files found`);
        }

        return parts.join(", ") || "Project looks good";
    }

    /**
     * Get file content for specific path
     */
    async readFile(relativePath: string): Promise<string> {
        const fullPath = path.join(this.projectPath, relativePath);
        if (!fullPath.startsWith(this.projectPath)) {
            throw new Error("Path traversal not allowed");
        }
        return readFile(fullPath, "utf-8");
    }

    /**
     * List files in directory
     */
    async listDirectory(relativePath: string = ""): Promise<{ name: string; isDir: boolean; size?: number }[]> {
        const fullPath = path.join(this.projectPath, relativePath);
        if (!fullPath.startsWith(this.projectPath)) {
            throw new Error("Path traversal not allowed");
        }

        const entries = await readdir(fullPath, { withFileTypes: true });
        const results = [];

        for (const entry of entries) {
            if (entry.name.startsWith(".") || entry.name === "node_modules") continue;

            const item: { name: string; isDir: boolean; size?: number } = {
                name: entry.name,
                isDir: entry.isDirectory(),
            };

            if (!entry.isDirectory()) {
                const stats = await stat(path.join(fullPath, entry.name));
                item.size = stats.size;
            }

            results.push(item);
        }

        return results;
    }
}

/**
 * Create context service for a project
 */
export async function getProjectContextService(projectId: number): Promise<DynamicContextService | null> {
    const knowledge = await db.getProjectKnowledge(projectId);
    const localPath = knowledge.find(k => k.key === "local_path");

    if (!localPath) return null;

    return new DynamicContextService(localPath.value);
}
