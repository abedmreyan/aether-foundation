# MCP Tool Integration Workflow

## Overview

Workflow for integrating Model Context Protocol (MCP) tools into the Aether AI Dev Orchestrator. MCP enables AI agents to interact with external services like Google Tasks, GitHub, file systems, and databases.

## Agents Involved

| Phase | Primary Agent | Supporting |
|-------|---------------|------------|
| Research | Research Agent | Architecture |
| Design | Architecture Agent | Backend |
| Implementation | Backend Agent | DevOps |
| Testing | QA Agent | Backend |

## Prerequisites

- [ ] MCP Server installed and running
- [ ] Tool requirements defined
- [ ] Authentication credentials available
- [ ] Network access configured

---

## Step 1: MCP Overview
**Agent:** Research Agent  
**Duration:** 30 minutes

**What is MCP?**

Model Context Protocol (MCP) is a standard for AI models to interact with external tools and services.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   AI Agent      │────▶│   MCP Client    │────▶│   MCP Server    │
│  (Orchestrator) │     │   (in our app)  │     │  (external)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │  External APIs  │
                                               │  - Google Tasks │
                                               │  - GitHub       │
                                               │  - File System  │
                                               └─────────────────┘
```

**Available MCP Tools:**

| Tool | Purpose | Capabilities |
|------|---------|--------------|
| Google Tasks | Task management | Create, update, delete, list tasks |
| GitHub | Repository management | Create issues, PRs, read files |
| File System | Local files | Read, write, search files |
| Perplexity | Web search | Search internet for information |
| Memory | Context storage | Store and retrieve context |

---

## Step 2: MCP Client Setup
**Agent:** Backend Agent  
**Duration:** 1-2 hours

**Create MCP Client:**

```typescript
// server/mcp/client.ts
import { Client } from '@modelcontextprotocol/client-node';
import { StdioClientTransport } from '@modelcontextprotocol/client-node';
import { spawn } from 'child_process';

interface MCPConfig {
  serverPath: string;
  serverArgs?: string[];
}

class MCPClient {
  private client: Client | null = null;
  private config: MCPConfig;

