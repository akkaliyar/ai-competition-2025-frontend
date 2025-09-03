FROM node:20-alpine

WORKDIR /app

# Copy connection test
COPY check-railway.js ./

# Use connection test for debugging Railway
CMD ["node", "check-railway.js"]