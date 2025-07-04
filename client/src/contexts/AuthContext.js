import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Remove the top-level useCallback hooks
const detectApiUrl = () => {
  // Check localStorage first for manually set URL
  const storedUrl = localStorage.getItem('api_base_url');
  if (storedUrl) {
    console.log('Using stored API URL:', storedUrl);
    return storedUrl;
  }
  
  // Check for environment variable
  if (process.env.REACT_APP_API_URL) {
    console.log('Using environment API URL:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }
  
  // Check if we're in development mode
  if (process.env.NODE_ENV === 'development') {
    // Try to detect local server
    const hostname = window.location.hostname;
    const port = window.location.port || '3000';
    
    // If we're on localhost, try localhost:5000 for the API
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const localApiUrl = `http://localhost:5000`;
      console.log('Development mode detected, using local API URL:', localApiUrl);
      return localApiUrl;
    }
    
    // If we're on a local IP, try the same IP with port 5000
    if (hostname.match(/^192\.168\.\d+\.\d+$/)) {
      const localApiUrl = `http://${hostname}:5000`;
      console.log('Local IP detected, using local API URL:', localApiUrl);
      return localApiUrl;
    }
  }
  
  // Fallback to production URL
  const fallbackUrl = 'https://chat-app-backend-pus1.onrender.com';
  console.log('Using fallback API URL:', fallbackUrl);
  return fallbackUrl;
};

// Get the API URL
const API_URL = detectApiUrl();

// Add axios interceptors for debugging
axios.interceptors.request.use(
  (config) => {
    console.log('Axios request:', {
      method: config.method,
      url: config.url,
      data: config.data,
      headers: config.headers
    });
    return config;
  },
  (error) => {
    console.error('Axios request error:', error);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    console.log('Axios response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('Axios response error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config
    });
    return Promise.reject(error);
  }
);

