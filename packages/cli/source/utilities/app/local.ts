import * as path from 'path';
import {readFile, access} from 'fs/promises';
import {watch} from 'chokidar';
import type {FSWatcher} from 'chokidar';
import {createEmitter} from '@quilted/events';
import type {Emitter} from '@quilted/events';

import glob from 'glob';
import {parse} from '@iarna/toml';

import type {ExtensionPoint} from '@watching/clips';

export interface LocalConfigurationFile<T> {
  readonly path: string;
  readonly value: T;
}

export interface LocalAppConfiguration {
  readonly id?: string;
  readonly name: string;
  readonly handle: string;
  readonly extensions?: string | readonly string[];
}

export interface LocalApp {
  readonly id: string;
  readonly name: string;
  readonly handle: string;
  readonly root: string;
  readonly extensions: readonly LocalExtension[];
  readonly configurationFile: LocalConfigurationFile<LocalAppConfiguration>;
  readonly on: Emitter<{change: Omit<LocalApp, 'on'>}>['on'];
}

interface LocalExtensionConfigurationTranslatedString {
  readonly translation: string;
}

export type LocalExtensionConfigurationString =
  | string
  | LocalExtensionConfigurationTranslatedString;

interface LocalExtensionUserSettingsStringField {
  type: 'string';
  id: string;
  label: LocalExtensionConfigurationString;
  default?: string;
}

interface LocalExtensionUserSettingsNumberField {
  type: 'number';
  id: string;
  label: LocalExtensionConfigurationString;
  default?: number;
}

interface LocalExtensionUserSettingsOptionsFieldOption {
  readonly value: string;
  readonly label: LocalExtensionConfigurationString;
}

interface LocalExtensionUserSettingsOptionsField {
  type: 'options';
  id: string;
  label: LocalExtensionConfigurationString;
  default?: string;
  options: readonly LocalExtensionUserSettingsOptionsFieldOption[];
}

type LocalExtensionUserSettingsField =
  | LocalExtensionUserSettingsStringField
  | LocalExtensionUserSettingsNumberField
  | LocalExtensionUserSettingsOptionsField;

interface LocalExtensionUserSettings {
  readonly fields: readonly LocalExtensionUserSettingsField[];
}

interface LocalExtensionPointSupportSeriesCondition {
  readonly handle?: string;
}

interface LocalExtensionPointSupportCondition {
  readonly series?: LocalExtensionPointSupportSeriesCondition;
}

export interface LocalExtensionPointSupport {
  readonly target: ExtensionPoint;
  readonly module: string;
  readonly query?: string;
  readonly conditions?: LocalExtensionPointSupportCondition[];
}

export interface LocalExtensionConfiguration {
  readonly id?: string;
  readonly name: string;
  readonly handle: string;
  readonly extends: readonly LocalExtensionPointSupport[];
  readonly settings?: Partial<LocalExtensionUserSettings>;
}

export interface LocalExtension {
  readonly id: string;
  readonly name: string;
  readonly root: string;
  readonly handle: string;
  readonly extends: readonly LocalExtensionPointSupport[];
  readonly settings: LocalExtensionUserSettings;
  readonly configurationFile: LocalConfigurationFile<LocalExtensionConfiguration>;
}

interface LocalExtensionEntry {
  readonly pattern: string;
  readonly directories: string[];
}

