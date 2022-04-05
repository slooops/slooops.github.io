FROM node:16.14.2-alpine

RUN adduser node root

COPY . /ui
WORKDIR /ui

RUN npm install --legacy-peer-deps
RUN npm install -g @angular/cli --legacy-peer-deps
RUN ng add @cisco/cui-ng --skip-confirmation

RUN chmod -R 775 /ui
RUN chown -R node:root /ui

EXPOSE 4200

USER 1000

ENTRYPOINT ["ng" , "serve"]

