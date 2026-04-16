# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy root package files (wave.js library)
COPY package*.json ./
COPY src/ ./src/
COPY vite.config.js ./

# Build the library first
RUN npm ci --ignore-scripts && npm run build

# Copy website files
COPY website/web/react/ ./website/web/react/

# Install website dependencies and build
WORKDIR /app/website/web/react
RUN npm ci && npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=build /app/website/web/react/build /usr/share/nginx/html

# Copy nginx config
COPY website/docker/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
