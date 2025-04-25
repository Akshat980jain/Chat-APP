const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
require('dotenv').config();

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chatapp');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Sample users to add after reset
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@chatapp.com',
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

// Reset database
const resetDatabase = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    console.log('Deleting all existing messages...');
    await Message.deleteMany({});
    
    console.log('Deleting all existing chats...');
    await Chat.deleteMany({});
    
    console.log('Deleting all existing users...');
    await User.deleteMany({});
    
    console.log('Creating new sample users...');
    
    // Create users with hashed passwords
    const createdUsers = [];
    
    for (const user of sampleUsers) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);
      
      const newUser = new User({
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        password: hashedPassword,
        profilePicture: user.profilePicture,
        status: user.status,
        isOnline: false,
        lastSeen: new Date()
      });
      
      const savedUser = await newUser.save();
      createdUsers.push(savedUser);
      console.log(`Created user: ${savedUser.name} (${savedUser.email})`);
    }
    
    // Create some initial chats and messages
    console.log('Creating initial chats and welcome messages...');
    
    // Admin welcomes all users
    const adminUser = createdUsers.find(u => u.email === 'admin@chatapp.com');
    
    for (const user of createdUsers) {
      // Skip creating admin->admin chat
      if (user.email === 'admin@chatapp.com') continue;
      
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
    }
    
    console.log('Database reset complete! Sample users, chats, and messages created.');
    process.exit(0);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  }
};

// Run the reset function
resetDatabase(); 