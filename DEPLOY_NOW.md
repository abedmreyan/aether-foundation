# Deploy to Netlify - Quick Start

## 🚀 Ready to Deploy in 3 Steps

### Step 1: Push to Git

```bash
# If not already initialized
git init
git add .
git commit -m "Ajnabi Beta - ready for deployment"

# Push to GitHub (or GitLab/Bitbucket)
git remote add origin https://github.com/YOUR_USERNAME/aether-crm.git
git push -u origin main
```

### Step 2: Connect to Netlify

1. Go to https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose your Git provider and authorize
4. Select your repository
5. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Click **"Deploy site"**

### Step 3: Wait ~2 minutes

Netlify will automatically:
- Install dependencies
- Run the build
- Deploy to a live URL
- Provide you with a URL like: `https://magical-name-123456.netlify.app`

## ✅ Verification Checklist

After deployment, test these:

- [ ] Site loads at the Netlify URL
- [ ] Can login with: **khaldoun@ajnabi.co / PASSWORD**
- [ ] Can login with: **amin@ajnabi.co / PASSWORD**
- [ ] Can login with: **abed@ajnabi.co / PASSWORD**
- [ ] Dashboard displays all 3 pipelines
- [ ] Can create a student entity
- [ ] Can move entities between stages
- [ ] Role permissions work correctly

## 🔧 Build Configuration (Already Set)

Your `netlify.toml` is configured:

```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 📦 What's Deployed

- ✅ Aether CRM Platform
- ✅ 3 Ajnabi user accounts
- ✅ Students, Tutors, Packages pipelines
- ✅ Supabase database (already seeded)
- ✅ Role-based access control
- ✅ Full authentication system

## 🎯 User Accounts

| Email | Password | Role |
|-------|----------|------|
| khaldoun@ajnabi.co | PASSWORD | Management |
| amin@ajnabi.co | PASSWORD | Admin |
| abed@ajnabi.co | PASSWORD | Admin |

## 🔗 Helpful Links

- **Netlify Dashboard**: https://app.netlify.com
- **Full Deployment Guide**: See `NETLIFY_GIT_DEPLOYMENT.md`
- **Beta Deployment Info**: See `AJNABI_BETA_DEPLOYMENT.md`

---

**Status**: 🟢 All systems ready for deployment
