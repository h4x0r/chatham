import { describe, it, expect } from 'vitest'
import { generateMembershipProof, verifyMembershipProof } from './proof'
import { createGroup, addMember } from './group'
import { identityFromSeed } from './identity'

// Helper to create deterministic seed for testing
function createTestSeed(value: number): Uint8Array {
  const seed = new Uint8Array(64)
  seed.fill(value)
  return seed
}

describe('semaphore proof', () => {
  it('generates and verifies valid proof', async () => {
    const group = createGroup()
    const identity = identityFromSeed(createTestSeed(1))
    addMember(group, identity.commitment)

    const scope = 'board_123'
    const message = 'access'

    const proof = await generateMembershipProof(identity, group, message, scope)
    const valid = await verifyMembershipProof(proof, group.root)

    expect(valid).toBe(true)
  }, 60000) // ZK proofs can take time

  it('proof contains expected fields', async () => {
    const group = createGroup()
    const identity = identityFromSeed(createTestSeed(1))
    addMember(group, identity.commitment)

    const proof = await generateMembershipProof(identity, group, 'test', 'scope')

    expect(proof.merkleTreeRoot).toBeDefined()
    expect(proof.nullifier).toBeDefined()
    expect(proof.message).toBeDefined()
    expect(proof.scope).toBeDefined()
    expect(proof.points).toBeDefined()
  }, 60000)

  it('rejects proof with wrong merkle root', async () => {
    const group = createGroup()
    const identity = identityFromSeed(createTestSeed(1))
    addMember(group, identity.commitment)

    const proof = await generateMembershipProof(identity, group, 'test', 'scope')

    // Use a fake merkle root
    const wrongRoot = 12345n
    const valid = await verifyMembershipProof(proof, wrongRoot)

    expect(valid).toBe(false)
  }, 60000)

  it('rejects proof from non-member', async () => {
    const group = createGroup()
    const member = identityFromSeed(createTestSeed(1))
    const nonMember = identityFromSeed(createTestSeed(2))
    addMember(group, member.commitment)

    await expect(
      generateMembershipProof(nonMember, group, 'test', 'scope')
    ).rejects.toThrow()
  }, 60000)

  it('different scopes produce different nullifiers', async () => {
    const group = createGroup()
    const identity = identityFromSeed(createTestSeed(1))
    addMember(group, identity.commitment)

    const proof1 = await generateMembershipProof(identity, group, 'msg', 'scope1')
    const proof2 = await generateMembershipProof(identity, group, 'msg', 'scope2')

    expect(proof1.nullifier).not.toBe(proof2.nullifier)
  }, 60000)

  it('same scope produces same nullifier (prevents double-spend)', async () => {
    const group = createGroup()
    const identity = identityFromSeed(createTestSeed(1))
    addMember(group, identity.commitment)

    const proof1 = await generateMembershipProof(identity, group, 'msg', 'same_scope')
    const proof2 = await generateMembershipProof(identity, group, 'msg', 'same_scope')

    expect(proof1.nullifier).toBe(proof2.nullifier)
  }, 60000)
})
