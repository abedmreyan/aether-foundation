# Infrastructure Overview

Technical overview of the Aether Foundation CRM infrastructure.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USERS                                    │
│                           │                                      │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    NETLIFY (CDN)                            ││
│  │                 aether-foundation.netlify.app               ││
│  │                      React App                              ││
│  └──────────────────────────┬──────────────────────────────────┘│
│                             │ API Calls                         │
│                             ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                  GCP CLOUD RUN                              ││
│  │              (Node.js + tRPC Backend)                       ││
│  │                Containerized Service                        ││
│  └──────────────────────────┬──────────────────────────────────┘│
│                             │ Read/Write                        │
│                             ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              FIREBASE REALTIME DATABASE                     ││
│  │                  (NoSQL JSON Store)                         ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Services

### Netlify (Frontend Hosting)
| Item | Value |
|------|-------|
| Site URL | `https://[site-name].netlify.app` |
| Build Command | `npm run build` |
| Publish Directory | `dist` or `dist/client` |
| Node Version | 20.x |
| Deploys From | GitHub (auto-deploy on push to main) |

### GCP Cloud Run (Backend)
| Item | Value |
|------|-------|
| Service URL | `https://aether-backend-[hash].run.app` |
| Region | `us-central1` |
| Runtime | Node.js 20 (containerized) |
| Scaling | 0-10 instances (auto-scale) |
| Memory | 512 MB |
| Deploys From | GitHub via Cloud Build |

### Firebase Realtime Database
| Item | Value |
|------|-------|
| Type | NoSQL JSON database |
| URL | `https://[project-id]-default-rtdb.firebaseio.com` |
| Region | us-central1 |
| Auth | Firebase Admin SDK (service account) |

### GitHub (Version Control)
| Item | Value |
|------|-------|
| Repository | `aether_-foundation` |
| Main Branch | `main` |
| CI/CD | GitHub Actions → Netlify + Cloud Run |

---

## Authentication

**Provider**: Firebase Authentication  
**Project**: `aether-foundation`

### Auth Methods
- Email/Password
- Google Sign-in
- Microsoft Sign-in (via OAuth)

### Features
- JWT tokens for API authentication
- Secure session management
- Role-based access control (RBAC)

---

## Database

### Development
**Current**: File-based storage (`LocalDBAdapter`)
- Location: `.aether-support-db.json`
- Auto-loads on server start
- JSON-based persistence

### Production
**Target**: Firebase Realtime Database
- Real-time sync capabilities
- Offline support
- Automatic scaling
- JSON-based structure (no migrations needed)

### Architecture
```
services/database/
├── adapter.ts           # Abstract interface
├── localAdapter.ts      # File storage (dev)
├── firebaseAdapter.ts   # Firebase RTDB (prod)
└── index.ts             # Auto-switching facade
```

Environment variable `USE_FIREBASE=true` switches to production database.

---

## Environment Configuration

### Development (Local)
```bash
# .env.local
VITE_USE_LOCAL_DB=true   # Uses localStorage
```

### Production (Netlify + Cloud Run)
```bash
# Netlify Environment Variables
VITE_API_URL=https://aether-backend-[hash].run.app

# Cloud Run Environment Variables
FIREBASE_PROJECT_ID=aether-foundation
FIREBASE_DATABASE_URL=https://aether-foundation-default-rtdb.firebaseio.com
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GCP_PROJECT_ID=aether-foundation
GCP_REGION=us-central1
NODE_ENV=production
PORT=8080
```

---

## Deployment Flow

### Frontend (Netlify)
```
1. Push to main branch on GitHub
2. Netlify webhook triggers build
3. npm run build executes
4. Static files deployed to CDN
5. Live at https://[site-name].netlify.app
```

### Backend (GCP Cloud Run)
```
1. Push to main branch on GitHub
2. GitHub Actions triggers workflow
3. Docker image built and pushed to GCR
4. Cloud Run service updated
5. Live at https://aether-backend-[hash].run.app
```

---

## Deployment Triggers

| Trigger | Action |
|---------|--------|
| Push to `main` | Auto-deploy frontend (Netlify) + backend (Cloud Run) |
| Pull Request | Preview deploy on Netlify |
| Manual | `gcloud run deploy` / `netlify deploy --prod` |

---

## Key Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Cloud Run container configuration |
| `cloudbuild.yaml` | GCP Cloud Build configuration |
| `.github/workflows/deploy.yml` | CI/CD pipeline |
| `netlify.toml` | Netlify configuration |
| `firebase.json` | Firebase project configuration |
| `.env.local` | Local environment vars |
| `vite.config.ts` | Vite build configuration |

---

## GCP Resources

| Resource | Name | Purpose |
|----------|------|---------|
| Cloud Run Service | `aether-backend` | Backend API |
| Firebase Project | `aether-foundation` | Database + Auth |
| Artifact Registry | `aether-containers` | Docker images |
| Cloud Build | Auto-configured | CI/CD builds |

---

## Monitoring

| What | Where |
|------|-------|
| Frontend deploys | Netlify Dashboard |
| Backend deploys | GCP Console → Cloud Run |
| Logs | GCP Console → Cloud Logging |
| Database | Firebase Console |
| Build status | GitHub Actions |
| Errors | Cloud Logging (add Sentry later) |

---

## Cost Estimate

| Service | Monthly Cost |
|---------|--------------|
| Netlify | Free (starter tier) |
| Cloud Run | ~$5-15 (pay per use) |
| Firebase RTDB | Free (Spark) / $25+ (Blaze) |
| **Total** | ~$5-40/month |

---

## Security

### Cloud Run
- HTTPS only
- IAM-based access control
- VPC connector (optional)
- Secret Manager for credentials

### Firebase
- Security rules for data access
- Service account authentication
- IP allowlisting (optional)

### Netlify
- Automatic HTTPS
- Environment variable encryption
- Build secrets isolation
