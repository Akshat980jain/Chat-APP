import React, { useState, useEffect, useCallback } from 'react';
import { TextField, Button, Box, Typography, Alert, Paper, Divider, CircularProgress } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import StorageIcon from '@mui/icons-material/Storage';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axios from 'axios';

const ServerSettings = () => {
  const [serverUrl, setServerUrl] = useState('');
  const [message, setMessage] = useState(null);
  const [serverIps, setServerIps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [customUrlMode, setCustomUrlMode] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);
  
  const { updateApiBaseUrl, detectApiUrl } = useAuth();
  const { updateSocketConnection } = useSocket();

  // Fetch server's network info to get available IP addresses
  const fetchNetworkInfo = useCallback(async () => {
    setLoading(true);
    try {
      // Get current API URL
      const currentUrl = detectApiUrl();
      
      // Show current URL in the input
      setServerUrl(currentUrl);
      
      // Try to get all IP addresses from the server
      const response = await axios.get(`${currentUrl}/api/network-info`, { timeout: 5000 });
      
      if (response.data && response.data.ips && response.data.ips.length > 0) {
        console.log('Available server IPs:', response.data.ips);
        setServerIps(response.data.ips);
        setMessage(null);
      } else {
        setServerIps([]);
        setMessage({ 
          type: 'warning', 
          text: 'No network interfaces detected on server. Mobile access may be limited.' 
        });
      }
    } catch (error) {
      console.error('Failed to get network info:', error);
      setServerIps([]);
      
      // Check if it's a network/connection error
      if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
        setMessage({ 
          type: 'error', 
          text: 'Could not connect to server. Please check the server is running.' 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: 'Failed to retrieve network information from server.' 
        });
      }
    } finally {
      setLoading(false);
    }
  }, [detectApiUrl]);

  // Initial load
  useEffect(() => {
    fetchNetworkInfo();
    
    // Set up auto-refresh every 30 seconds if auto-detect is enabled
    let intervalId;
    if (autoDetect) {
      intervalId = setInterval(() => {
        fetchNetworkInfo();
      }, 30000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchNetworkInfo, autoDetect]);

  const testConnection = async (url) => {
    setTestingConnection(true);
    try {
      // Try to connect to the network-info endpoint
      const response = await axios.get(`${url}/api/network-info`, { timeout: 5000 });
      
      if (response.status === 200) {
        setMessage({ 
          type: 'success', 
          text: 'Successfully connected to server!' 
        });
        return true;
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to connect to server. Please check the URL and ensure the server is running.' 
      });
      return false;
    } finally {
      setTestingConnection(false);
    }
    return false;
  };

  const handleSave = async () => {
    if (!serverUrl) {
      setMessage({ type: 'error', text: 'Please enter a valid server URL' });
      return;
    }

    // Validate URL format
    try {
      new URL(serverUrl);
    } catch (e) {
      setMessage({ type: 'error', text: 'Invalid URL format. Include http:// or https://' });
      return;
    }

    // Test connection first
    setMessage({ type: 'info', text: 'Testing connection to server...' });
    const connectionSuccessful = await testConnection(serverUrl);
    
    if (!connectionSuccessful) {
      return;
    }

    // Update the API base URL
    setMessage({ type: 'info', text: 'Updating server connection...' });
    const success = await updateApiBaseUrl(serverUrl);
    
    if (success) {
      // Update socket connection with new URL
      try {
        updateSocketConnection();
        setMessage({ 
          type: 'success', 
          text: 'Server URL updated successfully. Page will refresh to apply changes.' 
        });
      } catch (err) {
        console.error('Failed to update socket connection:', err);
        setMessage({ 
          type: 'warning', 
          text: 'Server URL saved, but socket connection update failed. Try refreshing the page.' 
        });
      }
    } else {
      setMessage({ 
        type: 'error', 
        text: 'Failed to update server URL. Please check the connection and try again.' 
      });
    }
  };

  const handleSelectIp = (ip) => {
    const url = `http://${ip}:5000`;
    setServerUrl(url);
    setMessage(null);
  };

  return (
    <Paper className="card-glass p-6">
      <Box className="flex items-center space-x-2 mb-4">
        <StorageIcon className="text-primary-500" />
        <Typography variant="h6" className="font-display">
          Server Connection Settings
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button 
          variant="outlined" 
          size="small"
          startIcon={<RefreshIcon />}
          onClick={fetchNetworkInfo}
          disabled={loading}
          className="btn-outline"
        >
          {loading ? <CircularProgress size={20} /> : 'Refresh'}
        </Button>
      </Box>
      
      <Typography variant="body2" className="text-neutral-600 dark:text-neutral-400 mb-4">
        To access the chat app from mobile devices on the same network, configure the server URL below.
      </Typography>

      {message && (
        <Alert 
          severity={message.type} 
          onClose={() => setMessage(null)}
          className="mb-4"
        >
          {message.text}
        </Alert>
      )}

      {serverIps.length > 0 && !customUrlMode && (
        <Box className="mb-4 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
          <Typography variant="subtitle2" gutterBottom className="font-semibold">
            Select your server's network address:
          </Typography>
          <Box className="flex flex-wrap gap-2 mt-2">
            {serverIps.map((ip) => (
              <Button
                key={ip}
                variant="outlined"
                size="small"
                onClick={() => handleSelectIp(ip)}
                className="btn-outline text-xs hover:bg-primary-50 dark:hover:bg-primary-900/20"
                endIcon={serverUrl === `http://${ip}:5000` ? <CheckCircleIcon fontSize="small" /> : null}
              >
                {ip}
              </Button>
            ))}
          </Box>
          <Typography variant="caption" className="mt-2 block text-neutral-500 dark:text-neutral-400">
            On your mobile device, use the same network (WiFi) and connect to one of these addresses.
          </Typography>
          <Divider className="my-4" />
        </Box>
      )}

      <TextField
        fullWidth
        label="Server URL"
        variant="outlined"
        value={serverUrl}
        onChange={(e) => setServerUrl(e.target.value)}
        placeholder="http://192.168.1.x:5000"
        className="form-input mb-4"
        helperText="Include protocol (http:// or https://) and port number"
        disabled={loading || testingConnection}
      />

      {!customUrlMode && serverIps.length > 0 && (
        <Button 
          variant="text" 
          onClick={() => setCustomUrlMode(true)}
          className="mb-4 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
        >
          Use custom URL
        </Button>
      )}

      <Box className="flex justify-between mt-2">
        <Button
          variant="outlined"
          onClick={() => {
            setServerUrl('http://localhost:5000');
            setMessage(null);
          }}
          className="btn-outline"
          disabled={loading || testingConnection}
        >
          Reset to Default
        </Button>
        <Box className="flex space-x-2">
          <Button
            variant="outlined"
            onClick={() => testConnection(serverUrl)}
            className="btn-outline"
            disabled={loading || testingConnection || !serverUrl}
            startIcon={testingConnection ? <CircularProgress size={20} /> : null}
          >
            Test Connection
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            className="btn-primary"
            disabled={loading || testingConnection || !serverUrl}
          >
            Save Changes
          </Button>
        </Box>
      </Box>

      <Box className="mt-6 p-4 border border-primary-200 dark:border-primary-800 bg-primary-50/30 dark:bg-primary-900/20 rounded-lg">
        <Typography variant="subtitle2" gutterBottom className="text-primary-700 dark:text-primary-300 font-semibold">
          How to connect from a mobile device:
        </Typography>
        <ol className="list-decimal pl-5 space-y-1 text-sm text-neutral-700 dark:text-neutral-300">
          <li>Ensure your mobile device is on the same WiFi network as this computer</li>
          <li>Select one of the network addresses above or enter a custom URL</li>
          <li>Click "Test Connection" to verify the server is accessible</li>
          <li>Save the changes and refresh the page</li>
          <li>On your mobile device, open a browser and navigate to the same URL</li>
          <li>Login with your account credentials</li>
        </ol>
      </Box>
    </Paper>
  );
};

export default ServerSettings; 