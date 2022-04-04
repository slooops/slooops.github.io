FROM node:16.14.2-alpine

WORKDIR /ui

ENV PATH /ui/node_modules/.bin:$PATH

COPY . /ui

RUN npm install --legacy-peer-deps
RUN npm install -g @angular/cli --legacy-peer-deps
RUN ng add @cisco/cui-ng

EXPOSE 4200

ENTRYPOINT ["ng" , "serve"]

