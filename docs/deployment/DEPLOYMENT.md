# Deployment Guide - Fantasy3D

Complete guide for deploying Fantasy3D to Vercel with MongoDB Atlas.

## Prerequisites

- ✅ MongoDB Atlas account (free tier)
- ✅ Vercel account (free tier)
- ✅ GitHub repository (for Git integration)

## Current Deployment Status

**Latest Commit**: `4604f27` - "trigger: force Vercel to deploy latest commit with fix"
**Fix Commit**: `392e469` - "Implement deployment fixes..."

**Status**: Fix applied and pushed. Vercel should auto-deploy within 1-2 minutes.

## Step 1: MongoDB Atlas Setup

### Database Configuration
- ✅ **Database**: `fantasy3d`
- ✅ **Collections**: `users`, `characters`
- ✅ **Indexes**: Created for optimal performance

### Connection String
```
mongodb+srv://username:password@cluster.mongodb.net/fantasy3d?retryWrites=true&w=majority&appName=fantasy3d
```

**Note**: Replace `username` and `password` with your MongoDB Atlas credentials. See [MongoDB Setup](../setup/MONGODB_SETUP.md) for reference.

## Step 2: Deploy to Vercel

### Option A: Git Integration (Recommended)

1. **Connect Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project" or import existing
   - Select GitHub repository: `Pmvita/FantasyGame3D`
   - Vercel will auto-detect settings from `vercel.json`

2. **Configure Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add the following (replace with your actual values):
     ```
     MONGODB_URI=your-mongodb-connection-string
     JWT_SECRET=your-secret-key-here
     JWT_EXPIRES_IN=7d
     FRONTEND_URL=https://your-project.vercel.app
     ```

3. **Deploy**:
   - Vercel will automatically deploy on every push to `main`
   - Or click "Redeploy" in the dashboard

### Option B: Vercel CLI

1. **Install and Login**:
   ```bash
   npm i -g vercel
   vercel login
   ```

2. **Deploy**:
   ```bash
   cd FantasyGame3D
   vercel --prod
   ```

3. **Set Environment Variables**:
   - Go to Vercel dashboard
   - Project Settings → Environment Variables
   - Add the variables listed above

## Step 3: Verify Deployment

### Check Deployment Status

1. **Vercel Dashboard**: https://vercel.com/pierres-projects-3ccb9894/fantasy-game3-d
2. **Look for**:
   - ✅ Build logs show commit `392e469` or newer
   - ✅ Only 7 serverless functions created
   - ✅ Deployment status: "Ready"

### Test API Endpoints

```bash
# Test registration
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123","email":"test@example.com"}'

# Test login
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'
```

### Test Frontend

1. Visit your Vercel deployment URL
2. Create an account
3. Create a character
4. Verify character saves to MongoDB

## Project Structure for Deployment

```
FantasyGame3D/
├── api/                    # 7 serverless functions ✅
│   ├── auth/
│   │   ├── login.js
│   │   ├── register.js
│   │   └── verify.js
│   └── characters/
│       ├── get.js
│       ├── create.js
│       ├── update.js
│       └── delete.js
├── lib/                    # Shared code (not functions) ✅
│   ├── middleware/
│   └── utils/
├── src/                    # Frontend code
├── index.html              # Main entry point
├── vercel.json             # Vercel configuration
└── package.json            # Dependencies
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for JWT tokens | `t3hXEbVbtNNnNpEVHHq7/z2cucAV2SUEduvNqWjT5rE=` |
| `JWT_EXPIRES_IN` | Token expiration time | `7d` |
| `FRONTEND_URL` | Frontend deployment URL | `https://your-app.vercel.app` |

## Troubleshooting

### Deployment Fails with "12 Serverless Functions" Error

**Status**: ✅ **FIXED** - This issue was resolved in commit `392e469`

**Solution Applied**:
- Moved `api/middleware/` → `lib/middleware/`
- Moved `api/utils/` → `lib/utils/`
- Result: Only 7 functions remain (under 12 limit)

### API Returns 500 Error

1. **Check Vercel Function Logs**:
   - Go to Vercel dashboard → Deployments → Function Logs
   - Look for error messages

2. **Verify Environment Variables**:
   - Ensure all variables are set in Vercel dashboard
   - Check `MONGODB_URI` is correct

3. **Check MongoDB Connection**:
   - Verify IP whitelist includes `0.0.0.0/0` (or Vercel IPs)
   - Ensure cluster is running (not paused)

### CORS Errors

- Verify `FRONTEND_URL` matches your Vercel deployment URL
- Check that CORS middleware is applied in API routes
- Ensure frontend uses relative API paths (already configured)

### JWT Token Issues

- Verify `JWT_SECRET` is set and consistent
- Check token expiration settings
- Ensure tokens are stored in localStorage

## Post-Deployment Checklist

- [ ] Deployment successful (status: "Ready")
- [ ] Environment variables set in Vercel
- [ ] Frontend loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Character creation works
- [ ] Character data saves to MongoDB
- [ ] Character retrieval works
- [ ] Character update works
- [ ] Character deletion works

## Next Steps After Deployment

1. **Update FRONTEND_URL** with actual Vercel URL
2. **Test All Features** - Registration, login, character management
3. **Monitor Logs** - Check Vercel function logs for errors
4. **Set Up Custom Domain** (optional)
5. **Configure Rate Limiting** (recommended for production)
6. **Set Up Monitoring** (optional)

## Support

For issues or questions:
- Check Vercel function logs
- Review MongoDB Atlas logs
- Check browser console for frontend errors
- See [Implementation Status](../project/IMPLEMENTATION_STATUS.md) for current status
