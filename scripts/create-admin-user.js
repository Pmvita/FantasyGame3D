// Script to create admin user in MongoDB
// Usage: MONGODB_URI="your-connection-string" node scripts/create-admin-user.js
//
// This script creates or updates a user to have admin role.
// Admin users are stored in the 'fantasy3d' database, 'users' collection.

import bcrypt from 'bcryptjs';
import { getCollection, closeConnection } from '../lib/utils/mongodb.js';

const SALT_ROUNDS = 10;

async function createAdminUser() {
  try {
    // Configuration - Update these values as needed
    const username = 'pmvita';
    const password = 'admin123';
    const email = 'petermvita@hotmail.com';
    const role = 'admin';

    console.log('Creating/updating admin user...');

    const usersCollection = await getCollection('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ 
      username: username.toLowerCase() 
    });

    if (existingUser) {
      console.log('User already exists. Updating to admin role...');
      
      // Update existing user to admin role
      await usersCollection.updateOne(
        { username: username.toLowerCase() },
        { 
          $set: { 
            role: 'admin',
            updatedAt: new Date()
          } 
        }
      );
      
      console.log('✅ Admin user role updated successfully');
      console.log(`   Username: ${username}`);
      console.log(`   Role: ${role}`);
      await closeConnection();
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create admin user document
    const adminUser = {
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash,
      role: 'admin',
      createdAt: new Date(),
      lastLogin: null,
    };

    // Insert admin user
    const result = await usersCollection.insertOne(adminUser);

    if (!result.insertedId) {
      throw new Error('Failed to create admin user');
    }

    console.log('✅ Admin user created successfully!');
    console.log(`   Username: ${username}`);
    console.log(`   Role: ${role}`);
    console.log(`   User ID: ${result.insertedId}`);

    await closeConnection();
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    await closeConnection();
    process.exit(1);
  }
}

// Run the script
createAdminUser();
