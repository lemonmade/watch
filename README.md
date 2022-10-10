# watch

Important links:

- [Cloudflare dashboard](https://dash.cloudflare.com/9bfdb755def60e50760e33036c6f1624/watch-cloudflare-test.com/workers) ([router worker](https://dash.cloudflare.com/9bfdb755def60e50760e33036c6f1624/workers/services/view/watch-test-worker/production))
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

Run the development server:

```sh
pnpm develop
```

### Database stuff

We use [PlanetScale](https://planetscale.com) to host a MySQL database for the application, and manage the schema with [Prisma](https://www.prisma.io). Install the [`pscale` CLI](https://docs.planetscale.com/concepts/planetscale-environment-setup). Log in, and connect to the `watch-test-db` database on the `develop` branch:

```sh
pscale connect watch-test-db initial-setup --port 3309
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

## Google Cloud stuff

I run a bunch of background stuff on Google Cloud, mostly for pubsub. Here were some guides I needed to set things up (there were a lot of manual CLI commands to run):

https://cloud.google.com/build/docs/build-push-docker-image
https://cloud.google.com/build/docs/deploy-containerized-application-cloud-run
https://cloud.google.com/build/docs/deploying-builds/deploy-cloud-run#gcloud
https://cloud.google.com/run/docs/configuring/secrets#command-line
https://cloud.google.com/run/docs/triggering/pubsub-push
