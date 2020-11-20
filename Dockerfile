FROM node:14.15.1-alpine3.12

RUN apk add --no-cache --virtual .gyp-deps python3 make gcc g++ git avahi-compat-libdns_sd avahi-dev dbus iputils nano ffmpeg
RUN chmod 4755 /bin/ping
RUN mkdir /hoobs

WORKDIR /usr/src/hoobs
VOLUME /hoobs

COPY bridge ./bridge
COPY controllers ./controllers
COPY interface ./interface
COPY scripts ./scripts
COPY server ./server

COPY bin/hoobs-docker ./bin/hoobs
COPY default-docker.json ./default.json
COPY package.json ./
COPY LICENSE ./

COPY docker /

RUN npm install --only=production

RUN [ "${AVAHI:-1}" = "1" ] || (rm -rf /etc/services.d/avahi \
    /etc/services.d/dbus \
    /etc/cont-init.d/40-dbus-avahi)

CMD [ "bin/hoobs" ]
