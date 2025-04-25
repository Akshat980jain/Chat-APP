const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Get chat history with a specific user
router.get('/:userId', auth, async (req, res) => {
  try {
    console.log('Fetching chat history with user:', req.params.userId);
    
    // Validate recipient exists
    const recipientId = req.params.userId;
    const recipient = await User.findById(recipientId);
    
    if (!recipient) {
      return res.status(404).json({ msg: 'Recipient not found' });
    }

    // Find messages between these two users (in both directions)
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, recipient: recipientId },
        { sender: recipientId, recipient: req.user.id }
      ]
    })
    .sort({ createdAt: 1 }) // Sort by oldest first
    .populate('sender', 'name email profilePicture')
    .populate('recipient', 'name email profilePicture');
    
    // Mark received messages as read
    await Message.updateMany(
      { sender: recipientId, recipient: req.user.id, status: { $ne: 'read' } },
      { $set: { status: 'read' } }
    );
    
    console.log(`Found ${messages.length} messages with user ${recipientId}`);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ msg: 'Server error fetching messages' });
  }
});

// Send a new message
router.post('/', auth, async (req, res) => {
  try {
    console.log('POST /api/messages received', {
      senderId: req.user.id,
      recipientId: req.body.recipient || req.body.recipientId,
      content: req.body.content ? req.body.content.slice(0, 20) + '...' : 'empty',
      messageId: req.body.messageId,
      authHeader: !!req.headers.authorization
    });

    // Get recipient ID from either recipient or recipientId property
    const recipientId = req.body.recipient || req.body.recipientId;
    const { content, messageId } = req.body;
    
    // Validate required fields
    if (!recipientId) {
      console.error('Missing recipient ID in message request');
      return res.status(400).json({ msg: 'Recipient ID is required' });
    }
    if (!content) {
      console.error('Missing content in message request');
      return res.status(400).json({ msg: 'Message content is required' });
    }

    // Check if the user is authenticated
    if (!req.user || !req.user.id) {
      console.error('User not properly authenticated', req.user);
      return res.status(401).json({ msg: 'User not authenticated properly' });
    }

    // Check for duplicate message if messageId is provided
    if (messageId) {
      const existingMessage = await Message.findOne({ 
        'metadata.clientMessageId': messageId,
        sender: req.user.id
      });
      
      if (existingMessage) {
        console.log(`Duplicate message with ID ${messageId} returned from DB`);
        // Return the existing message instead of creating a new one
        const populatedMessage = await Message.findById(existingMessage._id)
          .populate('sender', 'name email profilePicture')
          .populate('recipient', 'name email profilePicture');
          
        return res.json(populatedMessage);
      }
    }

    // Create a new message
    console.log('Creating new message from user', req.user.id, 'to user', recipientId);
    const newMessage = new Message({
      sender: req.user.id,
      recipient: recipientId,
      content: content,
      type: 'text',
      status: 'sent',
      metadata: {
        clientMessageId: messageId || null // Store the client messageId for deduplication
      }
    });
    
    // Save the message
    const savedMessage = await newMessage.save();
    console.log('Message saved with ID:', savedMessage._id);
    
    // Find or create a chat for these users
    let chat = await Chat.findOne({
      isGroup: false,
      $and: [
        { participants: { $elemMatch: { $eq: req.user.id } } },
        { participants: { $elemMatch: { $eq: recipientId } } }
      ]
    });
    
    if (!chat) {
      // Create a new chat
      console.log('Creating new chat for users:', req.user.id, recipientId);
      chat = new Chat({
        participants: [req.user.id, recipientId],
        creator: req.user.id,
        lastMessage: savedMessage._id
      });
      await chat.save();
      console.log('New chat created with ID:', chat._id);
    } else {
      // Update existing chat
      console.log('Updating existing chat:', chat._id);
      chat.lastMessage = savedMessage._id;
      chat.updatedAt = Date.now();
      await chat.save();
    }
    
    // Update the message with chat ID
    savedMessage.chatId = chat._id;
    await savedMessage.save();
    
    // Populate the message with sender and recipient details
    const populatedMessage = await Message.findById(savedMessage._id)
      .populate('sender', 'name email profilePicture')
      .populate('recipient', 'name email profilePicture');
    
    res.json(populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error.message);
    console.error(error.stack);
    res.status(500).json({ msg: 'Server error sending message', error: error.message });
  }
});

// Update message status
router.put('/:messageId/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.status = status;
    await message.save();

    res.json(message);
  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 