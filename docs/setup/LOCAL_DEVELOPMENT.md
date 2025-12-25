# Local Development Guide

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create `.env.local` file** in the project root:
   ```bash
   MONGODB_URI=your-mongodb-connection-string
   JWT_SECRET=your-secret-key-here
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=http://localhost:3000
   ```
   
   **⚠️ Important**: Replace placeholder values with your actual credentials. Never commit `.env.local` to Git!

3. **Start the server**:
   ```bash
   npm start
   ```

4. **Open browser**: Navigate to `http://localhost:3000`

## Server Types

### Express Server (Recommended - `npm start`)
- ✅ Handles both static files and API endpoints
- ✅ Full authentication and character management
- ✅ MongoDB integration
- ✅ Use this for development with API functionality

### Static Server (`npm run static`)
- ⚠️ Only serves static files (no API)
- ⚠️ API calls will return 404
- ⚠️ Falls back to LocalStorage for characters
- Use only for testing UI without backend

## Troubleshooting

### "Failed to execute 'json' on 'Response': Unexpected end of JSON input"

**Cause**: Using `http-server` (static server) instead of Express server

**Solution**: 
1. Stop the current server (Ctrl+C)
2. Run `npm start` instead of `npm run dev` or `npm run static`
3. The Express server handles API endpoints correctly

### "API endpoint not found (404)"

**Cause**: Server not running or wrong server type

**Solution**:
- Make sure you're using `npm start` (Express server)
- Check that server is running on port 3000
- Verify `.env.local` file exists

### MongoDB Connection Errors

**Solution**:
- Check `.env.local` has correct `MONGODB_URI`
- Verify MongoDB Atlas cluster is running
- Check network connection

### Login Not Working

**Check**:
1. Server is running (`npm start`)
2. `.env.local` file exists with correct values
3. MongoDB connection is working
4. Admin user exists (see [Admin Users](../admin/ADMIN_USERS.md) for credentials - **not committed to Git**)

## Environment Variables

Required in `.env.local`:

- **MONGODB_URI**: MongoDB Atlas connection string
- **JWT_SECRET**: Secret key for JWT token signing
- **JWT_EXPIRES_IN**: Token expiration (e.g., `7d`, `24h`)
- **FRONTEND_URL**: Frontend URL for CORS (usually `http://localhost:3000`)

## Testing the API

Once the server is running, you can test the API:

```bash
# Test login (replace with your credentials)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your-username","password":"your-password"}'
```

## Development Workflow

1. **Start server**: `npm start`
2. **Make changes**: Edit files in `src/` or `api/`
3. **Reload browser**: Changes to frontend require refresh
4. **Restart server**: Changes to backend require server restart (Ctrl+C, then `npm start`)

## Next Steps

- See [SETUP.md](./SETUP.md) for more detailed setup instructions
- See [Deployment Guide](../deployment/DEPLOYMENT.md) for production deployment
- See [Admin Users](../admin/ADMIN_USERS.md) for admin user management