// Create auth context
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Utility function to set the auth token in axios headers
export const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    // Add as a default header for all axios requests
    axios.defaults.baseURL = detectApiUrl();
    localStorage.setItem('token', token);
  } else {
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

// Refresh token implementation
export const refreshToken = async () => {
  // No refresh token logic needed, just resolve immediately
  return;
};

// Helper to ensure profile picture URLs are correct
const formatUserData = (userData) => {
  if (!userData) return null;
  
  const formattedUser = { ...userData };
  
  // Add API_URL to profilePicture if it's a relative URL
  if (formattedUser.profilePicture && !formattedUser.profilePicture.startsWith('http')) {
    const currentApiUrl = detectApiUrl();
    formattedUser.profilePicture = `${currentApiUrl}${formattedUser.profilePicture}`;
    console.log('Formatted profile picture URL:', formattedUser.profilePicture);
  }
  
  return formattedUser;
};

// Update the updateApiUrl function to handle URL changes properly
const updateApiUrl = (newUrl) => {
  if (!newUrl) return false;
  
  try {
    // Validate URL format
    new URL(newUrl);
    
    // Store in localStorage for persistence
    localStorage.setItem('api_base_url', newUrl);
    
    // Update axios defaults
    axios.defaults.baseURL = newUrl;
    
    console.log('API URL updated to:', newUrl);
    return true;
  } catch (error) {
    console.error('Invalid URL format:', error);
    return false;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [serverAvailable, setServerAvailable] = useState(true);
  const [recentlyLoggedIn, setRecentlyLoggedIn] = useState(false);
  const [apiUrl, setApiUrl] = useState(detectApiUrl());
  
  // Check for token expiration
  const isTokenExpired = useCallback((token) => {
    if (!token) return true;
    
    try {
      // Decode the JWT to get the expiration time
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      // Check if token is expired or about to expire in the next 5 minutes
      return decoded.exp < currentTime + 300;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }, []);
  
  // Refresh token if needed
  const refreshTokenIfNeeded = useCallback(async () => {
    // No refresh token logic needed, just resolve immediately
    return;
  }, []);

  // Add updateUser function
  const updateUser = useCallback((userData) => {
    if (!userData) return;
    
    console.log('Updating user with data:', userData);
    
    // Format the user data to ensure profile picture URLs are correct
    const formattedUserData = formatUserData(userData);
    
    console.log('Formatted user data:', formattedUserData);
    
    // Update the user state
    setUser(formattedUserData);
  }, []);

  // Define loadUser function before using it 
  const loadUser = useCallback(async () => {
    setLoading(true);
    
    try {
      // Check if we need to refresh the token first
      await refreshTokenIfNeeded();
      
      const token = localStorage.getItem('token');
      const currentApiUrl = detectApiUrl();
      
      if (!token) {
        setUser(null);
        setAuthenticated(false);
        setLoading(false);
        return;
      }
      
      // Set the auth token in axios headers
      setAuthToken(token);
      
      // Make the request to get the user data with a 10-second timeout
      const response = await axios.get(`${currentApiUrl}/api/users/me`, { timeout: 10000 });
      
      if (response.data) {
        setUser(formatUserData(response.data));
        setAuthenticated(true);
        setError(null);
        setServerAvailable(true);
      } else {
        setUser(null);
        setAuthenticated(false);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      
      // Handle different types of connection errors
      if (error.message === 'Network Error' || 
          error.code === 'ERR_NETWORK' || 
          error.code === 'ECONNABORTED' ||
          (error.response && error.response.status >= 500)) {
        setServerAvailable(false);
        setError('Cannot connect to server. Please check your internet connection or try again later.');
      }
      
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        // Try to refresh the token
        try {
          await refreshToken();
          // If successful, try loading user again - without recursive call
          setLoading(true);
          const newToken = localStorage.getItem('token');
          if (newToken) {
            setAuthToken(newToken);
            const newResponse = await axios.get(`${detectApiUrl()}/api/users/me`, { timeout: 10000 });
            if (newResponse.data) {
              setUser(formatUserData(newResponse.data));
              setAuthenticated(true);
              setError(null);
              setServerAvailable(true);
            }
          }
        } catch (refreshError) {
          // If refresh fails, log the user out
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          setAuthToken(null);
          setError('Your session has expired. Please log in again.');
        }
      }
    } finally {
      setLoading(false);
    }
  }, [refreshTokenIfNeeded]); // Remove loadUser from the dependency array to fix circular reference

  // Create memoized versions of the API URL functions inside the component
  const memoizedDetectApiUrl = useCallback(() => {
    return detectApiUrl();
  }, []);

  const memoizedUpdateApiUrl = useCallback((newUrl) => {
    return updateApiUrl(newUrl);
  }, []);

  // Update the enhancedUpdateApiBaseUrl function to use the memoized version
  const enhancedUpdateApiBaseUrl = useCallback(async (newUrl) => {
    const result = await memoizedUpdateApiUrl(newUrl);
    if (result) {
      setApiUrl(newUrl);
    }
    return result;
  }, [memoizedUpdateApiUrl]);

  // Reset recentlyLoggedIn flag after 10 seconds
  useEffect(() => {
    if (recentlyLoggedIn) {
      const timer = setTimeout(() => {
        setRecentlyLoggedIn(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [recentlyLoggedIn]);

  // Setup automatic token refresh
  useEffect(() => {
    // Set up a timer to check token expiration every minute
    const tokenCheckInterval = setInterval(() => {
      if (authenticated) {
        refreshTokenIfNeeded().catch(err => {
          console.error('Background token refresh failed:', err);
        });
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(tokenCheckInterval);
  }, [authenticated, refreshTokenIfNeeded]);

  // Initial load user effect
  useEffect(() => {
    // Check if token exists
    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [loadUser]);

  // Setup automatic token refresh before expiration
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) return;
    
    try {
      const decoded = jwtDecode(token);
      const expiresIn = decoded.exp * 1000 - Date.now();
      
      // If token expires in less than 5 minutes, refresh it immediately
      if (expiresIn < 300000) {
        refreshToken().catch(console.error);
        return;
      }
      
      // Otherwise, set a timer to refresh it 5 minutes before expiration
      const refreshTimeout = setTimeout(() => {
        refreshToken().catch(console.error);
      }, expiresIn - 300000);
      
      return () => clearTimeout(refreshTimeout);
    } catch (error) {
      console.error('Error setting up token refresh:', error);
    }
  }, [user]);

  // At the start of AuthProvider function
  useEffect(() => {
    // Check if we're accessing from a specific IP and adjust API URL
    if (window.location.hostname.match(/192\.168\.\d+\.\d+/)) {
      const browserIp = window.location.hostname;
      const currentPort = window.location.port || '3001';
      const serverPort = '5000';
      
      // If browser shows we're on 192.168.1.15:3000, set API to 192.168.1.15:5000
      const ipBasedApiUrl = `http://${browserIp}:${serverPort}`;
      console.log(`Browser detected on IP address ${browserIp}:${currentPort}, setting API URL to ${ipBasedApiUrl}`);
      
      localStorage.setItem('api_base_url', ipBasedApiUrl);
    }
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current API URL using detectApiUrl
      const currentApiUrl = detectApiUrl();
      console.log('Attempting login with API URL:', currentApiUrl);
      
      // Add more detailed logging
      console.log('Login attempt with email:', email);
      console.log('User agent:', navigator.userAgent);
      console.log('Platform:', navigator.platform);
      console.log('Is Mobile:', /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
      
      // Prepare the request data
      const loginData = {
        email: email.trim(),
        password: password
      };
      
      console.log('Login data being sent:', { ...loginData, password: '[REDACTED]' });
      console.log('Login data type:', typeof loginData);
      console.log('Login data stringified:', JSON.stringify(loginData));
      
      // Ensure axios is properly configured
      axios.defaults.baseURL = currentApiUrl;
      axios.defaults.headers.common['Content-Type'] = 'application/json';
      
      // Make login request with explicit URL and timeout
      const response = await axios.post(`${currentApiUrl}/api/auth/login`, loginData, {
        timeout: 15000, // Increase timeout for slow mobile connections
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Login response:', response.status, response.statusText);
      
      if (response.data && response.data.token) {
        console.log('Login successful, token received');
        localStorage.setItem('token', response.data.token);
        
        // Store refresh token if available
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        
        // Update axios defaults for future requests
        setAuthToken(response.data.token);
        
        // Set user data
        setUser(formatUserData(response.data.user));
        setAuthenticated(true);
        setRecentlyLoggedIn(true);
        setServerAvailable(true);
        
        return true;
      } else {
        console.error('No token in response:', response.data);
        throw new Error('No token received');
      }
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : 'No response',
        request: error.request ? 'Request sent but no response' : 'Request not sent'
      });
      
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
        setServerAvailable(false);
        setError('Cannot connect to server. Please check your connection and ensure you\'re using the correct server URL.');
      } else if (error.response && error.response.data) {
        setError(error.response.data.message || 'Login failed. Please check your credentials.');
      } else {
        setError('Login failed. Please try again.');
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setAuthenticated(false);
  };

  const register = async (name, email, phone, password) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current API URL using detectApiUrl (for consistency with login)
      const currentApiUrl = detectApiUrl();
      
      // Ensure all data is properly formatted
      const userData = {
        name: name.trim(),
        email: email.trim(),
        phoneNumber: phone ? phone.trim() : '',
        password: password
      };
      
      console.log('Attempting registration with data:', { ...userData, password: '[REDACTED]' });
      console.log('Registration data type:', typeof userData);
      console.log('Registration data stringified:', JSON.stringify(userData));
      
      const response = await axios.post(`${currentApiUrl}/api/auth/register`, userData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        setAuthToken(response.data.token);
        setUser(formatUserData(response.data.user));
        setAuthenticated(true);
        setRecentlyLoggedIn(true);
        
        return true;
      } else {
        throw new Error('Registration successful but no token received');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        setServerAvailable(false);
        setError('Cannot connect to server. Please check your connection.');
      } else if (error.response && error.response.data) {
        setError(error.response.data.message || 'Registration failed. Please try again.');
      } else {
        setError('Registration failed. Please try again.');
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    serverAvailable,
    recentlyLoggedIn,
    authenticated,
    apiUrl,
    detectApiUrl: memoizedDetectApiUrl,
    setUser,
    setLoading,
    setError,
    setAuthenticated,
    setServerAvailable,
    loadUser,
    updateUser,
    refreshToken: refreshTokenIfNeeded,
    updateApiBaseUrl: enhancedUpdateApiBaseUrl,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 