# Use Node.js 20 Alpine image (matches package.json engines)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create a simple server script
RUN echo 'const express = require("express"); \
const path = require("path"); \
const app = express(); \
const port = process.env.PORT || 3000; \
app.use(express.static(path.join(__dirname, "build"))); \
app.get("*", (req, res) => { \
  res.sendFile(path.join(__dirname, "build", "index.html")); \
}); \
app.listen(port, "0.0.0.0", () => { \
  console.log(`Server running on port ${port}`); \
});' > server.js

# Install express for serving
RUN npm install express

# Expose port
EXPOSE $PORT

# Start the application
CMD ["node", "server.js"]