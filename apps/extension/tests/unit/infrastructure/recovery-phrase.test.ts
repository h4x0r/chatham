import { describe, test, expect } from 'vitest'
import { generateRecoveryPhrase, validatePhrase, deriveIdentityFromPhrase } from '@/infrastructure/crypto/recovery-phrase'

describe('generateRecoveryPhrase', () => {
  test('generates 24-word BIP-39 phrase', () => {
    const phrase = generateRecoveryPhrase()

    const words = phrase.split(' ')
    expect(words).toHaveLength(24)
    expect(phrase).toMatch(/^[a-z]+(?: [a-z]+){23}$/)
  })

  test('generates different phrases each time', () => {
    const phrase1 = generateRecoveryPhrase()
    const phrase2 = generateRecoveryPhrase()

    expect(phrase1).not.toBe(phrase2)
  })
})

describe('validatePhrase', () => {
  test('accepts valid BIP-39 phrase', () => {
    const phrase = generateRecoveryPhrase()
    expect(validatePhrase(phrase)).toBe(true)
  })

  test('rejects invalid phrase', () => {
    expect(validatePhrase('not a valid phrase')).toBe(false)
    expect(validatePhrase('abandon abandon abandon')).toBe(false)
  })
})

describe('deriveIdentityFromPhrase', () => {
  test('derives same identity from same phrase', async () => {
    const phrase = generateRecoveryPhrase()

    const identity1 = await deriveIdentityFromPhrase(phrase)
    const identity2 = await deriveIdentityFromPhrase(phrase)

    expect(identity1.commitment).toBe(identity2.commitment)
    expect(identity1.publicKey).toBe(identity2.publicKey)
  })

  test('derives different identities from different phrases', async () => {
    const phrase1 = generateRecoveryPhrase()
    const phrase2 = generateRecoveryPhrase()

    const identity1 = await deriveIdentityFromPhrase(phrase1)
    const identity2 = await deriveIdentityFromPhrase(phrase2)

    expect(identity1.commitment).not.toBe(identity2.commitment)
  })
})
