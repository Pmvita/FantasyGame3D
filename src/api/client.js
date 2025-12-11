// Centralized API client with JWT token management
// Following node-express.mdc error handling best practices

// API base URL - use relative path for same-domain, or full URL for different domain
// In production on Vercel, API and frontend are on same domain, so use relative paths
const API_BASE_URL = '';

/**
 * Get stored JWT token from localStorage
 */
function getToken() {
  return localStorage.getItem('fantasy3DToken');
}

/**
 * Store JWT token in localStorage
 */
function setToken(token) {
  localStorage.setItem('fantasy3DToken', token);
}

/**
 * Remove JWT token from localStorage
 */
function removeToken() {
  localStorage.removeItem('fantasy3DToken');
}

/**
 * Make API request with automatic token attachment
 * @param {string} endpoint - API endpoint (e.g., '/api/auth/login')
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Add Authorization header if token exists
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  // Add body if provided
  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);

    // Parse JSON response
    const data = await response.json();

    // Handle non-2xx status codes
    if (!response.ok) {
      // If token is invalid, clear it
      if (response.status === 401) {
        removeToken();
        // Redirect to login if we're not already there
        if (!window.location.pathname.includes('login')) {
          window.location.reload();
        }
      }

      throw new Error(data.message || `API error: ${response.status}`);
    }

    return data;
  } catch (error) {
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
}

/**
 * GET request
 */
export async function get(endpoint) {
  return apiRequest(endpoint, { method: 'GET' });
}

/**
 * POST request
 */
export async function post(endpoint, body) {
  return apiRequest(endpoint, {
    method: 'POST',
    body,
  });
}

/**
 * PUT request
 */
export async function put(endpoint, body) {
  return apiRequest(endpoint, {
    method: 'PUT',
    body,
  });
}

/**
 * DELETE request
 */
export async function del(endpoint) {
  return apiRequest(endpoint, { method: 'DELETE' });
}

// Export token management functions
export { getToken, setToken, removeToken };

