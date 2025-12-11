// Custom error classes for API error handling
// Following node-express.mdc error handling best practices

/**
 * Base API Error class
 */
export class ApiError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: true,
      message: this.message,
      code: this.code,
      ...(Object.keys(this.details).length > 0 && { details: this.details }),
    };
  }
}

/**
 * Validation Error (400)
 */
export class ValidationError extends ApiError {
  constructor(message, details = {}) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * Authentication Error (401)
 */
export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * Authorization Error (403)
 */
export class AuthorizationError extends ApiError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends ApiError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends ApiError {
  constructor(message, details = {}) {
    super(message, 409, 'CONFLICT', details);
  }
}

/**
 * Database Error (500)
 */
export class DatabaseError extends ApiError {
  constructor(message = 'Database operation failed', details = {}) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

