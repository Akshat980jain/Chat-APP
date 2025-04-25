import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  Box, 
  Typography, 
  IconButton, 
  Avatar,
  Grid,
  CircularProgress,
  useMediaQuery,
  useTheme
} from '@mui/material';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { useSocket } from '../../contexts/SocketContext';

// Define call statuses
const CALL_STATUS = {
  CONNECTING: 'connecting',
  ONGOING: 'ongoing',
  ENDED: 'ended',
  REJECTED: 'rejected',
  ERROR: 'error',
  UNANSWERED: 'unanswered'
};

const CallModal = ({ 
  open, 
  onClose, 
  callData = {}, 
  isIncoming = false,
  currentUser,
  socket: socketProp,
  emitEvent: emitEventProp
}) => {
  const { socket = socketProp, emitEvent = emitEventProp } = useSocket();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [callStatus, setCallStatus] = useState(isIncoming ? CALL_STATUS.CONNECTING : CALL_STATUS.CONNECTING);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const timerRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Get remote user info - ensure it's never null (wrapped in useMemo)
  const remoteUser = useMemo(() => callData?.caller || callData?.recipient || {}, [callData?.caller, callData?.recipient]);

  // Function to start the call timer
  const startTimer = () => {
    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
  };

  // Define handleEndCall with useCallback to avoid dependency issues
  const handleEndCall = useCallback(() => {
    if (remoteUser && remoteUser._id && currentUser) {
      emitEvent('call_ended', {
        to: remoteUser._id,
        from: currentUser.id
      });
      setCallStatus(CALL_STATUS.ENDED);
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  }, [remoteUser, currentUser, emitEvent, onClose]);

  useEffect(() => {
    if (open && callStatus === CALL_STATUS.ONGOING) {
      // Set up timer
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [open, callStatus]);

  useEffect(() => {
    if (!open) return;

    const setupPeerConnection = async () => {
      try {
        setCallStatus(CALL_STATUS.CONNECTING);
        
        // ICE servers configuration for NAT traversal
        const configuration = {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
          ]
        };
        
        // Create new peer connection with ICE servers
        const pc = new RTCPeerConnection(configuration);
        peerConnectionRef.current = pc;
        
        // Log connection state changes for debugging
        pc.onconnectionstatechange = (event) => {
          console.log('Connection state change:', pc.connectionState);
          if (pc.connectionState === 'connected') {
            console.log('WebRTC connection established successfully');
            setCallStatus(CALL_STATUS.ONGOING);
            startTimer();
          } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
            console.log('WebRTC connection closed or failed:', pc.connectionState);
            handleEndCall();
          }
        };
        
        // Log ICE connection state changes for debugging
        pc.oniceconnectionstatechange = (event) => {
          console.log('ICE connection state change:', pc.iceConnectionState);
          
          // Send debug info to server for troubleshooting
          socket.emit('webrtc_debug', {
            type: 'ice_state_change',
            state: pc.iceConnectionState
          });
        };
        
        // Handle ICE candidate events
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            console.log('Generated ICE candidate for', remoteUser._id);
            // Send the candidate to the remote peer
            emitEvent('ice_candidate', {
              to: remoteUser._id,
              from: currentUser.id,
              candidate: event.candidate,
            });
          } else {
            console.log('All ICE candidates have been generated');
          }
        };
        
        // Handle receiving tracks from remote peer
        pc.ontrack = (event) => {
          console.log('Received remote track');
          if (remoteVideoRef.current && event.streams && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };
        
        // Get local media stream with requested tracks
        const constraints = {
          audio: true,
          video: isVideoEnabled
        };
        
        console.log('Requesting user media with constraints:', constraints);
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        mediaStreamRef.current = stream;
        window.localStream = stream; // Save globally for cleanup
        
        // Display local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Add tracks to peer connection
        stream.getTracks().forEach(track => {
          console.log('Adding track to peer connection:', track.kind);
          pc.addTrack(track, stream);
        });
        
        if (!isIncoming) {
          // Create and send offer
          console.log('Creating offer as initiator');
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          
          console.log('Sending offer to', remoteUser._id);
          emitEvent('call_offer', {
            to: remoteUser._id,
            from: currentUser.id,
            offer: offer,
            callerName: currentUser.name
          });
        }
        
        return pc;
      } catch (error) {
        console.error('Error setting up peer connection:', error);
        setCallStatus(CALL_STATUS.ERROR);
        stopAllMediaTracks();
        return null;
      }
    };

    if (open) {
      setupPeerConnection();
    }

    // Socket event listeners for call signaling
    const handleCallAccepted = async (data) => {
      if (data && currentUser && remoteUser && remoteUser._id && 
          data.to === currentUser.id && data.from === remoteUser._id) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          setCallStatus(CALL_STATUS.ONGOING);
        } catch (error) {
          console.error('Error handling call accepted:', error);
          setCallStatus(CALL_STATUS.ERROR);
        }
      }
    };

    const handleCallRejected = (data) => {
      if (data && currentUser && remoteUser && remoteUser._id &&
          data.to === currentUser.id && data.from === remoteUser._id) {
        setCallStatus(CALL_STATUS.REJECTED);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    };

    const handleCallEnded = (data) => {
      if (data && currentUser && remoteUser && remoteUser._id &&
         ((data.to === currentUser.id && data.from === remoteUser._id) || 
          (data.from === currentUser.id && data.to === remoteUser._id))) {
        setCallStatus(CALL_STATUS.ENDED);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    };

    const handleIceCandidate = async (data) => {
      if (data && currentUser && remoteUser && remoteUser._id && peerConnectionRef.current &&
          data.to === currentUser.id && data.from === remoteUser._id) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    };

    const handleIncomingOffer = async (data) => {
      if (data && currentUser && remoteUser && remoteUser._id && 
          data.to === currentUser.id && data.from === remoteUser._id && isIncoming) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          
          emitEvent('call_answer', {
            to: remoteUser._id,
            from: currentUser.id,
            answer: peerConnectionRef.current.localDescription
          });
        } catch (error) {
          console.error('Error handling incoming offer:', error);
          setCallStatus(CALL_STATUS.ERROR);
        }
      }
    };

    // Set up socket event listeners
    if (socket) {
      socket.on('call_accepted', handleCallAccepted);
      socket.on('call_rejected', handleCallRejected);
      socket.on('call_ended', handleCallEnded);
      socket.on('ice_candidate', handleIceCandidate);
      socket.on('call_offer', handleIncomingOffer);
    }

    // Auto-end unanswered calls after 30 seconds
    const unansweredTimeout = setTimeout(() => {
      if (callStatus === CALL_STATUS.CONNECTING && !isIncoming && remoteUser && remoteUser._id) {
        setCallStatus(CALL_STATUS.UNANSWERED);
        emitEvent('call_ended', {
          to: remoteUser._id,
          from: currentUser?.id
        });
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    }, 30000);

    // Clean up function
    return () => {
      if (socket) {
        socket.off('call_accepted', handleCallAccepted);
        socket.off('call_rejected', handleCallRejected);
        socket.off('call_ended', handleCallEnded);
        socket.off('ice_candidate', handleIceCandidate);
        socket.off('call_offer', handleIncomingOffer);
      }
      
      clearTimeout(unansweredTimeout);
      
      // Clean up media streams
      if (mediaStreamRef.current) {
        console.log("Stopping all tracks in CallModal cleanup");
        const tracks = mediaStreamRef.current.getTracks();
        tracks.forEach(track => {
          console.log(`Stopping track: ${track.kind}`);
          track.stop();
        });
        mediaStreamRef.current = null;
      }
      
      // Also clear global reference
      if (window.localStream) {
        console.log("Stopping tracks from window.localStream in CallModal cleanup");
        window.localStream.getTracks().forEach(track => {
          track.stop();
        });
        window.localStream = null;
      }
      
      // Clean up peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };
  }, [open, isIncoming, currentUser, remoteUser, emitEvent, socket, isVideoEnabled, onClose, callStatus, handleEndCall]);

  const handleAcceptCall = () => {
    if (remoteUser && remoteUser._id && currentUser) {
      emitEvent('call_accepted', {
        to: remoteUser._id,
        from: currentUser.id
      });
    }
  };

  const handleRejectCall = () => {
    if (remoteUser && remoteUser._id && currentUser) {
      emitEvent('call_rejected', {
        to: remoteUser._id,
        from: currentUser.id
      });
      setCallStatus(CALL_STATUS.REJECTED);
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  const toggleMute = () => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleVideo = () => {
    if (mediaStreamRef.current) {
      const videoTracks = mediaStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  const toggleSpeaker = () => {
    // In a real application, you would need a more sophisticated
    // approach to switch audio output devices
    setIsSpeakerOn(!isSpeakerOn);
    
    // If we have access to remoteVideoRef audio output
    if (remoteVideoRef.current && 'sinkId' in remoteVideoRef.current) {
      // This is a placeholder - in a real app you would get available audio outputs
      // and switch between them
      console.log('Speaker toggled:', !isSpeakerOn);
    }
  };

  // Format elapsed time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status text based on call status
  const getStatusText = () => {
    switch (callStatus) {
      case CALL_STATUS.CONNECTING:
        return isIncoming ? 'Incoming call...' : 'Calling...';
      case CALL_STATUS.ONGOING:
        return formatTime(elapsedTime);
      case CALL_STATUS.ENDED:
        return 'Call ended';
      case CALL_STATUS.REJECTED:
        return 'Call rejected';
      case CALL_STATUS.UNANSWERED:
        return 'No answer';
      case CALL_STATUS.ERROR:
        return 'Call failed';
      default:
        return '';
    }
  };

  // Define a helper function to get the correct image URL
  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://192.168.28.6:5000${url}`;
  };

  // Add comprehensive media track cleanup function
  const stopAllMediaTracks = () => {
    console.log('Stopping all media tracks');
    
    // Stop tracks from mediaStreamRef
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        console.log(`Stopping ${track.kind} track`);
        track.stop();
      });
      mediaStreamRef.current = null;
    }
    
    // Stop tracks from global stream reference
    if (window.localStream) {
      window.localStream.getTracks().forEach(track => {
        console.log(`Stopping global ${track.kind} track`);
        track.stop();
      });
      window.localStream = null;
    }
    
    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        console.log('Dialog closing due to:', reason);
        stopAllMediaTracks();
        onClose();
      }}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          backgroundColor: '#1a1a1a',
          color: 'white',
          overflow: 'hidden',
          height: isMobile ? '100%' : '80vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', flex: 1, position: 'relative' }}>
        {/* Remote Video - Full size background */}
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: '#111111',
          zIndex: 1
        }}>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted={!isSpeakerOn}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: isVideoEnabled && callStatus === CALL_STATUS.ONGOING ? 'block' : 'none'
            }}
          />
          
          {/* Avatar shown when no video */}
          {(!isVideoEnabled || callStatus !== CALL_STATUS.ONGOING) && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%'
            }}>
              <Avatar
                src={getImageUrl(remoteUser?.profilePicture)}
                alt={remoteUser?.name || 'User'}
                sx={{ 
                  width: 100, 
                  height: 100, 
                  fontSize: '2.5rem',
                  backgroundColor: 'primary.main'
                }}
              >
                {remoteUser?.name ? remoteUser.name.charAt(0).toUpperCase() : 'U'}
              </Avatar>
              <Typography variant="h5" sx={{ mt: 2, color: 'white' }}>
                {remoteUser?.name || 'User'}
              </Typography>
              
              {callStatus === CALL_STATUS.CONNECTING && (
                <CircularProgress size={24} sx={{ mt: 2, color: 'white' }} />
              )}
              
              <Typography variant="body1" sx={{ mt: 2, color: 'white' }}>
                {getStatusText()}
              </Typography>
            </Box>
          )}
        </Box>
        
        {/* Local Video - Small overlay */}
        <Box sx={{ 
          position: 'absolute', 
          top: 16, 
          right: 16, 
          width: 120, 
          height: 180, 
          backgroundColor: '#333333',
          borderRadius: 2,
          overflow: 'hidden',
          zIndex: 2,
          display: isVideoEnabled && callStatus === CALL_STATUS.ONGOING ? 'block' : 'none'
        }}>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </Box>
        
        {/* Call Controls */}
        <Box sx={{ 
          position: 'absolute', 
          bottom: 16, 
          left: 0, 
          right: 0, 
          display: 'flex', 
          justifyContent: 'center',
          zIndex: 2
        }}>
          {isIncoming && callStatus === CALL_STATUS.CONNECTING ? (
            // Incoming call controls
            <Grid container spacing={2} justifyContent="center">
              <Grid item>
                <IconButton
                  onClick={handleRejectCall}
                  sx={{
                    backgroundColor: 'error.main',
                    color: 'white',
                    '&:hover': { backgroundColor: 'error.dark' },
                    width: 60,
                    height: 60
                  }}
                >
                  <CallEndIcon fontSize="large" />
                </IconButton>
              </Grid>
              <Grid item>
                <IconButton
                  onClick={handleAcceptCall}
                  sx={{
                    backgroundColor: 'success.main',
                    color: 'white',
                    '&:hover': { backgroundColor: 'success.dark' },
                    width: 60,
                    height: 60
                  }}
                >
                  <VideocamIcon fontSize="large" />
                </IconButton>
              </Grid>
            </Grid>
          ) : (
            // Ongoing call controls
            <Grid container spacing={2} justifyContent="center">
              <Grid item>
                <IconButton
                  onClick={toggleMute}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
                  }}
                >
                  {isMuted ? <MicOffIcon /> : <MicIcon />}
                </IconButton>
              </Grid>
              <Grid item>
                <IconButton
                  onClick={toggleVideo}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
                  }}
                >
                  {isVideoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
                </IconButton>
              </Grid>
              <Grid item>
                <IconButton
                  onClick={toggleSpeaker}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
                  }}
                >
                  {isSpeakerOn ? <VolumeUpIcon /> : <VolumeOffIcon />}
                </IconButton>
              </Grid>
              <Grid item>
                <IconButton
                  onClick={handleEndCall}
                  sx={{
                    backgroundColor: 'error.main',
                    color: 'white',
                    '&:hover': { backgroundColor: 'error.dark' }
                  }}
                >
                  <CallEndIcon />
                </IconButton>
              </Grid>
            </Grid>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default CallModal; 