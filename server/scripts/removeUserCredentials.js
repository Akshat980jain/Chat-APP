const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
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

// Remove user credentials
const removeUserCredentials = async () => {
  try {
    console.log('Starting user credentials removal process...');
    
    const connected = await connectDB();
    if (!connected) {
      console.error('Failed to connect to the database. Aborting process.');
      process.exit(1);
    }
    
    console.log('Connection successful, proceeding with credential removal...');
    
    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users in the database`);
    
    if (users.length === 0) {
      console.log('No users found in the database.');
      console.log('Nothing to do. Exiting.');
      await mongoose.connection.close();
      process.exit(0);
    }
    
    // Create a placeholder password (this will be unusable for login)
    const salt = await bcrypt.genSalt(10);
    const placeholderPassword = await bcrypt.hash('CREDENTIALS_REMOVED_' + Date.now(), salt);
    
    // Update all users to remove their credentials
    const updateResult = await User.updateMany(
      {}, // match all users
      { 
        $set: { 
          password: placeholderPassword,
          // Also flag account as requiring password reset, if your app supports this
          passwordResetRequired: true
        } 
      }
    );
    
    console.log(`Updated ${updateResult.modifiedCount} users - credentials removed`);
    console.log('All user passwords have been reset to unusable values.');
    console.log('Users will need to reset their passwords to access their accounts again.');
    
    // Get list of affected users for admin reference
    const affectedUsers = await User.find({}, 'name email').sort('name');
    console.log('\nAffected users:');
    affectedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
    });
    
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
removeUserCredentials(); 