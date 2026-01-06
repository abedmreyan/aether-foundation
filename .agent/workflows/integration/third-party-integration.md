# Third-Party Integration Workflow

## Overview

Workflow for integrating external services, APIs, and tools into the Aether platform. Covers API integration, OAuth setup, webhook handling, and MCP tool connections.

## Agents Involved

| Phase | Primary Agent | Supporting |
|-------|---------------|------------|
| Research | Research Agent | Architecture |
| Design | Architecture Agent | Backend |
| Implementation | Backend Agent | Frontend |
| Testing | QA Agent | Backend |
| Deployment | DevOps Agent | Backend |

## Prerequisites

- [ ] Integration requirements defined
- [ ] API documentation available
- [ ] Authentication method known
- [ ] Rate limits understood
- [ ] Sandbox/test environment available

---

## Step 1: Integration Research
**Agent:** Research Agent  
**Duration:** 1-2 hours

**Research Checklist:**

```markdown
## Integration Research: [Service Name]

### API Documentation
- [ ] Base URL: `https://api.service.com/v1`
- [ ] Authentication: OAuth 2.0 / API Key / JWT
- [ ] Rate limits: 100 req/min
- [ ] Documentation URL: [link]

### Endpoints Needed
| Endpoint | Method | Purpose |
|----------|--------|---------|
| /users | GET | List users |
| /users/{id} | GET | Get user details |
| /webhooks | POST | Register webhook |

### Authentication Flow
```
1. Redirect user to OAuth URL
2. User authorizes
3. Receive callback with code
4. Exchange code for access token
5. Store refresh token
6. Use access token for API calls
```

### SDK/Libraries Available
- [ ] Official SDK: `npm install @service/sdk`
- [ ] Type definitions: `@types/service`
- [ ] Community libraries: [list]

### Considerations
- Rate limiting strategy
- Error handling
- Token refresh logic
- Webhook security
```

---

## Step 2: Integration Architecture
**Agent:** Architecture Agent  
**Duration:** 1-2 hours

**Design Integration Layer:**

```typescript
// Design document

// Integration module structure
integrations/
├── [service]/
│   ├── index.ts          # Public exports
│   ├── client.ts         # API client
│   ├── auth.ts           # OAuth handling
│   ├── webhooks.ts       # Webhook handlers
│   ├── types.ts          # Type definitions
│   └── config.ts         # Configuration

// Interface design
interface ServiceClient {
  authenticate(): Promise<void>;
  refreshToken(): Promise<void>;
  
  // Domain methods
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User>;
  
  // Webhook handling
  registerWebhook(url: string): Promise<void>;
  handleWebhook(payload: unknown): Promise<void>;
}
```

---

## Step 3: Environment Configuration
**Agent:** DevOps Agent  
**Duration:** 30 minutes

**Add Environment Variables:**

```bash
# .env
SERVICE_API_KEY=xxx
SERVICE_CLIENT_ID=xxx
SERVICE_CLIENT_SECRET=xxx
SERVICE_WEBHOOK_SECRET=xxx
SERVICE_API_BASE_URL=https://api.service.com/v1
SERVICE_OAUTH_REDIRECT_URI=https://app.example.com/auth/callback/service
```

**Create Config Module:**

```typescript
// integrations/[service]/config.ts
import { z } from 'zod';

const configSchema = z.object({
  apiKey: z.string().min(1),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  webhookSecret: z.string().min(1),
  baseUrl: z.string().url(),
  redirectUri: z.string().url(),
});

export type ServiceConfig = z.infer<typeof configSchema>;

export function getConfig(): ServiceConfig {
  const config = {
    apiKey: process.env.SERVICE_API_KEY,
    clientId: process.env.SERVICE_CLIENT_ID,
    clientSecret: process.env.SERVICE_CLIENT_SECRET,
    webhookSecret: process.env.SERVICE_WEBHOOK_SECRET,
    baseUrl: process.env.SERVICE_API_BASE_URL,
    redirectUri: process.env.SERVICE_OAUTH_REDIRECT_URI,
  };

  return configSchema.parse(config);
}
```

---

## Step 4: API Client Implementation
**Agent:** Backend Agent  
**Duration:** 2-4 hours

**Create API Client:**

```typescript
// integrations/[service]/client.ts
import { getConfig } from './config';
import type { ServiceConfig } from './config';

