import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  Avatar, 
  Box, 
  Typography, 
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Collapse,
  useMediaQuery,
  useTheme,
  Badge
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LockIcon from '@mui/icons-material/Lock';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

// Add API base URL constant
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

const ProfileMenu = memo(({ open, handleClose }) => {
  const { user, updateUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const fileInputRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [profileImageSrc, setProfileImageSrc] = useState(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phoneNumber: user?.phoneNumber || '',
    status: user?.status || 'Available'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Set profile image source when user data changes
  useEffect(() => {
    if (user && user.profilePicture) {
      setProfileImageSrc(getImageUrl(user.profilePicture));
    } else {
      setProfileImageSrc(null);
    }
  }, [user]);

  // Reset form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phoneNumber: user.phoneNumber || '',
        status: user.status || 'Available'
      });
    }
  }, [user]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handlePasswordChange = useCallback((e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleEditToggle = useCallback(() => {
    if (editMode) {
      // Reset form data when canceling edit
      setFormData({
        name: user?.name || '',
        phoneNumber: user?.phoneNumber || '',
        status: user?.status || 'Available'
      });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      // Reset preview image if any
      setPreviewImage(null);
    }
    setEditMode(!editMode);
    setShowPasswordFields(false);
  }, [editMode, user]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const source = axios.CancelToken.source();
    
    try {
      const response = await axios.put('/api/users/profile', formData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        cancelToken: source.token
      });
      
      if (response.data) {
        updateUser(response.data);
        setSuccess('Profile updated successfully!');
        setEditMode(false);
      }
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log('Request canceled:', err.message);
      } else {
        console.error('Error updating profile:', err);
        setError(err.response?.data?.msg || err.response?.data?.message || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
    
    return () => {
      source.cancel('Operation canceled by the user.');
    };
  }, [formData, updateUser]);

  const handlePasswordSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Validate password fields
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const source = axios.CancelToken.source();
    
    try {
      const response = await axios.put('/api/users/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        cancelToken: source.token
      });
      
      if (response.data) {
        setSuccess('Password updated successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowPasswordFields(false);
      }
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log('Request canceled:', err.message);
      } else {
        console.error('Error updating password:', err);
        setError(err.response?.data?.msg || err.response?.data?.message || 'Failed to update password');
      }
    } finally {
      setLoading(false);
    }
    
    return () => {
      source.cancel('Operation canceled by the user.');
    };
  }, [passwordData]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current.click();
  }, []);

  const uploadProfilePicture = useCallback(async (file) => {
    if (!file) {
      if (fileInputRef.current.files.length === 0) {
        setError('Please select an image file');
        return;
      }
      file = fileInputRef.current.files[0];
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError('');
    
    console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    const source = axios.CancelToken.source();
    
    try {
      // Use the full API URL
      const response = await axios.post(`${API_BASE_URL}/api/users/profile/picture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        onUploadProgress: progressEvent => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log('Upload progress:', percentCompleted);
          setUploadProgress(percentCompleted);
        },
        cancelToken: source.token
      });
      
      if (response.data) {
        // Update user state
        updateUser(response.data);
        setSuccess('Profile picture updated successfully!');
        setPreviewImage(null);
        
        // Set the new image source
        if (response.data.profilePicture) {
          setProfileImageSrc(getImageUrl(response.data.profilePicture));
        }
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log('Upload canceled:', err.message);
      } else {
        console.error('Error uploading profile picture:', err);
        console.error('Response data:', err.response?.data);
        console.error('Status code:', err.response?.status);
        setError(err.response?.data?.msg || err.response?.data?.message || 'Failed to upload profile picture');
      }
    } finally {
      setIsUploading(false);
    }
    
    return () => {
      source.cancel('Upload canceled by the user.');
    };
  }, [updateUser]);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, JPG, PNG, GIF)');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);

    // If not in edit mode, upload immediately
    if (!editMode) {
      uploadProfilePicture(file);
    }
  }, [editMode, uploadProfilePicture]);

  const closeSnackbar = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  const handleDialogClose = useCallback(() => {
    // Reset states
    setPreviewImage(null);
    setShowPasswordFields(false);
    if (editMode) {
      setEditMode(false);
    }
    handleClose();
  }, [handleClose, editMode]);

  if (!user) return null;

  // Generate a fallback color for the avatar
  const getRandomColor = () => {
    const str = user.name || user.email || 'User';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleDialogClose} 
      fullWidth 
      maxWidth="sm"
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 1,
          m: isMobile ? 0 : 2,
          height: isMobile ? '100%' : 'auto',
          overflowY: 'auto'
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          py: 2,
          px: isMobile ? 2 : 3
        }}
      >
        <Typography variant="h6">Your Profile</Typography>
        <IconButton 
          onClick={handleDialogClose} 
          aria-label="close"
          sx={{ 
            padding: isMobile ? 1 : 1.5
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent 
        sx={{ 
          p: isMobile ? 2 : 3,
          overflowX: 'hidden'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          mb: 3 
        }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <IconButton 
                onClick={triggerFileInput}
                sx={{ 
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: previewImage ? 'success.main' : 'divider',
                  '&:hover': { bgcolor: 'action.hover' },
                  width: 36,
                  height: 36,
                  color: previewImage ? 'success.main' : 'primary.main'
                }}
                aria-label="Change profile picture"
              >
                <PhotoCameraIcon fontSize="small" />
              </IconButton>
            }
          >
            {previewImage ? (
              <Avatar 
                src={previewImage} 
                alt={`${user.name} (preview)`}
                sx={{ 
                  width: isMobile ? 80 : 100, 
                  height: isMobile ? 80 : 100, 
                  mb: 2,
                  bgcolor: 'primary.main',
                  border: '3px solid',
                  borderColor: 'success.light',
                  boxShadow: '0 0 10px rgba(76, 175, 80, 0.5)'
                }}
              >
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
            ) : (
              <div
                style={{
                  width: isMobile ? 80 : 100,
                  height: isMobile ? 80 : 100,
                  borderRadius: '50%',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#fff',
                  textShadow: '0 0 2px rgba(0,0,0,0.5)',
                  border: '2px solid',
                  borderColor: 'divider',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  background: `url(${profileImageSrc}) center/cover no-repeat, ${getRandomColor()}`,
                }}
              >
                {!profileImageSrc && (user.name?.charAt(0).toUpperCase() || 'U')}
              </div>
            )}
          </Badge>
          
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/jpeg, image/png, image/gif"
            onChange={handleFileChange}
          />
          
          {isUploading && (
            <Box sx={{ width: '100%', mt: 2 }}>
              <Typography variant="body2" align="center">
                Uploading: {uploadProgress}%
              </Typography>
              <CircularProgress 
                variant="determinate" 
                value={uploadProgress} 
                size={24} 
                sx={{ mt: 1, mb: 1 }}
              />
            </Box>
          )}
          
          {previewImage && (
            <Button 
              variant="contained" 
              color="primary" 
              sx={{ mt: 2 }}
              onClick={() => uploadProfilePicture()}
              disabled={isUploading}
              size="small"
              startIcon={<PhotoCameraIcon />}
            >
              {editMode ? 'Upload New Picture' : 'Apply New Picture'}
            </Button>
          )}
        </Box>
        
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            fullWidth
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={!editMode}
            variant={editMode ? "outlined" : "filled"}
            inputProps={{ style: { fontSize: isMobile ? 16 : 'inherit' } }}
          />
          
          <TextField
            margin="normal"
            fullWidth
            label="Email"
            value={user.email}
            disabled
            variant="filled"
            helperText="Email cannot be changed"
            inputProps={{ style: { fontSize: isMobile ? 16 : 'inherit' } }}
          />
          
          <TextField
            margin="normal"
            fullWidth
            label="Phone Number"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            disabled={!editMode}
            variant={editMode ? "outlined" : "filled"}
            inputProps={{ style: { fontSize: isMobile ? 16 : 'inherit' } }}
          />
          
          <TextField
            margin="normal"
            fullWidth
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            disabled={!editMode}
            variant={editMode ? "outlined" : "filled"}
            inputProps={{ style: { fontSize: isMobile ? 16 : 'inherit' } }}
            helperText="Set a status message that other users can see"
          />
          
          {/* Password fields that can be toggled */}
          <Box sx={{ mt: 3, mb: 2 }}>
            <Box 
              onClick={() => editMode && setShowPasswordFields(!showPasswordFields)}
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: editMode ? 'pointer' : 'default',
                opacity: editMode ? 1 : 0.7,
                p: 1,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LockIcon sx={{ mr: 1 }} />
                <Typography variant="subtitle1">Change Password</Typography>
              </Box>
              {editMode && (
                showPasswordFields ? <ExpandLessIcon /> : <ExpandMoreIcon />
              )}
            </Box>
            
            <Collapse in={showPasswordFields && editMode}>
              <Box component="form" onSubmit={handlePasswordSubmit} sx={{ mt: 2 }}>
                <TextField
                  margin="normal"
                  fullWidth
                  label="Current Password"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  InputProps={{ style: { fontSize: isMobile ? 16 : 'inherit' } }}
                />
                
                <TextField
                  margin="normal"
                  fullWidth
                  label="New Password"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  InputProps={{ style: { fontSize: isMobile ? 16 : 'inherit' } }}
                />
                
                <TextField
                  margin="normal"
                  fullWidth
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  InputProps={{ style: { fontSize: isMobile ? 16 : 'inherit' } }}
                />
                
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ mt: 2 }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Update Password'}
                </Button>
              </Box>
            </Collapse>
          </Box>
          
          <DialogActions sx={{ p: isMobile ? 1 : 2, mt: 2 }}>
            {!editMode ? (
              <Button
                onClick={handleEditToggle}
                variant="contained"
                color="primary"
                fullWidth
              >
                Edit Profile
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleEditToggle}
                  variant="outlined"
                  sx={{ mr: 1, flex: 1 }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  sx={{ flex: 1 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                </Button>
              </>
            )}
          </DialogActions>
        </Box>
      </DialogContent>
      
      <Snackbar 
        open={!!error || !!success} 
        autoHideDuration={6000} 
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={closeSnackbar} 
          severity={error ? "error" : "success"} 
          sx={{ width: '100%' }}
        >
          {error || success}
        </Alert>
      </Snackbar>
    </Dialog>
  );
});

export default ProfileMenu; 