import React, { useEffect, useState } from 'react';
import { isIpAddress, getServerUrlFromBrowser, isServerReachable } from '../utils/networkUtils';

/**
 * Component that automatically fixes server connection issues
 * Specifically designed to handle the scenario where:
 * - Browser is on http://192.168.1.15:3000 
 * - Server should be on http://192.168.1.15:5000
 */
const ServerConnectionFixer = () => {
  const [fixApplied, setFixApplied] = useState(false);
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const [isFixing, setIsFixing] = useState(false);

  useEffect(() => {
    // Check if we're currently seeing a connection error
    const savedApiUrl = localStorage.getItem('api_url');
    
    if (isIpAddress() && !isFixing) {
      setIsFixing(true);
      
      // Get the correct server URL based on current browser IP
      const correctServerUrl = getServerUrlFromBrowser();
      
      if (savedApiUrl !== correctServerUrl) {
        setMessage(`Fixing connection: changing API URL from ${savedApiUrl || 'undefined'} to ${correctServerUrl}`);
        localStorage.setItem('api_url', correctServerUrl);
        setFixApplied(true);
        setVisible(true);
        
        // Try to connect to the new URL
        isServerReachable(correctServerUrl)
          .then(reachable => {
            if (reachable) {
              setMessage(`Successfully connected to ${correctServerUrl}. Refreshing...`);
              // Wait a moment then reload
              setTimeout(() => window.location.reload(), 1500);
            } else {
              setMessage(`Still can't connect to server at ${correctServerUrl}. Make sure the server is running.`);
              
              // If we're seeing the specific error in the screenshot (192.168.1.15)
              if (correctServerUrl.includes('192.168.1.15')) {
                setMessage(`Connection issue detected with ${correctServerUrl}. Please ensure the server is running at this address and port 5000.`);
              }
            }
            setIsFixing(false);
          });
      } else {
        setIsFixing(false);
      }
    }
  }, [isFixing]);

  // Force clear API URL and reload if user clicks "Try Again"
  const handleTryAgain = () => {
    localStorage.removeItem('api_url');
    window.location.reload();
  };

  // Auto-hide after 8 seconds unless it's an error
  useEffect(() => {
    if (visible && fixApplied) {
      const timer = setTimeout(() => setVisible(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [visible, fixApplied]);

  if (!visible) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        right: '10px',
        backgroundColor: fixApplied ? '#d4edda' : '#f8d7da',
        color: fixApplied ? '#155724' : '#721c24',
        padding: '10px',
        borderRadius: '5px',
        zIndex: 9999,
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        fontSize: '14px'
      }}
    >
      {message}
      
      {!fixApplied && (
        <button
          style={{
            marginTop: '8px',
            padding: '4px 8px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          onClick={handleTryAgain}
        >
          Try Again
        </button>
      )}
      
      <button 
        style={{
          position: 'absolute',
          right: '10px',
          top: '10px',
          background: 'none',
          border: 'none',
          fontSize: '16px',
          cursor: 'pointer'
        }}
        onClick={() => setVisible(false)}
      >
        ×
      </button>
    </div>
  );
};

export default ServerConnectionFixer; 