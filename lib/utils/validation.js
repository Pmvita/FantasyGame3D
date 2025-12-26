// Input validation utilities
// Following node-express.mdc security and validation best practices

/**
 * Validate username
 * @param {string} username - Username to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' };
  }

  const trimmed = username.trim();

  if (trimmed.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }

  if (trimmed.length > 20) {
    return { valid: false, error: 'Username must be at most 20 characters' };
  }

  // Alphanumeric and underscore only
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }

  return { valid: true };
}

/**
 * Validate email (optional)
 * @param {string} email - Email to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateEmail(email) {
  if (!email || email.trim() === '') {
    return { valid: true }; // Email is optional
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
}

/**
 * Validate password
 * @param {string} password - Password to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' };
  }

  if (password.length > 100) {
    return { valid: false, error: 'Password must be at most 100 characters' };
  }

  return { valid: true };
}

/**
 * Validate character data
 * @param {Object} characterData - Character data to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateCharacterData(characterData) {
  if (!characterData || typeof characterData !== 'object') {
    return { valid: false, error: 'Character data is required' };
  }

  if (!characterData.name || typeof characterData.name !== 'string' || characterData.name.trim().length === 0) {
    return { valid: false, error: 'Character name is required' };
  }

  if (characterData.name.trim().length > 50) {
    return { valid: false, error: 'Character name must be at most 50 characters' };
  }

  const validRaces = ['human', 'elf', 'dwarf', 'demon'];
  if (!characterData.race || !validRaces.includes(characterData.race)) {
    return { valid: false, error: 'Invalid race. Must be one of: ' + validRaces.join(', ') };
  }

  const validGenders = ['male', 'female'];
  if (!characterData.gender || !validGenders.includes(characterData.gender)) {
    return { valid: false, error: 'Invalid gender. Must be one of: ' + validGenders.join(', ') };
  }

  // Validate stats
  if (!characterData.stats || typeof characterData.stats !== 'object') {
    return { valid: false, error: 'Character stats are required' };
  }

  const requiredStats = ['health', 'maxHealth', 'strength', 'magic', 'speed', 'defense'];
  for (const stat of requiredStats) {
    if (typeof characterData.stats[stat] !== 'number' || characterData.stats[stat] < 0) {
      return { valid: false, error: `Invalid ${stat} value` };
    }
  }

  // Validate level if present (level is optional but should be validated if provided)
  if (characterData.stats.level !== undefined) {
    if (typeof characterData.stats.level !== 'number' || characterData.stats.level < 1) {
      return { valid: false, error: 'Level must be a number greater than or equal to 1' };
    }
  }

  return { valid: true };
}

/**
 * Get maximum level based on user role
 * @param {string} role - User role ('admin' or 'user')
 * @returns {number} Maximum level allowed
 */
export function getMaxLevel(role) {
  if (role === 'admin') {
    return 1000;
  }
  return 500; // Regular users max level
}

/**
 * Cap character level based on user role
 * @param {number} level - Character level
 * @param {string} role - User role ('admin' or 'user')
 * @returns {number} Capped level
 */
export function capLevel(level, role) {
  const maxLevel = getMaxLevel(role);
  if (level > maxLevel) {
    return maxLevel;
  }
  if (level < 1) {
    return 1;
  }
  return level;
}

/**
 * Sanitize string input (prevent XSS)
 * @param {string} input - String to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
}

