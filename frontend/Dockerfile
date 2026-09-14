# Multi-stage Dockerfile for React SPA + Nginx
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production Nginx stage
FROM nginx:alpine

# کپی کردن کانفیگ سفارشی Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# کپی کردن فایل‌های خروجی بیلد React
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
