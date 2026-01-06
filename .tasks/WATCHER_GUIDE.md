# Task Watcher - Usage Guide

## What It Does

The task watcher monitors `.tasks/current-task.json` for new approved tasks and automatically notifies you when they're ready for execution.

---

## Starting the Watcher

### Terminal 1: Run the watcher

```bash
npm run watch-tasks
```

You'll see:
```
👀 Watching for orchestrator tasks...
📁 Monitoring: /path/to/.tasks/current-task.json
Press Ctrl+C to stop
```

### Terminal 2: Run your development server (optional)

```bash
npm run dev
```

---

## How It Works

### 1. Orchestrator Creates Task

AI Dev Orchestrator:
- Analyzes your request
- Creates implementation plan
- Writes to `.tasks/current-task.json`
- Status: `pending_approval`

**Watcher:** Silent (waiting for approval)

### 2. You Approve Task

In orchestrator dashboard:
- Review the plan
- Click "Approve"
- Status → `approved`

**Watcher:** 🔔 Notification triggered!

### 3. Notification Appears

**In terminal:**
```
==================================================================
🎯 NEW TASK READY FOR EXECUTION
==================================================================

Task ID: task-001
Title: Add priority field to student pipeline
Agent: pipeline
Priority: high
Status: ✅ approved

Summary:
Add a priority select field (High/Medium/Low) to the student pipeline

------------------------------------------------------------------
📋 Steps to Execute:
  1. Add field definition (services/platformDatabase.ts)
  2. Verify types (types/pipeline.ts)

------------------------------------------------------------------
🚀 To execute this task:

  1. Open your IDE (Cursor or Antigravity)
  2. Tell the AI:

     "Execute the current orchestrator task from .tasks/current-task.json"

==================================================================
```

**On macOS:** Desktop notification also appears with sound

### 4. Execute in IDE

Open Cursor/Antigravity and say:
```
Execute the current orchestrator task from .tasks/current-task.json
```

Or with full context:
```
@.tasks/current-task.json
@.agent/workflows/process-task.md

Execute this task
```

---

## Watcher Features

### ✅ Automatic Detection
- Monitors file changes in real-time
- No polling delays
- Immediate notifications

### ✅ Desktop Notifications (macOS)
- Sound alert when task ready
- Clickable notification
- Non-intrusive

### ✅ Task Deduplication
- Tracks task IDs
- Won't notify twice for same task
- Ignores `in_progress` and `completed` status updates

### ✅ Safe Guards
- Only notifies for `approved` status
- Never notifies for `pending_approval`
- Respects the approval gate

---

## Recommended Workflow

### Option A: Always Running (Recommended)

Keep the watcher running in a dedicated terminal:

```bash
# Terminal 1
npm run watch-tasks

# Terminal 2  
npm run dev

# Terminal 3
# For git, npm commands, etc.
```

### Option B: On-Demand

Start watcher when expecting tasks:

```bash
# When you submit a request to orchestrator
npm run watch-tasks

# Wait for approval + notification
# Execute in IDE
# Ctrl+C to stop watcher
```

---

## Stopping the Watcher

Press `Ctrl+C` in the watcher terminal:

```
^C

👋 Task watcher stopped
```

---

## Troubleshooting

### Watcher doesn't start

**Error:** `Cannot start watcher: .tasks/ directory not found`

**Solution:**
```bash
# Make sure you're in the project root
cd ~/Desktop/aether_-foundation

# Verify .tasks/ exists
ls -la .tasks/
```

---

### No notifications appearing

**Check 1:** Is watcher running?
```bash
# You should see this in terminal
👀 Watching for orchestrator tasks...
```

**Check 2:** Is task actually approved?
```bash
cat .tasks/current-task.json | grep status
# Should show: "status": "approved"
```

**Check 3:** Is it a new task?
- Watcher won't notify for tasks it's already seen
- Restart watcher to re-trigger notification

---

### Desktop notification not working

**macOS:** Terminal needs notification permissions

**Fix:**
1. System Settings → Notifications
2. Find "Terminal" or your terminal app
3. Enable "Allow Notifications"

Notifications are optional - terminal output always works

---

## Integration with Orchestrator

### Full Flow

```
You → Orchestrator Web App
      ↓
   AI analyzes
      ↓
   Creates task (pending_approval)
      ↓
   You review and approve
      ↓
   Orchestrator updates: status→approved
      ↓
   Watcher detects change 🔔
      ↓
   Notification appears
      ↓
   You execute in IDE
      ↓
   Update task: status→completed
      ↓
   Orchestrator archives task
```

---

## Tips

### 💡 Use Multiple Terminals

Recommended terminal setup:
- **Terminal 1:** `npm run watch-tasks` (always running)
- **Terminal 2:** `npm run dev` (dev server)
- **Terminal 3:** Git, npm install, etc.

### 💡 Tmux/Screen

For persistent terminals:
```bash
# Start tmux session
tmux new -s aether

# Window 1: Watcher
npm run watch-tasks

# Window 2: Dev server
# Ctrl+B then C
npm run dev

# Detach: Ctrl+B then D
# Reattach: tmux attach -t aether
```

### 💡 Background Process

Run watcher in background (advanced):
```bash
nohup npm run watch-tasks > .tasks/watcher.log 2>&1 &

# View log
tail -f .tasks/watcher.log

# Stop
pkill -f "watcher.mjs"
```

---

**Pro Tip:** Keep the watcher running all the time - it's lightweight and ensures you never miss a task!
