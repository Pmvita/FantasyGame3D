# MongoDB Atlas Setup Guide

**Note**: This is a reference guide. MongoDB setup has been completed via MCP tools.

## Current Database Status

✅ **Database**: `fantasy3d`  
✅ **Collections**: `users`, `characters`  
✅ **Indexes**: Created for optimal performance

## Connection String

```
mongodb+srv://username:password@cluster.mongodb.net/fantasy3d?retryWrites=true&w=majority&appName=fantasy3d
```

**⚠️ Important**: Replace `username` and `password` with your MongoDB Atlas credentials. Never commit actual credentials to Git!

## Manual Setup (Reference Only)

If you need to set up a new MongoDB Atlas cluster manually:

### Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new project named "Fantasy3D"

### Step 2: Create Free Cluster

1. Click "Build a Database"
2. Choose **M0 Free** tier
3. Select a region (same as Vercel deployment for best performance)
4. Name your cluster
5. Click "Create"

### Step 3: Create Database User

1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter username and generate secure password
5. Set privileges to "Read and write to any database"
6. Click "Add User"

### Step 4: Configure Network Access

1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. For Vercel serverless functions, add `0.0.0.0/0` (allows all IPs)
   - **Note**: For production, consider restricting to Vercel IP ranges
4. Click "Confirm"

### Step 5: Get Connection String

1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" and version "5.5 or later"
5. Copy the connection string
6. Replace `<password>` with your database user password
7. Add database name: `/fantasy3d?retryWrites=true&w=majority&appName=fantasy3d`

**Example connection string format:**
```
mongodb+srv://username:password@cluster.mongodb.net/fantasy3d?retryWrites=true&w=majority&appName=fantasy3d
```

## Step 6: Set Environment Variables

### For Local Development:
1. Create a `.env.local` file in the project root
2. Add the following variables:
   ```
   MONGODB_URI=your-connection-string-here
   JWT_SECRET=your-secret-key-here
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=http://localhost:3000
   ```
3. Generate a JWT secret: `openssl rand -base64 32`
4. Paste your MongoDB connection string into `MONGODB_URI`

### For Vercel:
1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add the following variables:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - Your JWT secret (same as local)
   - `JWT_EXPIRES_IN` - "7d" (or your preferred expiration)
   - `FRONTEND_URL` - Your Vercel deployment URL

## Collections and Indexes

### Collections
- `users` - User accounts with authentication data
- `characters` - Character data linked to users

### Indexes
- `users.username` (unique) - Fast username lookups
- `users.email` (unique, sparse) - Fast email lookups
- `characters.userId` - Fast character queries by user

**Note**: Collections and indexes have been created automatically via MCP tools.

## Troubleshooting

- **Connection timeout**: Check that your IP is whitelisted in Network Access
- **Authentication failed**: Verify username and password in connection string
- **Database not found**: The database will be created automatically on first use
