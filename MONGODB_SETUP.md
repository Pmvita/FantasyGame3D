# MongoDB Atlas Setup Guide

## Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account (if you don't have one)
3. Create a new project named "Fantasy3D"

## Step 2: Create Free Cluster

1. Click "Build a Database"
2. Choose **M0 Free** tier
3. Select a region (choose the same region as your Vercel deployment for best performance)
4. Name your cluster (e.g., "fantasy3d-cluster")
5. Click "Create"

## Step 3: Create Database User

1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter a username (e.g., `fantasy3d_user`)
5. Generate a secure password (save it securely!)
6. Set user privileges to "Read and write to any database"
7. Click "Add User"

## Step 4: Configure Network Access

1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. For Vercel serverless functions, add `0.0.0.0/0` (allows all IPs)
   - **Note**: For production, consider restricting to Vercel IP ranges
4. Click "Confirm"

## Step 5: Get Connection String

1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" and version "5.5 or later"
5. Copy the connection string
6. Replace `<password>` with your database user password
7. Add database name: `?retryWrites=true&w=majority&appName=fantasy3d`

**Example connection string:**
```
mongodb+srv://fantasy3d_user:YOUR_PASSWORD@fantasy3d-cluster.xxxxx.mongodb.net/fantasy3d?retryWrites=true&w=majority&appName=fantasy3d
```

## Step 6: Set Environment Variables

### For Local Development:
1. Copy `env.example` to `.env.local`
2. Paste your MongoDB connection string into `MONGODB_URI`
3. Generate a JWT secret: `openssl rand -base64 32`
4. Set `JWT_SECRET` to the generated value

### For Vercel:
1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add the following variables:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - Your JWT secret (same as local)
   - `JWT_EXPIRES_IN` - "7d" (or your preferred expiration)
   - `FRONTEND_URL` - Your Vercel deployment URL (optional)

## Step 7: Create Database and Collections

Once you have the connection string, the application will automatically create the database and collections on first use. However, you can also create them manually using MongoDB MCP tools or MongoDB Compass.

### Collections to Create:
- `users` - User accounts
- `characters` - Character data

### Indexes to Create:
- `users.username` (unique)
- `users.email` (unique, sparse)
- `characters.userId` (for fast lookups)

## Troubleshooting

- **Connection timeout**: Check that your IP is whitelisted in Network Access
- **Authentication failed**: Verify username and password in connection string
- **Database not found**: The database will be created automatically on first use

