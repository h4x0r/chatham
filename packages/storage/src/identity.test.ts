import { describe, it, expect, beforeEach } from 'vitest'
import { saveIdentity, loadIdentity, hasIdentity, clearIdentity } from './identity'
import { clearDatabase } from './db'

describe('identity storage', () => {
  beforeEach(async () => {
    await clearDatabase()
  })

  it('saves and loads identity', async () => {
    const identity = {
      privateKey: new Uint8Array([1, 2, 3]),
      publicKey: new Uint8Array([4, 5, 6]),
      semaphoreSecret: new Uint8Array([7, 8, 9]),
      commitment: '12345',
    }

    await saveIdentity(identity)
    const loaded = await loadIdentity()

    expect(loaded).not.toBeNull()
    expect(loaded!.privateKey).toEqual(identity.privateKey)
    expect(loaded!.publicKey).toEqual(identity.publicKey)
    expect(loaded!.commitment).toBe(identity.commitment)
  })

  it('returns null when no identity exists', async () => {
    const loaded = await loadIdentity()
    expect(loaded).toBeNull()
  })

  it('checks if identity exists', async () => {
    expect(await hasIdentity()).toBe(false)

    await saveIdentity({
      privateKey: new Uint8Array([1]),
      publicKey: new Uint8Array([2]),
      semaphoreSecret: new Uint8Array([3]),
      commitment: '123',
    })

    expect(await hasIdentity()).toBe(true)
  })

  it('clears identity', async () => {
    await saveIdentity({
      privateKey: new Uint8Array([1]),
      publicKey: new Uint8Array([2]),
      semaphoreSecret: new Uint8Array([3]),
      commitment: '123',
    })

    await clearIdentity()

    expect(await hasIdentity()).toBe(false)
  })

  it('stores optional phrase', async () => {
    const identity = {
      privateKey: new Uint8Array([1]),
      publicKey: new Uint8Array([2]),
      semaphoreSecret: new Uint8Array([3]),
      commitment: '123',
      phrase: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    }

    await saveIdentity(identity)
    const loaded = await loadIdentity()

    expect(loaded!.phrase).toBe(identity.phrase)
  })

  it('overwrites existing identity', async () => {
    await saveIdentity({
      privateKey: new Uint8Array([1]),
      publicKey: new Uint8Array([2]),
      semaphoreSecret: new Uint8Array([3]),
      commitment: 'first',
    })

    await saveIdentity({
      privateKey: new Uint8Array([10]),
      publicKey: new Uint8Array([20]),
      semaphoreSecret: new Uint8Array([30]),
      commitment: 'second',
    })

    const loaded = await loadIdentity()
    expect(loaded!.commitment).toBe('second')
    expect(loaded!.privateKey).toEqual(new Uint8Array([10]))
  })
})
