# Cross-App Integration Guide

This document details how Aether Foundation (CRM) and Aether Support integrate as part of the Aether Systems ecosystem.

---

## 🔐 Authentication Integration

### Shared Azure AD Tenant

Both applications authenticate users through the same Azure AD tenant, enabling:
- **Single Identity**: Users have one account across both apps
- **Unified Login**: Same Microsoft/Google/Apple credentials
- **Role Consistency**: Roles can be synced between applications

#### Configuration

**Tenant**: `eb7a7dbf-26a8-4284-aade-fc8974bb0684`

| App | Client ID | Redirect URI (Dev) | Redirect URI (Prod) |
|-----|-----------|-------------------|---------------------|
| Foundation | `948c639d-b64b-47b2-a1f5-d191451ef9d5` | `http://localhost:5173/api/auth/callback` | `https://app.aethersystems.co/api/auth/callback` |
| Support | `42ba4600-8a12-41e7-805c-594669bbe766` | `http://localhost:3000/api/auth/callback` | `https://support.aethersystems.co/api/auth/callback` |

### Cross-App SSO (Future)

**Planned Implementation**:
```typescript
// When user is authenticated in one app, check session in other app
const checkCrossAppSession = async (userId: string) => {
  // Check for existing session token
  const foundationSession = await fetch('https://app.aethersystems.co/api/session/check');
  const supportSession = await fetch('https://support.aethersystems.co/api/session/check');
  
  return foundationSession.ok || supportSession.ok;
};
```

---

## 🗄️ Database Integration

### Current Architecture

Both apps use the adapter pattern with the same structure:

```
aether-foundation/
└── services/
    ├── platformDatabase.ts  ← Platform-level DB (users, companies)
    └── database.ts          ← Customer tenant databases

aether-support/
└── server/database/
    ├── adapter.ts           ← Abstract interface
    ├── localAdapter.ts      ← File-based (dev)
    ├── azureAdapter.ts      ← PostgreSQL (prod)
    └── index.ts             ← Auto-switching facade
```

### Shared Tables (Future)

**Platform Database** (shared across apps):
- `users` - Unified user accounts
- `companies` - Organization records
- `roles` - Permission definitions

**App-Specific Databases**:
- Foundation CRM: Customer pipelines, deals, contacts
- Support: Sessions, messages, chatbots

### Data Sync Strategy

**Option A: Shared Database** (Recommended)
- Both apps connect to same Azure PostgreSQL instance
- Different schemas: `foundation.*` and `support.*`
- Shared schema: `platform.*`

**Option B: Event-Driven Sync**
- Apps publish events (user created, customer updated)
- Azure Service Bus for message queue
- Each app subscribes to relevant events

---

## 🔗 Navigation Integration

### Deep Linking

Enable users to navigate between apps with context preservation:

#### From Foundation to Support
```typescript
// Open support chat for a specific customer
const openSupportChat = (customerId: string) => {
  const supportUrl = new URL('https://support.aethersystems.co/chat');
  supportUrl.searchParams.set('customerId', customerId);
  supportUrl.searchParams.set('source', 'foundation');
  
  window.open(supportUrl.toString(), '_blank');
};
```

#### From Support to Foundation
```typescript
// Open customer profile in CRM
const openCustomerProfile = (customerId: string) => {
  const foundationUrl = new URL('https://app.aethersystems.co/customers');
  foundationUrl.searchParams.set('id', customerId);
  foundationUrl.searchParams.set('source', 'support');
  
  window.open(foundationUrl.toString(), '_blank');
};
```

### Unified Navigation Header (Future)

**Shared Component**: `@aether/shared-nav`
```tsx
import { AetherNav } from '@aether/shared-nav';

<AetherNav
  currentApp="support"
  apps={[
    { name: 'CRM', url: 'https://app.aethersystems.co', icon: '📊' },
    { name: 'Support', url: 'https://support.aethersystems.co', icon: '💬' },
  ]}
  user={currentUser}
/>
```

---

## 📊 Customer Data Sync

### Use Case: Customer Context in Support

