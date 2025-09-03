const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

console.log('Starting server...');
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  PWD: process.cwd()
});

// Add basic logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Check if build directory exists
const buildPath = path.join(__dirname, 'build');
const indexPath = path.join(buildPath, 'index.html');

console.log('Checking build files...');
console.log('Build path:', buildPath);
console.log('Index path:', indexPath);

try {
  const buildExists = fs.existsSync(buildPath);
  const indexExists = fs.existsSync(indexPath);
  console.log('Build directory exists:', buildExists);
  console.log('Index.html exists:', indexExists);
  
  if (buildExists) {
    const files = fs.readdirSync(buildPath);
    console.log('Build files:', files);
  }
} catch (err) {
  console.error('Error checking build files:', err);
}

// Serve static files from the React app build directory
app.use(express.static(buildPath, {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  try {
    const buildExists = fs.existsSync(buildPath);
    const indexExists = fs.existsSync(indexPath);
    
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      buildDirectory: buildExists,
      indexFile: indexExists,
      port: port
    });
  } catch (err) {
    console.error('Health check error:', err);
    res.status(500).json({ 
      status: 'ERROR', 
      error: err.message 
    });
  }
});

// Simple root route for testing
app.get('/', (req, res) => {
  try {
    console.log('Root route accessed');
    
    if (!fs.existsSync(indexPath)) {
      console.error('Index.html not found at:', indexPath);
      return res.status(404).send(`
        <h1>Index.html not found</h1>
        <p>Build path: ${buildPath}</p>
        <p>Index path: ${indexPath}</p>
      `);
    }
    
    console.log('Sending index.html');
    res.sendFile(indexPath);
  } catch (err) {
    console.error('Error serving index.html:', err);
    res.status(500).send(`Error serving application: ${err.message}`);
  }
});

// Catch all handler for other routes
app.get('*', (req, res) => {
  try {
    console.log('Catch-all route for:', req.url);
    
    if (!fs.existsSync(indexPath)) {
      console.error('Index.html not found at:', indexPath);
      return res.status(404).send('Index.html not found');
    }
    
    res.sendFile(indexPath);
  } catch (err) {
    console.error('Error serving index.html:', err);
    res.status(500).send('Error serving application');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Health check available at http://localhost:${port}/health`);
  console.log(`Build directory: ${path.join(__dirname, 'build')}`);
  console.log('Server started successfully!');
});

// Handle server errors
server.on('error', (err) => {
  console.error('Server error:', err);
});

// Handle process errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});