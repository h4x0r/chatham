import { describe, it, expect } from 'vitest'
import { identityFromSeed, createIdentity } from './identity'

// Helper to create deterministic seed for testing
function createTestSeed(value: number): Uint8Array {
  const seed = new Uint8Array(64)
  seed.fill(value)
  return seed
}

describe('semaphore identity', () => {
  describe('identityFromSeed', () => {
    it('creates identity from seed deterministically', () => {
      const seed = createTestSeed(1)

      const identity1 = identityFromSeed(seed)
      const identity2 = identityFromSeed(seed)

      expect(identity1.commitment).toBe(identity2.commitment)
    })

    it('different seeds produce different identities', () => {
      const seed1 = createTestSeed(1)
      const seed2 = createTestSeed(2)

      const identity1 = identityFromSeed(seed1)
      const identity2 = identityFromSeed(seed2)

      expect(identity1.commitment).not.toBe(identity2.commitment)
    })

    it('identity has commitment', () => {
      const seed = createTestSeed(1)
      const identity = identityFromSeed(seed)

      expect(identity.commitment).toBeDefined()
      expect(typeof identity.commitment).toBe('bigint')
    })

    it('identity has secret scalar', () => {
      const seed = createTestSeed(1)
      const identity = identityFromSeed(seed)

      // The identity has a secretScalar that's used for proof generation
      expect(identity.secretScalar).toBeDefined()
      expect(typeof identity.secretScalar).toBe('bigint')
    })

    it('identity commitment is a bigint', () => {
      const seed = createTestSeed(1)
      const identity = identityFromSeed(seed)

      // Commitment should be a large bigint
      expect(identity.commitment > 0n).toBe(true)
    })
  })

  describe('createIdentity', () => {
    it('creates random identity', () => {
      const identity = createIdentity()

      expect(identity.commitment).toBeDefined()
      expect(typeof identity.commitment).toBe('bigint')
    })

    it('creates different identities each time', () => {
      const identity1 = createIdentity()
      const identity2 = createIdentity()

      expect(identity1.commitment).not.toBe(identity2.commitment)
    })
  })
})
