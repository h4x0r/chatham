import { generatePhrase, validatePhrase as validateMnemonic, phraseToSeed, deriveKeys } from '@chatham/crypto'
import { identityFromSeed } from '@chatham/semaphore'

export function generateRecoveryPhrase(): string {
  // 256 bits = 24 words
  return generatePhrase()
}

export function validatePhrase(phrase: string): boolean {
  return validateMnemonic(phrase)
}

export interface Identity {
  commitment: string
  publicKey: string
  privateKey: string
}

export async function deriveIdentityFromPhrase(phrase: string): Promise<Identity> {
  // Convert phrase to 512-bit seed
  const seedBuffer = phraseToSeed(phrase)

  // Ensure it's a proper Uint8Array (bip39 returns Buffer in Node.js)
  const seed = new Uint8Array(seedBuffer)

  // Derive X25519 keys for encryption/key wrapping
  const keys = deriveKeys(seed)

  // Derive Semaphore identity for ZK proofs
  const semaphoreIdentity = identityFromSeed(seed)

  // Convert Uint8Array keys to base64 strings for storage
  const publicKeyBase64 = Buffer.from(keys.publicKey).toString('base64')
  const privateKeyBase64 = Buffer.from(keys.privateKey).toString('base64')

  // Convert bigint commitment to string for storage
  const commitmentString = semaphoreIdentity.commitment.toString()

  return {
    commitment: commitmentString,
    publicKey: publicKeyBase64,
    privateKey: privateKeyBase64
  }
}
