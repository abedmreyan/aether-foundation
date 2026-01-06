# Performance Optimization Workflow

## Overview

Systematic workflow for identifying, analyzing, and fixing performance issues across frontend, backend, and database layers.

## Agents Involved

| Phase | Primary Agent | Supporting |
|-------|---------------|------------|
| Analysis | QA Agent | DevOps |
| Backend | Backend Agent | Architecture |
| Frontend | Frontend Agent | Architecture |
| Database | Backend Agent | DevOps |
| Validation | QA Agent | DevOps |

## Prerequisites

- [ ] Performance issue identified
- [ ] Baseline metrics captured
- [ ] Target performance defined
- [ ] User impact assessed

---

## Step 1: Performance Profiling
**Agent:** QA Agent  
**Duration:** 1-2 hours

**Frontend Profiling:**

```bash
# Lighthouse audit
npx lighthouse https://app.example.com --output html

# Bundle analysis
npm run build
npx vite-bundle-visualizer
```

**Key Metrics:**

| Metric | Current | Target |
|--------|---------|--------|
| First Contentful Paint | 2.5s | < 1.5s |
| Time to Interactive | 4.0s | < 3.0s |
| Largest Contentful Paint | 3.5s | < 2.5s |
| Cumulative Layout Shift | 0.15 | < 0.1 |
| Bundle Size | 850KB | < 500KB |

**Backend Profiling:**

```bash
# API response times
curl -w "@curl-format.txt" -o /dev/null -s https://api.example.com/trpc/users.list

# Database query times
# Check slow query log
```

**Key Metrics:**

| Endpoint | Current | Target |
|----------|---------|--------|
| /trpc/users.list | 450ms | < 200ms |
| /trpc/tasks.getAll | 800ms | < 300ms |
| Database queries | avg 120ms | < 50ms |

---

## Step 2: Identify Bottlenecks
**Agent:** Architecture Agent  
**Duration:** 1-2 hours

**Analysis Areas:**

### Frontend Bottlenecks
```markdown
1. [ ] Large bundle size
2. [ ] Unoptimized images
3. [ ] Too many re-renders
4. [ ] Blocking scripts
5. [ ] Unused dependencies
6. [ ] No code splitting
7. [ ] Missing caching
```

### Backend Bottlenecks
```markdown
1. [ ] Slow database queries
2. [ ] N+1 query problems
3. [ ] Missing indexes
4. [ ] Synchronous operations
5. [ ] Memory leaks
6. [ ] No connection pooling
7. [ ] Large payload sizes
```

### Database Bottlenecks
```markdown
1. [ ] Missing indexes
2. [ ] Full table scans
3. [ ] Lock contention
4. [ ] Inefficient joins
5. [ ] Large result sets
```

---

## Step 3: Frontend Optimization
**Agent:** Frontend Agent  
**Duration:** 2-4 hours

### Code Splitting

```typescript
// Before: All code in one bundle
import { Dashboard } from './Dashboard';
import { Settings } from './Settings';
import { Reports } from './Reports';

// After: Lazy loading
const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));
const Reports = lazy(() => import('./Reports'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </Suspense>
  );
}
```

### Memoization

```typescript
// Before: Re-renders on every parent render
function ExpensiveList({ items, filter }) {
  const filtered = items.filter(item => item.includes(filter));
  return <List items={filtered} />;
}

// After: Memoized computation
function ExpensiveList({ items, filter }) {
  const filtered = useMemo(
    () => items.filter(item => item.includes(filter)),
    [items, filter]
  );
  return <List items={filtered} />;
}

// Memoized component
const ExpensiveList = memo(function ExpensiveList({ items }) {
  return <List items={items} />;
});
```

### Image Optimization

```tsx
// Before
<img src="/large-image.png" />

// After
<img 
  src="/optimized-image.webp" 
  loading="lazy"
  width={400}
  height={300}
  srcSet="/image-400.webp 400w, /image-800.webp 800w"
  sizes="(max-width: 600px) 400px, 800px"
/>
```

### Virtual Scrolling

```tsx
// Before: Render all items
function LargeList({ items }) {
  return (
    <div>
      {items.map(item => <Item key={item.id} {...item} />)}
    </div>
  );
}

// After: Virtual scrolling
import { FixedSizeList } from 'react-window';

function LargeList({ items }) {
  return (
    <FixedSizeList
      height={600}
      width={800}
      itemCount={items.length}
      itemSize={50}
    >
      {({ index, style }) => (
        <Item style={style} {...items[index]} />
      )}
    </FixedSizeList>
  );
}
```

---

## Step 4: Backend Optimization
**Agent:** Backend Agent  
**Duration:** 2-4 hours

### Query Optimization

```typescript
// Before: N+1 query problem
async function getTasksWithAgents() {
  const tasks = await db.select().from(tasks);
  
  // N queries for N tasks
  for (const task of tasks) {
    task.agent = await db.select().from(agents)
      .where(eq(agents.id, task.assignedAgentId));
  }
  
  return tasks;
}

// After: Single query with join
async function getTasksWithAgents() {
  return db.select({
    task: tasks,
    agent: agents,
  })
  .from(tasks)
  .leftJoin(agents, eq(tasks.assignedAgentId, agents.id));
}
```

### Pagination

```typescript
// Before: Return all results
async function getAllTasks() {
  return db.select().from(tasks);
}

// After: Paginated results
async function getTasks(page: number, limit: number = 20) {
  const offset = (page - 1) * limit;
  
  const [items, [{ count }]] = await Promise.all([
    db.select().from(tasks).limit(limit).offset(offset),
    db.select({ count: sql`count(*)` }).from(tasks),
  ]);
  
  return {
    items,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  };
}
```

