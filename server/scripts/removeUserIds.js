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

// Remove user IDs (this technically isn't possible without deleting users because _id is immutable)
// Instead, we'll replace users with new users that have the same data except IDs
const removeUserIds = async () => {
  try {
    console.log('Starting user ID removal process...');
    
    const connected = await connectDB();
    if (!connected) {
      console.error('Failed to connect to the database. Aborting process.');
      process.exit(1);
    }
    
    console.log('Connection successful, proceeding with user ID removal...');
    
    try {
      // First, get all existing users
      const existingUsers = await User.find({});
      console.log(`Found ${existingUsers.length} users in the database`);
      
      if (existingUsers.length === 0) {
        console.log('No users to process. Database is already empty.');
        return;
      }
      
      // Create a backup of user data
      console.log('Creating backup of user data...');
      const userData = existingUsers.map(user => ({
        name: user.name,
        email: user.email,
        password: user.password, // Already hashed
        phoneNumber: user.phoneNumber || '',
        profilePicture: user.profilePicture || '',
        status: user.status || 'Hey there! I am using Chat App',
        lastSeen: user.lastSeen || new Date(),
        isOnline: user.isOnline || false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));
      
      // Delete all existing users to remove their IDs
      console.log('Deleting existing users...');
      const deleteResult = await User.deleteMany({});
      console.log(`Deleted ${deleteResult.deletedCount} users`);
      
      // Create new users with the same data (but new IDs)
      console.log('Creating new users with same data but new IDs...');
      const insertResult = await User.insertMany(userData);
      console.log(`Created ${insertResult.length} new users with fresh IDs`);
      
      // Display the new user IDs
      console.log('New user IDs:');
      insertResult.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}): ${user._id}`);
      });
      
      console.log('\nWARNING: Since user IDs have changed, relationships in chats and messages will be broken.');
      console.log('You will need to reset chats and messages as well for the application to work properly.');
      console.log('Consider using the clearDatabase.js script to completely reset the database instead.');
      
    } catch (err) {
      console.error(`Error processing users: ${err.message}`);
    }
    
    console.log('User ID removal process completed.');
    
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    
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
removeUserIds(); 