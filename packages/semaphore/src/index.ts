/**
 * @chatham/semaphore - Zero-knowledge proof integration
 * @packageDocumentation
 */

export { identityFromSeed, createIdentity, Identity } from './identity'
export {
  createGroup,
  addMember,
  removeMember,
  isMember,
  exportGroup,
  importGroup,
  Group,
  type ExportedGroup,
} from './group'
export {
  generateMembershipProof,
  verifyMembershipProof,
  type SemaphoreProof,
} from './proof'
