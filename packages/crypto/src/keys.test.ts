import { describe, it, expect } from 'vitest'
import { deriveKeys } from './keys'
import { generatePhrase, phraseToSeed } from './phrase'

describe('keys', () => {
  it('derives keypair from seed', () => {
    const phrase = generatePhrase()
    const seed = phraseToSeed(phrase)
    const keys = deriveKeys(seed)

    expect(keys.publicKey).toBeInstanceOf(Uint8Array)
    expect(keys.privateKey).toBeInstanceOf(Uint8Array)
    expect(keys.publicKey.byteLength).toBe(32)
    expect(keys.privateKey.byteLength).toBe(32)
  })

  it('derives same keys from same seed', () => {
    const phrase = generatePhrase()
    const seed = phraseToSeed(phrase)
    const keys1 = deriveKeys(seed)
    const keys2 = deriveKeys(seed)

    expect(keys1.publicKey).toEqual(keys2.publicKey)
    expect(keys1.privateKey).toEqual(keys2.privateKey)
  })

  it('derives different keys from different seeds', () => {
    const seed1 = phraseToSeed(generatePhrase())
    const seed2 = phraseToSeed(generatePhrase())
    const keys1 = deriveKeys(seed1)
    const keys2 = deriveKeys(seed2)

    expect(keys1.publicKey).not.toEqual(keys2.publicKey)
    expect(keys1.privateKey).not.toEqual(keys2.privateKey)
  })

  it('public key differs from private key', () => {
    const seed = phraseToSeed(generatePhrase())
    const keys = deriveKeys(seed)

    expect(keys.publicKey).not.toEqual(keys.privateKey)
  })
})
