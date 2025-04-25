import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './bootstrap-mobile.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Add network connectivity detection
if ('connection' in navigator) {
  const connectionHandler = () => {
    const { effectiveType, downlink, rtt, saveData } = navigator.connection;
    console.log(`Network: ${effectiveType}, Speed: ${downlink}Mbps, Latency: ${rtt}ms, Data Saver: ${saveData}`);
    
    // Store network info in localStorage for adaptive strategy
    localStorage.setItem('network_info', JSON.stringify({
      effectiveType,
      downlink,
      rtt,
      saveData,
      timestamp: Date.now()
    }));
  };
  
  // Run once at startup
  connectionHandler();
  
  // Add listener for future changes
  navigator.connection.addEventListener('change', connectionHandler);
}

console.log('Starting application...');
console.log('Root element:', document.getElementById('root'));

try {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('Application rendered successfully');
  
  // Register the service worker for offline support
  serviceWorkerRegistration.register({
    onSuccess: () => {
      console.log('Service worker registered successfully');
    },
    onUpdate: () => {
      console.log('New version available');
    }
  });
} catch (error) {
  console.error('Error rendering application:', error);
} 