import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Avatar,
  Grid,
  CircularProgress,
  IconButton,
  Collapse,
  Alert,
  Badge,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import LockIcon from '@mui/icons-material/Lock';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { getImageUrl } from '../utils/helpers';

const Profile = () => {
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
  
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    status: 'Available'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phoneNumber: user.phoneNumber || '',
        status: user.status || 'Available'
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditToggle = () => {
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.put('/api/users/profile', formData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data) {
        updateUser(response.data);
        setSuccess('Profile updated successfully!');
        setEditMode(false);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.msg || err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
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
    
    try {
      const response = await axios.put('/api/users/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
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
      console.error('Error updating password:', err);
      setError(err.response?.data?.msg || err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
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
  };

  const uploadProfilePicture = async (file) => {
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
    
    try {
      const apiUrl = localStorage.getItem('api_url') || process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      // Use the full API URL instead of a relative path
      const response = await axios.post(`${apiUrl}/api/users/profile/picture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        onUploadProgress: progressEvent => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log('Upload progress:', percentCompleted);
          setUploadProgress(percentCompleted);
        }
      });
      
      if (response.data) {
        // Update user state
        updateUser(response.data);
        setSuccess('Profile picture updated successfully!');
        setPreviewImage(null);
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      setError(err.response?.data?.msg || err.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setIsUploading(false);
    }
  };

  const closeSnackbar = () => {
    setError('');
    setSuccess('');
  };

  if (!user) {
    return (
      <Container className="py-8">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" className="py-8">
      <Box className="mb-6">
        <Typography variant="h4" className="font-display font-bold text-neutral-900 dark:text-white mb-2">
          My Profile
        </Typography>
        <Typography variant="body1" className="text-neutral-600 dark:text-neutral-300">
          View and manage your profile information
        </Typography>
      </Box>

      {/* Success Alert */}
      {success && (
        <Alert 
          severity="success" 
          className="mb-4"
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={closeSnackbar}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          {success}
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          className="mb-4"
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={closeSnackbar}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          {error}
        </Alert>
      )}

      <Paper className="card-glass overflow-hidden shadow-md rounded-lg p-6">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" className="font-display font-semibold text-neutral-900 dark:text-white">
            Personal Information
          </Typography>
          <Button
            variant={editMode ? "outlined" : "contained"}
            color={editMode ? "error" : "primary"}
            startIcon={editMode ? <CloseIcon /> : <EditIcon />}
            onClick={handleEditToggle}
            size={isMobile ? "small" : "medium"}
          >
            {editMode ? "Cancel" : "Edit Profile"}
          </Button>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
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
                    alt="Preview"
                    sx={{ 
                      width: isMobile ? 120 : 150, 
                      height: isMobile ? 120 : 150, 
                      mb: 2,
                      border: '2px solid',
                      borderColor: 'primary.main',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                  />
                ) : (
                  <Avatar 
                    src={user.profilePicture ? getImageUrl(user.profilePicture) : ''}
                    alt={user.name || 'User'}
                    imgProps={{
                      onError: (e) => {
                        console.log('Profile image failed to load:', e.target.src);
                        e.target.onerror = null; // Prevent infinite loop
                        e.target.style.display = 'none'; // Hide the broken image
                      },
                      style: { objectFit: 'cover' }
                    }}
                    sx={{ 
                      width: isMobile ? 120 : 150, 
                      height: isMobile ? 120 : 150, 
                      mb: 2,
                      bgcolor: !user.profilePicture ? 
                        `rgb(${Math.floor(Math.random() * 150)}, ${Math.floor(Math.random() * 150)}, ${Math.floor(Math.random() * 150)})` : 
                        'primary.main',
                      border: '2px solid',
                      borderColor: 'divider',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                  >
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </Avatar>
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
              
              <Typography variant="h6" align="center" className="mt-2 font-semibold">
                {user.name}
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'center', 
                mt: 0.5,
                backgroundColor: 'success.light',
                color: 'success.contrastText',
                borderRadius: '12px',
                px: 1.5,
                py: 0.5
              }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: 'success.main',
                    mr: 1,
                    boxShadow: '0 0 0 2px rgba(76, 175, 80, 0.3)',
                    animation: 'pulse 2s infinite'
                  }}
                />
                <Typography variant="body2">Online</Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={8}>
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
                className="mb-4"
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
                className="mb-4"
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
                className="mb-4"
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
                className="mb-4"
              />
              
              {editMode && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              )}
            </Box>
            
            <Divider sx={{ my: 4 }} />
            
            <Box>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  py: 1
                }}
                onClick={() => setShowPasswordFields(!showPasswordFields)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="h6">
                    Change Password
                  </Typography>
                </Box>
                {showPasswordFields ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Box>
              
              <Collapse in={showPasswordFields}>
                <Box component="form" onSubmit={handlePasswordSubmit} sx={{ py: 2 }}>
                  <TextField
                    margin="normal"
                    fullWidth
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    variant="outlined"
                    required
                    inputProps={{ style: { fontSize: isMobile ? 16 : 'inherit' } }}
                    className="mb-4"
                  />
                  
                  <TextField
                    margin="normal"
                    fullWidth
                    label="New Password"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    variant="outlined"
                    required
                    inputProps={{ style: { fontSize: isMobile ? 16 : 'inherit' } }}
                    className="mb-4"
                    helperText="Password must be at least 6 characters"
                  />
                  
                  <TextField
                    margin="normal"
                    fullWidth
                    label="Confirm New Password"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    variant="outlined"
                    required
                    inputProps={{ style: { fontSize: isMobile ? 16 : 'inherit' } }}
                    className="mb-4"
                    error={passwordData.newPassword !== passwordData.confirmPassword}
                    helperText={
                      passwordData.newPassword !== passwordData.confirmPassword ? 
                      "Passwords don't match" : " "
                    }
                  />
                  
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={loading || passwordData.newPassword !== passwordData.confirmPassword}
                    >
                      {loading ? 'Updating...' : 'Update Password'}
                    </Button>
                  </Box>
                </Box>
              </Collapse>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Profile; 