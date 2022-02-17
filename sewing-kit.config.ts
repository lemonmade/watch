import {exec} from 'child_process';
import {
  createWorkspace,
  quiltWorkspace,
  createWorkspacePlugin,
} from '@quilted/craft';

export default createWorkspace((workspace) => {
  workspace.use(
    quiltWorkspace(),
    createWorkspacePlugin({
      name: 'Watch.Caddy',
      develop({run}) {
        run((step) =>
          step({
            label: 'Run Caddy',
            name: 'Watch.Caddy',
            stage: 'post',
            run({exec}) {
              // exec('caddy', ['run', '--config', 'config/local/Caddyfile'], {
              //   stdio: 'inherit',
              // });
            },
          }),
        );
      },
    }),
  );
});
