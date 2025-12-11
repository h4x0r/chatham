import { describe, it, expect } from 'vitest'
import { generateKey, importKey, exportKey, encrypt, decrypt } from './aes'

describe('aes', () => {
  it('generates a 256-bit key', async () => {
    const key = await generateKey()
    const exported = await crypto.subtle.exportKey('raw', key)
    expect(exported.byteLength).toBe(32)
  })

  it('encrypts and decrypts data', async () => {
    const key = await generateKey()
    const plaintext = new TextEncoder().encode('Hello, World!')

    const { ciphertext, iv } = await encrypt(key, plaintext)
    const decrypted = await decrypt(key, ciphertext, iv)

    expect(decrypted).toEqual(plaintext)
  })

  it('produces different ciphertext each time', async () => {
    const key = await generateKey()
    const plaintext = new TextEncoder().encode('Hello, World!')

    const result1 = await encrypt(key, plaintext)
    const result2 = await encrypt(key, plaintext)

    expect(result1.ciphertext).not.toEqual(result2.ciphertext)
    expect(result1.iv).not.toEqual(result2.iv)
  })

  it('fails to decrypt with wrong key', async () => {
    const key1 = await generateKey()
    const key2 = await generateKey()
    const plaintext = new TextEncoder().encode('Hello, World!')

    const { ciphertext, iv } = await encrypt(key1, plaintext)

    await expect(decrypt(key2, ciphertext, iv)).rejects.toThrow()
  })

  it('exports and imports key correctly', async () => {
    const original = await generateKey()
    const exported = await exportKey(original)
    const imported = await importKey(exported)

    const plaintext = new TextEncoder().encode('Test data')
    const { ciphertext, iv } = await encrypt(original, plaintext)
    const decrypted = await decrypt(imported, ciphertext, iv)

    expect(decrypted).toEqual(plaintext)
  })

  it('generates 12-byte IV', async () => {
    const key = await generateKey()
    const plaintext = new TextEncoder().encode('Test')

    const { iv } = await encrypt(key, plaintext)

    expect(iv.byteLength).toBe(12)
  })

  it('handles empty plaintext', async () => {
    const key = await generateKey()
    const plaintext = new Uint8Array(0)

    const { ciphertext, iv } = await encrypt(key, plaintext)
    const decrypted = await decrypt(key, ciphertext, iv)

    expect(decrypted).toEqual(plaintext)
  })

  it('handles large data', async () => {
    const key = await generateKey()
    // Create 64KB of data (max for getRandomValues)
    const plaintext = crypto.getRandomValues(new Uint8Array(65536))

    const { ciphertext, iv } = await encrypt(key, plaintext)
    const decrypted = await decrypt(key, ciphertext, iv)

    expect(decrypted).toEqual(plaintext)
  })
})
