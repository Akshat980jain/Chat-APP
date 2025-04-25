const mongoose = require('mongoose');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
require('dotenv').config();

// Fix for mongoose deprecation warning
mongoose.set('strictQuery', false);

// MongoDB connection
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    const connString = process.env.MONGO_URI || 'mongodb://localhost:27017/chatapp';
    console.log(`Connection string: ${connString}`);
    
    const conn = await mongoose.connect(connString, {
      useNewUrlParser: true,       // Fix for deprecation warning
      useUnifiedTopology: true,    // Fix for deprecation warning
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error(error);
    return false;
  }
};

// Clear database
const clearDatabase = async () => {
  let connection = false;
  
  try {
    console.log('Starting database cleanup process...');
    
    connection = await connectDB();
    if (!connection) {
      console.error('Failed to connect to the database. Aborting cleanup.');
      process.exit(1);
    }
    
    console.log('Connection successful, proceeding with cleanup...');
    
    const deleteOperations = [];
    
    try {
      console.log('Deleting all existing messages...');
      const messagesResult = await Message.deleteMany({});
      console.log(`Deleted ${messagesResult.deletedCount} messages`);
      deleteOperations.push(`${messagesResult.deletedCount} messages`);
    } catch (err) {
      console.error(`Error deleting messages: ${err.message}`);
    }
    
    try {
      console.log('Deleting all existing chats...');
      const chatsResult = await Chat.deleteMany({});
      console.log(`Deleted ${chatsResult.deletedCount} chats`);
      deleteOperations.push(`${chatsResult.deletedCount} chats`);
    } catch (err) {
      console.error(`Error deleting chats: ${err.message}`);
    }
    
    try {
      console.log('Deleting all existing users...');
      const usersResult = await User.deleteMany({});
      console.log(`Deleted ${usersResult.deletedCount} users`);
      deleteOperations.push(`${usersResult.deletedCount} users`);
    } catch (err) {
      console.error(`Error deleting users: ${err.message}`);
    }
    
    console.log('\nDatabase cleanup summary:');
    deleteOperations.forEach(op => console.log(`- Deleted ${op}`));
    console.log('\nDatabase cleanup completed!');
    console.log('All users, chats, and messages have been removed.');
    
    // Close the connection properly
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed.');
    
    process.exit(0);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    console.error(error);
    
    // Try to close the connection if it's open
    try {
      if (connection && mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
      }
    } catch (err) {
      console.error('Error closing MongoDB connection:', err);
    }
    
    process.exit(1);
  }
};

// Handle promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Close mongoose connection before exiting
  mongoose.connection.close().then(() => {
    process.exit(1);
  });
});

// Run the clear function
clearDatabase(); 