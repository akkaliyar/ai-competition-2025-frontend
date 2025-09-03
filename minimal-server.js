// Ultra-minimal server for Railway debugging
const http = require('http');
const port = process.env.PORT || 3000;

console.log('=== MINIMAL SERVER ===');
console.log('Node version:', process.version);
console.log('Port from env:', process.env.PORT);
console.log('Port to use:', port);
console.log('Current directory:', process.cwd());

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <body style="font-family: Arial; padding: 20px; background: #f0f0f0;">
        <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: green;">✅ Minimal Server Working!</h1>
          <p><strong>Port:</strong> ${port}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <p><strong>URL:</strong> ${req.url}</p>
          <p><strong>Method:</strong> ${req.method}</p>
          <p>This is the most basic possible Node.js server.</p>
        </div>
      </body>
    </html>
  `);
});

server.listen(port, '0.0.0.0', () => {
  console.log('=== SERVER LISTENING ===');
  console.log(`Server bound to 0.0.0.0:${port}`);
  console.log('Waiting for connections...');
});

server.on('error', (err) => {
  console.error('SERVER ERROR:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use!`);
  }
});

// Keep the process alive and log any issues
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});

// Log every 30 seconds to show the server is alive
setInterval(() => {
  console.log(`Server still running at ${new Date().toISOString()}`);
}, 30000);