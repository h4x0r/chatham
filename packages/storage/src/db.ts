/**
 * IndexedDB Database Schema
 * @packageDocumentation
 */

import { openDB, deleteDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'chatham'
const DB_VERSION = 1

/**
 * Chatham IndexedDB schema
 */
export interface ChathamDB {
  identity: {
    key: string
    value: {
      id: string
      phrase?: string // Only stored if user opts in
      privateKey: Uint8Array
      publicKey: Uint8Array
      semaphoreSecret: Uint8Array
      commitment: string
    }
  }
  boards: {
    key: string
    value: {
      id: string
      encryptedContent: Uint8Array
      iv: Uint8Array
      wrappedKey: {
        ephemeralPublicKey: Uint8Array
        ciphertext: Uint8Array
        iv: Uint8Array
      }
      merkleRoot: string
      lastSynced: number
      pendingChanges: Uint8Array[]
    }
  }
  attachmentCache: {
    key: string
    value: {
      id: string
      boardId: string
      data: Uint8Array
      size: number
      lastAccessed: number
    }
  }
}

let dbInstance: IDBPDatabase<ChathamDB> | null = null

/**
 * Open the Chatham IndexedDB database
 */
export async function openDatabase(): Promise<IDBPDatabase<ChathamDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<ChathamDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('identity')) {
        db.createObjectStore('identity', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('boards')) {
        db.createObjectStore('boards', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('attachmentCache')) {
        const store = db.createObjectStore('attachmentCache', { keyPath: 'id' })
        store.createIndex('byLastAccessed', 'lastAccessed')
        store.createIndex('byBoardId', 'boardId')
      }
    },
  })

  return dbInstance
}

/**
 * Clear and delete the entire database
 */
export async function clearDatabase(): Promise<void> {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
  await deleteDB(DB_NAME)
}