export class ServiceClient {
  private config: ServiceConfig;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.config = getConfig();
  }

  // Base request method with error handling
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        await this.refreshAccessToken();
        return this.request(endpoint, options);
      }
      
      const error = await response.json();
      throw new ServiceError(error.message, response.status);
    }

    return response.json();
  }

  // Authentication
  async authenticate(code: string): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
      }),
    });

    const data = await response.json();
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.config.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    });

    const data = await response.json();
    this.accessToken = data.access_token;
    if (data.refresh_token) {
      this.refreshToken = data.refresh_token;
    }
  }

  // API Methods
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async getUser(id: string): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  async createUser(data: CreateUserData): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Singleton instance
let clientInstance: ServiceClient | null = null;

export function getServiceClient(): ServiceClient {
  if (!clientInstance) {
    clientInstance = new ServiceClient();
  }
  return clientInstance;
}
```

---

## Step 5: Webhook Handler
**Agent:** Backend Agent  
**Duration:** 1-2 hours

**Implement Webhook Handling:**

```typescript
// integrations/[service]/webhooks.ts
import crypto from 'crypto';
import { getConfig } from './config';

export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const config = getConfig();
  const expectedSignature = crypto
    .createHmac('sha256', config.webhookSecret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export type WebhookEvent = 
  | { type: 'user.created'; data: User }
  | { type: 'user.updated'; data: User }
  | { type: 'user.deleted'; data: { id: string } };

export async function handleWebhook(event: WebhookEvent): Promise<void> {
  console.log(`[Webhook] Received: ${event.type}`);

  switch (event.type) {
    case 'user.created':
      await handleUserCreated(event.data);
      break;
    case 'user.updated':
      await handleUserUpdated(event.data);
      break;
    case 'user.deleted':
      await handleUserDeleted(event.data.id);
      break;
    default:
      console.warn(`[Webhook] Unknown event type: ${(event as any).type}`);
  }
}

async function handleUserCreated(user: User): Promise<void> {
  // Sync user to local database
  await db.insert(users).values({
    externalId: user.id,
    email: user.email,
    name: user.name,
    source: 'service',
  });
}

async function handleUserUpdated(user: User): Promise<void> {
  await db.update(users)
    .set({ email: user.email, name: user.name })
    .where(eq(users.externalId, user.id));
}

async function handleUserDeleted(userId: string): Promise<void> {
  await db.delete(users).where(eq(users.externalId, userId));
}
```

**Create Webhook Route:**

```typescript
// server/routers/webhooks.ts
import { router, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import { verifyWebhookSignature, handleWebhook } from '../integrations/service/webhooks';

export const webhooksRouter = router({
  serviceWebhook: publicProcedure
    .input(z.object({
      payload: z.string(),
      signature: z.string(),
    }))
    .mutation(async ({ input }) => {
      if (!verifyWebhookSignature(input.payload, input.signature)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid webhook signature',
        });
      }

      const event = JSON.parse(input.payload);
      await handleWebhook(event);

      return { received: true };
    }),
});
```

---

## Step 6: OAuth Flow (if needed)
**Agent:** Backend Agent  
**Duration:** 1-2 hours

**OAuth Routes:**

```typescript
// server/routers/oauth.ts
import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getServiceClient } from '../integrations/service/client';
import { getConfig } from '../integrations/service/config';

export const oauthRouter = router({
  // Get OAuth URL for user to authorize
  getAuthUrl: protectedProcedure
    .input(z.object({ service: z.enum(['service']) }))
    .query(({ input }) => {
      const config = getConfig();
      
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: 'code',
        scope: 'read write',
      });

      return {
        url: `${config.baseUrl}/oauth/authorize?${params}`,
      };
    }),

  // Handle OAuth callback
  callback: publicProcedure
    .input(z.object({
      code: z.string(),
      state: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const client = getServiceClient();
      await client.authenticate(input.code);

      // Store tokens in database
      await db.update(users)
        .set({
          serviceAccessToken: client.accessToken,
          serviceRefreshToken: client.refreshToken,
        })
        .where(eq(users.id, ctx.userId));

      return { success: true };
    }),
});
```

---

## Step 7: Frontend Integration
**Agent:** Frontend Agent  
**Duration:** 1-2 hours

**OAuth Connect Button:**

```tsx
// client/src/components/integrations/ServiceConnect.tsx
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui';

export function ServiceConnect() {
  const { data: authUrl } = trpc.oauth.getAuthUrl.useQuery({
    service: 'service',
  });

  const { data: status } = trpc.integrations.status.useQuery({
    service: 'service',
  });

  const disconnect = trpc.integrations.disconnect.useMutation();

  if (status?.connected) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-green-600">✓ Connected</span>
        <Button 
          variant="ghost" 
          onClick={() => disconnect.mutate({ service: 'service' })}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={() => window.location.href = authUrl?.url}
    >
      Connect to Service
    </Button>
  );
}
```

---

## Step 8: Error Handling
**Agent:** Backend Agent  
**Duration:** 30-60 minutes

**Create Error Types:**

```typescript
// integrations/[service]/errors.ts
export class ServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ServiceError';
  }

  static isRateLimited(error: unknown): boolean {
    return error instanceof ServiceError && error.statusCode === 429;
  }

  static isUnauthorized(error: unknown): boolean {
    return error instanceof ServiceError && error.statusCode === 401;
  }
}

