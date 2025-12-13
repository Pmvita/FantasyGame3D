// Authentication API calls
// Following node-express.mdc error handling best practices

import { post, get, setToken, removeToken } from './client.js';

/**
 * Register a new user
 * @param {string} username - Username
 * @param {string} email - Email (optional)
 * @param {string} password - Password
 * @returns {Promise<Object>} Response with token and user data
 */
export async function register(username, email, password) {
  try {
    const response = await post('/api/auth/register', {
      username,
      email: email || null,
      password,
    });

    if (response.error) {
      throw new Error(response.message || 'Registration failed');
    }

    // Store token
    if (response.data && response.data.token) {
      setToken(response.data.token);
    }

    return response.data;
  } catch (error) {
    removeToken();
    throw error;
  }
}

/**
 * Login user
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<Object>} Response with token and user data
 */
export async function login(username, password) {
  try {
    const response = await post('/api/auth/login', {
      username,
      password,
    });

    if (response.error) {
      throw new Error(response.message || 'Login failed');
    }

    // Store token
    if (response.data && response.data.token) {
      setToken(response.data.token);
    }

    return response.data;
  } catch (error) {
    removeToken();
    throw error;
  }
}

/**
 * Verify JWT token
 * @returns {Promise<Object>} User data if token is valid
 */
export async function verifyToken() {
  try {
    const response = await get('/api/auth/verify');

    if (response.error) {
      removeToken();
      throw new Error(response.message || 'Token verification failed');
    }

    // The API returns { userId, username, role } directly in data
    // Wrap it in a user object for consistency with other auth responses
    if (response.data) {
      return {
        user: {
          userId: response.data.userId,
          username: response.data.username,
          role: response.data.role || 'user',
        },
        // Also include direct access for backward compatibility
        userId: response.data.userId,
        username: response.data.username,
        role: response.data.role || 'user',
      };
    }

    return response.data;
  } catch (error) {
    removeToken();
    throw error;
  }
}

/**
 * Logout user (clear token)
 */
export function logout() {
  removeToken();
}

