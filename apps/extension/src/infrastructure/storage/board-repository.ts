import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { Automerge } from '@chatham/automerge'
import type { BoardContent } from '@chatham/types'

interface ChathamDB extends DBSchema {
  boards: {
    key: string
    value: {
      id: string
      encryptedContent: Uint8Array
      nonce: Uint8Array
      name: string
      cardCount: number
      createdAt: number
      updatedAt: number
    }
  }
}

export class BoardRepository {
  private db: IDBPDatabase<ChathamDB> | null = null

  async initialize(): Promise<void> {
    this.db = await openDB<ChathamDB>('chatham', 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1 && !db.objectStoreNames.contains('boards')) {
          db.createObjectStore('boards', { keyPath: 'id' })
        }
        // Version 2 adds name and cardCount fields - no migration needed
      }
    })
  }

  async saveBoard(
    boardId: string,
    board: Automerge.Doc<BoardContent>,
    boardKey: CryptoKey
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    // Serialize Automerge doc
    const bytes = Automerge.save(board)

    // Encrypt
    const nonce = crypto.getRandomValues(new Uint8Array(12))
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce },
      boardKey,
      bytes
    )

    // Extract metadata for unencrypted storage
    const cardCount = Object.keys(board.cards || {}).length

    await this.db.put('boards', {
      id: boardId,
      encryptedContent: new Uint8Array(encrypted),
      nonce,
      name: board.name,
      cardCount,
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
  }

  async getBoard(
    boardId: string,
    boardKey: CryptoKey
  ): Promise<Automerge.Doc<BoardContent>> {
    if (!this.db) throw new Error('Database not initialized')

    const record = await this.db.get('boards', boardId)
    if (!record) throw new Error(`Board ${boardId} not found`)

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: record.nonce },
      boardKey,
      record.encryptedContent
    )

    // Deserialize Automerge doc
    return Automerge.load(new Uint8Array(decrypted))
  }

  async listBoardIds(): Promise<string[]> {
    if (!this.db) throw new Error('Database not initialized')

    const boards = await this.db.getAll('boards')
    return boards.map(b => b.id)
  }

  async listBoards(): Promise<Array<{ id: string; name: string; cardCount: number; updatedAt: number }>> {
    if (!this.db) throw new Error('Database not initialized')

    const boards = await this.db.getAll('boards')
    return boards.map(b => ({
      id: b.id,
      name: b.name,
      cardCount: b.cardCount,
      updatedAt: b.updatedAt
    }))
  }
}
