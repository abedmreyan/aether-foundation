#!/usr/bin/env node

/**
 * Task Watcher - Monitors orchestrator and .tasks/ for task synchronization
 * 
 * Usage: node watcher.mjs
 * 
 * This script:
 * 1. Polls orchestrator API for pending tasks
 * 2. Watches .tasks/current-task.json for approved tasks
 * 3. Syncs task status back to orchestrator
 * 4. Shows notifications with IDE prompts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec, execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const TASKS_DIR = __dirname;
const CURRENT_TASK_FILE = path.join(TASKS_DIR, 'current-task.json');
const QUEUE_DIR = path.join(TASKS_DIR, 'queue');
const COMPLETED_DIR = path.join(TASKS_DIR, 'completed');
const CONFIG_FILE = path.join(TASKS_DIR, 'config.json');

let lastTaskId = null;
let config = null;

/**
 * Load configuration
 */
function loadConfig() {
    try {
        config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
        return config;
    } catch (error) {
        console.error('❌ Failed to load config:', error.message);
        return null;
    }
}

/**
 * Ensure directories exist
 */
function ensureDirectories() {
    [QUEUE_DIR, COMPLETED_DIR].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
}

/**
 * Fetch tasks from orchestrator API
 */
async function fetchPendingTasks() {
    if (!config?.orchestratorUrl) {
        return [];
    }

    try {
        const response = await fetch(
            `${config.orchestratorUrl}/api/trpc/taskExport.getPendingTasks?input=${encodeURIComponent(JSON.stringify({ projectId: 1 }))}`
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        return data?.result?.data?.json || [];
    } catch (error) {
        // Silent fail - orchestrator might be offline
        return [];
    }
}

/**
 * Update task status in orchestrator
 */
async function updateTaskStatus(taskId, status, output = null) {
    if (!config?.orchestratorUrl) {
        return false;
    }

    try {
        const response = await fetch(`${config.orchestratorUrl}/api/trpc/tasks.updateStatus`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                json: {
                    taskId: parseInt(taskId),
                    status: status,
                    progressPercentage: status === 'completed' ? 100 : undefined,
                }
            })
        });

        return response.ok;
    } catch (error) {
        console.error('❌ Failed to update orchestrator:', error.message);
        return false;
    }
}

/**
 * Read current task
 */
function readCurrentTask() {
    try {
        if (!fs.existsSync(CURRENT_TASK_FILE)) {
            return null;
        }
        const task = JSON.parse(fs.readFileSync(CURRENT_TASK_FILE, 'utf-8'));
        return task;
    } catch (error) {
        return null;
    }
}

/**
 * Generate IDE prompt for a task
 */
function generateIDEPrompt(task) {
    return `@coordinator Execute task from orchestrator

**Task:** ${task.title}

**Description:** ${task.implementation?.summary || task.description || 'Execute this task'}

**Context Files to Load:**
- @.agent/context.md
- @.agent/file-index.md
- @.agent/workflows/integration/process-orchestrator-task.md
- @.tasks/current-task.json

**Instructions:**
1. Follow the workflow guide step-by-step
2. Load relevant source files as needed
3. Execute the implementation steps
4. Verify with npm run build
5. Update task status to completed

**Task ID:** ${task.id}`;
}

/**
 * Show notification for new approved task
 */
function notifyApprovedTask(task) {
    console.log('\n' + '═'.repeat(70));
    console.log('🎯 NEW TASK READY FOR EXECUTION');
    console.log('═'.repeat(70));
    console.log(`\n📋 Task ID: ${task.id}`);
    console.log(`📝 Title: ${task.title}`);
    console.log(`🤖 Agent: ${task.agent?.role || task.assignedAgentId || 'Auto-assign'}`);
    console.log(`⚡ Priority: ${task.priority || 'normal'}`);
    console.log(`✅ Status: ${task.status}`);

    if (task.implementation?.summary) {
        console.log(`\n📖 Summary:\n${task.implementation.summary}`);
    }

    console.log('\n' + '─'.repeat(70));
    console.log('📋 Implementation Steps:');
    if (task.implementation?.steps) {
        task.implementation.steps.forEach((step, i) => {
            console.log(`  ${i + 1}. [${step.action}] ${step.file}`);
            if (step.details) {
                console.log(`     ${JSON.stringify(step.details).substring(0, 60)}...`);
            }
        });
    } else {
        console.log('  No specific steps defined - use AI to analyze');
    }

    console.log('\n' + '─'.repeat(70));
    console.log('🚀 TO EXECUTE THIS TASK:');
    console.log('');
    console.log('  Option 1: Copy IDE Prompt');
    console.log('  ─────────────────────────');
    const prompt = generateIDEPrompt(task);
    console.log('  ' + prompt.split('\n').join('\n  '));
    console.log('');
    console.log('  Option 2: Quick Command');
    console.log('  ───────────────────────');
    console.log('  Open Cursor/Antigravity and say:');
    console.log('  "Execute the orchestrator task from .tasks/current-task.json"');
    console.log('');
    console.log('═'.repeat(70) + '\n');

    // Desktop notification
    showDesktopNotification(task);
}

