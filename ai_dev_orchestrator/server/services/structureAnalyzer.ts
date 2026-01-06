import * as fs from "fs/promises";
import * as path from "path";
import * as db from "../db-sqlite";
import { subsystems, modules } from "../../drizzle/schema-sqlite";

/**
 * AI Structure Analyzer Service
 * Scans codebase and identifies logical subsystems and modules
 */

export interface AnalyzedStructure {
    subsystems: {
        name: string;
        path: string;
        description: string;
        purpose: string;
        modules: {
            name: string;
            path: string;
            description: string;
            files: string[];
        }[];
    }[];
}

// Common patterns for identifying subsystems
const SUBSYSTEM_PATTERNS = [
    { pattern: /^client|^frontend|^web|^app/i, name: "Frontend", purpose: "User interface and client-side logic" },
    { pattern: /^server|^backend|^api/i, name: "Backend", purpose: "Server-side logic and API endpoints" },
    { pattern: /^shared|^common|^lib|^utils/i, name: "Shared", purpose: "Shared utilities and common code" },
    { pattern: /^db|^database|^drizzle|^prisma/i, name: "Database", purpose: "Database schema and migrations" },
    { pattern: /^scripts|^tools/i, name: "Scripts", purpose: "Build and utility scripts" },
    { pattern: /^docs|^documentation/i, name: "Documentation", purpose: "Project documentation" },
    { pattern: /^test|^tests|^__tests__/i, name: "Testing", purpose: "Test suites and testing utilities" },
    { pattern: /^config|^configs/i, name: "Configuration", purpose: "Configuration files" },
];

export class StructureAnalyzerService {
    /**
     * Analyze a project's structure and create subsystems/modules
     */
    static async analyzeProject(projectId: number): Promise<AnalyzedStructure> {
        const project = await db.getProjectById(projectId);
        if (!project || !project.localPath) {
            throw new Error("Project not found or has no local path");
        }

        console.log(`[StructureAnalyzer] Analyzing project at: ${project.localPath}`);

        // Scan top-level directories
        const structure = await this.scanDirectory(project.localPath);

        // Save to database
        await this.saveStructure(projectId, structure);

        console.log(`[StructureAnalyzer] Created ${structure.subsystems.length} subsystems`);
        return structure;
    }

    /**
     * Scan directory and identify structure
     */
    static async scanDirectory(projectPath: string): Promise<AnalyzedStructure> {
        const entries = await fs.readdir(projectPath, { withFileTypes: true });
        const subsystemList: AnalyzedStructure["subsystems"] = [];

        // Find top-level directories that could be subsystems
        const directories = entries.filter(
            (e) => e.isDirectory() && !e.name.startsWith(".") && e.name !== "node_modules"
        );

        for (const dir of directories) {
            const subsystemPath = path.join(projectPath, dir.name);
            const subsystem = await this.analyzeSubsystem(dir.name, subsystemPath);
            if (subsystem) {
                subsystemList.push(subsystem);
            }
        }

        // If no subsystems found, create a default one
        if (subsystemList.length === 0) {
            subsystemList.push({
                name: "Main",
                path: ".",
                description: "Main project codebase",
                purpose: "Core application logic",
                modules: [],
            });
        }

        return { subsystems: subsystemList };
    }

    /**
     * Analyze a potential subsystem directory
     */
    static async analyzeSubsystem(name: string, subsystemPath: string) {
        // Match against known patterns
        let purpose = "Project component";
        let formattedName = name;

        for (const pattern of SUBSYSTEM_PATTERNS) {
            if (pattern.pattern.test(name)) {
                purpose = pattern.purpose;
                formattedName = pattern.name;
                break;
            }
        }

        // Scan for modules within
        const modulesList = await this.scanForModules(subsystemPath);

        // Count files to determine if this is a real subsystem
        const fileCount = await this.countFiles(subsystemPath);
        if (fileCount < 2) {
            return null; // Skip nearly empty directories
        }

        return {
            name: formattedName,
            path: name, // Relative path
            description: `${formattedName} subsystem`,
            purpose,
            modules: modulesList,
        };
    }