export async function loadLocalApp(): Promise<LocalApp> {
  const configurationPath = path.resolve('app.toml');
  const configuration = await tryLoad<Partial<LocalAppConfiguration>>(
    configurationPath,
  );

  validateAppConfig(configuration);

  let currentApp: Omit<LocalApp, 'on'> = {
    id: configuration.id ?? `gid://watch/LocalApp/${configuration.handle}`,
    name: configuration.name,
    handle: configuration.handle,
    root: path.resolve(),
    extensions: await resolveExtensions(configuration.extensions),
    configurationFile: {
      path: configurationPath,
      value: configuration,
    },
  };

  let watcher: FSWatcher;
  const emitter = createEmitter<{change: Omit<LocalApp, 'on'>}>();

  return {
    get id() {
      return currentApp.id;
    },
    get name() {
      return currentApp.name;
    },
    get handle() {
      return currentApp.handle;
    },
    get root() {
      return currentApp.root;
    },
    get extensions() {
      return currentApp.extensions;
    },
    get configurationFile() {
      return currentApp.configurationFile;
    },
    on(...args: any[]) {
      watcher =
        watcher ??
        (() => {
          const fsWatcher = watch(
            [
              configurationPath,
              ...currentApp.extensions.map(
                (extension) => extension.configurationFile.path,
              ),
            ],
            {ignoreInitial: true},
          );

          fsWatcher.on('change', async () => {
            const newApp = await loadAppFromFileSystem();
            currentApp = newApp;
            emitter.emit('change', newApp);
          });

          return fsWatcher;
        })();

      return (emitter as any).on(...args);
    },
  };
}

async function loadAppFromFileSystem(): Promise<Omit<LocalApp, 'on'>> {
  const configurationPath = path.resolve('app.toml');
  const configuration = await tryLoad<Partial<LocalAppConfiguration>>(
    configurationPath,
  );

  validateAppConfig(configuration);

  return {
    id: configuration.id ?? `gid://watch/LocalApp/1`,
    name: configuration.name,
    handle: configuration.handle,
    root: path.resolve(),
    extensions: await resolveExtensions(configuration.extensions),
    configurationFile: {
      path: configurationPath,
      value: configuration,
    },
  };
}

async function tryLoad<T>(file: string): Promise<T> {
  const exists = await access(file)
    .then(() => true)
    .catch(() => false);

  if (!exists) {
    throw new Error(`No file: ${file}`);
  }

  const result = parse(await readFile(file, {encoding: 'utf8'}));

  return result as any;
}

function validateAppConfig(
  value: Partial<LocalAppConfiguration>,
): asserts value is LocalAppConfiguration {
  if (value.name == null) {
    throw new Error('App config missing field `name`');
  }

  if (value.handle == null) {
    throw new Error('App config missing field `handle`');
  }

  return value as any;
}

async function resolveExtensions(
  extensions: LocalAppConfiguration['extensions'],
) {
  if (extensions == null) return [];

  const extensionEntries =
    typeof extensions === 'string'
      ? [loadExtensionEntry(extensions)]
      : extensions.map((extension) => loadExtensionEntry(extension));

  const loadErrors: {directory: string; pattern: string}[] = [];
  const resolvedExtensions: LocalExtension[] = [];

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
): Promise<LocalExtension> {
  const configurationPath = path.resolve(directory, 'extension.toml');
  const configuration = await tryLoad<Partial<LocalExtensionConfiguration>>(
    configurationPath,
  );

  validateExtensionConfig(configuration);

  return {
    id:
      configuration.id ??
      `gid://watch/LocalClipsExtension/${configuration.handle}`,
    name: configuration.name,
    handle: configuration.handle,
    root: directory,
    extends: configuration.extends,
    settings: {fields: [], ...configuration.settings},
    configurationFile: {
      path: configurationPath,
      value: configuration,
    },
  };
}

function validateExtensionConfig(
  value: Partial<LocalExtensionConfiguration>,
): asserts value is LocalExtensionConfiguration {
  if (value.name == null) {
    throw new Error('Extension config missing field `name`');
  }

  if (value.handle == null) {
    throw new Error('Extension config missing field `handle`');
  }

  return value as any;
}

function loadExtensionEntry(pattern: string): LocalExtensionEntry {
  return {
    pattern,
    directories: glob.sync(
      pattern.endsWith(path.sep) ? pattern : `${pattern}${path.sep}`,
      {absolute: true},
    ),
  };
}