  constructor(config: MCPConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    const serverProcess = spawn(this.config.serverPath, this.config.serverArgs || [], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const transport = new StdioClientTransport({
      reader: serverProcess.stdout,
      writer: serverProcess.stdin,
    });

    this.client = new Client(
      { name: 'aether-orchestrator', version: '1.0.0' },
      { capabilities: {} }
    );

    await this.client.connect(transport);
    console.log('[MCP] Connected to server');
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
  }

  async listTools(): Promise<any[]> {
    if (!this.client) throw new Error('MCP client not connected');
    const result = await this.client.listTools();
    return result.tools;
  }

  async callTool(name: string, args: Record<string, any>): Promise<any> {
    if (!this.client) throw new Error('MCP client not connected');
    
    console.log(`[MCP] Calling tool: ${name}`, args);
    
    const result = await this.client.callTool({
      name,
      arguments: args,
    });

    console.log(`[MCP] Tool result:`, result);
    return result;
  }
}

// Singleton instance
let mcpClient: MCPClient | null = null;

export function getMCPClient(): MCPClient {
  if (!mcpClient) {
    mcpClient = new MCPClient({
      serverPath: process.env.MCP_SERVER_PATH || '/path/to/mcp-server',
      serverArgs: [],
    });
  }
  return mcpClient;
}

export async function initMCP(): Promise<void> {
  const client = getMCPClient();
  await client.connect();
}
```

---

## Step 3: Tool Wrapper Services
**Agent:** Backend Agent  
**Duration:** 2-4 hours

### Google Tasks Tool

```typescript
// server/mcp/tools/googleTasks.ts
import { getMCPClient } from '../client';

export interface GoogleTask {
  id?: string;
  title: string;
  notes?: string;
  due?: string;
  status?: 'needsAction' | 'completed';
}

export async function listTaskLists(): Promise<any[]> {
  const client = getMCPClient();
  const result = await client.callTool('google_tasks_list_tasklists', {});
  return result.content;
}

export async function listTasks(taskListId: string): Promise<GoogleTask[]> {
  const client = getMCPClient();
  const result = await client.callTool('google_tasks_list_tasks', {
    taskListId,
  });
  return result.content;
}

export async function createTask(
  taskListId: string,
  task: GoogleTask
): Promise<GoogleTask> {
  const client = getMCPClient();
  const result = await client.callTool('google_tasks_create_task', {
    taskListId,
    title: task.title,
    notes: task.notes,
    due: task.due,
  });
  return result.content;
}

export async function updateTask(
  taskListId: string,
  taskId: string,
  updates: Partial<GoogleTask>
): Promise<GoogleTask> {
  const client = getMCPClient();
  const result = await client.callTool('google_tasks_update_task', {
    taskListId,
    taskId,
    ...updates,
  });
  return result.content;
}

export async function deleteTask(
  taskListId: string,
  taskId: string
): Promise<void> {
  const client = getMCPClient();
  await client.callTool('google_tasks_delete_task', {
    taskListId,
    taskId,
  });
}
```

### GitHub Tool

```typescript
// server/mcp/tools/github.ts
import { getMCPClient } from '../client';

export interface GitHubIssue {
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
}

export async function createIssue(
  repo: string,
  issue: GitHubIssue
): Promise<any> {
  const client = getMCPClient();
  const [owner, repoName] = repo.split('/');
  
  const result = await client.callTool('github_create_issue', {
    owner,
    repo: repoName,
    title: issue.title,
    body: issue.body,
    labels: issue.labels,
    assignees: issue.assignees,
  });
  
  return result.content;
}

export async function getFile(
  repo: string,
  path: string
): Promise<string> {
  const client = getMCPClient();
  const [owner, repoName] = repo.split('/');
  
  const result = await client.callTool('github_get_file_contents', {
    owner,
    repo: repoName,
    path,
  });
  
  return result.content;
}

export async function searchCode(
  query: string,
  repo?: string
): Promise<any[]> {
  const client = getMCPClient();
  
  const result = await client.callTool('github_search_code', {
    q: repo ? `${query} repo:${repo}` : query,
  });
  
  return result.content;
}
```

### Perplexity Search Tool

```typescript
// server/mcp/tools/perplexity.ts
import { getMCPClient } from '../client';

export interface SearchResult {
  answer: string;
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
}

export async function search(query: string): Promise<SearchResult> {
  const client = getMCPClient();
  
  const result = await client.callTool('perplexity_search', {
    query,
  });
  
  return result.content;
}

export async function researchTopic(topic: string): Promise<SearchResult> {
  const client = getMCPClient();
  
  const result = await client.callTool('perplexity_search', {
    query: `Comprehensive research on: ${topic}. Include best practices, examples, and recent developments.`,
  });
  
  return result.content;
}
```

---

## Step 4: tRPC Router for MCP Tools
**Agent:** Backend Agent  
**Duration:** 1-2 hours

```typescript
// server/routers/mcpTools.ts
import { router, protectedProcedure, adminProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getMCPClient } from '../mcp/client';
import * as googleTasks from '../mcp/tools/googleTasks';
import * as github from '../mcp/tools/github';
import * as perplexity from '../mcp/tools/perplexity';

export const mcpToolsRouter = router({
  // List available tools
  listTools: protectedProcedure.query(async () => {
    const client = getMCPClient();
    return client.listTools();
  }),

  // Google Tasks
  googleTasks: router({
    listTaskLists: protectedProcedure.query(async () => {
      return googleTasks.listTaskLists();
    }),

    listTasks: protectedProcedure
      .input(z.object({ taskListId: z.string() }))
      .query(async ({ input }) => {
        return googleTasks.listTasks(input.taskListId);
      }),

    createTask: protectedProcedure
      .input(z.object({
        taskListId: z.string(),
        title: z.string(),
        notes: z.string().optional(),
        due: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { taskListId, ...task } = input;
        return googleTasks.createTask(taskListId, task);
      }),
  }),

  // GitHub
  github: router({
    createIssue: protectedProcedure
      .input(z.object({
        repo: z.string(),
        title: z.string(),
        body: z.string().optional(),
        labels: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const { repo, ...issue } = input;
        return github.createIssue(repo, issue);
      }),

    getFile: protectedProcedure
      .input(z.object({
        repo: z.string(),
        path: z.string(),
      }))
      .query(async ({ input }) => {
        return github.getFile(input.repo, input.path);
      }),
  }),

  // Perplexity
  perplexity: router({
    search: protectedProcedure
      .input(z.object({ query: z.string() }))
      .mutation(async ({ input }) => {
        return perplexity.search(input.query);
      }),

    research: protectedProcedure
      .input(z.object({ topic: z.string() }))
      .mutation(async ({ input }) => {
        return perplexity.researchTopic(input.topic);
      }),
  }),

  // Generic tool call (admin only)
  callTool: adminProcedure
    .input(z.object({
      name: z.string(),
      args: z.record(z.any()),
    }))
    .mutation(async ({ input }) => {
      const client = getMCPClient();
      return client.callTool(input.name, input.args);
    }),
});
```

---

## Step 5: Agent MCP Integration
**Agent:** Backend Agent  
**Duration:** 2-4 hours

**Agent Tool Usage:**

```typescript
// server/services/agentService.ts
import * as googleTasks from '../mcp/tools/googleTasks';
import * as github from '../mcp/tools/github';
import * as perplexity from '../mcp/tools/perplexity';

export async function executeAgentAction(
  agent: Agent,
  action: AgentAction
): Promise<ActionResult> {
  console.log(`[Agent ${agent.name}] Executing: ${action.type}`);

  switch (action.type) {
    case 'research':
      return executeResearchAction(agent, action);
    
    case 'create_github_issue':
      return executeGitHubAction(agent, action);
    
    case 'sync_task':
      return executeSyncTaskAction(agent, action);
    
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

async function executeResearchAction(
  agent: Agent,
  action: ResearchAction
): Promise<ActionResult> {
  // Log activity
  await logAgentActivity(agent.id, {
    action: 'research',
    details: { query: action.query },
    mcpToolCalled: 'perplexity_search',
  });

  // Execute search
  const result = await perplexity.search(action.query);

  return {
    success: true,
    data: result,
    tokensUsed: estimateTokens(result),
  };
}

async function executeGitHubAction(
  agent: Agent,
  action: GitHubAction
): Promise<ActionResult> {
  await logAgentActivity(agent.id, {
    action: 'create_github_issue',
    details: action.issue,
    mcpToolCalled: 'github_create_issue',
  });

  const result = await github.createIssue(action.repo, action.issue);

  return {
    success: true,
    data: result,
  };
}

async function executeSyncTaskAction(
  agent: Agent,
  action: SyncTaskAction
): Promise<ActionResult> {
  await logAgentActivity(agent.id, {
    action: 'sync_task',
    details: { taskId: action.taskId },
    mcpToolCalled: 'google_tasks_create_task',
  });

  const taskListId = process.env.GOOGLE_TASKS_LIST_ID;
  if (!taskListId) {
    return { success: false, error: 'Google Tasks not configured' };
  }

  const task = await db.select().from(tasks).where(eq(tasks.id, action.taskId));
  
  const googleTask = await googleTasks.createTask(taskListId, {
    title: task.title,
    notes: `Task ID: ${task.id}\nAssigned to: ${agent.name}\n\n${task.description}`,
  });

  return {
    success: true,
    data: { googleTaskId: googleTask.id },
  };
}
```

---

## Step 6: Error Handling & Retry
**Agent:** Backend Agent  
**Duration:** 1 hour

```typescript
// server/mcp/utils.ts
export class MCPError extends Error {
  constructor(
    message: string,
    public toolName: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    backoff?: number;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = 2 } = options;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`[MCP] Attempt ${attempt + 1} failed:`, error);
      
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, delay * Math.pow(backoff, attempt))
        );
      }
    }
  }

  throw lastError;
}

