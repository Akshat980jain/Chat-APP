import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Collapse,
  FormControlLabel,
  Checkbox,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import ChatIcon from '@mui/icons-material/Chat';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import SecurityIcon from '@mui/icons-material/Security';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import PolicyIcon from '@mui/icons-material/Policy';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

const Register = () => {
  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Validation state
  const [fieldErrors, setFieldErrors] = useState({});
  const [fieldValidation, setFieldValidation] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordCriteria, setPasswordCriteria] = useState({});
  
  // Security & Privacy state
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [enableNewsletter, setEnableNewsletter] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  
  // Email verification state
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  
  // Phone verification state
  const [phoneVerificationSent, setPhoneVerificationSent] = useState(false);
  const [phoneVerificationCode, setPhoneVerificationCode] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  
  // Registration attempts tracking
  const [registrationAttempts, setRegistrationAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  
  // Refs
  const blockTimerRef = useRef(null);
  const formRef = useRef(null);
  const passwordRef = useRef(null);
  
  const { register, user, verifyEmail, verifyPhone } = useAuth();
  const navigate = useNavigate();
  
  // Constants
  const MAX_REGISTRATION_ATTEMPTS = 3;
  const BLOCK_DURATION = 600000; // 10 minutes
  const STEPS = ['Personal Info', 'Contact Details', 'Security Setup', 'Verification'];
  
  // Password strength criteria
  const PASSWORD_CRITERIA = {
    length: { label: 'At least 8 characters', regex: /.{8,}/ },
    uppercase: { label: 'One uppercase letter', regex: /[A-Z]/ },
    lowercase: { label: 'One lowercase letter', regex: /[a-z]/ },
    number: { label: 'One number', regex: /\d/ },
    special: { label: 'One special character', regex: /[!@#$%^&*(),.?":{}|<>]/ }
  };

  // Initialize component
  useEffect(() => {
    checkStoredBlocking();
    loadStoredData();
    
    return () => {
      if (blockTimerRef.current) clearInterval(blockTimerRef.current);
    };
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // Load stored registration data
  const loadStoredData = () => {
    const stored = localStorage.getItem('registrationDraft');
    if (stored) {
      try {
        const draft = JSON.parse(stored);
        setFormData(prev => ({ ...prev, ...draft }));
        setEnableNewsletter(draft.enableNewsletter || false);
      } catch (err) {
        console.error('Error loading stored registration data:', err);
      }
    }
  };

  // Check if user is currently blocked
  const checkStoredBlocking = () => {
    const blockData = localStorage.getItem('registrationBlocked');
    if (blockData) {
      try {
        const { timestamp, attempts } = JSON.parse(blockData);
        const timePassed = Date.now() - timestamp;
        
        if (timePassed < BLOCK_DURATION) {
          setIsBlocked(true);
          setRegistrationAttempts(attempts);
          setBlockTimeRemaining(Math.ceil((BLOCK_DURATION - timePassed) / 1000));
          startBlockTimer();
        } else {
          localStorage.removeItem('registrationBlocked');
        }
      } catch (err) {
        localStorage.removeItem('registrationBlocked');
      }
    }
  };

  // Start block timer
  const startBlockTimer = () => {
    blockTimerRef.current = setInterval(() => {
      setBlockTimeRemaining(prev => {
        if (prev <= 1) {
          setIsBlocked(false);
          setRegistrationAttempts(0);
          localStorage.removeItem('registrationBlocked');
          clearInterval(blockTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Enhanced validation functions
  const validateField = useCallback((field, value) => {
    const errors = {};
    const validation = {};

    switch (field) {
      case 'name':
        if (!value.trim()) {
          errors.name = 'Full name is required';
        } else if (value.trim().length < 2) {
          errors.name = 'Name must be at least 2 characters';
        } else if (!/^[a-zA-Z\s'-]+$/.test(value)) {
          errors.name = 'Name can only contain letters, spaces, hyphens, and apostrophes';
        } else {
          validation.name = true;
        }
        break;

      case 'email':
        if (!value) {
          errors.email = 'Email address is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = 'Please enter a valid email address';
        } else if (value.length > 254) {
          errors.email = 'Email address is too long';
        } else {
          validation.email = true;
        }
        break;

      case 'phone':
        if (!value) {
          errors.phone = 'Phone number is required';
        } else if (!/^[\d\s\-+()]{10,15}$/.test(value.replace(/\D/g, ''))) {
          errors.phone = 'Please enter a valid phone number';
        } else if (value.replace(/\D/g, '').length < 10) {
          errors.phone = 'Phone number must be at least 10 digits';
        } else {
          validation.phone = true;
        }
        break;

      case 'password':
        const criteria = {};
        let strengthScore = 0;
        
        Object.entries(PASSWORD_CRITERIA).forEach(([key, criterion]) => {
          const passed = criterion.regex.test(value);
          criteria[key] = passed;
          if (passed) strengthScore++;
        });
        
        setPasswordCriteria(criteria);
        setPasswordStrength(strengthScore);
        
        if (!value) {
          errors.password = 'Password is required';
        } else if (strengthScore < 3) {
          errors.password = 'Password is too weak';
        } else {
          validation.password = true;
        }
        break;

      case 'confirmPassword':
        if (!value) {
          errors.confirmPassword = 'Please confirm your password';
        } else if (value !== formData.password) {
          errors.confirmPassword = 'Passwords do not match';
        } else {
          validation.confirmPassword = true;
        }
        break;

      default:
        break;
    }

    return { errors, validation };
  }, [formData.password]);

  // Validate entire form
  const validateForm = useCallback(() => {
    const allErrors = {};
    const allValidation = {};
    let isValid = true;

    Object.entries(formData).forEach(([field, value]) => {
      const { errors, validation } = validateField(field, value);
      Object.assign(allErrors, errors);
      Object.assign(allValidation, validation);
      
      if (Object.keys(errors).length > 0) {
        isValid = false;
      }
    });

    // Check agreements
    if (!agreedToTerms) {
      allErrors.terms = 'You must agree to the terms and conditions';
      isValid = false;
    }
    
    if (!agreedToPrivacy) {
      allErrors.privacy = 'You must agree to the privacy policy';
      isValid = false;
    }

    setFieldErrors(allErrors);
    setFieldValidation(allValidation);
    setIsFormValid(isValid);
    
    return isValid;
  }, [formData, agreedToTerms, agreedToPrivacy, validateField]);

  // Validate on form data change
  useEffect(() => {
    validateForm();
    
    // Save draft to localStorage
    const draftData = { ...formData, enableNewsletter };
    localStorage.setItem('registrationDraft', JSON.stringify(draftData));
  }, [formData, validateForm, enableNewsletter]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    
    // Clear field-specific errors
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Real-time validation for current field
    const { errors, validation } = validateField(field, value);
    setFieldErrors(prev => ({ ...prev, ...errors }));
    setFieldValidation(prev => ({ ...prev, ...validation }));
  };

  // Format phone number
  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    let formatted = cleaned;
    
    if (cleaned.length > 3) {
      formatted = cleaned.slice(0, 3) + '-' + cleaned.slice(3);
    }
    if (cleaned.length > 6) {
      formatted = formatted.slice(0, 7) + '-' + formatted.slice(7);
    }
    
    return formatted.slice(0, 12); // Limit to XXX-XXX-XXXX format
  };

  // Handle phone input with formatting
  const handlePhoneChange = (value) => {
    const formatted = formatPhoneNumber(value);
    handleInputChange('phone', formatted);
  };

  // Send email verification
  const handleEmailVerification = async () => {
    if (!fieldValidation.email) return;
    
    try {
      setLoading(true);
      await verifyEmail(formData.email);
      setEmailVerificationSent(true);
      setError('');
    } catch (err) {
      setError('Failed to send verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Send phone verification
  const handlePhoneVerification = async () => {
    if (!fieldValidation.phone) return;
    
    try {
      setLoading(true);
      await verifyPhone(formData.phone);
      setPhoneVerificationSent(true);
      setError('');
    } catch (err) {
      setError('Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle step navigation
  const handleNext = () => {
    if (activeStep < STEPS.length - 1) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  // Handle registration with enhanced security
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isBlocked) {
      setError(`Registration is temporarily blocked. Please try again in ${formatTimeRemaining(blockTimeRemaining)}.`);
      return;
    }

    if (!validateForm()) {
      setError('Please fix all errors before submitting');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('Submitting enhanced registration form...');
      
      const registrationData = {
        ...formData,
        phone: formData.phone.replace(/\D/g, ''), // Clean phone number
        preferences: {
          newsletter: enableNewsletter,
          emailVerified,
          phoneVerified
        }
      };

      const success = await register(
        registrationData.name,
        registrationData.email,
        registrationData.phone,
        registrationData.password,
        registrationData.preferences
      );
      
      if (success) {
        // Clear stored data on success
        localStorage.removeItem('registrationDraft');
        localStorage.removeItem('registrationBlocked');
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error('Registration error:', err);
      
      // Handle registration attempts
      setRegistrationAttempts(prev => {
        const newAttempts = prev + 1;
        
        if (newAttempts >= MAX_REGISTRATION_ATTEMPTS) {
          setIsBlocked(true);
          setBlockTimeRemaining(BLOCK_DURATION / 1000);
          
          localStorage.setItem('registrationBlocked', JSON.stringify({
            timestamp: Date.now(),
            attempts: newAttempts
          }));
          
          startBlockTimer();
          setError(`Too many registration attempts. Please try again in ${Math.ceil(BLOCK_DURATION / 60000)} minutes.`);
        } else {
          setError(`${err.message || 'Registration failed. Please try again.'} (${newAttempts}/${MAX_REGISTRATION_ATTEMPTS} attempts)`);
        }
        
        return newAttempts;
      });
    } finally {
      setLoading(false);
    }
  };

  // Format time remaining
  const formatTimeRemaining = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get password strength color
  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'error';
    if (passwordStrength <= 3) return 'warning';
    return 'success';
  };

  // Get password strength text
  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Fair';
    if (passwordStrength <= 4) return 'Good';
    return 'Strong';
  };

  // Render step content
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Full Name"
              name="name"
              autoComplete="name"
              autoFocus
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={loading || isBlocked}
              error={!!fieldErrors.name}
              helperText={fieldErrors.name}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color={fieldValidation.name ? 'success' : 'disabled'} />
                  </InputAdornment>
                ),
                endAdornment: fieldValidation.name && (
                  <InputAdornment position="end">
                    <CheckCircleIcon color="success" />
                  </InputAdornment>
                )
              }}
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={loading || isBlocked}
              error={!!fieldErrors.email}
              helperText={fieldErrors.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color={fieldValidation.email ? 'success' : 'disabled'} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {fieldValidation.email && (
                      <Tooltip title="Send verification email">
                        <IconButton
                          onClick={handleEmailVerification}
                          disabled={loading || emailVerificationSent}
                          size="small"
                        >
                          {emailVerified ? (
                            <VerifiedUserIcon color="success" />
                          ) : (
                            <EmailIcon color="primary" />
                          )}
                        </IconButton>
                      </Tooltip>
                    )}
                  </InputAdornment>
                )
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="phone"
              label="Phone Number"
              name="phone"
              autoComplete="tel"
              value={formData.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              disabled={loading || isBlocked}
              error={!!fieldErrors.phone}
              helperText={fieldErrors.phone || 'Format: XXX-XXX-XXXX'}
              placeholder="XXX-XXX-XXXX"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon color={fieldValidation.phone ? 'success' : 'disabled'} />
                  </InputAdornment>
                ),
                endAdornment: formData.phone && (
                  <InputAdornment position="end">
                    {fieldValidation.phone && (
                      <Tooltip title="Send verification code">
                        <IconButton
                          onClick={handlePhoneVerification}
                          disabled={loading || phoneVerificationSent}
                          size="small"
                        >
                          {phoneVerified ? (
                            <VerifiedUserIcon color="success" />
                          ) : (
                            <PhoneIcon color="primary" />
                          )}
                        </IconButton>
                      </Tooltip>
                    )}
                  </InputAdornment>
                )
              }}
            />
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              ref={passwordRef}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              disabled={loading || isBlocked}
              error={!!fieldErrors.password}
              helperText={fieldErrors.password}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color={fieldValidation.password ? 'success' : 'disabled'} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading || isBlocked}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            {formData.password && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Password Strength: {getPasswordStrengthText()}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(passwordStrength / 5) * 100}
                  color={getPasswordStrengthColor()}
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(PASSWORD_CRITERIA).map(([key, criterion]) => (
                    <Chip
                      key={key}
                      label={criterion.label}
                      size="small"
                      color={passwordCriteria[key] ? 'success' : 'default'}
                      icon={passwordCriteria[key] ? <CheckCircleIcon /> : <ErrorIcon />}
                    />
                  ))}
                </Box>
              </Box>
            )}
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              disabled={loading || isBlocked}
              error={!!fieldErrors.confirmPassword}
              helperText={fieldErrors.confirmPassword}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color={fieldValidation.confirmPassword ? 'success' : 'disabled'} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading || isBlocked}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
        );

      case 3:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Review & Agreements
            </Typography>
            
            <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Typography variant="body2" gutterBottom>
                <strong>Name:</strong> {formData.name}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Email:</strong> {formData.email}
                {emailVerified && <VerifiedUserIcon color="success" sx={{ ml: 1, fontSize: 16 }} />}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Phone:</strong> {formData.phone}
                {phoneVerified && <VerifiedUserIcon color="success" sx={{ ml: 1, fontSize: 16 }} />}
              </Typography>
            </Paper>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  disabled={loading || isBlocked}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2">
                  I agree to the{' '}
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setShowTermsDialog(true)}
                  >
                    Terms and Conditions
                  </Button>
                </Typography>
              }
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreedToPrivacy}
                  onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                  disabled={loading || isBlocked}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2">
                  I agree to the{' '}
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setShowPrivacyDialog(true)}
                  >
                    Privacy Policy
                  </Button>
                </Typography>
              }
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={enableNewsletter}
                  onChange={(e) => setEnableNewsletter(e.target.checked)}
                  disabled={loading || isBlocked}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2">
                  Subscribe to our newsletter for updates and tips
                </Typography>
              }
            />
            
            {(fieldErrors.terms || fieldErrors.privacy) && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {fieldErrors.terms || fieldErrors.privacy}
              </Alert>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950">
      <div className="w-full max-w-2xl my-8">
        <Paper elevation={0} className="card-glass p-8">
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <ChatIcon fontSize="large" />
            </div>
            
            <Typography component="h1" variant="h4" color="primary" className="font-display font-bold" gutterBottom>
              Modern Chat
            </Typography>
            <Typography component="h2" variant="h5" className="mb-2 font-display" gutterBottom>
              Create Your Account
            </Typography>
            
            {/* Registration Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <SecurityIcon color="success" />
              <Typography variant="body2" color="text.secondary">
                Secure Registration Process
              </Typography>
            </Box>
            
            {isBlocked && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Registration temporarily blocked. Time remaining: {formatTimeRemaining(blockTimeRemaining)}
              </Alert>
            )}
          </div>

          {/* Error Display */}
          <Collapse in={!!error}>
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          </Collapse>

          {/* Registration Stepper */}
          <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 4 }}>
            {STEPS.map((label, index) => (
              <Step key={label}>
                <StepLabel
                  optional={
                    index === 1 ? (
                      <Typography variant="caption">Phone verification optional</Typography>
                    ) : null
                  }
                >
                  {label}
                </StepLabel>
                <StepContent>
                  {renderStepContent(index)}
                  
                  <Box sx={{ mb: 2, mt: 2 }}>
                    <div>
                      {index === STEPS.length - 1 ? (
                        <Button
                          variant="contained"
                          onClick={handleSubmit}
                          disabled={loading || isBlocked || !isFormValid}
                          startIcon={loading ? <CircularProgress size={20} /> : <PersonAddIcon />}
                          sx={{ mt: 1, mr: 1 }}
                        >
                          {loading ? 'Creating Account...' : 'Create Account'}
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          onClick={handleNext}
                          disabled={loading || isBlocked}
                          sx={{ mt: 1, mr: 1 }}
                        >
                          Continue
                        </Button>
                      )}
                      <Button
                        disabled={index === 0 || loading || isBlocked}
                        onClick={handleBack}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        Back
                      </Button>
                    </div>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>

          {/* Advanced Options */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="text"
              size="small"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              startIcon={<InfoIcon />}
            >
              {showAdvancedOptions ? 'Hide' : 'Show'} Registration Details
            </Button>
          </Box>

          <Collapse in={showAdvancedOptions}>
          <Paper elevation={0} sx={{ p: 3, mt: 2, bgcolor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom>
                Registration Information
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Registration Attempts
                  </Typography>
                  <Typography variant="body1">
                    {registrationAttempts}/{MAX_REGISTRATION_ATTEMPTS}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Typography variant="body1">
                    {isBlocked ? 'Blocked' : 'Active'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SecurityIcon color="primary" />
                <Typography variant="body2">
                  Your data is encrypted and secure
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PolicyIcon color="primary" />
                <Typography variant="body2">
                  GDPR compliant data processing
                </Typography>
              </Box>
            </Paper>
          </Collapse>

          <Divider sx={{ my: 3 }} />

          {/* Footer */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Already have an account?{' '}
              <Link
                component={Link}
                to="/login"
                variant="body2"
                sx={{ textDecoration: 'none', fontWeight: 'medium' }}
              >
                Sign in here
              </Link>
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              By creating an account, you agree to our data processing practices
            </Typography>
          </Box>
        </Paper>
      </div>

      {/* Privacy Policy Dialog */}
      <Dialog
        open={showPrivacyDialog}
        onClose={() => setShowPrivacyDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PolicyIcon />
            Privacy Policy
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            <strong>Data Collection:</strong> We collect only the information necessary to provide our services, including your name, email address, and optionally your phone number.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Data Usage:</strong> Your personal information is used to create and manage your account, provide customer support, and send important service notifications.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Data Protection:</strong> We implement industry-standard security measures to protect your data, including encryption and secure storage practices.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Third Parties:</strong> We do not sell, rent, or share your personal information with third parties without your explicit consent.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Your Rights:</strong> You have the right to access, modify, or delete your personal information at any time through your account settings.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Contact:</strong> If you have any questions about our privacy practices, please contact us at privacy@modernchat.com
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPrivacyDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Terms and Conditions Dialog */}
      <Dialog
        open={showTermsDialog}
        onClose={() => setShowTermsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon />
            Terms and Conditions
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            <strong>Acceptance of Terms:</strong> By creating an account, you agree to abide by these terms and conditions.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Service Usage:</strong> You agree to use our service responsibly and in compliance with applicable laws and regulations.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Account Security:</strong> You are responsible for maintaining the security of your account credentials and for all activities that occur under your account.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Prohibited Activities:</strong> You may not use our service for illegal activities, spam, harassment, or any form of abuse.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Service Availability:</strong> While we strive for maximum uptime, we cannot guarantee uninterrupted service availability.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Account Termination:</strong> We reserve the right to suspend or terminate accounts that violate these terms.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Changes to Terms:</strong> We may update these terms from time to time. Continued use of the service constitutes acceptance of updated terms.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTermsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Register;