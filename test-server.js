// Simple test server to verify basic functionality
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

console.log('Test server starting on port:', port);

app.get('/', (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>Test Server Working!</h1>
        <p>Port: ${port}</p>
        <p>Time: ${new Date().toISOString()}</p>
        <a href="/health">Health Check</a>
      </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    port: port,
    timestamp: new Date().toISOString() 
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Test server running on port ${port}`);
});