import React from 'react';
import { Container, Typography, Grid, Box, Paper, Tabs, Tab, Alert } from '@mui/material';
import ServerSettings from '../components/settings/ServerSettings';
import MobileConnectionGuide from '../components/settings/MobileConnectionGuide';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';

const Settings = () => {
  const [activeTab, setActiveTab] = React.useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="md" className="py-8">
      <Box className="mb-6">
        <Typography variant="h4" className="font-display font-bold text-neutral-900 dark:text-white mb-2">
          Settings
        </Typography>
        <Typography variant="body1" className="text-neutral-600 dark:text-neutral-300">
          Configure application settings and preferences
        </Typography>
      </Box>

      <Paper className="card-glass overflow-hidden shadow-md rounded-lg">
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }} className="bg-white dark:bg-neutral-800">
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="settings tabs"
            className="px-4"
            variant="scrollable"
            scrollButtons="auto"
            TabIndicatorProps={{
              style: {
                backgroundColor: 'var(--color-primary-500)',
              }
            }}
            sx={{
              '& .MuiTab-root': {
                color: 'var(--color-neutral-600)',
                '&.Mui-selected': {
                  color: 'var(--color-primary-500)',
                }
              }
            }}
          >
            <Tab icon={<PhoneAndroidIcon fontSize="small" />} label="Mobile Access" />
            <Tab icon={<SettingsIcon fontSize="small" />} label="Server Connection" />
            <Tab icon={<NotificationsIcon fontSize="small" />} label="Notifications" />
          </Tabs>
        </Box>

        <Box className="p-0 sm:p-4">
          {activeTab === 0 && (
            <MobileConnectionGuide />
          )}
          
          {activeTab === 1 && (
            <ServerSettings />
          )}
          
          {activeTab === 2 && (
            <Box className="p-4 bg-white dark:bg-neutral-900 rounded-lg">
              <Box className="flex items-center space-x-2 mb-4">
                <NotificationsIcon className="text-primary-500" />
                <Typography variant="h6" className="font-display text-neutral-900 dark:text-white">
                  Notification Settings
                </Typography>
              </Box>
              
              <Alert severity="info" className="mb-4">
                Notification settings are currently under development and will be available soon.
              </Alert>
              
              <Box className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                <Typography variant="body2" className="text-neutral-600 dark:text-neutral-400">
                  In the future, you'll be able to customize sound alerts, push notifications, and email digests for your conversations.
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default Settings; 