### Caching

```typescript
// Simple in-memory cache
const cache = new Map<string, { data: any; expiry: number }>();

async function getCachedData(key: string, fetcher: () => Promise<any>, ttl = 60000) {
  const cached = cache.get(key);
  
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }
  
  const data = await fetcher();
  cache.set(key, { data, expiry: Date.now() + ttl });
  
  return data;
}

// Usage
const agents = await getCachedData('agents', () => db.select().from(agents));
```

### Parallel Processing

```typescript
// Before: Sequential
async function getProjectData(projectId: number) {
  const project = await getProject(projectId);
  const tasks = await getTasksByProject(projectId);
  const agents = await getAgentsByProject(projectId);
  return { project, tasks, agents };
}

// After: Parallel
async function getProjectData(projectId: number) {
  const [project, tasks, agents] = await Promise.all([
    getProject(projectId),
    getTasksByProject(projectId),
    getAgentsByProject(projectId),
  ]);
  return { project, tasks, agents };
}
```

---

## Step 5: Database Optimization
**Agent:** Backend Agent  
**Duration:** 1-2 hours

### Add Indexes

```sql
-- Identify slow queries
SELECT * FROM sys.dm_exec_query_stats 
ORDER BY total_elapsed_time DESC;

-- Add indexes for common queries
CREATE INDEX idx_tasks_project_id ON tasks(projectId);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned_agent ON tasks(assignedAgentId);

-- Composite index for common filters
CREATE INDEX idx_tasks_project_status 
ON tasks(projectId, status);
```

### Query Analysis

```sql
-- Analyze query plan
EXPLAIN ANALYZE
SELECT t.*, a.name as agentName
FROM tasks t
LEFT JOIN agents a ON t.assignedAgentId = a.id
WHERE t.projectId = 1 AND t.status = 'in_progress';

-- Look for:
-- - Full table scans
-- - Hash joins (expensive)
-- - Sort operations
```

### Connection Pooling

```typescript
// drizzle.config.ts
export default {
  // ... other config
  poolConfig: {
    min: 5,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
};
```

---

## Step 6: API Optimization
**Agent:** Backend Agent  
**Duration:** 1-2 hours

### Response Compression

```typescript
// server/_core/index.ts
import compression from 'compression';

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
}));
```

### Reduce Payload Size

```typescript
// Before: Return entire entity
getTask: protectedProcedure
  .input(z.object({ id: z.number() }))
  .query(async ({ input }) => {
    return db.select().from(tasks).where(eq(tasks.id, input.id));
  }),

// After: Return only needed fields
getTask: protectedProcedure
  .input(z.object({ id: z.number() }))
  .query(async ({ input }) => {
    return db.select({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
      progress: tasks.progressPercentage,
    })
    .from(tasks)
    .where(eq(tasks.id, input.id));
  }),
```

### HTTP Caching

```typescript
// Add cache headers for static data
app.get('/api/agents', (req, res) => {
  res.set({
    'Cache-Control': 'public, max-age=300',
    'ETag': generateEtag(agentsData),
  });
  res.json(agentsData);
});
```

---

## Step 7: Validation & Benchmarking
**Agent:** QA Agent  
**Duration:** 2-4 hours

**Performance Tests:**

```typescript
// __tests__/performance.test.ts
import { performance } from 'perf_hooks';

describe('Performance Tests', () => {
  it('getTasksByProject completes under 200ms', async () => {
    const start = performance.now();
    await getTasksByProject(1);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(200);
  });

  it('handles 1000 concurrent requests', async () => {
    const requests = Array(1000).fill(null).map(() => 
      fetch('/api/health')
    );
    
    const results = await Promise.all(requests);
    const successRate = results.filter(r => r.ok).length / results.length;
    
    expect(successRate).toBeGreaterThan(0.99);
  });
});
```

**Load Testing:**

```bash
# Using k6
k6 run load-test.js

# Using Artillery
artillery run load-test.yml
```

**Results Comparison:**

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| FCP | 2.5s | 1.2s | 52% |
| TTI | 4.0s | 2.1s | 48% |
| API Response | 450ms | 120ms | 73% |
| Bundle Size | 850KB | 380KB | 55% |

---

## Validation Checklist

### Performance
- [ ] Target metrics achieved
- [ ] No regressions in functionality
- [ ] Memory usage stable
- [ ] No new errors introduced

### Testing
- [ ] Load tests pass
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing complete

### Monitoring
- [ ] Performance monitoring added
- [ ] Alerts configured
- [ ] Baseline updated

---

## Common Optimizations

### Frontend
```
✓ Code splitting / lazy loading
✓ Image optimization
✓ Memoization (useMemo, memo)
✓ Virtual scrolling for large lists
✓ Debounce/throttle events
✓ Remove unused dependencies
```

### Backend
```
✓ Query optimization (N+1)
✓ Pagination
✓ Caching
✓ Parallel processing
✓ Response compression
✓ Connection pooling
```

### Database
```
✓ Add indexes
✓ Optimize queries
✓ Reduce data fetched
✓ Use query plans
✓ Consider read replicas
```

---

## Files Modified

| File | Action |
|------|--------|
| `vite.config.ts` | Add build optimizations |
| `client/src/App.tsx` | Add code splitting |
| `server/_core/index.ts` | Add compression |
| `server/services/*.ts` | Optimize queries |
| `drizzle/migrations/*.sql` | Add indexes |

