# Stage 1: Build the React/Vite app
FROM node:18-alpine AS builder
WORKDIR /app
COPY services/frontend/package*.json ./
RUN npm install --network-timeout=1000000
COPY services/frontend/ ./
RUN npm run build

FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html
COPY services/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]