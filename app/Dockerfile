FROM node:16-bullseye-slim as base

WORKDIR /app

COPY package.json .
COPY build/assets build/assets
COPY build/server build/server

ENV NODE_ENV production

CMD ["node", "./build/server/index.js"]
