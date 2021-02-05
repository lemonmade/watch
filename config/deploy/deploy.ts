import * as path from 'path';

const root = path.resolve(__dirname, '../..');

const clipsAssetBucket = assetBucket({
  name: 'ClipsAssets',
  supportsCompression: ['none', 'gzip', 'brotli'],
});

const imagesBucket = assetBucket({
  name: 'Images',
  supportsCompression: ['none', 'gzip', 'brotli'],
});

const appAssetBucket = assetBucket({
  name: 'AppAssets',
  supportsCompression: ['none', 'gzip', 'brotli'],
});

const app = webApp({
  root: path.join(root, 'app'),
  assets: appAssetBucket,
});

const graphqlApi = service({
  root: path.join(root, 'functions/api'),
  needs: [clipsAssetBucket],
});

const imagesApi = service({
  root: path.join(root, 'functions/images'),
  needs: [imagesBucket],
});

const watch = domain({
  host: 'watch.lemon.tools',
  routes: [
    {
      match: '/',
      to: app,
      public: true,
    },
    {
      match: 'about',
      to: app,
      public: true,
    },
    {
      match: 'develop',
      to: app,
      public: true,
    },
    {
      match: 'app',
      to: app,
      public: false,
    },
    {
      match: 'me',
      to: app,
      public: false,
    },
    {
      match: 'login',
      to: app,
      public: false,
    },
    {
      match: 'api',
      public: false,
      children: [
        {
          match: 'graphql',
          to: graphqlApi,
        },
      ],
    },
    {
      match: 'assets',
      public: false,
      children: [
        {match: 'app', to: appAssetBucket},
        {match: 'clips', to: clipsAssetBucket},
        {match: 'images', to: imagesApi},
      ],
    },
  ],
});

const deployment = [watch];

export default deployment;

interface Domain {
  readonly host: string;
  readonly routes: readonly Route[];
}

type Routable = AssetBucket | WebApp | Service;

interface RouteWithChildren {
  readonly match: string;
  readonly public?: boolean;
  readonly children: readonly Route[];
  readonly to?: never;
}

interface RouteWithMethods {
  readonly match: string;
  readonly public?: boolean;
  readonly to: Routable;
  readonly children?: never;
}

type Route = RouteWithChildren | RouteWithMethods;

type AssetCompression = 'none' | 'gzip' | 'brotli';

interface AssetBucket {
  readonly name: string;
  readonly supportsCompression: readonly AssetCompression[];
}

interface WebApp {
  readonly root: string;
  readonly assets?: AssetBucket;
}

interface Service {
  readonly root: string;
  readonly needs?: readonly AssetBucket[];
}

function domain(domain: Domain): Domain {
  return domain;
}

function assetBucket(bucket: AssetBucket) {
  return bucket;
}

function webApp(app: WebApp): WebApp {
  return app;
}

function service(func: Service): Service {
  return func;
}
