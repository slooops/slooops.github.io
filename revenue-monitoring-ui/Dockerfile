#angular build
FROM node:18.13
RUN adduser node root

COPY ./angular-app /ui
WORKDIR /ui

RUN export NODE_OPTIONS="--max-old-space-size=5120"
RUN npm install
RUN npm install -g @angular/cli@14.1.0

RUN chmod -R 775 /ui
RUN chown -R node:root /ui

RUN npm run build

#node build and run
WORKDIR /proxy-server
COPY ./node-proxy-server /proxy-server
RUN npm install

EXPOSE 3000
ENTRYPOINT ["node", "server.js"]


 
