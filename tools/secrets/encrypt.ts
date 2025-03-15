import {webcrypto} from 'node:crypto';

/**
 * Encrypts a value using Web Crypto API with AES-GCM
 */
export async function encryptValue(
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
