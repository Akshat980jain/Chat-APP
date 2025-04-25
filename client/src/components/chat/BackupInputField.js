import React from 'react';
import { Box, TextField, Button, Paper } from '@mui/material';

const BackupInputField = ({ 
  value, 
  onChange, 
  onSend, 
  placeholder = "Type message here if the main input is not working..." 
}) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <Box 
      sx={{ 
        position: 'fixed',
        bottom: '70px',
        right: '20px',
        zIndex: 1200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
      }}
      className="backup-input-container"
    >
      <Paper 
        sx={{ 
          p: 2, 
          mb: 1, 
          display: 'flex',
          alignItems: 'center',
          boxShadow: 3,
        }}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
      >
        <TextField
          size="small"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyPress={handleKeyPress}
          sx={{ mr: 1 }}
        />
        <Button 
          variant="contained" 
          color="primary"
          onClick={onSend}
          disabled={!value.trim()}
        >
          Send
        </Button>
      </Paper>
    </Box>
  );
};

export default BackupInputField; 