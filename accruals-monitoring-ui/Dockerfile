FROM node:16.14.2-alpine

WORKDIR /ui

ENV PATH /ui/node_modules/.bin:$PATH

COPY .npmrc /ui/.npmrc
COPY package.json /ui/package.json
COPY angular.json /app/angular.json

RUN npm install --legacy-peer-deps
RUN ng add @cisco/cui-ng

EXPOSE 4200

COPY . /ui

ENTRYPOINT ["ng" , "serve"]

