import React from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';

// Create dot animation keyframes
const bounce = keyframes`
  0%, 80%, 100% { 
    transform: translateY(0);
  }
  40% { 
    transform: translateY(-5px);
  }
`;

const TypingIndicator = ({ senderName }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        padding: 1,
        borderRadius: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        width: 'fit-content',
        maxWidth: '120px'
      }}
    >
      {senderName && (
        <Typography variant="body2" color="text.secondary" sx={{ mr: 1, fontSize: '0.75rem' }}>
          {senderName}
        </Typography>
      )}
      
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {[0, 1, 2].map((index) => (
          <Box
            key={index}
            component="span"
            sx={{
              width: '6px',
              height: '6px',
              margin: '0 2px',
              borderRadius: '50%',
              backgroundColor: 'grey.500',
              display: 'inline-block',
              animation: `${bounce} 1.4s ease-in-out ${index * 0.16}s infinite both`,
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default TypingIndicator; 