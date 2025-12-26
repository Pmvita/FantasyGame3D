// Script to update admin character stats
// Usage: MONGODB_URI="your-connection-string" node scripts/update-admin-character.js
//
// This script updates the admin user's character to have:
// - Level: 1000
// - Health: 1000
// - Max Health: 1000
// - Mana: 800 (using magic stat)
// - Strength: 500
// - Speed: 500
// - Defense: appropriate value

import { getCollection, closeConnection } from '../lib/utils/mongodb.js';
import { ObjectId } from 'mongodb';

const ADMIN_USER_ID = '693b46a2f8c43c215288f946'; // pmvita admin user ID

async function updateAdminCharacter() {
  try {
    console.log('🔍 Looking for admin character...');
    
    const charactersCollection = await getCollection('characters');
    
    // Find all characters for the admin user
    const characters = await charactersCollection
      .find({ userId: new ObjectId(ADMIN_USER_ID) })
      .toArray();
    
    if (characters.length === 0) {
      console.log('❌ No characters found for admin user');
      console.log('   User ID:', ADMIN_USER_ID);
      await closeConnection();
      return;
    }
    
    console.log(`✅ Found ${characters.length} character(s) for admin user`);
    
    // Update all characters (or you can specify which one)
    for (const char of characters) {
      console.log(`\n📝 Updating character: ${char.name} (${char._id})`);
      console.log('   Current stats:', JSON.stringify(char.stats, null, 2));
      
      // Update character with new stats
      const updatedStats = {
        level: 1000,
        health: 1000,
        maxHealth: 1000,
        strength: 500,
        magic: 800, // Mana is represented by magic stat
        speed: 500,
        defense: char.stats?.defense || 100 // Keep existing defense or default to 100
      };
      
      // Preserve other stats if they exist
      const finalStats = {
        ...char.stats,
        ...updatedStats
      };
      
      const result = await charactersCollection.updateOne(
        { _id: char._id },
        { 
          $set: { 
            stats: finalStats,
            updatedAt: new Date()
          } 
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log('   ✅ Character updated successfully!');
        console.log('   New stats:', JSON.stringify(finalStats, null, 2));
      } else {
        console.log('   ⚠️  No changes made (stats may already be correct)');
      }
    }
    
    console.log('\n✅ Update complete!');
    await closeConnection();
  } catch (error) {
    console.error('❌ Error updating admin character:', error);
    await closeConnection();
    process.exit(1);
  }
}

updateAdminCharacter();

