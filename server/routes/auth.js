const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const axios = require('axios');
const auth = require('../middleware/auth');

// Register new user
router.post('/register', async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    const { name, email, phoneNumber, password } = req.body;

    // Input validation
    if (!name || !email || !password || !phoneNumber) {
      console.log('Missing required fields:', { name, email, phoneNumber, password: password ? 'provided' : 'missing' });
      return res.status(400).json({ message: 'Please provide name, email, phone number and password' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Phone number validation
    const phoneRegex = /^[\d\s\-+()]{10,15}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\D/g, '')) || phoneNumber.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ message: 'Please provide a valid phone number (at least 10 digits)'});
    }

    // Check if user already exists
    console.log('Checking if user exists with email:', email);
    let user = await User.findOne({ email });
    if (user) {
      console.log('User already exists with email:', email);
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create user profile picture URL if not provided
    const profilePicture = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

    // Create new user
    console.log('Creating new user with email:', email);
    user = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: phoneNumber ? phoneNumber.trim() : '',
      password: password,
      profilePicture,
      status: 'Hey there! I am using Chat App',
      isOnline: true,
      lastSeen: new Date()
    });

    // Save user - this will trigger the pre-save hook to hash the password
    console.log('Saving user to database...');
    await user.save();
    console.log('User saved successfully with ID:', user._id);

    // Find or create admin user for welcome message
    console.log('Looking for admin user...');
    let adminUser = await User.findOne({ email: 'admin@chatapp.com' });
    
    if (!adminUser) {
      console.log('Admin user not found, creating one...');
      const adminPassword = 'Admin@' + Math.random().toString(36).substring(2, 10);
      console.log('Created admin password (for debugging):', adminPassword);
      
      adminUser = new User({
        name: 'Chat App',
        email: 'admin@chatapp.com',
        password: adminPassword,
        profilePicture: 'https://ui-avatars.com/api/?name=Chat+Admin&background=128C7E&color=fff',
        status: 'Welcome to the Chat App!',
        isOnline: true
      });
      
      console.log('Saving admin user...');
      await adminUser.save();
      console.log('Admin user saved with ID:', adminUser._id);
    } else {
      console.log('Admin user found with ID:', adminUser._id);
    }
    
    // Create welcome chat
    console.log('Creating welcome chat between user and admin...');
    const welcomeChat = new Chat({
      participants: [user._id, adminUser._id],
      createdBy: adminUser._id,
      isGroup: false
    });
    
    console.log('Saving welcome chat...');
    await welcomeChat.save();
    console.log('Welcome chat created with ID:', welcomeChat._id);
    
    // Create welcome message
    console.log('Creating welcome message...');
    const welcomeMessage = new Message({
      sender: adminUser._id,
      recipient: user._id,
      content: `Welcome to the Chat App, ${user.name}! You can start chatting with your friends now. Enjoy!`,
      status: 'delivered'
    });
    
    console.log('Saving welcome message...');
    await welcomeMessage.save();
    console.log('Welcome message saved with ID:', welcomeMessage._id);
    
    // Update chat with last message
    console.log('Updating chat with last message...');
    welcomeChat.lastMessage = welcomeMessage._id;
    await welcomeChat.save();
    console.log('Chat updated successfully');

    // Generate JWT token
    console.log('Generating JWT token for user...');
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'chat_app_jwt_secret',
      { expiresIn: '7d' }
    );

    console.log('Registration process completed successfully');
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Registration error details:', error);
    
    // More detailed error handling
    if (error.name === 'ValidationError') {
      console.error('Validation error:', error.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    if (error.code === 11000) {
      console.error('Duplicate key error:', error);
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    // Log the full error for debugging
    console.error('Full registration error:', error);
    
    res.status(500).json({ 
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    console.log('Login request received:', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      contentType: req.headers['content-type'],
      body: req.body,
      bodyType: typeof req.body,
      bodyKeys: req.body ? Object.keys(req.body) : 'no body'
    });
    
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      console.error('Invalid request body type:', typeof req.body, req.body);
      return res.status(400).json({ 
        message: 'Invalid request format. Expected JSON object with email and password.' 
      });
    }
    
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Missing credentials in login request:', { 
        hasEmail: !!email, 
        hasPassword: !!password,
        bodyKeys: Object.keys(req.body)
      });
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Validate email format
    if (typeof email !== 'string' || !email.includes('@')) {
      console.error('Invalid email format:', email);
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Validate password format
    if (typeof password !== 'string' || password.length === 0) {
      console.error('Invalid password format:', typeof password);
      return res.status(400).json({ message: 'Please provide a valid password' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`Login failed: User not found with email ${email}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`Login failed: Invalid password for user ${email}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'chat_app_jwt_secret',
      { expiresIn: '7d' }
    );

    // Update last login timestamp
    await User.findByIdAndUpdate(user._id, {
      lastLogin: new Date(),
      isOnline: true
    });

    console.log(`Login successful for user ${email}`);

    // Send successful response with detailed user info
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture,
        isOnline: true,
        lastLogin: new Date()
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Server error during login',
      error: error.message
    });
  }
});

// @route   GET /api/auth/refresh-token
// @desc    Refresh the user's authentication token
// @access  Private
router.get('/refresh-token', auth, async (req, res) => {
  try {
    // Since the auth middleware has verified the token and extracted user,
    // we can directly generate a new token with the user's id
    const userId = req.user.id;
    
    // Find user to ensure they still exist and are active
    const user = await User.findById(userId)
      .select('-password')
      .lean();
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate a new token with fresh expiration
    const payload = {
      id: userId
    };
    
    const secret = process.env.JWT_SECRET || 'chat_app_jwt_secret';
    
    // Default token expiration is 24 hours
    jwt.sign(
      payload,
      secret,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user
        });
      }
    );
  } catch (err) {
    console.error('Token refresh error:', err.message);
    res.status(500).json({ message: 'Server error during token refresh' });
  }
});

module.exports = router; 