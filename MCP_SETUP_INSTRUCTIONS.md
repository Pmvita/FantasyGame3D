# MCP Setup Instructions

## MongoDB MCP Setup

To use MongoDB MCP tools, I need your MongoDB Atlas connection string.

### Get Your Connection String

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Navigate to your cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your actual password
6. Add database name: `fantasy3d`

**Format:**
```
mongodb+srv://<username>:<password>@cluster.mongodb.net/fantasy3d?retryWrites=true&w=majority
```

### Once You Have the Connection String

Share it with me and I'll:
1. Connect to MongoDB using MCP
2. Create the `fantasy3d` database
3. Create `users` and `characters` collections
4. Create indexes:
   - `users.username` (unique)
   - `users.email` (unique, sparse)
   - `characters.userId` (for fast lookups)

## Vercel MCP Setup

For Vercel, I can deploy using MCP tools. However, you may need to:

1. **Option A: Git Integration (Recommended)**
   - Push your code to GitHub
   - Connect the repo to Vercel via dashboard
   - I can then help configure environment variables via MCP

2. **Option B: Vercel CLI**
   - Install: `npm i -g vercel`
   - Login: `vercel login`
   - Then I can deploy via MCP

3. **Option C: Manual Deployment**
   - Use Vercel dashboard to drag & drop or import from Git
   - I can help set environment variables after deployment

## Quick Start

**For MongoDB:**
Just share your connection string and I'll set everything up via MCP!

**For Vercel:**
- If you have a GitHub repo, I can help connect it
- If not, we can use Vercel CLI or manual deployment
- After deployment, I can set environment variables via MCP
