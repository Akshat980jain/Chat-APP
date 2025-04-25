const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    // Try both token formats
    let token = req.header('Authorization');
    let tokenType = 'Authorization';
    
    // If Authorization header is not present, try x-auth-token
    if (!token) {
      token = req.header('x-auth-token');
      tokenType = 'x-auth-token';
    }
    
    console.log(`Auth middleware - ${tokenType} header:`, token ? 'Present' : 'Missing');
    console.log('Request path:', req.path);
    console.log('Request method:', req.method);
    
    // Check if no token in either format
    if (!token) {
      console.log('No token provided in request');
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
      // Extract token value - handle Bearer format if needed
      const tokenValue = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
      console.log('Token value extracted:', tokenValue ? 'Valid token' : 'Empty token');
      
      if (!tokenValue) {
        return res.status(401).json({ msg: 'Invalid token format' });
      }
      
      // Use environment variable for JWT secret if available, otherwise use a fallback
      const jwtSecret = process.env.JWT_SECRET || 'chat_app_jwt_secret';
      const decoded = jwt.verify(tokenValue, jwtSecret);
      
      // Extract user ID from decoded token - support multiple formats
      const userId = decoded.user?.id || decoded.id || decoded.userId;
      console.log('Token verified successfully, user ID:', userId || 'MISSING ID');
      
      // Check if we have a user ID
      if (!userId) {
        console.error('Token payload missing user ID', decoded);
        return res.status(401).json({ msg: 'Invalid token - missing user ID' });
      }
      
      // Set standardized user info on request object
      req.user = {
        id: userId,
        userId: userId, // Add both formats for compatibility
        ...(decoded.user || {}) // Include any other user info from token
      };
      
      next();
    } catch (err) {
      console.error('Token verification error:', err.message);
      
      // More descriptive error messages
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ msg: 'Token has expired, please login again' });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ msg: 'Invalid token, please login again' });
      }
      
      res.status(401).json({ msg: 'Token is not valid' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(500).json({ msg: 'Server error during authentication' });
  }
}; 