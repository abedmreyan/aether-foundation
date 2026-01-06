# Deployment Workflow

## Overview

Comprehensive workflow for deploying Aether applications to production environments:
- **Frontend**: Netlify (auto-deploy from GitHub)
- **Backend**: GCP Cloud Run (containerized Node.js)
- **Database**: Firebase Realtime Database

## Agents Involved

| Phase | Primary Agent | Supporting |
|-------|---------------|------------|
| Preparation | DevOps Agent | QA |
| Build | DevOps Agent | Backend/Frontend |
| Deploy | DevOps Agent | QA |
| Validation | QA Agent | DevOps |

## Prerequisites

- [ ] All tests passing
- [ ] Build succeeds locally
- [ ] GCP project created and configured
- [ ] Firebase project set up
- [ ] Netlify site connected to GitHub
- [ ] GitHub secrets configured
- [ ] Rollback plan prepared

---

## Deployment Environments

| Environment | Purpose | URLs |
|-------------|---------|------|
| Development | Local testing | localhost:5173 (frontend), localhost:3000 (backend) |
| Production | Live users | Netlify URL, Cloud Run URL |

---

## Step 1: Pre-Deployment Checks
**Agent:** DevOps Agent  
**Duration:** 30 minutes

### Checklist

```bash
# 1. Pull latest code
git checkout main
git pull origin main

# 2. Install dependencies
cd ai_dev_orchestrator
npm ci

# 3. Run build
npm run build

# 4. Type check
npm run check

# 5. Test locally (optional)
npm run dev
```

### Pre-Deployment Verification

```markdown
## Pre-Deployment Checklist

### Code
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Build successful
- [ ] Code reviewed and approved

### Environment
- [ ] GCP_PROJECT_ID secret set in GitHub
- [ ] GCP_SA_KEY secret set in GitHub
- [ ] FIREBASE_PROJECT_ID configured
- [ ] FIREBASE_DATABASE_URL configured
- [ ] Netlify secrets configured

### Dependencies
- [ ] No security vulnerabilities
- [ ] Dependencies up to date
- [ ] package-lock.json committed
```

---

## Step 2: Deploy Backend to GCP Cloud Run
**Agent:** DevOps Agent  
**Duration:** 15-30 minutes

### Option A: Automatic (GitHub Actions)

```bash
# Push to main triggers automatic deployment
git push origin main

# Monitor deployment at:
# GitHub → Actions → Deploy workflow
```

### Option B: Manual Deployment

```bash
cd ai_dev_orchestrator

# 1. Build Docker image
docker build -t gcr.io/$PROJECT_ID/aether-backend .

# 2. Push to Container Registry
docker push gcr.io/$PROJECT_ID/aether-backend

# 3. Deploy to Cloud Run
gcloud run deploy aether-backend \
  --image gcr.io/$PROJECT_ID/aether-backend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --set-env-vars "NODE_ENV=production"
```

### Configure Environment Variables

```bash
gcloud run services update aether-backend \
  --region us-central1 \
  --set-env-vars "FIREBASE_PROJECT_ID=aether-foundation" \
  --set-env-vars "FIREBASE_DATABASE_URL=https://aether-foundation-default-rtdb.firebaseio.com"

# For secrets, use Secret Manager
gcloud secrets create firebase-service-account --data-file=service-account.json

gcloud run services update aether-backend \
  --region us-central1 \
  --set-secrets "FIREBASE_SERVICE_ACCOUNT_KEY=firebase-service-account:latest"
```

---

## Step 3: Deploy Frontend to Netlify
**Agent:** DevOps Agent  
**Duration:** 10-15 minutes

### Option A: Automatic (GitHub Integration)

Netlify auto-deploys when you push to main. No manual steps needed.

### Option B: Netlify CLI

```bash
cd ai_dev_orchestrator

# Build frontend
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist/client
```

### Option C: Manual Upload

1. Build locally: `npm run build`
2. Go to Netlify Dashboard
3. Drag and drop `dist/client` folder

### Configure Netlify Environment Variables

```bash
# Set via CLI
netlify env:set VITE_API_URL https://aether-backend-xxxxx.run.app

# Or in Netlify Dashboard:
# Site settings → Environment variables
```

---

## Step 4: Post-Deployment Validation
**Agent:** QA Agent  
**Duration:** 30-60 minutes

### Health Checks

```bash
# Frontend health
curl -I https://your-site.netlify.app
# Should return 200 OK

# Backend health
curl https://aether-backend-xxxxx.run.app/api/health
# Should return {"status":"ok","timestamp":"..."}
```

### Manual Verification Checklist

```markdown
## Manual Verification

### Frontend
- [ ] Home page loads
- [ ] Login works
- [ ] Dashboard displays data
- [ ] Navigation works
- [ ] No console errors

### Backend
- [ ] API responds to health check
- [ ] Authentication works
- [ ] Database queries work

### Integrations
- [ ] Firebase connected
- [ ] Real-time updates working
```

---

## Step 5: Monitoring Setup
**Agent:** DevOps Agent  
**Duration:** 15 minutes

### View Cloud Run Logs

```bash
# Stream logs
gcloud run services logs read aether-backend --region us-central1

# Or use Cloud Console:
# GCP Console → Cloud Run → aether-backend → Logs
```

### View Netlify Logs

```bash
netlify logs
# Or check Netlify Dashboard → Deploys
```

### Firebase Monitoring

1. Go to Firebase Console
2. Navigate to Realtime Database
3. Check Usage tab for read/write operations

---

## Step 6: Rollback (if needed)
**Agent:** DevOps Agent  
**Duration:** 5-15 minutes

### Backend Rollback (Cloud Run)

```bash
# List revisions
gcloud run revisions list --service aether-backend --region us-central1

# Route traffic to previous revision
gcloud run services update-traffic aether-backend \
  --region us-central1 \
  --to-revisions REVISION_NAME=100
```

### Frontend Rollback (Netlify)

```bash
# Rollback to previous deploy
netlify rollback

# Or in Netlify Dashboard:
# Deploys → Find previous deploy → Publish deploy
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Code merged to main
- [ ] All tests passing
- [ ] Build successful
- [ ] Environment variables set
- [ ] Rollback plan ready

### Deployment
- [ ] Backend deployed to Cloud Run
- [ ] Frontend deployed to Netlify
- [ ] Environment vars configured
- [ ] CORS configured

### Post-Deployment
- [ ] Health checks pass
- [ ] Manual verification done
- [ ] Monitoring active
- [ ] Team notified

---

## GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `GCP_PROJECT_ID` | Your GCP project ID |
| `GCP_SA_KEY` | Service account JSON key |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_DATABASE_URL` | Firebase RTDB URL |
| `NETLIFY_AUTH_TOKEN` | Netlify personal access token |
| `NETLIFY_SITE_ID` | Netlify site ID |
| `VITE_API_URL` | Cloud Run backend URL |

---

## Cost Estimate

| Service | Monthly Cost |
|---------|--------------|
| Cloud Run | ~$5-15 (pay per use) |
| Firebase RTDB | Free tier / $25+ (Blaze) |
| Netlify | Free (starter tier) |
| **Total** | ~$5-40/month |

---

## Files Modified

| File | Action |
|------|--------|
| `Dockerfile` | Cloud Run container |
| `cloudbuild.yaml` | GCP Cloud Build config |
| `.github/workflows/deploy.yml` | CI/CD pipeline |
| `netlify.toml` | Netlify config |
| `firebase.json` | Firebase config |