    /**
     * Scan for modules within a subsystem
     */
    static async scanForModules(subsystemPath: string) {
        const entries = await fs.readdir(subsystemPath, { withFileTypes: true });
        const modulesList: AnalyzedStructure["subsystems"][0]["modules"] = [];

        // Look for src/components, src/pages, etc.
        const srcDir = entries.find((e) => e.isDirectory() && e.name === "src");
        const scanPath = srcDir ? path.join(subsystemPath, "src") : subsystemPath;

        try {
            const subEntries = await fs.readdir(scanPath, { withFileTypes: true });
            const directories = subEntries.filter(
                (e) =>
                    e.isDirectory() &&
                    !e.name.startsWith(".") &&
                    e.name !== "node_modules" &&
                    e.name !== "__pycache__"
            );

            for (const dir of directories.slice(0, 10)) {
                // Limit to 10 modules
                const modulePath = path.join(scanPath, dir.name);
                const files = await this.getModuleFiles(modulePath);

                modulesList.push({
                    name: this.formatModuleName(dir.name),
                    path: dir.name,
                    description: `${this.formatModuleName(dir.name)} module`,
                    files,
                });
            }
        } catch (e) {
            // Directory might not be readable
        }

        return modulesList;
    }

    /**
     * Get key files in a module
     */
    static async getModuleFiles(modulePath: string): Promise<string[]> {
        const files: string[] = [];
        try {
            const entries = await fs.readdir(modulePath, { withFileTypes: true });
            for (const entry of entries.slice(0, 5)) {
                // Limit to 5 key files
                if (entry.isFile() && this.isCodeFile(entry.name)) {
                    files.push(entry.name);
                }
            }
        } catch (e) {
            // Directory might not be readable
        }
        return files;
    }

    /**
     * Check if file is a code file
     */
    static isCodeFile(filename: string): boolean {
        const codeExtensions = [".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java", ".vue", ".svelte"];
        return codeExtensions.some((ext) => filename.endsWith(ext));
    }

    /**
     * Count files in directory recursively (shallow)
     */
    static async countFiles(dirPath: string): Promise<number> {
        let count = 0;
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isFile()) {
                    count++;
                } else if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
                    count += await this.countFiles(path.join(dirPath, entry.name));
                    if (count > 100) break; // Stop counting after 100
                }
            }
        } catch (e) {
            // Directory might not be readable
        }
        return count;
    }

    /**
     * Format module name nicely
     */
    static formatModuleName(name: string): string {
        return name
            .split(/[-_]/)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }

    /**
     * Save analyzed structure to database
     */
    static async saveStructure(projectId: number, structure: AnalyzedStructure): Promise<void> {
        const database = db.getDb();

        // Clear existing subsystems for this project
        await database.delete(subsystems).where(db.eq(subsystems.projectId, projectId));

        let order = 0;
        for (const sub of structure.subsystems) {
            // Create subsystem
            const [subsystemResult] = await database
                .insert(subsystems)
                .values({
                    projectId,
                    name: sub.name,
                    path: sub.path,
                    description: sub.description,
                    purpose: sub.purpose,
                    order: order++,
                })
                .returning();

            // Create modules for this subsystem
            for (const mod of sub.modules) {
                await database.insert(modules).values({
                    subsystemId: subsystemResult.id,
                    name: mod.name,
                    path: mod.path,
                    description: mod.description,
                    files: JSON.stringify(mod.files),
                });
            }
        }
    }

    /**
     * Get structure for a project
     */
    static async getProjectStructure(projectId: number) {
        const database = db.getDb();

        const projectSubsystems = await database
            .select()
            .from(subsystems)
            .where(db.eq(subsystems.projectId, projectId))
            .orderBy(db.asc(subsystems.order));

        const result = [];
        for (const sub of projectSubsystems) {
            const subModules = await database
                .select()
                .from(modules)
                .where(db.eq(modules.subsystemId, sub.id));

            result.push({
                ...sub,
                modules: subModules.map((m) => ({
                    ...m,
                    files: m.files ? JSON.parse(m.files) : [],
                })),
            });
        }

        return result;
    }
}
