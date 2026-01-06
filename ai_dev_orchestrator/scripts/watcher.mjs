#!/usr/bin/env node

/**
 * Task Watcher Daemon
 * Monitors .tasks/output/ for completed task results and syncs back to orchestrator
 */

import { watch } from "fs";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const PROJECTS_CONFIG_PATH = process.env.PROJECTS_CONFIG || path.join(__dirname, "projects.json");
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || "5000"); // 5 seconds

console.log("[Watcher] AI Dev Orchestrator Task Watcher v1.0");
console.log("[Watcher] Monitoring .tasks/output/ folders for completed tasks");

// Store projects to watch
let projectsToWatch = [];

/**
 * Load projects configuration
 */
async function loadProjects() {
    try {
        const data = await readFile(PROJECTS_CONFIG_PATH, "utf-8");
        projectsToWatch = JSON.parse(data);
        console.log(`[Watcher] Loaded ${projectsToWatch.length} projects`);
    } catch (error) {
        console.log("[Watcher] No projects config found, will create on first project");
        projectsToWatch = [];
    }
}

/**
 * Watch a project's output folder
 */
function watchProject(project) {
    const outputPath = path.join(project.localPath, ".tasks", "output");

    console.log(`[Watcher] Watching: ${outputPath}`);

    // Watch for file changes
    const watcher = watch(
        outputPath,
        { recursive: false },
        async (eventType, filename) => {
            if (!filename || !filename.endsWith("-result.md")) return;

            console.log(`[Watcher] Detected ${eventType}: ${filename}`);

            // Extract task ID from filename
            const match = filename.match(/task-(\d+)-result\.md/);
            if (!match) return;

            const taskId = parseInt(match[1]);
            console.log(`[Watcher] Task ${taskId} completed, notifying orchestrator...`);

            // Notify orchestrator via API
            await notifyOrchestrator(taskId, project.id);
        }
    );

    watcher.on("error", (error) => {
        console.error(`[Watcher] Error watching ${outputPath}:`, error);
    });

    return watcher;
}

/**
 * Notify orchestrator of task completion
 */
async function notifyOrchestrator(taskId, projectId) {
    try {
        const response = await fetch("http://localhost:5001/trpc/tasks.completeFromIDE", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                taskId,
            }),
        });

        if (response.ok) {
            console.log(`[Watcher] ✓ Task ${taskId} marked as complete`);
        } else {
            console.error(`[Watcher] ✗ Failed to notify orchestrator for task ${taskId}`);
        }
    } catch (error) {
        console.error(`[Watcher] Error notifying orchestrator:`, error.message);
    }
}

/**
 * Main
 */
async function main() {
    await loadProjects();

    if (projectsToWatch.length === 0) {
        console.log("[Watcher] No projects configured yet");
        console.log("[Watcher] Projects will be auto-detected when added to orchestrator");
    }

    // Watch all configured projects
    const watchers = projectsToWatch
        .filter((p) => p.localPath)
        .map((p) => watchProject(p));

    console.log(`[Watcher] Monitoring ${watchers.length} projects`);
    console.log("[Watcher] Press Ctrl+C to stop");

    // Keep alive
    process.on("SIGINT", () => {
        console.log("\n[Watcher] Stopping...");
        watchers.forEach((w) => w.close());
        process.exit(0);
    });
}

main().catch((error) => {
    console.error("[Watcher] Fatal error:", error);
    process.exit(1);
});
