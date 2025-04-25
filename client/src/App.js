import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Chat from './components/chat/Chat';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import AppLayout from './components/layout/AppLayout';
import MobileNavigation from './components/layout/MobileNavigation';
import ServerConnectionFixer from './components/ServerConnectionFixer';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import './components/chat/ModernChat.css'; // Import our new modern chat styles

// Attempt to determine the best API URL - this helps with multi-device setup
const determineApiUrl = () => {
  const configuredUrl = process.env.REACT_APP_API_URL;
  
  // Get any previously successful URL from localStorage
  const savedUrl = localStorage.getItem('api_url');
  
  // Check if we're on a mobile device on an IP-based URL
  const usingIpBasedBrowser = /192\.168\.\d+\.\d+/.test(window.location.hostname);
  if (usingIpBasedBrowser) {
    const ipBasedUrl = `http://${window.location.hostname}:5000`;
    console.log('Using IP-based URL from browser location:', ipBasedUrl);
    localStorage.setItem('api_url', ipBasedUrl);
    return;
  }
  
  // First try saved URL if it exists
  if (savedUrl) {
    console.log('Trying previously saved API URL:', savedUrl);
    axios.get(`${savedUrl}/`, { timeout: 5000 })
      .then(() => {
        console.log('Successfully connected to saved API URL:', savedUrl);
        return; // Keep using the saved URL
      })
      .catch(err => {
        console.warn('Saved API URL not reachable, will try alternatives');
        // Continue with other options
      });
  }
  
  // List of potential URLs to try (in order of preference)
  const urlsToTry = [
    configuredUrl,                         // From .env file 
    'http://localhost:5000',               // Standard localhost
    window.location.origin.replace(/:\d+$/, ':5000'), // Same host as frontend with port 5000
    'http://192.168.1.15:5000'             // Common IP for development
  ];
  
  // On mobile, also try IP-based URLs from different subnets
  if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    // Common local IP patterns for home networks
    ['192.168.0', '192.168.1', '10.0.0', '10.0.1'].forEach(subnet => {
      for (let i = 1; i <= 10; i++) {
        urlsToTry.push(`http://${subnet}.${i}:5000`);
      }
    });
  }
  
  // Filter out any undefined/null values
  const validUrls = urlsToTry.filter(url => url);
  
  // Try connecting to each URL with a 3-second timeout
  let foundWorkingUrl = false;
  
  // Function to try the next URL in the list
  const tryNextUrl = (index) => {
    if (index >= validUrls.length || foundWorkingUrl) return;
    
    const url = validUrls[index];
    console.log(`Trying API URL (${index+1}/${validUrls.length}):`, url);
    
    axios.get(`${url}/`, { timeout: 3000 })
      .then(() => {
        console.log('Found working API URL:', url);
        localStorage.setItem('api_url', url);
        foundWorkingUrl = true;
        
        // Refresh the page if we found a different URL than was being used
        const currentUrl = localStorage.getItem('api_url');
        if (currentUrl !== url) {
          window.location.reload();
        }
      })
      .catch(() => {
        // Try the next URL
        setTimeout(() => tryNextUrl(index + 1), 300);
      });
  };
  
  // Start trying URLs
  tryNextUrl(0);
};

