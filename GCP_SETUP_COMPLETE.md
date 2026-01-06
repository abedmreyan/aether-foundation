# ✅ GCP Setup Complete - Aether Foundation

## Project Information

| Item | Value |
|------|-------|
| **Project ID** | `aether-foundation` |
| **Project Name** | Aether Foundation |
| **Project Number** | `164614183268` |
| **Region** | `us-central1` |
| **Account** | amryyian@gmail.com |

---

## ✅ Completed Setup Steps

### 1. GCP Project ✅
- ✅ Project created: `aether-foundation`
- ✅ Billing enabled
- ✅ Active project set

### 2. APIs Enabled ✅
- ✅ Cloud Run API
- ✅ Cloud Build API
- ✅ Container Registry API
- ✅ Artifact Registry API
- ✅ Secret Manager API
- ✅ Firebase Realtime Database API
- ✅ Firebase API

### 3. Service Accounts Created ✅

#### GitHub Actions Service Account
- **Name**: `github-actions@aether-foundation.iam.gserviceaccount.com`
- **Roles**:
  - `roles/run.admin` - Deploy to Cloud Run
  - `roles/storage.admin` - Push Docker images
  - `roles/iam.serviceAccountUser` - Use service accounts
  - `roles/cloudbuild.builds.editor` - Trigger builds
- **Key File**: `~/gcp-github-actions-key.json` ✅

#### Firebase Admin Service Account
- **Name**: `firebase-admin@aether-foundation.iam.gserviceaccount.com`
- **Roles**:
  - `roles/firebase.admin` - Full Firebase access
- **Key File**: `~/firebase-service-account.json` ✅

### 4. Application Default Credentials ✅
- ✅ Quota project set to `aether-foundation`

---

## 🔴 Next Steps (Manual)

### Step 1: Set Up Firebase Realtime Database

**You need to do this via Firebase Console:**

