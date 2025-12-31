import pako from 'pako';
import { dateReplacer } from './helpers.ts';

/**
 * Converts a Uint8Array to a binary string representation.
 * Processes the array in chunks to avoid "Maximum call stack size exceeded" errors
 * with `String.fromCharCode.apply` on large arrays.
 * @param {Uint8Array} bytes The array to convert.
 * @returns {string} The binary string.
 */
const uint8ArrayToBinaryString = (bytes: Uint8Array): string => {
    let binary = '';
    const chunkSize = 8192; // Process in chunks of 8KB
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        // Using `Array.from` to convert the chunk to a regular array of numbers
        // that `String.fromCharCode.apply` can handle. This is much more robust
        // than applying to the whole array at once.
        binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    return binary;
};


// Function to serialize and compress state to a URL-safe string
export const serializeState = (state: any): string => {
  try {
    const jsonString = JSON.stringify(state, dateReplacer);
    const compressed = pako.deflate(jsonString);
    const binaryString = uint8ArrayToBinaryString(compressed);
    const base64String = btoa(binaryString);
    // URL-safe base64 encoding
    return base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  } catch (e) {
    console.error("Failed to serialize state:", e);
    return '';
  }
};

// Function to decompress and deserialize state from a URL-safe string
export const deserializeState = (encodedState: string): any | null => {
  try {
    // URL-safe base64 decoding
    let base64 = encodedState.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    
    const binaryString = atob(base64);
    const compressed = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      compressed[i] = binaryString.charCodeAt(i);
    }

    const jsonString = pako.inflate(compressed, { to: 'string' });
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Failed to deserialize state:", e);
    // This can happen if the hash is not valid state, e.g., for an anchor link
    return null;
  }
};
