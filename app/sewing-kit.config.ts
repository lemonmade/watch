import {createServer} from 'http';

import {createWebApp} from '@sewing-kit/config';
import {createProjectPlugin} from '@sewing-kit/plugins';
import {createStep} from '@sewing-kit/ui';
import {quiltWebAppPlugin} from '@quilted/sewing-kit-plugins';

import {} from '@sewing-kit/plugin-webpack';

const PLUGIN = 'Watch.App';

export default createWebApp((app) => {
  app.entry('./index');
  app.plugin(quiltWebAppPlugin);
  app.plugin(
    createProjectPlugin({
      id: PLUGIN,
      run({build, dev}) {
        build.tap(PLUGIN, ({hooks}) => {
          hooks.webApp.tap(PLUGIN, ({hooks, webApp}) => {
            hooks.steps.tap(PLUGIN, (steps, _, {webpackBuildManager}) => {
              return [
                createStep({label: 'Building static HTML output'}, (step) => {
                  return new Promise((resolve) => {
                    webpackBuildManager?.on(webApp, (stats) => {
                      step.log(`has errors: ${stats.hasErrors()}`);
                      resolve();
                    });
                  });
                }),
                ...steps,
              ];
            });
          });
        });

        dev.tap(PLUGIN, ({hooks}) => {
          hooks.webApp.tap(PLUGIN, ({hooks, webApp}) => {
            hooks.steps.tap(PLUGIN, (steps, _, {webpackBuildManager}) => [
              ...steps,
              createStep(
                {
                  label: 'Starting development server for static HTML',
                  indefinite: true,
                },
                async () => {
                  const currentAssets = new Set<string>();

                  webpackBuildManager?.on(
                    webApp,
                    (stats: import('webpack').Stats) => {
                      const {publicPath, assets = []} = stats.toJson({
                        assets: true,
                        publicPath: true,
                      });

                      currentAssets.clear();

                      for (const asset of assets) {
                        if (publicPath == null) {
                          currentAssets.add(asset.name);
                        } else {
                          currentAssets.add(
                            publicPath.endsWith('/')
                              ? `${publicPath}${asset.name}`
                              : `${publicPath}/${asset.name}`,
                          );
                        }
                      }
                    },
                  );

                  createServer((_, res) => {
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.write(
                      `<html>
                        <head></head>
                        <body>
                          <div id="app"></div>
                          ${[...currentAssets].map(
                            (asset) =>
                              `<script src=${JSON.stringify(asset)}></script>`,
                          )}
                        </body>
                      </html>`,
                    );
                    res.end();
                  }).listen(8082);
                },
              ),
            ]);
          });
        });
      },
    }),
  );
});
