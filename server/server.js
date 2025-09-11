const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const os = require('os');
const rateLimit = require('express-rate-limit');
const setupPerformanceMiddleware = require('./middleware/performance');
require('dotenv').config();

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

// Optimized Socket.IO configuration
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 30000,
  pingInterval: 25000,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 1e6, // 1MB
  allowEIO3: true
});

// Rate limiting for API protection
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// Apply performance middleware
setupPerformanceMiddleware(app);

// Optimized CORS configuration
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "Origin", 
    "X-Requested-With", 
    "Accept"
  ],
  credentials: true,
  maxAge: 86400,
  preflightContinue: false
}));

// Optimized body parsing
app.use(express.json({ 
  limit: '10mb',
  strict: true
}));
app.use(express.urlencoded({ 
  extended: true,
  limit: '10mb'
}));

// Optimized headers middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Optimized content negotiation
app.use((req, res, next) => {
  if (!req.headers['content-type'] && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
    req.headers['content-type'] = 'application/json';
  }
  next();
});

// Optimized MongoDB Connection
const mongoURI = "mongodb+srv://akshat980jain:Akshat%40123@cluster0.fgwy5hs.mongodb.net/chatapp?retryWrites=true&w=majority&appName=Cluster0";

// Optimize mongoose settings
mongoose.set('strictQuery', false);
mongoose.set('bufferCommands', false);
mongoose.set('bufferMaxEntries', 0);

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferCommands: false,
    bufferMaxEntries: 0
})
.then(() => {
    console.log("MongoDB connected successfully");
})
.catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
});

// Optimized MongoDB event handlers
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

// Add MongoDB disconnection handler
mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

// Add MongoDB reconnection handler
mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected successfully');
});