export async function safeToolCall<T>(
  toolName: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await withRetry(fn);
  } catch (error) {
    console.error(`[MCP] Tool ${toolName} failed:`, error);
    throw new MCPError(
      `MCP tool ${toolName} failed: ${(error as Error).message}`,
      toolName,
      error as Error
    );
  }
}
```

---

## Step 7: Testing MCP Integration
**Agent:** QA Agent  
**Duration:** 2-4 hours

```typescript
// __tests__/mcp/tools.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMCPClient } from '../../server/mcp/client';
import * as googleTasks from '../../server/mcp/tools/googleTasks';

// Mock MCP client
vi.mock('../../server/mcp/client', () => ({
  getMCPClient: vi.fn(() => ({
    callTool: vi.fn(),
  })),
}));

describe('MCP Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Google Tasks', () => {
    it('lists task lists', async () => {
      const mockClient = getMCPClient();
      (mockClient.callTool as any).mockResolvedValue({
        content: [
          { id: 'list1', title: 'My Tasks' },
          { id: 'list2', title: 'Work Tasks' },
        ],
      });

      const lists = await googleTasks.listTaskLists();

      expect(mockClient.callTool).toHaveBeenCalledWith(
        'google_tasks_list_tasklists',
        {}
      );
      expect(lists).toHaveLength(2);
    });

    it('creates a task', async () => {
      const mockClient = getMCPClient();
      (mockClient.callTool as any).mockResolvedValue({
        content: { id: 'task1', title: 'New Task' },
      });

      const task = await googleTasks.createTask('list1', {
        title: 'New Task',
        notes: 'Description',
      });

      expect(mockClient.callTool).toHaveBeenCalledWith(
        'google_tasks_create_task',
        {
          taskListId: 'list1',
          title: 'New Task',
          notes: 'Description',
          due: undefined,
        }
      );
      expect(task.id).toBe('task1');
    });
  });
});
```

---

## Step 8: Monitoring & Logging
**Agent:** DevOps Agent  
**Duration:** 30 minutes

```typescript
// server/mcp/logging.ts
import { db } from '../db';
import { agentActivityLogs } from '../../drizzle/schema';

