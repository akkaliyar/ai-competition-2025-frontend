FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Build the React app
RUN npm run build

# Verify build was created and show contents
RUN ls -la build/ && echo "Build files:" && ls -la build/static/

# Install express for serving (keep all deps since we need them for runtime)
RUN npm install express

CMD ["node", "server.js"]