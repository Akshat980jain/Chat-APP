import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Avatar,
  TextField,
  IconButton,
  Typography,
  Badge,
  CircularProgress,
  Tooltip,
  AppBar,
  Toolbar,
  keyframes,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  useMediaQuery,
  useTheme,
  Fab,
  Menu,
  MenuItem,
  Divider,
  Switch,
  FormControlLabel,
  FormGroup,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Tab,
  Tabs,
  InputAdornment,
  Container
} from '@mui/material';
import { toast } from 'react-toastify';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import DoneIcon from '@mui/icons-material/Done';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import PersonIcon from '@mui/icons-material/Person';
import ChatIcon from '@mui/icons-material/Chat';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PhoneIcon from '@mui/icons-material/Phone';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CallIcon from '@mui/icons-material/Call';
import VideocamIcon from '@mui/icons-material/Videocam';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import axios from 'axios';
import { format } from 'timeago.js';
import AddChatByPhone from './AddChatByPhone';
import { setAuthToken } from '../../contexts/AuthContext';
import MobileNavigation from '../layout/MobileNavigation';
import ChatInputMobile from './ChatInputMobile';
import BackupSendButton from './BackupSendButton';
import ThemeToggle from '../layout/ThemeToggle';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import MessageInput from './MessageInput';
import BackupInputField from './BackupInputField';
import MobileNavBar from '../layout/MobileNavBar';

// Modified API base URL using environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://chat-app-backend-pus1.onrender.com';
console.log('API connecting to:', API_BASE_URL);

// Configure axios with common settings
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.timeout = 10000;
axios.defaults.headers.post['Content-Type'] = 'application/json';

// Simple translation function - Replace with a proper i18n library if needed
const t = (text) => {
  // For now, just return the text as is
  // In a real app, you would use i18next or similar
  return text;
};

// Define the flashing animation
const flash = keyframes`
  0%, 100% {
    background-color: #2196f3;
    color: white;
  }
  50% {
    background-color: #64b5f6;
    color: white;
  }
`;

// Define the playNotificationSound function before any useEffect hooks that reference it
const playNotificationSound = () => {
  try {
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.5; // Set volume to 50%
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.warn('Audio playback prevented by browser:', error);
      });
    }
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
};

// Define a helper function to get the correct image URL
const getImageUrl = (url) => {
  if (!url) return '';
  
  // If it's already a full URL, return it as is
  if (url.startsWith('http')) {
    return url;
  }
  
  // Make sure the URL starts with a slash if it doesn't already
  const formattedUrl = url.startsWith('/') ? url : `/${url}`;
  const fullUrl = `${API_BASE_URL}${formattedUrl}`;
  
  return fullUrl;
};

// Function to generate avatar URL for users without a profile picture
const getAvatarUrl = (name) => {
  // Use UI Avatars or similar service to generate avatar based on name
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
};

// Add this near the top of the file after other imports, before the Chat component definition
const pulseAnimation = keyframes`
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 5px rgba(76, 175, 80, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
  }
`;

