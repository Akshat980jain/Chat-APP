const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Fix for mongoose deprecation warning
mongoose.set('strictQuery', false);

// Get command line arguments
const args = process.argv.slice(2);
const command = args[0];
const options = args.slice(1);

// MongoDB connection with proper options
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    const connString = process.env.MONGO_URI || 'mongodb://localhost:27017/chatapp';
    console.log(`Connection string: ${connString}`);
    
    const conn = await mongoose.connect(connString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error(error);
    return false;
  }
};

// Sample users to add
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    phoneNumber: '123-456-7890',
    profilePicture: 'https://ui-avatars.com/api/?name=Admin+User&background=128C7E&color=fff',
    status: 'Welcome to the Chat App!'
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    phoneNumber: '111-222-3333',
    profilePicture: 'https://ui-avatars.com/api/?name=John+Doe&background=random',
    status: 'Hey there! I am using Chat App'
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    phoneNumber: '444-555-6666',
    profilePicture: 'https://ui-avatars.com/api/?name=Jane+Smith&background=random',
    status: 'Available'
  },
  {
    name: 'Mike Johnson',
    email: 'mike@example.com',
    password: 'password123',
    phoneNumber: '777-888-9999',
    profilePicture: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=random',
    status: 'Busy at work'
  }
];

// Clear database
const clearDatabase = async () => {
  console.log('\n--- CLEARING DATABASE ---');
  
  try {
    const deleteOperations = [];
    
    try {
      console.log('Deleting all messages...');
      const messagesResult = await Message.deleteMany({});
      console.log(`Deleted ${messagesResult.deletedCount} messages`);
      deleteOperations.push(`${messagesResult.deletedCount} messages`);
    } catch (err) {
      console.error(`Error deleting messages: ${err.message}`);
    }
    
    try {
      console.log('Deleting all chats...');
      const chatsResult = await Chat.deleteMany({});
      console.log(`Deleted ${chatsResult.deletedCount} chats`);
      deleteOperations.push(`${chatsResult.deletedCount} chats`);
    } catch (err) {
      console.error(`Error deleting chats: ${err.message}`);
    }
    
    try {
      console.log('Deleting all users...');
      const usersResult = await User.deleteMany({});
      console.log(`Deleted ${usersResult.deletedCount} users`);
      deleteOperations.push(`${usersResult.deletedCount} users`);
    } catch (err) {
      console.error(`Error deleting users: ${err.message}`);
    }
    
    console.log('\nDatabase cleanup summary:');
    deleteOperations.forEach(op => console.log(`- Deleted ${op}`));
    console.log('\nDatabase cleared successfully!');
    
    return true;
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    return false;
  }
};

