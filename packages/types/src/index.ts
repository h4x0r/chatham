/**
 * @zkkb/types - TypeScript type definitions for ZKKB
 * @packageDocumentation
 */

/**
 * A board member with their public key and wrapped board key
 */
export interface BoardMember {
  displayName: string
  publicKey: string // base64
  wrappedBoardKey: string // base64
  color: string
  joinedAt: number
}

/**
 * A kanban column
 */
export interface Column {
  id: string
  title: string
  position: string // Fractional indexing
}

/**
 * A label on a card
 */
export interface Label {
  text: string
  color: string
}

/**
 * A checklist item within a card
 */
export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

/**
 * An attachment stored in R2
 */
export interface Attachment {
  id: string
  name: string
  r2Key: string
  size: number
  encryptionKey: string // base64
}

/**
 * A comment on a card
 */
export interface Comment {
  id: string
  author: string // commitment
  text: string
  createdAt: number
}

/**
 * A kanban card
 */
export interface Card {
  id: string
  columnId: string
  position: string // Fractional indexing
  title: string
  description: string
  labels: Label[]
  dueDate: number | null
  assignee: string | null // commitment
  checklist: ChecklistItem[]
  attachments: Attachment[]
  comments: Comment[]
  createdAt: number
  updatedAt: number
}

/**
 * The complete content of a board (encrypted client-side)
 */
export interface BoardContent {
  name: string
  members: Record<string, BoardMember>
  columns: Column[]
  cards: Record<string, Card>
  [key: string]: unknown // Index signature for Automerge compatibility
}

/**
 * Board metadata stored server-side (D1)
 */
export interface BoardMetadata {
  id: string
  merkleRoot: string
  createdAt: number
  archivedAt: number | null
}

/**
 * User record stored server-side (D1)
 */
export interface User {
  id: string
  email: string
  createdAt: number
}

/**
 * Session record stored server-side (D1)
 */
export interface Session {
  id: string
  userId: string
  expiresAt: number
}
