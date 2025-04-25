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
      className={`${className} relative p-2 rounded-full transition-all duration-300 overflow-hidden backdrop-blur-lg ${
        darkMode 
          ? 'bg-neutral-800/60 text-yellow-400 hover:bg-neutral-700/70 border border-neutral-700/50'
          : 'bg-sky-100/70 text-neutral-700 hover:bg-sky-200/80 border border-white/50'
      }`}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="absolute inset-0 w-full h-full">
        {darkMode ? (
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform">
            <span className="animate-pulse opacity-20 absolute -inset-3 rounded-full bg-yellow-300/30 blur-lg"></span>
          </span>
        ) : (
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform">
            <span className="animate-pulse opacity-20 absolute -inset-3 rounded-full bg-sky-300/30 blur-lg"></span>
          </span>
        )}
      </span>
      
      {darkMode ? (
        <WbSunnyRoundedIcon className="relative z-10" fontSize="small" sx={{ fontSize: "1.1rem" }} />
      ) : (
        <NightsStayRoundedIcon className="relative z-10" fontSize="small" sx={{ fontSize: "1.1rem" }} />
      )}
    </button>
  );
};

export default ThemeToggle; 