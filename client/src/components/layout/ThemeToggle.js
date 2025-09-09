import React, { useEffect, useState } from 'react';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded';
import NightsStayRoundedIcon from '@mui/icons-material/NightsStayRounded';

const ThemeToggle = ({ className = '' }) => {
  const [darkMode, setDarkMode] = useState(false);

  // Initialize theme based on localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const isDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setDarkMode(isDarkMode);
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    setDarkMode(!darkMode);
    
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    
    // Dispatch custom event for theme change to notify App.js
    window.dispatchEvent(new Event('themechange'));
  };

  return (
    <button
      onClick={toggleTheme}
      className={`${className} relative p-2 rounded-full transition-all duration-500 overflow-hidden backdrop-blur-xl group ${
        darkMode 
          ? 'bg-gradient-to-br from-neutral-800/70 to-neutral-900/70 text-yellow-400 hover:from-neutral-700/80 hover:to-neutral-800/80 border border-neutral-700/50 shadow-lg'
          : 'bg-gradient-to-br from-sky-100/80 to-blue-100/80 text-neutral-700 hover:from-sky-200/90 hover:to-blue-200/90 border border-white/60 shadow-md'
      }`}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="absolute inset-0 w-full h-full transition-all duration-500">
        {darkMode ? (
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform group-hover:scale-110 transition-transform duration-500">
            <span className="animate-pulse opacity-30 absolute -inset-4 rounded-full bg-yellow-300/40 blur-xl group-hover:opacity-50"></span>
          </span>
        ) : (
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform group-hover:scale-110 transition-transform duration-500">
            <span className="animate-pulse opacity-30 absolute -inset-4 rounded-full bg-sky-300/40 blur-xl group-hover:opacity-50"></span>
          </span>
        )}
      </span>
      
      {darkMode ? (
        <WbSunnyRoundedIcon 
          className="relative z-10 transition-all duration-500 group-hover:rotate-180 group-hover:scale-110" 
          fontSize="small" 
          sx={{ fontSize: "1.1rem" }} 
        />
      ) : (
        <NightsStayRoundedIcon 
          className="relative z-10 transition-all duration-500 group-hover:-rotate-12 group-hover:scale-110" 
          fontSize="small" 
          sx={{ fontSize: "1.1rem" }} 
        />
      )}
    </button>
  );
};

export default ThemeToggle; 