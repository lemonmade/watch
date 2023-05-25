import * as path from 'path';
import {readFileSync} from 'fs';
import {parse} from '@iarna/toml';
import {globSync} from 'glob';

import {
  APP_CONFIGURATION_FILE_NAME,
  EXTENSION_CONFIGURATION_FILE_NAME,
} from './constants.ts';

const EXTENSION_TARGET_SCHEMA_MAP = new Map([
  ['series.details.accessory', 'graphql/SeriesDetails.schema.graphql'],
  [
    'watch-through.details.accessory',
    'graphql/WatchThroughDetails.schema.graphql',
  ],
]);

export interface GraphQLProject {
  schema: string;
  documents: string[];
}

export function extensionGraphQLProjects(): Record<string, GraphQLProject> {
  try {
    const appConfig = readToml<{extensions?: string[]}>(
      APP_CONFIGURATION_FILE_NAME,
    );

    const extensions = globSync(
      appConfig.extensions ?? `**/${EXTENSION_CONFIGURATION_FILE_NAME}`,
      {
        ignore: ['**/node_modules/**'],
      },
    ).map((match) =>
      match.endsWith('.toml')
        ? match
        : path.join(match, EXTENSION_CONFIGURATION_FILE_NAME),
    );

    const projects: Record<string, GraphQLProject> = {};

    for (const extension of extensions) {
      const extensionRoot = path.dirname(extension);
      const extensionConfig = readToml<{
        handle: string;
        extends: {target: string; query?: string}[];
      }>(extension);

      for (const {target, query} of extensionConfig.extends) {
        if (query == null) continue;

        const schema = EXTENSION_TARGET_SCHEMA_MAP.get(target);

        if (schema == null) {
          throw new Error(
            `No schema found for target "${target}" (extension: "${extensionConfig.handle}")`,
          );
        }

        projects[`${extensionConfig.handle}.${target}`] = {
          schema: path.join(
            extensionRoot,
            'node_modules/@watching/clips',
            schema,
          ),
          documents: [path.join(extensionRoot, query)],
        };
      }
    }

    return projects;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return {};
  }
}

function read(file: string) {
  return readFileSync(file, 'utf8');
}

function readToml<T = unknown>(file: string) {
  return parse(read(file)) as T;
}
