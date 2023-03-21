# watch

Important links:

- [Architecture overview](https://www.figma.com/file/PoOBLPhMxCdc9S5rqk36tC/Watch-Architecture?node-id=0%3A1&t=l2ffxk1U8HUibXVo-1)
- [Cloudflare dashboard](https://dash.cloudflare.com/9bfdb755def60e50760e33036c6f1624/lemon.tools/workers)
  - [router worker](https://dash.cloudflare.com/9bfdb755def60e50760e33036c6f1624/workers/services/view/watch-router/production)
  - [email worker](https://dash.cloudflare.com/9bfdb755def60e50760e33036c6f1624/workers/services/view/watch-email/production)
  - [metrics worker](https://dash.cloudflare.com/9bfdb755def60e50760e33036c6f1624/workers/services/view/watch-metrics/production)
  - [stripe worker](https://dash.cloudflare.com/9bfdb755def60e50760e33036c6f1624/workers/services/view/watch-stripe/production)
  - [tmdb-refresher worker](https://dash.cloudflare.com/9bfdb755def60e50760e33036c6f1624/workers/services/view/watch-tmdb-refresher/production)
  - [tmdb-refresher-scheduler worker](https://dash.cloudflare.com/9bfdb755def60e50760e33036c6f1624/workers/services/view/watch-tmdb-refresher-scheduler/production)
- [Fly.io dashboard](https://fly.io/apps/watch-test-app)
- [PlanetScale dashboard](https://app.planetscale.com/chris-sauve/watch-test-db)
- [Google Cloud dashboard](https://console.cloud.google.com/welcome?project=watch-353105&_ga=2.12737845.383552117.1655603476-570853528.1655012838) ([Dev OAuth app](https://console.cloud.google.com/apis/credentials/oauthclient/357202806916-9ed7sce9ddqkb5hia8tvkl0pshleih2h.apps.googleusercontent.com?project=watch-353105))
- GitHub ([OAuth app](https://github.com/settings/applications/1515174), [Dev OAuth app](https://github.com/settings/applications/1609696))

## Local development

If you have not already, install the global dependencies:

```sh
# For local development with https
brew install mkcert
brew install caddy
mkcert -install
mkcert -cert-file config/local/tls/watch.lemon.dev.pem -key-file config/local/tls/watch.lemon.dev-key.pem "watch.lemon.dev"

nvm install
pnpm install
```

Add the following to your `/etc/hosts` file (only needed for https):

```
127.0.0.1 watch.lemon.dev
```

Make sure you have a (gitignored) `.env` file in the root of the project with at least the following contents:

```sh
# See 1Password for the values
GITHUB_CLIENT_ID="ABC123"
GITHUB_CLIENT_SECRET="XYZ789"
TMDB_ACCESS_TOKEN="ABC123"
# Generate some random value, I generally use 1Password
JWT_DEFAULT_SECRET="imbue-madman-real-bizarre"
```

Run the development server:

```sh
pnpm develop
```

### Database stuff

We use [PlanetScale](https://planetscale.com) to host a MySQL database for the application, and manage the schema with [Prisma](https://www.prisma.io). Install the [`pscale` CLI](https://docs.planetscale.com/concepts/planetscale-environment-setup). Log in, and connect to the `watch-test-db` database on the `develop` branch:

```sh
pscale connect watch-test-db develop --port 3309
```

Make sure the `DATABASE_URL` is updated in the root `.env` file to reflect this local connection to the database:

```sh
# :3309 is the port we connected to, watch-test-db is the database name
DATABASE_URL="mysql://root@127.0.0.1:3309/watch-test-db"
```

As you make changes to the schema, you will apply them to production by running the following command:

```sh
pnpm exec prisma db push
```

You can get a visual UI for the database by running Prisma Studio:

```sh
pnpm exec prisma studio
```
