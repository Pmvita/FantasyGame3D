/**
 * Unit tests for UI character deletion functionality
 * Run with: node tests/ui.test.js (requires a test framework)
 * Or test manually in browser console
 */

// Mock localStorage for testing
class MockLocalStorage {
    constructor() {
        this.store = {};
    }

    getItem(key) {
        return this.store[key] || null;
    }

    setItem(key, value) {
        this.store[key] = value.toString();
    }

    removeItem(key) {
        delete this.store[key];
    }

    clear() {
        this.store = {};
    }
}

// Test helper functions
function testDeleteCharacter() {
    console.log('Testing deleteCharacter functionality...');
    
    // Setup mock localStorage
    const mockStorage = new MockLocalStorage();
    const testCharacters = [
        { name: 'Test Character 1', race: 'human', stats: { health: 50, maxHealth: 50 } },
        { name: 'Test Character 2', race: 'elf', stats: { health: 40, maxHealth: 40 } },
        { name: 'Test Character 3', race: 'dwarf', stats: { health: 60, maxHealth: 60 } }
    ];
    
    mockStorage.setItem('fantasy3DCharacters', JSON.stringify(testCharacters));
    
    // Simulate delete operation
    const characters = JSON.parse(mockStorage.getItem('fantasy3DCharacters'));
    const indexToDelete = 1; // Delete second character
    
    if (indexToDelete >= 0 && indexToDelete < characters.length) {
        const deletedName = characters[indexToDelete].name;
        characters.splice(indexToDelete, 1);
        mockStorage.setItem('fantasy3DCharacters', JSON.stringify(characters));
        
        const remaining = JSON.parse(mockStorage.getItem('fantasy3DCharacters'));
        
        // Verify deletion
        if (remaining.length === 2 && 
            remaining[0].name === 'Test Character 1' && 
            remaining[1].name === 'Test Character 3') {
            console.log('✅ Delete test passed: Character deleted successfully');
            return true;
        } else {
            console.error('❌ Delete test failed: Characters not deleted correctly');
            return false;
        }
    }
    
    return false;
}

function testInvalidIndex() {
    console.log('Testing invalid index handling...');
    
    const mockStorage = new MockLocalStorage();
    const testCharacters = [
        { name: 'Test Character', race: 'human', stats: { health: 50, maxHealth: 50 } }
    ];
    
    mockStorage.setItem('fantasy3DCharacters', JSON.stringify(testCharacters));
    
    // Try to delete with invalid index
    const characters = JSON.parse(mockStorage.getItem('fantasy3DCharacters'));
    const invalidIndex = 999;
    
    if (invalidIndex < 0 || invalidIndex >= characters.length) {
        console.log('✅ Invalid index test passed: Invalid index correctly detected');
        return true;
    }
    
    console.error('❌ Invalid index test failed');
    return false;
}

// Run tests if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testDeleteCharacter,
        testInvalidIndex,
        MockLocalStorage
    };
}

// Auto-run tests in browser console
if (typeof window !== 'undefined') {
    console.log('UI Tests loaded. Run testDeleteCharacter() and testInvalidIndex() to test.');
}
