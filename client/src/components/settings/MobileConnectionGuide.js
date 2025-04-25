import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert, Button, Paper, Divider, TextField, List, ListItem, CircularProgress } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import WifiIcon from '@mui/icons-material/Wifi';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const MobileConnectionGuide = () => {
  const [ipAddresses, setIpAddresses] = useState([]);
  const [copyStatus, setCopyStatus] = useState({});
  const [customUrl, setCustomUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { detectApiUrl } = useAuth();
  const serverPort = process.env.REACT_APP_SERVER_PORT || 5000;

  const fetchNetworkInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get current API URL using the more robust function
      const currentApiUrl = detectApiUrl();
      console.log('Fetching network info from:', currentApiUrl);
      
      // Request network info from the server
      const response = await axios.get(`${currentApiUrl}/api/network-info`, { timeout: 8000 });
      
      if (response.data && response.data.ips && response.data.ips.length > 0) {
        console.log('Network interfaces detected:', response.data.ips);
        setIpAddresses(response.data.ips);
      } else {
        console.warn('No network interfaces detected');
        setIpAddresses([]);
        setError('No network interfaces detected on the server.');
      }
    } catch (err) {
      console.error('Failed to get network info:', err);
      setIpAddresses([]);
      
      if (err.message === 'Network Error' || err.code === 'ECONNABORTED') {
        setError('Could not connect to the server. Please ensure the server is running.');
      } else {
        setError('Failed to retrieve network information from the server.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch network info when component mounts
    fetchNetworkInfo();
    
    // Set up auto-refresh every 30 seconds
    const intervalId = setInterval(() => {
      fetchNetworkInfo();
    }, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopyStatus({ [url]: 'Copied!' });
        setTimeout(() => setCopyStatus({}), 2000);
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        setCopyStatus({ [url]: 'Failed to copy' });
      });
  };

  const generateQRCode = (url) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;
  };

  return (
    <Paper className="card-glass p-6">
      <Box className="flex items-center justify-between mb-4">
        <Box className="flex items-center space-x-2">
          <SmartphoneIcon className="text-primary-500" />
          <Typography variant="h6" className="font-display">
            Mobile Connection Guide
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={fetchNetworkInfo}
          disabled={loading}
          className="btn-outline"
        >
          {loading ? 'Checking...' : 'Refresh'}
        </Button>
      </Box>

      <Alert severity="info" className="mb-6">
        Your app is accessible from mobile devices on the same WiFi network. Follow the steps below to connect.
      </Alert>

      {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}

      <Typography variant="subtitle1" gutterBottom className="font-semibold">
        Step 1: Make sure your mobile device is on the same WiFi network
      </Typography>
      <Box className="flex items-center space-x-2 mb-4 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
        <WifiIcon className="text-success-500" />
        <Typography variant="body2">
          Both your computer and mobile device need to be connected to the same WiFi network.
        </Typography>
      </Box>

      <Typography variant="subtitle1" gutterBottom className="font-semibold">
        Step 2: Use one of these addresses on your mobile device
      </Typography>
      
      {loading ? (
        <Box className="flex justify-center p-4">
          <CircularProgress size={30} />
        </Box>
      ) : ipAddresses.length > 0 ? (
        <List className="mb-4 p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
          {ipAddresses.map(ip => {
            const url = `http://${ip}:${serverPort}`;
            return (
              <ListItem key={ip} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 mb-2 bg-white dark:bg-neutral-700 rounded-lg">
                <Box className="w-full sm:w-auto mb-2 sm:mb-0">
                  <Typography variant="subtitle2" className="font-mono">{url}</Typography>
                  <Typography variant="caption" className="text-neutral-500">Server address</Typography>
                </Box>
                <Box className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button 
                    size="small" 
                    variant="outlined"
                    className="btn-outline text-xs w-full sm:w-auto"
                    onClick={() => handleCopyUrl(url)}
                    startIcon={<ContentCopyIcon />}
                  >
                    {copyStatus[url] || "Copy URL"}
                  </Button>
                  <Box className="hidden sm:block">
                    <img 
                      src={generateQRCode(url)} 
                      alt={`QR code for ${url}`} 
                      className="w-16 h-16 p-1 bg-white rounded"
                    />
                  </Box>
                </Box>
              </ListItem>
            );
          })}
        </List>
      ) : (
        <Alert severity="warning" className="mb-4">
          No network addresses detected. Make sure your server is running and you're connected to a network.
        </Alert>
      )}

      <Typography variant="subtitle1" gutterBottom className="font-semibold">
        Step 3: Open the URL in your mobile browser
      </Typography>
      <Box className="mb-6 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
        <Typography variant="body2" paragraph>
          Open any of the URLs above in your mobile browser. You'll need to login with your credentials.
        </Typography>
        <Typography variant="body2">
          If you want to add it to your home screen on iOS or Android, use the "Add to Home Screen" feature in your browser.
        </Typography>
      </Box>

      <Divider className="my-6" />

      <Typography variant="subtitle1" gutterBottom className="font-semibold">
        Manual Configuration
      </Typography>
      <Box className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
        <Typography variant="body2" className="mb-2">
          If the automatic addresses don't work, you can try finding your computer's IP address manually and enter it below:
        </Typography>
        <Box className="flex items-center space-x-2">
          <TextField
            size="small"
            placeholder="e.g., 192.168.1.10:5000"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="form-input flex-1"
          />
          <Button
            variant="contained"
            className="btn-primary"
            disabled={!customUrl}
            onClick={() => handleCopyUrl(customUrl.startsWith('http') ? customUrl : `http://${customUrl}`)}
          >
            {copyStatus[customUrl] || "Copy"}
          </Button>
        </Box>
      </Box>

      <Box className="mt-6 p-4 border border-primary-200 dark:border-primary-800 bg-primary-50/30 dark:bg-primary-900/20 rounded-lg">
        <Typography variant="subtitle2" gutterBottom className="text-primary-700 dark:text-primary-300">
          Troubleshooting
        </Typography>
        <ol className="list-decimal pl-5 space-y-1 text-sm">
          <li>Make sure the server is running on your computer</li>
          <li>Check that both devices are on the same WiFi network</li>
          <li>Try using a different browser on your mobile device</li>
          <li>Ensure your computer's firewall allows connections on port {serverPort}</li>
          <li>Try different network addresses from the list above</li>
          <li>Temporarily disable VPNs or proxies</li>
          <li>Restart the server and refresh this page</li>
        </ol>
      </Box>
    </Paper>
  );
};

export default MobileConnectionGuide; 