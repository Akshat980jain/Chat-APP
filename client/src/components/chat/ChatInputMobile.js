import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { debounce } from 'lodash';

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
  
  const { user } = useAuth();
  const { socket, isConnected, emitEvent } = useSocket();
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Optimized focus handling
  useEffect(() => {
    if (inputRef.current && autoFocus) {
      const timer = setTimeout(() => {
        inputRef.current.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [chatId, recipientId, autoFocus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Optimized typing indicator with debouncing
  const handleTypingIndicator = useCallback(
    debounce(() => {
      if (!socket || !isConnected || !onTyping) return;

      if (!isTyping) {
        setIsTyping(true);
        emitEvent('typing_start', { chatId, recipientId });
        onTyping(true);
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        emitEvent('typing_end', { chatId, recipientId });
        onTyping(false);
      }, 1000);
    }, 300),
    [socket, isConnected, onTyping, chatId, recipientId, isTyping, emitEvent]
  );

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    
    if (value.length > maxLength) {
      setError(`Message cannot exceed ${maxLength} characters`);
      return;
    }
    
    setMessage(value);
    setError('');
    
    if (value.trim() && !disabled) {
      handleTypingIndicator();
    }
  }, [maxLength, disabled, handleTypingIndicator]);

  // Optimized message submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!message.trim() || isSending || disabled || !isConnected) return;
    
    const trimmedMessage = message.trim();
    
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
    
    if (isTyping) {
      setIsTyping(false);
      emitEvent('typing_end', { chatId, recipientId });
      onTyping?.(false);
    }
    
    const tempId = `temp-${Date.now()}`;
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
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
      }
    };
    
    try {
      onMessageSent?.(messageData);
      
      // Send via socket
      const success = emitEvent('send_message', messageData);
      
      if (!success) {
        setError('Connection lost. Please try again.');
        return;
      }
      
      setMessage('');
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
      
      if (inputRef.current) {
        setTimeout(() => {
          inputRef.current.focus();
        }, 50);
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
    isConnected, 
    onMessageSent, 
    onTyping, 
    isTyping, 
    emitEvent
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
    <div className="chat-input-mobile fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-xl border-t border-neutral-200 dark:border-neutral-700 shadow-lg p-3 z-50">
      {error && (
        <div className="bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-400 p-2 rounded-lg mb-2 text-sm flex items-center justify-between">
          <span className="flex items-center">
            <i className="bi bi-exclamation-triangle-fill mr-2"></i>
          {error}
          </span>
          <button
            onClick={() => setError('')}
            className="text-error-500 hover:text-error-700 ml-2"
          >
            <i className="bi bi-x"></i>
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex items-center w-full">
        <div className="flex w-full shadow-sm">
          <input
            type="text"
            className={`flex-1 border-0 bg-neutral-100 dark:bg-neutral-700 rounded-l-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
              error ? 'ring-2 ring-error-500' : ''
            }`}
            placeholder={placeholder}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={isSending || disabled}
            ref={inputRef}
            aria-label="Message input"
            autoComplete="off"
            maxLength={maxLength}
            style={{
              fontSize: '16px' // Prevent zoom on iOS
            }}
          />
          
          <button 
            type="submit"
            className={`rounded-r-full px-4 shadow-sm transition-all duration-200 ${
              hasContent 
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white border-0' 
                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 border-0'
            }`}
            disabled={!hasContent || isSending || disabled || !isConnected}
            aria-label="Send message"
            title={!isConnected ? 'Connecting...' : 'Send message'}
            style={{
              minWidth: '60px',
              height: '100%',
            }}
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white">
              </div>
            ) : (
              <i className="bi bi-send-fill text-base"></i>
            )}
          </button>
        </div>
      </form>
      
      {showCharCount && (
        <div className="flex justify-between items-center mt-2 px-1">
          <small className="text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
            {!isConnected && (
              <span className="text-warning-500 flex items-center gap-1">
                <i className="bi bi-wifi-off mr-1"></i>
                Connecting...
              </span>
            )}
            {isConnected && (
              <span className="text-success-500 flex items-center gap-1">
                <i className="bi bi-wifi mr-1"></i>
                Connected
              </span>
            )}
          </small>
          <small 
            className={`font-medium text-xs ${
              remainingChars < 0 ? 'text-error-500' : 
              isNearLimit ? 'text-warning-500' : 
              'text-neutral-500'
            }`}
          >
            {remainingChars} characters remaining
          </small>
        </div>
      )}
    </div>
  );
};

export default ChatInputMobile;