1. **Go to**: https://console.firebase.google.com
2. **Click**: "Add project" or "Add Firebase to existing GCP project"
3. **Select**: `aether-foundation` from the dropdown
4. **Continue** through setup (disable Google Analytics if you want)
5. **Enable Realtime Database**:
   - Go to: Build → Realtime Database
   - Click: "Create Database"
   - Choose location: **us-central1** (must match Cloud Run region)
   - Start in **locked mode** (we'll deploy rules)

**Expected Database URL:**
```
https://aether-foundation-default-rtdb.firebaseio.com
```

### Step 2: Deploy Firebase Security Rules

After Firebase is set up, run:

```bash
cd /Users/abedmreyan/Desktop/aether_-foundation/ai_dev_orchestrator

# Install Firebase CLI if needed
npm install -g firebase-tools

# Login
firebase login

# Initialize Firebase (if not done)
firebase init database
# Select: Use existing project → aether-foundation
# Database rules file: database.rules.json

# Deploy rules
firebase deploy --only database --project aether-foundation
```

### Step 3: Configure GitHub Secrets

Go to your GitHub repository:
**Settings → Secrets and variables → Actions → New repository secret**

Add these secrets:

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `GCP_PROJECT_ID` | `aether-foundation` | - |
| `GCP_SA_KEY` | Contents of `~/gcp-github-actions-key.json` | `cat ~/gcp-github-actions-key.json` |
| `FIREBASE_PROJECT_ID` | `aether-foundation` | - |
| `FIREBASE_DATABASE_URL` | `https://aether-foundation-default-rtdb.firebaseio.com` | From Firebase Console |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Contents of `~/firebase-service-account.json` | `cat ~/firebase-service-account.json` |
| `NETLIFY_AUTH_TOKEN` | Your Netlify token | https://app.netlify.com/user/applications |
| `NETLIFY_SITE_ID` | Your Netlify site ID | After creating Netlify site |
| `VITE_API_URL` | Cloud Run URL | After first deployment |

**To get the key contents:**
```bash
# GitHub Actions key
cat ~/gcp-github-actions-key.json

# Firebase service account key
cat ~/firebase-service-account.json
```

### Step 4: First Deployment

#### Option A: Manual Deployment (Test First)

```bash
cd /Users/abedmreyan/Desktop/aether_-foundation/ai_dev_orchestrator

# Build Docker image
docker build -t gcr.io/aether-foundation/aether-backend .

# Push to Container Registry
docker push gcr.io/aether-foundation/aether-backend

# Deploy to Cloud Run
gcloud run deploy aether-backend \
  --image gcr.io/aether-foundation/aether-backend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --set-env-vars "NODE_ENV=production,FIREBASE_PROJECT_ID=aether-foundation,FIREBASE_DATABASE_URL=https://aether-foundation-default-rtdb.firebaseio.com"

# Get the deployed URL
gcloud run services describe aether-backend \
  --region us-central1 \
  --format='value(status.url)'
```

#### Option B: Automatic via GitHub Actions

1. Push code to GitHub
2. GitHub Actions will automatically:
   - Build Docker image
   - Push to Container Registry
   - Deploy to Cloud Run

### Step 5: Configure Cloud Run Secrets

After first deployment, add Firebase service account as a secret:

```bash
# Create secret from service account key
gcloud secrets create firebase-sa \
  --data-file=~/firebase-service-account.json \
  --project=aether-foundation

# Grant Cloud Run access
gcloud secrets add-iam-policy-binding firebase-sa \
  --member="serviceAccount:164614183268-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=aether-foundation

# Mount secret to Cloud Run
gcloud run services update aether-backend \
  --region us-central1 \
  --set-secrets "FIREBASE_SERVICE_ACCOUNT_KEY=firebase-sa:latest" \
  --project=aether-foundation
```

---

## 📋 Quick Reference Commands

```bash
# Set active project
gcloud config set project aether-foundation

# View Cloud Run services
gcloud run services list --project=aether-foundation

# View logs
gcloud run services logs read aether-backend --region us-central1 --project=aether-foundation

# Update environment variables
gcloud run services update aether-backend \
  --region us-central1 \
  --set-env-vars "KEY=value" \
  --project=aether-foundation

# View service details
gcloud run services describe aether-backend --region us-central1 --project=aether-foundation
```

---

## 🔍 Verification Checklist

- [ ] Firebase project created and linked to `aether-foundation`
- [ ] Realtime Database created in `us-central1`
- [ ] Firebase security rules deployed
- [ ] GitHub secrets configured
- [ ] First Cloud Run deployment successful
- [ ] Cloud Run URL obtained and added to GitHub secrets
- [ ] Health check endpoint working: `curl https://[cloud-run-url]/api/health`

---

## 📁 Key Files Created

| File | Location | Purpose |
|------|----------|---------|
| GitHub Actions Key | `~/gcp-github-actions-key.json` | CI/CD authentication |
| Firebase Service Account | `~/firebase-service-account.json` | Firebase Admin SDK |
| Dockerfile | `ai_dev_orchestrator/Dockerfile` | Container configuration |
| Cloud Build Config | `ai_dev_orchestrator/cloudbuild.yaml` | Build automation |
| GitHub Actions | `.github/workflows/deploy.yml` | CI/CD pipeline |
| Firebase Rules | `ai_dev_orchestrator/database.rules.json` | Database security |

---

## 💰 Cost Estimate

| Service | Free Tier | Expected Monthly |
|---------|-----------|------------------|
| Cloud Run | 2M requests | $0-5 |
| Cloud Build | 120 min/day | $0-5 |
| Firebase RTDB | 1GB + 10GB | $0 (within limits) |
| Container Registry | 500MB | $0-2 |
| **Total** | | **$0-12/month** |

---

## 🆘 Troubleshooting

### "Firebase project not found"
→ Ensure Firebase is added to the GCP project via Firebase Console

### "Permission denied" errors
→ Check service account roles are properly assigned

### "Billing not enabled"
→ Verify billing is enabled at https://console.cloud.google.com/billing

### Cloud Run deployment fails
→ Check logs: `gcloud run services logs read aether-backend --region us-central1`

---

## ✅ Setup Status

**GCP Infrastructure**: ✅ Complete  
**Service Accounts**: ✅ Complete  
**APIs Enabled**: ✅ Complete  
**Firebase Setup**: ⏳ Manual step required  
**GitHub Secrets**: ⏳ Manual step required  
**First Deployment**: ⏳ Pending Firebase setup  

---

**Next Action**: Set up Firebase Realtime Database via Firebase Console, then proceed with deployment! 🚀

