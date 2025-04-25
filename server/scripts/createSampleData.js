const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
require('dotenv').config();

// MongoDB connection with strictQuery setting to avoid deprecation warning
mongoose.set('strictQuery', false); // Fix for deprecation warning

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

// Create sample data with proper error handling and promise management
const createSampleData = async () => {
  let connection = false;
  
  try {
    console.log('Starting sample data creation process...');
    
    connection = await connectDB();
    if (!connection) {
      console.error('Failed to connect to the database. Aborting process.');
      process.exit(1);
    }
    
    console.log('Connection successful, proceeding with data creation...');
    
    // Check if there are existing users
    const existingUserCount = await User.countDocuments({});
    if (existingUserCount > 0) {
      console.log(`Warning: There are already ${existingUserCount} users in the database.`);
      console.log('This script will add more sample data on top of existing data.');
      console.log('If you want to start fresh, run the clearDatabase.js script first.');
      
      // Ask for confirmation
      console.log('\nDo you want to continue anyway? If so, run this script with the --force flag:');
      console.log('node scripts/createSampleData.js --force');
      
      if (!process.argv.includes('--force')) {
        console.log('Aborting operation. No changes were made.');
        await mongoose.connection.close();
        process.exit(0);
      }
      
      console.log('\nForce flag detected. Continuing with sample data creation...');
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

// Run the function
createSampleData(); 