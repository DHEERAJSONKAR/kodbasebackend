const mongoose = require('mongoose');
const connectDB = require('../config/db');

async function fixIndexes() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    // Find the users collection
    const usersCollection = collections.find(c => c.name === 'users');
    
    if (usersCollection) {
      // Get all indexes on the users collection
      const indexes = await db.collection('users').indexes();
      console.log('Current indexes:', indexes);

      // Drop any problematic indexes
      try {
        // Try to drop each social auth index
        await db.collection('users').dropIndex('githubId_1');
        console.log('Dropped githubId index');
      } catch (err) {
        console.log('No githubId index to drop or error dropping:', err.message);
      }

      try {
        await db.collection('users').dropIndex('googleId_1');
        console.log('Dropped googleId index');
      } catch (err) {
        console.log('No googleId index to drop or error dropping:', err.message);
      }

      try {
        await db.collection('users').dropIndex('facebookId_1');
        console.log('Dropped facebookId index');
      } catch (err) {
        console.log('No facebookId index to drop or error dropping:', err.message);
      }
      
      // Show the updated indexes
      console.log('Updated indexes:');
      const updatedIndexes = await db.collection('users').indexes();
      console.log(updatedIndexes);
    }

    console.log('Index fix complete');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing MongoDB indexes:', error);
    process.exit(1);
  }
}

fixIndexes();
