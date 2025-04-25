module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Only disable source maps for timeago.js, keep others intact
      if (webpackConfig.module && webpackConfig.module.rules) {
        // Find the source-map-loader rule
        const sourceMapRule = webpackConfig.module.rules.find(
          rule => rule.enforce === 'pre' && 
                 rule.use && 
                 Array.isArray(rule.use) && 
                 rule.use.some(u => u.loader && u.loader.includes('source-map-loader'))
        );
        
        if (sourceMapRule) {
          // Add timeago.js to the exclude pattern
          sourceMapRule.exclude = [
            /node_modules\/timeago\.js/,
            ...(Array.isArray(sourceMapRule.exclude) ? sourceMapRule.exclude : 
               sourceMapRule.exclude ? [sourceMapRule.exclude] : [])
          ];
        }
      }
      
      // Add specific ignore warnings for timeago.js source maps
      webpackConfig.ignoreWarnings = [
        ...(webpackConfig.ignoreWarnings || []),
        /Failed to parse source map from.*timeago\.js/
      ];
      
      return webpackConfig;
    }
  },
  // Disable ESLint warnings
  eslint: {
    enable: false
  }
}; 