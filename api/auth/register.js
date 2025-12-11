// User registration endpoint
// Following node-express.mdc and nodejs-mongodb-jwt rules

import { getCollection } from '../../lib/utils/mongodb.js';
import { generateToken } from '../../lib/utils/jwt.js';
import { validateUsername, validateEmail, validatePassword } from '../../lib/utils/validation.js';
import { ValidationError, ConflictError, DatabaseError } from '../../lib/utils/errors.js';
import { asyncHandler, errorHandler } from '../../lib/middleware/errorHandler.js';
import { corsMiddleware } from '../../lib/middleware/cors.js';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

async function registerHandler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: true,
      message: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED',
    });
  }

  try {
    const { username, email, password } = req.body;

    // Validate input
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      throw new ValidationError(usernameValidation.error);
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      throw new ValidationError(emailValidation.error);
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      throw new ValidationError(passwordValidation.error);
    }

    const usersCollection = await getCollection('users');

    // Check if username already exists
    const existingUser = await usersCollection.findOne({ 
      username: username.trim().toLowerCase() 
    });

    if (existingUser) {
      throw new ConflictError('Username already taken');
    }

    // Check if email already exists (if provided)
    if (email && email.trim()) {
      const existingEmail = await usersCollection.findOne({ 
        email: email.trim().toLowerCase() 
      });

      if (existingEmail) {
        throw new ConflictError('Email already registered');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user document
    const userDoc = {
      username: username.trim().toLowerCase(),
      email: email && email.trim() ? email.trim().toLowerCase() : null,
      passwordHash,
      createdAt: new Date(),
      lastLogin: null,
    };

    // Insert user
    const result = await usersCollection.insertOne(userDoc);

    if (!result.insertedId) {
      throw new DatabaseError('Failed to create user');
    }

    // Generate JWT token (new users default to 'user' role)
    const token = generateToken({
      userId: result.insertedId.toString(),
      username: userDoc.username,
      role: 'user', // New users default to 'user' role
    });

    // Return success response
    return res.status(201).json({
      error: false,
      message: 'User created successfully',
      data: {
        token,
        user: {
          id: result.insertedId.toString(),
          username: userDoc.username,
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
      await registerHandler(req, res);
    } catch (error) {
      errorHandler(error, req, res, () => {});
    }
  });
});

