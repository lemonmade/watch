import {fileURLToPath} from 'url';
import {readFile} from 'fs/promises';
import {globby} from 'globby';

const rootDirectory = fileURLToPath(new URL('../..', import.meta.url));

const manifestFiles = await globby('app/build/manifests/graphql*.json', {
  cwd: rootDirectory,
  absolute: true,
  onlyFiles: true,
});

const manifests = await Promise.all(
  manifestFiles.map(async (file) => JSON.parse(await readFile(file, 'utf8'))),
);

const combinedManifest = Object.assign({}, ...manifests);
const operationEntries = Object.entries(combinedManifest);

console.log(`Sending ${operationEntries.length} operations to Cloudflare...`);

// @see https://developers.cloudflare.com/api/operations/workers-kv-namespace-write-multiple-key-value-pairs
const result = await cloudflareApi(
  `/accounts/9bfdb755def60e50760e33036c6f1624/storage/kv/namespaces/7f89119bd9ff4c40874fa5616b35cba9/bulk`,
  {
    method: 'PUT',
    body: Object.entries(combinedManifest).map(([key, value]) => ({
      key,
      value,
    })),
  },
);

console.log(result);

async function cloudflareApi<T = unknown>(
  route: string,
  {body, method}: {body?: any; method?: string},
) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/${
      route.startsWith('/') ? route.slice(1) : route
    }`,
    {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    },
  );

  const result = await response.json();

  return result as T;
}
