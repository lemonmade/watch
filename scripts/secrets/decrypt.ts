#!/usr/bin/env node

import * as path from 'node:path';
import {parseArgs} from 'node:util';

import {decryptFile} from '../../tools/secrets/decrypt.ts';

// Parse command line arguments
const {values} = parseArgs({
  options: {
    file: {type: 'string', short: 'f'},
    key: {type: 'string', short: 'k'},
    help: {type: 'boolean', short: 'h'},
  },
});

// Show help if requested or if required arguments are missing
if (values.help || !values.file || !values.key) {
  console.log(`
Usage: decrypt --file <file> --key <key>

Options:
  --file, -f    Path to the JSON file (relative to current directory)
  --key, -k     Encryption key
  --help, -h    Show this help message
  `);

  process.exit(values.help ? 0 : 1);
}

const {file} = values;
const filePath = path.resolve(process.cwd(), file);

try {
  const decryptedData = await decryptFile(filePath, {key: values.key});
  console.log(JSON.stringify(decryptedData, null, 2));
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
