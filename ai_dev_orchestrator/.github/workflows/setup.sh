#!/bin/bash
# Setup script for GitHub Actions deployment

set -e

PROJECT_ID="cursordevteam-479721"
SERVICE_ACCOUNT_NAME="github-actions"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
KEY_FILE="github-actions-key.json"

echo "🔧 Setting up GitHub Actions for Cloud Run deployment..."
echo ""

# Create service account
echo "1️⃣ Creating service account..."
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
  --display-name="GitHub Actions Deploy" \
  --project=$PROJECT_ID \
  || echo "Service account already exists, continuing..."

# Grant permissions
echo ""
echo "2️⃣ Granting permissions..."

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/run.admin" \
  --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/artifactregistry.writer" \
  --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/iam.serviceAccountUser" \
  --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/cloudsql.client" \
  --quiet

# Create key
echo ""
echo "3️⃣ Creating service account key..."
gcloud iam service-accounts keys create $KEY_FILE \
  --iam-account=$SERVICE_ACCOUNT_EMAIL \
  --project=$PROJECT_ID

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Go to: https://github.com/abedmreyan/ai-dev-orchestrator/settings/secrets/actions"
echo ""
echo "2. Add secret 'GCP_SA_KEY' with this content:"
echo "   (Copy the entire contents of ${KEY_FILE})"
cat $KEY_FILE
echo ""
echo ""
echo "3. Add secret 'DATABASE_URL' with this value:"
echo "   postgresql://postgres:OrchDB#2025!Secure@/orchestrator?host=/cloudsql/cursordevteam-479721:us-central1:orchestrator-db"
echo ""
echo "4. Push your code:"
echo "   git push origin main"
echo ""
echo "⚠️  IMPORTANT: Delete ${KEY_FILE} after adding to GitHub secrets:"
echo "   rm ${KEY_FILE}"
echo ""
