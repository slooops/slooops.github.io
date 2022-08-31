FROM node:16.14.2-alpine

RUN adduser node root

COPY . /ui
WORKDIR /ui

RUN npm install --legacy-peer-deps
RUN npm install -g @angular/cli --legacy-peer-deps

RUN chmod -R 775 /ui
RUN chown -R node:root /ui

RUN export NODE_OPTIONS="--max-old-space-size=5120"

EXPOSE 4200

USER 1000

CMD ng serve --host 0.0.0.0

