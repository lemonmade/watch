FROM node:18.16.0-bullseye-slim as base

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && apt-get install -y ca-certificates

RUN apt-get install tree

# Some references I used for this:
#
# https://www.mbelsky.com/posts/dockerizing-a-workspaced-nodejs-application/
# https://pnpm.io/cli/fetch
# https://github.com/pnpm/pnpm/issues/1637
# https://github.com/pnpm/pnpm/issues/3114
#
# Set up dependencies
FROM base as dependencies

WORKDIR /workspace

RUN npm install -g pnpm@8.5.0

# Copy the lockfile, which is the only file `pnpm fetch` needs to run
COPY pnpm-lock.yaml .

# Fill the PNPM virtual store
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store\
      PRISMA_SKIP_POSTINSTALL_GENERATE=true pnpm fetch --prod

# Copy the rest of the project files
COPY . .

# Remove not "package.json" files
# RUN find . -not \( -name "package.json" -or -name "pnpm-lock.yaml" -or -name "pnpm-workspace.yaml" \) -mindepth 1 -maxdepth 3 -print | xargs rm -rf

RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store\
      PRISMA_SKIP_POSTINSTALL_GENERATE=true pnpm install --offline --recursive --prod --frozen-lockfile --filter-prod app...

COPY prisma/schema.prisma ./app/prisma/schema.prisma

RUN PRISMA_GENERATE_SKIP_AUTOINSTALL=true pnpm --filter app run prisma generate

RUN node ./scripts/docker/cleanup.js app

RUN tree . -a -L 2

ENV NODE_ENV production

CMD ["node", "./app/build/server/server.js"]
