import {createComposedProjectPlugin, Package} from '@sewing-kit/plugins';
import {packageBuild} from '@sewing-kit/plugin-package-build';

import {buildTypeScriptDefinitions} from './package-typescript';

export const publicPackage = (
  options: Partial<Parameters<typeof packageBuild>[0]> = {},
) =>
  createComposedProjectPlugin<Package>('Watch.PublicPackage', (composer) => {
    composer.use(
      packageBuild({
        browserTargets: 'last 2 versions',
        nodeTargets: 'node 12',
        ...options,
      }),
      buildTypeScriptDefinitions(),
    );
  });
