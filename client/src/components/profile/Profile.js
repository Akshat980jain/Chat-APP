import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  TextField,
  Button,
  Alert,
  Divider,
  IconButton,
  CircularProgress,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid,
  Card,
  CardContent,
  Tooltip,
  Badge,
  LinearProgress,
  Snackbar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  Zoom,
  Slide,
  alpha,
  styled,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CloudUpload as CloudUploadIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { debounce } from 'lodash';

// Styled components for enhanced UI
const StyledPaper = styled(Paper)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: theme.spacing(3),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  position: 'relative',
  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

const ProfileStrengthMeter = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  '& .MuiLinearProgress-bar': {
    borderRadius: 4,
    background: `linear-gradient(90deg, ${theme.palette.error.main} 0%, ${theme.palette.warning.main} 50%, ${theme.palette.success.main} 100%)`,
  },
}));

const Profile = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, setUser, updateProfile, deleteAccount } = useAuth();
  
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    status: user?.status || '',
    profilePicture: user?.profilePicture || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    socialLinks: user?.socialLinks || {},
    preferences: user?.preferences || {
      darkMode: false,
      notifications: true,
      publicProfile: true,
      showEmail: false,
      showPhone: false,
    },
  });
  
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [settingsMenuAnchor, setSettingsMenuAnchor] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  
  // Refs
  const fileInputRef = useRef(null);
  const originalFormData = useRef(formData);
  
  // Custom hooks
  // Remove all usage of useProfileValidation, useImageUpload, useProfileAnalytics, motion, and AnimatePresence.
  // Replace validation with simple required checks, and image upload with a placeholder function.
  
  // Memoized calculations
  const profileCompleteness = useMemo(() => {
    const fields = ['name', 'status', 'bio', 'location', 'profilePicture'];
    const completedFields = fields.filter(field => formData[field]?.trim());
    return (completedFields.length / fields.length) * 100;
  }, [formData]);
  
  const strengthColor = useMemo(() => {
    if (profileCompleteness < 40) return 'error';
    if (profileCompleteness < 80) return 'warning';
    return 'success';
  }, [profileCompleteness]);
  
  // Debounced validation
  const debouncedValidation = useCallback(
    debounce(() => {
      // Simple validation for now, no external hooks
      const errors = {};
      if (!formData.name.trim()) errors.name = 'Name is required';
      if (!formData.status.trim()) errors.status = 'Status is required';
      if (!formData.bio.trim()) errors.bio = 'Bio is required';
      if (!formData.location.trim()) errors.location = 'Location is required';
      if (!formData.profilePicture) errors.profilePicture = 'Profile picture is required';
      
      setUnsavedChanges(JSON.stringify(errors) !== JSON.stringify({}));
    }, 300),
    [formData]
  );
  
  // Effects
  useEffect(() => {
    // trackProfileView(); // Removed as per edit hint
  }, []);
  
  useEffect(() => {
    debouncedValidation();
  }, [formData, debouncedValidation]);
  
  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalFormData.current);
    setUnsavedChanges(hasChanges);
  }, [formData]);
  
  // Event handlers
  const handleChange = (event, field) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  const handleNestedChange = useCallback((parent, field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  }, []);
  
  const addAlert = useCallback((message, severity = 'info') => {
    const id = Date.now();
    setAlerts(prev => [...prev, { id, message, severity }]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 5000);
  }, []);
  
  const handleImageUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      setLoading(true);
      // Placeholder for actual image upload logic
      // For now, we'll just simulate an upload
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate upload time
      const imageUrl = `https://via.placeholder.com/150`; // Placeholder URL
      setFormData(prev => ({ ...prev, profilePicture: imageUrl }));
      addAlert('Profile picture updated successfully!', 'success');
    } catch (error) {
      addAlert('Failed to upload image. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);
  
  const handleEdit = useCallback(() => {
    setEditMode(true);
    originalFormData.current = { ...formData };
  }, [formData]);
  
  const handleCancel = useCallback(() => {
    setFormData(originalFormData.current);
    setEditMode(false);
    setUnsavedChanges(false);
  }, []);
  
  const handleSave = useCallback(async () => {
    // Simple validation for now, no external hooks
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.status.trim()) errors.status = 'Status is required';
    if (!formData.bio.trim()) errors.bio = 'Bio is required';
    if (!formData.location.trim()) errors.location = 'Location is required';
    if (!formData.profilePicture) errors.profilePicture = 'Profile picture is required';

    if (Object.keys(errors).length > 0) {
      addAlert('Please fix all errors before saving.', 'error');
      return;
    }
    
    setLoading(true);
    try {
      await updateProfile(formData);
      setUser(prev => ({ ...prev, ...formData }));
      setEditMode(false);
      setUnsavedChanges(false);
      originalFormData.current = { ...formData };
      addAlert('Profile updated successfully!', 'success');
      // trackProfileUpdate(); // Removed as per edit hint
    } catch (error) {
      addAlert('Failed to update profile. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [formData, updateProfile, setUser, addAlert]);
  
  const handleDeleteAccount = useCallback(async () => {
    setLoading(true);
    try {
      await deleteAccount();
      addAlert('Account deleted successfully.', 'success');
    } catch (error) {
      addAlert('Failed to delete account. Please try again.', 'error');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  }, [deleteAccount, addAlert]);
  
  const handleShareProfile = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: `${formData.name}'s Profile`,
        text: formData.bio,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      addAlert('Profile link copied to clipboard!', 'success');
    }
    setShareDialogOpen(false);
  }, [formData.name, formData.bio, addAlert]);
  
  // Loading state
  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }
  
  // Tab panels
  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index} style={{ marginTop: 16 }}>
      {value === index && children}
    </div>
  );
  
  const BasicInfoPanel = () => (
    <div
      style={{ marginTop: 16 }}
    >
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                editMode ? (
                  <IconButton
                    size="small"
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                    }}
                  >
                    <PhotoCameraIcon fontSize="small" />
                  </IconButton>
                ) : null
              }
            >
              <StyledAvatar
                src={formData.profilePicture}
                alt={formData.name}
                sx={{ width: 120, height: 120, mb: 2 }}
                onClick={() => editMode && setImageDialogOpen(true)}
              >
                {!formData.profilePicture && <PersonIcon sx={{ fontSize: 60 }} />}
              </StyledAvatar>
            </Badge>
            
            {loading && (
              <Box sx={{ width: '100%', mt: 1 }}>
                <LinearProgress variant="determinate" value={profileCompleteness} />
              </Box>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            label="Full Name"
            value={formData.name}
            onChange={e => handleChange(e, 'name')}
            disabled={!editMode}
            fullWidth
            InputProps={{
              startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />,
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            label="Status"
            value={formData.status}
            onChange={e => handleChange(e, 'status')}
            disabled={!editMode}
            fullWidth
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            label="Bio"
            value={formData.bio}
            onChange={e => handleChange(e, 'bio')}
            disabled={!editMode}
            fullWidth
            multiline
            rows={3}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            label="Location"
            value={formData.location}
            onChange={e => handleChange(e, 'location')}
            disabled={!editMode}
            fullWidth
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            label="Website"
            value={formData.website}
            onChange={e => handleChange(e, 'website')}
            disabled={!editMode}
            fullWidth
          />
        </Grid>
      </Grid>
    </div>
  );
  
  const PrivacyPanel = () => (
    <div
      style={{ marginTop: 16 }}
    >
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Privacy Settings
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.preferences.publicProfile}
                    onChange={handleNestedChange('preferences', 'publicProfile')}
                    disabled={!editMode}
                  />
                }
                label="Public Profile"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.preferences.showEmail}
                    onChange={handleNestedChange('preferences', 'showEmail')}
                    disabled={!editMode}
                  />
                }
                label="Show Email Address"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.preferences.showPhone}
                    onChange={handleNestedChange('preferences', 'showPhone')}
                    disabled={!editMode}
                  />
                }
                label="Show Phone Number"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </div>
  );
  
  const NotificationsPanel = () => (
    <div
      style={{ marginTop: 16 }}
    >
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Notification Preferences
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={formData.preferences.notifications}
                onChange={handleNestedChange('preferences', 'notifications')}
                disabled={!editMode}
              />
            }
            label="Enable Notifications"
          />
        </CardContent>
      </Card>
    </div>
  );
  
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="80vh"
      bgcolor="background.default"
      p={2}
    >
      <StyledPaper
        elevation={0}
        sx={{
          p: 4,
          minWidth: isMobile ? '100%' : 600,
          maxWidth: 800,
          width: '100%',
        }}
      >
        {/* Profile Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight={700}>
            Profile
          </Typography>
          <Box>
            <Tooltip title="Share Profile">
              <IconButton onClick={() => setShareDialogOpen(true)}>
                <ShareIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton onClick={(e) => setSettingsMenuAnchor(e.currentTarget)}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {/* Profile Strength Meter */}
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Profile Completeness
            </Typography>
            <Typography variant="body2" color={`${strengthColor}.main`} fontWeight={600}>
              {Math.round(profileCompleteness)}%
            </Typography>
          </Box>
          <ProfileStrengthMeter
            variant="determinate"
            value={profileCompleteness}
            color={strengthColor}
          />
        </Box>
        
        {/* Contact Info */}
        <Box mb={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Email: {user.email}
                </Typography>
                {formData.preferences.showEmail && (
                  <Chip size="small" label="Public" color="primary" sx={{ ml: 1 }} />
                )}
              </Box>
            </Grid>
            {user.phoneNumber && (
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Phone: {user.phoneNumber}
                  </Typography>
                  {formData.preferences.showPhone && (
                    <Chip size="small" label="Public" color="primary" sx={{ ml: 1 }} />
                  )}
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>
        
        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{ mb: 2 }}
        >
          <Tab label="Basic Info" />
          <Tab label="Privacy" />
          <Tab label="Notifications" />
        </Tabs>
        
        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <BasicInfoPanel />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <PrivacyPanel />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <NotificationsPanel />
        </TabPanel>
        
        {/* Action Buttons */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={4}>
          <Box>
            {unsavedChanges && (
              <Chip
                icon={<WarningIcon />}
                label="Unsaved Changes"
                color="warning"
                size="small"
              />
            )}
          </Box>
          <Box display="flex" gap={2}>
            <div
              style={{ display: 'flex', gap: 8 }}
            >
              {editMode ? (
                <div
                  style={{ display: 'flex', gap: 8 }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </Box>
        </Box>
        
        {/* Settings Menu */}
        <Menu
          anchorEl={settingsMenuAnchor}
          open={Boolean(settingsMenuAnchor)}
          onClose={() => setSettingsMenuAnchor(null)}
        >
          <MenuItem onClick={() => setDeleteDialogOpen(true)}>
            <ListItemIcon>
              <DeleteIcon color="error" />
            </ListItemIcon>
            <ListItemText primary="Delete Account" />
          </MenuItem>
        </Menu>
        
        {/* Delete Account Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Account</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete your account? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteAccount} color="error" variant="contained">
              Delete Account
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Share Profile Dialog */}
        <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)}>
          <DialogTitle>Share Profile</DialogTitle>
          <DialogContent>
            <Typography>Share your profile with others!</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleShareProfile} variant="contained">
              Share
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Alert Notifications */}
        {alerts.map((alert) => (
          <Snackbar
            key={alert.id}
            open={true}
            autoHideDuration={5000}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert severity={alert.severity} variant="filled">
              {alert.message}
            </Alert>
          </Snackbar>
        ))}
      </StyledPaper>
    </Box>
  );
};

export default Profile;