// Reset user credentials
const resetUserCredentials = async () => {
  console.log('\n--- RESETTING USER CREDENTIALS ---');
  
  try {
    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users in the database`);
    
    if (users.length === 0) {
      console.log('No users found in the database.');
      console.log('Nothing to do. Exiting.');
      return true;
    }
    
    // Create a placeholder password
    const salt = await bcrypt.genSalt(10);
    const placeholderPassword = await bcrypt.hash('CREDENTIALS_REMOVED_' + Date.now(), salt);
    
    // Update all users to remove their credentials
    const updateResult = await User.updateMany(
      {}, // match all users
      { 
        $set: { 
          password: placeholderPassword,
          passwordResetRequired: true
        } 
      }
    );
    
    console.log(`Updated ${updateResult.modifiedCount} users - credentials reset`);
    console.log('All user passwords have been reset to unusable values.');
    
    // Get list of affected users for admin reference
    const affectedUsers = await User.find({}, 'name email').sort('name');
    console.log('\nAffected users:');
    affectedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
    });
    
    return true;
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    return false;
  }
};

// Create sample data
const createSampleData = async (forceOption = false) => {
  console.log('\n--- CREATING SAMPLE DATA ---');
  
  try {
    // Check if there are existing users
    const existingUserCount = await User.countDocuments({});
    if (existingUserCount > 0 && !forceOption) {
      console.log(`Warning: There are already ${existingUserCount} users in the database.`);
      console.log('This operation will add more sample data on top of existing data.');
      console.log('If you want to start fresh, run with the --clear option first.');
      console.log('Aborting operation. No changes were made.');
      return false;
    }
    
    if (existingUserCount > 0 && forceOption) {
      console.log(`Warning: There are already ${existingUserCount} users in the database.`);
      console.log('Force option detected. Continuing with sample data creation...');
    }
    
    console.log('\nCreating sample users...');
    
    // Create users with hashed passwords
    const createdUsers = [];
    
    // Use Promise.all for more efficient handling of async operations
    const userCreationPromises = sampleUsers.map(async (user) => {
      try {
        // Check if this user already exists
        const existingUser = await User.findOne({ email: user.email });
        if (existingUser) {
          console.log(`User with email ${user.email} already exists. Skipping.`);
          createdUsers.push(existingUser);
          return;
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        
        const newUser = new User({
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber || '',
          password: hashedPassword,
          profilePicture: user.profilePicture || '',
          status: user.status || 'Hey there! I am using Chat App',
          isOnline: false,
          lastSeen: new Date()
        });
        
        const savedUser = await newUser.save();
        createdUsers.push(savedUser);
        console.log(`Created user: ${savedUser.name} (${savedUser.email})`);
      } catch (err) {
        console.error(`Error creating user ${user.email}:`, err.message);
      }
    });
    
    // Wait for all user creation operations to complete
    await Promise.all(userCreationPromises);
    
    // Create some initial chats and messages
    console.log('\nCreating initial chats and welcome messages...');
    
    // Admin welcomes all users
    const adminUser = createdUsers.find(u => u.email === 'admin@example.com');
    
    if (!adminUser) {
      console.log('Admin user not found. Skipping chat creation.');
    } else {
      // Use Promise.all for chat creation too
      const chatCreationPromises = createdUsers
        .filter(user => user.email !== 'admin@example.com')
        .map(async (user) => {
          try {
            // Check if this chat already exists
            const existingChat = await Chat.findOne({
              participants: { $all: [adminUser._id, user._id] },
              isGroup: false
            });
            
            if (existingChat) {
              console.log(`Chat between Admin and ${user.name} already exists. Skipping.`);
              return;
            }
            
            // Create chat between admin and user
            const newChat = new Chat({
              participants: [adminUser._id, user._id],
              createdBy: adminUser._id,
              isGroup: false
            });
            
            const savedChat = await newChat.save();
            
            // Create welcome message
            const welcomeMessage = new Message({
              sender: adminUser._id,
              recipient: user._id,
              content: `Welcome to the Chat App, ${user.name}! You can start chatting with your friends now. Enjoy!`,
              status: 'delivered'
            });
            
            const savedMessage = await welcomeMessage.save();
            
            // Update chat with last message
            savedChat.lastMessage = savedMessage._id;
            await savedChat.save();
            
            console.log(`Created chat between Admin and ${user.name} with welcome message`);
          } catch (err) {
            console.error(`Error creating chat for ${user.name}:`, err.message);
          }
        });
      
      // Wait for all chat creation operations to complete
      await Promise.all(chatCreationPromises);
      
      // Create chat between John and Jane
      const john = createdUsers.find(u => u.email === 'john@example.com');
      const jane = createdUsers.find(u => u.email === 'jane@example.com');
      
      if (john && jane) {
        try {
          // Check if this chat already exists
          const existingChat = await Chat.findOne({
            participants: { $all: [john._id, jane._id] },
            isGroup: false
          });
          
          if (!existingChat) {
            const johnJaneChat = new Chat({
              participants: [john._id, jane._id],
              createdBy: john._id,
              isGroup: false
            });
            
            const savedChat = await johnJaneChat.save();
            
            // Create some messages
            const message1 = new Message({
              sender: john._id,
              recipient: jane._id,
              content: 'Hi Jane, how are you doing?',
              status: 'read'
            });
            
            const savedMessage1 = await message1.save();
            
            const message2 = new Message({
              sender: jane._id,
              recipient: john._id,
              content: 'Hey John! I\'m doing great, thanks for asking. How about you?',
              status: 'read'
            });
            
            const savedMessage2 = await message2.save();
            
            // Update chat with last message
            savedChat.lastMessage = savedMessage2._id;
            await savedChat.save();
            
            console.log('Created chat between John and Jane with sample messages');
          } else {
            console.log('Chat between John and Jane already exists. Skipping.');
          }
        } catch (err) {
          console.error('Error creating John-Jane chat:', err.message);
        }
      }
    }
    
    console.log('\nSample data creation completed successfully!');
    console.log(`Created ${createdUsers.length} users`);
    
    console.log('\nLogin credentials for sample users:');
    sampleUsers.forEach(user => {
      console.log(`- ${user.name}: Email: ${user.email}, Password: ${user.password}`);
    });
    
    // Save credentials to a file for reference
    try {
      const credentialsFile = path.join(__dirname, 'sample_credentials.txt');
      let content = 'SAMPLE USER CREDENTIALS\n=====================\n\n';
      sampleUsers.forEach(user => {
        content += `${user.name}:\n`;
        content += `  Email: ${user.email}\n`;
        content += `  Password: ${user.password}\n`;
        content += `  Phone: ${user.phoneNumber}\n\n`;
      });
      fs.writeFileSync(credentialsFile, content);
      console.log(`\nCredentials also saved to: ${credentialsFile}`);
    } catch (err) {
      console.error('Could not save credentials to file:', err.message);
    }
    
    return true;
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    return false;
  }
};

// Export user data
const exportUsers = async () => {
  console.log('\n--- EXPORTING USER DATA ---');
  
  try {
    // Find all users
    const users = await User.find({}).lean();
    console.log(`Found ${users.length} users in the database`);
    
    if (users.length === 0) {
      console.log('No users found in the database.');
      console.log('Nothing to export. Exiting.');
      return true;
    }
    
    // Prepare data for export (remove sensitive fields)
    const exportData = users.map(user => {
      const { password, __v, ...safeUser } = user;
      return safeUser;
    });
    
    // Save to file
    const exportFile = path.join(__dirname, 'user_export.json');
    fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2));
    console.log(`\nExported ${users.length} users to: ${exportFile}`);
    
    return true;
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    return false;
  }
};

// Main function to orchestrate operations
const main = async () => {
  let connection = false;
  
  try {
    if (!command) {
      showHelp();
      process.exit(0);
    }
    
    connection = await connectDB();
    if (!connection) {
      console.error('Failed to connect to the database. Aborting process.');
      process.exit(1);
    }
    
    let result = false;
    
    switch (command) {
      case 'clear':
        result = await clearDatabase();
        break;
      case 'create-sample':
        result = await createSampleData(options.includes('--force'));
        break;
      case 'reset-credentials':
        result = await resetUserCredentials();
        break;
      case 'export':
        result = await exportUsers();
        break;
      case 'clear-and-create':
        await clearDatabase();
        result = await createSampleData(true);
        break;
      default:
        console.log('Unknown command:', command);
        showHelp();
        break;
    }
    
    // Close the connection properly
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed.');
    
    if (result) {
      console.log('\nOperation completed successfully!');
      process.exit(0);
    } else {
      console.log('\nOperation completed with errors or was aborted.');
      process.exit(1);
    }
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

// Show help message
function showHelp() {
  console.log(`
Database Management Script
=========================

Usage: node manageUsers.js [command] [options]

Commands:
  clear              - Remove all users, chats, and messages from the database
  create-sample      - Create sample users and chat data
  reset-credentials  - Reset all user passwords to unusable values
  export             - Export user data to a JSON file
  clear-and-create   - Clear the database and create sample data

Options:
  --force            - Force operation even if data exists

Examples:
  node manageUsers.js clear
  node manageUsers.js create-sample
  node manageUsers.js create-sample --force
  node manageUsers.js reset-credentials
  node manageUsers.js export
  node manageUsers.js clear-and-create
  `);
}

// Handle promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Close mongoose connection before exiting
  mongoose.connection.close().then(() => {
    process.exit(1);
  });
});

// Run the function
main(); 