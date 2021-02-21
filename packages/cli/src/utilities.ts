import * as path from 'path';
import type {
  LocalApp,
  LocalExtension,
  ProductionApp,
  ProductionClipsExtension,
} from './app';

export function buildDetailsForExtension(
  extension: LocalExtension,
  app: LocalApp,
) {
  return {
    filename: `${extension.id}.js`,
    directory: path.join(app.root, '.watch', 'build', 'extensions'),
  };
}

export function findMatchingProductionClipsExtension(
  extension: LocalExtension,
  app: ProductionApp,
) {
  return app.extensions.find(
    (productionExtension) =>
      productionExtension.__typename === 'ClipsExtension' &&
      (productionExtension.id === extension.configuration.id ||
        productionExtension.name === extension.configuration.name),
  ) as ProductionClipsExtension | undefined;
}
