// Update character endpoint
// Following node-express.mdc and RESTful API best practices

import { getCollection } from '../utils/mongodb.js';
import { ObjectId } from 'mongodb';
import { validateCharacterData } from '../utils/validation.js';
import { ValidationError, NotFoundError, DatabaseError } from '../utils/errors.js';
import { asyncHandler, errorHandler } from '../middleware/errorHandler.js';
import { corsMiddleware } from '../middleware/cors.js';

async function updateCharacterHandler(req, res) {
  try {
    // Only allow PUT method
    if (req.method !== 'PUT') {
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

      const characterData = req.body;
      const charactersCollection = await getCollection('characters');

      // Verify character belongs to user
      const existingCharacter = await charactersCollection.findOne({
        _id: new ObjectId(characterId),
        userId: new ObjectId(userId),
      });

      if (!existingCharacter) {
        throw new NotFoundError('Character');
      }

      // Validate updated character data
      const validation = validateCharacterData(characterData);
      if (!validation.valid) {
        throw new ValidationError(validation.error);
      }

      // Check if name is being changed and if new name already exists
      if (characterData.name && characterData.name.trim() !== existingCharacter.name) {
        const nameExists = await charactersCollection.findOne({
          userId: new ObjectId(userId),
          name: characterData.name.trim(),
          _id: { $ne: new ObjectId(characterId) },
        });

        if (nameExists) {
          throw new ValidationError('Character with this name already exists');
        }
      }

      // Update character
      const updateDoc = {
        name: characterData.name.trim(),
        race: characterData.race,
        appearance: characterData.appearance || existingCharacter.appearance,
        stats: characterData.stats,
        equipment: characterData.equipment || existingCharacter.equipment,
        updatedAt: new Date(),
      };

      const result = await charactersCollection.updateOne(
        {
          _id: new ObjectId(characterId),
          userId: new ObjectId(userId),
        },
        { $set: updateDoc }
      );

      if (result.matchedCount === 0) {
        throw new NotFoundError('Character');
      }

      if (result.modifiedCount === 0) {
        // No changes made, but character exists
        const updatedCharacter = await charactersCollection.findOne({
          _id: new ObjectId(characterId),
        });

        return res.status(200).json({
          error: false,
          message: 'Character updated successfully',
          data: {
            character: {
              id: updatedCharacter._id.toString(),
              name: updatedCharacter.name,
              race: updatedCharacter.race,
              appearance: updatedCharacter.appearance,
              stats: updatedCharacter.stats,
              equipment: updatedCharacter.equipment,
              createdAt: updatedCharacter.createdAt,
              updatedAt: updatedCharacter.updatedAt,
            },
          },
        });
      }

      // Fetch updated character
      const updatedCharacter = await charactersCollection.findOne({
        _id: new ObjectId(characterId),
      });

      return res.status(200).json({
        error: false,
        message: 'Character updated successfully',
        data: {
          character: {
            id: updatedCharacter._id.toString(),
            name: updatedCharacter.name,
            race: updatedCharacter.race,
            appearance: updatedCharacter.appearance,
            stats: updatedCharacter.stats,
            equipment: updatedCharacter.equipment,
            createdAt: updatedCharacter.createdAt,
            updatedAt: updatedCharacter.updatedAt,
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
      await updateCharacterHandler(req, res);
    } catch (error) {
      errorHandler(error, req, res, () => {});
    }
  });
});

