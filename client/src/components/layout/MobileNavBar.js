import React from 'react';
import { 
  Box, 
  BottomNavigation, 
  BottomNavigationAction, 
  Badge,
  Avatar,
  Tooltip
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import { useTheme } from '@mui/material/styles';

// Mobile nav bar component for small screens
const MobileNavBar = ({ 
  user, 
  unreadCount = 0,
  notificationCount = 0, 
  activeTab = 0, 
  onTabChange,
  onProfileClick,
  onSearchClick
}) => {
  const theme = useTheme();
  
  // Calculate total notifications
  const totalBadgeCount = unreadCount + notificationCount;
  
  return (
    <Box 
      sx={{ 
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 1000,
        // Only show on small screens
        display: { xs: 'block', sm: 'block', md: 'none' },
        // Add safe area inset for iOS devices
        pb: 'env(safe-area-inset-bottom, 0)'
      }}
      className="shadow-lg mobile-nav-container"
    >
      <BottomNavigation
        value={activeTab}
        onChange={(event, newValue) => {
          if (onTabChange) onTabChange(newValue);
        }}
        showLabels
        className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
        sx={{
          height: 56,
          '& .MuiBottomNavigationAction-root': {
            color: theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b',
            minWidth: 0, // Better support for very small screens
            padding: '6px 0',
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.625rem', // Smaller font for very small screens
              marginTop: '2px',
              transition: 'font-size 0.2s, opacity 0.2s',
            }
          },
          '& .Mui-selected': {
            color: theme.palette.primary.main,
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.75rem',
              fontWeight: 'bold',
            },
            '& svg': {
              transform: 'scale(1.1)',
              transition: 'transform 0.2s'
            }
          }
        }}
      >
        <BottomNavigationAction 
          label="Chats" 
          icon={
            <Badge badgeContent={unreadCount} color="primary" max={99}>
              <ChatIcon fontSize="small" />
            </Badge>
          }
          value={0}
        />
        
        <BottomNavigationAction 
          label="Search" 
          icon={<SearchIcon fontSize="small" />}
          onClick={(e) => {
            // Prevent navigation change
            e.preventDefault();
            if (onSearchClick) onSearchClick();
          }}
        />
        
        <BottomNavigationAction 
          label="Notices" 
          icon={
            <Badge badgeContent={notificationCount} color="primary" max={99}>
              <NotificationsIcon fontSize="small" />
            </Badge>
          }
          value={1}
        />
      </BottomNavigation>
    </Box>
  );
};

export default MobileNavBar; 