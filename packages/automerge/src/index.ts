/**
 * @chatham/automerge - CRDT operations for boards
 * @packageDocumentation
 */

export { createEmptyBoard, initializeBoard } from './schema'
export {
  addColumn,
  removeColumn,
  addCard,
  moveCard,
  updateCard,
  deleteCard,
  addComment,
} from './operations'

// Re-export Automerge utilities that consumers will need
export * as Automerge from '@automerge/automerge'
