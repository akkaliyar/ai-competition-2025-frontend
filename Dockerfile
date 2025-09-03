FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code and build
COPY . .
RUN npm run build

# Copy server script and install express
COPY server.js ./
RUN npm install express

CMD ["node", "server.js"]