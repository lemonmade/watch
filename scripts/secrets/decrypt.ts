#!/usr/bin/env node

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {webcrypto} from 'node:crypto';
import {parseArgs} from 'node:util';

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

/**
 * Decrypts all values in a JSON file using the ENCRYPTION_KEY environment variable
 */
export async function decryptFile(file: string, {key}: {key: string}) {
  const fileContent = await fs.readFile(file, 'utf8');
  const jsonData = JSON.parse(fileContent);

  const decryptedData: Record<string, string> = {};

  for (const [secret, value] of Object.entries(jsonData)) {
    const decryptedValue = await decryptValue(value as string, {key});
    decryptedData[secret] = decryptedValue;
  }

  return decryptedData;
}

/**
 * Decrypts a value using Web Crypto API with AES-GCM
 */
async function decryptValue(
  encryptedValue: string,
  {key}: {key: string},
): Promise<string> {
  // Split the encrypted value into IV and encrypted data
  const [ivHex, encryptedHex] = encryptedValue.split(':');
  if (!ivHex || !encryptedHex) {
    throw new Error('Invalid encrypted value format');
  }

  // Convert hex strings back to binary data
  const iv = hexToBuffer(ivHex);
  const encryptedData = hexToBuffer(encryptedHex);

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
    ['decrypt'],
  );

  // Decrypt the value
  const decryptedData = await webcrypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    cryptoKey,
    encryptedData,
  );

  // Convert the decrypted data back to a string
  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
}

/**
 * Converts a hex string to a buffer
 */
function hexToBuffer(hex: string): Uint8Array {
  const buffer = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    buffer[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return buffer;
}
