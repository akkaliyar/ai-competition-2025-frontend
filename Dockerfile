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

# Install serve globally
RUN npm install -g serve

# Expose port (Railway will override this with $PORT)
EXPOSE $PORT

# Start the application using serve with Railway's PORT
CMD ["sh", "-c", "serve -s build -p ${PORT:-3000}"]