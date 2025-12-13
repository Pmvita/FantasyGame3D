// Character CRUD API calls
// Following node-express.mdc error handling best practices

import { get, post, put, del } from './client.js';

/**
 * Get all characters for the current user
 * @returns {Promise<Array>} Array of character objects
 */
export async function getCharacters() {
  try {
    const response = await get('/api/characters/get');

    if (response.error) {
      throw new Error(response.message || 'Failed to fetch characters');
    }

    return response.data.characters || [];
  } catch (error) {
    console.error('Error fetching characters:', error);
    throw error;
  }
}

/**
 * Create a new character
 * @param {Object} characterData - Character data
 * @returns {Promise<Object>} Created character object
 */
export async function createCharacter(characterData) {
  try {
    const response = await post('/api/characters/create', characterData);

    if (response.error) {
      throw new Error(response.message || 'Failed to create character');
    }

    return response.data.character;
  } catch (error) {
    console.error('Error creating character:', error);
    throw error;
  }
}

/**
 * Update an existing character
 * @param {string} characterId - Character ID
 * @param {Object} characterData - Updated character data
 * @returns {Promise<Object>} Updated character object
 */
export async function updateCharacter(characterId, characterData) {
  try {
    const response = await put(`/api/characters/update?id=${characterId}`, characterData);

    if (response.error) {
      throw new Error(response.message || 'Failed to update character');
    }

    return response.data.character;
  } catch (error) {
    console.error('Error updating character:', error);
    throw error;
  }
}

/**
 * Delete a character
 * @param {string} characterId - Character ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export async function deleteCharacter(characterId) {
  try {
    const response = await del(`/api/characters/delete?id=${characterId}`);

    if (response.error) {
      throw new Error(response.message || 'Failed to delete character');
    }

    return response.data;
  } catch (error) {
    console.error('Error deleting character:', error);
    throw error;
  }
}

/**
 * Delete a character by name (finds the character first, then deletes it)
 * @param {string} characterName - Character name
 * @returns {Promise<Object>} Deletion confirmation
 */
export async function deleteCharacterByName(characterName) {
  try {
    // First, get all characters to find the one with matching name
    const characters = await getCharacters();
    const character = characters.find(char => char.name === characterName);
    
    if (!character) {
      throw new Error(`Character with name "${characterName}" not found`);
    }

    // Delete using the found character's ID
    return await deleteCharacter(character.id || character._id);
  } catch (error) {
    console.error('Error deleting character by name:', error);
    throw error;
  }
}

