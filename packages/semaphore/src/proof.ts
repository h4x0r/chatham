/**
 * Semaphore Proof Generation and Verification
 * @packageDocumentation
 */

import { generateProof, verifyProof, type SemaphoreProof } from '@semaphore-protocol/proof'
import { Group } from '@semaphore-protocol/group'
import { Identity } from '@semaphore-protocol/identity'

/**
 * Generate a ZK proof of group membership
 * @param identity - The Semaphore identity of the prover
 * @param group - The group to prove membership in
 * @param message - The message to sign (e.g., "read", "write")
 * @param scope - The scope for nullifier (e.g., "board_123")
 * @returns A Semaphore proof
 */
export async function generateMembershipProof(
  identity: Identity,
  group: Group,
  message: string,
  scope: string
): Promise<SemaphoreProof> {
  return generateProof(identity, group, message, scope)
}

/**
 * Verify a ZK proof of group membership
 * @param proof - The proof to verify
 * @param merkleRoot - The expected Merkle root
 * @returns true if valid, false otherwise
 */
export async function verifyMembershipProof(
  proof: SemaphoreProof,
  merkleRoot: bigint
): Promise<boolean> {
  // Verify the proof matches the expected root
  if (proof.merkleTreeRoot !== merkleRoot) {
    return false
  }
  return verifyProof(proof)
}

export type { SemaphoreProof }
