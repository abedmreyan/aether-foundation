# Aether Foundation - GCP Setup Guide

## Current Status

✅ **GCP Account**: Active (amryyian@gmail.com)  
✅ **Existing Project**: "Aether" (gen-lang-client-0165045538)  
⚠️ **Billing**: Not enabled (required for Cloud Run, Cloud Build, etc.)

---

## Step 1: Enable Billing (Required)

1. **Go to**: https://console.cloud.google.com/billing
2. **Select Project**: gen-lang-client-0165045538 (Aether)
3. **Link a billing account**:
   - If you have one: Select it and link to project
   - If not: Click "Create billing account" and add payment method

**Note**: GCP Free Tier includes:
- Cloud Run: 2 million requests/month free
- Cloud Build: 120 build-minutes/day free
- Firebase RTDB: 1GB storage, 10GB/month transfer free

---

## Step 2: Enable Required APIs

Once billing is enabled, run this command:

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  firebasedatabase.googleapis.com \
  firebase.googleapis.com \
  --project=gen-lang-client-0165045538
```

---

## Step 3: Set Up Firebase

### Option A: Via Web Console (Recommended)

1. **Go to**: https://console.firebase.google.com
2. **Click**: "Add project"
3. **Select**: "gen-lang-client-0165045538 (Aether)" from dropdown
4. **Continue** through the setup wizard
5. **Enable Realtime Database**:
   - Go to Build → Realtime Database
   - Click "Create Database"
   - Choose location: **us-central1**
   - Start in **locked mode** (we'll deploy rules later)

### Option B: Via CLI

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Add Firebase to existing GCP project
firebase projects:addfirebase gen-lang-client-0165045538

# Initialize Firebase in your project
cd /Users/abedmreyan/Desktop/aether_-foundation/ai_dev_orchestrator
firebase init database
# Select: Use existing project → gen-lang-client-0165045538
# Database rules file: database.rules.json (already created)
```

---

## Step 4: Create Service Account for GitHub Actions

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions" \
  --project=gen-lang-client-0165045538

# Grant necessary roles
gcloud projects add-iam-policy-binding gen-lang-client-0165045538 \
  --member="serviceAccount:github-actions@gen-lang-client-0165045538.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding gen-lang-client-0165045538 \
  --member="serviceAccount:github-actions@gen-lang-client-0165045538.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding gen-lang-client-0165045538 \
  --member="serviceAccount:github-actions@gen-lang-client-0165045538.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding gen-lang-client-0165045538 \
  --member="serviceAccount:github-actions@gen-lang-client-0165045538.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.editor"

# Create and download key
gcloud iam service-accounts keys create ~/gcp-github-actions-key.json \
  --iam-account=github-actions@gen-lang-client-0165045538.iam.gserviceaccount.com

echo "✅ Service account key saved to: ~/gcp-github-actions-key.json"
echo "⚠️  Keep this file secure - you'll need it for GitHub secrets"
```

---

## Step 5: Create Firebase Service Account

```bash
# Go to Firebase Console
open https://console.firebase.google.com/project/gen-lang-client-0165045538/settings/serviceaccounts/adminsdk

# Click "Generate new private key"
# Save as: ~/firebase-service-account.json
```

**Or via gcloud:**

```bash
gcloud iam service-accounts create firebase-admin \
  --display-name="Firebase Admin SDK" \
  --project=gen-lang-client-0165045538

gcloud projects add-iam-policy-binding gen-lang-client-0165045538 \
  --member="serviceAccount:firebase-admin@gen-lang-client-0165045538.iam.gserviceaccount.com" \
  --role="roles/firebase.admin"

gcloud iam service-accounts keys create ~/firebase-service-account.json \
  --iam-account=firebase-admin@gen-lang-client-0165045538.iam.gserviceaccount.com
