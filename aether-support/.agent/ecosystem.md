# Aether Ecosystem

How Aether Support integrates with the broader Aether Systems ecosystem.

---

## Ecosystem Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     AETHER SYSTEMS                               │
│                   (aethersystems.co)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐  │
│  │   AETHER FOUNDATION     │  │      AETHER SUPPORT         │  │
│  │   (CRM Platform)        │  │  (Communication Platform)   │  │
│  │   Port: 5173            │  │   Port: 3000                │  │
│  │                         │  │                             │  │
│  │  • Customer pipelines   │  │  • Embeddable widgets       │  │
│  │  • Entity management    │  │  • AI chatbots              │  │
│  │  • RBAC permissions     │  │  • Agent call center        │  │
│  │  • Analytics            │  │  • Real-time chat           │  │
│  │  • Custom fields        │  │  • VoIP calls               │  │
│  │                         │  │  • Advanced routing         │  │
│  └───────────┬─────────────┘  └──────────────┬──────────────┘  │
│              │                               │                  │
│              └───────────────┬───────────────┘                  │
│                              │                                  │
│              ┌───────────────┴───────────────┐                  │
│              │      SHARED SERVICES          │                  │
│              │  ✅ Authentication (Azure AD) │                  │
│              │  ⏳ Database (Azure PostgreSQL)│                  │
│              │  ⏳ Storage (Azure Blob)       │                  │
│              └───────────────────────────────┘                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Integration Points

### 1. ✅ Shared Authentication
**Status**: IMPLEMENTED

Both apps use the same Azure AD tenant:
- **Tenant ID**: `eb7a7dbf-26a8-4284-aade-fc8974bb0684`
- **Foundation Client**: `948c639d-b64b-47b2-a1f5-d191451ef9d5`
- **Support Client**: `42ba4600-8a12-41e7-805c-594669bbe766`

Users can authenticate to either app with the same Microsoft account.

### 2. ⏳ Customer Data Sync
**Status**: PLANNED

Planned integrations:
- CRM customer records → Support session context
- Support conversations → CRM activity timeline
- Shared contact database
- Unified customer profiles

### 3. ⏳ Cross-App Navigation
**Status**: PLANNED

Planned features:
- Deep linking between apps
- Context preservation when switching
- Unified navigation header

---

## Tech Stack Alignment

| Layer | Target Stack | Foundation | Support |
|-------|--------------|------------|---------|
| Frontend | React + TypeScript + Vite | ✅ | ✅ |
| Styling | Tailwind CSS | ✅ | ✅ |
| API | tRPC | ✅ | ✅ |
| Database | Azure PostgreSQL (Adapter) | ✅ | ✅ |
| Auth | Azure AD | ✅ | ✅ |
| Real-time | Socket.io | — | ✅ |
| Hosting | Netlify/Azure | ⏳ | ⏳ |

---

## Current Migration Status

| Component | Aether Foundation | Aether Support |
|-----------|-------------------|----------------|
| Frontend | ✅ React + Vite | ✅ React + Vite |
| Database | ✅ Azure Adapter | ✅ Azure Adapter |
| Auth | ✅ Azure AD | ✅ Azure AD |
| Real-time | — | ✅ Socket.io |
| Routing | — | ✅ Advanced AI routing |

---

## Domain Structure

| Domain | App | Port (Dev) |
|--------|-----|------------|
| `app.aethersystems.co` | Aether Foundation (CRM) | 5173 |
| `support.aethersystems.co` | Aether Support | 3000 |
| `api.aethersystems.co` | Shared API (future) | — |

