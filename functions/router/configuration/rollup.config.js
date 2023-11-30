import {globby as glob} from 'globby';
import {quiltServer} from '@quilted/rollup/server';
import {cloudflareWorkers} from '@quilted/cloudflare/craft';

const {input, plugins, output} = await quiltServer({
  entry: './router.ts',
  format: 'custom',
  runtime: cloudflareWorkers(),
});

plugins.push({
  name: '@watch/router/graphql-manifest',
  resolveId(id) {
    if (id === 'watch:module/graphql-manifest.js') return id;
  },
  async load(id) {
    if (id !== 'watch:module/graphql-manifest.js') return;

    const manifestPaths = await glob('graphql*.json', {
      cwd: new URL('../../../app/build/manifests', import.meta.url),
      onlyFiles: true,
    });

    const manifests = await Promise.all(
      manifestPaths.map(async (path) =>
        JSON.parse(await workspace.fs.read(path)),
      ),
    );

    const combinedManifest = Object.assign({}, ...manifests);

    return `export default JSON.parse(${JSON.stringify(
      JSON.stringify(combinedManifest),
    )});`;
  },
});

export default {input, plugins, output};
