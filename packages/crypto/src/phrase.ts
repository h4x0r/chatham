/**
 * BIP39 Recovery Phrase Generation
 * @packageDocumentation
 */

import * as bip39 from 'bip39'

/**
 * Generate a new 24-word BIP39 mnemonic phrase
 * @returns A space-separated string of 24 words
 */
export function generatePhrase(): string {
  return bip39.generateMnemonic(256) // 24 words
}

/**
 * Convert a mnemonic phrase to a 512-bit seed
 * @param phrase - The 24-word mnemonic phrase
 * @returns A 64-byte Uint8Array seed
 */
export function phraseToSeed(phrase: string): Uint8Array {
  return bip39.mnemonicToSeedSync(phrase)
}

/**
 * Validate a BIP39 mnemonic phrase
 * @param phrase - The phrase to validate
 * @returns true if valid, false otherwise
 */
export function validatePhrase(phrase: string): boolean {
  return bip39.validateMnemonic(phrase)
}
