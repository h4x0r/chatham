/**
 * Key Derivation from Seed
 * @packageDocumentation
 */

import { hkdf } from '@noble/hashes/hkdf'
import { sha256 } from '@noble/hashes/sha256'
import { x25519 } from '@noble/curves/ed25519'

/**
 * A keypair for X25519 key exchange
 */
export interface KeyPair {
  publicKey: Uint8Array
  privateKey: Uint8Array
}

/**
 * Derive an X25519 keypair from a seed
 * @param seed - The 64-byte seed from phraseToSeed()
 * @returns An X25519 keypair for key wrapping
 */
export function deriveKeys(seed: Uint8Array): KeyPair {
  // Derive private key using HKDF
  const privateKey = hkdf(sha256, seed.slice(0, 32), undefined, 'zkkb-x25519', 32)
  const publicKey = x25519.getPublicKey(privateKey)

  return { publicKey, privateKey }
}
