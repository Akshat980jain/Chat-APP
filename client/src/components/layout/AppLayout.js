import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import ChatIcon from '@mui/icons-material/Chat';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import ThemeToggle from './ThemeToggle';
import { CircularProgress, Box } from '@mui/material';
import { toast } from 'react-toastify';

// Optimized breakpoint detection with throttling
const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState(() => {
    const width = window.innerWidth;
    if (width >= 1536) return 'xl';
    if (width >= 1280) return 'lg';
    if (width >= 1024) return 'md';
    if (width >= 768) return 'sm';
    return 'xs';
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let newBreakpoint;
      if (width >= 1536) newBreakpoint = 'xl';
      else if (width >= 1280) newBreakpoint = 'lg';
      else if (width >= 1024) newBreakpoint = 'md';
      else if (width >= 768) newBreakpoint = 'sm';
      else newBreakpoint = 'xs';
      
      if (newBreakpoint !== breakpoint) {
        setBreakpoint(newBreakpoint);
      }
    };

    const throttledResize = throttle(handleResize, 150);
    window.addEventListener('resize', throttledResize);
    return () => window.removeEventListener('resize', throttledResize);
  }, [breakpoint]);

  return breakpoint;
};

// Optimized loading component
const LoadingFallback = () => (
  <Box
    display="flex"
    alignItems="center"
    justifyContent="center"
    minHeight="150px"
    flexDirection="column"
    gap={2}
  >
    <CircularProgress size={32} thickness={4} />
    <span className="text-sm text-neutral-500 dark:text-neutral-400">
      Loading...
    </span>
  </Box>
);

// Error fallback component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <Box
    display="flex"
    alignItems="center"
    justifyContent="center"
    minHeight="200px"
    flexDirection="column"
    gap={2}
    p={4}
  >
    <ErrorIcon color="error" sx={{ fontSize: 48 }} />
    <span className="text-lg font-semibold text-neutral-900 dark:text-white">
      Something went wrong
    </span>
    <span className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
      {error.message || 'An unexpected error occurred'}
    </span>
    <button
      onClick={resetErrorBoundary}
      className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
    >
      <RefreshIcon fontSize="small" />
      <span>Try again</span>
    </button>
  </Box>
);

