import '@quilted/polyfills/fetch';
import * as path from 'path';
import * as fs from 'fs/promises';

import type {Ui} from '../../ui';

import {prompt} from './prompts';
import {
  emptyDirectory,
  isEmpty,
  loadTemplate,
  createOutputTarget,
} from './files';

export async function create(_: {ui: Ui}) {
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

  const directory = path.resolve('extensions', handle);

  if (!(await isEmpty(directory))) {
    const overwrite = await prompt({
      type: 'confirm',
      message: `The directory ${directory} already exists. Would you like to overwrite it?`,
    });

    if (!overwrite) return;

    await emptyDirectory(directory);
  } else {
    await fs.mkdir(directory, {recursive: true});
  }

  const template = loadTemplate('SeriesAccessory', format as any);
  const output = createOutputTarget(directory);
  console.log(output.root);

  await template.copy(output.root);
}

function toHandle(projectName: string) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z0-9-~@/]+/g, '-');
}
