import { describe, test, expect, beforeEach } from 'vitest'
import { BoardRepository } from '@/infrastructure/storage/board-repository'
import { createBoard } from '@/domain/board'
import 'fake-indexeddb/auto'

describe('BoardRepository', () => {
  let repository: BoardRepository

  beforeEach(async () => {
    repository = new BoardRepository()
    await repository.initialize()
  })

  test('saves and retrieves board', async () => {
    const board = createBoard('Test Board', 'user-123')
    const boardKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )

    await repository.saveBoard('board-1', board, boardKey)
    const retrieved = await repository.getBoard('board-1', boardKey)

    expect(retrieved.name).toBe('Test Board')
    expect(retrieved.columns).toHaveLength(3)
  })

  test('list all board IDs', async () => {
    const board1 = createBoard('Board 1', 'user-123')
    const board2 = createBoard('Board 2', 'user-123')
    const boardKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )

    await repository.saveBoard('board-1', board1, boardKey)
    await repository.saveBoard('board-2', board2, boardKey)

    const boardIds = await repository.listBoardIds()

    expect(boardIds).toContain('board-1')
    expect(boardIds).toContain('board-2')
    expect(boardIds).toHaveLength(2)
  })
})
