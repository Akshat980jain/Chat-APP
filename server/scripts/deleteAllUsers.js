const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// MongoDB connection
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log(`Connection string: ${process.env.MONGO_URI || 'mongodb://localhost:27017/chatapp'}`);
    
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chatapp');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error(error);
    return false;
  }
};

// Delete all users
const deleteAllUsers = async () => {
  try {
    console.log('Starting user deletion process...');
    
    const connected = await connectDB();
    if (!connected) {
      console.error('Failed to connect to the database. Aborting process.');
      process.exit(1);
    }
    
    console.log('Connection successful, proceeding with user deletion...');
    
    // Find all users first to get a count and backup basic info
    const users = await User.find({}, 'name email');
    const userCount = users.length;
    console.log(`Found ${userCount} users in the database`);
    
    if (userCount === 0) {
      console.log('No users found in the database.');
      console.log('Nothing to do. Exiting.');
      await mongoose.connection.close();
      process.exit(0);
    }
    
    // Backup user info to a log
    console.log('\nDeleting the following users:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
    });
    
    // Delete all users
    const deleteResult = await User.deleteMany({});
    console.log(`\nDeleted ${deleteResult.deletedCount} users from the database`);
    
    console.log('\nWARNING: All user accounts have been removed.');
    console.log('Chats and messages may still exist but will have broken references.');
    console.log('Consider using the clearDatabase.js script to remove all related data if needed.');
    
    // Close the connection
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed.');
    
    process.exit(0);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    console.error(error);
    
    // Try to close the connection if it's open
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
      }
    } catch (err) {
      console.error('Error closing MongoDB connection:', err);
    }
    
    process.exit(1);
  }
};

// Run the function
deleteAllUsers(); 