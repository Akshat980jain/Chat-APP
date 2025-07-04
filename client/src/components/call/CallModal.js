import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  Box,
  CircularProgress,
} from '@mui/material';
import CallEndIcon from '@mui/icons-material/CallEnd';
import VideocamIcon from '@mui/icons-material/Videocam';
import MicOffIcon from '@mui/icons-material/MicOff';
import MicIcon from '@mui/icons-material/Mic';
import ProfilePicture from '../profile/ProfilePicture';

const CallModal = ({
  open,
  onClose,
  caller = {},
  isIncoming = false,
  onAccept,
  onReject,
  callStatus = 'connecting', // 'connecting', 'ongoing', 'ended', 'rejected', 'error'
  timer = 0,
  localStream,
  remoteStream,
  isMuted = false,
  isVideoEnabled = true,
  onToggleMute,
  onToggleVideo,
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {isIncoming ? 'Incoming Call' : 'Calling...'}
      </DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <ProfilePicture
            name={caller.name}
            imageUrl={caller.profilePicture}
            isOnline={caller.isOnline}
            size={64}
          />
          <Typography variant="h6">{caller.name || 'Unknown'}</Typography>
          <Typography variant="body2" color="textSecondary">
            {callStatus === 'ongoing'
              ? `Call in progress (${formatTime(timer)})`
              : callStatus.charAt(0).toUpperCase() + callStatus.slice(1)}
          </Typography>
          <Box display="flex" gap={2} mt={2} position="relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{
                width: 180,
                height: 120,
                background: '#000',
                borderRadius: 8,
              }}
            />
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: 80,
                height: 60,
                background: '#222',
                borderRadius: 8,
                position: 'absolute',
                right: 16,
                bottom: 16,
                border: '2px solid #fff',
              }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', gap: 2 }}>
        <IconButton
          color={isMuted ? 'error' : 'primary'}
          onClick={onToggleMute}
        >
          {isMuted ? <MicOffIcon /> : <MicIcon />}
        </IconButton>
        <IconButton
          color={isVideoEnabled ? 'primary' : 'default'}
          onClick={onToggleVideo}
        >
          <VideocamIcon />
        </IconButton>
        <IconButton color="error" onClick={onReject}>
          <CallEndIcon />
        </IconButton>
        {isIncoming && (
          <Button variant="contained" color="success" onClick={onAccept}>
            Accept
          </Button>
        )}
      </DialogActions>
      {callStatus === 'connecting' && (
        <Box display="flex" justifyContent="center" p={2}>
          <CircularProgress />
        </Box>
      )}
    </Dialog>
  );
};

export default CallModal; 