// Retry logic
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (ServiceError.isRateLimited(error)) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      
      throw error;
    }
  }

  throw lastError;
}
```

---

## Step 9: Testing
**Agent:** QA Agent  
**Duration:** 2-4 hours

**Integration Tests:**

```typescript
// __tests__/integrations/service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ServiceClient } from '../service/client';

describe('ServiceClient', () => {
  let client: ServiceClient;

  beforeEach(() => {
    client = new ServiceClient();
    vi.resetAllMocks();
  });

  describe('authentication', () => {
    it('exchanges code for tokens', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'access-123',
          refresh_token: 'refresh-456',
        }),
      } as Response);

      await client.authenticate('auth-code');
      
      expect(client['accessToken']).toBe('access-123');
    });
  });

  describe('API calls', () => {
    it('fetches users list', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { id: '1', name: 'User 1' },
          { id: '2', name: 'User 2' },
        ]),
      } as Response);

      const users = await client.getUsers();
      
      expect(users).toHaveLength(2);
    });

    it('refreshes token on 401', async () => {
      // First call returns 401
      vi.spyOn(global, 'fetch')
        .mockResolvedValueOnce({ ok: false, status: 401 } as Response)
        // Token refresh
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: 'new-token' }),
        } as Response)
        // Retry original call
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ id: '1' }]),
        } as Response);

      client['refreshToken'] = 'refresh-456';
      const users = await client.getUsers();
      
      expect(users).toHaveLength(1);
    });
  });

  describe('webhooks', () => {
    it('verifies valid signature', () => {
      const payload = JSON.stringify({ type: 'user.created' });
      const signature = crypto
        .createHmac('sha256', 'webhook-secret')
        .update(payload)
        .digest('hex');

      expect(verifyWebhookSignature(payload, signature)).toBe(true);
    });

    it('rejects invalid signature', () => {
      expect(verifyWebhookSignature('payload', 'invalid')).toBe(false);
    });
  });
});
```

---

## Step 10: Documentation
**Agent:** Backend Agent  
**Duration:** 30 minutes

**Integration Documentation:**

```markdown
# [Service] Integration

## Setup

1. Create account at [service.com]
2. Create OAuth application
3. Add environment variables:
   ```
   SERVICE_CLIENT_ID=xxx
   SERVICE_CLIENT_SECRET=xxx
   SERVICE_WEBHOOK_SECRET=xxx
   ```

## Configuration

| Variable | Description |
|----------|-------------|
| SERVICE_CLIENT_ID | OAuth client ID |
| SERVICE_CLIENT_SECRET | OAuth client secret |
| SERVICE_WEBHOOK_SECRET | Webhook signature secret |
| SERVICE_API_BASE_URL | API base URL |

## Usage

### Connect User
```typescript
import { getServiceClient } from './integrations/service';

const client = getServiceClient();
await client.authenticate(code);
```

### Make API Calls
```typescript
const users = await client.getUsers();
const user = await client.getUser('123');
```

### Webhooks
Configure webhook URL: `https://api.example.com/webhooks/service`

Supported events:
- `user.created`
- `user.updated`
- `user.deleted`

## Troubleshooting

### 401 Unauthorized
- Check if tokens are expired
- Verify client credentials

### Rate Limited (429)
- Built-in retry with exponential backoff
- Check rate limit headers
```

---

## Validation Checklist

### Integration
- [ ] API client works
- [ ] Authentication flows
- [ ] Token refresh works
- [ ] Webhooks verified
- [ ] Error handling robust

### Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing complete
- [ ] Edge cases covered

### Security
- [ ] Secrets in env vars
- [ ] Webhook signatures verified
- [ ] Tokens stored securely
- [ ] HTTPS only

---

## Files Created/Modified

| File | Action |
|------|--------|
| `integrations/[service]/` | Create directory |
| `integrations/[service]/client.ts` | API client |
| `integrations/[service]/auth.ts` | OAuth logic |
| `integrations/[service]/webhooks.ts` | Webhook handlers |
| `integrations/[service]/types.ts` | Type definitions |
| `server/routers/webhooks.ts` | Webhook routes |
| `server/routers/oauth.ts` | OAuth routes |
| `.env` | Add secrets |

