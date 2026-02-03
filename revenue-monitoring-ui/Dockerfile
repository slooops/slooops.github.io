##### Stage 1: Build Angular UI + Storybook (builder only, not shipped) #####
FROM node:20-slim AS ui-builder

RUN adduser node root

WORKDIR /ui
COPY ./angular-app /ui

# Increase memory for Angular build
ENV NODE_OPTIONS="--max-old-space-size=5120"

RUN npm install --legacy-peer-deps \
	&& npm install esbuild@latest --save-dev --legacy-peer-deps \
	&& npm install -g @angular/cli@14.1.0 --legacy-peer-deps

RUN chmod -R 775 /ui && chown -R node:root /ui

RUN npm run build

# Build Storybook (static site served at /storybook/)
RUN npm run build-storybook


##### Stage 2: Runtime image (no Cypress cache/libvpx layers) #####
FROM node:20-slim

# Copy Node proxy server source
WORKDIR /proxy-server
COPY ./node-proxy-server /proxy-server
RUN npm install

# Copy built UI artifacts from builder stage only (no node_modules, no Cypress cache)
COPY --from=ui-builder /ui/dist /ui/dist
COPY --from=ui-builder /ui/storybook-static /ui/storybook-static

EXPOSE 3000
ENTRYPOINT ["node", "server.js"]



