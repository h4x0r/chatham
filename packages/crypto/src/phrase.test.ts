import { describe, it, expect } from 'vitest'
import { generatePhrase, phraseToSeed, validatePhrase } from './phrase'

describe('phrase', () => {
  it('generates a 24-word phrase', () => {
    const phrase = generatePhrase()
    const words = phrase.split(' ')
    expect(words).toHaveLength(24)
  })

  it('generates different phrases each time', () => {
    const phrase1 = generatePhrase()
    const phrase2 = generatePhrase()
    expect(phrase1).not.toBe(phrase2)
  })

  it('converts phrase to deterministic seed', () => {
    const phrase = generatePhrase()
    const seed1 = phraseToSeed(phrase)
    const seed2 = phraseToSeed(phrase)
    expect(seed1).toEqual(seed2)
    expect(seed1.byteLength).toBe(64)
  })

  it('validates correct phrase', () => {
    const phrase = generatePhrase()
    expect(validatePhrase(phrase)).toBe(true)
  })

  it('rejects invalid phrase', () => {
    expect(validatePhrase('invalid phrase here')).toBe(false)
  })

  it('rejects empty phrase', () => {
    expect(validatePhrase('')).toBe(false)
  })

  it('rejects phrase with wrong word count', () => {
    expect(validatePhrase('abandon abandon abandon')).toBe(false)
  })
})
