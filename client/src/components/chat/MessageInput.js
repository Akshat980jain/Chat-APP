import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, IconButton, InputAdornment } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import MicIcon from '@mui/icons-material/Mic';

const MessageInput = ({ 
  onSend, 
  isMobile, 
  value, 
  onChange, 
  disabled = false, 
  placeholder = "Type a message..." 
}) => {
  const [bottomOffset, setBottomOffset] = useState(0);
  const [chatColumnWidth, setChatColumnWidth] = useState('100%');
  const inputRef = useRef(null);
  
  // Handle window resize and detect iOS for proper positioning
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      // Adjust width based on screen size
      if (width > 1200) {
        setChatColumnWidth('calc(100% - 320px)'); // Sidebar width is 320px
      } else if (width > 768) {
        setChatColumnWidth('calc(100% - 280px)'); // Smaller sidebar on medium screens
      } else {
        setChatColumnWidth('100%'); // Full width on mobile
      }
    };
    
    // Check if device is iOS for safe area insets
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      // Add bottom padding for iOS safe area
      setBottomOffset(20);
      document.body.classList.add('ios-device');
    }
    
    // Add bottom padding on small screens for the mobile nav bar
    if (isMobile && window.innerWidth <= 780) {
      setBottomOffset(prev => prev + 56); // 56px is standard BottomNavigation height
    }
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  const handleSubmit = () => {
    if (!value || value.trim() === '' || disabled) return;
    
    onSend(value.trim());
    
    // Focus the input after sending
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Add this function to handle input changes properly
  const handleInputChange = (e) => {
    // Create a proper synthetic event object to pass to the parent onChange handler
    if (onChange) {
      // Support both direct string values and event objects
      if (typeof e === 'string') {
        onChange({
          target: { value: e },
          preventDefault: () => {},
          stopPropagation: () => {}
        });
      } 
      // Normal event object
      else if (e && e.target && e.target.value !== undefined) {
        onChange(e);
      }
      // Custom event object that might be missing properties
      else if (e && e.value !== undefined) {
        onChange({
          target: { value: e.value },
          preventDefault: () => {},
          stopPropagation: () => {}
        });
      }
      // Fallback for any other format
      else {
        console.warn('MessageInput: Received invalid input event format', e);
        // Try to extract a value or just use empty string
        const value = e?.toString?.() || '';
        onChange({
          target: { value },
          preventDefault: () => {},
          stopPropagation: () => {}
        });
      }
    }
  };
  
  return (
    <Box 
      className={`position-fixed bottom-0 py-2 px-3 ${isMobile ? 'w-100' : ''} bg-white dark:bg-gray-800 shadow-lg message-input-container`}
      sx={{
        width: isMobile ? '100%' : chatColumnWidth,
        zIndex: 1001,
        pb: `${bottomOffset}px`,
        transition: 'all 0.3s ease',
        right: 0,
        borderTop: '1px solid',
        borderColor: 'divider'
      }}
    >
      <div className="container-fluid p-0">
        <div className="row g-2 align-items-center">
          <div className="col">
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="d-flex align-items-center">
              <TextField
                inputRef={inputRef}
                className="message-input"
                placeholder={placeholder}
                variant="outlined"
                value={value}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                fullWidth
                autoComplete="off"
                multiline
                maxRows={4}
                disabled={disabled}
                onClick={() => {
                  // Ensure input is focused when clicked
                  if (inputRef.current) {
                    inputRef.current.focus();
                  }
                }}
                onFocus={() => {
                  // Mobile browsers sometimes need a timeout to properly focus
                  setTimeout(() => {
                    if (inputRef.current) {
                      inputRef.current.focus();
                    }
                  }, 100);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconButton color="primary" size="small" disabled={disabled}>
                        <EmojiEmotionsIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton color="primary" size="small" disabled={disabled}>
                        <AttachFileIcon />
                      </IconButton>
                      {(!value || !value.trim()) && (
                        <IconButton color="primary" size="small" disabled={disabled}>
                          <MicIcon />
                        </IconButton>
                      )}
                    </InputAdornment>
                  )
                }}
              />
              {value && value.trim() && (
                <IconButton 
                  color="primary" 
                  onClick={handleSubmit}
                  disabled={disabled}
                  sx={{ 
                    ml: 1,
                    backgroundColor: disabled ? 'rgba(0, 0, 0, 0.12)' : 'primary.main',
                    color: disabled ? 'text.disabled' : 'white',
                    '&:hover': {
                      backgroundColor: disabled ? 'rgba(0, 0, 0, 0.12)' : 'primary.dark',
                    }
                  }}
                >
                  <SendIcon />
                </IconButton>
              )}
            </form>
          </div>
        </div>
      </div>
    </Box>
  );
};

export default MessageInput; 