import React, { useState, useEffect, memo } from 'react';

// Get the API_BASE_URL from localStorage or environment variables
const API_BASE_URL = localStorage.getItem('api_url') || process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Generate a UI avatar URL based on name or initials
const generateAvatarUrl = (name) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random&size=256`;
};

// Simple function to properly format image URLs
const getImageUrl = (url) => {
  if (!url) return null;
  
  // If it's already a full URL, return it as is
  if (url.startsWith('http')) {
    return url;
  }
  
  // Make sure the URL starts with a slash if it doesn't already
  const formattedUrl = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE_URL}${formattedUrl}`;
};

const ProfilePicture = memo(({ 
  userId, 
  size = 'md', 
  showStatus = true, 
  className = '', 
  nameOnly = false,
  shape = 'circle' // 'circle' or 'square'
}) => {
  const [user, setUser] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  // Bootstrap size classes mapping
  const sizeClasses = {
    xs: { width: '24px', height: '24px', fontSize: '12px' },
    sm: { width: '32px', height: '32px', fontSize: '14px' },
    md: { width: '40px', height: '40px', fontSize: '16px' },
    lg: { width: '56px', height: '56px', fontSize: '20px' },
    xl: { width: '80px', height: '80px', fontSize: '30px' }
  };
  
  // Shape classes
  const shapeClass = shape === 'square' ? 'rounded-3' : 'rounded-circle';

  // Status indicator size classes
  const statusSizeClasses = {
    xs: { width: '8px', height: '8px' },
    sm: { width: '10px', height: '10px' },
    md: { width: '12px', height: '12px' },
    lg: { width: '14px', height: '14px' },
    xl: { width: '16px', height: '16px' }
  };

  // Get user data and set image URL
  useEffect(() => {
    // Initial fallback image with user ID
    if (userId) {
      setImageUrl(generateAvatarUrl(userId.substring(0, 2)));
      
      // Only try to fetch user data if userId is provided
      fetch(`${API_BASE_URL}/api/users/${userId}`)
        .then(res => res.json())
        .then(data => {
          setUser(data);
          // If user has profile picture, use it
          if (data.profilePicture) {
            const formattedUrl = getImageUrl(data.profilePicture);
            setImageUrl(formattedUrl);
          } else {
            // Otherwise use generated avatar with user's name
            setImageUrl(generateAvatarUrl(data.name));
          }
        })
        .catch(err => {
          console.warn('Error fetching user:', err);
          // Keep using fallback avatar on error
        });
    }
  }, [userId]);

  // Return name only version
  if (nameOnly) {
    return <span className="fw-medium text-dark">{user?.name || 'User'}</span>;
  }

  // Get initials for fallback display
  const userInitials = user?.name?.charAt(0) || userId?.charAt(0) || 'U';
  const isOnline = user?.isOnline || false;
  
  return (
    <div 
      className={`position-relative ${shapeClass} ${className} shadow-sm overflow-hidden`} 
      style={sizeClasses[size] || sizeClasses.md}
    >
      {/* Use background and fallback together to ensure something always displays */}
      <div 
        className="w-100 h-100 d-flex align-items-center justify-content-center"
        style={{
          background: `url(${imageUrl}) center/cover no-repeat, #e0e0e0`,
          color: '#fff',
          textShadow: '0 0 2px rgba(0,0,0,0.7)',
          fontWeight: 'bold'
        }}
      >
        {userInitials}
      </div>
      
      {/* Online/Offline Status Indicator */}
      {showStatus && user && (
        <span 
          className={`position-absolute bottom-0 end-0 border border-white rounded-circle ${isOnline ? 'bg-success' : 'bg-secondary'}`}
          style={statusSizeClasses[size] || statusSizeClasses.md}
        />
      )}
    </div>
  );
});

export default ProfilePicture; 