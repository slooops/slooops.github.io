#angular build
FROM node:20-slim
RUN adduser node root

COPY ./angular-app /ui
WORKDIR /ui

RUN export NODE_OPTIONS="--max-old-space-size=5120"
RUN npm install --legacy-peer-deps
RUN npm install esbuild@latest --save-dev --legacy-peer-deps
RUN npm install -g @angular/cli@14.1.0 --legacy-peer-deps

RUN chmod -R 775 /ui
RUN chown -R node:root /ui

RUN npm run build

# Build Storybook (static site served at /storybook/)
RUN npm run build-storybook

# Remove Cypress binary cache (which bundles its own Node runtime)
# so it is not present in the final runtime image and cannot be flagged.
RUN rm -rf /root/.cache/Cypress /home/node/.cache/Cypress || true

#node build and run
WORKDIR /proxy-server
COPY ./node-proxy-server /proxy-server
RUN npm install

EXPOSE 3000
ENTRYPOINT ["node", "server.js"]



