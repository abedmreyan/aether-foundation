# Netlify Git Integration Deployment Guide

## Step 1: Initialize Git Repository (if not already done)

```bash
git init
git add .
git commit -m "Initial commit - Ajnabi Beta ready for deployment"
```

## Step 2: Push to GitHub/GitLab/Bitbucket

### For GitHub:
```bash
# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### For GitLab:
```bash
git remote add origin https://gitlab.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### For Bitbucket:
```bash
git remote add origin https://bitbucket.org/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Step 3: Connect to Netlify

### Option A: Via Netlify Dashboard (Recommended)

1. **Login to Netlify**
   - Go to https://app.netlify.com
   - Sign in or create an account

2. **Import Your Project**
   - Click "Add new site" → "Import an existing project"
   - Choose your Git provider (GitHub, GitLab, or Bitbucket)
   - Authorize Netlify to access your repositories
   - Select your repository

3. **Configure Build Settings**
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Branch to deploy**: `main` (or your default branch)

4. **Environment Variables** (Optional for now)
   - You can add these later in Site settings → Environment variables
   - `VITE_SUPABASE_URL` (already in .env, but .env is gitignored)
   - `VITE_SUPABASE_ANON_KEY` (already in .env, but .env is gitignored)

5. **Deploy**
   - Click "Deploy site"
   - Netlify will automatically build and deploy your site
   - First deployment takes ~2-3 minutes

### Option B: Via Netlify CLI

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link your repository
netlify init

# Follow the prompts:
# - Connect to git remote
# - Configure build settings:
#   Build command: npm run build
#   Publish directory: dist
```

## Step 4: Configure Custom Domain (Optional)

1. Go to Site settings → Domain management
2. Click "Add custom domain"
3. Follow DNS configuration instructions
4. SSL certificate is automatically provisioned

## Step 5: Set Up Continuous Deployment

Once connected, Netlify automatically:
- Builds and deploys on every push to main branch
- Creates preview deployments for pull requests
- Rolls back to previous versions if needed

## Step 6: Post-Deployment Configuration

### Add Environment Variables (if needed)

1. Go to Site settings → Environment variables
2. Add the following variables:
   ```
   VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
   VITE_SUPABASE_ANON_KEY=[your-anon-key]
   ```
3. Trigger a redeploy for changes to take effect

### Configure Redirects (Already Set Up)

The `netlify.toml` file is already configured with:
- Build settings
- SPA redirect rules (/* → /index.html)

## Deployment Status

### What's Deployed
- ✅ Landing page with authentication
- ✅ Login/signup modals
- ✅ Dashboard with CRM functionality
- ✅ Three pipelines (Students, Tutors, Packages)
- ✅ Supabase database integration
- ✅ Role-based access control

### User Accounts Ready
- khaldoun@ajnabi.co / PASSWORD (Management)
- amin@ajnabi.co / PASSWORD (Admin)
- abed@ajnabi.co / PASSWORD (Admin)

## Monitoring Your Deployment

### Netlify Dashboard
- **Deploy logs**: See real-time build progress
- **Deploy history**: Roll back to any previous version
- **Analytics**: Monitor site performance
- **Forms**: Capture form submissions
- **Functions**: Add serverless functions if needed

### Deployment URL
After deployment completes, Netlify provides:
- **Temporary URL**: `https://[random-name].netlify.app`
- **Custom domain**: Configure in settings

## Troubleshooting

### Build Fails
1. Check deploy logs in Netlify dashboard
2. Verify build command: `npm run build`
3. Ensure all dependencies are in package.json
4. Check for TypeScript errors

### Site Loads But Blank
1. Check browser console for errors
2. Verify environment variables are set
3. Check that redirects are working (netlify.toml)
4. Clear cache and hard reload

### 404 Errors on Routes
- Verify `netlify.toml` redirects configuration
- Should redirect all routes to /index.html (already configured)

### Database Connection Issues
- Verify Supabase credentials in environment variables
- Check RLS policies in Supabase dashboard
- Ensure company and user data is seeded

## Useful Commands

```bash
# View deploy status
netlify status

# Open Netlify dashboard
netlify open

# View deploy logs
netlify watch

# Trigger manual deploy
netlify deploy --prod

# Roll back to previous deploy
netlify rollback
```

## Next Steps After Deployment

1. **Test the deployment**
   - Login with all three Ajnabi accounts
   - Verify CRM functionality
   - Test entity creation and movement
   - Check permissions for each role

2. **Share with Ajnabi team**
   - Send deployment URL
   - Provide login credentials
   - Schedule onboarding session

3. **Monitor and iterate**
   - Gather user feedback
   - Track any errors in browser console
   - Make improvements based on usage

4. **Set up monitoring**
   - Add error tracking (Sentry, LogRocket)
   - Set up uptime monitoring
   - Configure alerts for build failures

## Environment File Example

Create a `.env.production` for reference (don't commit):

```env
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Add these same values in Netlify's environment variables section.

## Support

For deployment issues:
- Netlify Support: https://answers.netlify.com
- Netlify Docs: https://docs.netlify.com
- Project Documentation: See `.agent/` folder

---

**Deployment Status**: ✅ Ready for Git Integration

All code is committed and ready to push to your Git provider and connect to Netlify.
