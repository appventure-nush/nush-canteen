FROM node:12-alpine

RUN adduser -S nush-canteen
USER nush-canteen
RUN mkdir /home/nush-canteen/nush-canteen
WORKDIR /home/nush-canteen/nush-canteen
COPY --chown=nush-canteen:root . .

RUN npm ci
