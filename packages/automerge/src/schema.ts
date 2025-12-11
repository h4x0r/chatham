/**
 * Automerge Board Schema
 * @packageDocumentation
 */

import * as Automerge from '@automerge/automerge'
import type { BoardContent } from '@chatham/types'

/**
 * Create an empty board document
 */
export function createEmptyBoard(name: string): Automerge.Doc<BoardContent> {
  return Automerge.from({
    name,
    members: {},
    columns: [],
    cards: {},
  } as BoardContent)
}

/**
 * Create a board with initial setup (creator as first member, default columns)
 */
export function initializeBoard(
  name: string,
  creatorCommitment: string,
  creatorDisplayName: string,
  creatorPublicKey: string,
  wrappedBoardKey: string,
  creatorColor: string
): Automerge.Doc<BoardContent> {
  return Automerge.from({
    name,
    members: {
      [creatorCommitment]: {
        displayName: creatorDisplayName,
        publicKey: creatorPublicKey,
        wrappedBoardKey,
        color: creatorColor,
        joinedAt: Date.now(),
      },
    },
    columns: [
      { id: crypto.randomUUID(), title: 'To Do', position: 'a' },
      { id: crypto.randomUUID(), title: 'In Progress', position: 'n' },
      { id: crypto.randomUUID(), title: 'Done', position: 'z' },
    ],
    cards: {},
  } as BoardContent)
}
