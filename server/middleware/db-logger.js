const mongoose = require('mongoose');

// Simple middleware to log MongoDB operations
function setupDbLogging() {
  mongoose.set('debug', (collectionName, method, query, doc) => {
    console.log(`MongoDB: ${collectionName}.${method}`, JSON.stringify(query), doc ? JSON.stringify(doc) : '');
  });
  
  // Log connection events
  mongoose.connection.on('connected', () => {
    console.log('MongoDB Connected: ' + mongoose.connection.host);
  });
  
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB Error:', err);
  });
  
  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB Disconnected');
  });
  
  // Log all MongoDB operations
  const originalExecute = mongoose.Query.prototype.exec;
  
  mongoose.Query.prototype.exec = function(...args) {
    console.log(`MongoDB Query: ${this.model.modelName}.${this.op}`, 
                JSON.stringify(this.getQuery()));
    return originalExecute.apply(this, args);
  };
}

module.exports = setupDbLogging; 