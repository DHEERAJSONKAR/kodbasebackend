const mongoose = require('mongoose');
const connectDB = require('../config/db');

async function fixIndexes() {
  try {
    await connectDB();
    console.log('Connected to MongoDB for index fix');

    // Drop the problematic index
    const db = mongoose.connection.db;
    await db.collection('users').dropIndex('githubId_1');
    console.log('Successfully dropped the problematic githubId index');
    
    // You may need to drop other indexes if they're causing problems
    // await db.collection('users').dropIndex('googleId_1');
    // await db.collection('users').dropIndex('facebookId_1');
    
    console.log('Index fix complete. The application should now work correctly.');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing indexes:', error);
    process.exit(1);
  }
}

fixIndexes();