const Chat = () => {
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false); // Initialize as false to prevent UI blocking on startup
  const [userLoading, setUserLoading] = useState(false); // Add separate state for user loading
  const [chatLoading, setChatLoading] = useState(false); // Add separate state for chat loading
  const [messageLoading, setMessageLoading] = useState(false); // Add separate state for message loading
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  // eslint-disable-next-line no-unused-vars
  const { user, logout, recentlyLoggedIn, refreshToken } = useAuth();
  const { socket, connected, connectionError, emitEvent, joinRoom, leaveRoom } = useSocket();
  const [isTyping, setIsTyping] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [typingUsers, setTypingUsers] = useState({});
  // eslint-disable-next-line no-unused-vars
  const [activeTab, setActiveTab] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [openAddByPhone, setOpenAddByPhone] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    messageNotifications: true,
    callNotifications: true,
    contactStatusNotifications: false,
    messageReadNotifications: false,
    sound: true
  });
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileView, setMobileView] = useState(window.innerWidth <= 768);
  const [showChatList, setShowChatList] = useState(true);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [incomingCallOpen, setIncomingCallOpen] = useState(false);
  const [currentCall, setCurrentCall] = useState(null);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [ringtoneAudio, setRingtoneAudio] = useState(null);
  const messagesContainerRef = useRef(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Add a simple fallback input method
  const [showFallbackInput, setShowFallbackInput] = useState(false);
  const [fallbackMessage, setFallbackMessage] = useState('');

  const toggleFallbackInput = () => {
    setShowFallbackInput(!showFallbackInput);
  };

  const sendFallbackMessage = () => {
    if (!fallbackMessage.trim()) return;
    
    // Create a messageData object
    const messageData = {
      tempId: `temp-${Date.now()}`,
      messageId: `msg-${Date.now()}`,
      chatId: selectedChat?._id,
      recipientId: selectedUser?._id,
      senderId: user.id,
      content: fallbackMessage.trim(),
      timestamp: new Date().toISOString(),
      status: 'sending',
      sender: user
    };
    
    // Use the same handler that processes messages from ChatInputMobile
    handleMobileMessageSent(messageData);
    
    // Clear the input
    setFallbackMessage('');
  };

  // Define showNotification function inside the component where it can access notificationSettings
  const showNotification = (title, body, icon = null, type = 'message') => {
    // Check if the browser supports notifications
    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notifications");
      return;
    }

    // Check if the user is actively using the app
    const isDocumentVisible = !document.hidden;
    
    // Check notification settings
    const shouldShowNotification = 
      (type === 'message' && notificationSettings.messageNotifications) ||
      (type === 'call' && notificationSettings.callNotifications) ||
      (type === 'status' && notificationSettings.contactStatusNotifications) ||
      (type === 'read' && notificationSettings.messageReadNotifications);
    
    // Only show notifications if permission is granted, document is not visible, and settings allow
    if (Notification.permission === "granted" && !isDocumentVisible && shouldShowNotification) {
      try {
        const notification = new Notification(title, {
          body: body,
          icon: icon || '/logo192.png', // Default app icon
          tag: 'chat-notification', // Tag to replace previous notifications
          silent: !notificationSettings.sound // Allow sound based on settings
        });
        
        // Close notification after 5 seconds
        setTimeout(() => notification.close(), 5000);
        
        // Handle notification click
        notification.onclick = function() {
          window.focus(); // Focus the window
          this.close();
        };
        
        // Play sound if enabled
        if (notificationSettings.sound) {
          playNotificationSound();
        }
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    } else if (Notification.permission !== "denied" && !isDocumentVisible && shouldShowNotification) {
      // Request permission if not already granted or denied
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          showNotification(title, body, icon, type);
        }
      });
    }
  };

  // Scroll to bottom more reliably - Define this function early before it's used in other functions
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      // Force scroll to end with "auto" behavior for immediate scrolling
      messagesEndRef.current.scrollIntoView({ 
        behavior: "auto", 
        block: "end"
      });
      console.log('Scrolled to bottom of messages');
    } else {
      console.warn('Messages end ref not available');
    }
  }, [messagesEndRef]);

  // Set auth token on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
    }
  }, []);

  // Request notification permission
  useEffect(() => {
    // Check if the browser supports notifications
    if ('Notification' in window) {
      // If permission is not granted or denied
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        // Request permission
        Notification.requestPermission().then(permission => {
          console.log('Notification permission:', permission);
        });
      } else {
        console.log('Notification permission status:', Notification.permission);
      }
    } else {
      console.log('This browser does not support desktop notifications');
    }
  }, []);

  // Initial server connection check
  useEffect(() => {
    // Ping server to check if it's available
    const checkServerConnection = async () => {
      try {
        setConnectionStatus('connecting');
        await axios.get(`${API_BASE_URL}`);
        setConnectionStatus('connected');
        setApiError(null);
      } catch (error) {
        console.error('Server connection check failed:', error);
        setConnectionStatus('disconnected');
        setApiError('Cannot connect to server. Please check your connection or try again later.');
      }
    };

    checkServerConnection();
  }, []);

  // Update connection status based on socket connection
  useEffect(() => {
    if (connected) {
      setConnectionStatus('connected');
      setApiError(null);
    } else if (connectionError) {
      setConnectionStatus('disconnected');
      setApiError(connectionError);
    }
  }, [connected, connectionError]);

  // Improve the fetchUsers function to ensure proper user data loading
  const fetchUsers = useCallback(async () => {
    try {
      if (userLoading) {
        console.log("Already loading users, skipping");
        return;
      }
      
      setUserLoading(true);
      setApiError(null);
      
      console.log("Fetching users from API:", `${API_BASE_URL}/api/users`);
      const response = await axios.get(`${API_BASE_URL}/api/users`);
      
      if (response && response.data) {
        console.log(`Received ${response.data.length} users:`, response.data);
        // Ensure all user objects have required fields
        const processedUsers = response.data.map(user => ({
          _id: user._id || user.id,
          name: user.name || `User ${user._id?.substring(0, 5) || ''}`,
          profilePicture: user.profilePicture || null,
          isOnline: user.isOnline || false,
          email: user.email,
          phone: user.phone
        }));
        setUsers(processedUsers);
        // Filter online users (excluding current user)
        setOnlineUsers(processedUsers.filter(u => u.isOnline && u._id !== user.id));
      } else {
        setUsers([]);
        setOnlineUsers([]);
        console.warn('No user data received');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.message === 'Network Error') {
        setApiError('Network error: Cannot connect to server. Please check your connection.');
        setConnectionStatus('disconnected');
      } else {
        setApiError('Failed to load users. Please try again later.');
      }
      setUsers([]);
      setOnlineUsers([]);
    } finally {
      setUserLoading(false);
    }
  }, [user, setUsers, setOnlineUsers, setApiError, setConnectionStatus, userLoading]);

  // Improved fetchChats function here
  const fetchChats = useCallback(async () => {
    try {
      // Skip if already loading
      if (chatLoading) {
        console.log(`[${new Date().toLocaleTimeString()}] Skip chat fetch - already loading`);
        return;
      }
      
      // Check when we last successfully loaded chats
      const lastRefreshTime = sessionStorage.getItem('lastChatRefresh');
      const now = Date.now();
      
      // If we loaded recently (last 30 seconds), don't reload
      if (lastRefreshTime && (now - parseInt(lastRefreshTime)) < 30000) {
        console.log(`[${new Date().toLocaleTimeString()}] Skip chat fetch - loaded recently`);
        return;
      }
      
      setChatLoading(true);
      setApiError(null);
      
      console.log(`[${new Date().toLocaleTimeString()}] Fetching chats from API:`, `${API_BASE_URL}/api/chats`);
      const response = await axios.get(`${API_BASE_URL}/api/chats`);
      
      if (response && response.data) {
        console.log(`[${new Date().toLocaleTimeString()}] Received ${response.data.length} chats`);
        
        // Store timestamp of last successful fetch
        sessionStorage.setItem('lastChatRefresh', now.toString());
        
        // Ensure chat objects have all required fields
        const processedChats = response.data.map(chat => {
          // Extract user information from participants if missing
          let chatUser = chat.user;
          
          // If no chat.user exists, try to find a participant that isn't the current user
          if (!chatUser && chat.participants && chat.participants.length > 0) {
            // Handle different participant formats (object vs ID)
            const otherParticipant = chat.participants.find(p => {
              if (typeof p === 'object') return p._id !== user.id;
              return p !== user.id;
            });
            
            if (otherParticipant) {
              if (typeof otherParticipant === 'object') {
                // If participant is an object, use it directly
                chatUser = otherParticipant;
                console.log(`Using participant object for chat ${chat._id}, user:`, chatUser.name);
      } else {
                // If participant is just an ID, try to find it in our users list
                const foundUser = users.find(u => u._id === otherParticipant);
                if (foundUser) {
                  chatUser = foundUser;
                  console.log(`Found user for chat ${chat._id} in users list:`, chatUser.name);
                } else {
                  console.log(`Could not find user data for ID ${otherParticipant} in chat ${chat._id}`);
                  // Make API call to get user data if needed
                  axios.get(`${API_BASE_URL}/api/users/${otherParticipant}`)
                    .then(userResponse => {
                      if (userResponse.data) {
                        console.log(`Successfully fetched user data for ID ${otherParticipant}:`, userResponse.data.name);
                        // Add to users list
                        setUsers(prevUsers => {
                          if (!prevUsers.some(u => u._id === userResponse.data._id)) {
                            return [...prevUsers, userResponse.data];
                          }
                          return prevUsers;
                        });
                      }
                    })
                    .catch(err => console.error(`Failed to fetch user data for ID ${otherParticipant}:`, err));
                }
              }
            } else if (chat.participants[0]) {
              // Fallback to first participant if no other participant found
              const firstParticipant = chat.participants[0];
              if (typeof firstParticipant === 'object') {
                chatUser = firstParticipant;
              } else {
                const foundUser = users.find(u => u._id === firstParticipant);
                if (foundUser) {
                  chatUser = foundUser;
                }
              }
            }
          }
          
          // Create a well-formed chat object
          return {
            ...chat,
            user: chatUser || {
              _id: chat.userId || 'unknown',
              name: chat.name || `Contact ${chat._id.substring(0, 5)}`,
              profilePicture: chat.profilePicture || null
            }
          };
        });
        
        console.log("Processed chats:", processedChats);
        
        // Sort chats by most recent message
        const sortedChats = [...processedChats].sort((a, b) => {
          const aTime = a.lastMessage?.createdAt || a.updatedAt || new Date(0).toISOString();
          const bTime = b.lastMessage?.createdAt || b.updatedAt || new Date(0).toISOString();
          return new Date(bTime) - new Date(aTime);
        });
        
        setChats(sortedChats);
      } else {
        console.warn('No chat data received or empty data array');
        setChats([]);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      if (error.response) {
        console.error('Server response:', error.response.data);
        console.error('Status code:', error.response.status);
      }
      
      if (error.message === 'Network Error') {
        setApiError('Network error: Cannot connect to server. Please check your connection.');
        setConnectionStatus('disconnected');
      } else {
        setApiError('Failed to load chats. Please try again later.');
      }
      setChats([]);
    } finally {
      setChatLoading(false);
    }
  }, [API_BASE_URL, user.id, users, setChats, setChatLoading, setApiError, setConnectionStatus, setUsers, chatLoading]);

  // Update the fetchMessages function to include better logging and throttling
  const fetchMessages = useCallback(async (userId) => {
    // Skip if already loading messages
    if (messageLoading) {
      console.log(`[${new Date().toLocaleTimeString()}] Skip message fetch - already loading`);
      return;
    }
    
    try {
      setMessageLoading(true);
      setApiError(null);
      
      console.log(`[${new Date().toLocaleTimeString()}] Fetching messages for user ${userId}`);
      const response = await axios.get(`${API_BASE_URL}/api/messages/${userId}`);
      
      if (response && response.data) {
        // Sort messages to ensure newest messages are at the bottom
        const sortedMessages = [...response.data].sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );
        
        console.log(`[${new Date().toLocaleTimeString()}] Received ${sortedMessages.length} messages`);
        
        // Only update state if messages actually changed
        const currentMessageIds = messages.map(m => m._id).join(',');
        const newMessageIds = sortedMessages.map(m => m._id).join(',');
        
        if (currentMessageIds !== newMessageIds) {
          console.log(`[${new Date().toLocaleTimeString()}] Messages changed, updating state`);
        // Set messages and force an immediate scroll to the bottom
        setMessages(sortedMessages);
        
        // Force an immediate scroll to the bottom
        requestAnimationFrame(() => {
          scrollToBottom();
          // Double-check with a small delay to ensure DOM is fully updated
          setTimeout(() => {
            scrollToBottom();
          }, 50);
        });
        } else {
          console.log(`[${new Date().toLocaleTimeString()}] No message changes detected`);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (error.message === 'Network Error') {
        setConnectionStatus('disconnected');
        setApiError('Network error: Cannot connect to server');
      } else {
        setApiError('Failed to load messages. Please try again.');
      }
    } finally {
      setMessageLoading(false);
    }
  }, [API_BASE_URL, messageLoading, messages, scrollToBottom, setConnectionStatus]);

  // Handle socket events for real-time updates
  useEffect(() => {
    if (socket && connected) {
      console.log("Setting up socket event listeners");
      
      // Handle incoming messages
      const handleReceiveMessage = (messageData) => {
        console.log("Received message via socket:", messageData);
        
        // Only add the message if it doesn't already exist
        if (!messages.some(m => m._id === messageData._id)) {
          // Add the message to our state
          setMessages(prevMessages => [...prevMessages, messageData]);
          scrollToBottom();
          
          // Play notification sound for new messages if not from current user
          // and not focused on this chat
          if (messageData.sender !== user.id && 
             (messageData.chatId !== selectedChat?._id || document.hidden)) {
            playNotificationSound();
            
            // Find sender details to use in notification
            const sender = users.find(u => u._id === messageData.sender);
            const senderName = sender?.name || 'Someone';
            const senderIcon = sender?.profilePicture ? getImageUrl(sender.profilePicture) : null;
            
            // Show notification
            showNotification(
              `${senderName}`, 
              messageData.content.length > 50 ? `${messageData.content.substring(0, 50)}...` : messageData.content,
              senderIcon,
              'message'
            );
          }
        }
      };
      
      // Handle chat refresh signal
      const handleChatRefresh = (data) => {
        console.log("Chat refresh signal received:", data);
        
        if (data && data.chatId) {
          // Update the chat list with the latest message info
          setChats(prevChats => 
            prevChats.map(chat => {
              if (chat._id === data.chatId) {
                return {
                  ...chat,
                  lastMessage: {
                    content: data.lastMessage.content,
                    createdAt: data.lastMessage.timestamp,
                    type: data.lastMessage.type || 'text'
                  },
                  updatedAt: data.lastMessage.timestamp
                };
              }
              return chat;
            })
          );
          
          // Re-sort chats to ensure latest message is at the top
          setChats(prevChats => 
            [...prevChats].sort((a, b) => {
              const aTime = a.lastMessage?.createdAt || a.updatedAt || new Date(0).toISOString();
              const bTime = b.lastMessage?.createdAt || b.updatedAt || new Date(0).toISOString();
              return new Date(bTime) - new Date(aTime);
            })
          );
        }
      };
      
      // Handle updated chat list
      const handleChatListUpdated = (data) => {
        console.log("Chat list update received:", data);
        
        if (data && data.chats) {
          setChats(data.chats);
        }
      };
      
      // Handle message delivered confirmation
      const handleMessageDelivered = (status) => {
        console.log("Message delivery status received:", status);
        
        if (status && status.tempId) {
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.tempId === status.tempId ? 
                { 
                  ...msg, 
                  status: status.status,
                  _id: status.messageId || msg._id,
                  createdAt: status.timestamp || msg.createdAt,
                  isSent: true 
                } : msg
            )
          );
          
          // Also refresh chat list to show updated last message
          fetchChats();
        }
      };
      
      // Handle message read status update
      const handleMessageStatus = (status) => {
        console.log('Message status update:', status);
        
        if (status && status.messageId) {
          // Update the status of the specific message
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg._id === status.messageId || msg.tempId === status.messageId
                ? { ...msg, status: status.status, read: status.status === 'read', readAt: status.status === 'read' ? new Date().toISOString() : msg.readAt }
                : msg
            )
          );
          
          // Show notification when message is read
          if (status.status === 'read' && !document.hasFocus()) {
            const recipient = users.find(u => u._id === status.readerId);
            if (recipient) {
              showNotification(
                'Message Read',
                `${recipient.name} has read your message`,
                recipient.profilePicture ? getImageUrl(recipient.profilePicture) : null,
                'read'
              );
            }
          }
        }
      };
      
      // Handle typing status updates
      const handleTypingStatus = (data) => {
        console.log("Typing status update:", data);
        
        if (data && data.chatId) {
          // Update the typing users for this chat
          setTypingUsers(prev => ({
            ...prev,
            [data.chatId]: data.users || []
          }));
        }
      };
      
      // Handle user online status updates
      const handleUserStatus = (data) => {
        if (data && data.userId) {
          console.log('User status update:', data);
          
          // Update users with online status
          setUsers(prevUsers => 
            prevUsers.map(user => 
              user._id === data.userId 
                ? { ...user, isOnline: data.isOnline } 
                : user
            )
          );
          
          // Update online users list
          if (data.isOnline) {
            setOnlineUsers(prev => {
              // Only add if not already in list
              if (!prev.some(u => u._id === data.userId) && data.userId !== user.id) {
                // Find the user details
                const userDetails = users.find(u => u._id === data.userId);
                if (userDetails) {
                  // Show notification for important contacts
                  const isChatPartner = chats.some(chat => 
                    chat.user && chat.user._id === data.userId);
                    
                  if (isChatPartner) {
                    showNotification(
                      'Contact Online',
                      `${userDetails.name} is now online`,
                      userDetails.profilePicture ? getImageUrl(userDetails.profilePicture) : null,
                      'status'
                    );
                  }
                  return [...prev, userDetails];
                }
              }
              return prev;
            });
          } else {
            setOnlineUsers(prev => {
              // Find the user that went offline
              const userGoingOffline = prev.find(u => u._id === data.userId);
              
              // Filter out the user who went offline
              const newList = prev.filter(u => u._id !== data.userId);
              
              // Notify about important contacts going offline
              if (userGoingOffline) {
                const isChatPartner = chats.some(chat => 
                  chat.user && chat.user._id === data.userId);
                
                if (isChatPartner) {
                  showNotification(
                    'Contact Offline',
                    `${userGoingOffline.name} has gone offline`,
                    userGoingOffline.profilePicture ? getImageUrl(userGoingOffline.profilePicture) : null,
                    'status'
                  );
                }
              }
              
              return newList;
            });
          }
        }
      };
      
      // Register event listeners
      socket.on('receive_message', handleReceiveMessage);
      socket.on('message_delivered', handleMessageDelivered);
      socket.on('message_status', handleMessageStatus);
      socket.on('typing_status', handleTypingStatus);
      socket.on('user_status', handleUserStatus);
      socket.on('chat_refresh', handleChatRefresh);
      socket.on('chat_list_updated', handleChatListUpdated);
      socket.on('message_error', (error) => console.error("Socket message error:", error));
      
      // Request a chat list refresh when initially connecting
      if (user && user.id) {
        emitEvent('request_chat_refresh', user.id);
      }
      
      // Cleanup function to remove listeners
      return () => {
        socket.off('receive_message', handleReceiveMessage);
        socket.off('message_delivered', handleMessageDelivered);
        socket.off('message_status', handleMessageStatus);
        socket.off('typing_status', handleTypingStatus);
        socket.off('user_status', handleUserStatus);
        socket.off('chat_refresh', handleChatRefresh);
        socket.off('chat_list_updated', handleChatListUpdated);
        socket.off('message_error');
      };
    }
  }, [socket, connected, messages, selectedChat, selectedUser, user, emitEvent, scrollToBottom, playNotificationSound, setChats, fetchChats]);

  // Single, optimized polling mechanism
  useEffect(() => {
    let chatRefreshInterval;
    
    if (socket && connected) {
      // Set up a single interval for both chat and message updates
      chatRefreshInterval = setInterval(() => {
        if (!document.hidden && !loading) {
          // Only fetch messages if a chat is selected
          if (selectedChat && selectedUser) {
            fetchMessages(selectedUser._id);
          }
          
          // Only fetch chats if it's been at least 5 minutes since last fetch
          const lastRefreshTime = sessionStorage.getItem('lastChatRefresh');
          const now = Date.now();
          if (!lastRefreshTime || (now - parseInt(lastRefreshTime)) > 300000) {
            fetchChats();
            sessionStorage.setItem('lastChatRefresh', now.toString());
          }
        }
      }, 300000); // Every 5 minutes
    }
    
    return () => {
      if (chatRefreshInterval) {
        clearInterval(chatRefreshInterval);
      }
    };
  }, [socket, connected, selectedChat, selectedUser, fetchMessages, fetchChats, loading]);

  // Add at the top of the Chat component
  const didFetchInitialData = useRef(false);

  // Replace the initial data fetch useEffect with this:
  useEffect(() => {
    if (
      user &&
      connectionStatus === 'connected' &&
      !didFetchInitialData.current
    ) {
      didFetchInitialData.current = true;
      Promise.all([fetchUsers(), fetchChats()])
        .catch(err => {
          console.error("Error loading initial data:", err);
        });
    }
  }, [user, connectionStatus, fetchUsers, fetchChats]);

  // Visibility change handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && connectionStatus === 'connected' && !loading) {
        const lastRefreshTime = sessionStorage.getItem('lastChatRefresh');
        const now = Date.now();
        
        if (!lastRefreshTime || (now - parseInt(lastRefreshTime)) > 300000) {
          console.log("Refreshing data after tab visibility change");
          fetchChats();
          sessionStorage.setItem('lastChatRefresh', now.toString());
          
          if (selectedChat && selectedUser) {
            fetchMessages(selectedUser._id);
          }
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [connectionStatus, fetchChats, fetchMessages, selectedChat, selectedUser, loading]);

  // Add a debug helper for development mode
  const isDevEnvironment = process.env.NODE_ENV === 'development';
  
  const debugFetchChats = () => {
    console.log("Manual chat refresh triggered");
    fetchChats();
  };

  // Fetch messages when user is selected
  useEffect(() => {
    if (selectedUser && connectionStatus === 'connected') {
      fetchMessages(selectedUser._id);
    }
  }, [selectedUser, connectionStatus, fetchMessages]);

  // Join/leave chat room when chat changes
  useEffect(() => {
    if (socket && connected && selectedChat && selectedChat._id) {
      console.log('Joining chat room:', selectedChat._id);
      joinRoom(selectedChat._id);
      
      // Mark all unread messages as read
      if (selectedChat.unreadCount && selectedChat.unreadCount > 0) {
        const unreadMessages = messages.filter(msg => 
          msg.sender !== user.id && !msg.read
        );
        
        // Send read receipts for unread messages
        unreadMessages.forEach(msg => {
          emitEvent('message_read', {
            messageId: msg._id,
            chatId: selectedChat._id,
            readerId: user.id
          });
        });
      }
      
      return () => {
        // Leave the chat room when component unmounts or chat changes
        if (selectedChat._id) {
          leaveRoom(selectedChat._id);
        }
      };
    }
  }, [socket, connected, selectedChat, user, joinRoom, leaveRoom, emitEvent, messages]);

  // Auto-scroll when messages change with better performance
  useEffect(() => {
    if (messages.length > 0) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        scrollToBottom();
        
        // And another scroll after a short delay to ensure rendering is complete
        const timeoutId = setTimeout(() => {
          scrollToBottom();
        }, 100);
        
        return () => clearTimeout(timeoutId);
      });
    }
  }, [messages, scrollToBottom]);

  // Handle call-related socket events
  useEffect(() => {
    if (socket && connected && user) {
      // Handler for incoming calls
      const handleIncomingCall = (data) => {
        console.log('Incoming call from:', data.from, data);
        
        // Create caller object
        const caller = {
          _id: data.from,
          name: data.callerName,
          profilePicture: data.callerPicture,
        };
        
        // Update state for incoming call
        setIncomingCallData({
          caller,
          callType: data.callType
        });
        
        // Show the incoming call alert
        setIncomingCallOpen(true);
        
        // Play ringtone
        if (!ringtoneAudio) {
          const audio = new Audio('/sounds/ringtone.mp3');
          audio.loop = true;
          audio.play().catch(err => console.error('Failed to play ringtone:', err));
          setRingtoneAudio(audio);
        }
        
        // Show notification for incoming call
        showNotification(
          'Incoming Call',
          `${data.callerName || 'Someone'} is calling you`,
          data.callerPicture ? getImageUrl(data.callerPicture) : null,
          'call'
        );
      };
      
      // Handler for call rejection
      const handleCallRejected = (data) => {
        console.log('Call rejected by:', data.from);
        
        // Stop ringtone if playing
        if (ringtoneAudio) {
          ringtoneAudio.pause();
          ringtoneAudio.currentTime = 0;
          setRingtoneAudio(null);
        }
        
        // Close modal if open
        setCallModalOpen(false);
        setCurrentCall(null);
        
        // Show notification
        toast.info(`${data.from === selectedChat?.user?.name ? selectedChat?.user?.name : 'User'} rejected the call`);
      };
      
      // Handler for call ended
      const handleCallEnded = (data) => {
        console.log('Call ended by:', data.from);
        
        // Stop ringtone if playing
        if (ringtoneAudio) {
          ringtoneAudio.pause();
          ringtoneAudio.currentTime = 0;
          setRingtoneAudio(null);
        }
        
        // Cleanup media stream
        if (window.localStream) {
          console.log('Cleaning up local stream after call ended');
          window.localStream.getTracks().forEach(track => track.stop());
          window.localStream = null;
        }
        
        // Close modals
        setCallModalOpen(false);
        setIncomingCallOpen(false);
        setCurrentCall(null);
        setIncomingCallData(null);
        
        // Show notification
        toast.info('Call ended');
      };
      
      // Register socket event listeners for call-related events
      socket.on('incoming_call', handleIncomingCall);
      socket.on('call_rejected', handleCallRejected);
      socket.on('call_ended', handleCallEnded);
      
      // Cleanup function
      return () => {
        // Remove socket event listeners
        socket.off('incoming_call', handleIncomingCall);
        socket.off('call_rejected', handleCallRejected);
        socket.off('call_ended', handleCallEnded);
        
        // Stop ringtone if playing
        if (ringtoneAudio) {
          ringtoneAudio.pause();
          ringtoneAudio.currentTime = 0;
        }
        
        // Cleanup media stream
        if (window.localStream) {
          window.localStream.getTracks().forEach(track => track.stop());
          window.localStream = null;
        }
      };
    }
  }, [socket, connected, user, selectedChat, ringtoneAudio]);
  
  // Update the function to handle accepting calls 
  const callAcceptHandler = (video = false) => {
    // Hide incoming call alert
    setIncomingCallOpen(false);
    
    // Stop ringtone
    if (ringtoneAudio) {
      ringtoneAudio.pause();
      ringtoneAudio.currentTime = 0;
      setRingtoneAudio(null);
    }
    
    if (!incomingCallData || !incomingCallData.caller) {
      console.error('Missing caller information');
      return;
    }
    
    // Emit call accepted event
    emitEvent('call_accepted', {
      to: incomingCallData.caller._id,
      from: user.id
    });
    
    // Show call modal
    setCurrentCall({
      caller: incomingCallData.caller,
      callType: video ? 'video' : incomingCallData.callType || 'audio'
    });
    
    setCallModalOpen(true);
  };
  
  // Update the function to handle rejecting calls
  const callRejectHandler = () => {
    console.log('Rejecting incoming call');
    
    // Stop ringtone if playing
    if (ringtoneAudio) {
      ringtoneAudio.pause();
      ringtoneAudio.currentTime = 0;
      setRingtoneAudio(null);
    }
    
    // Emit call rejected event
    if (incomingCallData && incomingCallData.caller) {
      emitEvent('call_rejected', {
        to: incomingCallData.caller._id,
        from: user.id
      });
    }
    
    // Cleanup media stream if exists
    if (window.localStream) {
      console.log('Cleaning up local stream after call rejection');
      window.localStream.getTracks().forEach(track => {
        console.log(`Stopping ${track.kind} track`);
        track.stop();
      });
      window.localStream = null;
    }
    
    // Close the incoming call alert
    setIncomingCallOpen(false);
    setIncomingCallData(null);
  };
  
  // Update the function to handle initiating calls
  const handleCall = (callType = 'audio') => {
    if (!selectedChat) return;
    
    // Set up call data
    setCurrentCall({
      remoteUser: selectedChat.user,
      isIncoming: false,
      callType
    });
    
    // Show call modal
    setCallModalOpen(true);
    
    // Emit call initiation event
    emitEvent('initiate_call', {
      to: selectedChat.user._id,
      from: user.id,
      callerName: user.name,
      callerPicture: user.profilePicture,
      callType
    });
  };

  // Handle iOS keyboard appearance pushing content up
  useEffect(() => {
    if (isMobile) {
      // Function to handle when the virtual keyboard appears
      const handleResize = () => {
        // Small timeout to ensure the keyboard is fully shown
        setTimeout(() => {
          // Force scroll to the latest message
          scrollToBottom();
        }, 300);
      };

      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isMobile, scrollToBottom]);

  const retryConnection = () => {
    setApiError(null);
    window.location.reload();
  };

  // Handle sending a new message
  const handleSendMessage = async (event) => {
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    
    // Trim the message to remove whitespace
    const trimmedMessage = newMessage.trim();
    console.log("Attempting to send message:", {
      trimmedMessage,
      selectedUser: selectedUser?.name,
      connected,
      selectedRecipientId: selectedUser?._id
    });
    
    // First check if we can actually send a message
    if (!trimmedMessage) {
      console.log("Message is empty, not sending");
      return;
    }
    
    if (!selectedUser || !selectedUser._id) {
      console.log("No recipient selected, cannot send message");
      return;
    }
    
    if (!selectedChat) {
      console.log("No active chat selected");
    }

    // Make sure we have a valid token
    const token = localStorage.getItem('token');
    if (!token) {
      setApiError("Authentication token missing. Please login again.");
      console.error("No auth token found for message sending");
      return;
    }
    
    // Generate a temporary ID for this message
    const tempId = `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create a temporary message to display immediately
    const tempMessage = {
      _id: tempId,
      sender: user.id,
      recipient: selectedUser._id,
      content: trimmedMessage,
      read: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'sending',
      tempId,
      isSent: false
    };
    
    // Add to messages immediately for instant UI feedback
    setMessages(prevMessages => [...prevMessages, tempMessage]);
    
    // Clear the input field and reset typing state
    setNewMessage('');
    setIsTyping(false);
    
    // Scroll to bottom to show new message immediately
    requestAnimationFrame(() => {
      scrollToBottom();
    });

      try {
      // Try to send via socket first for real-time delivery
      if (socket && connected) {
        // Prepare message data for socket
        const messageData = {
          tempId,
          senderId: user.id,
          recipientId: selectedUser._id,
          content: trimmedMessage,
          chatId: selectedChat?._id,
          timestamp: new Date().toISOString(),
          type: 'text'
        };
        
        console.log("Emitting message via socket:", messageData);
        
        // Emit the message event
        emitEvent('send_message', messageData);
      }
      
      // Ensure auth token is set in headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Regardless of socket connection, also send via API to ensure storage
      console.log("Sending message via API to:", `${API_BASE_URL}/api/messages`);
      console.log("Message data:", {
        recipient: selectedUser._id,
        content: trimmedMessage,
        chatId: selectedChat?._id
      });
      
      const response = await axios.post(`${API_BASE_URL}/api/messages`, {
        recipient: selectedUser._id,
        content: trimmedMessage,
        chatId: selectedChat?._id
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data) {
        console.log("API response for message:", response.data);
        
        // Replace the temporary message with the real one from the server
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg._id === tempId || msg.tempId === tempId 
              ? {...response.data, status: 'sent', isSent: true} 
              : msg
          )
        );
        
        // If the message created a new chat, update selectedChat
        if (response.data.chatId && (!selectedChat || !selectedChat._id)) {
          console.log("New chat created:", response.data.chatId);
          // Fetch the chat details to update UI
          fetchChats();
        }
        
        // Update chats list to show the latest message
        fetchChats();
        
        // Clear any previous errors
        setApiError(null);
      } else {
        // Mark the message as failed if no data returned
        console.error("No data returned from server for message");
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg._id === tempId || msg.tempId === tempId
              ? {...msg, status: 'failed'} 
              : msg
          )
        );
        setApiError("Failed to send message: Server returned empty response");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      console.error("Error details:", error.response?.data);
      
      // Mark the message as failed
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg._id === tempId || msg.tempId === tempId
            ? {...msg, status: 'failed'} 
            : msg
        )
      );
      
      // Show detailed error in UI
      if (error.message === 'Network Error') {
        setConnectionStatus('disconnected');
        setApiError('Network error: Cannot connect to server. Please check your connection.');
      } else if (error.response?.status === 401) {
        setApiError('Authentication failed. Please login again.');
        // Try to refresh token
        refreshToken().catch(() => {
          logout(); // Force logout if token refresh fails
        });
      } else {
        setApiError(error.response?.data?.msg || "Failed to send message. Please try again.");
      }
    }
  };

  /* eslint-disable no-unused-vars */
  const handleChatSelect = (chat, user) => {
    if (!chat) return;
    
    setSelectedChat(chat);
    
    // Make sure user is defined, either from the function parameter, chat.user, or chat.participants
    let chatUser = user || chat.user;
    
    // If we still don't have a user, try to extract from participants (excluding current user)
    if (!chatUser && chat.participants && chat.participants.length > 0) {
      // Find the participant that is not the current user
      const otherParticipantId = chat.participants.find(p => 
        (typeof p === 'object' ? p._id !== user?.id : p !== user?.id)
      );
      
      // Try to find this user in our users list
      if (otherParticipantId) {
        chatUser = users.find(u => u._id === (typeof otherParticipantId === 'object' ? otherParticipantId._id : otherParticipantId));
      }
      
      // If still no user found, use the first participant
      if (!chatUser && chat.participants[0]) {
        const firstParticipant = chat.participants[0];
        const participantId = typeof firstParticipant === 'object' ? firstParticipant._id : firstParticipant;
        chatUser = users.find(u => u._id === participantId);
      }
    }
    
    // If we still don't have a user object, create a minimal one with available data
    if (!chatUser) {
      // Try to extract a user ID from chat data
      const userId = chat.userId || 
                    (typeof chat.user === 'object' ? chat.user._id : chat.user) || 
                    chat._id;
      
      console.log(`Missing user data for chat ${chat._id}, creating fallback with user ID: ${userId}`);
      
      // Try to find this user in our users list one more time
      const foundUser = users.find(u => u._id === userId);
      
      if (foundUser) {
        chatUser = foundUser;
      } else {
        // Create a minimal user object
        chatUser = {
          _id: userId,
          name: chat.name || `Contact ${userId.substring(0, 5)}`,
          profilePicture: chat.profilePicture
        };
        
        // Try to load this user specifically
        axios.get(`${API_BASE_URL}/api/users/${userId}`)
          .then(response => {
            if (response.data) {
              console.log(`Successfully loaded missing user: ${response.data.name}`);
              // Update the user in our state
              setSelectedUser(response.data);
              // Also add to our users list
              setUsers(prev => [...prev, response.data]);
            }
          })
          .catch(err => console.error(`Failed to load user data for ID ${userId}:`, err));
      }
    }
    
    setSelectedUser(chatUser);
    
    // Request most recent messages for this chat
    if (socket && connected && chat._id) {
      // Join the chat room
      joinRoom(chat._id);
      
      // Request latest messages - use optional chaining to safely access _id
      fetchMessages(chatUser._id);
      
      // Mark all unread messages as read
      if (chat.unreadCount && chat.unreadCount > 0) {
        // Update chat unread count in our state
        setChats(prevChats => 
          prevChats.map(c => 
            c._id === chat._id ? { ...c, unreadCount: 0 } : c
          )
        );
      }
    }
    
    // If on mobile, always switch to chat view
    if (isMobile) {
      setMobileView(true);
      setShowChatList(false);
      
      // Add a small delay before scrolling to bottom to ensure chat view is rendered
      setTimeout(() => {
        scrollToBottom();
      }, 300);
    } else {
      // On desktop, just scroll to bottom
      scrollToBottom();
    }
  };

  const getLastMessagePreview = (chat) => {
    if (!chat || !chat.lastMessage) return "No messages yet";
    
    const lastMessage = chat.lastMessage;
    if (lastMessage.type === 'text') {
      return lastMessage.content.length > 25 
        ? lastMessage.content.substring(0, 25) + '...' 
        : lastMessage.content;
    } else if (lastMessage.type === 'image') {
      return "📷 Image";
    } else if (lastMessage.type === 'file') {
      return "📎 File";
    }
    return "New message";
  };

  // Handle typing events and message input changes
  const handleMessageChange = (event) => {
    const value = event.target.value;
    setNewMessage(value);
    
    // Handle typing indicator logic
    if (socket && connected && selectedUser && selectedUser._id && selectedChat) {
      // If not already typing and message is not empty, emit typing start
      if (!isTyping && value.trim() !== '') {
        setIsTyping(true);
        emitEvent('typing', {
          chatId: selectedChat._id,
          userId: user.id,
          isTyping: true
        });
      } 
      // If was typing but message is now empty, emit typing stop
      else if (isTyping && value.trim() === '') {
        setIsTyping(false);
        emitEvent('typing', {
          chatId: selectedChat._id,
          userId: user.id,
          isTyping: false
        });
    }
    
    // Add debounce for typing stop (user has stopped typing for 1.5 seconds)
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping && selectedChat) {
        setIsTyping(false);
        emitEvent('typing', {
          chatId: selectedChat._id,
          userId: user.id,
          isTyping: false
        });
      }
    }, 1500);
    }
  };

  const handleTyping = (event) => {
    // Redirect to the new handleMessageChange function
    handleMessageChange(event);
    
    // Keep any additional logic that might be specific to the handleTyping function
    // but most of it should be moved to handleMessageChange
  };

  const renderMessageStatus = (message) => {
    // Check if message is defined and has a valid sender
    if (!message) return null;
    
    // Check if the sender matches the current user
    const senderId = message.sender?._id || message.sender;
    const currentUserId = user?.id;
    
    if (senderId !== currentUserId) return null;
    
    // Return appropriate icon based on message status
    switch(message.status) {
      case 'read':
      return <DoneAllIcon fontSize="small" color="primary" sx={{ ml: 1, fontSize: '0.8rem' }} />;
      case 'delivered':
      return <DoneAllIcon fontSize="small" sx={{ ml: 1, fontSize: '0.8rem', color: 'grey.500' }} />;
      case 'sending':
      return (
        <CircularProgress 
          size={8} 
          thickness={8} 
          sx={{ ml: 1 }} 
        />
      );
      case 'failed':
      return (
        <Tooltip title="Failed to send. Click to retry.">
          <IconButton 
            size="small" 
            color="error" 
            sx={{ ml: 1, p: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              handleResendMessage(message);
            }}
          >
            <RefreshIcon fontSize="small" sx={{ fontSize: '0.8rem' }} />
          </IconButton>
        </Tooltip>
      );
      default:
      return <DoneIcon fontSize="small" sx={{ ml: 1, fontSize: '0.8rem', color: 'grey.500' }} />;
    }
  };

  const handleResendMessage = (failedMessage) => {
    // Make sure we have a valid token
    const token = localStorage.getItem('token');
    if (!token) {
      setApiError("Authentication token missing. Please login again.");
      console.error("No auth token found for message resending");
      return;
    }
    
    // Remove the failed message
    setMessages(prev => prev.filter(msg => msg._id !== failedMessage._id));
    
    // Get the content from the failed message
    const messageContent = failedMessage.content;
    
    // Create a new temporary message with a unique ID
    const tempId = `temp-${Date.now()}`;
    const messageId = `msg-${Date.now()}`;
    
    const tempMessage = {
      _id: tempId,
      messageId: messageId,
      sender: user,
      recipient: selectedUser,
      content: messageContent,
      createdAt: new Date().toISOString(),
      status: 'sending',
      isTemp: true
    };
    
    // Add the temp message to the messages list
    setMessages(prev => [...prev, tempMessage]);
    
    // Scroll to bottom
    scrollToBottom();
    
    // Emit the socket event for real-time update
    emitEvent('send_message', {
      recipientId: selectedUser._id,
      content: messageContent,
      chatId: selectedChat?._id,
      tempId: tempId,
      messageId: messageId,
      sender: {
        _id: user.id,
        name: user.name
      }
    });
    
    // Ensure the token is set in axios headers
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    console.log("Resending message via API", {
      recipientId: selectedUser._id,
      content: messageContent,
      messageId: messageId,
      token: token ? 'Present' : 'Missing'
    });
    
    // Make the API call to resend
    axios.post(`${API_BASE_URL}/api/messages`, {
      recipient: selectedUser._id,
      content: messageContent,
      messageId: messageId
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (response && response.data) {
        console.log("Resent message API response:", response.data);
        
        // Check if this message already exists in the messages list
        const messageExists = messages.some(msg => 
          (msg.messageId === messageId && msg._id !== tempId) || 
          (response.data._id && msg._id === response.data._id)
        );
        
        if (messageExists) {
          console.log('Resent message already exists in the state, skipping update');
        } else {
          // Replace the temp message with the real one
          setMessages(prev => prev.map(msg => 
            msg._id === tempId ? {...response.data, messageId} : msg
          ));
        }
        
        // Update the chat list to show the latest message
        fetchChats();
        
        // Clear any previous errors
        setApiError(null);
      } else {
        // Handle error
        console.error("No data returned for resent message");
        setMessages(prev => prev.map(msg => 
          msg._id === tempId ? { ...msg, status: 'failed' } : msg
        ));
        setApiError("Failed to resend message: No response data");
      }
    })
    .catch(error => {
      console.error('Error resending message:', error);
      console.error('Error details:', error.response?.data);
      
      // Mark as failed
      setMessages(prev => prev.map(msg => 
        msg._id === tempId ? { ...msg, status: 'failed' } : msg
      ));
      
      if (error.message === 'Network Error') {
        setApiError('Network error: Cannot connect to server. Please check your connection.');
        setConnectionStatus('disconnected');
      } else if (error.response?.status === 401) {
        setApiError('Authentication failed. Please login again.');
        // Try to refresh token
        refreshToken().catch(() => {
          logout(); // Force logout if token refresh fails
        });
      } else {
        setApiError(error.response?.data?.msg || 'Failed to send message. Please try again.');
      }
    });
  };

  // Use a ref to store the createNewChat function
  const createNewChatRef = useRef(null);

  // Define createNewChat first
  const createNewChat = useCallback(async (selectedUserData) => {
    try {
      setLoading(true);
      setApiError(null);
      
      console.log("Creating new chat with user:", selectedUserData);
      
      // Create a new chat with the selected user
      const response = await axios.post(`${API_BASE_URL}/api/chats`, {
        participants: [selectedUserData._id],
        isGroup: false
      });
      
      if (response && response.data) {
        console.log("API returned new chat data:", response.data);
        
        // Ensure the chat data includes the user information
        let chatData = response.data;
        
        // If the API response doesn't include user info, add it manually
        if (!chatData.user) {
          chatData = {
            ...chatData,
            user: selectedUserData
          };
        }
        
        console.log("Processed new chat data:", chatData);
        
        // Add the new chat to the list at the beginning
        setChats(prev => {
          // Check if this chat already exists in the list
          const chatExists = prev.some(chat => chat._id === chatData._id);
          if (chatExists) {
            console.log("Chat already exists in list, not adding duplicate");
            return prev;
          }
          return [chatData, ...prev];
        });
        
        // Select the new chat
        setSelectedChat(chatData);
        setSelectedUser(selectedUserData);
        
        // If on mobile, switch to chat view
        if (isMobile) {
          setMobileView(true);
          setShowChatList(false);
        }
        
        // Fetch all chats again to ensure we have the latest
        setTimeout(() => {
          fetchChats();
        }, 1000);
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
      if (error.response) {
        console.error('Server response:', error.response.data);
      }
      setApiError('Failed to create chat. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, isMobile, fetchChats, setApiError, setChats, setLoading, setMobileView, setSelectedChat, setSelectedUser]);

  // Store the createNewChat function in the ref
  useEffect(() => {
    createNewChatRef.current = createNewChat;
  }, [createNewChat]);

  // Update handleUserSelect to use the ref
  const handleUserSelect = useCallback((selectedUserData) => {
    if (!selectedUserData) return;
    
    console.log("User selected:", selectedUserData);
    setSelectedUser(selectedUserData);
    
    
    // Find if there's an existing chat with this user
    const existingChat = chats.find(chat => {
      if (chat.isGroup) return false;
      
      // Check both the chat.user property and chat.participants array
      const matchesUser = chat.user && chat.user._id === selectedUserData._id;
      const matchesParticipant = chat.participants && 
        chat.participants.some(p => p._id === selectedUserData._id);
      
      return matchesUser || matchesParticipant;
    });
    
    if (existingChat) {
      console.log("Found existing chat:", existingChat);
      // If chat exists, select it
      setSelectedChat(existingChat);
      
      // Fetch messages for this chat
      fetchMessages(selectedUserData._id);
    } else {
      console.log("No existing chat found, creating temporary chat");
      // Create a temporary chat object until a real one is created
      const tempChat = {
        _id: `temp_${selectedUserData._id}`,
        participants: [{ _id: user.id, name: user.name }, selectedUserData],
        user: selectedUserData, // Add user property directly for immediate display
        messages: [],
        unreadCount: 0,
        lastMessage: null,
        isGroup: false
      };
      
      // Set this temporary chat
      setSelectedChat(tempChat);
      
      console.log("Creating new chat with user:", selectedUserData.name);
      // Use the function from the ref
      if (createNewChatRef.current) {
        createNewChatRef.current(selectedUserData);
      }
    }
    
    // If on mobile, switch to chat view
    if (isMobile) {
      setMobileView(true);
      setShowChatList(false);
    }
    
    setActiveTab(0); // Switch back to Chats tab
  }, [chats, isMobile, setActiveTab, setMobileView, setSelectedChat, setSelectedUser, user.id, user.name]);

  const handleAddUserByPhone = (foundUser) => {
    if (foundUser) {
      // Check if we already have a chat with this user
      const existingChat = chats.find(chat => {
        if (chat.isGroup) return false;
        return chat.participants.some(p => p._id === foundUser._id);
      });
      
      if (existingChat) {
        handleUserSelect(foundUser);
      } else {
        createNewChat(foundUser);
      }
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Removed duplicate handleUserSelect function

  // Handle chat deletion
  const handleDeleteChat = async () => {
    if (!chatToDelete) return;
    
    try {
      setLoading(true);
      console.log('Attempting to delete chat with ID:', chatToDelete._id);
      
      // Try to refresh token before deleting
      try {
        await refreshToken();
        console.log("Token refreshed before delete operation");
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Continue with existing token if refresh fails
      }
      
      // Call API to delete the chat
      const response = await axios.delete(`${API_BASE_URL}/api/chats/${chatToDelete._id}`);
      
      console.log('Delete response:', response.data);
      
      // Only proceed if we got a successful response
      if (response && response.status === 200) {
        // If the deleted chat is currently selected, clear the selection
        if (selectedChat && selectedChat._id === chatToDelete._id) {
          setSelectedChat(null);
          setSelectedUser(null);
          setMessages([]);
        }
        
        // Remove the chat from the list
        setChats(prevChats => prevChats.filter(chat => chat._id !== chatToDelete._id));
        
        // Clear any previous errors
        setApiError(null);
      } else {
        throw new Error('Server returned an unsuccessful status code');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      let errorMessage = 'Failed to delete chat. Please try again later.';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Server error response:', error.response.data);
        console.error('Status code:', error.response.status);
        
        if (error.response.status === 401) {
          // Try to refresh token one more time with forced re-login
          try {
            await refreshToken();
            // If token refresh succeeds, try the delete operation again
            handleDeleteChat();
            return;
          } catch (refreshError) {
            // Token refresh failed, need to log in again
            errorMessage = 'Your session has expired. Please log in again.';
            logout(); // Force logout if we can't refresh the token
          }
        } else {
          errorMessage = error.response.data.msg || errorMessage;
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        errorMessage = 'No response from server. Check your connection.';
      }
      
      setApiError(errorMessage);
    } finally {
      setLoading(false);
      // Always close the dialog regardless of success/failure
      setDeleteDialogOpen(false);
      setChatToDelete(null);
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (event, chat) => {
    // Stop event propagation to prevent selecting the chat
    event.stopPropagation();
    
    setChatToDelete(chat);
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setChatToDelete(null);
  };

  // Function to go back to the chat list on mobile
  const handleBackClick = () => {
    setSelectedChat(null);
    setShowChatList(true);
  };

  const handleInitiateCall = (recipientUser, callType = 'video') => {
    // Set call data
    setCurrentCall({
      recipient: recipientUser,
      callType
    });
    
    // Show call modal
    setCallModalOpen(true);
    
    // Emit call initiation event
    emitEvent('initiate_call', {
      to: recipientUser._id,
      from: user.id,
      callerName: user.name,
      callerPicture: user.profilePicture,
      callType
    });
  };

  const handleCallEnd = () => {
    // Close call modal
    setCallModalOpen(false);
    
    // Cleanup any media streams
    if (window.localStream) {
      console.log("Cleaning up media streams after call ended");
      window.localStream.getTracks().forEach(track => {
        track.stop();
      });
      window.localStream = null;
    }
    
    // Clear call data
    setCurrentCall(null);
  };

  // Handle notification settings change
  const handleNotificationSettingChange = (setting) => (event) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: event.target.checked
    }));
    
    // Save settings to localStorage for persistence
    localStorage.setItem('notificationSettings', JSON.stringify({
      ...notificationSettings,
      [setting]: event.target.checked
    }));
  };
  
  // Load notification settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setNotificationSettings(parsedSettings);
      } catch (error) {
        console.error('Error parsing notification settings:', error);
      }
    }
  }, []);

  // Update mobile view on resize
  useEffect(() => {
    const handleResize = () => {
      setMobileView(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Handle mobile chat selection
  useEffect(() => {
    if (mobileView && selectedChat) {
      setShowChatList(false);
    } else if (!mobileView) {
      setShowChatList(true);
    }
  }, [selectedChat, mobileView]);

  // If connection is down, show connection error
  if (connectionStatus === 'disconnected') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: 2 }}>
        <Typography variant="h5" color="error">Server Connection Error</Typography>
        <Typography>Cannot connect to the chat server. Please check your internet connection and try again.</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<RefreshIcon />}
          onClick={retryConnection}
        >
          Retry Connection
        </Button>
      </Box>
    );
  }

  // If connecting, show loading
  if (connectionStatus === 'connecting') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Connecting to server...</Typography>
      </Box>
    );
  }

  // If user is not defined or loading, show loading
  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading user data...</Typography>
      </Box>
    );
  }

  // Handle messages from ChatInputMobile component
  const handleMobileMessageSent = (messageData) => {
    // Add the message to our state
    console.log("Received message from mobile input:", messageData);
    
    // Make sure the message has all needed properties
    const completeMessage = {
      ...messageData,
      _id: messageData.tempId, // Ensure _id is set for UI rendering
      sender: messageData.sender || user, // Ensure sender is set
      status: 'sending',
      isSent: false
    };
    
    // Add to messages immediately for instant UI feedback
    setMessages(prevMessages => [...prevMessages, completeMessage]);
    
    // Scroll to bottom to show new message immediately
        requestAnimationFrame(() => {
          scrollToBottom();
    });
    
    // Also try to send via API for reliability
    sendMessageViaAPI(messageData.content, messageData.tempId);
  };
  
  // Send message via API (used as backup)
  const sendMessageViaAPI = async (content, tempId) => {
    if (!selectedUser || !content) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      setApiError("Authentication token missing. Please login again.");
      return;
    }
    
    try {
      // Ensure auth token is set in headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await axios.post(`${API_BASE_URL}/api/messages`, {
        recipient: selectedUser._id,
        content: content,
        chatId: selectedChat?._id,
        messageId: tempId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data) {
        console.log("API response for message:", response.data);
        
        // Replace the temporary message with the real one from the server
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg._id === tempId || msg.tempId === tempId 
              ? {...response.data, status: 'sent', isSent: true} 
              : msg
          )
        );
        
        // Update chats list to show the latest message
          fetchChats();
      }
    } catch (error) {
      console.error("Error sending message via API:", error);
    }
  };

  // Remove the renderSidebar function that was causing issues
  
  // Keep the original return statement that appears after the renderSidebar function
      return (
    <Box sx={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* App Header */}
      <AppBar 
        position={isMobile ? "fixed" : "static"} 
        color="primary"
        sx={isMobile ? { zIndex: 1200 } : {}}
      >
        <Toolbar>
          {mobileView === 'chat' && selectedChat && (
            <IconButton edge="start" color="inherit" onClick={handleBackClick}>
              <ArrowBackIcon />
            </IconButton>
          )}
          
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {mobileView === 'chat' && selectedChat ? 
              users.find(u => u._id === selectedChat.participants.find(p => p !== user.id))?.name || 'Chat' : 
              'Messages'
            }
          </Typography>
          
          <IconButton color="inherit" onClick={() => setNotificationSettingsOpen(true)}>
            <SettingsIcon />
          </IconButton>
          
          {isMobile && (
            <Fab 
              color="primary" 
              aria-label="add chat"
              onClick={() => setOpenAddByPhone(true)}
              sx={{ 
                position: 'absolute', 
                bottom: 20, 
                right: 20, 
                zIndex: 1000 
              }}
            >
              <PersonAddIcon />
            </Fab>
          )}
        </Toolbar>
      </AppBar>
        
        {/* Add padding when header is fixed on mobile */}
        {isMobile && <Box sx={{ height: '64px' }} />}
        
        {/* Main Content */}
        <Grid container sx={{ flexGrow: 1, overflow: 'hidden' }}>
          {/* Left column - Chats and Users list - Hidden on mobile when viewing a chat */}
          <Grid 
            item 
            xs={12} 
            md={4} 
            sx={{ 
              height: '100%', 
              borderRight: '1px solid #e0e0e0',
              display: isMobile && mobileView === 'chat' ? 'none' : 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Tabs for switching between chats and users */}
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              indicatorColor="primary"
              textColor="primary"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Chats" icon={<ChatIcon />} iconPosition="start" />
              <Tab label="Users" icon={<PersonIcon />} iconPosition="start" />
            </Tabs>
            
            {/* Search input (optional) */}
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
              <TextField
                fullWidth
                size="small"
                placeholder={activeTab === 0 ? "Search chats..." : "Search users..."}
                variant="outlined"
                sx={{ mb: 1 }}
              />
            </Box>
            
            {/* Content area - scrollable */}
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {/* Chats Tab */}
            <div
              role="tabpanel"
              hidden={activeTab !== 0}
              id="chats-tabpanel"
              aria-labelledby="chats-tab"
              style={{ height: '100%' }}
            >
              {activeTab === 0 && (
                loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
                    <CircularProgress />
                    </Box>
                  ) : chats.length === 0 ? (
                  <Box sx={{ textAlign: 'center', p: 4 }}>
                    <Typography color="textSecondary">
                      {t('No chats found. Start a new conversation!')}
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={() => setOpenAddByPhone(true)}
                      sx={{ mt: 2 }}
                    >
                      {t('New Chat')}
                    </Button>
                    </Box>
                  ) : (
                  <List sx={{ p: 0 }}>
                    {chats.map(chat => {
                      // Enhanced user resolution logic
                      let otherUser = null;
                      
                      // If chat has a user object directly
                      if (chat.user && chat.user._id !== user.id) {
                        otherUser = chat.user;
                      } 
                      // Otherwise try to find the other participant
                      else if (chat.participants && chat.participants.length > 0) {
                        // Handle both object participants and ID-only participants
                        const otherParticipantId = chat.participants.find(p => {
                          if (typeof p === 'object') return p._id !== user.id;
                          return p !== user.id;
                        });
                        
                        if (otherParticipantId) {
                          // Find in users array
                          const participantId = typeof otherParticipantId === 'object' 
                            ? otherParticipantId._id 
                            : otherParticipantId;
                            
                          otherUser = users.find(u => u._id === participantId);
                          
                          // If not found in users array but participant is an object, use it directly
                          if (!otherUser && typeof otherParticipantId === 'object') {
                            otherUser = otherParticipantId;
                          }
                        }
                      }
                      
                      // If still no user found, create a minimal fallback 
                      if (!otherUser) {
                        const chatId = chat._id;
                        console.log(`Cannot resolve user for chat ${chatId}, creating fallback`);
                        
                        // Create a temporary user object with minimally viable data
                        otherUser = {
                          _id: chat.userId || chat._id,
                          name: chat.name || `Contact ${chat._id.substring(0, 5)}`,
                          isOnline: false
                        };
                      }
                      
                      const isSelected = selectedChat && selectedChat._id === chat._id;
                      
                      return (
                        <ListItem
                          key={chat._id}
                          button
                          onClick={() => handleChatSelect(chat, otherUser)}
                          selected={isSelected}
                          className="menu-item"
                          sx={{
                            borderLeft: isSelected ? '3px solid' : '3px solid transparent', 
                            borderColor: isSelected ? 'primary.main' : 'transparent',
                            bgcolor: isSelected ? 'action.selected' : 'transparent'
                          }}
                        >
                          <ListItemAvatar>
                            <Badge
                              overlap="circular"
                              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                              variant="dot"
                              color={otherUser?.isOnline ? "success" : "default"}
                            >
                              <Avatar src={otherUser?.profilePicture ? getImageUrl(otherUser.profilePicture) : ''}>
                                {otherUser?.name ? otherUser.name.charAt(0) : '?'}
                              </Avatar>
                            </Badge>
                          </ListItemAvatar>
                          <ListItemText
                            primary={otherUser?.name || `Contact ${chat._id.substring(0, 5)}`}
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary" 
                                  sx={{ 
                                    maxWidth: '200px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {getLastMessagePreview(chat)}
                                </Typography>
                              </Box>
                            }
                          />
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '60px' }}>
                            {chat.lastMessage?.createdAt && (
                              <Typography variant="caption" color="text.secondary">
                                {format(new Date(chat.lastMessage.createdAt))}
                              </Typography>
                            )}
                            {chat.unreadCount > 0 && (
                              <Box
                                sx={{
                                  mt: 0.5,
                                  minWidth: '20px',
                                  height: '20px',
                                  borderRadius: '10px',
                                  backgroundColor: 'primary.main',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  px: 0.8
                                }}
                              >
                                {chat.unreadCount}
                              </Box>
                            )}
                          </Box>
                        </ListItem>
                      );
                    })}
                </List>
                )
              )}
            </div>

            {/* Users Tab */}
            <div
              role="tabpanel"
              hidden={activeTab !== 1}
              id="users-tabpanel"
              aria-labelledby="users-tab"
              style={{ height: '100%' }}
            >
                  {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
                    <CircularProgress />
                    </Box>
                  ) : users.length === 0 ? (
                  <Box sx={{ textAlign: 'center', p: 4 }}>
                    <Typography color="textSecondary">
                      {t('No users found')}
                    </Typography>
                    </Box>
                  ) : (
                  <List sx={{ p: 0 }}>
                    {users.filter(u => u._id !== user.id).map(u => (
                      <ListItem
                        key={u._id}
                        button
                        onClick={() => handleUserSelect(u)}
                        className="menu-item"
                      >
                        <ListItemAvatar>
                          <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            variant="dot"
                            color={u.isOnline ? "success" : "default"}
                          >
                            <Avatar src={u.profilePicture ? getImageUrl(u.profilePicture) : ''}>
                              {u.name ? u.name.charAt(0) : '?'}
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={u.name}
                          secondary={u.isOnline ? t('Online') : t('Offline')}
                        />
                      </ListItem>
                    ))}
                </List>
              )}
              </div>
            )}
          </Box>
          </Grid>
          
        {/* Right column - Chat area */}
          <Grid 
            item 
            xs={12} 
            md={8} 
            sx={{ 
              height: '100%',
              display: (!isMobile || mobileView === 'chat') ? 'block' : 'none',
              position: isMobile ? 'relative' : 'static'
            }}
          >
          {selectedChat && selectedUser ? (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Chat header */}
              <Box sx={{ 
                p: 2, 
                display: 'flex', 
                alignItems: 'center', 
                borderBottom: 1, 
                borderColor: 'divider',
                bgcolor: 'background.paper'
              }}>
                <Avatar 
                  src={selectedUser.profilePicture ? getImageUrl(selectedUser.profilePicture) : ''} 
                  sx={{ mr: 2 }}
                >
                  {selectedUser.name?.charAt(0) || '?'}
                      </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6">{selectedUser.name || t('Unknown User')}</Typography>
                        <Typography variant="body2" color="text.secondary">
                    {selectedUser.isOnline ? t('Online') : t('Offline')}
                        </Typography>
                      </Box>
                {!isMobile && (
                    <Box>
                    <IconButton onClick={() => handleInitiateCall('audio')}>
                          <CallIcon />
                        </IconButton>
                    <IconButton onClick={() => handleInitiateCall('video')}>
                          <VideocamIcon />
                        </IconButton>
                    <IconButton onClick={(e) => openDeleteDialog(e, selectedChat)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                )}
              </Box>
                
              {/* Messages area */}
              <Box sx={{ 
                    flexGrow: 1, 
                    p: 2,
                overflow: 'auto',
                    display: 'flex',
                flexDirection: 'column'
              }}>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <CircularProgress />
                    </Box>
                  ) : messages.length === 0 ? (
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      height: '100%', 
                      color: 'text.secondary' 
                    }}>
                    <Typography>{t('No messages yet. Start a conversation!')}</Typography>
                    </Box>
                  ) : (
                  messages.map(message => {
                        const isFromMe = message.sender?._id === user.id || message.sender === user.id;
                        const messageKey = `msg-${message._id || message.tempId}-${isFromMe ? 'sent' : 'received'}-${message.createdAt}`;
                        
                        return (
                          <Box 
                            key={messageKey}
                            sx={{ 
                              display: 'flex',
                          justifyContent: isFromMe ? 'flex-end' : 'flex-start',
                          mb: 2
                            }}
                          >
                            {!isFromMe && (
                          <Avatar
                            src={selectedUser.profilePicture ? getImageUrl(selectedUser.profilePicture) : ''}
                            sx={{ mr: 1, width: 32, height: 32 }}
                          >
                            {selectedUser.name?.charAt(0) || '?'}
                          </Avatar>
                        )}
                        <Box
                              sx={{ 
                            maxWidth: '70%',
                            p: 2,
                            borderRadius: isFromMe ? '15px 15px 0 15px' : '15px 15px 15px 0',
                            bgcolor: isFromMe ? 'primary.main' : 'background.paper',
                            color: isFromMe ? 'white' : 'text.primary',
                            boxShadow: 1,
                            position: 'relative'
                          }}
                            >
                              <Typography variant="body1">{message.content}</Typography>
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                            justifyContent: 'flex-end',
                            mt: 1,
                            opacity: 0.8,
                            fontSize: '0.75rem'
                          }}>
                            <Typography variant="caption">
                              {message.createdAt ? format(new Date(message.createdAt), 'p') : ''}
                                </Typography>
                            {isFromMe && renderMessageStatus(message)}
                              </Box>
                        </Box>
                          </Box>
                        );
                  })
                )}
                <div ref={messagesEndRef} /> {/* Scroll anchor */}
                </Box>
                
                {/* Use the new MessageInput component */}
                <MessageInput
                          value={newMessage}
                          onChange={handleTyping}
                  onSend={handleSendMessage}
                  disabled={connectionStatus !== 'connected' || !selectedUser}
                  placeholder={t('Type a message...')}
                  isMobile={isMobile}
                />
              </Box>
            ) : (
              <Box sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 3,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                textAlign: 'center'
              }}>
                <ChatIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2, opacity: 0.7 }} />
              <Typography variant="h5" gutterBottom>{t('Welcome to Chat App')}</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mb: 3 }}>
                {t('Select a chat from the sidebar or find a user to start messaging.')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    variant="contained" 
                    startIcon={<PersonIcon />}
                  onClick={() => setActiveTab(1)}
                >
                  {t('Browse Users')}
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<PhoneIcon />}
                    onClick={() => setOpenAddByPhone(true)}
                  >
                  {t('Add by Phone')}
                  </Button>
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>

      {/* Keep existing modals, dialogs, etc. outside the Grid container */}

        {/* Delete Chat Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={closeDeleteDialog}
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
        >
        <DialogTitle id="delete-dialog-title">
          Delete Chat
        </DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this chat? This action cannot be undone and all messages will be permanently deleted.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDeleteDialog} color="primary">
              Cancel
            </Button>
          <Button onClick={handleDeleteChat} color="error" autoFocus>
            Delete
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Mobile Navigation Bar */}
        {isMobile && (
          <MobileNavBar 
            user={user}
            unreadCount={chats.reduce((total, chat) => total + (chat.unreadCount || 0), 0)}
            notificationCount={0}
            activeTab={activeTab} 
            onTabChange={(newTab) => {
              setActiveTab(newTab);
              // If switching to chats tab and in mobile chat view, go back to list
              if (newTab === 0 && mobileView === 'chat') {
                setMobileView('list');
              }
              // Open notifications settings for tab 1
              if (newTab === 1) {
                setNotificationSettingsOpen(true);
              }
            }}
            onSearchClick={() => setOpenAddByPhone(true)}
            onProfileClick={() => {
              // Create an anchor element for the menu
              const btn = document.createElement('button');
              btn.id = 'temp-profile-btn';
              btn.style.position = 'absolute';
              btn.style.bottom = '56px';
              btn.style.right = '10%';
              document.body.appendChild(btn);
              
              // Open profile menu anchored to this element
              setProfileMenuOpen(true);
              
              // Clean up after menu closes
              setTimeout(() => {
                if (document.body.contains(btn)) {
                  document.body.removeChild(btn);
                }
              }, 500);
            }}
          />
        )}
      </Box>
  );
}; // Closing the Chat component

export default Chat; 