// Optimized throttle utility
const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Enhanced keyboard navigation hook
const useKeyboardNavigation = (navigationItems, isOpen) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const itemRefs = useRef([]);

  useEffect(() => {
    if (!isOpen) {
      setFocusedIndex(-1);
      return;
    }

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => 
            prev < navigationItems.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : navigationItems.length - 1
          );
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
            itemRefs.current[focusedIndex].click();
          }
          break;
        case 'Escape':
          setFocusedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, navigationItems.length, focusedIndex]);

  useEffect(() => {
    if (focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex].focus();
    }
  }, [focusedIndex]);

  return { focusedIndex, itemRefs };
};

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  const { user, logout } = useAuth();
  const { socket, isConnected, connectionState } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const breakpoint = useBreakpoint();
  
  const sidebarRef = useRef(null);
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  
  const isLargeScreen = breakpoint === 'lg' || breakpoint === 'xl';
  const isMediumScreen = breakpoint === 'md';
  const isSmallScreen = breakpoint === 'sm' || breakpoint === 'xs';

  // Navigation items with enhanced metadata
  const navigationItems = useMemo(() => [
    {
      id: 'chats',
      path: '/',
      label: 'Chats',
      icon: ChatIcon,
      badge: unreadCounts.chats || 0,
      description: 'View all conversations',
      shortcut: 'C'
    },
    {
      id: 'profile',
      path: '/profile',
      label: 'Profile',
      icon: AccountCircleIcon,
      description: 'Manage your profile',
      shortcut: 'P'
    },
    {
      id: 'settings',
      path: '/settings',
      label: 'Settings',
      icon: SettingsIcon,
      description: 'App preferences',
      shortcut: 'S'
    }
  ], [unreadCounts]);

  // Enhanced keyboard navigation
  const { focusedIndex, itemRefs } = useKeyboardNavigation(
    navigationItems, 
    sidebarOpen || isLargeScreen
  );

  // Handle offline/online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-manage sidebar state based on screen size
  useEffect(() => {
    if (isLargeScreen) {
      setSidebarOpen(true);
    } else {
      setSidebarOpen(false);
    }
  }, [isLargeScreen]);

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close sidebar on mobile
      if (
        !isLargeScreen && 
        sidebarOpen && 
        sidebarRef.current && 
        !sidebarRef.current.contains(event.target) &&
        !event.target.closest('[data-sidebar-trigger]')
      ) {
        setSidebarOpen(false);
      }

      // Close search
      if (
        searchOpen && 
        searchRef.current && 
        !searchRef.current.contains(event.target)
      ) {
        setSearchOpen(false);
      }

      // Close user menu
      if (
        userMenuOpen && 
        userMenuRef.current && 
        !userMenuRef.current.contains(event.target)
      ) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isLargeScreen, sidebarOpen, searchOpen, userMenuOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Global shortcuts (Ctrl/Cmd + key)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'k':
            e.preventDefault();
            setSearchOpen(true);
            break;
          case 'b':
            e.preventDefault();
            if (isLargeScreen) {
              setSidebarCollapsed(!sidebarCollapsed);
            } else {
              setSidebarOpen(!sidebarOpen);
            }
            break;
          case '/':
            e.preventDefault();
            setSearchOpen(true);
            break;
        }
      }

      // Navigation shortcuts (Alt + key)
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const item = navigationItems.find(
          item => item.shortcut.toLowerCase() === e.key.toLowerCase()
        );
        if (item) {
          e.preventDefault();
          navigate(item.path);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate, navigationItems, isLargeScreen, sidebarOpen, sidebarCollapsed]);

  // Enhanced navigation handler
  const navigateTo = useCallback((path) => {
    navigate(path);
    if (isSmallScreen) {
      setSidebarOpen(false);
    }
    setSearchOpen(false);
  }, [navigate, isSmallScreen]);

  // Check if route is active with enhanced matching
  const isActiveRoute = useCallback((path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  }, [location.pathname]);

  // Enhanced logout handler
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [logout, navigate]);

  // Get page title from route matches
  const pageTitle = useMemo(() => {
    const match = navigationItems.find(item => item.path === location.pathname);
    return match?.label || 'Modern Chat';
  }, [navigationItems, location.pathname]);

  // Connection status indicator
  const ConnectionStatus = () => {
    if (isOffline) {
      return (
        <div className="flex items-center space-x-2 text-error-600 dark:text-error-400 text-sm">
          <WifiOffIcon fontSize="small" />
          <span>Offline</span>
        </div>
      );
    }
    
    if (!isConnected) {
      return (
        <div className="flex items-center space-x-2 text-warning-600 dark:text-warning-400 text-sm">
          <div className="w-2 h-2 bg-warning-500 rounded-full animate-pulse"></div>
          <span className="capitalize">{connectionState}</span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2 text-success-600 dark:text-success-400 text-sm">
        <div className="w-2 h-2 bg-success-500 rounded-full"></div>
        <span>Connected</span>
      </div>
    );
  };

  // Optimized error handler
  const handleError = useCallback((error, errorInfo) => {
    console.error('App error:', error, errorInfo);
    toast.error('An unexpected error occurred. Please refresh the page.');
  }, []);

    return null;
  };

  // Enhanced search component
  const SearchComponent = () => (
    <div 
      ref={searchRef}
      className={`relative transition-all duration-300 ${
        searchOpen ? 'w-64' : 'w-10'
      }`}
    >
      <button
        onClick={() => setSearchOpen(!searchOpen)}
        className="p-2 rounded-full hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-all"
        aria-label="Search"
      >
        <SearchIcon fontSize="small" />
      </button>
      
      {searchOpen && (
        <div className="absolute top-0 left-0 right-0 z-50">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats, users..."
            className="w-full px-4 py-2 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
            autoFocus
          />
        </div>
      )}
    </div>
  );

  // User menu component
  const UserMenu = () => (
    <div ref={userMenuRef} className="relative">
      <button
        onClick={() => setUserMenuOpen(!userMenuOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-all"
        aria-label="User menu"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        {!sidebarCollapsed && (
          <>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-neutral-900 dark:text-white">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {user?.email || 'user@example.com'}
              </p>
            </div>
            <KeyboardArrowDownIcon 
              fontSize="small" 
              className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </button>

      {userMenuOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-700/50 rounded-lg shadow-xl p-2 z-50">
          <button
            onClick={() => navigateTo('/profile')}
            className="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/50 dark:hover:bg-neutral-700/50 rounded-lg transition-all"
          >
            View Profile
          </button>
          <button
            onClick={() => navigateTo('/settings')}
            className="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/50 dark:hover:bg-neutral-700/50 rounded-lg transition-all"
          >
            Settings
          </button>
          <hr className="my-2 border-neutral-200/50 dark:border-neutral-700/50" />
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-error-50/50 dark:hover:bg-error-900/20 rounded-lg transition-all flex items-center space-x-2"
          >
            <LogoutIcon fontSize="small" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 flex">
      
      {/* Enhanced Sidebar */}
      <aside 
        ref={sidebarRef}
        className={`fixed lg:relative left-0 top-0 h-full z-40 transition-all duration-300 ease-in-out transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          sidebarCollapsed && isLargeScreen ? 'w-16' : 'w-[300px]'
        } card-glass lg:shadow-xl`}
      >
        <div className="h-full flex flex-col p-5 overflow-y-auto">
          {/* Enhanced Header */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-neutral-200/30 dark:border-neutral-700/30">
            <div className={`flex items-center space-x-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-all duration-300 border border-white/20 dark:border-neutral-700/20">
                <ChatIcon />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-xl font-display font-semibold text-neutral-900 dark:text-white">
                    Modern Chat
                  </h1>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Next-gen messaging
                  </p>
                </div>
              )}
            </div>
            
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                {/* Collapse button for large screens */}
                {isLargeScreen && (
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all"
                    aria-label="Collapse sidebar"
                  >
                    <MenuIcon fontSize="small" />
                  </button>
                )}
                
                {/* Close button for mobile */}
                <button 
                  className="p-2 rounded-full lg:hidden hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close menu"
                >
                  <CloseIcon fontSize="small" />
                </button>
              </div>
            )}
          </div>
          
          {/* Enhanced Navigation */}
          <nav className="mb-6 flex-1">
            <ul className="space-y-2">
              {navigationItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.path);
                
                return (
                  <li key={item.id}>
                    <button 
                      ref={el => itemRefs.current[index] = el}
                      onClick={() => navigateTo(item.path)}
                      className={`w-full text-left menu-item rounded-xl border transition-all group relative ${
                        isActive 
                          ? 'bg-primary-50/70 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-100/50 dark:border-primary-800/30 shadow-md hover:shadow-lg' 
                          : 'border-transparent hover:border-neutral-200/50 dark:hover:border-neutral-700/30 hover:shadow-sm'
                      } ${
                        focusedIndex === index ? 'ring-2 ring-primary-500/50' : ''
                      } ${
                        sidebarCollapsed ? 'justify-center p-3' : 'p-4'
                      }`}
                      title={sidebarCollapsed ? item.label : item.description}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Icon fontSize="small" />
                          {item.badge > 0 && (
                            <span className="absolute -top-1 -right-1 bg-error-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                              {item.badge > 99 ? '99+' : item.badge}
                            </span>
                          )}
                        </div>
                        
                        {!sidebarCollapsed && (
                          <div className="flex-1 flex items-center justify-between">
                            <span className="font-medium">{item.label}</span>
                            <div className="flex items-center space-x-2">
                              <kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                Alt + {item.shortcut}
                              </kbd>
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
          
          {/* Enhanced Footer */}
          <div className="mt-auto pt-6 border-t border-neutral-200/30 dark:border-neutral-700/30">
            <div className="space-y-4">
              <ConnectionStatus />
              
              <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
                <ThemeToggle className="shadow-md hover:shadow-lg" />
                
                {!sidebarCollapsed && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      Press Ctrl+K to search
                    </span>
                  </div>
                )}
              </div>
              
              {/* Enhanced User Menu */}
              <UserMenu />
            </div>
          </div>
        </div>
      </aside>
      
      {/* Enhanced Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Enhanced Mobile Header */}
        <header className="lg:hidden border-b border-neutral-200/30 dark:border-neutral-800/30 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl p-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <button 
              className="p-2 rounded-full hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-all"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              data-sidebar-trigger
            >
              <MenuIcon />
            </button>
            <h1 className="text-lg font-display font-semibold text-neutral-900 dark:text-white">
              {pageTitle}
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <SearchComponent />
            <ConnectionStatus />
          </div>
        </header>
        
        {/* Main content with enhanced animations */}
        <div className="flex-1 overflow-auto main-content-wrapper auto-hide-scrollbar">
          <div className="animate-fadeIn">
            <ErrorBoundary FallbackComponent={ErrorFallback} onError={handleError}>
              <Suspense fallback={<LoadingFallback />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </main>
      
      {/* Enhanced Mobile backdrop */}
      {sidebarOpen && !isLargeScreen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-lg transition-all duration-300 animate-fadeIn"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      
      {/* Enhanced connection status indicator */}
      {!isConnected && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-warning-500/90 text-white px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm flex items-center space-x-2 animate-pulse">
            <WifiOffIcon fontSize="small" />
            <span className="text-sm font-medium capitalize">{connectionState}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppLayout;