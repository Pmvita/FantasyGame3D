# Admin Users Guide

## Where Admin Users Are Stored

**Answer**: Admin users are stored in the **`fantasy3d`** database, in the **`users`** collection, just like regular users.

### Database Structure

```
fantasy3d (database)
├── users (collection)
│   ├── Regular users (role: 'user' or undefined)
│   └── Admin users (role: 'admin')
└── characters (collection)
```

**Important Notes**:
- The `admin` database in MongoDB is a **system database** used by MongoDB itself for authentication and administrative operations. Do NOT store application users there.
- The `local` database is also a **system database** used for replication. Do NOT store application users there.
- All application users (regular and admin) should be stored in the **`fantasy3d`** database.

## Current Admin User

**Username**: `pmvita`  
**Password**: `admin123`  
**Email**: `petermvita@hotmail.com`  
**Role**: `admin`  
**User ID**: `693b46a2f8c43c215288f946`

## User Roles

### Role Field
Users have an optional `role` field in the database:
- **`admin`**: Administrator/developer access
- **`user`**: Regular user (default if role is not set)

### Default Behavior
- New users created via registration default to `role: 'user'`
- Admin users must be created manually or via script

## Creating Admin Users

### Option 1: Using the Script (Recommended)

```bash
cd FantasyGame3D
MONGODB_URI="your-connection-string" node scripts/create-admin-user.js
```

**Note**: Edit `scripts/create-admin-user.js` to change username, password, and email before running.

The script will:
- Check if user exists
- Create new admin user or update existing user to admin role
- Hash password securely using bcrypt
- Set role to 'admin'

**Current admin user** (already created):
- Username: `pmvita`
- Password: `admin123`
- Email: `petermvita@hotmail.com`

### Option 2: Manual MongoDB Insert

You can manually insert an admin user using MongoDB Compass or MongoDB shell:

```javascript
db.users.insertOne({
  username: "admin",
  email: "admin@example.com",
  passwordHash: "$2a$10$...", // Use bcrypt to hash password
  role: "admin",
  createdAt: new Date(),
  lastLogin: null
});
```

### Option 3: Via API (then update role)

1. Register normally via `/api/auth/register`
2. Update user document in MongoDB to set `role: 'admin'`

## Admin Authorization

### Using Admin Middleware

For admin-only endpoints, use the `requireAdmin` middleware:

```javascript
import { requireAdmin } from '../../lib/middleware/adminAuth.js';

// In your endpoint handler
export default asyncHandler(async (req, res) => {
  corsMiddleware(req, res, async () => {
    // Apply admin check
    requireAdmin(req, res, async () => {
      // Admin-only code here
      // req.user.role will be 'admin'
    });
  });
});
```

### Checking Admin Role in Code

```javascript
// After authentication, check role
if (req.user && req.user.role === 'admin') {
  // Admin-only logic
}
```

## JWT Token Includes Role

When an admin user logs in:
- The JWT token includes the `role: 'admin'` field
- The login response includes the role in the user object
- The token can be verified to check admin status

## Security Notes

1. **Password Security**: Admin passwords should be strong (the script enforces this)
2. **Token Security**: Admin tokens include role, but verify on server-side
3. **Role Verification**: Always verify admin role on the server, never trust client-side
4. **Default Role**: New users default to 'user' role for security

## Example: Admin-Only Endpoint

```javascript
// api/admin/stats.js
import { requireAdmin } from '../../lib/middleware/adminAuth.js';
import { corsMiddleware } from '../../lib/middleware/cors.js';
import { asyncHandler, errorHandler } from '../../lib/middleware/errorHandler.js';

async function getStatsHandler(req, res) {
  // Only admins can access this
  const stats = {
    totalUsers: 100,
    totalCharacters: 250,
    // ... admin-only data
  };

  return res.status(200).json({
    error: false,
    data: stats,
  });
}

export default asyncHandler(async (req, res) => {
  corsMiddleware(req, res, async () => {
    requireAdmin(req, res, async () => {
      try {
        await getStatsHandler(req, res);
      } catch (error) {
        errorHandler(error, req, res, () => {});
      }
    });
  });
});
```

## Troubleshooting

### Admin user can't login
- Verify password is correct
- Check user exists in `fantasy3d.users` collection
- Verify `role` field is set to `'admin'`

### Role not in token
- Ensure login endpoint fetches role from database
- Check JWT generation includes role
- Verify user document has `role` field

### Admin middleware not working
- Ensure `requireAdmin` is called after authentication
- Check token includes role field
- Verify role is exactly `'admin'` (case-sensitive)
