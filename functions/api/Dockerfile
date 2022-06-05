FROM node:16-bullseye-slim as base

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && apt-get install -y ca-certificates

WORKDIR /app

COPY package.json .
COPY build/runtime build/runtime
COPY build/prisma/. node_modules/

ENV NODE_ENV production

CMD ["node", "./build/runtime/index.js"]
