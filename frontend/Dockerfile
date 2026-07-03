# Stage 1: Build React assets
FROM node:18-alpine AS builder

WORKDIR /app

# Install packages
COPY package.json .
RUN npm install

# Build static bundle
COPY . .
RUN npm run build

# Stage 2: Serve React via Nginx
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 3000

# Start server
CMD ["nginx", "-g", "daemon off;"]
