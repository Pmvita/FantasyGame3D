# Vercel-GitHub Integration Troubleshooting

## Issue
GitHub pushes are working, but Vercel isn't automatically deploying.

## Quick Checks

### 1. Verify Vercel Project is Linked to GitHub

**Steps:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find your project: `fantasy-game3-d` or `FantasyGame3D`
3. Go to **Settings** → **Git**
4. Check if GitHub repository is connected:
   - Should show: `Pmvita/FantasyGame3D`
   - Branch: `main` (or `master`)

**If NOT connected:**
- Click "Connect Git Repository"
- Select GitHub → `Pmvita/FantasyGame3D`
- Select branch: `main`
- Click "Deploy"

### 2. Check GitHub Webhook

**Steps:**
1. Go to your GitHub repository: https://github.com/Pmvita/FantasyGame3D
2. Click **Settings** → **Webhooks**
3. Look for a webhook with URL containing `vercel.com`
4. Check if it's **Active** (green checkmark)

**If webhook is missing or inactive:**
- Go to Vercel Dashboard → Project Settings → Git
- Disconnect and reconnect the repository
- This will recreate the webhook

### 3. Verify Commit Author Email

**Check your Git email:**
```bash
git config user.email
```

**It should match your Vercel account email.**

**To fix:**
```bash
git config --global user.email "your-vercel-email@example.com"
```

### 4. Check Vercel Project Settings

**In Vercel Dashboard → Project Settings:**

1. **Build & Development Settings:**
   - Framework Preset: Should be auto-detected or "Other"
   - Root Directory: Should be empty (or `FantasyGame3D` if in monorepo)
   - Build Command: Should be empty (or `npm run build` if needed)
   - Output Directory: Should be empty (or `.vercel/output`)

2. **Ignored Build Step:**
   - Should be empty (no custom script blocking builds)

3. **Git:**
   - Production Branch: `main` (or `master`)
   - Auto-deploy: Should be **Enabled**

### 5. Check Recent Deployments

**In Vercel Dashboard:**
1. Go to **Deployments** tab
2. Check if recent commits appear:
   - Latest commit: `2ae75af` (Revamp character selection...)
   - Should show deployment status

**If no deployments appear:**
- The project might not be linked
- Or webhook isn't working

## Manual Fix Steps

### Option 1: Reconnect Repository (Recommended)

1. **Vercel Dashboard:**
   - Go to Project Settings → Git
   - Click "Disconnect" (if connected)
   - Click "Connect Git Repository"
   - Select GitHub → `Pmvita/FantasyGame3D`
   - Select branch: `main`
   - Click "Deploy"

2. **This will:**
   - Create a new webhook
   - Trigger an immediate deployment
   - Set up auto-deployment for future pushes

### Option 2: Use Vercel CLI

**Install Vercel CLI:**
```bash
npm i -g vercel
```

**Login:**
```bash
vercel login
```

**Link Project:**
```bash
cd FantasyGame3D
vercel link
```

**Deploy:**
```bash
vercel --prod
```

### Option 3: Manual Deployment via Dashboard

1. Go to Vercel Dashboard → Your Project
2. Click "Deployments" tab
3. Click "Redeploy" on the latest deployment
4. Or click "Deploy" → "Deploy from GitHub" → Select commit

## Verify Fix

After reconnecting:

1. **Make a test commit:**
   ```bash
   git commit --allow-empty -m "test: trigger Vercel deployment"
   git push origin main
   ```

2. **Check Vercel Dashboard:**
   - Should see new deployment appear within 1-2 minutes
   - Status should change from "Building" → "Ready"

3. **Check GitHub Webhooks:**
   - Go to GitHub repo → Settings → Webhooks
   - Should see recent delivery with status 200

## Common Issues

### Issue: "No deployments found"
**Solution:** Project isn't linked. Use Option 1 above.

### Issue: "Webhook delivery failed"
**Solution:** 
- Check webhook URL is correct
- Verify Vercel project still exists
- Reconnect repository

### Issue: "Build failed"
**Solution:**
- Check Vercel build logs
- Verify `vercel.json` is correct
- Check environment variables are set

### Issue: "Deployment blocked"
**Solution:**
- Check for security vulnerabilities
- Review Vercel project settings
- Check if deployment is paused

## Next Steps

1. ✅ Reconnect GitHub repository in Vercel
2. ✅ Verify webhook is created
3. ✅ Make a test commit and push
4. ✅ Confirm deployment appears in Vercel
5. ✅ Test the deployed application

## Need Help?

If issues persist:
- Check Vercel Dashboard → Deployments → View logs
- Check GitHub → Settings → Webhooks → Recent deliveries
- Contact Vercel Support with:
  - Project name/URL
  - GitHub repository URL
  - Recent commit SHA
  - Error messages (if any)
