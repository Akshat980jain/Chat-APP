import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, TextField, IconButton, InputAdornment } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import MicIcon from '@mui/icons-material/Mic';

const MessageInput = ({ 
  onSend, 
  isMobile = false, 
  value = '', 
  onChange, 
  disabled = false, 
  placeholder = "Type a message...",
  maxLength = 2000,
  onEmojiClick,
  onAttachFile,
  onMicClick,
  showEmojiButton = true,
  showAttachButton = true,
  showMicButton = true,
  autoFocus = false
}) => {
  const [bottomOffset, setBottomOffset] = useState(0);
  const [chatColumnWidth, setChatColumnWidth] = useState('100%');
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef(null);
  
  // Memoized resize handler
  const handleResize = useCallback(() => {
    const width = window.innerWidth;
    
    if (width > 1200) {
      setChatColumnWidth('calc(100% - 320px)');
    } else if (width > 768) {
      setChatColumnWidth('calc(100% - 280px)');
    } else {
      setChatColumnWidth('100%');
    }
  }, []);
  
  // Handle window resize and detect iOS for proper positioning
  useEffect(() => {
    // Check if device is iOS for safe area insets
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    let offset = 0;
    
    if (isIOS) {
      offset += 20; // iOS safe area
      document.body.classList.add('ios-device');
    }
    
    // Add bottom padding on small screens for the mobile nav bar
    if (isMobile && window.innerWidth <= 780) {
      offset += 56; // Standard BottomNavigation height
    }
    
    setBottomOffset(offset);
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (isIOS) {
        document.body.classList.remove('ios-device');
      }
    };
  }, [isMobile, handleResize]);
  
  // Auto-focus effect
  useEffect(() => {
    if (autoFocus && inputRef.current && !isMobile) {
      inputRef.current.focus();
    }
  }, [autoFocus, isMobile]);
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  const handleSubmit = useCallback(() => {
    if (!value || value.trim() === '' || disabled) return;
    
    const trimmedValue = value.trim();
    if (trimmedValue.length > maxLength) {
      console.warn(`Message exceeds maximum length of ${maxLength} characters`);
      return;
    }
    
    onSend(trimmedValue);
    
    // Focus the input after sending (with slight delay for mobile)
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, isMobile ? 100 : 0);
  }, [value, disabled, maxLength, onSend, isMobile]);
  
  const handleInputChange = useCallback((e) => {
    if (!onChange) return;
    
    const eventValue = e?.target?.value ?? e?.value ?? '';
    
    // Enforce max length
    if (eventValue.length > maxLength) {
      return;
    }
    
    // Create a standardized event object
    const syntheticEvent = {
      target: { value: eventValue },
      preventDefault: () => {},
      stopPropagation: () => {}
    };
    
    onChange(syntheticEvent);
  }, [onChange, maxLength]);
  
  const handleCompositionStart = () => {
    setIsComposing(true);
  };
  
  const handleCompositionEnd = () => {
    setIsComposing(false);
  };
  
  const handleFocus = () => {
    // Mobile browsers sometimes need a timeout to properly focus
    if (isMobile) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };
  
  const remainingChars = maxLength - value.length;
  const isNearLimit = remainingChars <= 100;
  const hasContent = value && value.trim();
  
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
            <form 
              onSubmit={(e) => { 
                e.preventDefault(); 
                handleSubmit(); 
              }} 
              className="d-flex align-items-center"
            >
              <TextField
                inputRef={inputRef}
                className="message-input"
                placeholder={placeholder}
                variant="outlined"
                value={value}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                onFocus={handleFocus}
                fullWidth
                autoComplete="off"
                multiline
                maxRows={4}
                disabled={disabled}
                error={remainingChars < 0}
                helperText={
                  isNearLimit && remainingChars >= 0 
                    ? `${remainingChars} characters remaining` 
                    : remainingChars < 0 
                    ? `${Math.abs(remainingChars)} characters over limit`
                    : undefined
                }
                InputProps={{
                  startAdornment: showEmojiButton && (
                    <InputAdornment position="start">
                      <IconButton 
                        color="primary" 
                        size="small" 
                        disabled={disabled}
                        onClick={onEmojiClick}
                        aria-label="Add emoji"
                      >
                        <EmojiEmotionsIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      {showAttachButton && (
                        <IconButton 
                          color="primary" 
                          size="small" 
                          disabled={disabled}
                          onClick={onAttachFile}
                          aria-label="Attach file"
                        >
                          <AttachFileIcon />
                        </IconButton>
                      )}
                      {showMicButton && !hasContent && (
                        <IconButton 
                          color="primary" 
                          size="small" 
                          disabled={disabled}
                          onClick={onMicClick}
                          aria-label="Voice message"
                        >
                          <MicIcon />
                        </IconButton>
                      )}
                    </InputAdornment>
                  )
                }}
              />
              {hasContent && (
                <IconButton 
                  color="primary" 
                  onClick={handleSubmit}
                  disabled={disabled || remainingChars < 0}
                  aria-label="Send message"
                  sx={{ 
                    ml: 1,
                    backgroundColor: disabled || remainingChars < 0 
                      ? 'rgba(0, 0, 0, 0.12)' 
                      : 'primary.main',
                    color: disabled || remainingChars < 0 
                      ? 'text.disabled' 
                      : 'white',
                    '&:hover': {
                      backgroundColor: disabled || remainingChars < 0 
                        ? 'rgba(0, 0, 0, 0.12)' 
                        : 'primary.dark',
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