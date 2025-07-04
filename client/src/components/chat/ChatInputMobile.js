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
    <div className="chat-input-mobile">
      {error && (
        <div className="alert alert-danger alert-dismissible fade show mb-2" role="alert">
          <small>{error}</small>
          <button 
            type="button" 
            className="btn-close btn-close-sm" 
            aria-label="Close"
            onClick={() => setError('')}
          ></button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="d-flex align-items-center w-100">
        <div className="input-group w-100">
          <input
            type="text"
            className={`form-control ${error ? 'is-invalid' : ''}`}
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
          />
          
          <button 
            type="submit"
            className={`btn ms-2 ${hasContent ? 'btn-primary' : 'btn-outline-primary'}`}
            disabled={!hasContent || isSending || disabled || remainingChars < 0 || !isConnected}
            aria-label="Send message"
            title={!isConnected ? 'Not connected' : 'Send message'}
          >
            {isSending ? (
              <div className="spinner-border spinner-border-sm text-light" role="status">
                <span className="visually-hidden">Sending...</span>
              </div>
            ) : (
              <i className="bi bi-send-fill"></i>
            )}
          </button>
        </div>
      </form>
      
      {showCharCount && (
        <div className="d-flex justify-content-between align-items-center mt-1">
          <small className="text-muted">
            {!isConnected && (
              <span className="text-warning">
                <i className="bi bi-exclamation-triangle-fill me-1"></i>
                Not connected
              </span>
            )}
          </small>
          <small 
            id="char-count"
            className={`text-muted ${isNearLimit ? 'text-warning' : ''} ${remainingChars < 0 ? 'text-danger' : ''}`}
          >
            {remainingChars} characters remaining
          </small>
        </div>
      )}
    </div>
  );
};

export default ChatInputMobile;