FROM node:18-alpine

WORKDIR /app

COPY services/backend/alert-api/package*.json ./
RUN npm install --production

COPY services/backend/alert-api/ ./

USER node

EXPOSE 5002

CMD ["node", "server.js"]
