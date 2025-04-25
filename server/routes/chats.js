const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const User = require('../models/User');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// @route   GET /api/chats
// @desc    Get all chats for the current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Find all chats where the current user is a participant
    const chats = await Chat.find({
      participants: { $in: [req.user.id] }
    })
    .populate({
      path: 'participants',
      select: 'name email profilePicture isOnline lastSeen status'
    })
    .populate({
      path: 'lastMessage',
      select: 'sender recipient content type mediaUrl createdAt status'
    })
    .sort({ updatedAt: -1 });

    return res.json(chats);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   GET /api/chats/:id
// @desc    Get a single chat by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate({
        path: 'participants',
        select: 'name email profilePicture isOnline lastSeen status'
      })
      .populate({
        path: 'lastMessage',
        select: 'sender recipient content type mediaUrl createdAt status'
      });

    // Check if chat exists
    if (!chat) {
      return res.status(404).json({ msg: 'Chat not found' });
    }

    // Check if the current user is a participant in the chat
    if (!chat.participants.some(participant => 
      participant._id.toString() === req.user.id
    )) {
      return res.status(403).json({ msg: 'Not authorized to access this chat' });
    }

    return res.json(chat);
  } catch (err) {
    console.error(err.message);
    // Check if the error is due to an invalid object ID
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Chat not found' });
    }
    return res.status(500).send('Server Error');
  }
});

// @route   POST /api/chats
// @desc    Create a new chat
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { participantId, participants, isGroup } = req.body;
    let participantIds = [];

    // Support both single participantId or participants array
    if (participants && Array.isArray(participants)) {
      participantIds = participants;
    } else if (participantId) {
      participantIds = [participantId];
    } else {
      return res.status(400).json({ msg: 'Participant ID or participants array is required' });
    }

    // Validate all participant IDs
    for (let id of participantIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: `Invalid participant ID: ${id}` });
      }
    }

    // Check if all participants exist
    for (let id of participantIds) {
      const participant = await User.findById(id);
      if (!participant) {
        return res.status(404).json({ msg: `User not found with ID: ${id}` });
      }
    }

    // For non-group chats, check if a chat already exists between these users
    if (!isGroup && participantIds.length === 1) {
      const existingChat = await Chat.findOne({
        participants: {
          $all: [req.user.id, participantIds[0]]
        },
        isGroup: false
      });

      if (existingChat) {
        // Populate and return the existing chat
        const populatedChat = await Chat.findById(existingChat._id)
          .populate({
            path: 'participants',
            select: 'name email profilePicture isOnline lastSeen status'
          })
          .populate({
            path: 'lastMessage',
            select: 'sender recipient content type mediaUrl createdAt status'
          });
        
        return res.json(populatedChat);
      }
    }

    // Create new chat with current user and all participants
    const allParticipants = [req.user.id, ...participantIds];
    
    const newChat = new Chat({
      participants: allParticipants,
      createdBy: req.user.id,
      isGroup: isGroup || false
    });

    await newChat.save();

    // Populate the chat with participants info before returning
    const chat = await Chat.findById(newChat._id)
      .populate({
        path: 'participants',
        select: 'name email profilePicture isOnline lastSeen status phoneNumber'
      });

    return res.json(chat);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/chats/:id
// @desc    Delete a chat
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('Delete chat request for ID:', req.params.id);
    console.log('User requesting deletion:', req.user ? req.user.id : 'undefined');
    
    // Check if user is authenticated properly
    if (!req.user || !req.user.id) {
      console.log('User not properly authenticated');
      return res.status(401).json({ msg: 'User authentication failed' });
    }
    
    // Check if the chat ID is valid
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('Invalid chat ID format');
      return res.status(400).json({ msg: 'Invalid chat ID format' });
    }
    
    // Use new keyword when creating ObjectId
    const chatId = new mongoose.Types.ObjectId(req.params.id);
    const chat = await Chat.findById(chatId).lean();
    console.log('Found chat:', chat ? 'yes' : 'no');

    // Check if chat exists
    if (!chat) {
      console.log('Chat not found');
      return res.status(404).json({ msg: 'Chat not found' });
    }

    // Safely handle participants
    const safeParticipants = Array.isArray(chat.participants)
      ? chat.participants.filter(p => p)
      : [];
    
    // Debug: log participant IDs for comparison
    console.log('Chat participants:', safeParticipants.map(p => 
      p && p.toString ? p.toString() : 'invalid-id'
    ));
    console.log('User ID to match:', req.user.id);
    
    // Convert user ID to string for comparison
    const userIdStr = req.user.id.toString();
    
    // Check if the current user is a participant
    const userIsParticipant = safeParticipants.some(participantId => 
      participantId && participantId.toString && participantId.toString() === userIdStr
    );
    
    console.log('User is participant:', userIsParticipant);
    
    if (!userIsParticipant) {
      return res.status(403).json({ msg: 'Not authorized to delete this chat' });
    }

    // Use deleteOne with explicitly created ObjectId
    const result = await Chat.deleteOne({ _id: chatId });
    console.log('Delete result:', result);
    
    if (result.deletedCount === 0) {
      console.log('Delete operation failed');
      return res.status(500).json({ msg: 'Failed to delete chat' });
    }

    console.log('Chat successfully deleted');
    return res.json({ msg: 'Chat removed successfully', chatId: req.params.id });
  } catch (err) {
    console.error('Chat deletion error:', err);
    // Check if the error is due to an invalid object ID
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Chat not found' });
    }
    return res.status(500).json({ msg: 'Server error while deleting chat', error: err.message });
  }
});

module.exports = router; 