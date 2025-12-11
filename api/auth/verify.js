// JWT token verification endpoint
// Following node-express.mdc authentication best practices

import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';
import { AuthenticationError } from '../utils/errors.js';
import { asyncHandler, errorHandler } from '../middleware/errorHandler.js';
import { corsMiddleware } from '../middleware/cors.js';

async function verifyHandler(req, res) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: true,
      message: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED',
    });
  }

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

    // Return token info
    return res.status(200).json({
      error: false,
      message: 'Token is valid',
      data: {
        userId: decoded.userId,
        username: decoded.username,
      },
    });
  } catch (error) {
    // Error handler middleware will catch this
    throw error;
  }
}

// Vercel serverless function handler
export default asyncHandler(async (req, res) => {
  // Apply CORS
  corsMiddleware(req, res, async () => {
    try {
      await verifyHandler(req, res);
    } catch (error) {
      errorHandler(error, req, res, () => {});
    }
  });
});

