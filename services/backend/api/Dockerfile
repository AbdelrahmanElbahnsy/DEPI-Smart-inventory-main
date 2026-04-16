FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY services/backend/api/package*.json ./

RUN npm install

COPY services/backend/api/ ./
COPY services/database/ /app/services/database/

# Create uploads directory with proper permissions
RUN mkdir -p /app/uploads/avatars /app/uploads/products && \
    chown -R node:node /app/uploads

# Run as non-root user
USER node

EXPOSE 5000

CMD ["node", "server.js"]