FROM node:16.14.2-alpine

# Set up a non-root user
RUN adduser node root

# Copy the Angular application
COPY ./angular-app /ui
WORKDIR /ui

# Set NODE_OPTIONS
RUN export NODE_OPTIONS="--max-old-space-size=5120"

# Install Angular CLI and application dependencies
RUN npm install --legacy-peer-deps
RUN npm install -g @angular/cli --legacy-peer-deps

# Change permissions
RUN chmod -R 775 /ui
RUN chown -R node:root /ui

# Expose port for Angular app
EXPOSE 4200

# Switch to a non-root user
USER 1000

# Install PM2 globally
RUN npm install -g pm2

# Set up the Node.js server
WORKDIR /proxy-server
COPY ./node-proxy-server /proxy-server

# Install Node.js server dependencies
RUN npm install

# Expose port for Node.js server
EXPOSE 3000

# Start both Angular application and Node.js server using PM2
CMD pm2 start npm -- start && pm2 start node server.js && pm2 logs

