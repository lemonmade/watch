import '@quilted/polyfills/fetch';
import * as path from 'path';
import * as fs from 'fs/promises';

import type {Ui} from '../../ui';

import {prompt, createPackageTemplates} from '@quilted/cli-kit';
import {emptyDirectory, isEmpty, createOutputTarget} from './files';

export async function create(_: {ui: Ui}) {
  const templates = await createPackageTemplates({
    from: import.meta.url,
    directory: 'templates',
  });

  const name = await prompt({
    type: 'text',
    message: 'What would you like to name your extension?',
  });

  const handle = toHandle(name);

  const format = await prompt({
    type: 'select',
    message: 'What format would you like to use?',
    choices: [
      {title: 'Basic', value: 'basic'},
      {title: 'DOM', value: 'dom'},
      {title: 'React', value: 'react'},
    ],
  });

  const directory = path.resolve('extensions', toPascalCase(handle));

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

  const template = await templates.load(`SeriesAccessory/${format}`);
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
