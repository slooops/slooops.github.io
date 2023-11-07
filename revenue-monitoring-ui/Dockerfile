FROM node:16.14.2-alpine

RUN adduser node root

COPY ./angular-app /ui
WORKDIR /ui


RUN export NODE_OPTIONS="--max-old-space-size=5120"

RUN npm install --legacy-peer-deps
RUN npm install -g @angular/cli --legacy-peer-deps

RUN chmod -R 775 /ui
RUN chown -R node:root /ui


EXPOSE 4200

CMD ng serve --host 0.0.0.0 &

WORKDIR /proxy-server
COPY ./node-proxy-server /proxy-server

RUN npm install

EXPOSE 3000

CMD node server.js

