#!/usr/bin/env node

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {webcrypto} from 'node:crypto';
import {parseArgs} from 'node:util';

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

/**
 * Encrypts a value using Web Crypto API with AES-GCM
 */
async function encryptValue(
  value: string,
  {key}: {key: string},
): Promise<string> {
  // Convert the encryption key to a suitable format
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);

  // Create a hash of the key for use as the actual encryption key
  const keyHash = await webcrypto.subtle.digest('SHA-256', keyData);

  // Import the key for use with AES-GCM
  const cryptoKey = await webcrypto.subtle.importKey(
    'raw',
    keyHash,
    {name: 'AES-GCM'},
    false,
    ['encrypt'],
  );

  // Generate a random IV
  const iv = webcrypto.getRandomValues(new Uint8Array(12));

  // Encrypt the value
  const valueData = encoder.encode(value);
  const encryptedData = await webcrypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    cryptoKey,
    valueData,
  );

  // Convert binary data to hex strings for storage
  const encryptedHex = bufferToHex(new Uint8Array(encryptedData));
  const ivHex = bufferToHex(iv);

  // Return the iv and encrypted value as a single string
  return `${ivHex}:${encryptedHex}`;
}

/**
 * Converts a buffer to a hex string
 */
function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
