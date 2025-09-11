import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, TextField, IconButton, InputAdornment, Tooltip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import MicIcon from '@mui/icons-material/Mic';
import { useSocket } from '../../contexts/SocketContext';

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
  autoFocus = false,
  className = ''
}) => {
  const [bottomOffset, setBottomOffset] = useState(0);
  const [isComposing, setIsComposing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const inputRef = useRef(null);
  const { isConnected, connectionState } = useSocket();
  
  // Optimized mobile positioning
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    let offset = 0;
    
    if (isIOS) {
      offset += 20;
      document.body.classList.add('ios-device');
    }
    
    if (isMobile && window.innerWidth <= 780) {
      offset += 56;
    }
    
    setBottomOffset(offset);

    return () => {
      if (isIOS) {
        document.body.classList.remove('ios-device');
      }
    };
  }, [isMobile]);
  
  // Optimized auto-focus
  useEffect(() => {
    if (autoFocus && inputRef.current && !isMobile) {
      const timer = setTimeout(() => {
        inputRef.current.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, isMobile]);
  
  // Optimized key press handler
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  // Optimized submit handler
  const handleSubmit = useCallback(() => {
    if (!value || value.trim() === '' || disabled || !isConnected) return;
    
    const trimmedValue = value.trim();
    if (trimmedValue.length > maxLength) {
      return;
    }
    
    onSend(trimmedValue);
    
    // Re-focus input after sending
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 50);
  }, [value, disabled, maxLength, onSend, isConnected]);
  
  // Optimized input change handler
  const handleInputChange = useCallback((e) => {
    if (!onChange) return;
    
    const eventValue = e?.target?.value ?? e?.value ?? '';
    
    if (eventValue.length > maxLength) {
      return;
    }
    
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
    setIsFocused(true);
  };
  
  const handleBlur = () => {
    setIsFocused(false);
  };
  
  const remainingChars = maxLength - value.length;
  const isNearLimit = remainingChars <= 100;
  const hasContent = value && value.trim();
  const canSend = hasContent && isConnected && !disabled && remainingChars >= 0;
  
  return (
    <Box
      className={`message-input-container ${className}`}
      sx={{
        position: isMobile ? 'relative' : 'sticky',
        bottom: 0,
        width: '100%',
        p: 2,
        pb: `${bottomOffset + 16}px`,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: isMobile ? 'none' : '1px solid rgba(229, 231, 235, 0.5)',
        transition: 'all 0.2s ease',
        '.dark &': {
          background: 'rgba(31, 41, 55, 0.9)',
          borderTopColor: 'rgba(75, 85, 99, 0.5)'
        }
      }}
    >
      <form 
        onSubmit={(e) => { 
          e.preventDefault(); 
          handleSubmit(); 
        }} 
        className="flex items-end gap-2 w-full"
      >
        <TextField
          inputRef={inputRef}
          placeholder={!isConnected ? "Connecting..." : placeholder}
          variant="outlined"
          value={value}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onFocus={handleFocus}
          onBlur={handleBlur}
          fullWidth
          autoComplete="off"
          multiline
          maxRows={4}
          size="small"
          disabled={disabled || !isConnected}
          error={remainingChars < 0}
          helperText={
            !isConnected ? `Status: ${connectionState}` :
            isNearLimit && remainingChars >= 0 ? `${remainingChars} characters remaining` : 
            remainingChars < 0 ? `${Math.abs(remainingChars)} characters over limit` : undefined
          }
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              backgroundColor: 'background.default',
              transition: 'all 0.2s ease',
              fontSize: isMobile ? '16px' : '0.9375rem', // Prevent zoom on iOS
              '&.Mui-focused': {
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)'
              }
            }
          }}
          InputProps={{
            startAdornment: showEmojiButton && (
              <InputAdornment position="start">
                <Tooltip title="Add emoji">
                  <IconButton 
                    color="primary" 
                    size="small" 
                    disabled={disabled || !isConnected}
                    onClick={onEmojiClick}
                    aria-label="Add emoji"
                  >
                    <EmojiEmotionsIcon />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {showAttachButton && (
                  <Tooltip title="Attach file">
                    <IconButton 
                      color="primary" 
                      size="small" 
                      disabled={disabled || !isConnected}
                      onClick={onAttachFile}
                      aria-label="Attach file"
                    >
                      <AttachFileIcon />
                    </IconButton>
                  </Tooltip>
                )}
                {showMicButton && !hasContent && (
                  <Tooltip title="Voice message">
                    <IconButton 
                      color="primary" 
                      size="small" 
                      disabled={disabled || !isConnected}
                      onClick={onMicClick}
                      aria-label="Voice message"
                    >
                      <MicIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </InputAdornment>
            )
          }}
        />
        
        {hasContent && (
          <Tooltip title={!isConnected ? "Not connected" : "Send message"}>
            <IconButton 
              color="primary" 
              onClick={handleSubmit}
              disabled={!canSend}
              aria-label="Send message"
              sx={{ 
                width: 48,
                height: 48,
                background: !canSend
                  ? 'rgba(0, 0, 0, 0.12)' 
                  : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                boxShadow: canSend ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  background: !canSend
                    ? 'rgba(0, 0, 0, 0.12)' 
                    : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  transform: canSend ? 'translateY(-2px) scale(1.05)' : 'none',
                  boxShadow: canSend ? '0 8px 20px rgba(59, 130, 246, 0.4)' : 'none'
                },
                '&:active': {
                  transform: canSend ? 'translateY(0) scale(0.95)' : 'none'
                }
              }}
            >
              <SendIcon sx={{ fontSize: '1.25rem' }} />
            </IconButton>
          </Tooltip>
        )}
      </form>
    </Box>
  );
};

export default MessageInput;