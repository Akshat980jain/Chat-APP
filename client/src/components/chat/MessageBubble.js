import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import ProfilePicture from '../profile/ProfilePicture';

const MessageBubble = ({ 
  message, 
  isOwn, 
  showAvatar = true,
  showStatus = true,
  isPending = false
}) => {
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  
  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      // If the message is from today, just show the time
      if (new Date().toDateString() === date.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      // Otherwise show relative time like "2 days ago"
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      console.error('Error formatting time:', e);
      return '';
    }
  };
  
  // Handle long press for context menu on mobile
  const handleLongPress = (e) => {
    e.preventDefault();
    setIsContextMenuOpen(true);
  };
  
  // Status indicators
  const getStatusIndicator = () => {
    if (!showStatus) return null;
    
    if (isPending) {
      return <i className="bi bi-clock text-muted small ms-1"></i>;
    }
    
    switch (message.status) {
      case 'sent':
        return <i className="bi bi-check text-muted small ms-1"></i>;
      case 'delivered':
        return <i className="bi bi-check2 text-muted small ms-1"></i>;
      case 'read':
        return <i className="bi bi-check2-all text-primary small ms-1"></i>;
      default:
        return null;
    }
  };
  
  return (
    <div className={`row message-row ${isOwn ? 'justify-content-end' : 'justify-content-start'} mb-0`}>
      {/* Avatar for other user's messages */}
      {!isOwn && showAvatar && (
        <div className="col-auto p-0">
          <ProfilePicture userId={message.sender} size="xs" />
        </div>
      )}
      
      <div className="col-auto px-0" style={{maxWidth: '80%'}}>
        <div 
          className={`message-bubble p-1 ${isOwn ? 'bg-primary text-white' : 'bg-light'} rounded-2 shadow-sm`}
          onContextMenu={handleLongPress}
        >
          {/* Message content */}
          <div className="message-content" style={{fontSize: '0.85rem', lineHeight: '1.2'}}>
            {message.content}
          </div>
          
          {/* Time and status */}
          <div className={`message-meta d-flex align-items-center justify-content-end ${isOwn ? 'text-white-50' : 'text-muted'}`}>
            <small className="message-time me-1" style={{fontSize: '0.6rem'}}>
              {formatTime(message.timestamp)}
            </small>
            {isOwn && getStatusIndicator()}
          </div>
        </div>
      </div>
      
      {/* Context menu */}
      {isContextMenuOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{zIndex: 1050}}
          onClick={() => setIsContextMenuOpen(false)}
        >
          <div 
            className="position-absolute bg-white shadow-lg rounded-3 py-1"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80%',
              maxWidth: '240px'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button className="dropdown-item d-flex align-items-center py-1">
              <i className="bi bi-reply me-2"></i>
              Reply
            </button>
            <button className="dropdown-item d-flex align-items-center py-1">
              <i className="bi bi-forward me-2"></i>
              Forward
            </button>
            <button className="dropdown-item d-flex align-items-center py-1">
              <i className="bi bi-clipboard me-2"></i>
              Copy
            </button>
            <div className="dropdown-divider my-1"></div>
            <button className="dropdown-item d-flex align-items-center text-danger py-1">
              <i className="bi bi-trash me-2"></i>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageBubble; 