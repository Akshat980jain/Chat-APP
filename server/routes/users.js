const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/profiles');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max size
  fileFilter: fileFilter
});

// Get all users except current user
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } })
      .select('-password')
      .sort({ name: 1 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    console.log('Profile update request received:', req.body);
    
    const { name, phoneNumber, status } = req.body;
    const userId = req.user.id;
    
    // Find user by ID
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Update fields if provided
    if (name) user.name = name;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (status) user.status = status;
    
    // Save the updated user
    await user.save();
    
    // Return user without password
    const updatedUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      status: user.status,
      profilePicture: user.profilePicture,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen
    };
    
    console.log('User profile updated successfully:', updatedUser.name);
    res.json(updatedUser);
  } catch (err) {
    console.error('Error updating profile:', err.message);
    res.status(500).send('Server error');
  }
});

// Update last seen
router.put('/last-seen', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.lastSeen = new Date();
    user.isOnline = false;
    await user.save();
    res.json({ message: 'Last seen updated' });
  } catch (error) {
    console.error('Error updating last seen:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Set user online status
router.put('/status', auth, async (req, res) => {
  try {
    const { isOnline } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.isOnline = isOnline;
    if (!isOnline) {
      user.lastSeen = new Date();
    }
    
    await user.save();
    res.json({ message: 'Status updated', isOnline });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search user by phone number
router.get('/search/phone/:phoneNumber', auth, async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    console.log('Phone search request:', { 
      phoneNumber, 
      searchingUserId: req.user.id 
    });
    
    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    
    // Create a normalized version of the phone number for comparison
    // This removes spaces, hyphens, and other formatting
    const normalizedPhoneNumber = phoneNumber.replace(/\D/g, '');
    console.log('Normalized phone number:', normalizedPhoneNumber);
    
    // Find users where either the raw phone number or normalized version matches
    const users = await User.find({
      $and: [
        { _id: { $ne: req.user.id } }, // Not the current user
        { 
          $or: [
            { phoneNumber: phoneNumber },
            { phoneNumber: normalizedPhoneNumber },
            // Allow for partial matches at the end (e.g., without country code)
            { phoneNumber: { $regex: normalizedPhoneNumber + '$' } }
          ]
        }
      ]
    }).select('-password');
    
    console.log('Found users:', users.length);
    
    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'No user found with this phone number' });
    }
    
    // Return the first matching user
    res.json(users[0]);
  } catch (error) {
    console.error('Error searching user by phone:', error);
    res.status(500).json({ message: 'Server error during phone search' });
  }
});

// @route   PUT api/users/password
// @desc    Update user password
// @access  Private
router.put('/password', auth, async (req, res) => {
  try {
    console.log('Password update request received');
    
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    // Validate inputs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ msg: 'Current password and new password are required' });
    }
    
    // Find user by ID
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(400).json({ msg: 'Current password is incorrect' });
    }
    
    // Set new password
    user.password = newPassword;
    
    // Save the updated user
    await user.save();
    
    console.log('Password updated successfully for user:', user.name);
    res.json({ msg: 'Password updated successfully' });
  } catch (err) {
    console.error('Error updating password:', err.message);
    res.status(500).send('Server error');
  }
});

// Upload profile picture
router.post('/profile/picture', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    // Log info about the uploaded file
    console.log('Uploading profile picture:', req.file);
    
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }
    
    // Get server host from request or use default
    const protocol = req.protocol || 'http';
    const host = req.get('host') || process.env.SERVER_HOST || '192.168.28.6:5000';
    
    // Create URL for the profile picture
    const relativeFilePath = '/uploads/profiles/' + req.file.filename;
    
    // Always use absolute URL for profile pictures to ensure they work across different clients
    const profilePictureUrl = `${protocol}://${host}${relativeFilePath}`;
    
    console.log('Setting profile picture URL:', profilePictureUrl);
    
    // Update user's profile picture using the correct user ID reference
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { profilePicture: profilePictureUrl } },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      status: user.status,
      profilePicture: user.profilePicture,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen
    });
  } catch (err) {
    console.error('Error uploading profile picture:', err);
    // Check if error is from multer
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ msg: 'File too large, max size is 5MB' });
    }
    res.status(500).json({ msg: err.message || 'Server error' });
  }
});

module.exports = router; 