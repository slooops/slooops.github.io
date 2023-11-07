# Stage 1: Build Angular Application
FROM node:16.14.2-alpine AS builder

WORKDIR /app

COPY ./angular-app/package.json ./angular-app/package-lock.json ./
RUN npm install

# Copy the rest of the application code
COPY ./angular-app ./
RUN npm run build

# Stage 2: Set Up Node.js Proxy Server
FROM node:16.14.2-alpine

# Create a non-root user
RUN adduser -D -g '' appuser

WORKDIR /app

# Copy the built Angular application from the builder stage
COPY --from=builder /app/dist ./angular-app

# Copy the Node.js proxy server code
COPY ./node-proxy-server ./

# Install server dependencies
RUN npm install

# Expose the ports for Angular (4200) and Node.js (3000)
EXPOSE 4200
EXPOSE 3000

# Run the Angular application with the Node.js server
CMD npm start
