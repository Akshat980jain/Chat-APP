const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const http = require('http');
const setupSocket = require('./socket');
const path = require('path');
const fs = require('fs');
require('dotenv').config(); // Load environment variables

// Define host and port for binding
const HOST = '0.0.0.0'; // Bind to all network interfaces
const PORT = process.env.PORT || 5000;
console.log('Using server host and port:', HOST, PORT);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const profilesDir = path.join(uploadsDir, 'profiles');

// Function to ensure directory exists with proper permissions
const ensureDirectoryExists = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      console.log(`Creating directory: ${dirPath}`);
      fs.mkdirSync(dirPath, { recursive: true, mode: 0o755 });
      console.log(`Successfully created directory: ${dirPath}`);
    } else {
      console.log(`Directory already exists: ${dirPath}`);
      
      // Check if directory is writable
      try {
        fs.accessSync(dirPath, fs.constants.W_OK);
        console.log(`Directory is writable: ${dirPath}`);
      } catch (err) {
        console.error(`Directory is not writable: ${dirPath}`, err);
        // Try to set permissions
        try {
          fs.chmodSync(dirPath, 0o755);
          console.log(`Set permissions on directory: ${dirPath}`);
        } catch (chmodErr) {
          console.error(`Failed to set permissions on directory: ${dirPath}`, chmodErr);
        }
      }
    }
  } catch (err) {
    console.error(`Error ensuring directory exists: ${dirPath}`, err);
  }
};

// Ensure required directories exist
ensureDirectoryExists(uploadsDir);
ensureDirectoryExists(profilesDir);

// Init express
const app = express();

// Connect Database
connectDB();

// Init Middleware with better error handling
app.use(express.json({ 
  extended: false,
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      console.error('JSON verification failed:', {
        error: e.message,
        body: buf.toString(),
        url: req.url,
        method: req.method
      });
      throw new Error('Invalid JSON format');
    }
  }
}));

// Enhanced error handling for JSON parsing (must come after express.json())
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSON parsing error:', {
      error: err.message,
      body: err.body,
      url: req.url,
      method: req.method,
      headers: req.headers
    });
    return res.status(400).json({ 
      message: 'Invalid JSON format in request body',
      error: 'The request body must be valid JSON'
    });
  }
  next();
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', {
    'content-type': req.headers['content-type'],
    'user-agent': req.headers['user-agent'],
    'content-length': req.headers['content-length']
  });
  
  // Log body for POST/PUT requests to auth endpoints
  if ((req.method === 'POST' || req.method === 'PUT') && req.url.includes('/api/auth/')) {
    console.log('Request body preview:', req.body ? JSON.stringify(req.body).substring(0, 200) + '...' : 'No body');
  }
  
  next();
});

// Add route handlers
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const messagesRoutes = require('./routes/messages');
const chatsRoutes = require('./routes/chats');

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/chats', chatsRoutes);

// Add base route for testing connection
app.get('/', (req, res) => {
  res.send('Chat API is running');
});

// Create HTTP server
const server = http.createServer(app);

// Set up socket.io
const io = setupSocket(server);

// Make io available to routes
app.set('io', io);

// Start the server with http server instead of app
server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
}); 