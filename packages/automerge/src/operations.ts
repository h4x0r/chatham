/**
 * Automerge Board Operations
 * @packageDocumentation
 */

import * as Automerge from '@automerge/automerge'
import type { BoardContent, Card } from '@zkkb/types'

/**
 * Add a column to the board
 */
export function addColumn(
  doc: Automerge.Doc<BoardContent>,
  title: string,
  position: string
): Automerge.Doc<BoardContent> {
  return Automerge.change(doc, (d) => {
    d.columns.push({
      id: crypto.randomUUID(),
      title,
      position,
    })
  })
}

/**
 * Remove a column and all its cards
 */
export function removeColumn(
  doc: Automerge.Doc<BoardContent>,
  columnId: string
): Automerge.Doc<BoardContent> {
  return Automerge.change(doc, (d) => {
    const index = d.columns.findIndex((c) => c.id === columnId)
    if (index !== -1) {
      d.columns.splice(index, 1)
    }
    // Remove cards in this column
    for (const cardId of Object.keys(d.cards)) {
      if (d.cards[cardId].columnId === columnId) {
        delete d.cards[cardId]
      }
    }
  })
}

/**
 * Add a card to a column
 */
export function addCard(
  doc: Automerge.Doc<BoardContent>,
  columnId: string,
  title: string,
  position: string
): Automerge.Doc<BoardContent> {
  return Automerge.change(doc, (d) => {
    const id = crypto.randomUUID()
    const now = Date.now()
    d.cards[id] = {
      id,
      columnId,
      position,
      title,
      description: '',
      labels: [],
      dueDate: null,
      assignee: null,
      checklist: [],
      attachments: [],
      comments: [],
      createdAt: now,
      updatedAt: now,
    }
  })
}

/**
 * Move a card to a different column/position
 */
export function moveCard(
  doc: Automerge.Doc<BoardContent>,
  cardId: string,
  columnId: string,
  position: string
): Automerge.Doc<BoardContent> {
  return Automerge.change(doc, (d) => {
    if (d.cards[cardId]) {
      d.cards[cardId].columnId = columnId
      d.cards[cardId].position = position
      d.cards[cardId].updatedAt = Date.now()
    }
  })
}

/**
 * Update card properties
 */
export function updateCard(
  doc: Automerge.Doc<BoardContent>,
  cardId: string,
  updates: Partial<Pick<Card, 'title' | 'description' | 'labels' | 'dueDate' | 'assignee' | 'checklist'>>
): Automerge.Doc<BoardContent> {
  return Automerge.change(doc, (d) => {
    if (d.cards[cardId]) {
      Object.assign(d.cards[cardId], updates)
      d.cards[cardId].updatedAt = Date.now()
    }
  })
}

/**
 * Delete a card
 */
export function deleteCard(
  doc: Automerge.Doc<BoardContent>,
  cardId: string
): Automerge.Doc<BoardContent> {
  return Automerge.change(doc, (d) => {
    delete d.cards[cardId]
  })
}

/**
 * Add a comment to a card
 */
export function addComment(
  doc: Automerge.Doc<BoardContent>,
  cardId: string,
  author: string,
  text: string
): Automerge.Doc<BoardContent> {
  return Automerge.change(doc, (d) => {
    if (d.cards[cardId]) {
      d.cards[cardId].comments.push({
        id: crypto.randomUUID(),
        author,
        text,
        createdAt: Date.now(),
      })
      d.cards[cardId].updatedAt = Date.now()
    }
  })
}
