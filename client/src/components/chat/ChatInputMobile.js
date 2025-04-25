import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

const ChatInputMobile = ({ chatId, recipientId, onMessageSent }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { user } = useAuth();
  const { socket } = useSocket();
  const inputRef = useRef(null);

  // Focus input on mount and when recipient changes
  useEffect(() => {
    if (inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 300);
    }
  }, [chatId, recipientId]);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    // Typing indicator logic could go here
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!message.trim() || !socket || isSending) return;
    
    const trimmedMessage = message.trim();
    setIsSending(true);
    
    // Create a unique message ID for tracking
    const tempId = `temp-${Date.now()}`;
    const messageId = `msg-${Date.now()}`;
    
    const messageData = {
      tempId,
      messageId,
      chatId,
      recipientId,
      senderId: user._id,
      content: trimmedMessage,
      timestamp: new Date().toISOString(),
      status: 'sending',
      sender: user // Include full sender info
    };
    
    // Debug log
    console.log('Sending message data:', messageData);
    
    // Send message via socket
    socket.emit('send_message', messageData);
    
    // Provide optimistic UI update via callback
    if (onMessageSent) {
      onMessageSent(messageData);
    }
    
    // Clear input and reset state
    setMessage('');
    setIsSending(false);
    
    // Return focus to input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="chat-input-mobile">
      <form onSubmit={handleSubmit} className="d-flex align-items-center w-100">
        <div className="input-group w-100">
          <input
            type="text"
            className="form-control"
            placeholder="Type a message..."
            value={message}
            onChange={handleInputChange}
            disabled={isSending}
            ref={inputRef}
            aria-label="Message input"
            autoComplete="off"
          />
          <button 
            type="submit"
            className="btn btn-primary ms-2"
            disabled={!message.trim() || isSending}
            aria-label="Send message"
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
    </div>
  );
};

export default ChatInputMobile; 