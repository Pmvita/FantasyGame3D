// Centralized error handler middleware
// Following node-express.mdc error handling best practices

import { ApiError } from '../utils/errors.js';

/**
 * Centralized error handler middleware
 * Catches all errors and formats consistent error responses
 */
export function errorHandler(err, req, res, next) {
  // Log error for debugging
  console.error('API Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // If it's already an ApiError, use its status code and format
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      error: true,
      message: `${field} already exists`,
      code: 'DUPLICATE_ERROR',
    });
  }

  // Handle MongoDB validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: true,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.errors || {},
    });
  }

  // Default to 500 server error
  return res.status(500).json({
    error: true,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    code: 'INTERNAL_ERROR',
  });
}

/**
 * Async handler wrapper to catch async errors
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

