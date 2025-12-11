// JWT authentication middleware
// Following node-express.mdc authentication best practices

import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';
import { AuthenticationError } from '../utils/errors.js';

/**
 * Middleware to verify JWT token
 * Adds user info to request object if token is valid
 */
export function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      throw new AuthenticationError('Invalid or expired token');
    }

    // Attach user info to request (include role if present)
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role || 'user', // Include role if present
    };

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(error.statusCode).json(error.toJSON());
    }
    
    return res.status(401).json({
      error: true,
      message: 'Authentication failed',
      code: 'AUTHENTICATION_ERROR',
    });
  }
}

