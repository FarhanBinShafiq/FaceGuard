# Step 1: Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package config first for caching
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Step 2: Production stage (Serve with Nginx)
FROM nginx:stable-alpine

# Copy build files from stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Custom nginx config to proxy /api to the backend
RUN echo ' \
server { \
    listen 3000; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://backend:8000/api/; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
    location /images/ { \
        proxy_pass http://backend:8000/images/; \
        proxy_set_header Host $host; \
    } \
} \
' > /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
