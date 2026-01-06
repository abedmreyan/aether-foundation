# AI Dev Orchestrator - Complete Deployment Guide

## Prerequisites

- ✅ Azure SQL Server created: `aether-orch-897256.database.windows.net`
- ✅ Database: `orchestrator-db`
- ✅ Google Tasks integration configured
- ✅ Code built successfully
- ⏳ Schema deployment needed
- ⏳ GitHub repository
- ⏳ Netlify account
- ⏳ Azure App Service

---

## Phase 1: Azure SQL Schema Deployment

### Step 1: Deploy Schema

**Option A: Azure Portal (Recommended)**

1. Go to https://portal.azure.com
2. Navigate to: SQL databases → `orchestrator-db`
3. Click "Query editor" (left sidebar)
4. Login with:
   - Username: `orchestrator_admin`
   - Password: `AetherOrch#2025!Secure$Pass`
5. Copy entire contents of `schema-azure.sql`
6. Paste and click "Run"
7. Wait for completion (should see "8 agents created")

**Option B: Azure Data Studio**

1. Download from https://aka.ms/azuredatastudio
2. Connect to `aether-orch-897256.database.windows.net`
3. Database: `orchestrator-db`
4. Open `schema-azure.sql`
5. Execute

### Step 2: Verify Schema

```bash
npm run verify:schema
```

Expected output:
```
✅ Database connection successful
✅ Agents: 8
✅ Projects: 1 (Aether CRM)
```

---

## Phase 2: GitHub Repository

### Step 1: Initialize Git (if not done)

```bash
cd /Users/abedmreyan/Desktop/aether_-foundation/ai_dev_orchestrator
git init
git add .
git commit -m "feat: AI Dev Orchestrator with Google Tasks integration"
```

### Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `ai-dev-orchestrator`
3. Description: "AI-powered development orchestrator with Google Tasks sync"
4. Visibility: Private (recommended)
5. Click "Create repository"

### Step 3: Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/ai-dev-orchestrator.git
git branch -M main
git push -u origin main
```

---

## Phase 3: Netlify Deployment (Frontend)

### Step 1: Prepare Build

The frontend is already built in `dist/client/`.

### Step 2: Deploy to Netlify

**Option A: Netlify CLI**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
cd /Users/abedmreyan/Desktop/aether_-foundation/ai_dev_orchestrator
netlify deploy --prod --dir=dist/client
```

**Option B: Netlify Dashboard**

1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub
4. Select `ai-dev-orchestrator` repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist/client`
6. Environment variables:
   ```
   VITE_API_URL=https://your-backend.azurewebsites.net
   ```
7. Click "Deploy site"

### Step 3: Configure Custom Domain (Optional)

1. In Netlify dashboard → Domain settings
2. Add custom domain
3. Update DNS records

---

## Phase 4: Azure App Service (Backend)

### Step 1: Create App Service

```bash
# Login to Azure
az login

# Create App Service Plan
az appservice plan create \
  --name aether-orchestrator-plan \
  --resource-group ai-orchestrator-rg \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --name aether-orchestrator-api \
  --resource-group ai-orchestrator-rg \
  --plan aether-orchestrator-plan \
  --runtime "NODE:20-lts"
```

### Step 2: Configure Environment Variables

```bash
az webapp config appsettings set \
  --name aether-orchestrator-api \
  --resource-group ai-orchestrator-rg \
  --settings \
    DATABASE_URL="Server=tcp:aether-orch-897256.database.windows.net,1433;Initial Catalog=orchestrator-db;Persist Security Info=False;User ID=orchestrator_admin;Password=AetherOrch#2025!Secure$Pass;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;" \
    AETHER_PROJECT_PATH=/home/site/wwwroot \
    MCP_SERVER_PATH=/home/site/mcp \
    DEEPSEEK_API_KEY=your-deepseek-api-key \
    PERPLEXITY_API_KEY=your-perplexity-api-key \
    GOOGLE_TASKS_LIST_ID=your-task-list-id \
    GOOGLE_TASKS_SYNC_INTERVAL=15 \
    GOOGLE_TASKS_AUTO_SYNC=true \
    PORT=8080 \
    NODE_ENV=production
```

### Step 3: Deploy Backend

**Option A: GitHub Actions (Recommended)**

Create `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend to Azure

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
    
    - name: Install dependencies
      run: npm install
    
    - name: Build
      run: npm run build
    
    - name: Deploy to Azure
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'aether-orchestrator-api'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: .
```

**Option B: Azure CLI**

```bash
# Build
npm run build

