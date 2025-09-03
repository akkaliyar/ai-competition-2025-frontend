// Super simple test to verify Railway connectivity
console.log('=== RAILWAY CONNECTION TEST ===');
console.log('Time:', new Date().toISOString());
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('Memory usage:', process.memoryUsage());

const port = process.env.PORT || 3000;
console.log('Environment PORT:', process.env.PORT);
console.log('Using port:', port);

// Test if port is available
const net = require('net');
const server = net.createServer();

server.listen(port, '0.0.0.0', () => {
  console.log('✅ Port binding successful!');
  console.log(`Server listening on 0.0.0.0:${port}`);
  
  // Create HTTP response
  server.close();
  
  const http = require('http');
  const httpServer = http.createServer((req, res) => {
    console.log(`Request: ${req.method} ${req.url}`);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`SUCCESS! Railway connection working on port ${port} at ${new Date().toISOString()}`);
  });
  
  httpServer.listen(port, '0.0.0.0', () => {
    console.log('✅ HTTP server started successfully');
    console.log('Ready to accept connections...');
  });
  
  httpServer.on('error', (err) => {
    console.error('❌ HTTP server error:', err);
  });
});

server.on('error', (err) => {
  console.error('❌ Port binding failed:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use!`);
  }
  process.exit(1);
});

// Keep alive
setInterval(() => {
  console.log(`Heartbeat: ${new Date().toISOString()}`);
}, 10000);