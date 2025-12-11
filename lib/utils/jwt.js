// JWT token utilities
// Following node-express.mdc authentication best practices

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token for user
 * @param {Object} payload - User data to encode in token
 * @param {string} payload.userId - User ID
 * @param {string} payload.username - Username
 * @param {string} [payload.role] - User role (optional, defaults to 'user')
 * @returns {string} JWT token
 */
export function generateToken(payload) {
  return jwt.sign(
    {
      userId: payload.userId,
      username: payload.username,
      role: payload.role || 'user', // Default to 'user' if not provided
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );
}

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null if not found
 */
export function extractTokenFromHeader(authHeader) {
  if (!authHeader) {
    return null;
  }

  // Support both "Bearer <token>" and just "<token>"
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }
  
  return authHeader;
}

