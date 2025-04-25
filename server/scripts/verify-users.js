const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB Connection - Use the exact same URI as server.js
const mongoURI = "mongodb+srv://akshat980jain:Akshat%40123@cluster0.fgwy5hs.mongodb.net/chatapp?retryWrites=true&w=majority&appName=Cluster0";

async function verifyUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB successfully');

    // Define User schema
    const userSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      profilePicture: String,
      status: String,
      lastSeen: Date,
      isOnline: Boolean,
      createdAt: Date,
      updatedAt: Date
    });

    const User = mongoose.model('User', userSchema);

    // Get all users
    console.log('Fetching all users...');
    const users = await User.find({}).select('-password');
    
    console.log(`Found ${users.length} users in the database:`);
    
    users.forEach((user, index) => {
      console.log(`\nUser #${index + 1}:`);
      console.log(`ID: ${user._id}`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Profile Picture: ${user.profilePicture || 'None'}`);
      console.log(`Status: ${user.status || 'None'}`);
      console.log(`Online: ${user.isOnline ? 'Yes' : 'No'}`);
      console.log(`Last Seen: ${user.lastSeen ? new Date(user.lastSeen).toLocaleString() : 'Never'}`);
      console.log(`Created At: ${user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Unknown'}`);
    });

    // Also verify Chat and Message collections
    const chatSchema = new mongoose.Schema({
      participants: [mongoose.Schema.Types.ObjectId],
      lastMessage: mongoose.Schema.Types.ObjectId,
      isGroup: Boolean,
      createdBy: mongoose.Schema.Types.ObjectId,
      createdAt: Date,
      updatedAt: Date
    });

    const Chat = mongoose.model('Chat', chatSchema);
    
    const chats = await Chat.find({});
    console.log(`\nFound ${chats.length} chats in the database.`);

    const messageSchema = new mongoose.Schema({
      sender: mongoose.Schema.Types.ObjectId,
      recipient: mongoose.Schema.Types.ObjectId,
      content: String,
      status: String,
      createdAt: Date,
      updatedAt: Date
    });

    const Message = mongoose.model('Message', messageSchema);
    
    const messages = await Message.find({}).limit(10);
    console.log(`Found ${messages.length} messages in the database.`);
    
    if (messages.length > 0) {
      console.log('\nLast 10 messages:');
      messages.forEach((message, index) => {
        console.log(`\nMessage #${index + 1}:`);
        console.log(`From: ${message.sender}`);
        console.log(`To: ${message.recipient}`);
        console.log(`Content: ${message.content}`);
        console.log(`Status: ${message.status}`);
        console.log(`Sent At: ${message.createdAt ? new Date(message.createdAt).toLocaleString() : 'Unknown'}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

verifyUsers(); 