import { describe, it, expect } from 'vitest'
import { wrapKey, unwrapKey } from './wrap'
import { deriveKeys } from './keys'
import { generateKey, exportKey } from './aes'
import { generatePhrase, phraseToSeed } from './phrase'

describe('wrap', () => {
  it('wraps and unwraps a key', async () => {
    const recipient = deriveKeys(phraseToSeed(generatePhrase()))
    const boardKey = await generateKey()
    const boardKeyRaw = await exportKey(boardKey)

    const wrapped = await wrapKey(boardKeyRaw, recipient.publicKey)
    const unwrapped = await unwrapKey(wrapped, recipient.privateKey)

    expect(unwrapped).toEqual(boardKeyRaw)
  })

  it('cannot unwrap with wrong private key', async () => {
    const recipient = deriveKeys(phraseToSeed(generatePhrase()))
    const wrongRecipient = deriveKeys(phraseToSeed(generatePhrase()))
    const boardKey = await generateKey()
    const boardKeyRaw = await exportKey(boardKey)

    const wrapped = await wrapKey(boardKeyRaw, recipient.publicKey)

    await expect(unwrapKey(wrapped, wrongRecipient.privateKey)).rejects.toThrow()
  })

  it('produces different wrapped keys each time', async () => {
    const recipient = deriveKeys(phraseToSeed(generatePhrase()))
    const boardKey = await generateKey()
    const boardKeyRaw = await exportKey(boardKey)

    const wrapped1 = await wrapKey(boardKeyRaw, recipient.publicKey)
    const wrapped2 = await wrapKey(boardKeyRaw, recipient.publicKey)

    expect(wrapped1.ephemeralPublicKey).not.toEqual(wrapped2.ephemeralPublicKey)
    expect(wrapped1.ciphertext).not.toEqual(wrapped2.ciphertext)
    expect(wrapped1.iv).not.toEqual(wrapped2.iv)
  })

  it('wrapped key has correct structure', async () => {
    const recipient = deriveKeys(phraseToSeed(generatePhrase()))
    const boardKeyRaw = crypto.getRandomValues(new Uint8Array(32))

    const wrapped = await wrapKey(boardKeyRaw, recipient.publicKey)

    expect(wrapped.ephemeralPublicKey).toBeInstanceOf(Uint8Array)
    expect(wrapped.ephemeralPublicKey.byteLength).toBe(32)
    expect(wrapped.ciphertext).toBeInstanceOf(Uint8Array)
    expect(wrapped.iv).toBeInstanceOf(Uint8Array)
    expect(wrapped.iv.byteLength).toBe(12)
  })

  it('can wrap arbitrary data', async () => {
    const recipient = deriveKeys(phraseToSeed(generatePhrase()))
    const secretData = new TextEncoder().encode('secret message')

    const wrapped = await wrapKey(secretData, recipient.publicKey)
    const unwrapped = await unwrapKey(wrapped, recipient.privateKey)

    expect(unwrapped).toEqual(secretData)
  })
})
