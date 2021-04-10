import * as path from 'path';
import {readFile, stat} from 'fs/promises';

import {sync as glob} from 'glob';
import {parse} from '@iarna/toml';

import type {ExtensionPoint} from '@watching/clips';

export interface LocalAppConfiguration {
  readonly id: string;
  readonly name: string;
  readonly extensions?: string | readonly string[];
}

export interface LocalApp {
  readonly id: string;
  readonly root: string;
  readonly extensions: readonly LocalExtension[];
  readonly configuration: LocalAppConfiguration;
}

interface LocalExtensionConfigurationTranslatedString {
  readonly translation: string;
}

export type LocalExtensionConfigurationString =
  | string
  | LocalExtensionConfigurationTranslatedString;

interface LocalExtensionUserConfigurationSchemaStringField {
  type: 'string';
  key: string;
  label: LocalExtensionConfigurationString;
  default?: string;
}

interface LocalExtensionUserConfigurationSchemaNumberField {
  type: 'number';
  key: string;
  label: LocalExtensionConfigurationString;
  default?: number;
}

interface LocalExtensionUserConfigurationSchemaOptionsFieldOption {
  readonly value: string;
  readonly label: LocalExtensionConfigurationString;
}

interface LocalExtensionUserConfigurationSchemaOptionsField {
  type: 'options';
  key: string;
  label: LocalExtensionConfigurationString;
  default?: string;
  options: readonly LocalExtensionUserConfigurationSchemaOptionsFieldOption[];
}

type LocalExtensionUserConfigurationSchemaField =
  | LocalExtensionUserConfigurationSchemaStringField
  | LocalExtensionUserConfigurationSchemaNumberField
  | LocalExtensionUserConfigurationSchemaOptionsField;

interface LocalExtensionUserConfiguration {
  readonly schema?: readonly LocalExtensionUserConfigurationSchemaField[];
}

interface ExtensionPointSupportSeriesCondition {
  readonly series: string;
}

type ExtensionPointSupportCondition = ExtensionPointSupportSeriesCondition;

interface ExtensionPointSupport {
  readonly id: ExtensionPoint;
  readonly conditions?: ExtensionPointSupportCondition[];
}

interface LocalExtensionConfiguration {
  readonly id?: string;
  readonly name: string;
  readonly extensionPoints: readonly ExtensionPointSupport[];
  readonly userConfiguration?: LocalExtensionUserConfiguration;
}

export interface LocalExtension {
  readonly id: string;
  readonly root: string;
  readonly configuration: LocalExtensionConfiguration;
}

interface LocalExtensionEntry {
  readonly pattern: string;
  readonly directories: string[];
}

export async function loadLocalApp(): Promise<LocalApp> {
  const configuration = await tryLoad<Partial<LocalAppConfiguration>>(
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
  const configuration = await tryLoad<Partial<LocalExtensionConfiguration>>(
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
    directories: glob(
      pattern.endsWith(path.sep) ? pattern : `${pattern}${path.sep}`,
      {absolute: true},
    ),
  };
}
