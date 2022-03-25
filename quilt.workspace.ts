import {
  createWorkspace,
  quiltWorkspace,
  createWorkspacePlugin,
} from '@quilted/craft';

export default createWorkspace((workspace) => {
  workspace.use(quiltWorkspace(), runCaddy());
});

function runCaddy() {
  return createWorkspacePlugin({
    name: 'Watch.Caddy',
    develop({run}) {
      run((step) =>
        step({
          label: 'Run Caddy',
          name: 'Watch.Caddy',
          stage: 'post',
          run({exec}) {
            const result = exec('caddy', [
              'run',
              '--config',
              'config/local/Caddyfile',
            ]);

            result.child.stdout?.pipe(process.stdout);
            result.child.stderr?.pipe(process.stderr);
          },
        }),
      );
    },
  });
}
