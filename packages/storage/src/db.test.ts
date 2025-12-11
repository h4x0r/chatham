import { describe, it, expect, beforeEach } from 'vitest'
import { openDatabase, clearDatabase } from './db'

describe('database', () => {
  beforeEach(async () => {
    await clearDatabase()
  })

  it('opens database', async () => {
    const db = await openDatabase()
    expect(db.name).toBe('zkkb')
  })

  it('has required object stores', async () => {
    const db = await openDatabase()
    expect(db.objectStoreNames.contains('identity')).toBe(true)
    expect(db.objectStoreNames.contains('boards')).toBe(true)
    expect(db.objectStoreNames.contains('attachmentCache')).toBe(true)
  })

  it('returns same instance on multiple opens', async () => {
    const db1 = await openDatabase()
    const db2 = await openDatabase()
    expect(db1).toBe(db2)
  })

  it('clears database and allows reopening', async () => {
    const db1 = await openDatabase()
    expect(db1.name).toBe('zkkb')

    await clearDatabase()

    const db2 = await openDatabase()
    expect(db2.name).toBe('zkkb')
    expect(db2).not.toBe(db1)
  })
})
