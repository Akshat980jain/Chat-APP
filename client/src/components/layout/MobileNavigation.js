import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ProfilePicture from '../profile/ProfilePicture';
import ThemeToggle from './ThemeToggle';

// Import bootstrap icons (we'll need to install this package)
import 'bootstrap-icons/font/bootstrap-icons.css';

const MobileNavigation = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  // Toggle user menu dropdown
  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  // Helper function to determine if a link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Navigation handler
  const navigateTo = (path) => {
    navigate(path);
    setShowUserMenu(false);
  };

  // Close menu and perform logout
  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
  };
  
  // Add click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showUserMenu]);

  return (
    <>
      {/* Top navigation bar */}
      <nav className="navbar navbar-expand-md fixed-top bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl shadow-sm p-0 border-b border-white/20 dark:border-neutral-800/30 z-50">
        <div className="container-fluid d-flex justify-content-end align-items-center py-0 px-1">
          <div className="d-flex align-items-center gap-1">
            {/* Theme toggle */}
            <ThemeToggle className="shadow-md" size="small" />
            
            {user && (
              <div className="dropdown" ref={menuRef}>
                <button 
                  className="btn btn-link p-0 dropdown-toggle border-none"
                  type="button"
                  onClick={toggleUserMenu}
                  aria-expanded={showUserMenu}
                >
                  <div className="d-flex align-items-center">
                    <div className="avatar-container" style={{width: '22px', height: '22px'}}>
                      <ProfilePicture 
                        userId={user._id} 
                        size="xs" 
                        showStatus={false}
                        className="rounded-full ring-1 ring-white/30 dark:ring-neutral-800/50"
                      />
                    </div>
                  </div>
                </button>
                <ul className={`dropdown-menu dropdown-menu-end shadow-lg backdrop-blur-xl bg-white/80 dark:bg-neutral-800/80 rounded-lg p-1 mt-1 border border-white/20 dark:border-neutral-700/20 ${showUserMenu ? 'show' : ''}`}>
                  <li>
                    <button
                      className="dropdown-item rounded-lg px-2 py-1 text-neutral-700 dark:text-neutral-200 text-xs w-full text-left"
                      onClick={() => navigateTo('/profile')}
                    >
                      <i className="bi bi-person me-1"></i>
                      Profile
                    </button>
                  </li>
                  <li>
                    <button
                      className="dropdown-item rounded-lg px-2 py-1 text-neutral-700 dark:text-neutral-200 text-xs w-full text-left"
                      onClick={() => navigateTo('/settings')}
                    >
                      <i className="bi bi-gear me-1"></i>
                      Settings
                    </button>
                  </li>
                  <li><hr className="dropdown-divider my-0 opacity-10" /></li>
                  <li>
                    <button 
                      onClick={handleLogout} 
                      className="dropdown-item text-error-600 dark:text-error-400 rounded-lg px-2 py-1 text-xs w-full text-left"
                    >
                      <i className="bi bi-box-arrow-right me-1"></i>
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Content spacing for fixed navbars - reduced size */}
      <div className="mobile-nav-spacer" style={{height: '25px'}}></div>
    </>
  );
};

export default MobileNavigation; 