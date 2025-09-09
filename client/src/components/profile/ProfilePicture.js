import React, { useState, useCallback, useMemo } from 'react';
import { Avatar, Badge, Skeleton, Tooltip, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import CameraAltIcon from '@mui/icons-material/CameraAlt';

// Enhanced styled components
const StyledAvatar = styled(Avatar)(({ theme, size, isOnline, hasHover }) => {
  const sizeMap = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
    xxl: 80
  };
  
  const avatarSize = sizeMap[size] || sizeMap.md;
  
  return {
    width: avatarSize,
    height: avatarSize,
    border: `2px solid ${isOnline ? theme.palette.success.main : theme.palette.grey[300]}`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: hasHover ? 'pointer' : 'default',
    position: 'relative',
    boxShadow: theme.shadows[2],
    
    '&:hover': hasHover ? {
      transform: 'scale(1.05)',
      boxShadow: theme.shadows[4],
      borderColor: theme.palette.primary.main,
    } : {},
    
    '&::after': isOnline ? {
      content: '""',
      position: 'absolute',
      top: -2,
      right: -2,
      width: 12,
      height: 12,
      backgroundColor: theme.palette.success.main,
      borderRadius: '50%',
      border: `2px solid ${theme.palette.background.paper}`,
      animation: 'pulse 2s infinite',
    } : {},
    
    '@keyframes pulse': {
      '0%': {
        boxShadow: `0 0 0 0 ${theme.palette.success.main}40`,
      },
      '70%': {
        boxShadow: `0 0 0 6px ${theme.palette.success.main}00`,
      },
      '100%': {
        boxShadow: `0 0 0 0 ${theme.palette.success.main}00`,
      },
    },
  };
});

const StatusBadge = styled(Badge)(({ theme, status }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: 
      status === 'online' ? theme.palette.success.main :
      status === 'away' ? theme.palette.warning.main :
      status === 'busy' ? theme.palette.error.main :
      theme.palette.grey[400],
    color: 
      status === 'online' ? theme.palette.success.main :
      status === 'away' ? theme.palette.warning.main :
      status === 'busy' ? theme.palette.error.main :
      theme.palette.grey[400],
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: status === 'online' ? 'ripple 1.2s infinite ease-in-out' : 'none',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

const UploadOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  opacity: 0,
  transition: 'opacity 0.3s ease',
  cursor: 'pointer',
  
  '&:hover': {
    opacity: 1,
  },
}));

// Helper function to get image URL
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  
  const apiUrl = localStorage.getItem('api_url') || 
                 process.env.REACT_APP_API_URL || 
                 'http://localhost:5000';
  
  return url.startsWith('/') ? `${apiUrl}${url}` : `${apiUrl}/${url}`;
};

// Generate initials from name
const getInitials = (name) => {
  if (!name) return '?';
  
  const words = name.trim().split(' ');
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

// Generate avatar color based on name
const getAvatarColor = (name) => {
  if (!name) return '#9ca3af';
  
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e'
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

const ProfilePicture = ({
  userId,
  name,
  imageUrl,
  isOnline = false,
  status = 'offline',
  size = 'md',
  showStatus = true,
  showTooltip = true,
  editable = false,
  loading = false,
  onClick,
  onImageUpload,
  className = '',
  alt,
  fallbackIcon = PersonIcon,
  badge,
  badgeColor = 'primary',
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [uploadHover, setUploadHover] = useState(false);

  // Memoized values
  const displayName = useMemo(() => name || 'Unknown User', [name]);
  const avatarSrc = useMemo(() => getImageUrl(imageUrl), [imageUrl]);
  const initials = useMemo(() => getInitials(displayName), [displayName]);
  const avatarColor = useMemo(() => getAvatarColor(displayName), [displayName]);
  const hasClickHandler = useMemo(() => Boolean(onClick || editable), [onClick, editable]);

  // Handle image load events
  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoading(false);
    setImageError(true);
  }, []);

  // Handle click events
  const handleClick = useCallback((event) => {
    if (editable && onImageUpload) {
      // Create file input for image upload
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          onImageUpload(file);
        }
      };
      input.click();
    } else if (onClick) {
      onClick(event);
    }
  }, [editable, onImageUpload, onClick]);

  // Status indicator component
  const StatusIndicator = () => {
    if (!showStatus) return null;
    
    return (
      <StatusBadge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        variant="dot"
        status={isOnline ? 'online' : status}
      />
    );
  };

  // Loading skeleton
  if (loading) {
    return (
      <Skeleton
        variant="circular"
        width={size === 'xs' ? 24 : size === 'sm' ? 32 : size === 'lg' ? 48 : size === 'xl' ? 64 : 40}
        height={size === 'xs' ? 24 : size === 'sm' ? 32 : size === 'lg' ? 48 : size === 'xl' ? 64 : 40}
        className={className}
      />
    );
  }

  // Main avatar component
  const AvatarComponent = (
    <Box
      position="relative"
      display="inline-block"
      onMouseEnter={() => setUploadHover(true)}
      onMouseLeave={() => setUploadHover(false)}
    >
      <StyledAvatar
        src={!imageError ? avatarSrc : undefined}
        alt={alt || displayName}
        size={size}
        isOnline={isOnline}
        hasHover={hasClickHandler}
        onClick={handleClick}
        className={className}
        sx={{
          backgroundColor: !avatarSrc || imageError ? avatarColor : 'transparent',
          color: 'white',
          fontWeight: 600,
          fontSize: size === 'xs' ? '0.75rem' : size === 'sm' ? '0.875rem' : '1rem',
          ...props.sx
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
        {...props}
      >
        {!avatarSrc || imageError ? (
          imageLoading ? (
            <Skeleton variant="circular" width="100%" height="100%" />
          ) : (
            initials
          )
        ) : null}
      </StyledAvatar>
      
      {/* Upload overlay for editable avatars */}
      {editable && (
        <UploadOverlay
          sx={{
            opacity: uploadHover ? 1 : 0,
          }}
        >
          <CameraAltIcon sx={{ color: 'white', fontSize: size === 'xl' ? 24 : 16 }} />
        </UploadOverlay>
      )}
      
      {/* Status indicator */}
      <StatusIndicator />
      
      {/* Custom badge */}
      {badge && (
        <Badge
          badgeContent={badge}
          color={badgeColor}
          overlap="circular"
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          max={99}
        />
      )}
    </Box>
  );

  // Wrap with tooltip if enabled
  if (showTooltip && displayName) {
    return (
      <Tooltip
        title={
          <Box>
            <Box fontWeight="medium">{displayName}</Box>
            {showStatus && (
              <Box fontSize="0.75rem" mt={0.5}>
                {isOnline ? (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Box
                      width={6}
                      height={6}
                      borderRadius="50%"
                      bgcolor="success.main"
                    />
                    Online
                  </Box>
                ) : (
                  `Last seen recently`
                )}
              </Box>
            )}
          </Box>
        }
        arrow
        placement="top"
      >
        {AvatarComponent}
      </Tooltip>
    );
  }

  return AvatarComponent;
};

export default ProfilePicture;