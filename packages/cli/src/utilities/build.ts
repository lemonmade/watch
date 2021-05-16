import * as path from 'path';
import type {LocalApp, LocalExtension} from './app';

export function buildDetailsForExtension(
  extension: LocalExtension,
  app: LocalApp,
) {
  return {
    filename: `${extension.id}.js`,
    directory: path.join(app.root, '.watch', 'build', 'extensions'),
  };
}
