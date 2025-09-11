// Performance utilities for the chat app

// Debounce function for search and typing
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function for scroll events
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Memoization utility for expensive calculations
export const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

// Image lazy loading utility
export const lazyLoadImage = (src, placeholder = '') => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => resolve(placeholder);
    img.src = src;
  });
};

// Virtual scrolling utility for large lists
export const getVisibleItems = (items, containerHeight, itemHeight, scrollTop) => {
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  return {
    startIndex: Math.max(0, startIndex),
    endIndex,
    visibleItems: items.slice(Math.max(0, startIndex), endIndex)
  };
};

// Memory management for message cache
export class MessageCache {
  constructor(maxSize = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
  
  get(key) {
    return this.cache.get(key);
  }
  
  has(key) {
    return this.cache.has(key);
  }
  
  delete(key) {
    return this.cache.delete(key);
  }
  
  clear() {
    this.cache.clear();
  }
  
  size() {
    return this.cache.size;
  }
}

// Connection retry utility with exponential backoff
export class ConnectionRetry {
  constructor(maxRetries = 3, baseDelay = 1000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
    this.retryCount = 0;
  }
  
  async retry(fn) {
    try {
      const result = await fn();
      this.retryCount = 0; // Reset on success
      return result;
    } catch (error) {
      if (this.retryCount >= this.maxRetries) {
        throw error;
      }
      
      const delay = this.baseDelay * Math.pow(2, this.retryCount);
      this.retryCount++;
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retry(fn);
    }
  }
  
  reset() {
    this.retryCount = 0;
  }
}

// Performance monitoring
export const performanceMonitor = {
  startTime: Date.now(),
  
  mark(name) {
    if (performance.mark) {
      performance.mark(name);
    }
  },
  
  measure(name, startMark, endMark) {
    if (performance.measure) {
      performance.measure(name, startMark, endMark);
    }
  },
  
  getMetrics() {
    if (performance.getEntriesByType) {
      return {
        navigation: performance.getEntriesByType('navigation')[0],
        paint: performance.getEntriesByType('paint'),
        measures: performance.getEntriesByType('measure')
      };
    }
    return null;
  },
  
  logMetrics() {
    const metrics = this.getMetrics();
    if (metrics && process.env.NODE_ENV === 'development') {
      console.log('Performance metrics:', metrics);
    }
  }
};

// Optimize bundle size by code splitting
export const loadComponent = (componentPath) => {
  return React.lazy(() => import(componentPath));
};

// Network status utility
export const getNetworkStatus = () => {
  if ('connection' in navigator) {
    const connection = navigator.connection;
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }
  return null;
};

// Battery status utility
export const getBatteryStatus = async () => {
  if ('getBattery' in navigator) {
    try {
      const battery = await navigator.getBattery();
      return {
        level: battery.level,
        charging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime
      };
    } catch (error) {
      return null;
    }
  }
  return null;
};

// Memory usage monitoring
export const getMemoryUsage = () => {
  if ('memory' in performance) {
    return {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
    };
  }
  return null;
};