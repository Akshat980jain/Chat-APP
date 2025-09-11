import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Chat from './components/chat/Chat';
import Settings from './pages/Settings';
import AppLayout from './components/layout/AppLayout';
import MobileNavigation from './components/layout/MobileNavigation';
import ServerConnectionFixer from './components/ServerConnectionFixer';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import './components/chat/ModernChat.css'; // Import our new modern chat styles
import Profile from './components/profile/Profile';

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
  
  // Try connecting to each URL with a 3-second timeout
  let foundWorkingUrl = false;
}
// Optimized theme configuration
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
    },
    secondary: {
      main: '#8b5cf6',
      light: '#a78bfa',
      dark: '#7c3aed',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    background: {
      default: '#f9fafb',
      paper: '#ffffff',
    },
    text: {
      primary: '#111827',
      secondary: '#6b7280',
    },
  },
  typography: {
    fontFamily: [
      'Inter var',
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'sans-serif',
    ].join(','),
    fontDisplay: 'swap',
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
          padding: '8px 16px',
          transition: 'all 0.2s ease',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'all 0.2s ease',
          },
        },
      },
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
    },
    secondary: {
      main: '#8b5cf6',
      light: '#a78bfa',
      dark: '#7c3aed',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    background: {
      default: '#111827',
      paper: '#1f2937',
    },
    text: {
      primary: '#f9fafb',
      secondary: '#d1d5db',
    },
  },
  typography: {
    fontFamily: [
      'Inter var',
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'sans-serif',
    ].join(','),
    fontDisplay: 'swap',
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
          padding: '8px 16px',
          transition: 'all 0.2s ease',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'all 0.2s ease',
          },
        },
      },
    },
  },
});

// Optimized protected route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Error boundary fallback
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="flex items-center justify-center min-h-screen bg-neutral-50 dark:bg-neutral-900">
    <div className="text-center p-8">
      <div className="text-6xl mb-4">😵</div>
      <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
        Oops! Something went wrong
      </h2>
      <p className="text-neutral-600 dark:text-neutral-400 mb-4">
        {error.message || 'An unexpected error occurred'}
      </p>
      <button
        onClick={resetErrorBoundary}
        className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
      >
        Try again
      </button>
    </div>
  </div>
);

function App() {
  const [darkMode, setDarkMode] = useState(false);

  // Optimized theme initialization
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setDarkMode(isDarkMode);
    
    const handleThemeChange = () => {
      const savedTheme = localStorage.getItem('theme');
      setDarkMode(savedTheme === 'dark');
    };
    
    window.addEventListener('themechange', handleThemeChange);
    return () => {
      window.removeEventListener('themechange', handleThemeChange);
    };
  }, []);

  // Global error handler
  const handleError = (error, errorInfo) => {
    console.error('App error:', error, errorInfo);
  };
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={handleError}>
      <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
        <CssBaseline />
        <AuthProvider>
          <SocketProvider>
            <Router>
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
                position="top-right" 
                autoClose={3000} 
                hideProgressBar={false} 
                newestOnTop 
                closeOnClick
                pauseOnFocusLoss={false}
                draggable
                pauseOnHover
                limit={3}
                className="z-50"
                toastClassName="backdrop-blur-sm"
              />
            </Router>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App; 