/**
 * Semaphore Group Management
 * @packageDocumentation
 */

import { Group } from '@semaphore-protocol/group'

/**
 * Create an empty Semaphore group
 */
export function createGroup(): Group {
  return new Group()
}

/**
 * Add a member commitment to a group
 */
export function addMember(group: Group, commitment: bigint): void {
  group.addMember(commitment)
}

/**
 * Remove a member from a group by commitment
 */
export function removeMember(group: Group, commitment: bigint): void {
  const index = group.indexOf(commitment)
  if (index !== -1) {
    group.removeMember(index)
  }
}

/**
 * Check if a commitment is in the group
 */
export function isMember(group: Group, commitment: bigint): boolean {
  return group.indexOf(commitment) !== -1
}

/**
 * Exported group format for serialization
 */
export interface ExportedGroup {
  members: string[]
}

/**
 * Export a group to JSON-serializable format
 */
export function exportGroup(group: Group): ExportedGroup {
  return {
    members: group.members.map((m) => m.toString()),
  }
}

/**
 * Import a group from exported format
 */
export function importGroup(exported: ExportedGroup): Group {
  const group = new Group()
  for (const member of exported.members) {
    group.addMember(BigInt(member))
  }
  return group
}

export { Group }
