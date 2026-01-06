# GitHub Actions CI/CD Setup

This directory contains GitHub Actions workflows for automated testing and deployment.

## Workflows

### `deploy.yml` - Main CI/CD Pipeline

**Triggers:**
- Push to `main` branch → Runs tests + deploys
- Pull requests → Runs tests only (no deployment)

**Jobs:**

1. **Test Job**
   - Installs dependencies with pnpm
   - Builds the application
   - Runs TypeScript type checking
   - (Will run tests when added)

2. **Deploy Job** (only on main branch)
   - Authenticates with Google Cloud
   - Builds Docker image
   - Pushes to Artifact Registry
   - Deploys to Cloud Run
   - Verifies deployment health

## Setup Required

### 1. Create GCP Service Account

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Deploy"

# Grant necessary permissions
gcloud projects add-iam-policy-binding cursordevteam-479721 \
  --member="serviceAccount:github-actions@cursordevteam-479721.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding cursordevteam-479721 \
  --member="serviceAccount:github-actions@cursordevteam-479721.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding cursordevteam-479721 \
  --member="serviceAccount:github-actions@cursordevteam-479721.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Create key
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=github-actions@cursordevteam-479721.iam.gserviceaccount.com
```

### 2. Add GitHub Secrets

Go to: https://github.com/abedmreyan/ai-dev-orchestrator/settings/secrets/actions

Add these secrets:

1. **GCP_SA_KEY**
   - Copy the entire contents of `github-actions-key.json`
   - Paste as the secret value

2. **DATABASE_URL**
   ```
   postgresql://postgres:OrchDB#2025!Secure@/orchestrator?host=/cloudsql/cursordevteam-479721:us-central1:orchestrator-db
   ```

### 3. Enable Required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com
```

## Usage

### Automatic Deployment

Simply push to main:
```bash
git push origin main
```

The workflow will:
1. ✅ Run tests
2. 🔨 Build Docker image
3. 📦 Push to registry
4. 🚀 Deploy to Cloud Run
5. ✓ Verify health

### Manual Deployment

Trigger from GitHub Actions tab → Run workflow

### View Logs

- GitHub: https://github.com/abedmreyan/ai-dev-orchestrator/actions
- Cloud Run: https://console.cloud.google.com/run

## Adding Tests

Uncomment these lines in `deploy.yml`:

```yaml
- name: Run tests
  run: pnpm test
```

Then create tests in your codebase.

## Rollback

If a deployment fails:

1. **Automatic**: Workflow fails → previous version still running
2. **Manual**: Go to Cloud Run console → Traffic → Route to previous revision
