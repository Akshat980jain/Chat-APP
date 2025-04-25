import React, { useState } from 'react';
import { Container, Box, IconButton, Avatar, Typography } from '@mui/material';
import { ArrowBackIcon } from '@mui/icons-material';

const Chat = () => {
  const [mobileView, setMobileView] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);

  const handleBackClick = () => {
    setSelectedChat(null);
  };

  return (
    <Container className="modern-chat-container" maxWidth={false} disableGutters>
      {/* Chat Sidebar */}
      <Box 
        className={`chat-sidebar ${mobileView && selectedChat ? 'hidden' : ''}`} 
        sx={{ width: { xs: '100%', md: '350px' } }}
      >
        {/* ... existing sidebar code ... */}
      </Box>

      {/* Chat Content Area */}
      <Box 
        className={`chat-content-area ${mobileView ? (selectedChat ? 'visible' : 'hidden') : ''}`}
        sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <Box className="chat-header" sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
              {mobileView && (
                <IconButton className="back-button" onClick={handleBackClick}>
                  <ArrowBackIcon />
                </IconButton>
              )}
              <Avatar src={selectedChat.profilePicture || '/default-avatar.png'} />
              <Box sx={{ ml: 2 }}>
                <Typography variant="h6">{selectedChat.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedChat.online ? 'Online' : selectedChat.lastSeen ? `Last seen ${formatTime(selectedChat.lastSeen)}` : 'Offline'}
                </Typography>
              </Box>
              {/* ... existing header actions ... */}
            </Box>

            {/* ... rest of the chat content ... */}
          </>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography variant="h6" color="textSecondary">Select a chat to start messaging</Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default Chat; 