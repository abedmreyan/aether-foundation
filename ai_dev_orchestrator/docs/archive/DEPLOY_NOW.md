# Deploy Now - Step-by-Step Commands

## Prerequisites

Before deploying, ensure you have:
- [ ] GCP account with billing enabled
- [ ] Firebase project created
- [ ] GitHub repository created
- [ ] Netlify account
- [ ] gcloud CLI installed
- [ ] firebase CLI installed
- [ ] netlify CLI installed

---

## Step 1: Set Up GCP Project

### 1.1: Create or Select Project

```bash
# Login to GCP
gcloud auth login

# List existing projects
gcloud projects list

# Create new project (if needed)
gcloud projects create aether-foundation --name="Aether Foundation"

# Set active project
gcloud config set project aether-foundation
```

### 1.2: Enable Required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  secretmanager.googleapis.com
```

### 1.3: Create Service Account for GitHub Actions

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions"

# Grant permissions
gcloud projects add-iam-policy-binding aether-foundation \
  --member="serviceAccount:github-actions@aether-foundation.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding aether-foundation \
  --member="serviceAccount:github-actions@aether-foundation.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding aether-foundation \
  --member="serviceAccount:github-actions@aether-foundation.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Create key file
gcloud iam service-accounts keys create gcp-key.json \
  --iam-account=github-actions@aether-foundation.iam.gserviceaccount.com

# IMPORTANT: Save this key for GitHub secrets
cat gcp-key.json
```

---

## Step 2: Set Up Firebase

### 2.1: Create Firebase Project

```bash
# Login to Firebase
firebase login

# Initialize Firebase in project
cd /Users/abedmreyan/Desktop/aether_-foundation/ai_dev_orchestrator
firebase init

# Select:
# - Realtime Database
# - Use existing project: aether-foundation
```

### 2.2: Deploy Security Rules

```bash
firebase deploy --only database
```

### 2.3: Get Firebase Service Account

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save as `firebase-service-account.json`

### 2.4: Get Firebase Config

```bash
# Your Firebase Database URL
echo "https://aether-foundation-default-rtdb.firebaseio.com"
```

---

## Step 3: Push to GitHub

### 3.1: Create Repository

1. Go to https://github.com/new
2. Repository name: `aether-foundation`
3. Description: "Aether Foundation CRM with AI Dev Orchestrator"
4. Visibility: **Private** (recommended)
5. Do NOT initialize with README
6. Click "Create repository"

### 3.2: Push Code

```bash
cd /Users/abedmreyan/Desktop/aether_-foundation

# Initialize git (if not already)
git init

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/aether-foundation.git

# Add all files
git add .

# Commit
git commit -m "Initial commit: Aether Foundation with GCP/Firebase infrastructure"

# Push
git push -u origin main
```

---

## Step 4: Configure GitHub Secrets

Go to GitHub → Repository → Settings → Secrets and variables → Actions

Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `GCP_PROJECT_ID` | `aether-foundation` |
| `GCP_SA_KEY` | Contents of `gcp-key.json` |
| `FIREBASE_PROJECT_ID` | `aether-foundation` |
| `FIREBASE_DATABASE_URL` | `https://aether-foundation-default-rtdb.firebaseio.com` |
| `NETLIFY_AUTH_TOKEN` | Get from Netlify → User Settings → Applications |
| `NETLIFY_SITE_ID` | Get after creating Netlify site |
| `VITE_API_URL` | Will update after Cloud Run deploy |

---

## Step 5: Deploy Backend to Cloud Run

### Option A: Via GitHub Actions (Recommended)

```bash
# Push triggers automatic deployment
git push origin main

# Monitor at: GitHub → Actions
```

### Option B: Manual Deployment

```bash
cd /Users/abedmreyan/Desktop/aether_-foundation/ai_dev_orchestrator

# Build and push Docker image
gcloud builds submit --tag gcr.io/aether-foundation/aether-backend

# Deploy to Cloud Run
gcloud run deploy aether-backend \
  --image gcr.io/aether-foundation/aether-backend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --set-env-vars "NODE_ENV=production"
```

### 5.1: Configure Cloud Run Environment Variables

```bash
gcloud run services update aether-backend \
  --region us-central1 \
  --set-env-vars "FIREBASE_PROJECT_ID=aether-foundation" \
  --set-env-vars "FIREBASE_DATABASE_URL=https://aether-foundation-default-rtdb.firebaseio.com" \
  --set-env-vars "PORT=8080"
```

### 5.2: Add Firebase Service Account Secret

