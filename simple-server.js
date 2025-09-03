const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

console.log('=== SIMPLE SERVER STARTING ===');
console.log('Port:', port);
console.log('Time:', new Date().toISOString());

// Middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// Root route
app.get('/', (req, res) => {
  console.log('ROOT ROUTE HIT!');
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Railway Test</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f0f0f0; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
            .success { color: green; font-size: 24px; }
            .info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1 class="success">✅ Railway Deployment Working!</h1>
            <div class="info">
                <p><strong>Server Port:</strong> ${port}</p>
                <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
                <p><strong>Request URL:</strong> ${req.url}</p>
                <p><strong>User Agent:</strong> ${req.get('User-Agent')}</p>
            </div>
            <p>If you can see this page, your Railway deployment is working correctly!</p>
            <p><a href="/health">Check Health Endpoint</a></p>
        </div>
    </body>
    </html>
  `;
  res.send(html);
});

// Health endpoint
app.get('/health', (req, res) => {
  console.log('HEALTH CHECK HIT!');
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    port: port,
    uptime: process.uptime(),
    message: 'Simple server is working perfectly!'
  });
});

// Catch all
app.get('*', (req, res) => {
  console.log('CATCH-ALL ROUTE HIT for:', req.url);
  res.send(`
    <h1>Route Not Found</h1>
    <p>You tried to access: ${req.url}</p>
    <p><a href="/">Go to Home</a></p>
  `);
});

app.listen(port, '0.0.0.0', () => {
  console.log('=== SERVER STARTED SUCCESSFULLY ===');
  console.log(`Server running on port ${port}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('Waiting for requests...');
});

// Error handling
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});