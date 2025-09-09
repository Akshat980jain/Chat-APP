import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Box, 
  Tabs, 
  Tab, 
  Badge,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  Alert,
  Collapse,
  Fade,
  Slide,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  ListItemIcon,
  Snackbar,
  AppBar,
  Toolbar
} from '@mui/material';
import {
  Send as SendIcon,
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Phone as PhoneIcon,
  VideoCall as VideoCallIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  EmojiEmotions as EmojiIcon,
  AttachFile as AttachFileIcon,
  Mic as MicIcon,
  Image as ImageIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Reply as ReplyIcon,
  Forward as ForwardIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  PersonAdd as PersonAddIcon,
  Group as GroupIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Done as DoneIcon,
  DoneAll as DoneAllIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  WifiOff as WifiOffIcon,
  Wifi as WifiIcon,
  SignalWifi4Bar as SignalIcon,
  Battery20 as BatteryLowIcon,
  BatteryFull as BatteryFullIcon,
  NetworkCheck as NetworkIcon
} from '@mui/icons-material';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import AddChatByPhone from './AddChatByPhone';
import ChatInputMobile from './ChatInputMobile';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import ProfilePicture from '../profile/ProfilePicture';
import IncomingCallAlert from '../call/IncomingCallAlert';
import CallModal from '../call/CallModal';

// Enhanced utility functions
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const apiUrl = localStorage.getItem('api_url') || process.env.REACT_APP_API_URL || 'http://localhost:5000';
  return url.startsWith('/') ? `${apiUrl}${url}` : `${apiUrl}/${url}`;
};

const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  
  try {
    const date = new Date(timestamp);
    const now = new Date();
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return format(date, 'EEE');
    } else {
      return format(date, 'MMM d');
    }
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
};