export interface MCPCallLog {
  agentId?: number;
  taskId?: number;
  toolName: string;
  args: Record<string, any>;
  result?: any;
  error?: string;
  duration: number;
  timestamp: Date;
}

export async function logMCPCall(log: MCPCallLog): Promise<void> {
  console.log(`[MCP Log] ${log.toolName}`, {
    duration: `${log.duration}ms`,
    success: !log.error,
  });

  if (log.agentId) {
    await db.insert(agentActivityLogs).values({
      agentId: log.agentId,
      taskId: log.taskId,
      action: `mcp:${log.toolName}`,
      details: JSON.stringify({
        args: log.args,
        result: log.result,
        error: log.error,
      }),
      mcpToolCalled: log.toolName,
      timestamp: log.timestamp,
    });
  }
}

// Wrapper for instrumented tool calls
export async function instrumentedToolCall<T>(
  agentId: number | undefined,
  taskId: number | undefined,
  toolName: string,
  args: Record<string, any>,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  let result: T;
  let error: string | undefined;

  try {
    result = await fn();
  } catch (e) {
    error = (e as Error).message;
    throw e;
  } finally {
    await logMCPCall({
      agentId,
      taskId,
      toolName,
      args,
      result,
      error,
      duration: Date.now() - start,
      timestamp: new Date(),
    });
  }

  return result;
}
```

---

## Validation Checklist

### Connection
- [ ] MCP Server starts
- [ ] Client connects
- [ ] Tools listed
- [ ] Basic calls work

### Tools
- [ ] Google Tasks integration works
- [ ] GitHub integration works
- [ ] Perplexity search works
- [ ] File system access works

### Error Handling
- [ ] Retry logic works
- [ ] Errors logged
- [ ] Graceful degradation

### Monitoring
- [ ] Activity logged
- [ ] Performance tracked
- [ ] Alerts configured

---

## Files Created/Modified

| File | Action |
|------|--------|
| `server/mcp/client.ts` | MCP client |
| `server/mcp/tools/` | Tool wrappers |
| `server/routers/mcpTools.ts` | tRPC router |
| `server/services/agentService.ts` | Agent integration |
| `.env` | Add MCP config |

