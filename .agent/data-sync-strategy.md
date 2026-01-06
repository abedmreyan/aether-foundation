# Data Sync Strategy

Strategy for synchronizing customer data between Aether Foundation (CRM) and Aether Support.

---

## Overview

Both Aether Foundation and Aether Support need access to shared customer information while maintaining their own app-specific data.

```
┌──────────────────┐        ┌──────────────────┐
│  Foundation CRM  │◄──────►│  Aether Support  │
│                  │  Sync  │                  │
│  • Customers     │        │  • Sessions      │
│  • Deals         │        │  • Messages      │
│  • Contacts      │        │  • Chatbots      │
│  • Activities    │        │  • Calls         │
└──────────────────┘        └──────────────────┘
         │                           │
         └───────────┬───────────────┘
                     │
         ┌───────────▼───────────┐
         │   Platform Database   │
         │                       │
         │  • Users (shared)     │
         │  • Companies          │
         │  • Customers          │
         └───────────────────────┘
```

---

## Approach: Shared Platform Database

**Recommended**: Both apps connect to the same Azure PostgreSQL database with different schemas.

### Schema Structure

```sql
-- Shared schema (both apps read/write)
platform.users          -- Unified user accounts
platform.customers      -- Shared customer records
platform.companies      -- Organization data

-- Foundation CRM schema (Foundation owns)
crm.pipelines
crm.pipeline_stages
crm.deals
crm.contacts
crm.activities
crm.custom_fields

-- Support schema (Support owns)
support.widgets
support.sessions
support.messages
support.chatbots
support.agents
support.calls
```

---

## Shared Tables

### `platform.customers`

The central customer record shared across apps:

```typescript
interface Customer {
  id: string;              // UUID
  email: string;           // Primary identifier
  name: string;
  phone?: string;
  company_id?: string;     // Link to company
  
  // Metadata
  created_at: Date;
  updated_at: Date;
  created_by_app: 'foundation' | 'support';
  
  // CRM-specific (nullable)
  crm_id?: number;         // Foundation customer ID
  account_tier?: string;
  account_manager_id?: string;
  
  // Support-specific (nullable)
  support_id?: number;     // Support customer ID
  preferred_language?: string;
  timezone?: string;
}
```

### `platform.users`

Unified user accounts (agents/admins):

```typescript
interface User {
  id: string;              // Azure AD sub (subject)
  email: string;
  name: string;
  role: 'admin' | 'user';
  
  // App-specific IDs
  foundation_user_id?: number;
  support_user_id?: number;
  
  created_at: Date;
  last_signed_in: Date;
}
```

---

## Sync Patterns

### Pattern 1: Real-Time Query (Current)

Apps query the platform database directly when they need customer info.

**Example**: Support app needs customer context
```typescript
// In Support app
async function getCustomerContext(email: string) {
  // Query shared platform.customers table
  const customer = await platformDb
    .select()
    .from('platform.customers')
    .where({ email })
    .first();
  
  if (!customer) return null;
  
  // Get CRM-specific data if needed
  if (customer.crm_id) {
    const crmData = await fetch(
      `https://app.aethersystems.co/api/customers/${customer.crm_id}`
    );
    return { ...customer, crm: await crmData.json() };
  }
  
  return customer;
}
```

**Pros**:
- Always up-to-date
- No sync lag
- Simple implementation

**Cons**:
- Requires database access from both apps
- Dependency on database availability

---

### Pattern 2: Event-Driven Sync (Future)

Apps publish events when data changes, other apps subscribe and update their cache.

**Example**: Customer updated in Foundation
```typescript
// In Foundation
async function updateCustomer(customerId: string, updates: Partial<Customer>) {
  // Update in CRM database
  await crmDb.customers.update(customerId, updates);
  
  // Publish event
  await eventBus.publish('customer.updated', {
    customerId,
    email: updates.email,
    name: updates.name,
    updatedBy: 'foundation',
    timestamp: new Date(),
  });
}

// In Support (subscriber)
eventBus.subscribe('customer.updated', async (event) => {
  // Update local cache or trigger UI refresh
  await supportDb.updateCustomerCache(event.customerId, {
    email: event.email,
    name: event.name,
  });
});
```

**Pros**:
- Decoupled apps
- Scalable
- Can add more apps easily

**Cons**:
- More complex setup
- Eventual consistency (slight delay)
- Requires message queue (Azure Service Bus)

---

## Sync Scenarios

### Scenario 1: New Customer from Support Chat

**Flow**:
1. Visitor starts chat in Support widget
2. Visitor provides email
3. Support checks if customer exists in `platform.customers`
4. If not, creates new customer record
5. Foundation CRM can now see this customer

**Implementation**:
```typescript
// In Support chat handler
async function handleNewVisitor(email: string, name: string) {
  // Check if customer exists
  let customer = await platformDb.getCustomerByEmail(email);
  
  if (!customer) {
    // Create new customer
    customer = await platformDb.createCustomer({
      email,
      name,
      created_by_app: 'support',
    });
    
    console.log(`New customer created: ${customer.id}`);
  }
  
  // Create support session
  await supportDb.createSession({
    customer_id: customer.id,
    widget_id: widgetId,
    status: 'active',
  });
  
  return customer;
}
```

---

### Scenario 2: CRM Deal Updates Support Context

**Flow**:
1. Sales rep closes deal in Foundation CRM
2. Customer tier updated to "Premium"
3. Support sees updated tier in chat context
4. Support can provide premium-level service

**Implementation**:
```typescript
// In Foundation
async function closeDeal(dealId: number) {
  const deal = await crmDb.getInlineById(dealId);
  
  // Update deal status
  await crmDb.updateDeal(dealId, { status: 'closed-won' });
  
  // Update customer tier in shared platform
  await platformDb.updateCustomer(deal.customer_id, {
    account_tier: 'premium',
  });
  
  // Create activity record
  await crmDb.createActivity({
    customer_id: deal.customer_id,
    type: 'deal_won',
    description: `Deal closed: ${deal.name}`,
  });
}

