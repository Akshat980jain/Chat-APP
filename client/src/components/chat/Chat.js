import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import ProfilePicture from '../profile/ProfilePicture';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import AddChatByPhone from './AddChatByPhone';

// Performance optimizations
const MESSAGES_PER_PAGE = 50;
const DEBOUNCE_DELAY = 300;
const TYPING_TIMEOUT = 1000;

const Chat = () => {
  // Core state
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  // UI state
  const [activeTab, setActiveTab] = useState('chats');
  const [mobileView, setMobileView] = useState('chats');
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddChatModal, setShowAddChatModal] = useState(false);
  
  // Performance state
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [messageCache, setMessageCache] = useState(new Map());
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [messagesPage, setMessagesPage] = useState(1);
  
  // Refs
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageInputRef = useRef(null);
  const abortControllerRef = useRef(null);
  
  const { user } = useAuth();
  const { socket, connected: isConnected } = useSocket();
  const isMobile = window.innerWidth <= 768;

  // Memoized API URL
  const apiUrl = useMemo(() => {
    return localStorage.getItem('api_url') || process.env.REACT_APP_API_URL || 'http://localhost:5000';
  }, []);

  // Memoized filtered chats
  const filteredChats = useMemo(() => {
    if (!searchQuery) return chats;
    
    return chats.filter(chat => {
      const otherUser = chat.participants?.find(p => p._id !== user?.id);
      return otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             chat.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [chats, searchQuery, user?.id]);

  // Memoized filtered users
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    
    return users.filter(u => 
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  // Optimized API request function
  const makeApiRequest = useCallback(async (url, options = {}) => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios({
        url: `${apiUrl}${url}`,
        signal: abortControllerRef.current.signal,
        timeout: 10000,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      return response.data;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
        return null;
      }
      throw error;
    }
  }, [apiUrl]);

  // Optimized fetch chats
  const fetchChats = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError('');
      
      const data = await makeApiRequest('/api/chats');
      if (data) {
        setChats(data);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      setError('Failed to load chats');
      toast.error('Failed to load chats');
    } finally {
      setLoading(false);
    }
  }, [user?.id, makeApiRequest]);

  // Optimized fetch users
  const fetchUsers = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const data = await makeApiRequest('/api/users');
      if (data) {
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    }
  }, [user?.id, makeApiRequest]);

  // Optimized fetch messages with pagination
  const fetchMessages = useCallback(async (chatId, page = 1, append = false) => {
    if (!chatId || !user?.id) return;
    
    // Check cache first
    const cacheKey = `${chatId}-${page}`;
    if (messageCache.has(cacheKey) && !append) {
      setMessages(messageCache.get(cacheKey));
      return;
    }
    
    try {
      setMessagesLoading(true);
      
      const otherUser = selectedChat?.participants?.find(p => p._id !== user.id);
      if (!otherUser) return;
      
      const data = await makeApiRequest(`/api/messages/${otherUser._id}?page=${page}&limit=${MESSAGES_PER_PAGE}`);
      
      if (data) {
        const newMessages = Array.isArray(data) ? data : data.messages || [];
        
        // Cache the messages
        messageCache.set(cacheKey, newMessages);
        
        if (append && page > 1) {
          setMessages(prev => [...newMessages, ...prev]);
        } else {
          setMessages(newMessages);
        }
        
        setHasMoreMessages(newMessages.length === MESSAGES_PER_PAGE);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  }, [user?.id, selectedChat, makeApiRequest, messageCache]);

  // Optimized send message
  const sendMessage = useCallback(async (content) => {
    if (!content?.trim() || !selectedChat || !user?.id) return;
    
    const otherUser = selectedChat.participants?.find(p => p._id !== user.id);
    if (!otherUser) return;
    
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Optimistic UI update
    const optimisticMessage = {
      _id: tempId,
      sender: {
        _id: user.id,
        name: user.name,
        profilePicture: user.profilePicture
      },
      recipient: {
        _id: otherUser._id
      },
      content: content.trim(),
      createdAt: new Date().toISOString(),
      status: 'sending',
      tempId
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    
    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    
    try {
      // Send via socket first for real-time delivery
      if (socket && isConnected) {
        socket.emit('send_message', {
          tempId,
          messageId,
          chatId: selectedChat._id,
          recipientId: otherUser._id,
          senderId: user.id,
          content: content.trim(),
          timestamp: new Date().toISOString()
        });
      }
      
      // Also send via API for persistence
      const data = await makeApiRequest('/api/messages', {
        method: 'POST',
        data: {
          recipient: otherUser._id,
          content: content.trim(),
          messageId
        }
      });
      
      if (data) {
        // Update the optimistic message with real data
        setMessages(prev => prev.map(msg => 
          msg.tempId === tempId ? { ...data, status: 'sent' } : msg
        ));
        
        // Update chat list
        fetchChats();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update message status to failed
      setMessages(prev => prev.map(msg => 
        msg.tempId === tempId ? { ...msg, status: 'failed' } : msg
      ));
      
      toast.error('Failed to send message');
    }
  }, [selectedChat, user, socket, isConnected, makeApiRequest, fetchChats]);

  // Optimized typing handler
  const handleTyping = useCallback(() => {
    if (!socket || !isConnected || !selectedChat) return;
    
    const otherUser = selectedChat.participants?.find(p => p._id !== user?.id);
    if (!otherUser) return;
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Emit typing start
    socket.emit('typing_start', {
      chatId: selectedChat._id,
      recipientId: otherUser._id
    });
    
    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_end', {
        chatId: selectedChat._id,
        recipientId: otherUser._id
      });
    }, TYPING_TIMEOUT);
  }, [socket, isConnected, selectedChat, user?.id]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((query) => {
      setSearchQuery(query);
    }, DEBOUNCE_DELAY),
    []
  );

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    const handleReceiveMessage = (messageData) => {
      console.log('Received message via socket:', messageData);
      
      // Add to messages if it's for the current chat
      if (selectedChat && (
        messageData.chatId === selectedChat._id ||
        (messageData.sender._id === selectedChat.participants?.find(p => p._id !== user?.id)?._id)
      )) {
        setMessages(prev => {
          // Avoid duplicates
          const exists = prev.some(msg => 
            msg._id === messageData._id || 
            msg.tempId === messageData.tempId
          );
          
          if (exists) return prev;
          return [...prev, messageData];
        });
        
        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
      
      // Update chat list
      fetchChats();
    };
    
    const handleTypingIndicator = (data) => {
      const { userId, isTyping } = data;
      
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (isTyping) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    };
    
    const handleUserStatus = (data) => {
      const { userId, status } = data;
      
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (status === 'online') {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
      
      // Update users list
      setUsers(prev => prev.map(u => 
        u._id === userId ? { ...u, isOnline: status === 'online' } : u
      ));
    };
    
    const handleMessageDelivered = (data) => {
      const { tempId, status } = data;
      
      setMessages(prev => prev.map(msg => 
        msg.tempId === tempId ? { ...msg, status } : msg
      ));
    };
    
    // Register socket listeners
    socket.on('receive_message', handleReceiveMessage);
    socket.on('typing_indicator', handleTypingIndicator);
    socket.on('user_status', handleUserStatus);
    socket.on('message_delivered', handleMessageDelivered);
    
    // Cleanup
    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('typing_indicator', handleTypingIndicator);
      socket.off('user_status', handleUserStatus);
      socket.off('message_delivered', handleMessageDelivered);
    };
  }, [socket, isConnected, selectedChat, user?.id, fetchChats]);

  // Initialize data
  useEffect(() => {
    if (user?.id) {
      fetchChats();
      fetchUsers();
      
      // Connect user to socket
      if (socket && isConnected) {
        socket.emit('user_connected', user.id);
      }
    }
  }, [user?.id, socket, isConnected, fetchChats, fetchUsers]);

  // Load messages when chat is selected
  useEffect(() => {
    if (selectedChat) {
      setMessages([]);
      setMessagesPage(1);
      setHasMoreMessages(true);
      fetchMessages(selectedChat._id, 1);
      
      // Join chat room
      if (socket && isConnected) {
        socket.emit('join_chat', selectedChat._id);
      }
    }
  }, [selectedChat, socket, isConnected, fetchMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Optimized chat selection
  const handleChatSelect = useCallback((chat) => {
    setSelectedChat(chat);
    setError('');
    
    if (isMobile) {
      setMobileView('chat');
    }
    
    // Clear message cache for this chat to ensure fresh data
    const chatCacheKeys = Array.from(messageCache.keys()).filter(key => 
      key.startsWith(`${chat._id}-`)
    );
    chatCacheKeys.forEach(key => messageCache.delete(key));
  }, [isMobile, messageCache]);

  // Optimized user selection
  const handleUserSelect = useCallback(async (selectedUser) => {
    try {
      setLoading(true);
      
      // Check if chat already exists
      const existingChat = chats.find(chat => 
        chat.participants?.some(p => p._id === selectedUser._id)
      );
      
      if (existingChat) {
        handleChatSelect(existingChat);
      } else {
        // Create new chat
        const data = await makeApiRequest('/api/chats', {
          method: 'POST',
          data: { participantId: selectedUser._id }
        });
        
        if (data) {
          setChats(prev => [data, ...prev]);
          handleChatSelect(data);
        }
      }
      
      if (isMobile) {
        setMobileView('chat');
      }
    } catch (error) {
      console.error('Error selecting user:', error);
      toast.error('Failed to start chat');
    } finally {
      setLoading(false);
    }
  }, [chats, handleChatSelect, isMobile, makeApiRequest]);

  // Optimized add chat by phone
  const handleAddChatByPhone = useCallback(async (userData) => {
    try {
      setLoading(true);
      
      if (typeof userData === 'string') {
        // Phone number provided, search for user
        const foundUser = await makeApiRequest(`/api/users/search/phone/${userData}`);
        if (foundUser) {
          await handleUserSelect(foundUser);
        }
      } else {
        // User object provided
        await handleUserSelect(userData);
      }
      
      setShowAddChatModal(false);
    } catch (error) {
      console.error('Error adding chat:', error);
      toast.error('Failed to add chat');
    } finally {
      setLoading(false);
    }
  }, [handleUserSelect, makeApiRequest]);

  // Optimized message input change
  const handleMessageInputChange = useCallback((e) => {
    const value = e.target.value;
    setNewMessage(value);
    
    // Handle typing indicator
    if (value.trim() && selectedChat) {
      handleTyping();
    }
  }, [selectedChat, handleTyping]);

  // Optimized message send
  const handleSendMessage = useCallback((content) => {
    if (content?.trim()) {
      sendMessage(content);
    }
  }, [sendMessage]);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!hasMoreMessages || messagesLoading || !selectedChat) return;
    
    const nextPage = messagesPage + 1;
    await fetchMessages(selectedChat._id, nextPage, true);
    setMessagesPage(nextPage);
  }, [hasMoreMessages, messagesLoading, selectedChat, messagesPage, fetchMessages]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    if (container.scrollTop === 0 && hasMoreMessages && !messagesLoading) {
      loadMoreMessages();
    }
  }, [hasMoreMessages, messagesLoading, loadMoreMessages]);

  // Format message time
  const formatMessageTime = useCallback((timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      
      if (now.toDateString() === date.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return '';
    }
  }, []);

  // Get other user from chat
  const getOtherUser = useCallback((chat) => {
    return chat?.participants?.find(p => p._id !== user?.id);
  }, [user?.id]);

  // Render chat item
  const renderChatItem = useCallback((chat) => {
    const otherUser = getOtherUser(chat);
    if (!otherUser) return null;
    
    const isActive = selectedChat?._id === chat._id;
    const isOnline = onlineUsers.has(otherUser._id);
    
    return (
      <div
        key={chat._id}
        className={`chat-item p-3 rounded-lg cursor-pointer transition-all duration-200 ${
          isActive 
            ? 'bg-primary-50 dark:bg-primary-900/30 border-l-4 border-primary-500' 
            : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
        }`}
        onClick={() => handleChatSelect(chat)}
      >
        <div className="flex items-center space-x-3">
          <ProfilePicture
            userId={otherUser._id}
            name={otherUser.name}
            imageUrl={otherUser.profilePicture}
            isOnline={isOnline}
            size="md"
            showStatus={true}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-neutral-900 dark:text-white truncate">
                {otherUser.name}
              </h3>
              {chat.lastMessage && (
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {formatMessageTime(chat.lastMessage.createdAt)}
                </span>
              )}
            </div>
            {chat.lastMessage && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                {chat.lastMessage.content}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }, [selectedChat, onlineUsers, getOtherUser, handleChatSelect, formatMessageTime]);

  // Render user item
  const renderUserItem = useCallback((userData) => {
    const isOnline = onlineUsers.has(userData._id);
    
    return (
      <div
        key={userData._id}
        className="user-item p-3 rounded-lg cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
        onClick={() => handleUserSelect(userData)}
      >
        <div className="flex items-center space-x-3">
          <ProfilePicture
            userId={userData._id}
            name={userData.name}
            imageUrl={userData.profilePicture}
            isOnline={isOnline}
            size="md"
            showStatus={true}
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-neutral-900 dark:text-white truncate">
              {userData.name}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
              {userData.email}
            </p>
          </div>
        </div>
      </div>
    );
  }, [onlineUsers, handleUserSelect]);

  // Render message
  const renderMessage = useCallback((message) => {
    const isOwn = message.sender?._id === user?.id;
    const showAvatar = !isOwn;
    
    return (
      <div
        key={message._id || message.tempId}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
      >
        {showAvatar && (
          <ProfilePicture
            userId={message.sender?._id}
            name={message.sender?.name}
            imageUrl={message.sender?.profilePicture}
            size="sm"
            showStatus={false}
            className="mr-2"
          />
        )}
        <div
          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
            isOwn
              ? 'bg-primary-500 text-white rounded-br-md'
              : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-bl-md'
          } shadow-sm`}
        >
          <p className="text-sm">{message.content}</p>
          <div className="flex items-center justify-end mt-1 space-x-1">
            <span className="text-xs opacity-75">
              {formatMessageTime(message.createdAt)}
            </span>
            {isOwn && (
              <span className="text-xs opacity-75">
                {message.status === 'sending' && '⏳'}
                {message.status === 'sent' && '✓'}
                {message.status === 'delivered' && '✓✓'}
                {message.status === 'read' && '✓✓'}
                {message.status === 'failed' && '❌'}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }, [user?.id, formatMessageTime]);

  // Mobile back handler
  const handleMobileBack = useCallback(() => {
    setMobileView('chats');
    setSelectedChat(null);
  }, []);

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
      isConnected 
        ? 'bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-400' 
        : 'bg-error-50 text-error-700 dark:bg-error-900/20 dark:text-error-400'
    }`}>
      <div className={`w-2 h-2 rounded-full ${
        isConnected ? 'bg-success-500 animate-pulse' : 'bg-error-500'
      }`} />
      <span className="text-sm font-medium">
        {isConnected ? 'Connected' : 'Reconnecting...'}
      </span>
    </div>
  );

  // Main render
  return (
    <div className="h-screen flex bg-neutral-50 dark:bg-neutral-900 overflow-hidden">
      {/* Sidebar - Chats and Users */}
      <div className={`${
        isMobile 
          ? mobileView === 'chats' ? 'w-full' : 'hidden'
          : 'w-80 border-r border-neutral-200 dark:border-neutral-800'
      } bg-white dark:bg-neutral-900 flex flex-col`}>
        
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white">
              Modern Chat
            </h1>
            <button
              onClick={() => setShowAddChatModal(true)}
              className="p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors"
              aria-label="Add new chat"
            >
              <i className="bi bi-plus-lg"></i>
            </button>
          </div>
          
          {/* Connection Status */}
          <ConnectionStatus />
          
          {/* Search */}
          <div className="mt-3">
            <input
              type="text"
              placeholder="Search chats and users..."
              className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </div>
          
          {/* Tabs */}
          <div className="flex mt-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
            <button
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'chats'
                  ? 'bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
              onClick={() => setActiveTab('chats')}
            >
              Chats ({filteredChats.length})
            </button>
            <button
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
              onClick={() => setActiveTab('users')}
            >
              Users ({filteredUsers.length})
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-error-600 dark:text-error-400">
              {error}
              <button
                onClick={() => {
                  setError('');
                  fetchChats();
                  fetchUsers();
                }}
                className="block mx-auto mt-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="p-2">
              {activeTab === 'chats' ? (
                filteredChats.length > 0 ? (
                  <div className="space-y-1">
                    {filteredChats.map(renderChatItem)}
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                    <i className="bi bi-chat-dots text-4xl mb-2 block"></i>
                    <p>No chats yet</p>
                    <p className="text-sm">Start a conversation!</p>
                  </div>
                )
              ) : (
                filteredUsers.length > 0 ? (
                  <div className="space-y-1">
                    {filteredUsers.map(renderUserItem)}
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                    <i className="bi bi-people text-4xl mb-2 block"></i>
                    <p>No users found</p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Main Chat Area */}
      <div className={`${
        isMobile 
          ? mobileView === 'chat' ? 'w-full' : 'hidden'
          : 'flex-1'
      } flex flex-col bg-neutral-50 dark:bg-neutral-900`}>
        
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center space-x-3">
                {isMobile && (
                  <button
                    onClick={handleMobileBack}
                    className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
                  >
                    <i className="bi bi-arrow-left"></i>
                  </button>
                )}
                
                {(() => {
                  const otherUser = getOtherUser(selectedChat);
                  if (!otherUser) return null;
                  
                  return (
                    <>
                      <ProfilePicture
                        userId={otherUser._id}
                        name={otherUser.name}
                        imageUrl={otherUser.profilePicture}
                        isOnline={onlineUsers.has(otherUser._id)}
                        size="md"
                        showStatus={true}
                      />
                      <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-neutral-900 dark:text-white truncate">
                          {otherUser.name}
                        </h2>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {onlineUsers.has(otherUser._id) ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
            
            {/* Messages */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
              onScroll={handleScroll}
            >
              {messagesLoading && messagesPage === 1 && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                </div>
              )}
              
              {hasMoreMessages && messagesPage > 1 && (
                <div className="text-center py-2">
                  <button
                    onClick={loadMoreMessages}
                    disabled={messagesLoading}
                    className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors disabled:opacity-50"
                  >
                    {messagesLoading ? 'Loading...' : 'Load more messages'}
                  </button>
                </div>
              )}
              
              {messages.map(renderMessage)}
              
              {/* Typing indicator */}
              {typingUsers.size > 0 && (
                <TypingIndicator 
                  senderName={selectedChat.participants?.find(p => 
                    typingUsers.has(p._id) && p._id !== user?.id
                  )?.name}
                />
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message Input */}
            <div className="p-4 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700">
              <MessageInput
                ref={messageInputRef}
                value={newMessage}
                onChange={handleMessageInputChange}
                onSend={handleSendMessage}
                disabled={!isConnected}
                placeholder={isConnected ? "Type a message..." : "Connecting..."}
                maxLength={2000}
                isMobile={isMobile}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
            <div className="text-center">
              <i className="bi bi-chat-dots text-6xl text-neutral-400 dark:text-neutral-600 mb-4 block"></i>
              <h2 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Welcome to Modern Chat
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400">
                Select a chat to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Add Chat Modal */}
      <AddChatByPhone
        open={showAddChatModal}
        onClose={() => setShowAddChatModal(false)}
        onAdd={handleAddChatByPhone}
        error=""
      />
    </div>
  );
};

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default Chat;