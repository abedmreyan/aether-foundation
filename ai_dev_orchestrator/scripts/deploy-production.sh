#!/bin/bash

# Complete Production Deployment Script
# Uses Azure CLI for database, then deploys to GitHub and Netlify

set -e

echo "🚀 AI Orchestrator - Complete Production Deployment"
echo "═══════════════════════════════════════════════════"
echo ""

# Configuration
RESOURCE_GROUP="ai-orchestrator-prod"
LOCATION="eastus"
SERVER_NAME="ai-orchestrator-$(date +%s)"
DB_NAME="orchestrator-db"
ADMIN_USER="orchestrator_admin"
ADMIN_PASSWORD="AIOrc#2024!Secure\$Pass$(openssl rand -base64 4)"

echo "📋 Configuration:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Server: $SERVER_NAME"  
echo "  Database: $DB_NAME"
echo ""

# Step 1: Create SQL Server
echo "1️⃣  Creating Azure SQL Server..."
az sql server create \
  --name "$SERVER_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --admin-user "$ADMIN_USER" \
  --admin-password "$ADMIN_PASSWORD" \
  --output none

echo "   ✅ SQL Server created"
echo ""

# Step 2: Configure Firewall
echo "2️⃣  Configuring firewall..."
az sql server firewall-rule create \
  --name "AllowAll" \
  --server "$SERVER_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 255.255.255.255 \
  --output none

echo "   ✅ Firewall configured"
echo ""

# Step 3: Create Database
echo "3️⃣  Creating SQL Database..."
az sql db create \
  --name "$DB_NAME" \
  --server "$SERVER_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --edition Basic \
  --compute-model Serverless \
  --auto-pause-delay 60 \
  --output none

echo "   ✅ Database created"
echo ""

# Step 4: Generate connection string
CONNECTION_STRING="Server=tcp:${SERVER_NAME}.database.windows.net,1433;Initial Catalog=${DB_NAME};Persist Security Info=False;User ID=${ADMIN_USER};Password=${ADMIN_PASSWORD};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

# Update .env
echo "4️⃣  Updating .env file..."
sed -i.bak "s|DATABASE_URL=PENDING|DATABASE_URL=\"$CONNECTION_STRING\"|" .env.production
echo "   ✅ .env updated"
echo ""

# Step 5: Initialize Git
echo "5️⃣  Initializing Git repository..."
cd /Users/abedmreyan/Desktop/aether_-foundation/ai_dev_orchestrator

if [ ! -d ".git" ]; then
  git init
  git add .
  git commit -m "Initial commit: AI Dev Orchestrator"
fi

echo "   ✅ Git initialized"
echo ""

# Step 6: Push to GitHub
echo "6️⃣  Pushing to GitHub..."
git remote add origin https://github.com/abedmreyan/ai-dev-orchestrator.git || true
git branch -M main
git push -u origin main --force

echo "   ✅ Pushed to GitHub"
echo ""

# Step 7: Deploy schema
echo "7️⃣  Deploying database schema..."
# Note: This requires Azure Data Studio or manual execution
echo "   ⚠️  Schema deployment requires manual step"
echo "   Run: az sql db execute --resource-group $RESOURCE_GROUP --server $SERVER_NAME --name $DB_NAME --query-file schema.sql"
echo ""

# Step 8: Save credentials
echo "8️⃣  Saving credentials..."
cat > .azure-credentials-prod.txt << EOF
===========================================
Azure SQL Production Credentials
Generated: $(date)
===========================================

Server: ${SERVER_NAME}.database.windows.net
Database: $DB_NAME
Username: $ADMIN_USER
Password: $ADMIN_PASSWORD

Connection String:
$CONNECTION_STRING

Resource Group: $RESOURCE_GROUP
Location: $LOCATION

GitHub Repo: https://github.com/abedmreyan/ai-dev-orchestrator

===========================================
⚠️  KEEP THIS FILE SECURE!
===========================================
EOF

echo "   ✅ Credentials saved to .azure-credentials-prod.txt"
echo ""

echo "═══════════════════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETE!"
echo "═══════════════════════════════════════════════════"
echo ""
echo "📝 Next Steps:"
echo "1. Deploy schema manually (see step 7 above)"
echo "2. Deploy to Netlify:"
echo "   netlify deploy --prod --dir=client/dist"
echo ""
echo "🔗 Links:"
echo "  GitHub: https://github.com/abedmreyan/ai-dev-orchestrator"
echo "  Azure Portal: https://portal.azure.com/#@/resource/subscriptions/.../resourceGroups/$RESOURCE_GROUP"
echo ""
echo "🔐 Credentials saved in: .azure-credentials-prod.txt"
echo ""
