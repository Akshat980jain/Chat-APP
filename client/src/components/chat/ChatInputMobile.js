import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

const ChatInputMobile = ({ 
  chatId, 
  recipientId, 
  onMessageSent, 
  onTyping,
  maxLength = 2000,
  placeholder = "Type a message...",
  disabled = false,
  showCharCount = false,
  autoFocus = true
}) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageQueueRef = useRef([]);

  // Focus input on mount and when recipient changes
  useEffect(() => {
    if (inputRef.current && autoFocus) {
      const timer = setTimeout(() => {
        inputRef.current.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [chatId, recipientId, autoFocus]);

  // Handle socket connection status
  useEffect(() => {
    if (isConnected && messageQueueRef.current.length > 0) {
      // Send queued messages when connection is restored
      messageQueueRef.current.forEach(queuedMessage => {
        socket.emit('send_message', queuedMessage);
      });
      messageQueueRef.current = [];
    }
  }, [isConnected, socket]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleTypingIndicator = useCallback(() => {
    if (!socket || !isConnected || !onTyping) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing_start', { chatId, recipientId });
      onTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing_stop', { chatId, recipientId });
      onTyping(false);
    }, 1000);
  }, [socket, isConnected, onTyping, chatId, recipientId, isTyping]);

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    
    // Enforce max length
    if (value.length > maxLength) {
      setError(`Message cannot exceed ${maxLength} characters`);
      return;
    }
    
    setMessage(value);
    setError('');
    
    // Handle typing indicator
    if (value.trim() && !disabled) {
      handleTypingIndicator();
    }
  }, [maxLength, disabled, handleTypingIndicator]);

  const generateMessageId = useCallback(() => {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!message.trim() || isSending || disabled) return;
    
    const trimmedMessage = message.trim();
    
    // Validate message
    if (trimmedMessage.length > maxLength) {
      setError(`Message cannot exceed ${maxLength} characters`);
      return;
    }
    
    if (!user || !chatId || !recipientId) {
      setError('Missing required information to send message');
      return;
    }
    
    setIsSending(true);
    setError('');
    
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      if (socket && isConnected) {
        socket.emit('typing_stop', { chatId, recipientId });
      }
      if (onTyping) {
        onTyping(false);
      }
    }
    
    // Create message data
    const tempId = `temp-${Date.now()}`;
    const messageId = generateMessageId();
    
    const messageData = {
      tempId,
      messageId,
      chatId,
      recipientId,
      senderId: user._id,
      content: trimmedMessage,
      timestamp: new Date().toISOString(),
      status: 'sending',
      sender: {
        _id: user._id,
        name: user.name,
        username: user.username,
        avatar: user.avatar
      },
      retryCount: retryCount
    };
    
    try {
      // Provide optimistic UI update
      if (onMessageSent) {
        onMessageSent(messageData);
      }
      
      if (socket && isConnected) {
        // Send message via socket
        socket.emit('send_message', messageData);
        
        // Set up timeout for message delivery confirmation
        const timeoutId = setTimeout(() => {
          if (retryCount < 3) {
            setRetryCount(prev => prev + 1);
            setError('Message failed to send. Retrying...');
            socket.emit('send_message', { ...messageData, retryCount: retryCount + 1 });
          } else {
            setError('Failed to send message. Please check your connection.');
          }
        }, 5000);
        
        // Listen for message confirmation
        const handleMessageConfirmation = (data) => {
          if (data.tempId === tempId) {
            clearTimeout(timeoutId);
            setRetryCount(0);
            socket.off('message_sent', handleMessageConfirmation);
          }
        };
        
        socket.on('message_sent', handleMessageConfirmation);
      } else {
        // Queue message for later sending
        messageQueueRef.current.push(messageData);
        setError('Connection lost. Message will be sent when reconnected.');
      }
      
      // Clear input
      setMessage('');
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
      
      // Return focus to input
      if (inputRef.current) {
        setTimeout(() => {
          inputRef.current.focus();
        }, 100);
      }
    }
  }, [
    message, 
    isSending, 
    disabled, 
    maxLength, 
    user, 
    chatId, 
    recipientId, 
    socket, 
    isConnected, 
    onMessageSent, 
    onTyping, 
    isTyping, 
    retryCount, 
    generateMessageId
  ]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const remainingChars = maxLength - message.length;
  const isNearLimit = remainingChars <= 100;
  const hasContent = message.trim().length > 0;

  return (
    <div className="chat-input-mobile position-fixed bottom-0 start-0 end-0 bg-white dark:bg-neutral-800 border-top border-neutral-200 dark:border-neutral-700 shadow-lg p-3" style={{zIndex: 1050}}>
      {error && (
        <div className="alert alert-danger alert-dismissible fade show mb-3 border-0 rounded-3 shadow-sm" role="alert" style={{fontSize: '0.875rem'}}>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button 
            type="button" 
            className="btn-close btn-close-sm opacity-75" 
            aria-label="Close"
            onClick={() => setError('')}
          ></button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="d-flex align-items-center w-100">
        <div className="input-group w-100 shadow-sm">
          <input
            type="text"
            className={`form-control border-0 bg-neutral-100 dark:bg-neutral-700 rounded-start-pill px-4 py-3 ${error ? 'is-invalid' : ''}`}
            placeholder={placeholder}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={isSending || disabled}
            ref={inputRef}
            aria-label="Message input"
            aria-describedby={showCharCount ? "char-count" : undefined}
            autoComplete="off"
            maxLength={maxLength}
            style={{
              fontSize: '16px', // Prevent zoom on iOS
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)'
            }}
          />
          
          <button 
            type="submit"
            className={`btn rounded-end-pill px-4 shadow-sm transition-all duration-200 ${
              hasContent 
                ? 'btn-primary bg-gradient-to-r from-primary-500 to-primary-600 border-0' 
                : 'btn-outline-primary border-0 bg-neutral-100 dark:bg-neutral-700'
            }`}
            disabled={!hasContent || isSending || disabled || remainingChars < 0 || !isConnected}
            aria-label="Send message"
            title={!isConnected ? 'Not connected' : 'Send message'}
            style={{
              minWidth: '60px',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isSending ? (
              <div className="spinner-border spinner-border-sm" role="status" style={{width: '1rem', height: '1rem'}}>
                <span className="visually-hidden">Sending...</span>
              </div>
            ) : (
              <i className="bi bi-send-fill" style={{fontSize: '1rem'}}></i>
            )}
          </button>
        </div>
      </form>
      
      {showCharCount && (
        <div className="d-flex justify-content-between align-items-center mt-2 px-1">
          <small className="text-muted d-flex align-items-center gap-1">
            {!isConnected && (
              <span className="text-warning d-flex align-items-center gap-1">
                <i className="bi bi-exclamation-triangle-fill me-1"></i>
                Not connected
              </span>
            )}
            {isConnected && (
              <span className="text-success d-flex align-items-center gap-1">
                <i className="bi bi-wifi me-1"></i>
                Connected
              </span>
            )}
          </small>
          <small 
            id="char-count"
            className={`font-medium ${
              remainingChars < 0 ? 'text-danger' : 
              isNearLimit ? 'text-warning' : 
              'text-muted'
            }`}
            style={{fontSize: '0.75rem'}}
          >
            {remainingChars} characters remaining
          </small>
        </div>
      )}
    </div>
  );
};

export default ChatInputMobile;