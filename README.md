# watch

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

To run postgres (I think, anyways):

```
brew services restart postgresql
psql postgres
> CREATE ROLE dev WITH LOGIN PASSWORD 'password'
> ALTER ROLE dev CREATEDB
```