/**
 * Show macOS desktop notification
 */
function showDesktopNotification(task) {
    try {
        const title = '🎯 Orchestrator Task Ready';
        const message = `${task.title}`.replace(/"/g, '\\"');

        const script = `display notification "${message}" with title "${title}" sound name "Glass"`;
        execSync(`osascript -e '${script}'`, { stdio: 'ignore' });
    } catch (error) {
        // Silent fail if notifications not supported
    }
}

/**
 * Check for new approved tasks
 */
function checkForApprovedTask() {
    const task = readCurrentTask();

    if (!task) {
        return;
    }

    if (task.id === lastTaskId) {
        return;
    }

    if (task.status === 'approved') {
        lastTaskId = task.id;
        notifyApprovedTask(task);
    } else if (task.status === 'completed') {
        // Move to completed folder
        const completedFile = path.join(COMPLETED_DIR, `task-${task.id}.json`);
        fs.writeFileSync(completedFile, JSON.stringify(task, null, 2));

        // Update orchestrator
        updateTaskStatus(task.id.replace('task-', ''), 'completed');

        console.log(`✅ Task ${task.id} completed and archived`);
        lastTaskId = task.id;
    } else if (task.status === 'in_progress') {
        lastTaskId = task.id;
    }
}

/**
 * Poll orchestrator for new tasks
 */
async function pollOrchestrator() {
    const tasks = await fetchPendingTasks();

    if (tasks.length === 0) {
        return;
    }

    // Find tasks not yet in queue
    const queueFiles = fs.readdirSync(QUEUE_DIR);
    const existingIds = queueFiles.map(f => f.replace('.json', ''));

    for (const task of tasks) {
        const taskFileName = `task-${task.id}.json`;
        if (!existingIds.includes(`task-${task.id}`)) {
            // Write to queue
            const taskFile = path.join(QUEUE_DIR, taskFileName);
            fs.writeFileSync(taskFile, JSON.stringify(task, null, 2));
            console.log(`📥 New task queued: ${task.title}`);
        }
    }
}

/**
 * Watch for file changes
 */
function watchTaskFile() {
    fs.watch(TASKS_DIR, (eventType, filename) => {
        if (filename === 'current-task.json') {
            setTimeout(checkForApprovedTask, 100);
        }
    });
}

/**
 * Display status
 */
function displayStatus() {
    console.log('\n┌──────────────────────────────────────────────────────────────────────┐');
    console.log('│                    🤖 AI DEV ORCHESTRATOR WATCHER                    │');
    console.log('├──────────────────────────────────────────────────────────────────────┤');
    console.log(`│ 🌐 Orchestrator: ${config?.orchestratorUrl || 'Not configured'}`.padEnd(73) + '│');
    console.log(`│ 📁 Tasks Dir: ${TASKS_DIR}`.padEnd(73) + '│');
    console.log(`│ ⏱️  Poll Interval: ${config?.taskQueuePollingMs || 5000}ms`.padEnd(73) + '│');
    console.log('├──────────────────────────────────────────────────────────────────────┤');
    console.log('│ Watching for:                                                        │');
    console.log('│   • New approved tasks in current-task.json                          │');
    console.log('│   • Pending tasks from orchestrator API                              │');
    console.log('│   • Task completions to sync back                                    │');
    console.log('├──────────────────────────────────────────────────────────────────────┤');
    console.log('│ Press Ctrl+C to stop                                                 │');
    console.log('└──────────────────────────────────────────────────────────────────────┘\n');
}

/**
 * Main
 */
async function main() {
    config = loadConfig();

    if (!config) {
        console.error('\n❌ Cannot start watcher: config.json not found');
        console.error('Make sure .tasks/config.json exists\n');
        process.exit(1);
    }

    if (!fs.existsSync(TASKS_DIR)) {
        console.error('\n❌ Cannot start watcher: .tasks/ directory not found');
        process.exit(1);
    }

    ensureDirectories();
    displayStatus();

    // Initial checks
    checkForApprovedTask();
    await pollOrchestrator();

    // Watch for local changes
    watchTaskFile();

    // Poll orchestrator periodically
    const pollInterval = config.taskQueuePollingMs || 5000;
    setInterval(async () => {
        await pollOrchestrator();
    }, pollInterval);

    // Heartbeat log
    setInterval(() => {
        const queueCount = fs.readdirSync(QUEUE_DIR).length;
        const completedCount = fs.readdirSync(COMPLETED_DIR).length;
        console.log(`💓 Watcher active | Queue: ${queueCount} | Completed: ${completedCount} | ${new Date().toLocaleTimeString()}`);
    }, 60000);
}

// Handle interruption
process.on('SIGINT', () => {
    console.log('\n\n👋 Task watcher stopped');
    process.exit(0);
});

main();
