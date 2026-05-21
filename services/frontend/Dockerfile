# Stage 1: Build the React/Vite app
FROM node:18-alpine AS builder
WORKDIR /app
COPY services/frontend/package*.json ./
RUN npm ci --network-timeout=1000000
COPY services/frontend/ ./

# استلام المتغير من جينكينز وتمريره للواجهة أثناء البناء
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html
COPY services/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]