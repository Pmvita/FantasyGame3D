// Create character endpoint
// Following node-express.mdc and RESTful API best practices

import { getCollection } from '../../lib/utils/mongodb.js';
import { ObjectId } from 'mongodb';
import { validateCharacterData } from '../../lib/utils/validation.js';
import { ValidationError, DatabaseError } from '../../lib/utils/errors.js';
import { asyncHandler, errorHandler } from '../../lib/middleware/errorHandler.js';
import { corsMiddleware } from '../../lib/middleware/cors.js';

async function createCharacterHandler(req, res) {
  try {
    // Only allow POST method
    if (req.method !== 'POST') {
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
      const characterData = req.body;

      // Validate character data
      const validation = validateCharacterData(characterData);
      if (!validation.valid) {
        throw new ValidationError(validation.error);
      }

      const charactersCollection = await getCollection('characters');

      // Check if user already has character with same name
      const existingCharacter = await charactersCollection.findOne({
        userId: new ObjectId(userId),
        name: characterData.name.trim(),
      });

      if (existingCharacter) {
        throw new ValidationError('Character with this name already exists');
      }

      // Create character document
      const characterDoc = {
        userId: new ObjectId(userId),
        name: characterData.name.trim(),
        race: characterData.race,
        gender: characterData.gender || 'male',
        appearance: characterData.appearance || {},
        stats: characterData.stats,
        equipment: characterData.equipment || {
          weapon: null,
          armor: null,
          helmet: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Insert character
      const result = await charactersCollection.insertOne(characterDoc);

      if (!result.insertedId) {
        throw new DatabaseError('Failed to create character');
      }

      // Return created character
      return res.status(201).json({
        error: false,
        message: 'Character created successfully',
        data: {
          character: {
            id: result.insertedId.toString(),
            name: characterDoc.name,
            race: characterDoc.race,
            gender: characterDoc.gender,
            appearance: characterDoc.appearance,
            stats: characterDoc.stats,
            equipment: characterDoc.equipment,
            createdAt: characterDoc.createdAt,
            updatedAt: characterDoc.updatedAt,
          },
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
      await createCharacterHandler(req, res);
    } catch (error) {
      errorHandler(error, req, res, () => {});
    }
  });
});