// In Support (chat UI)
async function renderCustomerInfo(customerId: string) {
  const customer = await platformDb.getCustomerById(customerId);
  
  return (
    <div>
      <h3>{customer.name}</h3>
      {customer.account_tier && (
        <Badge variant={customer.account_tier === 'premium' ? 'gold' : 'default'}>
          {customer.account_tier}
        </Badge>
      )}
    </div>
  );
}
```

---

### Scenario 3: Support Activity Appears in CRM Timeline

**Flow**:
1. Customer completes support chat
2. Support creates activity record in `crm.activities`
3. Foundation timeline shows support interaction
4. Sales rep has full customer context

**Implementation**:
```typescript
// In Support (when session ends)
async function logSupportActivity(sessionId: number) {
  const session = await supportDb.getSessionById(sessionId);
  const messages = await supportDb.getMessagesBySessionId(sessionId);
  
  // Get customer from platform
  const customer = await platformDb.getCustomerById(session.customer_id);
  
  if (customer.crm_id) {
    // Log activity in CRM schema
    await platformDb.query(`
      INSERT INTO crm.activities (
        customer_id,
        type,
        description,
        metadata,
        created_at,
        created_by_app
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      customer.crm_id,
      'support_chat',
      `Support conversation resolved`,
      JSON.stringify({
        session_id: sessionId,
        message_count: messages.length,
        duration: session.duration,
        resolved: session.status === 'ended',
      }),
      new Date(),
      'support',
    ]);
  }
}
```

---

## Migration Path

### Phase 1: Setup Shared Database ✅
- [x] Azure PostgreSQL instance
- [x] Database adapter pattern
- [ ] Create `platform` schema

### Phase 2: Migrate Customers
- [ ] Export existing customers from both apps
- [ ] Deduplicate by email
- [ ] Import into `platform.customers`
- [ ] Update apps to use platform table

### Phase 3: Implement Sync
- [ ] Real-time query in Support
- [ ] Activity logging from Support to CRM
- [ ] Customer context in Support chat

### Phase 4: Event Bus (Optional)
- [ ] Set up Azure Service Bus
- [ ] Implement event publishers
- [ ] Implement event subscribers
- [ ] Add retry logic

---

## Database Connection

### Shared Connection String

Both apps use the same PostgreSQL instance:

```bash
# .env in both Foundation and Support
PLATFORM_DB_URL=postgresql://user:pass@server.postgres.database.azure.com:5432/platform
PLATFORM_DB_SCHEMA_FOUNDATION=crm
PLATFORM_DB_SCHEMA_SUPPORT=support
```

### Access Pattern

```typescript
// Foundation
import { platformDb } from './services/platformDatabase';

// Query shared customers
const customer = await platformDb.getCustomerByEmail(email);

// Query CRM-specific data
const deals = await platformDb.query('SELECT * FROM crm.deals WHERE customer_id = $1', [customerId]);

// Support
import { platformDb } from '../../services/platformDatabase';

// Query shared customers (same code!)
const customer = await platformDb.getCustomerByEmail(email);

// Query Support-specific data
const sessions = await platformDb.query('SELECT * FROM support.sessions WHERE customer_id = $1', [customerId]);
```

---

## Security Considerations

### Row-Level Security (RLS)

PostgreSQL RLS ensures apps only access their data:

```sql
-- Foundation can read/write crm.* tables
CREATE POLICY foundation_crm_access ON crm.deals
  FOR ALL
  TO foundation_role
  USING (true);

-- Support can read/write support.* tables
CREATE POLICY support_access ON support.sessions
  FOR ALL
  TO support_role
  USING (true);

-- Both can read/write platform.customers
CREATE POLICY shared_customers ON platform.customers
  FOR ALL
  TO foundation_role, support_role
  USING (true);
```

### App-Specific Database Users

```bash
# Foundation connection
DB_USER=foundation_app
DB_ROLE=foundation_role

# Support connection
DB_USER=support_app
DB_ROLE=support_role
```

---

## Monitoring & Observability

### What to Track

1. **Sync Metrics**
   - Customer creation rate
   - Activity log volume
   - Cross-app queries per minute

2. **Data Quality**
   - Duplicate customers (same email)
   - Orphaned records
   - Missing required fields

3. **Performance**
   - Query latency
   - Database connection pool usage
   - Cache hit rate

### Tools

- **Azure Monitor**: Database performance
- **Application Insights**: App-level metrics
- **Custom Dashboard**: Sync health status

---

## Next Steps

1. **Create shared schema** in Azure PostgreSQL
2. **Migrate customer data** to `platform.customers`
3. **Update Support** to query platform database
4. **Implement activity logging** from Support to CRM
5. **Test end-to-end** sync flow
6. **Deploy to production**