# Deploy
az webapp deployment source config-zip \
  --name aether-orchestrator-api \
  --resource-group ai-orchestrator-rg \
  --src dist.zip
```

### Step 4: Verify Backend

```bash
curl https://aether-orchestrator-api.azurewebsites.net/api/health
```

---

## Phase 5: Post-Deployment Configuration

### Step 1: Update Frontend API URL

Update Netlify environment variable:
```
VITE_API_URL=https://aether-orchestrator-api.azurewebsites.net
```

Redeploy frontend.

### Step 2: Configure CORS

In Azure App Service, add allowed origins:
```bash
az webapp cors add \
  --name aether-orchestrator-api \
  --resource-group ai-orchestrator-rg \
  --allowed-origins https://your-frontend.netlify.app
```

### Step 3: Enable HTTPS Only

```bash
az webapp update \
  --name aether-orchestrator-api \
  --resource-group ai-orchestrator-rg \
  --https-only true
```

### Step 4: Configure Google Tasks

Run setup on deployed backend:
```bash
# SSH into Azure App Service
az webapp ssh --name aether-orchestrator-api --resource-group ai-orchestrator-rg

# Run setup
npm run setup:google-tasks
```

---

## Phase 6: Verification

### Test Checklist

- [ ] Frontend loads at Netlify URL
- [ ] Backend health check responds
- [ ] Database connection works
- [ ] Agents list loads
- [ ] Projects list loads
- [ ] Google Tasks sync works
- [ ] Task approval flow works
- [ ] MCP server connection works

### Monitoring

**Azure Application Insights**:
```bash
az monitor app-insights component create \
  --app aether-orchestrator-insights \
  --location eastus2 \
  --resource-group ai-orchestrator-rg
```

**Netlify Analytics**:
- Enable in Netlify dashboard
- Monitor page views and performance

---

## Environment Variables Summary

### Frontend (.env for Netlify)
```
VITE_API_URL=https://aether-orchestrator-api.azurewebsites.net
```

### Backend (.env for Azure App Service)
```
DATABASE_URL=Server=tcp:aether-orch-897256.database.windows.net,1433;...
AETHER_PROJECT_PATH=/home/site/wwwroot
MCP_SERVER_PATH=/home/site/mcp
DEEPSEEK_API_KEY=your-deepseek-api-key
PERPLEXITY_API_KEY=your-perplexity-api-key
GOOGLE_TASKS_LIST_ID=your-task-list-id
GOOGLE_TASKS_SYNC_INTERVAL=15
GOOGLE_TASKS_AUTO_SYNC=true
PORT=8080
NODE_ENV=production
```

---

## Troubleshooting

### Frontend Issues

**Build fails**:
- Check Node.js version (20.19+ or 22.12+)
- Clear `node_modules` and reinstall
- Check for TypeScript errors

**API calls fail**:
- Verify `VITE_API_URL` is correct
- Check CORS configuration
- Verify backend is running

### Backend Issues

**Database connection fails**:
- Check firewall rules in Azure SQL
- Verify connection string
- Test with `npm run verify:schema`

**Google Tasks sync fails**:
- Verify MCP server is accessible
- Check `GOOGLE_TASKS_LIST_ID`
- Test with `npm run test:google-tasks`

---

## Cost Estimate

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| Azure SQL | Basic | ~$5 |
| Azure App Service | B1 | ~$13 |
| Netlify | Free/Pro | $0-$19 |
| **Total** | | **~$18-37/month** |

---

## Security Checklist

- [ ] Change Azure SQL admin password
- [ ] Restrict SQL firewall to specific IPs
- [ ] Enable Azure Defender for SQL
- [ ] Rotate API keys regularly
- [ ] Enable HTTPS only
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerts
- [ ] Enable audit logging

---

## Next Steps

1. ✅ Deploy Azure SQL schema
2. ✅ Push to GitHub
3. ✅ Deploy frontend to Netlify
4. ✅ Deploy backend to Azure
5. ⏳ Configure custom domains
6. ⏳ Set up CI/CD pipeline
7. ⏳ Configure monitoring
8. ⏳ Production testing

---

**Deployment Status**: Ready for deployment  
**Last Updated**: December 16, 2025  
**Version**: 1.0.0

