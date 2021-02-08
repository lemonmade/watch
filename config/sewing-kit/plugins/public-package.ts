import {createComposedProjectPlugin, Package} from '@sewing-kit/plugins';
import {buildFlexibleOutputs} from '@sewing-kit/plugin-package-flexible-outputs';

import {buildTypeScriptDefinitions} from './package-typescript';

export const publicPackage = (
  options?: Parameters<typeof buildFlexibleOutputs>[0],
) =>
  createComposedProjectPlugin<Package>('Watch.PublicPackage', (composer) => {
    composer.use(buildFlexibleOutputs(options), buildTypeScriptDefinitions());
  });
