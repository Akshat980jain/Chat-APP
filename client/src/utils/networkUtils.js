/**
 * Network utility functions to help with connection issues
 */

/**
 * Detects if we're accessing the app via an IP address
 * Useful for determining correct server URL
 */
export const isIpAddress = (hostname = window.location.hostname) => {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname);
};

/**
 * Gets the most likely server URL based on browser location
 * If we're on 192.168.1.15:3000, server is likely 192.168.1.15:5000
 */
export const getServerUrlFromBrowser = () => {
  const hostname = window.location.hostname;
  const serverPort = '5000';
  return `http://${hostname}:${serverPort}`;
};

/**
 * Tests if a server is reachable
 * @param {string} url - The URL to test
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<boolean>} True if server is reachable
 */
export const isServerReachable = async (url, timeout = 3000) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log(`Server at ${url} is not reachable:`, error.message);
    return false;
  }
};

/**
 * Detects the best API URL for the current environment
 * Checks multiple options and returns the first one that works
 * @returns {Promise<string>} The best API URL
 */
export const detectBestApiUrl = async () => {
  // Get the current saved URL if any
  const savedUrl = localStorage.getItem('api_url');
  
  // If we're on an IP address, try that first
  if (isIpAddress()) {
    const ipBasedUrl = getServerUrlFromBrowser();
    
    // If this is different from saved URL or no saved URL, test it
    if (ipBasedUrl !== savedUrl || !savedUrl) {
      const isReachable = await isServerReachable(ipBasedUrl);
      if (isReachable) {
        console.log(`Found working API URL: ${ipBasedUrl}`);
        localStorage.setItem('api_url', ipBasedUrl);
        return ipBasedUrl;
      }
    }
  }
  
  // Try the saved URL if we have one
  if (savedUrl) {
    const isReachable = await isServerReachable(savedUrl);
    if (isReachable) {
      console.log(`Saved API URL ${savedUrl} is working`);
      return savedUrl;
    }
  }
  
  // List of fallback URLs to try
  const fallbackUrls = [
    process.env.REACT_APP_API_URL,
    'http://localhost:5000',
    'http://192.168.1.15:5000',
    'http://192.168.0.1:5000',
  ].filter(Boolean); // Remove null/undefined values
  
  // Try each URL in sequence
  for (const url of fallbackUrls) {
    const isReachable = await isServerReachable(url);
    if (isReachable) {
      console.log(`Found working API URL: ${url}`);
      localStorage.setItem('api_url', url);
      return url;
    }
  }
  
  // If nothing works, return the last saved URL or localhost
  return savedUrl || 'http://localhost:5000';
}; 