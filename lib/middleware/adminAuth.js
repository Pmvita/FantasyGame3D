// Admin authorization middleware
// Following node-express.mdc authorization best practices

import { AuthenticationError, AuthorizationError } from '../utils/errors.js';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';

/**
 * Middleware to verify user is authenticated AND has admin role
 * Can be used standalone or after authenticateToken middleware
 */
export function requireAdmin(req, res, next) {
  try {
    // If req.user is already set (from authenticateToken), use it
    if (req.user) {
      if (req.user.role !== 'admin') {
        throw new AuthorizationError('Admin access required');
      }
      return next();
    }

    // Otherwise, extract and verify token directly
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      throw new AuthenticationError('Invalid or expired token');
    }

    // Check admin role
    if (decoded.role !== 'admin') {
      throw new AuthorizationError('Admin access required');
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return res.status(error.statusCode).json(error.toJSON());
    }
    
    return res.status(403).json({
      error: true,
      message: 'Access denied',
      code: 'AUTHORIZATION_ERROR',
    });
  }
}
