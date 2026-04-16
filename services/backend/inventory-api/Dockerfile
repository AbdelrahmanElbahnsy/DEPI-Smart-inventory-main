FROM node:18-alpine

WORKDIR /app

COPY services/backend/inventory-api/package*.json ./
RUN npm install --production

COPY services/backend/inventory-api/ ./

USER node

EXPOSE 5001

CMD ["node", "server.js"]
