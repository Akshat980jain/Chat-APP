import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogActions, Button, Typography, Avatar, Box } from '@mui/material';
import CallIcon from '@mui/icons-material/Call';
import CallEndIcon from '@mui/icons-material/CallEnd';
import VideocamIcon from '@mui/icons-material/Videocam';
import { styled } from '@mui/material/styles';
import { green, red } from '@mui/material/colors';

// Helper function to handle image URLs
const getImageUrl = (url) => {
  if (!url) return null;
  
  // If it's already a full URL, return it
  if (url.startsWith('http')) {
    return url;
  }
  
  // Otherwise, append the server URL
  return `http://192.168.28.6:5000${url}`;
};

// Styled components for the buttons
const AcceptButton = styled(Button)(({ theme }) => ({
  backgroundColor: green[500],
  '&:hover': {
    backgroundColor: green[700],
  },
  color: 'white',
  padding: theme.spacing(1, 2),
  borderRadius: 50,
}));

const RejectButton = styled(Button)(({ theme }) => ({
  backgroundColor: red[500],
  '&:hover': {
    backgroundColor: red[700],
  },
  color: 'white',
  padding: theme.spacing(1, 2),
  borderRadius: 50,
}));

const VideoButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#2196f3',
  '&:hover': {
    backgroundColor: '#1976d2',
  },
  color: 'white',
  padding: theme.spacing(1, 2),
  borderRadius: 50,
}));

const IncomingCallAlert = ({ open, caller, onAccept, onReject, onVideoAccept, ringtoneSrc = '/sounds/ringtone.mp3' }) => {
  const [ringtoneStarted, setRingtoneStarted] = useState(false);
  const audioRef = useRef(null);
  const [callTimer, setCallTimer] = useState(0);
  const timerRef = useRef(null);

  // Setup ringtone when alert opens
  useEffect(() => {
    if (open && caller && !ringtoneStarted) {
      // Create audio element for ringtone
      const audio = new Audio(ringtoneSrc);
      audio.loop = true;
      audio.volume = 0.7;
      
      // Store reference for cleanup
      audioRef.current = audio;
      
      // Start playing with error handling
      audio.play().catch(error => {
        console.error('Failed to play ringtone:', error);
        // Fallback to browser notification API if available
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Incoming Call', {
            body: `Incoming call from ${caller.name}`,
            icon: caller.profilePicture ? getImageUrl(caller.profilePicture) : null,
          });
        }
      });
      
      setRingtoneStarted(true);
      
      // Start a timer for auto-reject after 30 seconds
      setCallTimer(30);
      timerRef.current = setInterval(() => {
        setCallTimer(prev => {
          if (prev <= 1) {
            // Auto-reject call if not answered
            if (onReject) onReject();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    // Cleanup function
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      setRingtoneStarted(false);
      setCallTimer(0);
    };
  }, [open, caller, onReject, ringtoneStarted, ringtoneSrc]);
  
  // Handle accept call
  const handleAccept = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (onAccept) onAccept();
  };
  
  // Handle video accept call
  const handleVideoAccept = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (onVideoAccept) onVideoAccept();
  };
  
  // Handle reject call
  const handleReject = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (onReject) onReject();
  };

  if (!caller) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleReject}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        style: {
          borderRadius: 12,
          padding: 8,
          backgroundColor: '#1a1a2e',
          color: 'white'
        }
      }}
    >
      <DialogContent sx={{ textAlign: 'center', py: 3 }}>
        <Typography variant="h6" component="div" gutterBottom sx={{ color: '#e2e2e2' }}>
          Incoming {caller.callType === 'video' ? 'Video ' : ''}Call
        </Typography>
        
        <Box sx={{ position: 'relative', margin: '16px auto' }}>
          <Avatar 
            src={caller.profilePicture ? getImageUrl(caller.profilePicture) : null}
            alt={caller.name}
            sx={{ 
              width: 100, 
              height: 100, 
              margin: '0 auto',
              border: '3px solid #4CAF50',
              boxShadow: '0 0 15px rgba(76, 175, 80, 0.5)',
              animation: 'pulse 1.5s infinite'
            }}
          />
        </Box>
        
        <Typography variant="h5" component="div" gutterBottom>
          {caller.name}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ color: '#aaa' }}>
          Auto-reject in {callTimer} seconds
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
        <RejectButton 
          onClick={handleReject}
          variant="contained" 
          startIcon={<CallEndIcon />}
        >
          Decline
        </RejectButton>
        
        <AcceptButton 
          onClick={handleAccept}
          variant="contained" 
          startIcon={<CallIcon />}
        >
          Accept
        </AcceptButton>
        
        <VideoButton 
          onClick={handleVideoAccept}
          variant="contained" 
          startIcon={<VideocamIcon />}
        >
          Video
        </VideoButton>
      </DialogActions>
    </Dialog>
  );
};

export default IncomingCallAlert; 