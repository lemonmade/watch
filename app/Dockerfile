FROM node:16-bullseye-slim as base

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && apt-get install -y ca-certificates

# Some references I used for this:
#
# https://www.mbelsky.com/posts/dockerizing-a-workspaced-nodejs-application/
# https://pnpm.io/cli/fetch
# https://github.com/pnpm/pnpm/issues/1637
# https://github.com/pnpm/pnpm/issues/3114
#
# Set up dependencies
FROM base as dependencies

WORKDIR /root

RUN npm install -g pnpm@6.32.2

# Copy the lockfile, which is the only file `pnpm fetch` needs to run
COPY pnpm-lock.yaml .

# Fill the PNPM virtual store
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store\
      pnpm fetch --prod

# Copy the rest of the project files
COPY . .

# Remove not "package.json" files
RUN find src \! -name "package.json" -mindepth 2 -maxdepth 2 -print | xargs rm -rf

RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store\
      pnpm install --offline --recursive --prod --frozen-lockfile --filter-prod app...

FROM base

WORKDIR /root

COPY --from=dependencies /root/node_modules .
COPY --from=dependencies /root/app/node_modules .

COPY app/package.json .
COPY app/build/assets app/build/assets
COPY app/build/server app/build/server
COPY app/build/prisma/. app/node_modules/

ENV NODE_ENV production

CMD ["node", "./app/build/server/index.js"]