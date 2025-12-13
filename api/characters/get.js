// Get user's characters endpoint
// Following node-express.mdc and RESTful API best practices

import { getCollection } from '../../lib/utils/mongodb.js';
import { asyncHandler, errorHandler } from '../../lib/middleware/errorHandler.js';
import { corsMiddleware } from '../../lib/middleware/cors.js';
import { DatabaseError } from '../../lib/utils/errors.js';

async function getCharactersHandler(req, res) {
  try {
    // Only allow GET method
    if (req.method !== 'GET') {
      return res.status(405).json({
        error: true,
        message: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED',
      });
    }

    // Authenticate user (this will throw if invalid)
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader) {
      return res.status(401).json({
        error: true,
        message: 'No token provided',
        code: 'AUTHENTICATION_ERROR',
      });
    }

    // Verify token and get user info
    const { verifyToken, extractTokenFromHeader } = await import('../../lib/utils/jwt.js');
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
      const charactersCollection = await getCollection('characters');

      // Find all characters for this user
      const characters = await charactersCollection
        .find({ userId })
        .sort({ createdAt: -1 }) // Most recent first
        .toArray();

      // Convert ObjectId to string for JSON response
      const formattedCharacters = characters.map(char => ({
        id: char._id.toString(),
        name: char.name,
        race: char.race,
        gender: char.gender || 'male', // Default to 'male' for backward compatibility
        appearance: char.appearance,
        stats: char.stats,
        equipment: char.equipment,
        createdAt: char.createdAt,
        updatedAt: char.updatedAt,
      }));

      return res.status(200).json({
        error: false,
        message: 'Characters retrieved successfully',
        data: {
          characters: formattedCharacters,
          count: formattedCharacters.length,
        },
      });
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to retrieve characters', { originalError: error.message });
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
      await getCharactersHandler(req, res);
    } catch (error) {
      errorHandler(error, req, res, () => {});
    }
  });
});

