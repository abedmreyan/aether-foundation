#!/bin/bash
# Deploy Firebase Realtime Database Security Rules

set -e

echo "🔐 Deploying Firebase Security Rules..."
echo "Project: aether-foundation"
echo ""

# Set quota project for Firebase CLI
export GOOGLE_CLOUD_QUOTA_PROJECT=aether-foundation

# Check if Firebase CLI is available
if ! command -v firebase &> /dev/null; then
    echo "📦 Installing Firebase CLI via npx..."
    npx firebase-tools deploy --only database --project aether-foundation
else
    echo "✅ Firebase CLI found, deploying rules..."
    firebase deploy --only database --project aether-foundation
fi

echo ""
echo "✅ Firebase security rules deployed successfully!"
echo "🌐 Database URL: https://aether-foundation-default-rtdb.firebaseio.com"
echo ""
echo "📋 Next steps:"
echo "   1. Verify rules in Firebase Console: https://console.firebase.google.com/project/aether-foundation/database/aether-foundation-default-rtdb/rules"
echo "   2. Test database connection from your application"
echo "   3. Proceed with Cloud Run deployment"

