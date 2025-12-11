import { describe, it, expect } from 'vitest'
import {
  createGroup,
  addMember,
  removeMember,
  isMember,
  exportGroup,
  importGroup,
} from './group'
import { identityFromSeed } from './identity'

// Helper to create deterministic seed for testing
function createTestSeed(value: number): Uint8Array {
  const seed = new Uint8Array(64)
  seed.fill(value)
  return seed
}

describe('semaphore group', () => {
  describe('createGroup', () => {
    it('creates empty group', () => {
      const group = createGroup()
      expect(group.members.length).toBe(0)
    })
  })

  describe('addMember', () => {
    it('adds member to group', () => {
      const group = createGroup()
      const identity = identityFromSeed(createTestSeed(1))

      addMember(group, identity.commitment)

      expect(group.members.length).toBe(1)
      expect(isMember(group, identity.commitment)).toBe(true)
    })

    it('adds multiple members', () => {
      const group = createGroup()
      const identity1 = identityFromSeed(createTestSeed(1))
      const identity2 = identityFromSeed(createTestSeed(2))

      addMember(group, identity1.commitment)
      addMember(group, identity2.commitment)

      expect(group.members.length).toBe(2)
    })
  })

  describe('removeMember', () => {
    it('removes member from group', () => {
      const group = createGroup()
      const identity = identityFromSeed(createTestSeed(1))

      addMember(group, identity.commitment)
      removeMember(group, identity.commitment)

      expect(isMember(group, identity.commitment)).toBe(false)
    })

    it('does nothing for non-member', () => {
      const group = createGroup()
      const identity1 = identityFromSeed(createTestSeed(1))
      const identity2 = identityFromSeed(createTestSeed(2))

      addMember(group, identity1.commitment)
      removeMember(group, identity2.commitment)

      expect(group.members.length).toBe(1)
    })
  })

  describe('isMember', () => {
    it('returns true for member', () => {
      const group = createGroup()
      const identity = identityFromSeed(createTestSeed(1))

      addMember(group, identity.commitment)

      expect(isMember(group, identity.commitment)).toBe(true)
    })

    it('returns false for non-member', () => {
      const group = createGroup()
      const identity = identityFromSeed(createTestSeed(1))

      expect(isMember(group, identity.commitment)).toBe(false)
    })
  })

  describe('export/import', () => {
    it('exports and imports group', () => {
      const group = createGroup()
      const identity = identityFromSeed(createTestSeed(1))
      addMember(group, identity.commitment)

      const exported = exportGroup(group)
      const imported = importGroup(exported)

      expect(imported.root).toBe(group.root)
      expect(isMember(imported, identity.commitment)).toBe(true)
    })

    it('exports members as strings', () => {
      const group = createGroup()
      const identity = identityFromSeed(createTestSeed(1))
      addMember(group, identity.commitment)

      const exported = exportGroup(group)

      expect(typeof exported.members[0]).toBe('string')
    })

    it('handles empty group', () => {
      const group = createGroup()

      const exported = exportGroup(group)
      const imported = importGroup(exported)

      expect(imported.members.length).toBe(0)
    })

    it('preserves multiple members', () => {
      const group = createGroup()
      const identity1 = identityFromSeed(createTestSeed(1))
      const identity2 = identityFromSeed(createTestSeed(2))
      addMember(group, identity1.commitment)
      addMember(group, identity2.commitment)

      const exported = exportGroup(group)
      const imported = importGroup(exported)

      expect(imported.members.length).toBe(2)
      expect(isMember(imported, identity1.commitment)).toBe(true)
      expect(isMember(imported, identity2.commitment)).toBe(true)
    })
  })
})
