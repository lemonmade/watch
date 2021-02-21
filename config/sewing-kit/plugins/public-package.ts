import {
  createComposedProjectPlugin,
  createProjectBuildPlugin,
  Package,
} from '@sewing-kit/plugins';
import {buildFlexibleOutputs} from '@sewing-kit/plugin-package-flexible-outputs';

import {buildTypeScriptDefinitions} from './package-typescript';

export const publicPackage = (
  options?: Parameters<typeof buildFlexibleOutputs>[0],
) =>
  createComposedProjectPlugin<Package>('Watch.PublicPackage', (composer) => {
    composer.use(
      buildFlexibleOutputs(options),
      createProjectBuildPlugin(
        'Watch.PublicPackage.BabelIgnores',
        ({hooks}) => {
          hooks.target.hook(({hooks}) => {
            hooks.configure.hook((configuration) => {
              configuration.babelIgnorePatterns?.hook((ignore) => [
                ...ignore,
                '**/*.d.ts',
                '**/*.graphql',
              ]);

              // Babel does not actually consider the ignore patterns for `--no-copy-ignore`
              // if the file is not compilable by Babel. See this bug for details:
              // https://github.com/babel/babel/issues/11394
              //
              // In the meantime, we just pretend to Babel like it will compile GraphQL
              // files, but then ignore them all above
              configuration.babelExtensions?.hook((extensions) => [
                ...extensions,
                '.graphql',
              ]);
            });
          });
        },
      ),
      buildTypeScriptDefinitions(),
    );
  });
