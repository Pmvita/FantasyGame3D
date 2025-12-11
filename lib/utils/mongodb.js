// MongoDB connection utility with connection pooling
// Following node-express.mdc best practices for database integration

import { MongoClient } from 'mongodb';

let client = null;
let db = null;

/**
 * Get or create MongoDB connection
 * Uses connection pooling for optimal performance
 */
export async function getMongoClient() {
  if (client) {
    return client;
  }

  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    client = new MongoClient(uri, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    await client.connect();
    console.log('Connected to MongoDB');
    
    return client;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    client = null;
    throw error;
  }
}

/**
 * Get database instance
 */
export async function getDatabase() {
  if (db) {
    return db;
  }

  const client = await getMongoClient();
  db = client.db('fantasy3d');
  return db;
}

/**
 * Get collection by name
 */
export async function getCollection(collectionName) {
  const database = await getDatabase();
  return database.collection(collectionName);
}

/**
 * Close MongoDB connection (for cleanup)
 */
export async function closeConnection() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed');
  }
}

