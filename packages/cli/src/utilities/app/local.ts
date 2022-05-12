import * as path from 'path';
import {readFile, stat} from 'fs/promises';

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
  readonly extensions?: string | readonly string[];
}

export interface LocalApp {
  readonly id: string;
  readonly name: string;
  readonly root: string;
  readonly extensions: readonly LocalExtension[];
  readonly configurationFile: LocalConfigurationFile<LocalAppConfiguration>;
}

interface LocalExtensionConfigurationTranslatedString {
  readonly translation: string;
}

export type LocalExtensionConfigurationString =
  | string
  | LocalExtensionConfigurationTranslatedString;

interface LocalExtensionUserConfigurationSchemaStringField {
  type: 'string';
  id: string;
  label: LocalExtensionConfigurationString;
  default?: string;
}

interface LocalExtensionUserConfigurationSchemaNumberField {
  type: 'number';
  id: string;
  label: LocalExtensionConfigurationString;
  default?: number;
}

interface LocalExtensionUserConfigurationSchemaOptionsFieldOption {
  readonly value: string;
  readonly label: LocalExtensionConfigurationString;
}

interface LocalExtensionUserConfigurationSchemaOptionsField {
  type: 'options';
  id: string;
  label: LocalExtensionConfigurationString;
  default?: string;
  options: readonly LocalExtensionUserConfigurationSchemaOptionsFieldOption[];
}

type LocalExtensionUserConfigurationSchemaField =
  | LocalExtensionUserConfigurationSchemaStringField
  | LocalExtensionUserConfigurationSchemaNumberField
  | LocalExtensionUserConfigurationSchemaOptionsField;

interface LocalExtensionUserConfiguration {
  readonly schema: readonly LocalExtensionUserConfigurationSchemaField[];
}

interface LocalExtensionPointSupportSeriesCondition {
  readonly handle?: string;
}

interface LocalExtensionPointSupportCondition {
  readonly series?: LocalExtensionPointSupportSeriesCondition;
}

interface LocalExtensionPointSupport {
  readonly id: ExtensionPoint;
  readonly module: string;
  readonly conditions?: LocalExtensionPointSupportCondition[];
}

interface LocalExtensionConfiguration {
  readonly id?: string;
  readonly name: string;
  readonly extensionPoints: readonly LocalExtensionPointSupport[];
  readonly configuration?: Partial<LocalExtensionUserConfiguration>;
}

export interface LocalExtension {
  readonly id: string;
  readonly name: string;
  readonly root: string;
  readonly handle: string;
  readonly extensionPoints: readonly LocalExtensionPointSupport[];
  readonly configuration: LocalExtensionUserConfiguration;
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

  return {
    id:
      configuration.id ??
      `gid://watch/LocalApp/${configuration.name
        .toLocaleLowerCase()
        .replace(/\s+/g, '-')}`,
    name: configuration.name,
    root: path.resolve(),
    extensions: await resolveExtensions(configuration.extensions),
    configurationFile: {
      path: configurationPath,
      value: configuration,
    },
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
  value: Partial<LocalAppConfiguration>,
): asserts value is LocalAppConfiguration {
  if (value.name == null) {
    throw new Error('App config missing field `name`');
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

  const handle = configuration.name.toLocaleLowerCase().replace(/\s+/g, '-');

  return {
    id: configuration.id ?? `gid://watch/LocalClipsExtension/${handle}`,
    name: configuration.name,
    handle,
    root: directory,
    extensionPoints: configuration.extensionPoints,
    configuration: {schema: [], ...configuration.configuration},
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
    throw new Error('App config missing field `name`');
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
