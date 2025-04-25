/**
 * Utility functions for the chat application
 */

/**
 * Get the correct URL for an image based on the server configuration
 * 
 * @param {string} url - The original image URL or path
 * @returns {string} - The properly formatted image URL
 */
export const getImageUrl = (url) => {
  if (!url) return '';
  
  // If it's already a complete URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Get the API URL from localStorage or environment
  const apiUrl = localStorage.getItem('api_url') || process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  // If it's a relative path, prepend the API URL
  if (url.startsWith('/')) {
    return `${apiUrl}${url}`;
  }
  
  // Otherwise construct the URL with the API URL
  return `${apiUrl}/${url}`;
};

/**
 * Format a date to a human-readable format
 * 
 * @param {Date|string} date - The date to format
 * @returns {string} - The formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if it's a valid date
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  const now = new Date();
  const diffInDays = Math.floor((now - dateObj) / (1000 * 60 * 60 * 24));
  
  // Today
  if (diffInDays === 0) {
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // Yesterday
  if (diffInDays === 1) {
    return 'Yesterday';
  }
  
  // This week
  if (diffInDays < 7) {
    return dateObj.toLocaleDateString([], { weekday: 'long' });
  }
  
  // Earlier
  return dateObj.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
};

/**
 * Gets a fallback image for a user based on their name
 * @param {string} name - User's name
 * @returns {string} - URL to a placeholder avatar
 */
export const getNameInitialsAvatarUrl = (name) => {
  if (!name) return '';
  const encodedName = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encodedName}&background=random`;
}; 