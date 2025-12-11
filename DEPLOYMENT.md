# Deployment Guide for Fantasy3D

## Prerequisites

1. **MongoDB Atlas Account** - See `MONGODB_SETUP.md` for setup instructions
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com) (free tier)
3. **GitHub Repository** (optional but recommended)

## Pre-Deployment Checklist

- [ ] MongoDB Atlas cluster created and connection string obtained
- [ ] Environment variables prepared (see `env.example`)
- [ ] Dependencies installed (`npm install`)
- [ ] Code tested locally (if possible)

## Step 1: Install Dependencies

```bash
npm install
```

This installs:
- `express` - Web framework for API
- `mongodb` - MongoDB driver
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `cors` - CORS middleware

## Step 2: Set Up MongoDB

Follow the instructions in `MONGODB_SETUP.md` to:
1. Create MongoDB Atlas account
2. Create M0 free cluster
3. Create database user
4. Whitelist IP addresses
5. Get connection string

## Step 3: Configure Environment Variables

### Local Development

1. Copy `env.example` to `.env.local`:
   ```bash
   cp env.example .env.local
   ```

2. Edit `.env.local` and fill in:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - Generate with: `openssl rand -base64 32`
   - `JWT_EXPIRES_IN` - "7d" (7 days)
   - `FRONTEND_URL` - "http://localhost:3000"

### Vercel Production

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add the same variables as above, but:
   - `FRONTEND_URL` - Your Vercel deployment URL (e.g., `https://fantasy3d.vercel.app`)

## Step 4: Deploy to Vercel

### Option A: Using Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Follow the prompts to:
   - Link to existing project or create new
   - Set environment variables
   - Deploy

### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository (or drag and drop files)
4. Configure:
   - Framework Preset: "Other"
   - Root Directory: `./`
   - Build Command: (leave empty, static site)
   - Output Directory: `./`
5. Add environment variables (see Step 3)
6. Click "Deploy"

## Step 5: Verify Deployment

After deployment, test the following:

1. **Frontend loads**: Visit your Vercel URL
2. **API endpoints work**: Test registration and login
3. **MongoDB connection**: Create an account and verify it's saved

### Test API Endpoints

You can test using curl or Postman:

```bash
# Register a user
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'

# Login
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'
```

## Troubleshooting

### API Returns 500 Error
- Check Vercel function logs in dashboard
- Verify MongoDB connection string is correct
- Ensure environment variables are set in Vercel

### CORS Errors
- Verify `FRONTEND_URL` matches your Vercel deployment URL
- Check that CORS middleware is applied in API routes

### MongoDB Connection Failed
- Verify IP whitelist includes `0.0.0.0/0` (or Vercel IP ranges)
- Check username and password in connection string
- Ensure cluster is running (not paused)

### JWT Token Issues
- Verify `JWT_SECRET` is set and consistent between environments
- Check token expiration settings

## Post-Deployment

1. **Update Frontend API URL**: The frontend uses relative paths, so it should work automatically if API and frontend are on the same domain
2. **Test User Registration**: Create a test account
3. **Test Character Creation**: Create a character and verify it saves
4. **Monitor Logs**: Check Vercel function logs for any errors

## Next Steps

- Set up custom domain (optional)
- Configure MongoDB indexes for better performance
- Add rate limiting for API endpoints
- Set up monitoring and alerts

