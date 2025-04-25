const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const os = require('os'); // Add this for network interface info
require('dotenv').config();

// Import middleware
const setupDbLogging = require('./middleware/db-logger');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const chatRoutes = require('./routes/chats');

// Import models
const User = require('./models/User');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  },
  transports: ['websocket', 'polling'], // Ensure both transport methods are available
  pingTimeout: 60000, // Increase ping timeout for more stable connections
  upgradeTimeout: 30000 // Increase upgrade timeout
});

// Middleware
app.use(cors({
  origin: "*", // Allow all origins for development
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "Origin", "X-Requested-With", "Accept", "Access-Control-Allow-Origin", "Access-Control-Allow-Methods"],
  credentials: true,
  maxAge: 86400, // Cache preflight request for 24 hours
  preflightContinue: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Support URL-encoded bodies

// Add comprehensive headers to allow connections from all devices
app.use((req, res, next) => {
  // Allow requests from any origin
  res.header('Access-Control-Allow-Origin', '*');
  
  // Allow various HTTP methods
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  
  // Allow various headers
  res.header('Access-Control-Allow-Headers', 
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, ' + 
    'Access-Control-Allow-Origin, Access-Control-Allow-Methods');
  
  // Allow credentials (if needed)
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
  
  // Log API request for debugging
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const isMobile = /Android|iPhone|iPad|iPod/i.test(userAgent);
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} from ${isMobile ? 'Mobile' : 'Desktop'} - ${userAgent.substring(0, 100)}`);
});

// Add support for content negotiation
app.use((req, res, next) => {
  // Set default content type if not specified
  if (!req.headers['content-type'] && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
    req.headers['content-type'] = 'application/json';
  }
  next();
});

// Setup DB logging in development mode
if (process.env.NODE_ENV !== 'production') {
  setupDbLogging();
}

// MongoDB Connection
const mongoURI = "mongodb+srv://akshat980jain:Akshat%40123@cluster0.fgwy5hs.mongodb.net/chatapp?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log("MongoDB connected successfully");
    // Test the connection by creating a dummy document
    mongoose.connection.db.admin().ping((err, result) => {
        if (err) {
            console.error("MongoDB ping failed:", err);
        } else {
            console.log("MongoDB ping successful:", result);
        }
    });
})
.catch(err => {
    console.error("MongoDB connection error:", err);
    // Exit process with failure
    process.exit(1);
});

// Add MongoDB connection error handler
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

// Add MongoDB disconnection handler
mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected. Attempting to reconnect...');
});

// Add MongoDB reconnection handler
mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected successfully');
});

// Add base route for testing connection
app.get('/', (req, res) => {
  res.send('Chat API is running');
});

// Add this at the top of your file with other variables
const processedMessageIds = new Set();
const MESSAGE_CACHE_LIMIT = 1000; // Limit cache size

// Socket.IO Connection Handling
const connectedUsers = new Map();
const typingUsers = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // User connects and sets online status
  socket.on('user_connected', async (userId) => {
    try {
      console.log(`User ${userId} connected with socket ${socket.id}`);
      
      // Store user's socket mapping - support multiple connections per user
      if (!connectedUsers.has(userId)) {
        connectedUsers.set(userId, [socket.id]);
      } else {
        // Add this socket to the existing array of sockets for this user
        const userSockets = connectedUsers.get(userId);
        if (!userSockets.includes(socket.id)) {
          userSockets.push(socket.id);
          connectedUsers.set(userId, userSockets);
        }
      }
      
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
      
      // Find recipient's socket
      const recipientSocketIds = connectedUsers.get(messageData.recipientId);
      
      // If recipient is online, send them the message in real-time
      if (recipientSocketIds) {
        console.log(`Sending message to recipient sockets: ${recipientSocketIds.join(', ')}`);
        recipientSocketIds.forEach(recipientSocketId => io.to(recipientSocketId).emit('receive_message', messageData));
      } else {
        console.log(`Recipient ${messageData.recipientId} is not online`);
      }
      
      // Also emit to chat room if available
      if (messageData.chatId) {
        console.log(`Broadcasting to chat room: chat_${messageData.chatId}`);
        socket.to(`chat_${messageData.chatId}`).emit('receive_message', messageData);
      }
      
      // Let sender know message was delivered through socket
      socket.emit('message_delivered', {
        tempId: messageData.tempId,
        status: 'delivered'
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

  // User joins a specific chat room
  socket.on('join_chat', (chatId) => {
    if (chatId) {
      socket.join(`chat_${chatId}`);
      console.log(`Socket ${socket.id} joined chat room: chat_${chatId}`);
    }
  });

  // User leaves a specific chat room
  socket.on('leave_chat', (chatId) => {
    if (chatId) {
      socket.leave(`chat_${chatId}`);
      console.log(`Socket ${socket.id} left chat room: chat_${chatId}`);
    }
  });

  // User starts typing
  socket.on('typing_start', (data) => {
    const { userId, chatId, recipientId } = data;
    
    // Store typing information
    typingUsers.set(userId, { chatId, timestamp: Date.now() });
    
    // Notify the recipient that user is typing
    const recipientSocketIds = connectedUsers.get(recipientId);
    if (recipientSocketIds) {
      recipientSocketIds.forEach(recipientSocketId => io.to(recipientSocketId).emit('typing_indicator', { userId, chatId, isTyping: true }));
    }
    
    // Also emit to chat room
    socket.to(`chat_${chatId}`).emit('typing_indicator', { userId, chatId, isTyping: true });
  });

  // User stops typing
  socket.on('typing_end', (data) => {
    const { userId, chatId, recipientId } = data;
    
    // Remove typing information
    typingUsers.delete(userId);
    
    // Notify the recipient that user stopped typing
    const recipientSocketIds = connectedUsers.get(recipientId);
    if (recipientSocketIds) {
      recipientSocketIds.forEach(recipientSocketId => io.to(recipientSocketId).emit('typing_indicator', { userId, chatId, isTyping: false }));
    }
    
    // Also emit to chat room
    socket.to(`chat_${chatId}`).emit('typing_indicator', { userId, chatId, isTyping: false });
  });

  // User reads a message
  socket.on('message_read', async (data) => {
    try {
      const { messageId, userId } = data;
      
      // Update message status in DB
      await Message.findByIdAndUpdate(messageId, { status: 'read' });
      
      // Find the message to get sender information
      const message = await Message.findById(messageId);
      
      if (message) {
        // Notify sender that message was read
        const senderSocketIds = connectedUsers.get(message.sender.toString());
        if (senderSocketIds) {
          senderSocketIds.forEach(senderSocketId => io.to(senderSocketId).emit('message_status_updated', { 
            messageId, 
            status: 'read', 
            readBy: userId 
          }));
        }
      }
    } catch (error) {
      console.error('Error handling message read status:', error);
    }
  });

  // Handle user disconnection
  socket.on('disconnect', async () => {
    try {
      let userId;
      // Find which user this socket belongs to
      for (const [key, value] of connectedUsers.entries()) {
        if (value.includes(socket.id)) {
          userId = key;
          break;
        }
      }
      
      if (userId) {
        console.log(`User ${userId} disconnected`);
        
        // Remove from connected users map
        const userSockets = connectedUsers.get(userId);
        const index = userSockets.indexOf(socket.id);
        if (index !== -1) {
          userSockets.splice(index, 1);
          connectedUsers.set(userId, userSockets);
        }
        
        // Only mark the user as offline if no sockets are connected
        if (userSockets.length === 0) {
          // Remove from typing users if they were typing
          typingUsers.delete(userId);
          
          // Update user's online status and last seen in DB
          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: new Date()
          });
          
          // Broadcast user's offline status to all connected clients
          io.emit('user_status', { userId, status: 'offline' });
        }
      }
      
      console.log('Client disconnected');
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

// Clean up typing indicators every minute
// This prevents stale typing indicators if a user disconnects unexpectedly
setInterval(() => {
  const now = Date.now();
  for (const [userId, data] of typingUsers.entries()) {
    // If typing indicator is older than 30 seconds, remove it
    if (now - data.timestamp > 30000) {
      typingUsers.delete(userId);
      io.to(`chat_${data.chatId}`).emit('typing_indicator', { 
        userId, 
        chatId: data.chatId, 
        isTyping: false 
      });
    }
  }
}, 60000);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/chats', chatRoutes);

// Add this near the top of the file with other routes
app.get('/mobile-setup', (req, res) => {
  try {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    const ips = [];
    
    // Get all IPv4 non-internal IP addresses
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          ips.push(net.address);
        }
      }
    }
    
    // Redirect to the mobile setup guide with IP addresses as query parameter
    res.redirect(`/mobile-guide.html?ips=${ips.join(',')}`);
  } catch (err) {
    console.error('Failed to enumerate network interfaces:', err);
    res.redirect('/mobile-guide.html');
  }
});

// Update the network-info endpoint to provide more detailed information
app.get('/api/network-info', (req, res) => {
  try {
    const nets = os.networkInterfaces();
    const ips = [];
    const interfaces = {};
    
    // Get all IPv4 non-internal IP addresses with interface info
    for (const name of Object.keys(nets)) {
      interfaces[name] = [];
      for (const net of nets[name]) {
        if (net.family === 'IPv4') {
          // Add all IPs to the interface specific array
          interfaces[name].push({
            address: net.address,
            internal: net.internal,
            netmask: net.netmask
          });
          
          // For the main list, only include non-internal addresses
          if (!net.internal) {
            ips.push(net.address);
          }
        }
      }
    }
    
    // If running in a container or cloud environment, try to detect external IP
    let externalIp = null;
    if (process.env.EXTERNAL_IP) {
      externalIp = process.env.EXTERNAL_IP;
      if (!ips.includes(externalIp)) {
        ips.push(externalIp);
      }
    }
    
    // Respond with detailed network information
    res.json({ 
      ips,
      interfaces,
      hostname: os.hostname(),
      platform: os.platform(),
      port: process.env.PORT || 5000,
      externalIp
    });
  } catch (err) {
    console.error('Failed to enumerate network interfaces:', err);
    res.status(500).json({ 
      error: 'Failed to get network information',
      message: err.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Update the startServer function to ensure proper binding and provide clear feedback
const startServer = (port) => {
  // Explicitly bind to all network interfaces (0.0.0.0)
  server.listen(port, '0.0.0.0', () => {
    console.log(`\n----- Server Information -----`);
    console.log(`Server running on port ${port}`);
    console.log(`Local access: http://localhost:${port}`);
    
    // Log all IP addresses to help with connections
    try {
      const { networkInterfaces } = require('os');
      const nets = networkInterfaces();
      console.log('\nAvailable network interfaces:');
      
      const addresses = [];
      
      for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
          // Skip internal and non-IPv4 addresses
          if (net.family === 'IPv4' && !net.internal) {
            console.log(`  - ${name.padEnd(20)}: http://${net.address}:${port}`);
            addresses.push(`http://${net.address}:${port}`);
          }
        }
      }
      
      if (addresses.length > 0) {
        console.log('\nConnect from mobile devices using one of these URLs:');
        addresses.forEach(addr => console.log(`  ${addr}`));
        console.log('\nMake sure your mobile device is on the same WiFi network!');
      } else {
        console.log('\nNo network interfaces detected for mobile connectivity.');
        console.log('Check your network settings or firewall configurations.');
      }
      
      console.log('\nAPI documentation: http://localhost:' + port + '/api-docs');
      console.log('\n-----------------------------');
    } catch (err) {
      console.error('Failed to enumerate network interfaces:', err);
    }
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Try using a different port.`);
      process.exit(1);
    } else {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  });
};

// Use environment port or default to 5000
const PORT = process.env.PORT || 5000;
startServer(PORT);

module.exports = {
  app,
  server,
  io
}; 