import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import ChatIcon from '@mui/icons-material/Chat';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  
  // Check screen size on resize
  useEffect(() => {
    const handleResize = () => {
      const largeScreen = window.innerWidth >= 1024;
      setIsLargeScreen(largeScreen);
      // Auto-open sidebar on large screens
      if (largeScreen) {
        setSidebarOpen(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    // Initialize
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Handle navigation and close sidebar on mobile
  const navigateTo = (path) => {
    navigate(path);
    if (!isLargeScreen) {
      setSidebarOpen(false);
    }
  };
  
  // Add click outside listener to close sidebar on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !isLargeScreen && 
        sidebarOpen && 
        sidebarRef.current && 
        !sidebarRef.current.contains(event.target) &&
        !event.target.closest('button[aria-label="Open menu"]')
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isLargeScreen, sidebarOpen]);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Check if current route is active
  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 flex">
      
      {/* Sidebar */}
      <aside 
        ref={sidebarRef}
        className={`fixed lg:relative left-0 top-0 h-full z-40 transition-transform duration-300 ease-in-out transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } card-glass lg:shadow-xl w-[300px]`}
      >
        <div className="h-full flex flex-col p-5 overflow-y-auto">
          {/* Logo and close button for mobile */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-neutral-200/30 dark:border-neutral-700/30">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-all duration-300 border border-white/20 dark:border-neutral-700/20">
                <ChatIcon />
              </div>
              <div>
                <h1 className="text-xl font-display font-semibold text-neutral-900 dark:text-white">
                  Modern Chat
                </h1>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Next-gen messaging
                </p>
              </div>
            </div>
            <button 
              className="p-2 rounded-full lg:hidden hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all"
              onClick={toggleSidebar}
              aria-label="Close menu"
            >
              <CloseIcon fontSize="small" />
            </button>
          </div>
          
          {/* Main Navigation */}
          <nav className="mb-6">
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => navigateTo('/')}
                  className={`w-full text-left menu-item rounded-xl border transition-all ${
                    isActiveRoute('/') 
                      ? 'bg-primary-50/70 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-100/50 dark:border-primary-800/30 shadow-md hover:shadow-lg' 
                      : 'border-transparent hover:border-neutral-200/50 dark:hover:border-neutral-700/30 hover:shadow-sm'
                  }`}
                >
                  <ChatIcon fontSize="small" />
                  <span>Chats</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('/settings')}
                  className={`w-full text-left menu-item rounded-xl border transition-all ${
                    isActiveRoute('/settings') 
                      ? 'bg-primary-50/70 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-100/50 dark:border-primary-800/30 shadow-md hover:shadow-lg' 
                      : 'border-transparent hover:border-neutral-200/50 dark:hover:border-neutral-700/30 hover:shadow-sm'
                  }`}
                >
                  <SettingsIcon fontSize="small" />
                  <span>Settings</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('/profile')}
                  className={`w-full text-left menu-item rounded-xl border transition-all ${
                    isActiveRoute('/profile') 
                      ? 'bg-primary-50/70 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-100/50 dark:border-primary-800/30 shadow-md hover:shadow-lg' 
                      : 'border-transparent hover:border-neutral-200/50 dark:hover:border-neutral-700/30 hover:shadow-sm'
                  }`}
                >
                  <AccountCircleIcon fontSize="small" />
                  <span>Profile</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('/notifications')}
                  className={`w-full text-left menu-item rounded-xl border transition-all ${
                    isActiveRoute('/notifications') 
                      ? 'bg-primary-50/70 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-100/50 dark:border-primary-800/30 shadow-md hover:shadow-lg' 
                      : 'border-transparent hover:border-neutral-200/50 dark:hover:border-neutral-700/30 hover:shadow-sm'
                  }`}
                >
                  <NotificationsIcon fontSize="small" />
                  <span>Notifications</span>
                </button>
              </li>
            </ul>
          </nav>
          
          {/* Spacer */}
          <div className="flex-1"></div>
          
          {/* Footer Actions */}
          <div className="mt-auto pt-6 border-t border-neutral-200/30 dark:border-neutral-700/30">
            <div className="flex items-center justify-between">
              <ThemeToggle className="shadow-md hover:shadow-lg" />
              
              <button 
                onClick={logout} 
                className="btn-glass text-sm text-error-600 dark:text-error-400 hover:bg-error-50/20 dark:hover:bg-error-900/20 rounded-xl px-3 py-2 transition-all"
              >
                <LogoutIcon fontSize="small" className="mr-1" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile header */}
        <header className="lg:hidden border-b border-neutral-200/30 dark:border-neutral-800/30 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl p-3 flex items-center justify-between shadow-sm">
          <button 
            className="p-2 rounded-full hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-all"
            onClick={toggleSidebar}
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>
          <h1 className="text-lg font-display font-semibold text-neutral-900 dark:text-white">
            Modern Chat
          </h1>
        </header>
        
        {/* Main content */}
        <div className="flex-1 overflow-auto main-content-wrapper auto-hide-scrollbar">
          <Outlet />
        </div>
      </main>
      
      {/* Mobile sidebar backdrop - clicking this will close the sidebar */}
      {sidebarOpen && !isLargeScreen && (
        <div 
          className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-md transition-opacity duration-300"
          onClick={toggleSidebar}
          aria-hidden="true"
        ></div>
      )}
    </div>
  );
};

export default AppLayout; 