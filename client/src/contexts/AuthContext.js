import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';

// Optimized API URL detection with caching
let cachedApiUrl = null;
let lastDetectionTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

const detectApiUrl = () => {
  // Use cached URL if recent
  if (cachedApiUrl && Date.now() - lastDetectionTime < CACHE_DURATION) {
    return cachedApiUrl;
  }
  
  // Check localStorage first for manually set URL
  const storedUrl = localStorage.getItem('api_base_url');
  if (storedUrl) {
    console.log('Using stored API URL:', storedUrl);
    cachedApiUrl = storedUrl;
    lastDetectionTime = Date.now();
    return storedUrl;
  }
  
  // Check for environment variable
  if (process.env.REACT_APP_API_URL) {
    console.log('Using environment API URL:', process.env.REACT_APP_API_URL);
    cachedApiUrl = process.env.REACT_APP_API_URL;
    lastDetectionTime = Date.now();
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
      cachedApiUrl = localApiUrl;
      lastDetectionTime = Date.now();
      return localApiUrl;
    }
    
    // If we're on a local IP, try the same IP with port 5000
    if (hostname.match(/^192\.168\.\d+\.\d+$/)) {
      const localApiUrl = `http://${hostname}:5000`;
      console.log('Local IP detected, using local API URL:', localApiUrl);
      cachedApiUrl = localApiUrl;
      lastDetectionTime = Date.now();
      return localApiUrl;
    }
  }
  
  // Fallback to production URL
  const fallbackUrl = 'https://chat-app-backend-pus1.onrender.com';
  console.log('Using fallback API URL:', fallbackUrl);
  cachedApiUrl = fallbackUrl;
  lastDetectionTime = Date.now();
  return fallbackUrl;
};

// Optimized axios interceptors
axios.interceptors.request.use(
  (config) => {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error.message);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    // Only log errors and important responses
    if (response.status >= 400 || process.env.NODE_ENV === 'development') {
      console.log('API Response:', response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.status, error.message);
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
    axios.defaults.baseURL = detectApiUrl();
    localStorage.setItem('token', token);
  } else {
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

// Simplified refresh token implementation
export const refreshToken = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    const response = await axios.get('/api/auth/refresh-token');
    if (response.data?.token) {
      setAuthToken(response.data.token);
      return true;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    localStorage.removeItem('token');
  }
  return false;
};

// Helper to ensure profile picture URLs are correct
const formatUserData = (userData) => {
  if (!userData) return null;
  
  const formattedUser = { ...userData };
  
  if (formattedUser.profilePicture && !formattedUser.profilePicture.startsWith('http')) {
    const currentApiUrl = detectApiUrl();
    formattedUser.profilePicture = `${currentApiUrl}${formattedUser.profilePicture}`;
  }
  
  return formattedUser;
};

// Optimized API URL update function
const updateApiUrl = (newUrl) => {
  if (!newUrl) return false;
  
  try {
    new URL(newUrl);
    localStorage.setItem('api_base_url', newUrl);
    axios.defaults.baseURL = newUrl;
    cachedApiUrl = newUrl;
    lastDetectionTime = Date.now();
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
  const [retryCount, setRetryCount] = useState(0);
  const [lastErrorTime, setLastErrorTime] = useState(0);
  
  // Optimized token expiration check
  // Check for token expiration
  const isTokenExpired = useCallback((token) => {
    if (!token) return true;
    
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime + 300;
    } catch (error) {
      return true;
    }
  }, []);
  
  // Optimized token refresh
  const refreshTokenIfNeeded = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token || !isTokenExpired(token)) return true;
    
    try {
      const success = await refreshToken();
      if (success) {
        setRetryCount(0);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    
    return false;
  }, []);

  // Optimized user update function
  const updateUser = useCallback((userData) => {
    if (!userData) return;
    const formattedUserData = formatUserData(userData);
    setUser(formattedUserData);
  }, []);

  // Optimized load user function
  const loadUser = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (loading) return;
    
    setLoading(true);
    
    try {
      await refreshTokenIfNeeded();
      
      const token = localStorage.getItem('token');
      const currentApiUrl = detectApiUrl();
      
      if (!token) {
        setUser(null);
        setAuthenticated(false);
        return;
      }
      
      setAuthToken(token);
      
      const response = await axios.get(`${currentApiUrl}/api/users/me`, { 
        timeout: 8000,
        retry: 2
      });
      
      if (response.data) {
        setUser(formatUserData(response.data));
        setAuthenticated(true);
        setError(null);
        setServerAvailable(true);
        setRetryCount(0);
      } else {
        setUser(null);
        setAuthenticated(false);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      
      // Implement exponential backoff for retries
      const now = Date.now();
      if (now - lastErrorTime > 5000) { // Only retry if last error was more than 5 seconds ago
        setRetryCount(prev => prev + 1);
        setLastErrorTime(now);
      }
      
      if (error.message === 'Network Error' || 
          error.code === 'ERR_NETWORK' || 
          error.code === 'ECONNABORTED' ||
          (error.response && error.response.status >= 500)) {
        setServerAvailable(false);
        
        if (retryCount < 3) {
          // Auto-retry with exponential backoff
          setTimeout(() => {
            loadUser();
          }, Math.min(1000 * Math.pow(2, retryCount), 10000));
        } else {
          setError('Cannot connect to server. Please check your connection.');
        }
      }
      
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        // Session expired
        localStorage.removeItem('token');
        setAuthToken(null);
        setUser(null);
        setAuthenticated(false);
        setError('Session expired. Please log in again.');
      }
    } finally {
      setLoading(false);
    }
  }, [refreshTokenIfNeeded, retryCount, lastErrorTime]);

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
      setRetryCount(0);
      
      const currentApiUrl = detectApiUrl();
      
      const loginData = {
        email: email.trim(),
        password: password
      };
      
      axios.defaults.baseURL = currentApiUrl;
      axios.defaults.headers.common['Content-Type'] = 'application/json';
      
      const response = await axios.post(`${currentApiUrl}/api/auth/login`, loginData, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        
        setAuthToken(response.data.token);
        setUser(formatUserData(response.data.user));
        setAuthenticated(true);
        setRecentlyLoggedIn(true);
        setServerAvailable(true);
        setRetryCount(0);
        
        toast.success('Login successful!');
        
        return true;
      } else {
        throw new Error('No token received');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
        setServerAvailable(false);
        setError('Cannot connect to server. Please check your connection.');
        toast.error('Connection failed. Please check your network.');
      } else if (error.response && error.response.data) {
        const errorMsg = error.response.data.message || 'Login failed. Please check your credentials.';
        setError(errorMsg);
        toast.error(errorMsg);
      } else {
        setError('Login failed. Please try again.');
        toast.error('Login failed. Please try again.');
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
      setRetryCount(0);
      
      const currentApiUrl = detectApiUrl();
      
      const userData = {
        name: name.trim(),
        email: email.trim(),
        phoneNumber: phone ? phone.trim() : '',
        password: password
      };
      
      const response = await axios.post(`${currentApiUrl}/api/auth/register`, userData, {
        timeout: 10000,
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
        setRetryCount(0);
        
        toast.success('Registration successful!');
        
        return true;
      } else {
        throw new Error('Registration successful but no token received');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        setServerAvailable(false);
        const errorMsg = 'Cannot connect to server. Please check your connection.';
        setError(errorMsg);
        toast.error(errorMsg);
      } else if (error.response && error.response.data) {
        const errorMsg = error.response.data.message || 'Registration failed. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg);
      } else {
        setError('Registration failed. Please try again.');
        toast.error('Registration failed. Please try again.');
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
    retryCount,
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