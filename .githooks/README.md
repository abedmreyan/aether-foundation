# Git Hooks

Custom git hooks for the project.

## Setup

Run this command to use the custom hooks:

```bash
git config core.hooksPath .githooks
```

## Available Hooks

### pre-commit
- Runs TypeScript type checking
- Blocks commit if type errors exist

## Adding New Hooks

1. Create file in `.githooks/` (no extension)
2. Make executable: `chmod +x .githooks/<hook-name>`
3. Available hooks: pre-commit, pre-push, commit-msg, etc.
