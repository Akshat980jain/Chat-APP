const socketIo = require('socket.io');
const User = require('./models/User');
const Message = require('./models/Message');
const Chat = require('./models/Chat');

// Set up socket.io with proper CORS settings
const setupSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: "*", // Allow all origins for development
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true
    },
    transports: ['websocket', 'polling'], // Support both transport methods
    pingTimeout: 60000, // Keep connections alive longer
  });

  const connectedUsers = new Map();
  const typingUsers = new Map();
  const processedMessageIds = new Set();
  const MESSAGE_CACHE_LIMIT = 1000;

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // User connects and sets online status
    socket.on('user_connected', async (userId) => {
      try {
        console.log(`User ${userId} connected with socket ${socket.id}`);
        
        // Store user's socket mapping
        connectedUsers.set(userId, socket.id);
        
        // Update user's online status in DB
        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          lastSeen: new Date()
        });
        
        // Broadcast user's online status to all connected clients
        io.emit('user_status', { userId, status: 'online' });
      } catch (error) {
        console.error('Error handling user connection:', error);
      }
    });

    // Join a chat room
    socket.on('join_chat', (chatId) => {
      if (!chatId) return;
      
      const roomName = `chat_${chatId}`;
      console.log(`Socket ${socket.id} joining room: ${roomName}`);
      socket.join(roomName);
    });

    // Leave a chat room
    socket.on('leave_chat', (chatId) => {
      if (!chatId) return;
      
      const roomName = `chat_${chatId}`;
      console.log(`Socket ${socket.id} leaving room: ${roomName}`);
      socket.leave(roomName);
    });

    // User is typing
    socket.on('typing', async (data) => {
      try {
        const { chatId, userId, isTyping } = data;
        
        if (!chatId || !userId) return;
        
        // Store typing status
        if (!typingUsers.has(chatId)) {
          typingUsers.set(chatId, new Set());
        }
        
        const chatTypers = typingUsers.get(chatId);
        
        if (isTyping) {
          chatTypers.add(userId);
        } else {
          chatTypers.delete(userId);
        }
        
        // Get chat details to notify participants
        const chat = await Chat.findById(chatId).populate('participants');
        
        if (chat && chat.participants) {
          // Send typing status to all participants except the typer
          chat.participants.forEach(participant => {
            if (participant._id.toString() !== userId) {
              const participantSocketId = connectedUsers.get(participant._id.toString());
              
              if (participantSocketId) {
                io.to(participantSocketId).emit('typing_status', {
                  chatId,
                  userId,
                  isTyping,
                  users: Array.from(chatTypers)
                });
              }
            }
          });
        }
      } catch (error) {
        console.error('Error handling typing status:', error);
      }
    });
    
    // When user sends a message
    socket.on('send_message', async (messageData) => {
      try {
        console.log('Message received via socket:', messageData);
        
        // Check for duplicate message processing
        if (messageData.messageId) {
          if (processedMessageIds.has(messageData.messageId)) {
            console.log(`Duplicate message with ID ${messageData.messageId} rejected`);
            return;
          }
          
          // Add to processed set
          processedMessageIds.add(messageData.messageId);
          
          // If set gets too large, remove oldest entries
          if (processedMessageIds.size > MESSAGE_CACHE_LIMIT) {
            const iterator = processedMessageIds.values();
            // Remove the first entry (oldest one)
            processedMessageIds.delete(iterator.next().value);
          }
        }
        
        // Always include a timestamp for message ordering
        if (!messageData.timestamp) {
          messageData.timestamp = new Date().toISOString();
        }
        
        // Find recipient's socket
        const recipientSocketId = connectedUsers.get(messageData.recipientId);
        
        // If recipient is online, send them the message in real-time
        if (recipientSocketId) {
          console.log(`Sending message to recipient socket ${recipientSocketId}`);
          io.to(recipientSocketId).emit('receive_message', messageData);
          
          // Also send chat refresh signal to update chat list immediately
          io.to(recipientSocketId).emit('chat_refresh', {
            chatId: messageData.chatId,
            lastMessage: {
              content: messageData.content,
              senderId: messageData.senderId,
              timestamp: messageData.timestamp
            }
          });
        } else {
          console.log(`Recipient ${messageData.recipientId} is not online`);
        }
        
        // Also emit to chat room if available
        if (messageData.chatId) {
          console.log(`Broadcasting to chat room: chat_${messageData.chatId}`);
          socket.to(`chat_${messageData.chatId}`).emit('receive_message', messageData);
          
          // Broadcast chat refresh signal to all users in the chat room
          socket.to(`chat_${messageData.chatId}`).emit('chat_refresh', {
            chatId: messageData.chatId,
            lastMessage: {
              content: messageData.content,
              senderId: messageData.senderId,
              timestamp: messageData.timestamp
            }
          });
        }
        
        // Let sender know message was delivered through socket
        socket.emit('message_delivered', {
          tempId: messageData.tempId,
          status: 'delivered',
          messageId: messageData.messageId || `server-${Date.now()}`
        });
        
        // Also send chat refresh signal to sender to update their chat list
        socket.emit('chat_refresh', {
          chatId: messageData.chatId,
          lastMessage: {
            content: messageData.content,
            senderId: messageData.senderId,
            timestamp: messageData.timestamp
          }
        });
        
      } catch (error) {
        console.error('Error handling socket message:', error);
        // Notify sender of error
        socket.emit('message_error', {
          error: 'Failed to deliver message via socket',
          tempId: messageData.tempId
        });
      }
    });
    
    // Message read receipt
    socket.on('message_read', async (data) => {
      try {
        const { messageId, chatId, readerId } = data;
        
        if (!messageId || !readerId) return;
        
        // Update message read status in database
        await Message.findByIdAndUpdate(messageId, {
          $addToSet: { readBy: readerId },
          read: true
        });
        
        // Notify message sender that their message was read
        const message = await Message.findById(messageId);
        
        if (message && message.sender) {
          const senderSocketId = connectedUsers.get(message.sender.toString());
          
          if (senderSocketId) {
            io.to(senderSocketId).emit('message_status', {
              messageId,
              status: 'read',
              readBy: readerId,
              timestamp: new Date().toISOString()
            });
          }
        }
        
        // Also broadcast to the chat room
        if (chatId) {
          io.to(`chat_${chatId}`).emit('message_status', {
            messageId,
            status: 'read',
            readBy: readerId,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error handling message read status:', error);
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', async () => {
      try {
        let userId;
        // Find which user this socket belongs to
        for (const [key, value] of connectedUsers.entries()) {
          if (value === socket.id) {
            userId = key;
            break;
          }
        }
        
        if (userId) {
          console.log(`User ${userId} disconnected`);
          
          // Remove from connected users map
          connectedUsers.delete(userId);
          
          // Update user's online status and last seen in DB
          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: new Date()
          });
          
          // Broadcast user's offline status to all connected clients
          io.emit('user_status', { userId, status: 'offline' });
          
          // Remove user from all typing lists
          for (const [chatId, typers] of typingUsers.entries()) {
            if (typers.has(userId)) {
              typers.delete(userId);
              
              // Broadcast typing update if user was typing
              io.to(`chat_${chatId}`).emit('typing_status', {
                chatId,
                userId,
                isTyping: false,
                users: Array.from(typers)
              });
            }
          }
        }
        
        console.log('Client disconnected');
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });

    // Add a new event for explicitly refreshing chat lists
    socket.on('request_chat_refresh', async (userId) => {
      if (!userId) return;
      
      try {
        // Find all chats involving this user
        const chats = await Chat.find({
          participants: userId
        })
        .populate('participants', 'name profilePicture isOnline')
        .populate('lastMessage')
        .sort({ updatedAt: -1 });
        
        // Send chat refresh signal to the user
        socket.emit('chat_list_updated', { chats });
        
      } catch (error) {
        console.error('Error handling chat refresh request:', error);
      }
    });

    // Handle heartbeat to keep connections alive
    socket.on('heartbeat', (data) => {
      // Update user's last activity timestamp
      if (data && data.userId) {
        // Optionally update the user's last seen time in the database
        // This is lightweight and doesn't require a response
        
        // If the user was previously marked as disconnected, mark them as online again
        const storedSocketId = connectedUsers.get(data.userId);
        if (!storedSocketId || storedSocketId !== socket.id) {
          connectedUsers.set(data.userId, socket.id);
          // Notify other users that this user is online again
          io.emit('user_status', { userId: data.userId, status: 'online' });
        }
      }
    });
  });

  return io;
};

module.exports = setupSocket; 