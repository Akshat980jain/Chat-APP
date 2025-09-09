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
        padding: 1.5,
        borderRadius: 3,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(229, 231, 235, 0.5)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        width: 'fit-content',
        maxWidth: '140px',
        animation: 'slideUp 0.3s ease-out',
        '.dark &': {
          background: 'rgba(31, 41, 55, 0.9)',
          borderColor: 'rgba(75, 85, 99, 0.5)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
        }
      }}
    >
      {senderName && (
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mr: 1.5, 
            fontSize: '0.75rem',
            fontWeight: 500,
            opacity: 0.8
          }}
        >
          {senderName}
        </Typography>
      )}
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {[0, 1, 2].map((index) => (
          <Box
            key={index}
            component="span"
            sx={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: 'primary.main',
              display: 'inline-block',
              animation: `${bounce} 1.2s ease-in-out ${index * 0.2}s infinite both`,
              opacity: 0.7,
              transition: 'all 0.2s ease'
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default TypingIndicator; 