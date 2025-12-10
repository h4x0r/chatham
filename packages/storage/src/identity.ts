/**
 * Identity Storage
 * @packageDocumentation
 */

import { openDatabase } from './db'

/**
 * Stored identity data
 */
export interface StoredIdentity {
  privateKey: Uint8Array
  publicKey: Uint8Array
  semaphoreSecret: Uint8Array
  commitment: string
  phrase?: string
}

const IDENTITY_KEY = 'current'

/**
 * Save identity to IndexedDB
 */
export async function saveIdentity(identity: StoredIdentity): Promise<void> {
  const db = await openDatabase()
  await db.put('identity', {
    id: IDENTITY_KEY,
    ...identity,
  })
}

/**
 * Load identity from IndexedDB
 */
export async function loadIdentity(): Promise<StoredIdentity | null> {
  const db = await openDatabase()
  const stored = await db.get('identity', IDENTITY_KEY)
  if (!stored) return null

  return {
    privateKey: stored.privateKey,
    publicKey: stored.publicKey,
    semaphoreSecret: stored.semaphoreSecret,
    commitment: stored.commitment,
    phrase: stored.phrase,
  }
}

/**
 * Check if an identity exists
 */
export async function hasIdentity(): Promise<boolean> {
  const identity = await loadIdentity()
  return identity !== null
}

/**
 * Clear identity from IndexedDB
 */
export async function clearIdentity(): Promise<void> {
  const db = await openDatabase()
  await db.delete('identity', IDENTITY_KEY)
}
