import '@quilted/polyfills/fetch';
import * as path from 'path';
import * as fs from 'fs/promises';

import {
  prompt,
  parseArguments,
  createPackageTemplates,
  getPackageManager,
  createPackageManagerRunner,
} from '@quilted/cli-kit';

import type {Ui} from '../../ui';

import {emptyDirectory, isEmpty, createOutputTarget} from './files';
import {checkForAccount} from './account-check';

export async function create({ui}: {ui: Ui}) {
  await checkForAccount({ui});

  const args = parseArguments(
    {
      '--name': String,
      '--handle': String,
      '--template': String,
      '--format': String,
      '--directory': String,
      '--no-install': String,
    },
    {
      argv: process.argv.slice(2),
      permissive: true,
    },
  );

  const templates = await createPackageTemplates({
    from: import.meta.url,
    directory: 'templates',
  });

  const name = args['--name']
    ? validateName(args['--name'])
    : await prompt({
        type: 'text',
        message: 'What would you like to name your extension?',
      });

  const handle = args['--handle']
    ? validateHandle(args['--handle'])
    : toHandle(name);

  const extensionTemplate = args['--template']
    ? validateTemplate(args['--template'])
    : await prompt({
        type: 'select',
        message: 'What extension template would you like to use?',
        choices: [
          {
            title: 'Series accessory',
            value: 'SeriesAccessory',
            description:
              'Renders in the main column of the details screen for a single TV series',
          },
          {
            title: 'Watch-through accessory',
            value: 'WatchThroughAccessory',
            description:
              'Renders directly below the section on a series watch-through where the user records the the episodes of the series they are watching',
          },
        ],
      });

  const format = args['--format']
    ? validateFormat(args['--format'])
    : await prompt({
        type: 'select',
        message: 'What format would you like to use?',
        choices: [
          {title: 'DOM', value: 'dom'},
          {title: 'Preact', value: 'preact'},
          {title: 'React', value: 'react'},
        ],
      });

  const directory = args['--directory']
    ? path.resolve(args['--directory'])
    : path.resolve('extensions', toPascalCase(handle));

  if (!(await isEmpty(directory))) {
    const overwrite = await prompt({
      type: 'confirm',
      message: `The directory ${path.relative(
        process.cwd(),
        directory,
      )} already exists. Would you like to overwrite it?`,
    });

    if (!overwrite) return;

    await emptyDirectory(directory);
  } else {
    await fs.mkdir(directory, {recursive: true});
  }

  const template = await templates.load(`${extensionTemplate}/${format}`);
  const output = createOutputTarget(directory);

  await template.copy(output.root, {
    async handleFile(file, {read}) {
      if (file === 'extension.toml' || file === 'package.json') {
        return replace(await read(), {
          name,
          handle,
        });
      }

      return true;
    },
  });

  if (!args['--no-install']) {
    const packageManager = (await getPackageManager(directory)) ?? 'npm';

    ui.TextBlock(`Installing dependencies with ${ui.Code(packageManager)}...`);

    await createPackageManagerRunner(packageManager).install();
  }
}

function validateName(name: string) {
  const trimmed = name.trim();

  if (trimmed === '') {
    throw new Error('--name cannot be empty');
  }

  return trimmed;
}

function validateHandle(handle: string) {
  const trimmed = handle.trim();

  if (trimmed === '') {
    throw new Error('--handle cannot be empty');
  }

  if (!/^[a-z0-9-]+$/.test(trimmed)) {
    throw new Error(
      '--handle must be a lowercased string containing only letters, numbers, and dashes',
    );
  }

  return trimmed;
}

const VALID_TEMPLATES = new Map(
  ['SeriesAccessory', 'WatchThroughAccessory'].map((template) => [
    template.toLowerCase(),
    template,
  ]),
);

function validateTemplate(template: string) {
  const normalized = template
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, '');

  const resolvedTemplate = VALID_TEMPLATES.get(normalized);

  if (resolvedTemplate == null) {
    throw new Error(
      `--template must be one of ${Array.from(VALID_TEMPLATES.values()).join(
        ', ',
      )}`,
    );
  }

  return resolvedTemplate;
}

const VALID_FORMATS = new Set(['dom', 'preact', 'react']);

function validateFormat(format: string) {
  const normalized = format.trim().toLowerCase();

  if (!VALID_FORMATS.has(normalized)) {
    throw new Error(
      `--format must be one of ${Array.from(VALID_FORMATS.values()).join(
        ', ',
      )}`,
    );
  }

  return normalized;
}

function replace(content: string, replacements: Record<string, string>) {
  return content.replace(
    new RegExp(`{{\\s*(${Object.keys(replacements).join('|')})\\s*}}`, 'g'),
    (_, match) => replacements[match]!,
  );
}

function toHandle(projectName: string) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z0-9-~@/]+/g, '-');
}

function toPascalCase(value: string) {
  return (
    value[0]!.toUpperCase() +
    value.slice(1).replace(/[_.\- ]+(\w|$)/g, (_, x) => x.toUpperCase())
  );
}
