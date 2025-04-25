import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ChatIcon from '@mui/icons-material/Chat';
import RefreshIcon from '@mui/icons-material/Refresh';
import { CircularProgress } from '@mui/material';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user, serverAvailable, error: authError, detectApiUrl } = useAuth();
  const navigate = useNavigate();

  // Display server connection info
  const [serverUrl, setServerUrl] = useState('');
  const [retrying, setRetrying] = useState(false);
  
  useEffect(() => {
    // Get and display current API URL
    const apiUrl = detectApiUrl();
    setServerUrl(apiUrl);
    console.log('Current API URL:', apiUrl);
    
    // Log device info for debugging
    console.log('Device info:', {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      isMobile: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      pixelRatio: window.devicePixelRatio
    });
  }, [detectApiUrl]);

  // If already logged in, redirect to the main page
  useEffect(() => {
    if (user) {
      console.log('User already logged in, redirecting to chat');
      navigate('/');
    }
  }, [user, navigate]);

  // Show auth context errors in the login form
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  // Function to retry server connection
  const handleRetryConnection = () => {
    setRetrying(true);
    // Clear the stored API URL to force detection of a new one
    localStorage.removeItem('api_url');
    
    // Try to detect a new API URL
    const newApiUrl = detectApiUrl();
    setServerUrl(newApiUrl);
    
    // Try to connect to this new URL
    console.log('Retrying connection with:', newApiUrl);
    
    // Wait a moment and refresh
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      console.log('Submitting login form...');
      const success = await login(email, password);
      console.log('Login result:', success);
      
      if (success) {
        console.log('Login successful, user should be redirected by useEffect');
      }
    } catch (err) {
      console.error('Login error caught in component:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!serverAvailable) {
    // Check if the error is related to the specific IP issue in the screenshot
    const isIPIssue = window.location.hostname.includes('192.168.1.15');
    const fixSuggestion = isIPIssue 
      ? 'Your browser is accessing from IP 192.168.1.15. Please make sure the server is running on the same IP at port 5000.'
      : 'Please check your connection and try again.';
      
    return (
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="alert alert-danger" role="alert">
            <h5>Cannot connect to server</h5>
            <p>{fixSuggestion}</p>
            <div className="mt-2 small mb-3">
              Current server URL: {serverUrl}
            </div>
            <div className="d-flex justify-content-between align-items-center">
              <button 
                className="btn btn-outline-danger"
                onClick={() => window.location.reload()}
              >
                Refresh
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleRetryConnection}
                disabled={retrying}
              >
                {retrying ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Retrying...
                  </>
                ) : 'Try Different Server'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="col-12 col-md-6 col-lg-4">
        <div className="card shadow-sm p-4 p-md-5">
          <div className="text-center mb-4">
            <div className="d-inline-flex align-items-center justify-content-center bg-primary text-white p-3 rounded-3 mb-3">
              <ChatIcon fontSize="large" />
            </div>
            
            <h1 className="h4 text-primary fw-bold mb-1">Modern Chat</h1>
            <h2 className="h5 mb-4">Login</h2>
          </div>

          {error && (
            <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
              {error}
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setError('')}
                aria-label="Close"
              ></button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                autoFocus
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            
            <button
              type="submit"
              className="btn btn-primary w-100 py-2 mb-4"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Login'}
            </button>
            
            <hr className="my-4" />
            
            <div className="text-center">
              <p className="mb-0">
                Don't have an account?{' '}
                <Link to="/register" className="text-decoration-none">
                  Sign Up
                </Link>
              </p>
              <small className="text-muted d-block mt-3">
                Connected to: {serverUrl}
              </small>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login; 