```bash
# Create secret
gcloud secrets create firebase-sa \
  --data-file=firebase-service-account.json

# Grant access to Cloud Run
gcloud secrets add-iam-policy-binding firebase-sa \
  --member="serviceAccount:$(gcloud projects describe aether-foundation --format='value(projectNumber)')-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Mount secret to Cloud Run
gcloud run services update aether-backend \
  --region us-central1 \
  --set-secrets "FIREBASE_SERVICE_ACCOUNT_KEY=firebase-sa:latest"
```

### 5.3: Get Cloud Run URL

```bash
gcloud run services describe aether-backend \
  --region us-central1 \
  --format='value(status.url)'

# Example output: https://aether-backend-xxxxx-uc.a.run.app
# Save this URL for Netlify configuration
```

---

## Step 6: Deploy Frontend to Netlify

### Option A: Netlify Dashboard

1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub
4. Select `aether-foundation` repository
5. Configure build:
   - Base directory: `ai_dev_orchestrator`
   - Build command: `npm run build`
   - Publish directory: `ai_dev_orchestrator/dist/client`
6. Add environment variable:
   - Key: `VITE_API_URL`
   - Value: Your Cloud Run URL from Step 5.3
7. Click "Deploy site"

### Option B: Netlify CLI

```bash
cd /Users/abedmreyan/Desktop/aether_-foundation/ai_dev_orchestrator

# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Create new site
netlify sites:create --name aether-orchestrator

# Set environment variable
netlify env:set VITE_API_URL https://aether-backend-xxxxx.run.app

# Build and deploy
npm run build
netlify deploy --prod --dir=dist/client
```

### 6.1: Update GitHub Secret with Netlify Site ID

After creating the Netlify site:

```bash
# Get site ID
netlify sites:list
# Find your site and copy the Site ID
```

Add `NETLIFY_SITE_ID` to GitHub Secrets.

---

## Step 7: Update GitHub Secret with Cloud Run URL

Now that you have the Cloud Run URL, update GitHub:

1. Go to GitHub → Repository → Settings → Secrets
2. Update `VITE_API_URL` with your Cloud Run URL

---

## Step 8: Verify Deployment

### Check Frontend

```bash
# Open in browser
open https://your-site.netlify.app

# Or curl
curl -I https://your-site.netlify.app
```

### Check Backend

```bash
# Health check
curl https://aether-backend-xxxxx.run.app/api/health

# Expected: {"status":"ok","timestamp":"..."}
```

### Check Firebase Connection

```bash
# View Cloud Run logs
gcloud run services logs read aether-backend --region us-central1 --limit 20
```

---

## Step 9: Configure CORS (if needed)

If you see CORS errors, update Cloud Run:

```bash
# The app should handle CORS, but if needed:
gcloud run services update aether-backend \
  --region us-central1 \
  --set-env-vars "ALLOWED_ORIGINS=https://your-site.netlify.app"
```

---

## Deployment URLs

After completing all steps, save these URLs:

```
Frontend:  https://your-site.netlify.app
Backend:   https://aether-backend-xxxxx.run.app
Firebase:  https://aether-foundation-default-rtdb.firebaseio.com
GitHub:    https://github.com/YOUR_USERNAME/aether-foundation
GCP:       https://console.cloud.google.com/run?project=aether-foundation
```

---

## Troubleshooting

### Frontend not loading
- Check Netlify build logs
- Verify `VITE_API_URL` is set correctly
- Check browser console for errors

### Backend not responding
```bash
# Check Cloud Run logs
gcloud run services logs read aether-backend --region us-central1

# Check service status
gcloud run services describe aether-backend --region us-central1
```

### Firebase connection fails
- Verify service account key is valid
- Check FIREBASE_DATABASE_URL is correct
- Verify security rules allow access

### Docker build fails
```bash
# Test locally
cd ai_dev_orchestrator
docker build -t aether-backend .
docker run -p 8080:8080 aether-backend
```

### GitHub Actions fails
- Check Actions tab for error logs
- Verify all secrets are set correctly
- Ensure GCP service account has correct permissions

---

## Cost Estimate

| Service | Monthly Cost |
|---------|--------------|
| Cloud Run | ~$5-15 (pay per use) |
| Firebase RTDB | Free (Spark) / $25 (Blaze) |
| Netlify | $0 (starter tier) |
| GCP Container Registry | ~$1 |
| **Total** | ~$6-40/month |

---

## Success!

Once all steps are complete, you have:
- ✅ Backend deployed on GCP Cloud Run
- ✅ Frontend deployed on Netlify
- ✅ Database on Firebase Realtime DB
- ✅ CI/CD via GitHub Actions
- ✅ Code on GitHub

**Your Aether Foundation platform is now live!**