```

---

## Step 6: Configure GitHub Secrets

Go to your GitHub repository: https://github.com/YOUR_USERNAME/aether-foundation

**Settings → Secrets and variables → Actions → New repository secret**

Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `GCP_PROJECT_ID` | `gen-lang-client-0165045538` |
| `GCP_SA_KEY` | Contents of `~/gcp-github-actions-key.json` |
| `FIREBASE_PROJECT_ID` | `gen-lang-client-0165045538` |
| `FIREBASE_DATABASE_URL` | `https://gen-lang-client-0165045538-default-rtdb.firebaseio.com` |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Contents of `~/firebase-service-account.json` |
| `NETLIFY_AUTH_TOKEN` | Get from https://app.netlify.com/user/applications |
| `NETLIFY_SITE_ID` | Your Netlify site ID |
| `VITE_API_URL` | Will be set after first Cloud Run deploy |

---

## Step 7: Deploy Firebase Security Rules

```bash
cd /Users/abedmreyan/Desktop/aether_-foundation/ai_dev_orchestrator

# Deploy rules
firebase deploy --only database --project gen-lang-client-0165045538
```

---

## Step 8: First Deployment

### Deploy Backend to Cloud Run

```bash
cd /Users/abedmreyan/Desktop/aether_-foundation/ai_dev_orchestrator

# Build and submit to Cloud Build
gcloud builds submit --tag gcr.io/gen-lang-client-0165045538/aether-backend

# Deploy to Cloud Run
gcloud run deploy aether-backend \
  --image gcr.io/gen-lang-client-0165045538/aether-backend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --set-env-vars "NODE_ENV=production,FIREBASE_PROJECT_ID=gen-lang-client-0165045538,FIREBASE_DATABASE_URL=https://gen-lang-client-0165045538-default-rtdb.firebaseio.com"

# Get the deployed URL
gcloud run services describe aether-backend \
  --region us-central1 \
  --format='value(status.url)'
```

### Update GitHub Secret with Cloud Run URL

Update `VITE_API_URL` in GitHub secrets with the Cloud Run URL from above.

---

## Step 9: Verify Setup

```bash
# Check enabled services
gcloud services list --enabled --project=gen-lang-client-0165045538

# Check IAM service accounts
gcloud iam service-accounts list --project=gen-lang-client-0165045538

# Test Cloud Run deployment
curl $(gcloud run services describe aether-backend --region us-central1 --format='value(status.url)')/api/health
```

---

## Quick Commands Reference

```bash
# Set active project
gcloud config set project gen-lang-client-0165045538

# View project info
gcloud projects describe gen-lang-client-0165045538

# View Cloud Run services
gcloud run services list --project=gen-lang-client-0165045538

# View logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50 --project=gen-lang-client-0165045538

# Firebase database operations
firebase database:get / --project gen-lang-client-0165045538
firebase database:set /test '{"hello":"world"}' --project gen-lang-client-0165045538
```

---

## Cost Estimates

| Service | Free Tier | Expected Monthly Cost |
|---------|-----------|----------------------|
| Cloud Run | 2M requests free | $0-5 |
| Cloud Build | 120 min/day free | $0-5 |
| Firebase RTDB | 1GB + 10GB transfer | $0 (within limits) |
| Container Registry | 500MB free | $0-2 |
| **Total** | | **$0-12/month** |

---

## Troubleshooting

### "Billing not enabled" error
→ Enable billing at https://console.cloud.google.com/billing

### "API not enabled" error
→ Run the `gcloud services enable` command from Step 2

### Firebase database URL not working
→ Ensure Realtime Database is created in Firebase Console

### Service account permission denied
→ Check IAM roles are properly assigned with `gcloud iam service-accounts describe`

---

## Next Steps

After completing this setup:

1. ✅ Push code to GitHub
2. ✅ GitHub Actions will automatically deploy
3. ✅ Monitor deployments in GCP Console
4. ✅ Access your app via Cloud Run URL

---

**Project Details:**
- **GCP Project ID**: gen-lang-client-0165045538
- **Project Name**: Aether
- **Project Number**: 74952273984
- **Region**: us-central1
- **Account**: amryyian@gmail.com

