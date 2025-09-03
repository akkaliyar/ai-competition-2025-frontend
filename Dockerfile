FROM node:20-alpine

WORKDIR /app

# Copy only the minimal server
COPY minimal-server.js ./

# Use minimal server for debugging Railway connection
CMD ["node", "minimal-server.js"]