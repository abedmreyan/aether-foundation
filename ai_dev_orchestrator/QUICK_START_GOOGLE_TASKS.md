# Quick Start: Google Tasks Integration

## 3-Step Setup

### Step 1: Run Setup Script
```bash
cd /Users/abedmreyan/Desktop/aether_-foundation/ai_dev_orchestrator
npm run setup:google-tasks
```

Select your Google Tasks list when prompted.

### Step 2: Start Orchestrator
```bash
npm run dev
```

Watch for:
```
✅ Google Tasks sync service started
```

### Step 3: Test Integration
```bash
npm run test:google-tasks
```

All tests should pass ✅

---

## What Happens Now?

- Tasks sync automatically every 15 minutes
- Each task includes agent information in notes
- Manual sync available via API: `trpc.googleTasks.syncNow.mutate()`

---

## View Tasks in Google

1. Go to https://tasks.google.com
2. Select your configured task list
3. Tasks from orchestrator will appear with full agent details

---

## Next: Phase 4

See `PHASE2_COMPLETE.md` for:
1. Deploy Azure SQL schema
2. Verify agent-task mapping
3. Production configuration

---

**Need Help?**
- Full docs: `GOOGLE_TASKS_INTEGRATION.md`
- Implementation details: `PHASE3_IMPLEMENTATION_SUMMARY.md`