// Create theme with better dark mode support
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3b82f6', // Updated to blue-500
      light: '#60a5fa',
      dark: '#2563eb',
    },
    secondary: {
      main: '#8b5cf6', // Updated to purple-500
      light: '#a78bfa',
      dark: '#7c3aed',
    },
    success: {
      main: '#10b981', // Updated to green-500
      light: '#34d399',
      dark: '#059669',
    },
    error: {
      main: '#ef4444', // Updated to red-500
      light: '#f87171',
      dark: '#dc2626',
    },
    warning: {
      main: '#f59e0b', // Updated to amber-500
      light: '#fbbf24',
      dark: '#d97706',
    },
    background: {
      default: '#f9fafb', // Updated to gray-50
      paper: '#ffffff',
    },
    text: {
      primary: '#111827', // Updated to gray-900
      secondary: '#6b7280', // Updated to gray-500
    },
  },
  typography: {
    fontFamily: [
      'Inter var',
      'Inter',
      'Roboto',
      'Segoe UI',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  shape: {
    borderRadius: 12, // Increased border radius
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
          boxShadow: 'none',
          padding: '8px 16px',
          '&:hover': {
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          },
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#2563eb',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: '2px solid rgba(255, 255, 255, 0.8)',
        },
      },
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6', // Updated to blue-500
      light: '#60a5fa',
      dark: '#2563eb',
    },
    secondary: {
      main: '#8b5cf6', // Updated to purple-500
      light: '#a78bfa',
      dark: '#7c3aed',
    },
    success: {
      main: '#10b981', // Updated to green-500
      light: '#34d399',
      dark: '#059669',
    },
    error: {
      main: '#ef4444', // Updated to red-500
      light: '#f87171',
      dark: '#dc2626',
    },
    warning: {
      main: '#f59e0b', // Updated to amber-500
      light: '#fbbf24',
      dark: '#d97706',
    },
    background: {
      default: '#111827', // Updated to gray-900
      paper: '#1f2937', // Updated to gray-800
    },
    text: {
      primary: '#f9fafb', // Updated to gray-50
      secondary: '#d1d5db', // Updated to gray-300
    },
  },
  typography: {
    fontFamily: [
      'Inter var',
      'Inter',
      'Roboto',
      'Segoe UI',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  shape: {
    borderRadius: 12, // Increased border radius
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
          boxShadow: 'none',
          padding: '8px 16px',
          '&:hover': {
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
          },
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#2563eb',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          backgroundColor: '#1f2937', // Updated to gray-800
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: '2px solid rgba(0, 0, 0, 0.8)',
        },
      },
    },
  },
});

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  // Redirect to login if user is not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Render the protected component
  return children;
};

function App() {
  // State to track connection status
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [darkMode, setDarkMode] = useState(false);
  
  // Determine the best API URL when the app starts
  useEffect(() => {
    setConnectionStatus('connecting');
    determineApiUrl();
    
    // Add event listener to track online/offline status
    const handleOnline = () => {
      console.log('Device is online, rechecking connection');
      setConnectionStatus('reconnecting');
      determineApiUrl();
    };
    
    const handleOffline = () => {
      console.log('Device is offline');
      setConnectionStatus('offline');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check connection status every 10 seconds
    const intervalId = setInterval(() => {
      const apiUrl = localStorage.getItem('api_url');
      if (apiUrl) {
        setConnectionStatus('connected');
      }
    }, 10000);
    
    // Check for theme preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const isDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setDarkMode(isDarkMode);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, []);

  // Listen for theme changes from ThemeToggle component
  useEffect(() => {
    const handleThemeChange = () => {
      const savedTheme = localStorage.getItem('theme');
      setDarkMode(savedTheme === 'dark');
    };
    
    window.addEventListener('themechange', handleThemeChange);
    
    return () => {
      window.removeEventListener('themechange', handleThemeChange);
    };
  }, []);

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <AuthProvider>
        <SocketProvider>
          <Router>
            {/* Add the ServerConnectionFixer component to automatically fix connection issues */}
            <ServerConnectionFixer />
            
            {connectionStatus === 'connecting' && (
              <div className="alert alert-warning m-0 text-center rounded-0 fixed-top">
                Connecting to server...
              </div>
            )}
            {connectionStatus === 'offline' && (
              <div className="alert alert-danger m-0 text-center rounded-0 fixed-top">
                Device is offline. Please check your internet connection.
              </div>
            )}
            
            {/* Add Mobile Navigation - show on all routes except login/register */}
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route element={
                <ProtectedRoute>
                  <>
                    <MobileNavigation />
                    <AppLayout />
                  </>
                </ProtectedRoute>
              }>
                <Route path="/" element={<Chat />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            <ToastContainer 
              position="top-center" 
              autoClose={3000} 
              hideProgressBar={false} 
              newestOnTop 
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              className="toast-container-bootstrap"
            />
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 