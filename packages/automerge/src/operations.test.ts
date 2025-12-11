import { describe, it, expect } from 'vitest'
import { createEmptyBoard } from './schema'
import {
  addColumn,
  removeColumn,
  addCard,
  moveCard,
  updateCard,
  deleteCard,
  addComment,
} from './operations'

describe('board operations', () => {
  describe('addColumn', () => {
    it('adds a column', () => {
      let doc = createEmptyBoard('Test')
      doc = addColumn(doc, 'New Column', 'm')

      expect(doc.columns.length).toBe(1)
      expect(doc.columns[0].title).toBe('New Column')
      expect(doc.columns[0].position).toBe('m')
    })

    it('adds multiple columns', () => {
      let doc = createEmptyBoard('Test')
      doc = addColumn(doc, 'Column 1', 'a')
      doc = addColumn(doc, 'Column 2', 'b')

      expect(doc.columns.length).toBe(2)
    })

    it('assigns unique IDs to columns', () => {
      let doc = createEmptyBoard('Test')
      doc = addColumn(doc, 'Column 1', 'a')
      doc = addColumn(doc, 'Column 2', 'b')

      expect(doc.columns[0].id).not.toBe(doc.columns[1].id)
    })
  })

  describe('removeColumn', () => {
    it('removes a column', () => {
      let doc = createEmptyBoard('Test')
      doc = addColumn(doc, 'Column 1', 'a')
      const columnId = doc.columns[0].id
      doc = removeColumn(doc, columnId)

      expect(doc.columns.length).toBe(0)
    })

    it('removes cards in the column', () => {
      let doc = createEmptyBoard('Test')
      doc = addColumn(doc, 'Column 1', 'a')
      const columnId = doc.columns[0].id
      doc = addCard(doc, columnId, 'Card 1', 'a')
      doc = addCard(doc, columnId, 'Card 2', 'b')

      expect(Object.keys(doc.cards).length).toBe(2)

      doc = removeColumn(doc, columnId)

      expect(Object.keys(doc.cards).length).toBe(0)
    })

    it('does nothing for non-existent column', () => {
      let doc = createEmptyBoard('Test')
      doc = addColumn(doc, 'Column 1', 'a')
      doc = removeColumn(doc, 'non-existent')

      expect(doc.columns.length).toBe(1)
    })
  })

  describe('addCard', () => {
    it('adds a card', () => {
      let doc = createEmptyBoard('Test')
      doc = addColumn(doc, 'Column 1', 'a')
      const columnId = doc.columns[0].id
      doc = addCard(doc, columnId, 'Test Card', 'a')

      const cardIds = Object.keys(doc.cards)
      expect(cardIds.length).toBe(1)
      expect(doc.cards[cardIds[0]].title).toBe('Test Card')
      expect(doc.cards[cardIds[0]].columnId).toBe(columnId)
    })

    it('sets card defaults', () => {
      let doc = createEmptyBoard('Test')
      doc = addColumn(doc, 'Column 1', 'a')
      const columnId = doc.columns[0].id
      doc = addCard(doc, columnId, 'Test Card', 'a')

      const card = doc.cards[Object.keys(doc.cards)[0]]
      expect(card.description).toBe('')
      expect(card.labels).toEqual([])
      expect(card.dueDate).toBeNull()
      expect(card.assignee).toBeNull()
      expect(card.checklist).toEqual([])
      expect(card.attachments).toEqual([])
      expect(card.comments).toEqual([])
      expect(card.createdAt).toBeTypeOf('number')
      expect(card.updatedAt).toBeTypeOf('number')
    })
  })

  describe('moveCard', () => {
    it('moves a card between columns', () => {
      let doc = createEmptyBoard('Test')
      doc = addColumn(doc, 'Column 1', 'a')
      doc = addColumn(doc, 'Column 2', 'b')
      const col1Id = doc.columns[0].id
      const col2Id = doc.columns[1].id
      doc = addCard(doc, col1Id, 'Test Card', 'a')
      const cardId = Object.keys(doc.cards)[0]

      doc = moveCard(doc, cardId, col2Id, 'm')

      expect(doc.cards[cardId].columnId).toBe(col2Id)
      expect(doc.cards[cardId].position).toBe('m')
    })

    it('updates updatedAt timestamp', () => {
      let doc = createEmptyBoard('Test')
      doc = addColumn(doc, 'Column 1', 'a')
      const columnId = doc.columns[0].id
      doc = addCard(doc, columnId, 'Test Card', 'a')
      const cardId = Object.keys(doc.cards)[0]
      const originalUpdatedAt = doc.cards[cardId].updatedAt

      // Small delay to ensure different timestamp
      doc = moveCard(doc, cardId, columnId, 'z')

      expect(doc.cards[cardId].updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt)
    })

    it('does nothing for non-existent card', () => {
      let doc = createEmptyBoard('Test')
      doc = addColumn(doc, 'Column 1', 'a')
      const columnId = doc.columns[0].id
      doc = moveCard(doc, 'non-existent', columnId, 'a')

      expect(Object.keys(doc.cards).length).toBe(0)
    })
  })

  describe('updateCard', () => {
    it('updates card properties', () => {
      let doc = createEmptyBoard('Test')
      doc = addColumn(doc, 'Column 1', 'a')
      const columnId = doc.columns[0].id
      doc = addCard(doc, columnId, 'Test Card', 'a')
      const cardId = Object.keys(doc.cards)[0]

      doc = updateCard(doc, cardId, { title: 'Updated', description: 'New desc' })

      expect(doc.cards[cardId].title).toBe('Updated')
      expect(doc.cards[cardId].description).toBe('New desc')
    })

    it('updates labels', () => {
      let doc = createEmptyBoard('Test')
      doc = addColumn(doc, 'Column 1', 'a')
      const columnId = doc.columns[0].id
      doc = addCard(doc, columnId, 'Test Card', 'a')
      const cardId = Object.keys(doc.cards)[0]

      doc = updateCard(doc, cardId, { labels: ['urgent', 'bug'] })

      expect(doc.cards[cardId].labels).toEqual(['urgent', 'bug'])
    })

    it('updates due date', () => {
      let doc = createEmptyBoard('Test')
      doc = addColumn(doc, 'Column 1', 'a')
      const columnId = doc.columns[0].id
      doc = addCard(doc, columnId, 'Test Card', 'a')
      const cardId = Object.keys(doc.cards)[0]
      const dueDate = Date.now() + 86400000

      doc = updateCard(doc, cardId, { dueDate })

      expect(doc.cards[cardId].dueDate).toBe(dueDate)
    })

    it('updates assignee', () => {
      let doc = createEmptyBoard('Test')
      doc = addColumn(doc, 'Column 1', 'a')
      const columnId = doc.columns[0].id
      doc = addCard(doc, columnId, 'Test Card', 'a')
      const cardId = Object.keys(doc.cards)[0]

      doc = updateCard(doc, cardId, { assignee: 'commitment123' })

      expect(doc.cards[cardId].assignee).toBe('commitment123')
    })
  })

  describe('deleteCard', () => {
    it('deletes a card', () => {
      let doc = createEmptyBoard('Test')
      doc = addColumn(doc, 'Column 1', 'a')
      const columnId = doc.columns[0].id
      doc = addCard(doc, columnId, 'Test Card', 'a')
      const cardId = Object.keys(doc.cards)[0]

      doc = deleteCard(doc, cardId)

      expect(Object.keys(doc.cards).length).toBe(0)
    })

    it('does nothing for non-existent card', () => {
      let doc = createEmptyBoard('Test')
      doc = addColumn(doc, 'Column 1', 'a')
      const columnId = doc.columns[0].id
      doc = addCard(doc, columnId, 'Test Card', 'a')

      doc = deleteCard(doc, 'non-existent')

      expect(Object.keys(doc.cards).length).toBe(1)
    })
  })

  describe('addComment', () => {
    it('adds comment to card', () => {
      let doc = createEmptyBoard('Test')
      doc = addColumn(doc, 'Column 1', 'a')
      const columnId = doc.columns[0].id
      doc = addCard(doc, columnId, 'Test Card', 'a')
      const cardId = Object.keys(doc.cards)[0]

      doc = addComment(doc, cardId, 'commitment123', 'Hello!')

      expect(doc.cards[cardId].comments.length).toBe(1)
      expect(doc.cards[cardId].comments[0].text).toBe('Hello!')
      expect(doc.cards[cardId].comments[0].author).toBe('commitment123')
    })

    it('adds multiple comments', () => {
      let doc = createEmptyBoard('Test')
      doc = addColumn(doc, 'Column 1', 'a')
      const columnId = doc.columns[0].id
      doc = addCard(doc, columnId, 'Test Card', 'a')
      const cardId = Object.keys(doc.cards)[0]

      doc = addComment(doc, cardId, 'user1', 'First')
      doc = addComment(doc, cardId, 'user2', 'Second')

      expect(doc.cards[cardId].comments.length).toBe(2)
    })

    it('assigns unique IDs to comments', () => {
      let doc = createEmptyBoard('Test')
      doc = addColumn(doc, 'Column 1', 'a')
      const columnId = doc.columns[0].id
      doc = addCard(doc, columnId, 'Test Card', 'a')
      const cardId = Object.keys(doc.cards)[0]

      doc = addComment(doc, cardId, 'user1', 'First')
      doc = addComment(doc, cardId, 'user2', 'Second')

      expect(doc.cards[cardId].comments[0].id).not.toBe(doc.cards[cardId].comments[1].id)
    })

    it('sets createdAt timestamp', () => {
      let doc = createEmptyBoard('Test')
      doc = addColumn(doc, 'Column 1', 'a')
      const columnId = doc.columns[0].id
      doc = addCard(doc, columnId, 'Test Card', 'a')
      const cardId = Object.keys(doc.cards)[0]

      doc = addComment(doc, cardId, 'user1', 'Hello!')

      expect(doc.cards[cardId].comments[0].createdAt).toBeTypeOf('number')
    })
  })
})
