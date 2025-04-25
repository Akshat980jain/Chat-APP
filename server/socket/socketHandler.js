const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const jwt = require('jsonwebtoken');

const onlineUsers = new Map(); // Map userId -> socket.id
const userSockets = new Map(); // Map socket.id -> userId
const activeCalls = new Map(); // Map userId -> {callerId, status}

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'chat_app_jwt_secret');
    const userId = decoded.id || decoded.userId || decoded.user?.id;
    
    if (!userId) {
      return next(new Error('Authentication error: Invalid token payload'));
    }
    
    // Attach user ID to socket object
    socket.userId = userId;
    next();
  } catch (error) {
    return next(new Error('Authentication error: ' + error.message));
  }
};

const handleConnection = async (io, socket) => {
  try {
    console.log(`User connected: ${socket.userId}`);
    
    // Store socket mapping
    onlineUsers.set(socket.userId, socket.id);
    userSockets.set(socket.id, socket.userId);
    
    // Update user status to online
    await User.findByIdAndUpdate(socket.userId, { 
      isOnline: true,
      lastSeen: new Date()
    });
    
    // Broadcast user status to everyone
    io.emit('user_status', {
      userId: socket.userId,
      status: 'online'
    });
    
    // Join personal room for directed messages
    socket.join(socket.userId);
    
    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.userId}`);
      
      // Remove socket mapping
      onlineUsers.delete(socket.userId);
      userSockets.delete(socket.id);
      
      // Update user status to offline
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date()
      });
      
      // Broadcast user status to everyone
      io.emit('user_status', {
        userId: socket.userId,
        status: 'offline'
      });
      
      // Handle any active calls being terminated on disconnect
      if (activeCalls.has(socket.userId)) {
        const callData = activeCalls.get(socket.userId);
        
        // Notify the other party that the call ended
        if (callData.partnerId) {
          io.to(callData.partnerId).emit('call_ended', {
            from: socket.userId,
            to: callData.partnerId
          });
          
          // Remove the call from active calls
          if (activeCalls.has(callData.partnerId)) {
            activeCalls.delete(callData.partnerId);
          }
        }
        
        activeCalls.delete(socket.userId);
      }
    });
    
    // Handle joining chat room
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.userId} joined room ${roomId}`);
    });
    
    // Handle leaving chat room
    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      console.log(`User ${socket.userId} left room ${roomId}`);
    });
    
    // Handle sending message
    socket.on('send_message', async (data) => {
      try {
        const { recipientId, content, chatId, tempId, messageId } = data;
        
        // Get recipient socket
        const recipientSocketId = onlineUsers.get(recipientId);
        
        // Emit to recipient if online
        if (recipientSocketId) {
          const senderInfo = await User.findById(socket.userId).select('name profilePicture');
          
          io.to(recipientSocketId).emit('receive_message', {
            _id: messageId,
            sender: {
              _id: socket.userId,
              name: senderInfo.name,
              profilePicture: senderInfo.profilePicture
            },
            recipient: {
              _id: recipientId
            },
            content,
            createdAt: new Date().toISOString(),
            status: 'delivered',
            chatId
          });
          
          // Emit delivery confirmation to sender
          socket.emit('message_delivered', {
            tempId,
            status: 'delivered'
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message_error', {
          tempId: data.tempId,
          error: error.message
        });
      }
    });
    
    // Handle typing indicator
    socket.on('typing_start', (data) => {
      const { recipientId } = data;
      const recipientSocketId = onlineUsers.get(recipientId);
      
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('typing_indicator', {
          userId: socket.userId,
          isTyping: true
        });
      }
    });
    
    socket.on('typing_end', (data) => {
      const { recipientId } = data;
      const recipientSocketId = onlineUsers.get(recipientId);
      
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('typing_indicator', {
          userId: socket.userId,
          isTyping: false
        });
      }
    });
    
    // Handle message read
    socket.on('message_read', async (data) => {
      try {
        const { messageId, userId } = data;
        
        // Update message status
        await Message.findByIdAndUpdate(messageId, { status: 'read' });
        
        // Get message to find sender
        const message = await Message.findById(messageId);
        
        if (message) {
          // Notify sender that message was read
          const senderSocketId = onlineUsers.get(message.sender.toString());
          
          if (senderSocketId) {
            io.to(senderSocketId).emit('message_status_updated', {
              messageId,
              status: 'read'
            });
          }
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });
    
    // CALLING FUNCTIONALITY
    
    // Handle initiating a call
    socket.on('initiate_call', async (data) => {
      try {
        const { to, from, callerName, callerPicture, callType } = data;
        
        console.log(`Call initiation: ${from} is calling ${to} (${callType} call)`);
        
        // Check if recipient is online
        const recipientSocketId = onlineUsers.get(to);
        
        if (!recipientSocketId) {
          // Recipient is offline, send error to caller
          console.log(`Call failed: ${to} is offline`);
          socket.emit('call_error', {
            error: 'User is offline',
            to
          });
          return;
        }
        
        // Check if recipient is already in a call
        if (activeCalls.has(to)) {
          // Recipient is in another call, send busy error
          console.log(`Call failed: ${to} is busy in another call`);
          socket.emit('call_error', {
            error: 'User is busy',
            to
          });
          return;
        }
        
        // Check if caller is already in a call
        if (activeCalls.has(from) && activeCalls.get(from).partnerId !== to) {
          console.log(`Call failed: ${from} is already in another call`);
          socket.emit('call_error', {
            error: 'You are already in a call',
            to
          });
          return;
        }
        
        // Store call information
        activeCalls.set(from, { 
          partnerId: to, 
          status: 'calling',
          type: callType,
          startTime: Date.now()
        });
        
        activeCalls.set(to, { 
          partnerId: from, 
          status: 'receiving',
          type: callType,
          startTime: Date.now()
        });
        
        console.log(`Call initiated: ${from} -> ${to} (${callType})`);
        
        // Notify recipient about incoming call
        io.to(recipientSocketId).emit('incoming_call', {
          from,
          to,
          callerName,
          callerPicture,
          callType
        });
        
      } catch (error) {
        console.error('Error initiating call:', error);
        socket.emit('call_error', {
          error: error.message
        });
      }
    });
    
    // Handle call offer (WebRTC)
    socket.on('call_offer', (data) => {
      const { to, from, offer, callerName } = data;
      const recipientSocketId = onlineUsers.get(to);
      
      console.log(`Call offer: ${from} -> ${to}`);
      
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('call_offer', {
          from,
          to,
          offer,
          callerName
        });
      } else {
        // Recipient went offline during call setup
        socket.emit('call_error', {
          error: 'User went offline',
          to
        });
        
        // Clean up call data
        activeCalls.delete(from);
        activeCalls.delete(to);
      }
    });
    
    // Handle call answer (WebRTC)
    socket.on('call_answer', (data) => {
      const { to, from, answer } = data;
      const recipientSocketId = onlineUsers.get(to);
      
      console.log(`Call answer: ${from} -> ${to}`);
      
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('call_answer', {
          from,
          to,
          answer
        });
        
        // Update call status
        if (activeCalls.has(from)) {
          const callData = activeCalls.get(from);
          callData.status = 'ongoing';
          activeCalls.set(from, callData);
        }
        
        if (activeCalls.has(to)) {
          const callData = activeCalls.get(to);
          callData.status = 'ongoing';
          activeCalls.set(to, callData);
        }
        
        console.log(`Call connected: ${from} <-> ${to}`);
      } else {
        // Caller went offline during call setup
        socket.emit('call_error', {
          error: 'User went offline',
          to
        });
        
        // Clean up call data
        activeCalls.delete(from);
        activeCalls.delete(to);
      }
    });
    
    // Handle ICE candidates (WebRTC)
    socket.on('ice_candidate', (data) => {
      const { to, from, candidate } = data;
      const recipientSocketId = onlineUsers.get(to);
      
      // Debug log
      console.log(`ICE candidate: ${from} -> ${to}`);
      
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('ice_candidate', {
          from,
          to,
          candidate
        });
      }
    });
    
    // Handle call accepted
    socket.on('call_accepted', (data) => {
      const { to, from } = data;
      const callerSocketId = onlineUsers.get(to);
      
      console.log(`Call accepted: ${from} accepted call from ${to}`);
      
      if (callerSocketId) {
        io.to(callerSocketId).emit('call_accepted', {
          from,
          to
        });
        
        // Update call status
        if (activeCalls.has(from)) {
          const callData = activeCalls.get(from);
          callData.status = 'connecting';
          activeCalls.set(from, callData);
        }
        
        if (activeCalls.has(to)) {
          const callData = activeCalls.get(to);
          callData.status = 'connecting';
          activeCalls.set(to, callData);
        }
      } else {
        // Caller went offline
        socket.emit('call_error', {
          error: 'Caller went offline',
          to
        });
        
        // Clean up call data
        activeCalls.delete(from);
        activeCalls.delete(to);
      }
    });
    
    // Handle call rejected
    socket.on('call_rejected', (data) => {
      const { to, from } = data;
      const callerSocketId = onlineUsers.get(to);
      
      console.log(`Call rejected: ${from} rejected call from ${to}`);
      
      if (callerSocketId) {
        io.to(callerSocketId).emit('call_rejected', {
          from,
          to
        });
      }
      
      // Clean up call data
      activeCalls.delete(from);
      activeCalls.delete(to);
    });
    
    // Handle call ended
    socket.on('call_ended', (data) => {
      const { to, from } = data;
      const recipientSocketId = onlineUsers.get(to);
      
      console.log(`Call ended: ${from} ended call with ${to}`);
      
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('call_ended', {
          from,
          to
        });
      }
      
      // Log call duration if available
      if (activeCalls.has(from)) {
        const callData = activeCalls.get(from);
        const duration = (Date.now() - callData.startTime) / 1000;
        console.log(`Call duration: ${Math.round(duration)} seconds`);
      }
      
      // Clean up call data
      activeCalls.delete(from);
      activeCalls.delete(to);
    });
    
    // Handle WebRTC debug info
    socket.on('webrtc_debug', (data) => {
      console.log(`WebRTC Debug (${socket.userId}):`, data);
    });
    
  } catch (error) {
    console.error('Socket connection error:', error);
  }
};

module.exports = {
  authenticateSocket,
  handleConnection
}; 