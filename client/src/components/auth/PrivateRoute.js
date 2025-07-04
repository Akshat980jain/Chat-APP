import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Typography,
  Alert,
  Button,
  Paper,
  Fade,
  LinearProgress,
  Backdrop
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';
import RefreshIcon from '@mui/icons-material/Refresh';
import LoginIcon from '@mui/icons-material/Login';
import WarningIcon from '@mui/icons-material/Warning';
import ShieldIcon from '@mui/icons-material/Shield';

const PrivateRoute = ({ 
  children, 
  requiredRole = null,
  requiredPermissions = [],
  fallbackPath = '/login',
  showLoadingBackdrop = false,
  requireEmailVerification = false,
  requirePhoneVerification = false,
  allowedPaths = [],
  blockedPaths = []
}) => {
  const { 
    user, 
    loading, 
    isAuthenticated,
    refreshAuth,
    hasRole,
    hasPermission,
    isEmailVerified,
    isPhoneVerified
  } = useAuth();
  
  const location = useLocation();
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showRetry, setShowRetry] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const MAX_RETRY_ATTEMPTS = 3;
  const LOADING_TIMEOUT = 10000; // 10 seconds
  const RETRY_DELAY = 2000; // 2 seconds

  // Simulate loading progress
  useEffect(() => {
    if (loading) {
      const timer = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      return () => clearInterval(timer);
    } else {
      setLoadingProgress(100);
    }
  }, [loading]);

  // Handle loading timeout
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        if (loading && retryCount < MAX_RETRY_ATTEMPTS) {
          setShowRetry(true);
          setAuthError('Authentication is taking longer than expected');
        }
      }, LOADING_TIMEOUT);

      return () => clearTimeout(timeout);
    }
  }, [loading, retryCount]);

  // Complete auth check when loading finishes
  useEffect(() => {
    if (!loading) {
      setAuthCheckComplete(true);
      setLoadingProgress(100);
    }
  }, [loading]);

  // Handle retry authentication
  const handleRetryAuth = async () => {
    if (retryCount >= MAX_RETRY_ATTEMPTS) {
      setAuthError('Maximum retry attempts reached. Please refresh the page.');
      return;
    }

    try {
      setShowRetry(false);
      setAuthError(null);
      setRetryCount(prev => prev + 1);
      setLoadingProgress(0);
      
      await refreshAuth();
      
      // Add delay before retry
      setTimeout(() => {
        if (loading) {
          setShowRetry(true);
          setAuthError('Authentication failed. Please try again.');
        }
      }, RETRY_DELAY);
    } catch (error) {
      console.error('Auth retry failed:', error);
      setAuthError('Authentication failed. Please try again.');
      setShowRetry(true);
    }
  };

  // Check if user has required role
  const hasRequiredRole = () => {
    if (!requiredRole) return true;
    return hasRole ? hasRole(requiredRole) : false;
  };

  // Check if user has required permissions
  const hasRequiredPermissions = () => {
    if (!requiredPermissions.length) return true;
    return hasPermission ? 
      requiredPermissions.every(permission => hasPermission(permission)) : 
      false;
  };

  // Check verification requirements
  const meetsVerificationRequirements = () => {
    if (requireEmailVerification && !isEmailVerified()) {
      return false;
    }
    if (requirePhoneVerification && !isPhoneVerified()) {
      return false;
    }
    return true;
  };

  // Check if current path is allowed/blocked
  const isPathAllowed = () => {
    const currentPath = location.pathname;
    
    if (blockedPaths.length > 0 && blockedPaths.includes(currentPath)) {
      return false;
    }
    
    if (allowedPaths.length > 0 && !allowedPaths.includes(currentPath)) {
      return false;
    }
    
    return true;
  };

  // Advanced loading component
  const LoadingComponent = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        position: 'relative'
      }}
    >
      {showLoadingBackdrop && (
        <Backdrop
          sx={{ 
            color: '#fff', 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            backdropFilter: 'blur(4px)'
          }}
          open={loading}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress color="inherit" size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Authenticating...
            </Typography>
          </Box>
        </Backdrop>
      )}

      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 3,
          textAlign: 'center',
          maxWidth: 400,
          width: '100%',
          mx: 2,
          bgcolor: 'background.paper'
        }}
      >
        <Box sx={{ mb: 3 }}>
          <SecurityIcon 
            sx={{ 
              fontSize: 48, 
              color: 'primary.main',
              mb: 2
            }} 
          />
          <Typography variant="h5" gutterBottom>
            Verifying Access
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please wait while we authenticate your session
          </Typography>
        </Box>

        <Box sx={{ width: '100%', mb: 3 }}>
          <LinearProgress 
            variant="determinate" 
            value={loadingProgress}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {loadingProgress}% Complete
          </Typography>
        </Box>

        {authError && (
          <Fade in={!!authError}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              {authError}
            </Alert>
          </Fade>
        )}

        {showRetry && (
          <Fade in={showRetry}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={handleRetryAuth}
                startIcon={<RefreshIcon />}
                disabled={retryCount >= MAX_RETRY_ATTEMPTS}
              >
                Retry ({retryCount}/{MAX_RETRY_ATTEMPTS})
              </Button>
              <Button
                variant="text"
                onClick={() => window.location.href = fallbackPath}
                startIcon={<LoginIcon />}
              >
                Go to Login
              </Button>
            </Box>
          </Fade>
        )}

        <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <ShieldIcon sx={{ fontSize: 16, color: 'success.main' }} />
          <Typography variant="caption" color="text.secondary">
            Secure authentication in progress
          </Typography>
        </Box>
      </Paper>
    </Box>
  );

  // Unauthorized access component
  const UnauthorizedComponent = ({ reason }) => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        p: 3
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 3,
          textAlign: 'center',
          maxWidth: 500,
          width: '100%'
        }}
      >
        <WarningIcon 
          sx={{ 
            fontSize: 64, 
            color: 'warning.main',
            mb: 2
          }} 
        />
        <Typography variant="h4" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          {reason}
        </Typography>
        
        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={() => window.location.href = fallbackPath}
            startIcon={<LoginIcon />}
          >
            Go to Login
          </Button>
          <Button
            variant="outlined"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </Box>
      </Paper>
    </Box>
  );

  // Show loading while authentication is in progress
  if (loading || !authCheckComplete) {
    console.log('Authentication in progress...');
    return <LoadingComponent />;
  }

  // Check if user is authenticated
  if (!isAuthenticated && !user) {
    console.log('No authenticated user found, redirecting to login');
    return <Navigate 
      to={fallbackPath} 
      state={{ from: location }} 
      replace 
    />;
  }

  // Check role requirements
  if (requiredRole && !hasRequiredRole()) {
    console.log(`User lacks required role: ${requiredRole}`);
    return <UnauthorizedComponent 
      reason={`You need ${requiredRole} privileges to access this page.`}
    />;
  }

  // Check permission requirements
  if (requiredPermissions.length > 0 && !hasRequiredPermissions()) {
    console.log(`User lacks required permissions: ${requiredPermissions.join(', ')}`);
    return <UnauthorizedComponent 
      reason="You don't have the required permissions to access this page."
    />;
  }

  // Check verification requirements
  if (!meetsVerificationRequirements()) {
    const verificationMessage = [];
    if (requireEmailVerification && !isEmailVerified()) {
      verificationMessage.push('email verification');
    }
    if (requirePhoneVerification && !isPhoneVerified()) {
      verificationMessage.push('phone verification');
    }
    
    return <UnauthorizedComponent 
      reason={`Please complete ${verificationMessage.join(' and ')} to access this page.`}
    />;
  }

  // Check path restrictions
  if (!isPathAllowed()) {
    console.log(`Access to path ${location.pathname} is restricted`);
    return <UnauthorizedComponent 
      reason="Access to this page is restricted."
    />;
  }

  // All checks passed, render the protected route
  console.log('User authenticated and authorized, rendering protected route');
  return children;
};

export default PrivateRoute;