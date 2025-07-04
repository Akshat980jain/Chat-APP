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

const AddChatByPhone = ({
  open,
  onClose,
  onAdd,
  error = '',
}) => {
  const [phone, setPhone] = useState('');
  const [inputError, setInputError] = useState('');
  const [userFound, setUserFound] = useState(null);
  const [userNotFound, setUserNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const { refreshToken, user } = useAuth();

  const handleAdd = () => {
    // Basic phone validation (10-15 digits, allow +, -, spaces)
    const phoneRegex = /^[\d\s\-+()]{10,15}$/;
    if (!phoneRegex.test(phone)) {
      setInputError('Please enter a valid phone number (10-15 digits)');
      return;
    }
    setInputError('');
    onAdd(phone);
  };

  const handleInputChange = (e) => {
    setPhone(e.target.value);
    setInputError('');
  };

  const handleClose = () => {
    setPhone('');
    setInputError('');
    onClose();
  };

  const handleSearchByPhone = async () => {
    if (!phone) {
      setInputError('Please enter a phone number');
      return;
    }

    // Reset states before starting new search
    setInputError('');
    setUserFound(null);
    setUserNotFound(false);
    setLoading(true);
    
    try {
      // Try to refresh token before searching
      try {
        await refreshToken();
      } catch (refreshError) {
        // Continue with existing token if refresh fails
      }
      
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required - no token found');
      }
      
      // Make the API call with explicit URL and properly formatted Authorization header
      const response = await axios.get(`${API_BASE_URL}/api/users/search/phone/${phone}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Check if the found user is the current user
      if (response.data && response.data._id === user.id) {
        setInputError("You can't add yourself as a contact");
        return;
      }
      
      setUserFound(response.data);
    } catch (error) {
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
      
      setInputError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChat = () => {
    if (userFound) {
      onAdd(userFound);
      handleReset();
    }
  };

  const handleReset = () => {
    setPhone('');
    setInputError('');
    setUserFound(null);
    setUserNotFound(false);
    onClose();
  };

  const formatPhoneNumber = (value) => {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, '');
    
    // Format the number as XXX-XXX-XXXX
    let formatted = cleaned;
    if (cleaned.length > 3) {
      formatted = cleaned.slice(0, 3);
    }
    if (cleaned.length > 6) {
      formatted = formatted.slice(0, 7) + '-' + formatted.slice(7);
    }
    
    setPhone(formatted);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add Chat by Phone</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Phone Number"
            value={phone}
            onChange={handleInputChange}
            fullWidth
            disabled={loading}
            error={!!inputError}
            helperText={inputError || 'Enter the phone number of the user you want to chat with.'}
            autoFocus
          />
          {error && (
            <Typography color="error" variant="body2">{error}</Typography>
          )}
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
      <DialogActions sx={{ justifyContent: 'center', gap: 2 }}>
        <Button onClick={handleClose} disabled={loading} variant="outlined">
          Cancel
        </Button>
        {!userFound && !userNotFound ? (
          <Button 
            onClick={handleSearchByPhone} 
            disabled={loading || !phone}
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={24} /> : <PersonSearchIcon />}
          >
            {loading ? 'Searching...' : 'Search'}
          </Button>
        ) : userFound ? (
          <Button
            onClick={handleAddChat}
            disabled={loading}
            variant="contained"
            color="primary"
            startIcon={<PersonAddIcon />}
          >
            Add Chat
          </Button>
        ) : (
          <Button 
            onClick={() => {
              setUserNotFound(false);
              setPhone('');
            }} 
            disabled={loading}
            variant="contained"
            color="primary"
          >
            Try Again
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AddChatByPhone; 