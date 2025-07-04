import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ChatIcon from '@mui/icons-material/Chat';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SecurityIcon from '@mui/icons-material/Security';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import { CircularProgress, IconButton, Tooltip, Collapse } from '@mui/material';

const Login = () => {
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Validation state
  const [fieldErrors, setFieldErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  
  // Security & Connection state
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [serverHealth, setServerHealth] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Biometric state
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('');
  
  // Refs
  const blockTimerRef = useRef(null);
  const healthCheckRef = useRef(null);
  const formRef = useRef(null);
  
  const { login, user, serverAvailable, error: authError, detectApiUrl } = useAuth();
  const navigate = useNavigate();
  
  // Constants
  const MAX_LOGIN_ATTEMPTS = 3;
  const BLOCK_DURATION = 300000; // 5 minutes
  const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  const RETRY_DELAYS = [1000, 2000, 4000, 8000]; // Exponential backoff

  // Initialize component
  useEffect(() => {
    initializeComponent();
    checkBiometricSupport();
    loadStoredData();
    
    return () => {
      if (blockTimerRef.current) clearInterval(blockTimerRef.current);
      if (healthCheckRef.current) clearInterval(healthCheckRef.current);
    };
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      console.log('User already logged in, redirecting to chat');
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // Handle auth errors
  useEffect(() => {
    if (authError) {
      handleAuthError(authError);
    }
  }, [authError]);

  // Initialize component data
  const initializeComponent = () => {
    const apiUrl = detectApiUrl();
    console.log('Current API URL:', apiUrl);
    
    // Log enhanced device info
    console.log('Enhanced device info:', {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      isMobile: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      pixelRatio: window.devicePixelRatio,
      connection: navigator.connection,
      language: navigator.language,
      onLine: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
      timestamp: new Date().toISOString()
    });
    
    startHealthCheck();
    checkStoredBlocking();
  };

  // Check if biometric authentication is available
  const checkBiometricSupport = async () => {
    if ('credentials' in navigator && 'create' in navigator.credentials) {
      try {
        const available = await navigator.credentials.get({
          publicKey: {
            challenge: new Uint8Array(32),
            allowCredentials: [],
            timeout: 60000
          }
        });
        setBiometricAvailable(true);
        setBiometricType('WebAuthn');
      } catch (err) {
        // Check for Touch ID/Face ID on iOS
        if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
          setBiometricType('Touch ID / Face ID');
        } else if (navigator.userAgent.includes('Android')) {
          setBiometricType('Fingerprint');
        }
        setBiometricAvailable(false);
      }
    }
  };

  // Load stored data
  const loadStoredData = () => {
    const stored = localStorage.getItem('loginPreferences');
    if (stored) {
      try {
        const prefs = JSON.parse(stored);
        setRememberMe(prefs.rememberMe || false);
        if (prefs.rememberMe && prefs.email) {
          setFormData(prev => ({ ...prev, email: prefs.email }));
        }
      } catch (err) {
        console.error('Error loading stored preferences:', err);
      }
    }
  };

  // Check if user is currently blocked
  const checkStoredBlocking = () => {
    const blockData = localStorage.getItem('loginBlocked');
    if (blockData) {
      try {
        const { timestamp, attempts } = JSON.parse(blockData);
        const timePassed = Date.now() - timestamp;
        
        if (timePassed < BLOCK_DURATION) {
          setIsBlocked(true);
          setLoginAttempts(attempts);
          setBlockTimeRemaining(Math.ceil((BLOCK_DURATION - timePassed) / 1000));
          startBlockTimer();
        } else {
          localStorage.removeItem('loginBlocked');
        }
      } catch (err) {
        localStorage.removeItem('loginBlocked');
      }
    }
  };

  // Start block timer
  const startBlockTimer = () => {
    blockTimerRef.current = setInterval(() => {
      setBlockTimeRemaining(prev => {
        if (prev <= 1) {
          setIsBlocked(false);
          setLoginAttempts(0);
          localStorage.removeItem('loginBlocked');
          clearInterval(blockTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Start health check
  const startHealthCheck = () => {
    healthCheckRef.current = setInterval(async () => {
      try {
        const response = await fetch(`${detectApiUrl()}/health`, {
          method: 'GET',
          timeout: 5000
        });
        
        if (response.ok) {
          const health = await response.json();
          setServerHealth(health);
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('degraded');
        }
      } catch (err) {
        setConnectionStatus('disconnected');
        setServerHealth(null);
      }
    }, HEALTH_CHECK_INTERVAL);
  };

  // Handle auth errors with enhanced feedback
  const handleAuthError = (error) => {
    setLoginAttempts(prev => {
      const newAttempts = prev + 1;
      
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        setIsBlocked(true);
        setBlockTimeRemaining(BLOCK_DURATION / 1000);
        
        localStorage.setItem('loginBlocked', JSON.stringify({
          timestamp: Date.now(),
          attempts: newAttempts
        }));
        
        startBlockTimer();
        setError(`Too many failed attempts. Please try again in ${Math.ceil(BLOCK_DURATION / 60000)} minutes.`);
      } else {
        setError(`${error} (${newAttempts}/${MAX_LOGIN_ATTEMPTS} attempts)`);
      }
      
      return newAttempts;
    });
  };

  // Enhanced form validation
  const validateForm = useCallback(() => {
    const errors = {};
    let isValid = true;

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
      isValid = false;
    }

    setFieldErrors(errors);
    setIsFormValid(isValid);
    return isValid;
  }, [formData]);

  // Validate form on data change
  useEffect(() => {
    validateForm();
  }, [formData, validateForm]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(''); // Clear general error when user types
    
    // Clear specific field error
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle form submission with enhanced error handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isBlocked) {
      setError(`Please wait ${blockTimeRemaining} seconds before trying again.`);
      return;
    }

    if (!validateForm()) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      console.log('Submitting enhanced login form...');
      
      // Save preferences
      if (rememberMe) {
        localStorage.setItem('loginPreferences', JSON.stringify({
          email: formData.email,
          rememberMe: true
        }));
      } else {
        localStorage.removeItem('loginPreferences');
      }

      const success = await login(formData.email, formData.password);
      
      if (success) {
        // Reset attempts on successful login
        setLoginAttempts(0);
        localStorage.removeItem('loginBlocked');
        console.log('Login successful');
      }
    } catch (err) {
      console.error('Login error:', err);
      handleAuthError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle biometric login
  const handleBiometricLogin = async () => {
    if (!biometricAvailable) return;
    
    try {
      setLoading(true);
      // Implement biometric authentication logic here
      // This is a placeholder for WebAuthn implementation
      console.log('Biometric login attempted');
      setError('Biometric authentication not fully implemented yet');
    } catch (err) {
      setError('Biometric authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle retry connection with exponential backoff
  const handleRetryConnection = async () => {
    const delay = RETRY_DELAYS[Math.min(retryCount, RETRY_DELAYS.length - 1)];
    setRetryCount(prev => prev + 1);
    
    setConnectionStatus('connecting');
    
    // Clear stored API URL
    localStorage.removeItem('api_url');
    
    // Wait with exponential backoff
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      const newApiUrl = detectApiUrl();
      const response = await fetch(`${newApiUrl}/health`);
      
      if (response.ok) {
        setConnectionStatus('connected');
        setRetryCount(0);
        window.location.reload();
      } else {
        throw new Error('Server not responding');
      }
    } catch (err) {
      setConnectionStatus('disconnected');
      setError('Could not connect to server. Please check your network connection.');
    }
  };

  // Format time remaining
  const formatTimeRemaining = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get connection status icon and color
  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case 'connected':
        return { icon: <WifiIcon />, color: 'text-success', text: 'Connected' };
      case 'degraded':
        return { icon: <WifiIcon />, color: 'text-warning', text: 'Slow Connection' };
      case 'connecting':
        return { icon: <CircularProgress size={16} />, color: 'text-info', text: 'Connecting...' };
      default:
        return { icon: <WifiOffIcon />, color: 'text-danger', text: 'Disconnected' };
    }
  };

  // Server unavailable screen
  if (!serverAvailable) {
    const isIPIssue = window.location.hostname.includes('192.168.1.15');
    const connectionDisplay = getConnectionStatusDisplay();
    
    return (
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="col-12 col-md-8 col-lg-6 col-xl-4">
          <div className="card shadow-lg border-0">
            <div className="card-header bg-danger text-white text-center py-4">
              <ErrorOutlineIcon fontSize="large" className="mb-2" />
              <h4 className="mb-0">Server Connection Lost</h4>
            </div>
            <div className="card-body p-4">
              <div className="alert alert-danger border-0" role="alert">
                <h6 className="alert-heading">Connection Details</h6>
                <p className="mb-2">
                  {isIPIssue 
                    ? 'Your browser is accessing from IP 192.168.1.15. Please ensure the server is running on the same network at port 5000.'
                    : 'Unable to establish connection with the server. Please check your network connection and server status.'}
                </p>
                <hr />
                <div className="row g-3 text-sm">
                  <div className="col-6">
                    <strong>Server URL:</strong><br />
                    <code className="text-break">{detectApiUrl()}</code>
                  </div>
                  <div className="col-6">
                    <strong>Status:</strong><br />
                    <span className={connectionDisplay.color}>
                      {connectionDisplay.icon} {connectionDisplay.text}
                    </span>
                  </div>
                  <div className="col-6">
                    <strong>Retry Attempts:</strong><br />
                    {retryCount}/∞
                  </div>
                  <div className="col-6">
                    <strong>Last Check:</strong><br />
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
              
              <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => window.location.reload()}
                >
                  <RefreshIcon className="me-1" />
                  Refresh Page
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleRetryConnection}
                  disabled={connectionStatus === 'connecting'}
                >
                  {connectionStatus === 'connecting' ? (
                    <>
                      <CircularProgress size={16} className="me-2" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <RefreshIcon className="me-1" />
                      Retry Connection
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main login form
  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="col-12 col-md-6 col-lg-4 col-xl-3">
        <div className="card shadow-lg border-0">
          {/* Header */}
          <div className="card-header bg-white border-0 text-center py-4">
            <div className="d-inline-flex align-items-center justify-content-center bg-primary text-white p-3 rounded-circle mb-3">
              <ChatIcon fontSize="large" />
            </div>
            <h1 className="h4 text-primary fw-bold mb-1">Modern Chat</h1>
            <p className="text-muted mb-0">Secure Login Portal</p>
          </div>

          <div className="card-body p-4">
            {/* Status Bar */}
            <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-light rounded">
              <div className="d-flex align-items-center">
                <span className={`me-2 ${getConnectionStatusDisplay().color}`}>
                  {getConnectionStatusDisplay().icon}
                </span>
                <small className="text-muted">
                  {getConnectionStatusDisplay().text}
                </small>
              </div>
              <div className="d-flex align-items-center">
                <SecurityIcon className="text-success me-1" fontSize="small" />
                <small className="text-muted">SSL Secured</small>
              </div>
            </div>

            {/* Error Display */}
            <Collapse in={!!error}>
              <div className="alert alert-danger border-0 mb-3" role="alert">
                <div className="d-flex align-items-center">
                  <ErrorOutlineIcon className="me-2" />
                  <div className="flex-grow-1">
                    {error}
                    {isBlocked && (
                      <div className="mt-2">
                        <strong>Time remaining: {formatTimeRemaining(blockTimeRemaining)}</strong>
                      </div>
                    )}
                  </div>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setError('')}
                    aria-label="Close"
                  />
                </div>
              </div>
            </Collapse>

            {/* Login Form */}
            <form ref={formRef} onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  Email Address <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  className={`form-control ${fieldErrors.email ? 'is-invalid' : formData.email ? 'is-valid' : ''}`}
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={loading || isBlocked}
                  required
                  autoComplete="email"
                  autoFocus
                />
                {fieldErrors.email && (
                  <div className="invalid-feedback">{fieldErrors.email}</div>
                )}
              </div>
              
              <div className="mb-3">
                <label htmlFor="password" className="form-label">
                  Password <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`form-control ${fieldErrors.password ? 'is-invalid' : formData.password ? 'is-valid' : ''}`}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    disabled={loading || isBlocked}
                    required
                    autoComplete="current-password"
                  />
                  <IconButton
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading || isBlocked}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                  {fieldErrors.password && (
                    <div className="invalid-feedback">{fieldErrors.password}</div>
                  )}
                </div>
              </div>

              {/* Remember Me */}
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading || isBlocked}
                />
                <label className="form-check-label" htmlFor="rememberMe">
                  Remember me on this device
                </label>
              </div>
              
              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary w-100 py-2 mb-3"
                disabled={loading || isBlocked || !isFormValid}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} className="me-2" />
                    Signing in...
                  </>
                ) : isBlocked ? (
                  `Blocked (${formatTimeRemaining(blockTimeRemaining)})`
                ) : (
                  'Sign In'
                )}
              </button>

              {/* Biometric Login */}
              {biometricAvailable && (
                <button
                  type="button"
                  className="btn btn-outline-primary w-100 py-2 mb-3"
                  onClick={handleBiometricLogin}
                  disabled={loading || isBlocked}
                >
                  <FingerprintIcon className="me-2" />
                  Sign in with {biometricType}
                </button>
              )}
            </form>
            
            {/* Advanced Options */}
            <div className="text-center">
              <button
                type="button"
                className="btn btn-link btn-sm text-decoration-none"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              >
                {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
              </button>
            </div>

            <Collapse in={showAdvancedOptions}>
              <div className="mt-3 p-3 bg-light rounded">
                <h6 className="mb-2">Connection Details</h6>
                <div className="row g-2 text-sm">
                  <div className="col-6">
                    <strong>Server:</strong><br />
                    <code className="text-break">{detectApiUrl()}</code>
                  </div>
                  <div className="col-6">
                    <strong>Health:</strong><br />
                    {serverHealth ? (
                      <span className="text-success">
                        <CheckCircleIcon fontSize="small" className="me-1" />
                        {serverHealth.status}
                      </span>
                    ) : (
                      <span className="text-warning">Unknown</span>
                    )}
                  </div>
                </div>
              </div>
            </Collapse>
          </div>

          {/* Footer */}
          <div className="card-footer bg-white border-0 text-center py-3">
            <p className="mb-2">
              Don't have an account?{' '}
              <Link to="/register" className="text-decoration-none">
                Create Account
              </Link>
            </p>
            <p className="mb-0">
              <Link to="/forgot-password" className="text-decoration-none text-muted">
                Forgot Password?
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;