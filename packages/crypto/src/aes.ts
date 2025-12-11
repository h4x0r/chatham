/**
 * AES-256-GCM Encryption
 * @packageDocumentation
 */

/**
 * Generate a new AES-256-GCM key
 */
export async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

/**
 * Import a raw key buffer as an AES-256-GCM CryptoKey
 */
export async function importKey(raw: Uint8Array): Promise<CryptoKey> {
  // Ensure we have a proper ArrayBuffer-backed Uint8Array for Web Crypto
  const keyData = new Uint8Array(raw)
  return crypto.subtle.importKey('raw', keyData, { name: 'AES-GCM' }, true, [
    'encrypt',
    'decrypt',
  ])
}

/**
 * Export a CryptoKey to raw bytes
 */
export async function exportKey(key: CryptoKey): Promise<Uint8Array> {
  const raw = await crypto.subtle.exportKey('raw', key)
  return new Uint8Array(raw)
}

/**
 * Result of an encryption operation
 */
export interface EncryptedData {
  ciphertext: Uint8Array
  iv: Uint8Array
}

/**
 * Encrypt data with AES-256-GCM
 * @param key - The AES key
 * @param plaintext - Data to encrypt
 * @returns Ciphertext and IV
 */
export async function encrypt(
  key: CryptoKey,
  plaintext: Uint8Array
): Promise<EncryptedData> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  // Ensure proper ArrayBuffer-backed arrays for Web Crypto
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new Uint8Array(plaintext)
  )
  return { ciphertext: new Uint8Array(ciphertext), iv }
}

/**
 * Decrypt data with AES-256-GCM
 * @param key - The AES key
 * @param ciphertext - Data to decrypt
 * @param iv - The IV used during encryption
 * @returns Decrypted plaintext
 */
export async function decrypt(
  key: CryptoKey,
  ciphertext: Uint8Array,
  iv: Uint8Array
): Promise<Uint8Array> {
  // Ensure proper ArrayBuffer-backed arrays for Web Crypto
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    new Uint8Array(ciphertext)
  )
  return new Uint8Array(plaintext)
}
