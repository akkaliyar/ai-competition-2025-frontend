const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Add basic logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'build'), {
  maxAge: '1d',
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Health check available at http://localhost:${port}/health`);
  console.log(`Build directory: ${path.join(__dirname, 'build')}`);
  
  // Check if build directory exists and has files
  const fs = require('fs');
  const buildPath = path.join(__dirname, 'build');
  
  try {
    const files = fs.readdirSync(buildPath);
    console.log(`Build directory contains ${files.length} files:`, files);
    
    if (!files.includes('index.html')) {
      console.error('WARNING: index.html not found in build directory!');
    }
  } catch (err) {
    console.error('ERROR: Build directory not found or inaccessible:', err.message);
  }
});