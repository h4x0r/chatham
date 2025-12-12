import type { BoardContent } from '@chatham/types'
import {
  Automerge,
  initializeBoard,
  addCard as addCardOp,
  updateCard as updateCardOp
} from '@chatham/automerge'

export function createBoard(name: string, creatorCommitment: string): Automerge.Doc<BoardContent> {
  return initializeBoard(
    name,
    creatorCommitment,
    'Anonymous', // Default display name
    '', // publicKey placeholder
    '', // wrappedBoardKey placeholder
    '#3b82f6' // Default blue color
  )
}

export interface CardInput {
  title: string
  description: string
}

export function addCard(
  board: Automerge.Doc<BoardContent>,
  columnId: string,
  input: CardInput
): Automerge.Doc<BoardContent> {
  const position = generatePosition()
  // First add the card with title and position
  let updated = addCardOp(board, columnId, input.title, position)

  // If description is provided, update the card
  if (input.description) {
    const cardId = Object.keys(updated.cards).find(id =>
      updated.cards[id].columnId === columnId &&
      updated.cards[id].title === input.title &&
      updated.cards[id].position === position
    )
    if (cardId) {
      updated = updateCardOp(updated, cardId, { description: input.description })
    }
  }

  return updated
}

function generatePosition(): string {
  // Simple fractional indexing - use 'a' + random for now
  return 'a' + Math.random().toString(36).substring(2, 9)
}