When a customer initiates a support chat, the Support app should have access to:
- Customer name and email (from Foundation CRM)
- Recent deals and purchase history
- Account status and tier
- Assigned account manager

**Implementation**:

```typescript
// In Support: Fetch customer context from Foundation API
const getCustomerContext = async (email: string) => {
  const response = await fetch(
    `https://app.aethersystems.co/api/customers/by-email?email=${email}`,
    {
      headers: {
        'Authorization': `Bearer ${crossAppApiToken}`,
        'X-Source-App': 'aether-support',
      },
    }
  );
  
  return await response.json();
};
```

### Use Case: Support Activity in Foundation

Support conversations should appear in the Foundation CRM activity timeline:

**Implementation**:
```typescript
// In Support: Push conversation summary to Foundation
const logSupportActivity = async (sessionId: number) => {
  const session = await db.getSessionById(sessionId);
  const messages = await db.getMessagesBySessionId(sessionId);
  
  await fetch('https://app.aethersystems.co/api/activities', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${crossAppApiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'support_chat',
      customerId: session.customerId,
      summary: generateSummary(messages),
      timestamp: session.startedAt,
      metadata: {
        sessionId,
        duration: session.duration,
        resolved: session.status === 'ended',
      },
    }),
  });
};
```

---

## 🔑 API Authentication

### Cross-App API Tokens

For apps to communicate securely:

1. **Service Account**: Create a dedicated Azure AD service principal
2. **OAuth Client Credentials Flow**: Apps request tokens
3. **Scoped Permissions**: Limit what each app can access

**Example**:
```typescript
// Foundation exposes API for Support to query customer data
app.get('/api/customers/by-email', async (req, res) => {
  // Verify token is from Support app
  const token = req.headers.authorization?.split(' ')[1];
  const claims = await verifyAzureAdToken(token);
  
  if (claims.appId !== SUPPORT_APP_CLIENT_ID) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // Return customer data
  const customer = await db.getCustomerByEmail(req.query.email);
  res.json(customer);
});
```

---

## 🚀 Deployment Strategy

### Domain Configuration

| Environment | Foundation URL | Support URL |
|-------------|----------------|-------------|
| Development | `http://localhost:5173` | `http://localhost:3000` |
| Staging | `https://staging-app.aethersystems.co` | `https://staging-support.aethersystems.co` |
| Production | `https://app.aethersystems.co` | `https://support.aethersystems.co` |

### CORS Configuration

Both apps must allow cross-origin requests from each other:

```typescript
// Foundation
const allowedOrigins = [
  'https://support.aethersystems.co',
  'http://localhost:3000', // Dev
];

// Support
const allowedOrigins = [
  'https://app.aethersystems.co',
  'http://localhost:5173', // Dev
];
```

---

## 📝 Development Workflow

### Running Both Apps Locally

```bash
# Terminal 1: Foundation (CRM)
cd /Users/abedmreyan/Desktop/aether_-foundation
npm run dev  # → http://localhost:5173

# Terminal 2: Support
cd /Users/abedmreyan/Desktop/aether_-foundation/aether-support
npm run dev  # → http://localhost:3000
```

### Testing Cross-App Features

1. **Login**: Authenticate in Foundation first
2. **Verify Session**: Check that session persists
3. **Navigate**: Test deep links between apps
4. **Data Sync**: Verify customer data flows correctly

---

## 🎯 Implementation Roadmap

### Phase 1: Foundation ✅
- [x] Shared Azure AD tenant
- [x] Consistent port configuration
- [x] Database adapter pattern

### Phase 2: API Integration 🔄
- [ ] Create shared API types package
- [ ] Implement cross-app API endpoints
- [ ] Add service account authentication

### Phase 3: Data Sync 🔄
- [ ] Define shared data models
- [ ] Implement customer data sync
- [ ] Add support activity logging

### Phase 4: Navigation 🔄
- [ ] Create shared navigation component
- [ ] Implement deep linking
- [ ] Add context preservation

### Phase 5: Production 🔄
- [ ] Deploy to Azure/Netlify
- [ ] Configure custom domains
- [ ] Set up monitoring and logging
