import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Box,
  Alert,
  Avatar,
  Paper
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

// Get API base URL from localStorage or environment
const API_BASE_URL = localStorage.getItem('api_url') || process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper function for image URLs
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

const AddChatByPhone = ({ open, onClose, onUserFound }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userFound, setUserFound] = useState(null);
  const [userNotFound, setUserNotFound] = useState(false);
  const { refreshToken, user } = useAuth();

  const handleSearchByPhone = async () => {
    if (!phoneNumber) {
      setError('Please enter a phone number');
      return;
    }

    // Reset states before starting new search
    setError('');
    setUserFound(null);
    setUserNotFound(false);
    setLoading(true);
    
    try {
      console.log('Searching for user with phone number:', phoneNumber);
      
      // Try to refresh token before searching
      try {
        await refreshToken();
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Continue with existing token if refresh fails
      }
      
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required - no token found');
      }
      
      // Make the API call with explicit URL and properly formatted Authorization header
      const response = await axios.get(`${API_BASE_URL}/api/users/search/phone/${phoneNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('User search response:', response.data);
      
      // Check if the found user is the current user
      if (response.data && response.data._id === user.id) {
        setError("You can't add yourself as a contact");
        return;
      }
      
      setUserFound(response.data);
    } catch (error) {
      console.error('Error searching user by phone:', error);
      
      let errorMessage = 'Failed to search user';
      
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        
        if (error.response.status === 404) {
          setUserNotFound(true);
          errorMessage = '';
        } else if (error.response.status === 401) {
          errorMessage = 'Authentication error. Please log in again.';
          // Try one more token refresh if there's a 401 error
          try {
            await refreshToken();
            // If token refresh succeeds, try the search again
            handleSearchByPhone();
            return;
          } catch (refreshError) {
            errorMessage = 'Your session has expired. Please log in again.';
          }
        } else {
          errorMessage = error.response.data.message || error.response.data.msg || errorMessage;
        }
      } else if (error.request) {
        // Request was made but no response
        console.error('No response received:', error.request);
        errorMessage = 'No response from server. Check your connection.';
      } else {
        // Something else caused the error
        errorMessage = error.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChat = () => {
    if (userFound) {
      onUserFound(userFound);
      handleReset();
    }
  };

  const handleReset = () => {
    setPhoneNumber('');
    setError('');
    setUserFound(null);
    setUserNotFound(false);
    onClose();
  };

  const formatPhoneNumber = (value) => {
    // Allow only numbers, hyphens, plus sign, and spaces
    const cleaned = value.replace(/[^\d\s\-+]/g, '');
    setPhoneNumber(cleaned);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAddIcon color="primary" />
          <Typography variant="h6">Add Chat by Phone Number</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            fullWidth
            label="Phone Number"
            variant="outlined"
            value={phoneNumber}
            onChange={(e) => formatPhoneNumber(e.target.value)}
            placeholder="Enter phone number (e.g., 123-456-7890)"
            disabled={loading}
            helperText="Use format like 123-456-7890 or +1 123 456 7890"
            autoFocus
          />
          
          {error && <Alert severity="error">{error}</Alert>}
          
          {userNotFound && (
            <Paper 
              elevation={0} 
              sx={{ 
                mt: 2, 
                p: 3, 
                bgcolor: 'error.light', 
                color: 'error.contrastText',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              <PersonOffIcon sx={{ fontSize: 48, mb: 1, color: 'error.main' }} />
              <Typography variant="h6">User Not Found</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                No user is registered with this phone number.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Please check the number and try again.
              </Typography>
            </Paper>
          )}
          
          {userFound && (
            <Paper 
              elevation={3} 
              sx={{ 
                mt: 2, 
                p: 3, 
                bgcolor: 'success.light', 
                color: 'success.contrastText',
                borderRadius: 2 
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar 
                  src={getImageUrl(userFound.profilePicture)} 
                  sx={{ width: 56, height: 56 }}
                >
                  {userFound.name?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6">User Found!</Typography>
                  <Typography variant="body1">Name: {userFound.name}</Typography>
                  <Typography variant="body2">Email: {userFound.email}</Typography>
                  <Typography variant="body2">Phone: {userFound.phoneNumber}</Typography>
                </Box>
              </Box>
            </Paper>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleReset} color="inherit" variant="outlined">
          Cancel
        </Button>
        {!userFound && !userNotFound ? (
          <Button 
            onClick={handleSearchByPhone} 
            color="primary" 
            variant="contained"
            disabled={loading || !phoneNumber}
            startIcon={loading ? <CircularProgress size={20} /> : <PersonSearchIcon />}
          >
            {loading ? 'Searching...' : 'Search'}
          </Button>
        ) : userFound ? (
          <Button
            onClick={handleAddChat}
            color="primary"
            variant="contained"
            startIcon={<PersonAddIcon />}
          >
            Add Chat
          </Button>
        ) : (
          <Button 
            onClick={() => {
              setUserNotFound(false);
              setPhoneNumber('');
            }} 
            color="primary" 
            variant="contained"
          >
            Try Again
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AddChatByPhone; 