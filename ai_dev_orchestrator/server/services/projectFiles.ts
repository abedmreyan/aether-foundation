import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

/**
 * Project File Service
 * Provides read/write access to files in the local project
 */
export class ProjectFileService {
    private projectPath: string;

    constructor() {
        const envPath = process.env.AETHER_PROJECT_PATH;
        if (!envPath) {
            throw new Error("AETHER_PROJECT_PATH environment variable not set");
        }
        this.projectPath = envPath;
    }

    /**
     * Read a file from the project
     */
    async readFile(relativePath: string): Promise<string> {
        const fullPath = path.join(this.projectPath, relativePath);

        // Security: ensure path is within project directory
        if (!fullPath.startsWith(this.projectPath)) {
            throw new Error("Path traversal not allowed");
        }

        try {
            const content = await readFile(fullPath, "utf-8");
            return content;
        } catch (error) {
            throw new Error(`Failed to read file ${relativePath}: ${error}`);
        }
    }

    /**
     * Write a file to the project (with backup)
     */
    async writeFile(relativePath: string, content: string): Promise<void> {
        const fullPath = path.join(this.projectPath, relativePath);

        // Security: ensure path is within project directory
        if (!fullPath.startsWith(this.projectPath)) {
            throw new Error("Path traversal not allowed");
        }

        try {
            // Create backup if file exists
            if (fs.existsSync(fullPath)) {
                const backupPath = `${fullPath}.backup`;
                await writeFile(backupPath, await readFile(fullPath, "utf-8"));
            }

            // Ensure directory exists
            const dir = path.dirname(fullPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Write file
            await writeFile(fullPath, content, "utf-8");
        } catch (error) {
            throw new Error(`Failed to write file ${relativePath}: ${error}`);
        }
    }

    /**
     * List files matching a pattern
     */
    async listFiles(pattern: string): Promise<string[]> {
        const files: string[] = [];

        const walk = async (dir: string) => {
            const entries = await readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory()) {
                    // Skip node_modules, .git, etc.
                    if (["node_modules", ".git", "dist", "build", ".next"].includes(entry.name)) {
                        continue;
                    }
                    await walk(fullPath);
                } else if (entry.isFile()) {
                    const relativePath = path.relative(this.projectPath, fullPath);

                    // Simple pattern matching (supports *.ext)
                    if (pattern === "*" || relativePath.includes(pattern.replace("*", ""))) {
                        files.push(relativePath);
                    }
                }
            }
        };

        await walk(this.projectPath);
        return files;
    }

    /**
     * Get file outline (functions, classes)
     * Simple implementation - can be enhanced with AST parsing
     */
    async getOutline(relativePath: string): Promise<FileOutline> {
        const content = await this.readFile(relativePath);
        const lines = content.split("\n");

        const outline: FileOutline = {
            functions: [],
            classes: [],
            imports: [],
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Detect functions
            if (line.startsWith("function ") || line.startsWith("export function ")) {
                const match = line.match(/function\s+(\w+)/);
                if (match) {
                    outline.functions.push({ name: match[1], line: i + 1 });
                }
            }

            // Detect classes
            if (line.startsWith("class ") || line.startsWith("export class ")) {
                const match = line.match(/class\s+(\w+)/);
                if (match) {
                    outline.classes.push({ name: match[1], line: i + 1 });
                }
            }

            // Detect imports
            if (line.startsWith("import ")) {
                outline.imports.push(line);
            }
        }

        return outline;
    }

    /**
     * Search in files
     */
    async searchFiles(query: string): Promise<SearchResult[]> {
        const results: SearchResult[] = [];
        const files = await this.listFiles("*");

        for (const file of files) {
            try {
                const content = await this.readFile(file);
                const lines = content.split("\n");

                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].toLowerCase().includes(query.toLowerCase())) {
                        results.push({
                            file,
                            line: i + 1,
                            content: lines[i].trim(),
                        });
                    }
                }
            } catch (error) {
                // Skip files that can't be read
                continue;
            }
        }

        return results;
    }
}

export interface FileOutline {
    functions: Array<{ name: string; line: number }>;
    classes: Array<{ name: string; line: number }>;
    imports: string[];
}

export interface SearchResult {
    file: string;
    line: number;
    content: string;
}

// Export singleton instance
export const projectFiles = new ProjectFileService();
