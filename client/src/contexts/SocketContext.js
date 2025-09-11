import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

// Optimized socket context with better error handling
const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

// Connection state constants
const CONNECTION_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error'
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connectionState, setConnectionState] = useState(CONNECTION_STATES.DISCONNECTED);
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastConnectTime, setLastConnectTime] = useState(0);
  
  const maxReconnectAttempts = 3;
  const reconnectDelay = 2000;
  
  const { user, detectApiUrl } = useAuth();
  const reconnectTimeoutRef = useRef(null);
  const connectionInProgress = useRef(false);
  const socketRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const messageQueueRef = useRef([]);
  
  // Computed connection status
  const isConnected = connectionState === CONNECTION_STATES.CONNECTED;
  
  // Optimized reconnection with exponential backoff
  const reconnectSocket = useCallback(() => {
    if (connectionInProgress.current) {
      return;
    }
    
    if (reconnectAttempts >= maxReconnectAttempts) {
      setConnectionState(CONNECTION_STATES.ERROR);
      setConnectionError('Unable to connect to chat server.');
      toast.error('Connection failed. Please refresh the page.');
      return;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    connectionInProgress.current = true;
    setConnectionState(CONNECTION_STATES.RECONNECTING);
    
    const backoffTime = Math.min(reconnectDelay * Math.pow(2, reconnectAttempts), 10000);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        try {
          socketRef.current.connect();
          setReconnectAttempts(prev => prev + 1);
        } catch (error) {
          console.error('Error reconnecting socket:', error);
          setConnectionState(CONNECTION_STATES.ERROR);
        }
      }
      
      connectionInProgress.current = false;
    }, backoffTime);
  }, [reconnectAttempts, maxReconnectAttempts]);
  
  // Optimized socket initialization
  const initializeSocket = useCallback(() => {
    if (!user) return null;
    
    try {
      const socketUrl = detectApiUrl();
      
      const newSocket = io(socketUrl, {
        reconnection: false,
        timeout: 20000,
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        autoConnect: true,
        forceNew: true,
        auth: {
          token: localStorage.getItem('token')
        },
        query: {
          userId: user.id,
          device: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
        }
      });
      
      return newSocket;
    } catch (error) {
      console.error('Error initializing socket:', error);
      setConnectionState(CONNECTION_STATES.ERROR);
      setConnectionError('Failed to initialize connection');
      return null;
    }
  }, [user, detectApiUrl]);
  
  // Optimized cleanup function
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
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    connectionInProgress.current = false;
  }, []);
  
  // Optimized socket setup
  useEffect(() => {
    if (!user) {
      cleanupSocket();
      setConnectionState(CONNECTION_STATES.DISCONNECTED);
      return;
    }
    
    setConnectionState(CONNECTION_STATES.CONNECTING);
    setConnectionError(null);
    setReconnectAttempts(0);
    connectionInProgress.current = false;
    
    cleanupSocket();
    
    const newSocket = initializeSocket();
    if (!newSocket) return;
    
    socketRef.current = newSocket;
    setSocket(newSocket);
    
    // Optimized event listeners
    newSocket.on('connect', () => {
      setConnectionState(CONNECTION_STATES.CONNECTED);
      setConnectionError(null);
      setReconnectAttempts(0);
      connectionInProgress.current = false;
      setLastConnectTime(Date.now());
      
      newSocket.emit('user_connected', user.id);
      
      // Process queued messages
      if (messageQueueRef.current.length > 0) {
        messageQueueRef.current.forEach(message => {
          newSocket.emit('send_message', message);
        });
        messageQueueRef.current = [];
      }
      
      // Setup heartbeat
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
      }, 25000);
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionState(CONNECTION_STATES.ERROR);
      
      if (reconnectAttempts > 1) {
        setConnectionError('Connection issues detected');
      }
      
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectSocket();
      } else {
        toast.error('Unable to connect to chat server');
      }
    });
    
    newSocket.on('disconnect', (reason) => {
      setConnectionState(CONNECTION_STATES.DISCONNECTED);
      
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      
      // Auto-reconnect for certain disconnect reasons
      if (['io server disconnect', 'transport close', 'ping timeout'].includes(reason)) {
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectSocket();
        }
      }
    });
    
    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      setConnectionState(CONNECTION_STATES.ERROR);
      setConnectionError(error.message || 'Unknown error');
    });
    
    return cleanupSocket;
  }, [user, reconnectSocket, initializeSocket, cleanupSocket, maxReconnectAttempts]);
  
  // Optimized room management
  const joinRoom = useCallback((roomId) => {
    if (socket && isConnected && roomId) {
      socket.emit('join_room', roomId);
    }
  }, [socket, isConnected]);
  
  const leaveRoom = useCallback((roomId) => {
    if (socket && isConnected && roomId) {
      socket.emit('leave_room', roomId);
    }
  }, [socket, isConnected]);
  
  // Optimized event emission with queuing
  const emitEvent = useCallback((event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
      return true;
    } else {
      // Queue message for later if it's a send_message event
      if (event === 'send_message') {
        messageQueueRef.current.push(data);
      }
      return false;
    }
  }, [socket, isConnected]);
  
  // Optimized connection update
  const updateSocketConnection = useCallback(() => {
    cleanupSocket();
    setConnectionState(CONNECTION_STATES.CONNECTING);
    setConnectionError(null);
    setReconnectAttempts(0);
    connectionInProgress.current = false;
    
    const newSocket = initializeSocket();
    if (newSocket) {
      socketRef.current = newSocket;
      setSocket(newSocket);
    }
  }, [initializeSocket, cleanupSocket]);
  
  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        connectionState,
        connectionError,
        reconnectAttempts,
        maxReconnectAttempts,
        updateSocketConnection,
        joinRoom,
        leaveRoom,
        emitEvent,
        messageQueue: messageQueueRef.current
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext; 