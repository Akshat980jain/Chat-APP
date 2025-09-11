const compression = require('compression');
const helmet = require('helmet');

// Performance middleware setup
const setupPerformanceMiddleware = (app) => {
  // Enable gzip compression
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6,
    threshold: 1024
  }));

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for development
    crossOriginEmbedderPolicy: false
  }));

  // Cache control for static assets
  app.use('/uploads', (req, res, next) => {
    res.set('Cache-Control', 'public, max-age=31536000'); // 1 year
    next();
  });

  // API response optimization
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
  });

  // Request timeout
  app.use((req, res, next) => {
    req.setTimeout(30000, () => {
      res.status(408).json({ message: 'Request timeout' });
    });
    next();
  });
};

module.exports = setupPerformanceMiddleware;