import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import ProfilePicture from '../profile/ProfilePicture';

const MessageBubble = ({ 
  message, 
  isOwn, 
  showAvatar = true,
  showStatus = true,
  isPending = false,
  onReply,
  onEdit,
  onDelete,
  onStar
}) => {
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  
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
    <div 
      className={`row message-row ${isOwn ? 'justify-content-end' : 'justify-content-start'} mb-2`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar for other user's messages */}
      {!isOwn && showAvatar && (
        <div className="col-auto p-0 me-2">
          <ProfilePicture 
            userId={message.sender?._id} 
            name={message.sender?.name}
            imageUrl={message.sender?.profilePicture}
            size="sm" 
            showStatus={false}
          />
        </div>
      )}
      
      <div className="col-auto px-0 position-relative" style={{maxWidth: '75%'}}>
        <div 
          className={`message-bubble p-3 ${
            isOwn 
              ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md' 
              : 'bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700'
          } rounded-3 position-relative transition-all duration-200 hover:shadow-lg hover:-translate-y-1`}
          onContextMenu={handleLongPress}
          style={{
            borderBottomRightRadius: isOwn ? '0.375rem' : '1.5rem',
            borderBottomLeftRadius: isOwn ? '1.5rem' : '0.375rem',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
        >
          {/* Message content */}
          <div 
            className="message-content" 
            style={{
              fontSize: '0.9375rem', 
              lineHeight: '1.5',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap'
            }}
          >
            {message.content}
          </div>
          
          {/* Time and status */}
          <div className={`message-meta d-flex align-items-center justify-content-end mt-1 ${
            isOwn ? 'text-white' : 'text-muted'
          }`} style={{opacity: 0.8}}>
            <small className="message-time me-2" style={{fontSize: '0.6875rem', fontWeight: 500}}>
              {formatTime(message.timestamp)}
            </small>
            {isOwn && getStatusIndicator()}
          </div>
          
          {/* Message actions for desktop */}
          {showActions && !window.matchMedia('(max-width: 768px)').matches && (
            <div 
              className="position-absolute bg-white dark:bg-neutral-800 shadow-lg rounded-2 p-1 d-flex gap-1"
              style={{
                top: '-2.5rem',
                right: isOwn ? '0' : 'auto',
                left: isOwn ? 'auto' : '0',
                zIndex: 1000,
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(229, 231, 235, 0.5)',
                animation: 'slideUp 0.2s ease-out'
              }}
            >
              <button 
                className="btn btn-sm btn-outline-secondary border-0 p-1"
                onClick={() => onReply?.(message)}
                title="Reply"
              >
                <i className="bi bi-reply" style={{fontSize: '0.875rem'}}></i>
              </button>
              <button 
                className="btn btn-sm btn-outline-secondary border-0 p-1"
                onClick={() => {
                  setIsStarred(!isStarred);
                  onStar?.(message);
                }}
                title={isStarred ? "Unstar" : "Star"}
              >
                <i className={`bi ${isStarred ? 'bi-star-fill text-warning' : 'bi-star'}`} style={{fontSize: '0.875rem'}}></i>
              </button>
              {isOwn && (
                <button 
                  className="btn btn-sm btn-outline-secondary border-0 p-1"
                  onClick={() => onEdit?.(message)}
                  title="Edit"
                >
                  <i className="bi bi-pencil" style={{fontSize: '0.875rem'}}></i>
                </button>
              )}
              <button 
                className="btn btn-sm btn-outline-danger border-0 p-1"
                onClick={() => onDelete?.(message)}
                title="Delete"
              >
                <i className="bi bi-trash" style={{fontSize: '0.875rem'}}></i>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Context menu */}
      {isContextMenuOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-50"
          style={{zIndex: 1060, backdropFilter: 'blur(4px)'}}
          onClick={() => setIsContextMenuOpen(false)}
        >
          <div 
            className="position-absolute bg-white dark:bg-neutral-800 shadow-xl rounded-3 py-2 border border-neutral-200 dark:border-neutral-700"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '85%',
              maxWidth: '280px',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              animation: 'popIn 0.2s ease-out'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button 
              className="dropdown-item d-flex align-items-center py-2 px-3 border-0 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-2 transition-all"
              onClick={() => {
                onReply?.(message);
                setIsContextMenuOpen(false);
              }}
            >
              <i className="bi bi-reply me-3 text-primary"></i>
              Reply
            </button>
            <button 
              className="dropdown-item d-flex align-items-center py-2 px-3 border-0 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-2 transition-all"
              onClick={() => setIsContextMenuOpen(false)}
            >
              <i className="bi bi-forward me-3 text-info"></i>
              Forward
            </button>
            <button 
              className="dropdown-item d-flex align-items-center py-2 px-3 border-0 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-2 transition-all"
              onClick={() => {
                navigator.clipboard.writeText(message.content);
                setIsContextMenuOpen(false);
                // Could add a toast notification here
              }}
            >
              <i className="bi bi-clipboard me-3 text-success"></i>
              Copy
            </button>
            <button 
              className="dropdown-item d-flex align-items-center py-2 px-3 border-0 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-2 transition-all"
              onClick={() => {
                setIsStarred(!isStarred);
                onStar?.(message);
                setIsContextMenuOpen(false);
              }}
            >
              <i className={`bi ${isStarred ? 'bi-star-fill text-warning' : 'bi-star'} me-3`}></i>
              {isStarred ? 'Unstar' : 'Star'}
            </button>
            {isOwn && (
              <button 
                className="dropdown-item d-flex align-items-center py-2 px-3 border-0 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-2 transition-all"
                onClick={() => {
                  onEdit?.(message);
                  setIsContextMenuOpen(false);
                }}
              >
                <i className="bi bi-pencil me-3 text-info"></i>
                Edit
              </button>
            )}
            <div className="dropdown-divider my-2 opacity-20"></div>
            <button 
              className="dropdown-item d-flex align-items-center text-danger py-2 px-3 border-0 bg-transparent hover:bg-error-50 dark:hover:bg-error-900/20 rounded-2 transition-all"
              onClick={() => {
                onDelete?.(message);
                setIsContextMenuOpen(false);
              }}
            >
              <i className="bi bi-trash me-3"></i>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageBubble; 