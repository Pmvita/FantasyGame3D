// Character selection logging endpoint
// Logs character info to server console when player selects a character

import { asyncHandler, errorHandler } from '../../lib/middleware/errorHandler.js';
import { corsMiddleware } from '../../lib/middleware/cors.js';

async function logCharacterSelectedHandler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        error: true,
        message: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED',
      });
    }

    const { characterName, race, gender, level, stats } = req.body;

    // Log to server console
    console.log('\n⚔️  === CHARACTER SELECTED - GAME STARTING ===');
    console.log(`👤 Character Name: ${characterName || 'Unnamed'}`);
    console.log(`🏹 Race: ${race || 'Human'}`);
    console.log(`⚧️  Gender: ${gender || 'Male'}`);
    console.log(`📊 Level: ${level || 1}`);
    if (stats) {
      console.log(`❤️  Health: ${stats.health || 100}/${stats.maxHealth || 100}`);
      console.log(`⚔️  Strength: ${stats.strength || 10}`);
      console.log(`✨ Magic: ${stats.magic || 10}`);
      console.log(`💨 Speed: ${stats.speed || 10}`);
    }
    console.log('==========================================\n');

    // Return success (no response body needed for logging)
    return res.status(200).json({
      error: false,
      message: 'Character selection logged',
    });
  } catch (error) {
    // Don't throw errors for logging - just log and return success
    console.error('Error logging character selection:', error);
    return res.status(200).json({
      error: false,
      message: 'Logging attempted',
    });
  }
}

// Vercel serverless function handler
export default asyncHandler(async (req, res) => {
  // Apply CORS
  corsMiddleware(req, res, async () => {
    try {
      await logCharacterSelectedHandler(req, res);
    } catch (error) {
      // Silently handle errors for logging endpoint
      errorHandler(error, req, res, () => {});
    }
  });
});

