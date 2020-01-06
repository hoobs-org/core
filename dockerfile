FROM node:10.18.0-alpine3.10

RUN apk add --no-cache --virtual .gyp-deps python make gcc g++ avahi

WORKDIR /usr/src/hoobs

COPY dist ./dist
COPY lib ./lib
COPY bin/hoobs-docker ./bin/hoobs
COPY default-docker.json ./default.json
COPY package.json ./
COPY LICENSE ./

RUN ls -la ./
RUN ls -la ./bin
RUN ls -la ./dist
RUN ls -la ./lib

RUN npm install --only=production

CMD [ "bin/hoobs" ]
