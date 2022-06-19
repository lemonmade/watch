FROM node:16-bullseye-slim as base

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

RUN npm install -g pnpm@6.32.2

# Copy the lockfile, which is the only file `pnpm fetch` needs to run
COPY pnpm-lock.yaml .

# Fill the PNPM virtual store
RUN PRISMA_SKIP_POSTINSTALL_GENERATE=true pnpm fetch --prod

# Copy the rest of the project files
COPY . .

RUN PRISMA_SKIP_POSTINSTALL_GENERATE=true pnpm install --offline --recursive --prod --frozen-lockfile --filter-prod email...

RUN node ./scripts/docker/cleanup.js email

RUN tree . -a -L 2

ENV NODE_ENV production

CMD ["node", "./functions/email/build/runtime/index.js"]
