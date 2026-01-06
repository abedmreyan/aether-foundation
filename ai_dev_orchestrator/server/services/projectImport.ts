import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import * as db from "../db-sqlite";

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

export interface ImportedProject {
    name: string;
    description: string;
    path: string;
    packageJson?: any;
    readme?: string;
    structure: ProjectStructure;
    techStack: string[];
}

export interface ProjectStructure {
    totalFiles: number;
    totalDirs: number;
    languages: Record<string, number>;
    topLevelDirs: string[];
    hasGit: boolean;
    hasPackageJson: boolean;
    hasTypescript: boolean;
}

/**
 * Project Import Service
 * Scans local directories and imports them as orchestrator projects
 */
export class ProjectImportService {
    /**
     * Scan a local directory and extract project information
     */
    static async scanProject(projectPath: string): Promise<ImportedProject> {
        if (!fs.existsSync(projectPath)) {
            throw new Error(`Path does not exist: ${projectPath}`);
        }

        const stats = await stat(projectPath);
        if (!stats.isDirectory()) {
            throw new Error(`Path is not a directory: ${projectPath}`);
        }

        // Extract project name from path
        const name = path.basename(projectPath);

        // Read package.json if exists
        let packageJson: any = null;
        const packageJsonPath = path.join(projectPath, "package.json");
        if (fs.existsSync(packageJsonPath)) {
            try {
                const content = await readFile(packageJsonPath, "utf-8");
                packageJson = JSON.parse(content);
            } catch (e) {
                console.warn("Failed to parse package.json:", e);
            }
        }

        // Read README if exists
        let readme: string | undefined;
        const readmeFiles = ["README.md", "readme.md", "README.txt", "readme.txt"];
        for (const file of readmeFiles) {
            const readmePath = path.join(projectPath, file);
            if (fs.existsSync(readmePath)) {
                try {
                    readme = await readFile(readmePath, "utf-8");
                    break;
                } catch (e) {
                    console.warn("Failed to read README:", e);
                }
            }
        }

        // Scan project structure
        const structure = await this.analyzeStructure(projectPath);

        // Detect tech stack
        const techStack = this.detectTechStack(packageJson, structure);

        // Build description
        let description = packageJson?.description || "";
        if (!description && readme) {
            // Extract first paragraph from README
            const firstParagraph = readme.split("\n\n")[0]?.replace(/^#.*\n/, "").trim();
            description = firstParagraph?.substring(0, 500) || "";
        }
        if (!description) {
            description = `Local project at ${projectPath}`;
        }

        return {
            name: packageJson?.name || name,
            description,
            path: projectPath,
            packageJson,
            readme,
            structure,
            techStack,
        };
    }

    /**
     * Analyze project directory structure
     */
    private static async analyzeStructure(projectPath: string): Promise<ProjectStructure> {
        const languages: Record<string, number> = {};
        let totalFiles = 0;
        let totalDirs = 0;
        const topLevelDirs: string[] = [];

        const IGNORE_DIRS = ["node_modules", ".git", "dist", "build", ".next", "__pycache__", "venv", ".venv"];
        const EXT_TO_LANG: Record<string, string> = {
            ".ts": "TypeScript",
            ".tsx": "TypeScript",
            ".js": "JavaScript",
            ".jsx": "JavaScript",
            ".py": "Python",
            ".go": "Go",
            ".rs": "Rust",
            ".java": "Java",
            ".cpp": "C++",
            ".c": "C",
            ".cs": "C#",
            ".rb": "Ruby",
            ".php": "PHP",
            ".swift": "Swift",
            ".kt": "Kotlin",
            ".vue": "Vue",
            ".svelte": "Svelte",
        };

        const walk = async (dir: string, depth: number = 0) => {
            const entries = await readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                if (IGNORE_DIRS.includes(entry.name)) continue;

                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory()) {
                    totalDirs++;
                    if (depth === 0) {
                        topLevelDirs.push(entry.name);
                    }
                    if (depth < 5) { // Limit recursion depth
                        await walk(fullPath, depth + 1);
                    }
                } else if (entry.isFile()) {
                    totalFiles++;
                    const ext = path.extname(entry.name).toLowerCase();
                    const lang = EXT_TO_LANG[ext];
                    if (lang) {
                        languages[lang] = (languages[lang] || 0) + 1;
                    }
                }
            }
        };

        await walk(projectPath);

