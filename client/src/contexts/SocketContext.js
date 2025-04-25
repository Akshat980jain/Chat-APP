import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

// Create context
const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const { user, detectApiUrl } = useAuth();
  const reconnectTimeoutRef = useRef(null);
  const connectionInProgress = useRef(false);
  const socketRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  
  // Handle socket reconnection with backoff
  const reconnectSocket = useCallback(() => {
    // Prevent multiple reconnection attempts running simultaneously
    if (connectionInProgress.current) {
      console.log('Connection attempt already in progress, skipping...');
      return;
    }
    
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.log(`Maximum reconnection attempts (${maxReconnectAttempts}) reached. Stopping reconnection.`);
      setConnectionError('Unable to connect to chat server. Please refresh the page or check your connection.');
      return;
    }
    
    // Clear any existing timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Set flag to indicate reconnection in progress
    connectionInProgress.current = true;
    
    // Calculate backoff time
    const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
    
    console.log(`Scheduling reconnect attempt ${reconnectAttempts + 1} in ${backoffTime/1000} seconds`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Attempting to reconnect socket (attempt ${reconnectAttempts + 1})`);
      
      if (socketRef.current) {
        try {
          socketRef.current.connect();
          setReconnectAttempts(prev => prev + 1);
        } catch (error) {
          console.error('Error reconnecting socket:', error);
        }
      }
      
      // Reset the flag after attempt
      connectionInProgress.current = false;
    }, backoffTime);
  }, [reconnectAttempts, maxReconnectAttempts]);
  
  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    if (!user) return null;
    
    try {
      // Get the current API URL using the improved function
      const socketUrl = detectApiUrl();
      console.log('Connecting to socket at:', socketUrl);
      
      // Create a new socket connection
      const newSocket = io(socketUrl, {
        reconnection: false, // We'll handle reconnection manually
        timeout: 20000,
        transports: ['websocket', 'polling'], // Try websocket first, then fallback to polling
        upgrade: true, // Allow transport upgrade
        rememberUpgrade: true, // Remember if websocket works
        autoConnect: true, // Connect automatically
        forceNew: true, // Force a new connection
        auth: {
          token: localStorage.getItem('token')
        },
        query: {
          userId: user.id, // Add user ID to query for quick identification
          device: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
        }
      });
      
      return newSocket;
    } catch (error) {
      console.error('Error initializing socket:', error);
      setConnectionError('Failed to initialize socket connection');
      return null;
    }
  }, [user, detectApiUrl]);
  
  // Clean up existing socket and timers
  const cleanupSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    
    if (socketRef.current) {
      console.log('Cleaning up socket connection');
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);
  
  // Set up socket and event listeners
  useEffect(() => {
    if (!user) {
      cleanupSocket();
      return;
    }
    
    // Reset connection state when user changes
    setConnected(false);
    setConnectionError(null);
    setReconnectAttempts(0);
    connectionInProgress.current = false;
    
    // Clean up previous socket
    cleanupSocket();
    
    // Create a new socket
    const newSocket = initializeSocket();
    if (!newSocket) return;
    
    // Save reference to the socket
    socketRef.current = newSocket;
    setSocket(newSocket);
    
    // Set up event listeners
    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
      setConnected(true);
      setConnectionError(null);
      setReconnectAttempts(0);
      connectionInProgress.current = false;
      
      // Identify user to server
      newSocket.emit('user_connected', user.id);
      
      // Set up heartbeat to keep connection alive and detect stale connections
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      
      heartbeatIntervalRef.current = setInterval(() => {
        if (newSocket.connected) {
          newSocket.emit('heartbeat', { userId: user.id, timestamp: Date.now() });
        } else {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
      }, 30000); // Send heartbeat every 30 seconds
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnected(false);
      
      // Only show error after multiple attempts
      if (reconnectAttempts > 2) {
        setConnectionError('Having trouble connecting to chat server...');
      }
      
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectSocket();
      }
    });
    
    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected, reason:', reason);
      setConnected(false);
      
      // Clear heartbeat interval
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      
      // If the disconnection was initiated by the server, try to reconnect
      if (reason === 'io server disconnect' || reason === 'transport close' || reason === 'ping timeout') {
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectSocket();
        }
      }
    });
    
    // Call-related events
    newSocket.on('incoming_call', (data) => {
      console.log('Incoming call:', data);
    });
    
    newSocket.on('call_accepted', (data) => {
      console.log('Call accepted:', data);
    });
    
    newSocket.on('call_rejected', (data) => {
      console.log('Call rejected:', data);
    });
    
    newSocket.on('call_ended', (data) => {
      console.log('Call ended:', data);
    });
    
    newSocket.on('call_offer', (data) => {
      console.log('Call offer received:', data);
    });
    
    newSocket.on('call_answer', (data) => {
      console.log('Call answer received:', data);
    });
    
    newSocket.on('ice_candidate', (data) => {
      console.log('ICE candidate received:', data);
    });
    
    // Error handling
    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      setConnectionError('Socket error: ' + (error.message || 'Unknown error'));
    });
    
    // Cleanup socket connection on unmount
    return cleanupSocket;
  }, [user, reconnectSocket, initializeSocket, cleanupSocket, maxReconnectAttempts]);
  
  // Join a room (e.g., a chat)
  const joinRoom = useCallback((roomId) => {
    if (socket && connected && roomId) {
      console.log(`Joining room: ${roomId}`);
      socket.emit('join_room', roomId);
    } else {
      console.warn('Cannot join room - socket not connected or no room ID');
    }
  }, [socket, connected]);
  
  // Leave a room
  const leaveRoom = useCallback((roomId) => {
    if (socket && connected && roomId) {
      console.log(`Leaving room: ${roomId}`);
      socket.emit('leave_room', roomId);
    }
  }, [socket, connected]);
  
  // Emit a custom event
  const emitEvent = useCallback((event, data) => {
    if (socket && connected) {
      console.log(`Emitting event: ${event}`, data);
      socket.emit(event, data);
      return true;
    } else {
      console.warn(`Cannot emit event: ${event} - socket not connected`);
      return false;
    }
  }, [socket, connected]);
  
  // A function to update the socket connection when the API URL changes
  const updateSocketConnection = useCallback(() => {
    console.log('Updating socket connection');
    
    // Clean up previous socket
    cleanupSocket();
    
    // Reset connection state
    setConnected(false);
    setConnectionError(null);
    setReconnectAttempts(0);
    connectionInProgress.current = false;
    
    // Create a new socket with the updated URL
    const newSocket = initializeSocket();
    if (newSocket) {
      socketRef.current = newSocket;
      setSocket(newSocket);
      console.log('Socket connection updated');
    }
  }, [initializeSocket, cleanupSocket]);
  
  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        connectionError,
        updateSocketConnection,
        joinRoom,
        leaveRoom,
        emitEvent
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext; 