import { describe, it, expect } from 'vitest'
import { createEmptyBoard, initializeBoard } from './schema'

describe('schema', () => {
  describe('createEmptyBoard', () => {
    it('creates board with specified name', () => {
      const doc = createEmptyBoard('Test Board')
      expect(doc.name).toBe('Test Board')
    })

    it('creates board with empty members', () => {
      const doc = createEmptyBoard('Test')
      expect(doc.members).toEqual({})
    })

    it('creates board with empty columns', () => {
      const doc = createEmptyBoard('Test')
      expect(doc.columns).toEqual([])
    })

    it('creates board with empty cards', () => {
      const doc = createEmptyBoard('Test')
      expect(doc.cards).toEqual({})
    })
  })

  describe('initializeBoard', () => {
    it('creates board with specified name', () => {
      const doc = initializeBoard(
        'My Board',
        'commitment123',
        'Alice',
        'pubkey123',
        'wrappedkey123',
        '#ff0000'
      )
      expect(doc.name).toBe('My Board')
    })

    it('adds creator as first member', () => {
      const doc = initializeBoard(
        'My Board',
        'commitment123',
        'Alice',
        'pubkey123',
        'wrappedkey123',
        '#ff0000'
      )

      expect(doc.members['commitment123']).toBeDefined()
      expect(doc.members['commitment123'].displayName).toBe('Alice')
      expect(doc.members['commitment123'].publicKey).toBe('pubkey123')
      expect(doc.members['commitment123'].wrappedBoardKey).toBe('wrappedkey123')
      expect(doc.members['commitment123'].color).toBe('#ff0000')
      expect(doc.members['commitment123'].joinedAt).toBeTypeOf('number')
    })

    it('creates default columns', () => {
      const doc = initializeBoard(
        'My Board',
        'commitment123',
        'Alice',
        'pubkey123',
        'wrappedkey123',
        '#ff0000'
      )

      expect(doc.columns).toHaveLength(3)
      expect(doc.columns[0].title).toBe('To Do')
      expect(doc.columns[1].title).toBe('In Progress')
      expect(doc.columns[2].title).toBe('Done')
    })

    it('assigns positions to columns', () => {
      const doc = initializeBoard(
        'My Board',
        'commitment123',
        'Alice',
        'pubkey123',
        'wrappedkey123',
        '#ff0000'
      )

      expect(doc.columns[0].position).toBe('a')
      expect(doc.columns[1].position).toBe('n')
      expect(doc.columns[2].position).toBe('z')
    })

    it('assigns unique IDs to columns', () => {
      const doc = initializeBoard(
        'My Board',
        'commitment123',
        'Alice',
        'pubkey123',
        'wrappedkey123',
        '#ff0000'
      )

      const ids = doc.columns.map((c) => c.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(3)
    })

    it('creates board with empty cards', () => {
      const doc = initializeBoard(
        'My Board',
        'commitment123',
        'Alice',
        'pubkey123',
        'wrappedkey123',
        '#ff0000'
      )

      expect(doc.cards).toEqual({})
    })
  })
})
