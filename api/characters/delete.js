// Delete character endpoint
// Following node-express.mdc and RESTful API best practices

import { getCollection } from '../utils/mongodb.js';
import { ObjectId } from 'mongodb';
import { ValidationError, NotFoundError, DatabaseError } from '../utils/errors.js';
import { asyncHandler, errorHandler } from '../middleware/errorHandler.js';
import { corsMiddleware } from '../middleware/cors.js';

async function deleteCharacterHandler(req, res) {
  try {
    // Only allow DELETE method
    if (req.method !== 'DELETE') {
      return res.status(405).json({
        error: true,
        message: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED',
      });
    }

    // Authenticate user
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader) {
      return res.status(401).json({
        error: true,
        message: 'No token provided',
        code: 'AUTHENTICATION_ERROR',
      });
    }

    const { verifyToken, extractTokenFromHeader } = await import('../utils/jwt.js');
    const token = extractTokenFromHeader(authHeader);
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        error: true,
        message: 'Invalid or expired token',
        code: 'AUTHENTICATION_ERROR',
      });
    }

    const userId = decoded.userId;
      const characterId = req.query.id || req.body.id;

      if (!characterId) {
        throw new ValidationError('Character ID is required');
      }

      // Validate ObjectId format
      if (!ObjectId.isValid(characterId)) {
        throw new ValidationError('Invalid character ID format');
      }

      const charactersCollection = await getCollection('characters');

      // Verify character belongs to user and delete
      const result = await charactersCollection.deleteOne({
        _id: new ObjectId(characterId),
        userId: new ObjectId(userId),
      });

      if (result.deletedCount === 0) {
        throw new NotFoundError('Character');
      }

      return res.status(200).json({
        error: false,
        message: 'Character deleted successfully',
        data: {
          deletedId: characterId,
        },
      });
    } catch (error) {
      // Error handler middleware will catch this
      throw error;
    }
  } catch (error) {
    throw error;
  }
}

// Vercel serverless function handler
export default asyncHandler(async (req, res) => {
  // Apply CORS
  corsMiddleware(req, res, async () => {
    try {
      await deleteCharacterHandler(req, res);
    } catch (error) {
      errorHandler(error, req, res, () => {});
    }
  });
});

