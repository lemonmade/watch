#!/usr/bin/env node

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {parseArgs} from 'node:util';

import {encryptValue} from '../../tools/secrets/encrypt.ts';

// Parse command line arguments
const {values} = parseArgs({
  options: {
    key: {type: 'string', short: 'k'},
    name: {type: 'string', short: 'n'},
    value: {type: 'string', short: 'v'},
    file: {type: 'string', short: 'f'},
    help: {type: 'boolean', short: 'h'},
  },
});

// Show help if requested or if required arguments are missing
if (
  values.help ||
  !values.name ||
  !values.value ||
  !values.file ||
  !values.key
) {
  console.log(`
Usage: encrypt --name <name> --value <value> --file <file> --key <key>

Options:
  --name, -n     The key to add to the JSON file
  --value, -v   The unencrypted value to store
  --file, -f    Path to the JSON file (relative to current directory)
  --key, -k     Encryption key
  --help, -h    Show this help message
  `);

  process.exit(values.help ? 0 : 1);
}

const {name, value, file} = values;
const filePath = path.resolve(process.cwd(), file);

try {
  // Check if file exists, if not create an empty JSON object
  let jsonData: Record<string, string> = {};

  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    jsonData = JSON.parse(fileContent);
  } catch (error) {
    // If file doesn't exist or isn't valid JSON, start with empty object
    console.log(`Creating new file at ${filePath}`);

    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), {recursive: true});
  }

  // Encrypt the value
  const encryptedValue = await encryptValue(value, {key: values.key});

  // Add the encrypted value to the JSON object
  jsonData[name] = encryptedValue;

  // Sort keys alphabetically
  const sortedData: Record<string, string> = {};
  Object.keys(jsonData)
    .sort()
    .forEach((k) => {
      sortedData[k] = jsonData[k]!;
    });

  // Write the updated JSON back to the file
  await fs.writeFile(
    filePath,
    JSON.stringify(sortedData, null, 2) + '\n',
    'utf8',
  );

  console.log(`Successfully added encrypted key '${name}' to ${filePath}`);
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
