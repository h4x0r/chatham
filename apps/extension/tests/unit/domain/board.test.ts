import { describe, test, expect } from 'vitest'
import { createBoard, addCard } from '@/domain/board'

describe('createBoard', () => {
  test('creates board with name and default columns', () => {
    const board = createBoard('Security Review', 'user-123')

    expect(board.name).toBe('Security Review')
    expect(board.columns).toHaveLength(3)
    expect(board.columns[0].title).toBe('To Do')
    expect(board.columns[1].title).toBe('In Progress')
    expect(board.columns[2].title).toBe('Done')
  })
})

describe('addCard', () => {
  test('adds card to specified column', () => {
    const board = createBoard('Test Board', 'user-123')
    const columnId = board.columns[0].id

    const updated = addCard(board, columnId, {
      title: 'Fix CVE-2024-1234',
      description: 'Critical RCE vulnerability'
    })

    const cards = Object.values(updated.cards)
    expect(cards).toHaveLength(1)
    expect(cards[0].title).toBe('Fix CVE-2024-1234')
    expect(cards[0].description).toBe('Critical RCE vulnerability')
    expect(cards[0].columnId).toBe(columnId)
  })
})
