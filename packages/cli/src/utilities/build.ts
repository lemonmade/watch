import * as path from 'path';
import {mkdir, writeFile} from 'fs/promises';
import type {LocalApp, LocalExtension} from './app';

export function rootOutputDirectory(app: LocalApp) {
  return path.join(app.root, '.watch');
}

export async function ensureRootOutputDirectory(app: LocalApp) {
  const directory = rootOutputDirectory(app);
  await mkdir(directory);
  await writeFile(path.join(directory, '.gitignore'), '*');
}

export function buildDetailsForExtension(
  extension: LocalExtension,
  app: LocalApp,
) {
  return {
    filename: `${extension.id}.js`,
    directory: path.join(rootOutputDirectory(app), 'build/extensions'),
  };
}
