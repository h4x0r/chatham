/**
 * X25519 Key Wrapping
 * @packageDocumentation
 */

import { x25519 } from '@noble/curves/ed25519'
import { hkdf } from '@noble/hashes/hkdf'
import { sha256 } from '@noble/hashes/sha256'

/**
 * A wrapped key with ephemeral public key for ECDH
 */
export interface WrappedKey {
  ephemeralPublicKey: Uint8Array
  ciphertext: Uint8Array
  iv: Uint8Array
}

/**
 * Wrap a key for a recipient using X25519 ECDH
 * @param key - The key to wrap (e.g., board key)
 * @param recipientPublicKey - Recipient's X25519 public key
 * @returns Wrapped key that only recipient can unwrap
 */
export async function wrapKey(
  key: Uint8Array,
  recipientPublicKey: Uint8Array
): Promise<WrappedKey> {
  // Generate ephemeral keypair
  const ephemeralPrivate = crypto.getRandomValues(new Uint8Array(32))
  const ephemeralPublicKey = x25519.getPublicKey(ephemeralPrivate)

  // ECDH shared secret
  const sharedSecret = x25519.getSharedSecret(ephemeralPrivate, recipientPublicKey)

  // Derive wrapping key
  const wrappingKeyRaw = hkdf(sha256, sharedSecret, undefined, 'wrap-key', 32)
  const wrappingKey = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(wrappingKeyRaw),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  )

  // Encrypt the key
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    wrappingKey,
    new Uint8Array(key)
  )

  return {
    ephemeralPublicKey,
    ciphertext: new Uint8Array(ciphertext),
    iv,
  }
}

/**
 * Unwrap a key using recipient's private key
 * @param wrapped - The wrapped key from wrapKey()
 * @param recipientPrivateKey - Recipient's X25519 private key
 * @returns The original unwrapped key
 */
export async function unwrapKey(
  wrapped: WrappedKey,
  recipientPrivateKey: Uint8Array
): Promise<Uint8Array> {
  // ECDH shared secret
  const sharedSecret = x25519.getSharedSecret(
    recipientPrivateKey,
    wrapped.ephemeralPublicKey
  )

  // Derive wrapping key
  const wrappingKeyRaw = hkdf(sha256, sharedSecret, undefined, 'wrap-key', 32)
  const wrappingKey = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(wrappingKeyRaw),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  )

  // Decrypt the key
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(wrapped.iv) },
    wrappingKey,
    new Uint8Array(wrapped.ciphertext)
  )

  return new Uint8Array(plaintext)
}