// Add base route for testing connection
app.get('/', (req, res) => {
  res.json({ 
    status: 'running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Optimized message processing
const processedMessageIds = new Set();
const MESSAGE_CACHE_LIMIT = 500;

// Optimized Socket.IO Connection Handling
const connectedUsers = new Map();
const typingUsers = new Map();
const userRooms = new Map();

io.on('connection', (socket) => {
  let userId = null;

  // Optimized user connection
  socket.on('user_connected', async (userId) => {
    try {
      userId = receivedUserId;
      
      if (!connectedUsers.has(userId)) {
        connectedUsers.set(userId, [socket.id]);
      } else {
        const userSockets = connectedUsers.get(userId);
        if (!userSockets.includes(socket.id)) {
          userSockets.push(socket.id);
          connectedUsers.set(userId, userSockets);
        }
      }
      
      // Batch database updates
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: new Date()
      });
      
      io.emit('user_status', { userId, status: 'online' });
    } catch (error) {
      console.error('Error handling user connection:', error);
    }
  });

  // Optimized message handling
  socket.on('send_message', async (messageData) => {
    try {
      // Prevent duplicate processing
      if (messageData.messageId) {
        if (processedMessageIds.has(messageData.messageId)) {
          return;
        }
        
        processedMessageIds.add(messageData.messageId);
        
        if (processedMessageIds.size > MESSAGE_CACHE_LIMIT) {
          const iterator = processedMessageIds.values();
          processedMessageIds.delete(iterator.next().value);
        }
      }
      
      // Efficient message delivery
      const recipientSocketIds = connectedUsers.get(messageData.recipientId);
      
      if (recipientSocketIds) {
        recipientSocketIds.forEach(recipientSocketId => 
          io.to(recipientSocketId).emit('receive_message', messageData)
        );
      }
      
      if (messageData.chatId) {
        socket.to(`chat_${messageData.chatId}`).emit('receive_message', messageData);
      }
      
      socket.emit('message_delivered', {
        tempId: messageData.tempId,
        status: 'delivered'
      });
    } catch (error) {
      console.error('Error handling socket message:', error);
      socket.emit('message_error', {
        error: 'Failed to deliver message via socket',
        tempId: messageData.tempId
      });
    }
  });

  // Optimized room management
  socket.on('join_chat', (chatId) => {
    if (chatId) {
      socket.join(`chat_${chatId}`);
      
      // Track user rooms
      if (!userRooms.has(userId)) {
        userRooms.set(userId, new Set());
      }
      userRooms.get(userId).add(chatId);
    }
  });

  socket.on('leave_chat', (chatId) => {
    if (chatId) {
      socket.leave(`chat_${chatId}`);
      
      if (userRooms.has(userId)) {
        userRooms.get(userId).delete(chatId);
      }
    }
  });

  // Optimized typing indicators
  socket.on('typing_start', (data) => {
    const { userId, chatId, recipientId } = data;
    
    typingUsers.set(userId, { chatId, timestamp: Date.now() });
    
    const recipientSocketIds = connectedUsers.get(recipientId);
    if (recipientSocketIds) {
      recipientSocketIds.forEach(recipientSocketId => 
        io.to(recipientSocketId).emit('typing_indicator', { userId, chatId, isTyping: true })
      );
    }
    
    socket.to(`chat_${chatId}`).emit('typing_indicator', { userId, chatId, isTyping: true });
  });

  socket.on('typing_end', (data) => {
    const { userId, chatId, recipientId } = data;
    
    typingUsers.delete(userId);
    
    const recipientSocketIds = connectedUsers.get(recipientId);
    if (recipientSocketIds) {
      recipientSocketIds.forEach(recipientSocketId => 
        io.to(recipientSocketId).emit('typing_indicator', { userId, chatId, isTyping: false })
      );
    }
    
    socket.to(`chat_${chatId}`).emit('typing_indicator', { userId, chatId, isTyping: false });
  });

  // Optimized message read handling
  socket.on('message_read', async (data) => {
    try {
      const { messageId, userId: readerId } = data;
      
      await Message.findByIdAndUpdate(messageId, { status: 'read' });
      
      const message = await Message.findById(messageId);
      
      if (message) {
        const senderSocketIds = connectedUsers.get(message.sender.toString());
        if (senderSocketIds) {
          senderSocketIds.forEach(senderSocketId => 
            io.to(senderSocketId).emit('message_status_updated', { 
            messageId, 
            status: 'read', 
            readBy: readerId 
          })
          );
        }
      }
    } catch (error) {
      console.error('Error handling message read status:', error);
    }
  });

  // Optimized heartbeat
  socket.on('heartbeat', (data) => {
    if (data?.userId && connectedUsers.has(data.userId)) {
      socket.emit('heartbeat_ack', { timestamp: Date.now() });
    }
  });

  // Optimized disconnection handling
  socket.on('disconnect', async () => {
    try {
      if (userId) {
        const userSockets = connectedUsers.get(userId);
        if (userSockets) {
          const index = userSockets.indexOf(socket.id);
          if (index !== -1) {
            userSockets.splice(index, 1);
            
            if (userSockets.length === 0) {
              connectedUsers.delete(userId);
              typingUsers.delete(userId);
              userRooms.delete(userId);
              
              // Batch update user status
              await User.findByIdAndUpdate(userId, {
                isOnline: false,
                lastSeen: new Date()
              });
              
              io.emit('user_status', { userId, status: 'offline' });
            } else {
              connectedUsers.set(userId, userSockets);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

// Optimized cleanup intervals
setInterval(() => {
  const now = Date.now();
  for (const [userId, data] of typingUsers.entries()) {
    if (now - data.timestamp > 10000) { // 10 seconds
      typingUsers.delete(userId);
      io.to(`chat_${data.chatId}`).emit('typing_indicator', { 
        userId, 
        chatId: data.chatId, 
        isTyping: false 
      });
    }
  }
}, 30000); // Check every 30 seconds

// Clean up processed message IDs
setInterval(() => {
  if (processedMessageIds.size > MESSAGE_CACHE_LIMIT) {
    const idsToDelete = Array.from(processedMessageIds).slice(0, MESSAGE_CACHE_LIMIT / 2);
    idsToDelete.forEach(id => processedMessageIds.delete(id));
  }
}, 300000); // Clean up every 5 minutes
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/chats', chatRoutes);

// Optimized health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    connections: connectedUsers.size
  });
});

// Optimized mobile setup route
app.get('/mobile-setup', (req, res) => {
  try {
    const nets = os.networkInterfaces();
    const ips = [];
    
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          ips.push(net.address);
        }
      }
    }
    
    res.redirect(`/mobile-guide.html?ips=${ips.join(',')}`);
  } catch (err) {
    console.error('Failed to enumerate network interfaces:', err);
    res.redirect('/mobile-guide.html');
  }
});

// Optimized network info endpoint
app.get('/api/network-info', (req, res) => {
  try {
    const nets = os.networkInterfaces();
    const ips = [];
    
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          ips.push(net.address);
        }
      }
    }
    
    res.json({ 
      ips,
      hostname: os.hostname(),
      port: process.env.PORT || 5000,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to enumerate network interfaces:', err);
    res.status(500).json({ 
      error: 'Failed to get network information',
      message: err.message 
    });
  }
});

// Optimized error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({ 
    message: err.message || 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
});

// Optimized 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Optimized server startup
const startServer = (port) => {
  server.listen(port, '0.0.0.0', () => {
    console.log(`\n🚀 Server running on port ${port}`);
    console.log(`Server running on port ${port}`);
    console.log(`📱 Local: http://localhost:${port}`);
    
    try {
      const nets = os.networkInterfaces();
      console.log('🌐 Network access:');
      
      const addresses = [];
      
      for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
          if (net.family === 'IPv4' && !net.internal) {
            console.log(`   http://${net.address}:${port}`);
            addresses.push(`http://${net.address}:${port}`);
          }
        }
      }
      
      if (addresses.length === 0) {
        console.log('⚠️  No external network interfaces detected');
      }
      
      console.log(`\n✅ Server ready with ${connectedUsers.size} connected users`);
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

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('Server shut down');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('Server shut down');
      process.exit(0);
    });
  });
});

const PORT = process.env.PORT || 5000;
startServer(PORT);

module.exports = {
  app,
  server,
  io
}; 