import React from 'react';
import { Button } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const BackupSendButton = ({ onSend, disabled }) => {
  return (
    <Button
      variant="contained"
      color="primary"
      onClick={onSend}
      disabled={disabled}
      style={{
        minWidth: '40px',
        height: '40px',
        borderRadius: '20px',
        margin: '0 4px',
        padding: '0 12px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <SendIcon />
    </Button>
  );
};

export default BackupSendButton; 