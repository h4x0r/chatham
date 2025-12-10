/**
 * Semaphore Identity from Seed
 * @packageDocumentation
 */

import { Identity } from '@semaphore-protocol/identity'
import { hkdf } from '@noble/hashes/hkdf'
import { sha256 } from '@noble/hashes/sha256'

/**
 * Create a Semaphore identity from a seed (deterministic)
 * @param seed - The 64-byte seed from phraseToSeed()
 * @returns A Semaphore Identity
 */
export function identityFromSeed(seed: Uint8Array): Identity {
  // Derive deterministic secret from seed
  const secret = hkdf(sha256, seed.slice(0, 32), undefined, 'semaphore-identity', 32)
  return new Identity(secret)
}

/**
 * Create a new random Semaphore identity
 */
export function createIdentity(): Identity {
  return new Identity()
}

export { Identity }
