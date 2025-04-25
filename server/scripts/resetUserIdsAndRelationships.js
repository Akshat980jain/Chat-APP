const mongoose = require('mongoose');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
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

// Reset user IDs and their relationships
const resetUserIdsAndRelationships = async () => {
  try {
    console.log('Starting complete user ID reset process...');
    
    const connected = await connectDB();
    if (!connected) {
      console.error('Failed to connect to the database. Aborting process.');
      process.exit(1);
    }
    
    console.log('Connection successful, proceeding with reset...');
    
    // Step 1: Get all data and create a backup
    console.log('\n--- Step 1: Backing up data ---');
    
    // First, get all existing users
    const existingUsers = await User.find({});
    console.log(`Found ${existingUsers.length} users in the database`);
    
    if (existingUsers.length === 0) {
      console.log('No users to process. Database is empty.');
      return;
    }
    
    // Get all existing chats
    const existingChats = await Chat.find({});
    console.log(`Found ${existingChats.length} chats in the database`);
    
    // Get all existing messages
    const existingMessages = await Message.find({});
    console.log(`Found ${existingMessages.length} messages in the database`);
    
    // Create a mapping of old user IDs to new user data (without IDs yet)
    console.log('Creating user data mapping...');
    const userDataMap = {};
    const emailToOldId = {};
    
    existingUsers.forEach(user => {
      const oldId = user._id.toString();
      userDataMap[oldId] = {
        name: user.name,
        email: user.email,
        password: user.password,
        phoneNumber: user.phoneNumber || '',
        profilePicture: user.profilePicture || '',
        status: user.status || 'Hey there! I am using Chat App',
        lastSeen: user.lastSeen || new Date(),
        isOnline: user.isOnline || false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      emailToOldId[user.email] = oldId;
    });
    
    // Step 2: Delete all data
    console.log('\n--- Step 2: Deleting all data ---');
    
    console.log('Deleting all existing messages...');
    const messagesDeleteResult = await Message.deleteMany({});
    console.log(`Deleted ${messagesDeleteResult.deletedCount} messages`);
    
    console.log('Deleting all existing chats...');
    const chatsDeleteResult = await Chat.deleteMany({});
    console.log(`Deleted ${chatsDeleteResult.deletedCount} chats`);
    
    console.log('Deleting all existing users...');
    const usersDeleteResult = await User.deleteMany({});
    console.log(`Deleted ${usersDeleteResult.deletedCount} users`);
    
    // Step 3: Create new users with same data but new IDs
    console.log('\n--- Step 3: Creating new users with fresh IDs ---');
    
    // Insert new users and build mapping from old ID to new ID
    const oldToNewIdMap = {};
    const emailToNewId = {};
    
    for (const oldId in userDataMap) {
      const userData = userDataMap[oldId];
      
      const newUser = new User(userData);
      const savedUser = await newUser.save();
      
      const newId = savedUser._id.toString();
      oldToNewIdMap[oldId] = newId;
      emailToNewId[userData.email] = newId;
      
      console.log(`Recreated user: ${userData.name} (${userData.email})`);
      console.log(`  Old ID: ${oldId}`);
      console.log(`  New ID: ${newId}`);
    }
    
    // Step 4: Recreate chats with new user IDs
    console.log('\n--- Step 4: Recreating chats with new user IDs ---');
    
    const oldToNewChatIdMap = {};
    
    for (const chat of existingChats) {
      const oldChatId = chat._id.toString();
      
      // Map old participant IDs to new ones
      const newParticipants = chat.participants.map(participantId => {
        const oldParticipantId = participantId.toString();
        return oldToNewIdMap[oldParticipantId];
      }).filter(id => id !== undefined); // Filter out any that couldn't be mapped
      
      // Map created by ID if it exists
      let newCreatedBy = null;
      if (chat.createdBy) {
        const oldCreatedById = chat.createdBy.toString();
        newCreatedBy = oldToNewIdMap[oldCreatedById];
      }
      
      if (newParticipants.length > 0) {
        const newChat = new Chat({
          participants: newParticipants,
          createdBy: newCreatedBy,
          isGroup: chat.isGroup || false,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt
        });
        
        const savedChat = await newChat.save();
        oldToNewChatIdMap[oldChatId] = savedChat._id.toString();
        
        console.log(`Recreated chat with ${newParticipants.length} participants`);
        console.log(`  Old ID: ${oldChatId}`);
        console.log(`  New ID: ${savedChat._id.toString()}`);
      } else {
        console.log(`Skipped chat with ID ${oldChatId} - no valid participants after mapping`);
      }
    }
    
    // Step 5: Recreate messages with new user IDs and chat IDs
    console.log('\n--- Step 5: Recreating messages with new references ---');
    
    let recreatedCount = 0;
    let skippedCount = 0;
    
    for (const message of existingMessages) {
      const oldMessageId = message._id.toString();
      
      // Map sender and recipient IDs
      let newSenderId = null;
      let newRecipientId = null;
      
      if (message.sender) {
        const oldSenderId = message.sender.toString();
        newSenderId = oldToNewIdMap[oldSenderId];
      }
      
      if (message.recipient) {
        const oldRecipientId = message.recipient.toString();
        newRecipientId = oldToNewIdMap[oldRecipientId];
      }
      
      // Skip if we don't have valid sender or recipient
      if (!newSenderId || !newRecipientId) {
        skippedCount++;
        continue;
      }
      
      const newMessage = new Message({
        sender: newSenderId,
        recipient: newRecipientId,
        content: message.content,
        type: message.type || 'text',
        mediaUrl: message.mediaUrl || '',
        status: message.status || 'sent',
        createdAt: message.createdAt,
        updatedAt: message.updatedAt
      });
      
      await newMessage.save();
      recreatedCount++;
    }
    
    console.log(`Recreated ${recreatedCount} messages`);
    console.log(`Skipped ${skippedCount} messages due to missing sender/recipient mapping`);
    
    // Step 6: Update chat lastMessage references
    console.log('\n--- Step 6: Updating chat references ---');
    
    // Since lastMessage references will be broken, we'll find the most recent message for each chat
    const chats = await Chat.find({});
    let updatedChatsCount = 0;
    
    for (const chat of chats) {
      // Find participants
      const participantIds = chat.participants;
      
      // Find the most recent message between these participants
      const latestMessage = await Message.findOne({
        $or: [
          { sender: { $in: participantIds }, recipient: { $in: participantIds } }
        ]
      }).sort({ createdAt: -1 });
      
      if (latestMessage) {
        chat.lastMessage = latestMessage._id;
        await chat.save();
        updatedChatsCount++;
      }
    }
    
    console.log(`Updated lastMessage reference for ${updatedChatsCount} chats`);
    
    console.log('\nDatabase reset completed successfully!');
    console.log('All user IDs have been changed and relationships updated.');
    
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
resetUserIdsAndRelationships(); 