import * as path from 'path';
import {readFile, access} from 'fs/promises';
import {EventEmitter} from '@quilted/events';
import type {FSWatcher} from 'chokidar';

import type {ExtensionPoint} from '@watching/clips';

import {
  APP_CONFIGURATION_FILE_NAME,
  EXTENSION_CONFIGURATION_FILE_NAME,
} from './constants.ts';

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
  readonly on: EventEmitter<{change: Omit<LocalApp, 'on'>}>['on'];
  readonly once: EventEmitter<{change: Omit<LocalApp, 'once'>}>['once'];
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
  readonly loading?: {ui?: string};
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

export async function loadLocalApp(root = process.cwd()): Promise<LocalApp> {
  const configurationPath = path.resolve(root, APP_CONFIGURATION_FILE_NAME);
  const configuration =
    await tryLoad<Partial<LocalAppConfiguration>>(configurationPath);

  validateAppConfig(configuration);

  let currentApp: Omit<LocalApp, 'on' | 'once'> = {
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

  const {watch} = await import('chokidar');
  let watcher: FSWatcher;

  const emitter = new EventEmitter<{change: Omit<LocalApp, 'on' | 'once'>}>();

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
      createWatcher();
      return (emitter as any).on(...args);
    },
    once(...args: any[]) {
      createWatcher();
      return (emitter as any).once(...args);
    },
  };

  function createWatcher() {
    if (watcher != null) return;

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

    watcher = fsWatcher;
  }
}

export async function loadLocalExtension(
  root = process.cwd(),
): Promise<LocalExtension> {
  const configurationPath = path.resolve(
    root,
    EXTENSION_CONFIGURATION_FILE_NAME,
  );
  const configuration =
    await tryLoad<Partial<LocalExtensionConfiguration>>(configurationPath);

  validateExtensionConfig(configuration);

  return {
    id:
      configuration.id ??
      `gid://watch/LocalClipsExtension/${configuration.handle}`,
    name: configuration.name,
    handle: configuration.handle,
    root,
    extends: configuration.extends,
    settings: {fields: [], ...configuration.settings},
    configurationFile: {
      path: configurationPath,
      value: configuration,
    },
  };
}

async function loadAppFromFileSystem(): Promise<Omit<LocalApp, 'on' | 'once'>> {
  const configurationPath = path.resolve(APP_CONFIGURATION_FILE_NAME);
  const configuration =
    await tryLoad<Partial<LocalAppConfiguration>>(configurationPath);

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

  const {parse} = await import('@iarna/toml');

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
      ? [await loadExtensionEntry(extensions)]
      : await Promise.all(
          extensions.map((extension) => loadExtensionEntry(extension)),
        );

  const loadErrors: {directory: string; pattern: string}[] = [];
  const resolvedExtensions: LocalExtension[] = [];

  await Promise.all(
    extensionEntries.map(async ({pattern, directories}) => {
      await Promise.all(
        directories.map(async (directory) => {
          try {
            resolvedExtensions.push(await loadLocalExtension(directory));
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

async function loadExtensionEntry(
  pattern: string,
): Promise<LocalExtensionEntry> {
  const {globSync} = await import('glob');

  return {
    pattern,
    directories: globSync(
      pattern.endsWith(path.sep) ? pattern : `${pattern}${path.sep}`,
      {absolute: true},
    ),
  };
}