const generateMessageId = () => {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Enhanced Chat Component
const Chat = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  
  // Core state
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  // UI state
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState('chats');
  const [showAddChat, setShowAddChat] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  
  // Message state
  const [sendingMessage, setSendingMessage] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [messageQueue, setMessageQueue] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  
  // Call state
  const [incomingCall, setIncomingCall] = useState(null);
  const [currentCall, setCurrentCall] = useState(null);
  const [callStatus, setCallStatus] = useState('idle');
  
  // Advanced state
  const [messageFilter, setMessageFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [showMessageActions, setShowMessageActions] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  
  // Refs
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastMessageRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  
  // Context
  const { user, detectApiUrl } = useAuth();
  const { socket, connected: socketConnected } = useSocket();

  // Memoized values
  const apiUrl = useMemo(() => detectApiUrl(), [detectApiUrl]);
  
  const filteredChats = useMemo(() => {
    if (!searchQuery) return chats;
    
    return chats.filter(chat => {
      const otherUser = chat.participants?.find(p => p._id !== user?.id);
      const chatName = chat.isGroup ? chat.groupName : otherUser?.name;
      const lastMessageContent = chat.lastMessage?.content || '';
      
      return (
        chatName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lastMessageContent.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [chats, searchQuery, user?.id]);
  
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    
    return users.filter(u => 
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phoneNumber?.includes(searchQuery)
    );
  }, [users, searchQuery]);

  const sortedMessages = useMemo(() => {
    const sorted = [...messages];
    
    if (sortOrder === 'newest') {
      return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }
  }, [messages, sortOrder]);

  // Enhanced API functions with better error handling
  const fetchChats = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${apiUrl}/api/chats`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });

      if (response.data) {
        setChats(response.data);
        
        // Calculate unread counts
        const counts = {};
        response.data.forEach(chat => {
          const unreadCount = chat.unreadCounts?.[user.id] || 0;
          if (unreadCount > 0) {
            counts[chat._id] = unreadCount;
          }
        });
        setUnreadCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      setError('Failed to load chats. Please try again.');
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, apiUrl]);

  const fetchUsers = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoadingUsers(true);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`${apiUrl}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 8000
      });

      if (response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  }, [user?.id, apiUrl]);

  const fetchMessages = useCallback(async (userId) => {
    if (!userId || !user?.id) return;
    
    try {
      setLoadingMessages(true);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`${apiUrl}/api/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });

      if (response.data) {
        setMessages(response.data);
        
        // Mark messages as read
        const unreadMessages = response.data.filter(
          msg => msg.sender._id === userId && msg.status !== 'read'
        );
        
        if (unreadMessages.length > 0) {
          await markMessagesAsRead(unreadMessages.map(msg => msg._id));
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  }, [user?.id, apiUrl]);

  const markMessagesAsRead = useCallback(async (messageIds) => {
    if (!messageIds.length) return;
    
    try {
      const token = localStorage.getItem('token');
      
      // Update each message status
      await Promise.all(
        messageIds.map(messageId =>
          axios.put(
            `${apiUrl}/api/messages/${messageId}/status`,
            { status: 'read' },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );
      
      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          messageIds.includes(msg._id) 
            ? { ...msg, status: 'read' }
            : msg
        )
      );
      
      // Emit socket event for real-time updates
      if (socket && socketConnected) {
        messageIds.forEach(messageId => {
          socket.emit('message_read', {
            messageId,
            userId: user.id,
            chatId: selectedChat?._id
          });
        });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [apiUrl, socket, socketConnected, user?.id, selectedChat?._id]);

  // Enhanced message sending with retry logic
  const sendMessage = useCallback(async (content, recipientId = null, retryCount = 0) => {
    if (!content?.trim() || sendingMessage) return;
    
    const recipient = recipientId || selectedUser?._id;
    if (!recipient) {
      toast.error('No recipient selected');
      return;
    }

    const messageId = generateMessageId();
    const tempMessage = {
      _id: `temp-${Date.now()}`,
      messageId,
      sender: { _id: user.id, name: user.name, profilePicture: user.profilePicture },
      recipient: { _id: recipient },
      content: content.trim(),
      createdAt: new Date().toISOString(),
      status: 'sending',
      isTemporary: true
    };

    try {
      setSendingMessage(true);
      
      // Add optimistic message
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
      
      // Scroll to bottom
      setTimeout(() => scrollToBottom(), 100);

      // Send via socket first for real-time delivery
      if (socket && socketConnected) {
        socket.emit('send_message', {
          messageId,
          senderId: user.id,
          recipientId: recipient,
          content: content.trim(),
          chatId: selectedChat?._id,
          tempId: tempMessage._id,
          timestamp: tempMessage.createdAt
        });
      }

      // Also send via HTTP API for persistence
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${apiUrl}/api/messages`,
        {
          recipient,
          content: content.trim(),
          messageId
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15000
        }
      );

      if (response.data) {
        // Replace temporary message with real one
        setMessages(prev => 
          prev.map(msg => 
            msg._id === tempMessage._id 
              ? { ...response.data, status: 'sent' }
              : msg
          )
        );
        
        // Refresh chats to update last message
        fetchChats();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Handle retry logic
      if (retryCount < 3) {
        console.log(`Retrying message send (attempt ${retryCount + 1})`);
        setTimeout(() => {
          sendMessage(content, recipientId, retryCount + 1);
        }, 1000 * (retryCount + 1));
        return;
      }
      
      // Mark message as failed
      setMessages(prev => 
        prev.map(msg => 
          msg._id === tempMessage._id 
            ? { ...msg, status: 'failed' }
            : msg
        )
      );
      
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  }, [
    sendingMessage, 
    selectedUser?._id, 
    user, 
    socket, 
    socketConnected, 
    selectedChat?._id, 
    apiUrl, 
    fetchChats
  ]);

  // Enhanced chat selection
  const handleChatSelect = useCallback(async (chat, user = null) => {
    try {
      setSelectedChat(chat);
      setSelectedUser(user || chat.participants?.find(p => p._id !== user?.id));
      setMessages([]);
      setError(null);
      
      if (isMobile) {
        setMobileView('chat');
      }
      
      // Join socket room for real-time updates
      if (socket && chat._id) {
        socket.emit('join_chat', chat._id);
      }
      
      // Fetch messages for this chat
      const otherUser = user || chat.participants?.find(p => p._id !== user?.id);
      if (otherUser?._id) {
        await fetchMessages(otherUser._id);
      }
      
      // Clear unread count for this chat
      if (unreadCounts[chat._id]) {
        setUnreadCounts(prev => {
          const updated = { ...prev };
          delete updated[chat._id];
          return updated;
        });
      }
    } catch (error) {
      console.error('Error selecting chat:', error);
      setError('Failed to load chat');
    }
  }, [isMobile, socket, fetchMessages, unreadCounts, user?.id]);

  // Enhanced user selection for new chats
  const handleUserSelect = useCallback(async (selectedUser) => {
    try {
      // Check if chat already exists
      const existingChat = chats.find(chat => 
        chat.participants?.some(p => p._id === selectedUser._id)
      );
      
      if (existingChat) {
        handleChatSelect(existingChat, selectedUser);
        return;
      }
      
      // Create new chat
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${apiUrl}/api/chats`,
        { participantId: selectedUser._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data) {
        const newChat = response.data;
        setChats(prev => [newChat, ...prev]);
        handleChatSelect(newChat, selectedUser);
        toast.success(`Started chat with ${selectedUser.name}`);
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Failed to start chat');
    }
  }, [chats, handleChatSelect, apiUrl]);

  // Enhanced typing indicator
  const handleTyping = useCallback(() => {
    if (!socket || !socketConnected || !selectedUser?._id) return;
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Emit typing start
    socket.emit('typing_start', {
      recipientId: selectedUser._id,
      chatId: selectedChat?._id
    });
    
    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_end', {
        recipientId: selectedUser._id,
        chatId: selectedChat?._id
      });
    }, 1000);
  }, [socket, socketConnected, selectedUser?._id, selectedChat?._id]);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (messageData) => {
      console.log('Received message via socket:', messageData);
      
      // Add message to current chat if it matches
      if (
        selectedUser && 
        (messageData.sender._id === selectedUser._id || messageData.recipient._id === selectedUser._id)
      ) {
        setMessages(prev => {
          // Check for duplicates
          const exists = prev.some(msg => 
            msg._id === messageData._id || 
            msg.messageId === messageData.messageId
          );
          
          if (exists) return prev;
          
          return [...prev, messageData];
        });
        
        // Auto-scroll to new message
        setTimeout(scrollToBottom, 100);
        
        // Mark as read if chat is active
        if (messageData.sender._id === selectedUser._id) {
          setTimeout(() => {
            markMessagesAsRead([messageData._id]);
          }, 500);
        }
      }
      
      // Update chat list
      fetchChats();
      
      // Show notification if not in current chat
      if (!selectedUser || messageData.sender._id !== selectedUser._id) {
        showNotification(messageData);
      }
    };

    const handleTypingIndicator = (data) => {
      const { userId, isTyping } = data;
      
      setTypingUsers(prev => {
        const updated = new Set(prev);
        if (isTyping) {
          updated.add(userId);
        } else {
          updated.delete(userId);
        }
        return updated;
      });
      
      // Clear typing indicator after 3 seconds
      if (isTyping) {
        setTimeout(() => {
          setTypingUsers(prev => {
            const updated = new Set(prev);
            updated.delete(userId);
            return updated;
          });
        }, 3000);
      }
    };

    const handleUserStatus = (data) => {
      const { userId, status } = data;
      
      // Update user status in chats
      setChats(prev => 
        prev.map(chat => ({
          ...chat,
          participants: chat.participants?.map(p => 
            p._id === userId 
              ? { ...p, isOnline: status === 'online' }
              : p
          )
        }))
      );
      
      // Update user status in users list
      setUsers(prev => 
        prev.map(u => 
          u._id === userId 
            ? { ...u, isOnline: status === 'online' }
            : u
        )
      );
    };

    const handleMessageDelivered = (data) => {
      const { tempId, status, messageId } = data;
      
      setMessages(prev => 
        prev.map(msg => 
          msg._id === tempId 
            ? { ...msg, status, _id: messageId || msg._id }
            : msg
        )
      );
    };

    const handleMessageError = (data) => {
      const { tempId, error } = data;
      
      setMessages(prev => 
        prev.map(msg => 
          msg._id === tempId 
            ? { ...msg, status: 'failed' }
            : msg
        )
      );
      
      toast.error(`Message failed: ${error}`);
    };

    const handleIncomingCall = (callData) => {
      console.log('Incoming call:', callData);
      setIncomingCall(callData);
      setCallStatus('incoming');
    };

    const handleCallAccepted = (callData) => {
      console.log('Call accepted:', callData);
      setCurrentCall(callData);
      setCallStatus('ongoing');
      setIncomingCall(null);
    };

    const handleCallRejected = (callData) => {
      console.log('Call rejected:', callData);
      setIncomingCall(null);
      setCurrentCall(null);
      setCallStatus('idle');
      toast.info('Call was declined');
    };

    const handleCallEnded = (callData) => {
      console.log('Call ended:', callData);
      setIncomingCall(null);
      setCurrentCall(null);
      setCallStatus('idle');
    };

    // Register socket event listeners
    socket.on('receive_message', handleReceiveMessage);
    socket.on('typing_indicator', handleTypingIndicator);
    socket.on('user_status', handleUserStatus);
    socket.on('message_delivered', handleMessageDelivered);
    socket.on('message_error', handleMessageError);
    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_accepted', handleCallAccepted);
    socket.on('call_rejected', handleCallRejected);
    socket.on('call_ended', handleCallEnded);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('typing_indicator', handleTypingIndicator);
      socket.off('user_status', handleUserStatus);
      socket.off('message_delivered', handleMessageDelivered);
      socket.off('message_error', handleMessageError);
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_accepted', handleCallAccepted);
      socket.off('call_rejected', handleCallRejected);
      socket.off('call_ended', handleCallEnded);
    };
  }, [socket, selectedUser, fetchChats, markMessagesAsRead, scrollToBottom, user?.id]);

  // Initialize data
  useEffect(() => {
    if (user?.id) {
      fetchChats();
      fetchUsers();
    }
  }, [user?.id, fetchChats, fetchUsers]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages.length, scrollToBottom]);

  // Handle input changes with typing indicator
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setNewMessage(value);
    
    if (value.trim() && selectedUser) {
      handleTyping();
    }
  }, [selectedUser, handleTyping]);

  // Handle form submission
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(newMessage.trim());
    }
  }, [newMessage, sendMessage]);

  // Enhanced notification function
  const showNotification = useCallback((messageData) => {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      const notification = new Notification(
        `New message from ${messageData.sender.name}`,
        {
          body: messageData.content,
          icon: getImageUrl(messageData.sender.profilePicture),
          badge: '/logo192.png',
          tag: `message-${messageData.sender._id}`,
          requireInteraction: false,
          silent: false
        }
      );
      
      notification.onclick = () => {
        window.focus();
        const user = users.find(u => u._id === messageData.sender._id);
        if (user) {
          handleUserSelect(user);
        }
        notification.close();
      };
      
      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          showNotification(messageData);
        }
      });
    }
  }, [users, handleUserSelect]);

  // Call functions
  const initiateCall = useCallback((userId, callType = 'audio') => {
    if (!socket || !socketConnected) {
      toast.error('Cannot make calls while disconnected');
      return;
    }
    
    const callerInfo = {
      from: user.id,
      to: userId,
      callerName: user.name,
      callerPicture: user.profilePicture,
      callType
    };
    
    socket.emit('initiate_call', callerInfo);
    setCallStatus('calling');
    
    toast.info(`Calling ${selectedUser?.name}...`);
  }, [socket, socketConnected, user, selectedUser?.name]);

  const acceptCall = useCallback(() => {
    if (!socket || !incomingCall) return;
    
    socket.emit('call_accepted', {
      from: incomingCall.to,
      to: incomingCall.from
    });
    
    setCurrentCall(incomingCall);
    setCallStatus('ongoing');
    setIncomingCall(null);
  }, [socket, incomingCall]);

  const rejectCall = useCallback(() => {
    if (!socket || !incomingCall) return;
    
    socket.emit('call_rejected', {
      from: incomingCall.to,
      to: incomingCall.from
    });
    
    setIncomingCall(null);
    setCallStatus('idle');
  }, [socket, incomingCall]);

  const endCall = useCallback(() => {
    if (!socket || !currentCall) return;
    
    socket.emit('call_ended', {
      from: currentCall.to || user.id,
      to: currentCall.from || currentCall.to
    });
    
    setCurrentCall(null);
    setCallStatus('idle');
  }, [socket, currentCall, user?.id]);

  // Enhanced add chat handler
  const handleAddChat = useCallback(async (userData) => {
    try {
      if (typeof userData === 'string') {
        // Phone number provided
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${apiUrl}/api/users/search/phone/${userData}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data) {
          await handleUserSelect(response.data);
          setShowAddChat(false);
          toast.success(`Started chat with ${response.data.name}`);
        }
      } else {
        // User object provided
        await handleUserSelect(userData);
        setShowAddChat(false);
        toast.success(`Started chat with ${userData.name}`);
      }
    } catch (error) {
      console.error('Error adding chat:', error);
      
      if (error.response?.status === 404) {
        toast.error('User not found with this phone number');
      } else {
        toast.error('Failed to add chat');
      }
    }
  }, [handleUserSelect, apiUrl]);

  // Connection status component
  const ConnectionStatus = () => {
    if (!socketConnected) {
      return (
        <Chip
          icon={<WifiOffIcon />}
          label="Reconnecting..."
          size="small"
          color="warning"
          variant="outlined"
        />
      );
    }
    
    return (
      <Chip
        icon={<WifiIcon />}
        label="Connected"
        size="small"
        color="success"
        variant="outlined"
      />
    );
  };

  // Enhanced chat list item
  const ChatListItem = ({ chat, isActive, onClick }) => {
    const otherUser = chat.participants?.find(p => p._id !== user?.id);
    const unreadCount = unreadCounts[chat._id] || 0;
    const lastMessage = chat.lastMessage;
    
    return (
      <ListItem
        button
        selected={isActive}
        onClick={() => onClick(chat, otherUser)}
        className={`chat-item ${isActive ? 'active' : ''}`}
        sx={{
          borderRadius: 2,
          mb: 1,
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'action.hover',
            transform: 'translateX(4px)'
          },
          '&.Mui-selected': {
            backgroundColor: 'primary.50',
            borderLeft: '4px solid',
            borderLeftColor: 'primary.main'
          }
        }}
      >
        <ListItemAvatar>
          <Badge
            badgeContent={unreadCount}
            color="primary"
            max={99}
            invisible={unreadCount === 0}
          >
            <Avatar
              src={getImageUrl(otherUser?.profilePicture)}
              alt={otherUser?.name}
              sx={{ 
                width: 48, 
                height: 48,
                border: '2px solid',
                borderColor: otherUser?.isOnline ? 'success.main' : 'grey.300'
              }}
            >
              {otherUser?.name?.[0]?.toUpperCase()}
            </Avatar>
          </Badge>
        </ListItemAvatar>
        
        <ListItemText
          primary={
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1" fontWeight="medium" noWrap>
                {chat.isGroup ? chat.groupName : otherUser?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {lastMessage && formatMessageTime(lastMessage.createdAt)}
              </Typography>
            </Box>
          }
          secondary={
            <Box display="flex" alignItems="center" gap={1}>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                noWrap 
                sx={{ flex: 1 }}
              >
                {lastMessage?.content || 'No messages yet'}
              </Typography>
              {lastMessage?.status && lastMessage.sender === user?.id && (
                <Box display="flex" alignItems="center">
                  {lastMessage.status === 'sent' && <DoneIcon fontSize="small" />}
                  {lastMessage.status === 'delivered' && <DoneIcon fontSize="small" />}
                  {lastMessage.status === 'read' && <DoneAllIcon fontSize="small" color="primary" />}
                </Box>
              )}
            </Box>
          }
        />
      </ListItem>
    );
  };

  // Enhanced user list item
  const UserListItem = ({ user: listUser, onClick }) => (
    <ListItem
      button
      onClick={() => onClick(listUser)}
      sx={{
        borderRadius: 2,
        mb: 1,
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: 'action.hover',
          transform: 'translateX(4px)'
        }
      }}
    >
      <ListItemAvatar>
        <Avatar
          src={getImageUrl(listUser.profilePicture)}
          alt={listUser.name}
          sx={{ 
            width: 48, 
            height: 48,
            border: '2px solid',
            borderColor: listUser.isOnline ? 'success.main' : 'grey.300'
          }}
        >
          {listUser.name?.[0]?.toUpperCase()}
        </Avatar>
      </ListItemAvatar>
      
      <ListItemText
        primary={
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="subtitle1" fontWeight="medium">
              {listUser.name}
            </Typography>
            {listUser.isOnline && (
              <Chip
                label="Online"
                size="small"
                color="success"
                variant="outlined"
              />
            )}
          </Box>
        }
        secondary={
          <Typography variant="body2" color="text.secondary">
            {listUser.status || 'Available'}
          </Typography>
        }
      />
    </ListItem>
  );

  // Enhanced message component
  const MessageComponent = ({ message, isOwn, showAvatar = true }) => {
    const [showActions, setShowActions] = useState(false);
    
    return (
      <Box
        display="flex"
        justifyContent={isOwn ? 'flex-end' : 'flex-start'}
        mb={1}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {!isOwn && showAvatar && (
          <Avatar
            src={getImageUrl(message.sender?.profilePicture)}
            alt={message.sender?.name}
            sx={{ width: 32, height: 32, mr: 1 }}
          >
            {message.sender?.name?.[0]?.toUpperCase()}
          </Avatar>
        )}
        
        <Box maxWidth="75%">
          <Paper
            elevation={1}
            sx={{
              p: 1.5,
              borderRadius: 3,
              backgroundColor: isOwn ? 'primary.main' : 'background.paper',
              color: isOwn ? 'primary.contrastText' : 'text.primary',
              borderBottomRightRadius: isOwn ? 1 : 3,
              borderBottomLeftRadius: isOwn ? 3 : 1,
              position: 'relative',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: 2
              }
            }}
          >
            {replyingTo?.messageId === message._id && (
              <Box
                sx={{
                  borderLeft: '3px solid',
                  borderLeftColor: 'primary.main',
                  pl: 1,
                  mb: 1,
                  opacity: 0.7
                }}
              >
                <Typography variant="caption">
                  Replying to: {replyingTo.content.substring(0, 50)}...
                </Typography>
              </Box>
            )}
            
            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
              {message.content}
            </Typography>
            
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mt={0.5}
            >
              <Typography
                variant="caption"
                sx={{
                  opacity: 0.8,
                  fontSize: '0.7rem'
                }}
              >
                {format(new Date(message.createdAt), 'HH:mm')}
              </Typography>
              
              {isOwn && (
                <Box display="flex" alignItems="center" ml={1}>
                  {message.status === 'sending' && (
                    <CircularProgress size={12} sx={{ opacity: 0.7 }} />
                  )}
                  {message.status === 'sent' && (
                    <DoneIcon sx={{ fontSize: 14, opacity: 0.7 }} />
                  )}
                  {message.status === 'delivered' && (
                    <DoneIcon sx={{ fontSize: 14, opacity: 0.7 }} />
                  )}
                  {message.status === 'read' && (
                    <DoneAllIcon sx={{ fontSize: 14, color: 'primary.light' }} />
                  )}
                  {message.status === 'failed' && (
                    <ErrorIcon sx={{ fontSize: 14, color: 'error.main' }} />
                  )}
                </Box>
              )}
            </Box>
            
            {/* Message actions */}
            <Fade in={showActions && !isMobile}>
              <Box
                position="absolute"
                top={-20}
                right={isOwn ? 0 : 'auto'}
                left={isOwn ? 'auto' : 0}
                display="flex"
                gap={0.5}
                sx={{
                  backgroundColor: 'background.paper',
                  borderRadius: 2,
                  boxShadow: 2,
                  p: 0.5
                }}
              >
                <IconButton size="small" onClick={() => setReplyingTo(message)}>
                  <ReplyIcon fontSize="small" />
                </IconButton>
                <IconButton size="small">
                  <StarBorderIcon fontSize="small" />
                </IconButton>
                {isOwn && (
                  <IconButton size="small" onClick={() => setEditingMessage(message)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Fade>
          </Paper>
        </Box>
      </Box>
    );
  };

  // Enhanced sidebar component
  const Sidebar = () => (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 0,
        borderRight: 1,
        borderColor: 'divider'
      }}
    >
      {/* Sidebar Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            Modern Chat
          </Typography>
          <Box display="flex" gap={1}>
            <ConnectionStatus />
            <IconButton size="small" onClick={() => setShowSettings(true)}>
              <SettingsIcon />
            </IconButton>
          </Box>
        </Box>
        
        {/* Search */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search chats and users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3
            }
          }}
        />
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        variant="fullWidth"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': {
            minHeight: 48,
            fontWeight: 'medium'
          }
        }}
      >
        <Tab
          icon={<Badge badgeContent={Object.keys(unreadCounts).length} color="primary"><ChatIcon /></Badge>}
          label="Chats"
          iconPosition="start"
        />
        <Tab
          icon={<PersonAddIcon />}
          label="Users"
          iconPosition="start"
        />
      </Tabs>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {/* Chats Tab */}
        {activeTab === 0 && (
          <Box sx={{ height: '100%', overflow: 'auto' }}>
            {loading ? (
              <Box p={2}>
                {[...Array(5)].map((_, i) => (
                  <Box key={i} display="flex" alignItems="center" gap={2} mb={2}>
                    <Skeleton variant="circular" width={48} height={48} />
                    <Box flex={1}>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : filteredChats.length > 0 ? (
              <List sx={{ p: 1 }}>
                {filteredChats.map((chat) => (
                  <ChatListItem
                    key={chat._id}
                    chat={chat}
                    isActive={selectedChat?._id === chat._id}
                    onClick={handleChatSelect}
                  />
                ))}
              </List>
            ) : (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                height="100%"
                p={3}
                textAlign="center"
              >
                <ChatIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No chats yet
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Start a conversation by selecting a user
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setActiveTab(1)}
                >
                  Find Users
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* Users Tab */}
        {activeTab === 1 && (
          <Box sx={{ height: '100%', overflow: 'auto' }}>
            <Box p={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setShowAddChat(true)}
                sx={{ mb: 2 }}
              >
                Add by Phone Number
              </Button>
            </Box>
            
            {loadingUsers ? (
              <Box p={2}>
                {[...Array(5)].map((_, i) => (
                  <Box key={i} display="flex" alignItems="center" gap={2} mb={2}>
                    <Skeleton variant="circular" width={48} height={48} />
                    <Box flex={1}>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : filteredUsers.length > 0 ? (
              <List sx={{ p: 1 }}>
                {filteredUsers.map((listUser) => (
                  <UserListItem
                    key={listUser._id}
                    user={listUser}
                    onClick={handleUserSelect}
                  />
                ))}
              </List>
            ) : (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                height="200px"
                p={3}
                textAlign="center"
              >
                <PersonAddIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No users found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your search or add users by phone
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );

  // Enhanced main chat area
  const MainChatArea = () => {
    if (!selectedUser) {
      return (
        <Paper
          elevation={0}
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            p: 4,
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)'
          }}
        >
          <ChatIcon sx={{ fontSize: 120, color: 'text.secondary', mb: 3 }} />
          <Typography variant="h4" color="text.secondary" gutterBottom fontWeight="light">
            Welcome to Modern Chat
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={4} maxWidth={400}>
            Select a conversation from the sidebar to start chatting, or find new users to connect with.
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => setActiveTab(1)}
            >
              Find Users
            </Button>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setShowAddChat(true)}
            >
              Add by Phone
            </Button>
          </Box>
        </Paper>
      );
    }

    return (
      <Paper
        elevation={0}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 0
        }}
      >
        {/* Chat Header */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            backgroundColor: 'background.paper',
            color: 'text.primary',
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          <Toolbar sx={{ minHeight: '64px !important' }}>
            {isMobile && (
              <IconButton
                edge="start"
                onClick={() => setMobileView('chats')}
                sx={{ mr: 2 }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            
            <Avatar
              src={getImageUrl(selectedUser.profilePicture)}
              alt={selectedUser.name}
              sx={{ 
                width: 40, 
                height: 40, 
                mr: 2,
                border: '2px solid',
                borderColor: selectedUser.isOnline ? 'success.main' : 'grey.300'
              }}
            >
              {selectedUser.name?.[0]?.toUpperCase()}
            </Avatar>
            
            <Box flex={1}>
              <Typography variant="subtitle1" fontWeight="medium">
                {selectedUser.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedUser.isOnline ? (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Box
                      width={8}
                      height={8}
                      borderRadius="50%"
                      bgcolor="success.main"
                    />
                    Online
                  </Box>
                ) : (
                  `Last seen ${formatDistanceToNow(new Date(selectedUser.lastSeen), { addSuffix: true })}`
                )}
              </Typography>
            </Box>
            
            <Box display="flex" gap={1}>
              <Tooltip title="Voice call">
                <IconButton
                  onClick={() => initiateCall(selectedUser._id, 'audio')}
                  disabled={!socketConnected}
                >
                  <PhoneIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Video call">
                <IconButton
                  onClick={() => initiateCall(selectedUser._id, 'video')}
                  disabled={!socketConnected}
                >
                  <VideoCallIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Chat info">
                <IconButton onClick={() => setShowUserInfo(true)}>
                  <InfoIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Messages Area */}
        <Box
          ref={chatContainerRef}
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            background: 'linear-gradient(to bottom, rgba(245, 247, 250, 0.3), rgba(245, 247, 250, 0.1))'
          }}
          className="auto-hide-scrollbar"
        >
          {loadingMessages ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : sortedMessages.length > 0 ? (
            <>
              {sortedMessages.map((message, index) => {
                const isOwn = message.sender?._id === user?.id;
                const showAvatar = !isOwn && (
                  index === 0 || 
                  sortedMessages[index - 1]?.sender?._id !== message.sender?._id
                );
                
                return (
                  <MessageComponent
                    key={message._id}
                    message={message}
                    isOwn={isOwn}
                    showAvatar={showAvatar}
                  />
                );
              })}
              
              {/* Typing indicator */}
              {typingUsers.size > 0 && (
                <Box display="flex" justifyContent="flex-start" mb={1}>
                  <TypingIndicator senderName={selectedUser.name} />
                </Box>
              )}
              
              <div ref={messagesEndRef} />
            </>
          ) : (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              height="100%"
              textAlign="center"
            >
              <MessageIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No messages yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start the conversation with {selectedUser.name}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Message Input */}
        <Box
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
            backgroundColor: 'background.paper'
          }}
        >
          {replyingTo && (
            <Box
              sx={{
                mb: 1,
                p: 1,
                backgroundColor: 'action.hover',
                borderRadius: 2,
                borderLeft: '3px solid',
                borderLeftColor: 'primary.main'
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="primary">
                  Replying to: {replyingTo.content.substring(0, 50)}...
                </Typography>
                <IconButton size="small" onClick={() => setReplyingTo(null)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          )}
          
          <form onSubmit={handleSubmit}>
            <Box display="flex" alignItems="flex-end" gap={1}>
              <TextField
                ref={messageInputRef}
                fullWidth
                multiline
                maxRows={4}
                placeholder="Type a message..."
                value={newMessage}
                onChange={handleInputChange}
                disabled={sendingMessage || !socketConnected}
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'background.default'
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <Box display="flex" gap={0.5} mr={1}>
                      <IconButton size="small" disabled>
                        <EmojiIcon />
                      </IconButton>
                      <IconButton size="small" disabled>
                        <AttachFileIcon />
                      </IconButton>
                    </Box>
                  )
                }}
              />
              
              <IconButton
                type="submit"
                disabled={!newMessage.trim() || sendingMessage || !socketConnected}
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.dark'
                  },
                  '&:disabled': {
                    backgroundColor: 'action.disabledBackground'
                  }
                }}
              >
                {sendingMessage ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <SendIcon />
                )}
              </IconButton>
            </Box>
          </form>
        </Box>
      </Paper>
    );
  };

  // Mobile layout
  if (isMobile) {
    return (
      <Box sx={{ height: '100vh', overflow: 'hidden' }}>
        {mobileView === 'chats' ? (
          <Sidebar />
        ) : (
          <MainChatArea />
        )}
        
        {/* Add Chat Dialog */}
        <AddChatByPhone
          open={showAddChat}
          onClose={() => setShowAddChat(false)}
          onAdd={handleAddChat}
        />
        
        {/* Incoming Call Alert */}
        <IncomingCallAlert
          open={!!incomingCall}
          caller={incomingCall}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
        
        {/* Current Call Modal */}
        <CallModal
          open={!!currentCall}
          caller={currentCall}
          callStatus={callStatus}
          onClose={endCall}
        />
      </Box>
    );
  }

  // Desktop layout
  return (
    <Container maxWidth="xl" sx={{ height: '100vh', p: 0 }}>
      <Grid container sx={{ height: '100%' }}>
        <Grid item xs={12} md={4} lg={3}>
          <Sidebar />
        </Grid>
        <Grid item xs={12} md={8} lg={9}>
          <MainChatArea />
        </Grid>
      </Grid>
      
      {/* Dialogs and Modals */}
      <AddChatByPhone
        open={showAddChat}
        onClose={() => setShowAddChat(false)}
        onAdd={handleAddChat}
      />
      
      <IncomingCallAlert
        open={!!incomingCall}
        caller={incomingCall}
        onAccept={acceptCall}
        onReject={rejectCall}
      />
      
      <CallModal
        open={!!currentCall}
        caller={currentCall}
        callStatus={callStatus}
        onClose={endCall}
      />
      
      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Chat;