        return {
            totalFiles,
            totalDirs,
            languages,
            topLevelDirs,
            hasGit: fs.existsSync(path.join(projectPath, ".git")),
            hasPackageJson: fs.existsSync(path.join(projectPath, "package.json")),
            hasTypescript: fs.existsSync(path.join(projectPath, "tsconfig.json")),
        };
    }

    /**
     * Detect technology stack from package.json and structure
     */
    private static detectTechStack(packageJson: any, structure: ProjectStructure): string[] {
        const stack: string[] = [];

        // From languages
        Object.keys(structure.languages).forEach(lang => {
            if (!stack.includes(lang)) stack.push(lang);
        });

        if (!packageJson) return stack;

        const deps = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies
        };

        // Framework detection
        if (deps["next"]) stack.push("Next.js");
        if (deps["react"]) stack.push("React");
        if (deps["vue"]) stack.push("Vue");
        if (deps["angular"]) stack.push("Angular");
        if (deps["svelte"]) stack.push("Svelte");
        if (deps["express"]) stack.push("Express");
        if (deps["fastify"]) stack.push("Fastify");
        if (deps["nestjs"] || deps["@nestjs/core"]) stack.push("NestJS");

        // Database
        if (deps["prisma"] || deps["@prisma/client"]) stack.push("Prisma");
        if (deps["drizzle-orm"]) stack.push("Drizzle");
        if (deps["mongoose"]) stack.push("MongoDB");
        if (deps["pg"] || deps["postgres"]) stack.push("PostgreSQL");
        if (deps["mysql2"]) stack.push("MySQL");
        if (deps["better-sqlite3"]) stack.push("SQLite");

        // Other
        if (deps["tailwindcss"]) stack.push("Tailwind");
        if (deps["trpc"] || deps["@trpc/server"]) stack.push("tRPC");

        return Array.from(new Set(stack));
    }

    /**
     * Import a scanned project into the orchestrator database
     */
    static async importProject(
        scannedProject: ImportedProject,
        userId: number
    ): Promise<number> {
        // Create the project (this also creates default pipelines)
        const projectId = await db.createProject({
            name: scannedProject.name,
            description: scannedProject.description,
            createdBy: userId,
            status: "active",
            localPath: scannedProject.path,
        });

        // Store project context in knowledge base
        await db.addKnowledge({
            projectId,
            key: "local_path",
            value: scannedProject.path,
            source: "import",
        });

        await db.addKnowledge({
            projectId,
            key: "tech_stack",
            value: JSON.stringify(scannedProject.techStack),
            source: "import",
        });

        await db.addKnowledge({
            projectId,
            key: "project_structure",
            value: JSON.stringify(scannedProject.structure),
            source: "import",
        });

        if (scannedProject.readme) {
            await db.addKnowledge({
                projectId,
                key: "readme",
                value: scannedProject.readme.substring(0, 10000), // Limit size
                source: "import",
            });
        }

        if (scannedProject.packageJson) {
            await db.addKnowledge({
                projectId,
                key: "package_json",
                value: JSON.stringify(scannedProject.packageJson, null, 2),
                source: "import",
            });
        }

        // Note: Pipelines (Development, Marketing, Research) are auto-created in db.createProject()

        return projectId;
    }

    /**
     * Get project context for agents
     */
    static async getProjectContext(projectId: number): Promise<string> {
        const project = await db.getProjectById(projectId);
        if (!project) throw new Error(`Project ${projectId} not found`);

        const knowledge = await db.getProjectKnowledge(projectId);

        let context = `# Project: ${project.name}\n\n`;
        context += `**Description**: ${project.description}\n\n`;

        const localPath = knowledge.find(k => k.key === "local_path");
        if (localPath) {
            context += `**Local Path**: ${localPath.value}\n\n`;
        }

        const techStack = knowledge.find(k => k.key === "tech_stack");
        if (techStack) {
            const stack = JSON.parse(techStack.value);
            context += `**Tech Stack**: ${stack.join(", ")}\n\n`;
        }

        const structure = knowledge.find(k => k.key === "project_structure");
        if (structure) {
            const s = JSON.parse(structure.value);
            context += `## Project Structure\n`;
            context += `- **Files**: ${s.totalFiles}\n`;
            context += `- **Directories**: ${s.totalDirs}\n`;
            context += `- **Top-level**: ${s.topLevelDirs.join(", ")}\n`;
            context += `- **Languages**: ${Object.entries(s.languages).map(([k, v]) => `${k}(${v})`).join(", ")}\n\n`;
        }

        const readme = knowledge.find(k => k.key === "readme");
        if (readme) {
            context += `## README\n\n${readme.value.substring(0, 3000)}\n\n`;
        }

        return context;
    }
}
