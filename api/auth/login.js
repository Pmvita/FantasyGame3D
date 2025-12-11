// User login endpoint
// Following node-express.mdc and nodejs-mongodb-jwt rules

import { getCollection } from '../utils/mongodb.js';
import { generateToken } from '../utils/jwt.js';
import { validateUsername, validatePassword } from '../utils/validation.js';
import { ValidationError, AuthenticationError, DatabaseError } from '../utils/errors.js';
import { asyncHandler, errorHandler } from '../middleware/errorHandler.js';
import { corsMiddleware } from '../middleware/cors.js';
import bcrypt from 'bcryptjs';

async function loginHandler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: true,
      message: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED',
    });
  }

  try {
    const { username, password } = req.body;

    // Validate input
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      throw new ValidationError(usernameValidation.error);
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      throw new ValidationError(passwordValidation.error);
    }

    const usersCollection = await getCollection('users');

    // Find user by username (case-insensitive)
    const user = await usersCollection.findOne({
      username: username.trim().toLowerCase(),
    });

    if (!user) {
      throw new AuthenticationError('Invalid username or password');
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      throw new AuthenticationError('Invalid username or password');
    }

    // Update last login
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      username: user.username,
    });

    // Return success response
    return res.status(200).json({
      error: false,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id.toString(),
          username: user.username,
        },
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
      await loginHandler(req, res);
    } catch (error) {
      errorHandler(error, req, res, () => {});
    }
  });
});

