import * as path from 'path';
import {readFile, stat} from 'fs/promises';

import {sync as glob} from 'glob';
import {parse} from '@iarna/toml';

interface ExtensionConfiguration {
  readonly name: string;
  readonly userConfiguration?: unknown;
}

export interface Extension {
  readonly id: string;
  readonly root: string;
  readonly configuration: ExtensionConfiguration;
}

export interface AppConfiguration {
  readonly name: string;
  readonly extensions?: string | readonly string[];
}

export interface App {
  readonly id: string;
  readonly root: string;
  readonly extensions: readonly Extension[];
  readonly configuration: AppConfiguration;
}

interface ExtensionEntry {
  readonly pattern: string;
  readonly directories: string[];
}

export async function loadApp(): Promise<App> {
  const configuration = await tryLoad<Partial<AppConfiguration>>(
    path.resolve('app.toml'),
  );

  validateAppConfig(configuration);

  return {
    id: configuration.name.toLocaleLowerCase().replace(/\s+/g, '-'),
    root: path.resolve(),
    configuration,
    extensions: await resolveExtensions(configuration.extensions),
  };
}

async function tryLoad<T>(file: string): Promise<T> {
  const appConfigStats = await stat(file);

  if (!appConfigStats.isFile()) {
    throw new Error(`No file: ${file}`);
  }

  const result = parse(await readFile(file, {encoding: 'utf8'}));

  return result as any;
}

function validateAppConfig(
  value: Partial<AppConfiguration>,
): asserts value is AppConfiguration {
  if (value.name == null) {
    throw new Error('App config missing field `name`');
  }

  return value as any;
}

async function resolveExtensions(extensions: AppConfiguration['extensions']) {
  if (extensions == null) return [];

  const extensionEntries =
    typeof extensions === 'string'
      ? [loadExtensionEntry(extensions)]
      : extensions.map((extension) => loadExtensionEntry(extension));

  const loadErrors: {directory: string; pattern: string}[] = [];
  const resolvedExtensions: Extension[] = [];

  await Promise.all(
    extensionEntries.map(async ({pattern, directories}) => {
      await Promise.all(
        directories.map(async (directory) => {
          try {
            resolvedExtensions.push(
              await loadExtensionFromDirectory(directory),
            );
          } catch (error) {
            loadErrors.push({directory, pattern});
          }
        }),
      );
    }),
  );

  if (loadErrors.length) {
    throw new Error(
      `Failed to load the following extensions from your configuration:\n\n  ${loadErrors
        .map(({directory, pattern}) => `${directory} (pattern: ${pattern})`)
        .join('\n  ')}`,
    );
  }

  return resolvedExtensions;
}

async function loadExtensionFromDirectory(
  directory: string,
): Promise<Extension> {
  const configuration = await tryLoad<Partial<ExtensionConfiguration>>(
    path.resolve(directory, 'extension.toml'),
  );

  validateExtensionConfig(configuration);

  return {
    id: configuration.name.toLocaleLowerCase().replace(/\s+/g, '-'),
    root: directory,
    configuration,
  };
}

function validateExtensionConfig(
  value: Partial<ExtensionConfiguration>,
): asserts value is ExtensionConfiguration {
  if (value.name == null) {
    throw new Error('App config missing field `name`');
  }

  return value as any;
}

function loadExtensionEntry(pattern: string): ExtensionEntry {
  return {
    pattern,
    directories: glob(
      pattern.endsWith(path.sep) ? pattern : `${pattern}${path.sep}`,
      {absolute: true},
    ),
  };
}
