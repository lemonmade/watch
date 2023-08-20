import {createProject, createProjectPlugin, quiltService} from '@quilted/craft';
import {cloudflareWorkers} from '@quilted/cloudflare/craft';

export default createProject((project) => {
  project.use(
    quiltService({
      entry: './router.ts',
      develop: false,
    }),
    graphQLManifest(),
    cloudflareWorkers(),
  );
});

function graphQLManifest() {
  return createProjectPlugin({
    name: 'watch.router.graphql-manifest',
    build({configure, workspace}) {
      configure(({rollupPlugins}) => {
        rollupPlugins?.((plugins) => {
          return [
            {
              name: '@watch/router/graphql-manifest',
              resolveId(id) {
                if (id === 'MAGIC/graphql-manifest.js') return id;
              },
              async load(id) {
                if (id !== 'MAGIC/graphql-manifest.js') return;

                const manifestPaths = await workspace.fs.glob('graphql*.json', {
                  cwd: workspace.fs.resolvePath('app/build/manifests'),
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
            },
            ...plugins,
          ];
        });
      });
    },
  });
}
