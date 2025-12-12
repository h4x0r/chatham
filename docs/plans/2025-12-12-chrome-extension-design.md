# Chrome Extension Design - Local-Only MVP

**Date:** 2025-12-12
**Status:** Design Complete
**Scope:** Local-only Chrome extension (MIT-licensed) with foundation for future cloud sync

## Context

Build a production-ready Chrome extension for the public `chatham` repo that:
- Showcases the MIT-licensed packages (@chatham/crypto, @chatham/automerge, etc.)
- Provides full local kanban functionality
- Prepares architecture for future cloud sync (chatham-pro)
- Implements with TDD following React and shadcn best practices

**Target Users:** Security teams tracking vulnerabilities, risk registers, incident response

## Tech Stack

**Framework & Build:**
- React 18 + TypeScript
- Vite + @crxjs/vite-plugin
- Chrome Extension Manifest V3

**State Management:**
- TanStack Query (async/sync state, data fetching)
- Zustand (UI state)

**UI Libraries:**
- shadcn/ui components (Button, Input, Dialog, Form, Badge, etc.)
- dnd-kit (drag-and-drop)
- Wouter (routing)
- Tailwind CSS

**Testing:**
- Vitest + React Testing Library
- Integration tests with mocked Chrome APIs
- E2E with Playwright (validation phase)

**Packages:**
- @chatham/crypto (encryption, key derivation)
- @chatham/automerge (CRDT operations)
- @chatham/storage (IndexedDB persistence)
- @chatham/types (TypeScript definitions)
- @chatham/semaphore (zero-knowledge proofs - future use)

## Architecture

### Project Structure

```
apps/extension/
  src/
    domain/              # Pure business logic
      board.ts           # Board operations (use @chatham/automerge)
      card.ts            # Card operations
      column.ts          # Column operations
      attachment.ts      # Attachment handling
      member.ts          # Member operations

    infrastructure/      # External integrations
      crypto/
        recovery-phrase.ts    # Generate/import/derive keys
        encryption.ts         # Board/attachment encryption
      storage/
        board-repository.ts   # IndexedDB board CRUD
        attachment-repository.ts
        identity-repository.ts
      sync/
        sync-hooks.ts         # No-op hooks for future cloud sync

    ui/
      sidepanel/
        main.tsx             # Entry point
        SidepanelApp.tsx     # Root component
        components/          # Sidepanel-specific
      fullpage/
        main.tsx             # Entry point
        FullpageApp.tsx      # Root component
        components/          # Fullpage-specific
      shared/
        components/          # Shared UI components
          Board/
          Card/
          Column/
          RecoveryPhraseSetup/
          EvaluationBanner/
        hooks/               # React hooks
          useBoards.ts
          useCards.ts
          useAuth.ts
        stores/              # Zustand stores
          ui-store.ts
          auth-store.ts

    background/
      service-worker.ts      # Chrome service worker (if needed)

  public/
    manifest.json            # Chrome Extension Manifest V3
    sidepanel.html
    fullpage.html

  tests/
    unit/                    # Domain logic tests
    component/               # React component tests
    integration/             # Full flow tests
    e2e/                     # Playwright tests
    setup.ts                 # Test utilities
    mocks/                   # Chrome API mocks
```

### Clean Architecture Layers

**Domain Layer (Pure Business Logic):**
- No dependencies on React, Chrome APIs, or UI
- Pure functions operating on Automerge docs
- 100% testable without mocks
- Examples: `createBoard()`, `addCard()`, `moveCard()`

**Infrastructure Layer (External Integrations):**
- Integrates @chatham/crypto, @chatham/storage
- Chrome APIs (storage, tabs)
- IndexedDB operations
- Sync hooks (no-op for local-only, ready for cloud)

**UI Layer (React Components):**
- Consumes domain + infrastructure via TanStack Query
- Pure presentation (no business logic)
- Uses Zustand for local UI state
- shadcn/ui components

## State Management

### Zustand Stores (UI State)

```typescript
// src/ui/shared/stores/ui-store.ts
interface UIStore {
  currentView: 'sidepanel' | 'fullpage'
  selectedBoardId: string | null
  isDragging: boolean
  theme: 'light' | 'dark'
  sidebarOpen: boolean
}

// src/ui/shared/stores/auth-store.ts
interface AuthStore {
  hasRecoveryPhrase: boolean
  isEvaluationMode: boolean
  evaluationStartedAt: number | null
  evaluationCardCount: number
  checkEvaluationLimit: () => boolean
  incrementCardCount: () => void
}
```

### TanStack Query (Board/Card Data)

```typescript
// Queries
useQuery(['boards'], () => boardRepository.listBoards())
useQuery(['board', boardId], () => boardRepository.getBoard(boardId))

// Mutations
useMutation(createBoard, {
  onSuccess: () => queryClient.invalidateQueries(['boards'])
})

useMutation(createCard, {
  onSuccess: () => queryClient.invalidateQueries(['board', boardId])
})

useMutation(moveCard, {
  // Optimistic update for immediate UI response
  onMutate: async (variables) => {
    await queryClient.cancelQueries(['board', boardId])
    const previous = queryClient.getQueryData(['board', boardId])
    queryClient.setQueryData(['board', boardId], (old) =>
      applyCardMove(old, variables)
    )
    return { previous }
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['board', boardId], context.previous)
  }
})
```

### Data Flow

**Local-Only:**
```
User Action (UI)
  ↓
TanStack Mutation
  ↓
Domain Layer (Automerge operations)
  ↓
Infrastructure Layer
  ├─ Encrypt with @chatham/crypto
  └─ Save to IndexedDB via @chatham/storage
  ↓
TanStack Query invalidation
  ↓
UI re-renders with fresh data
```

**Future Cloud Sync (Prepared):**
```
Infrastructure Layer gains:
  ├─ Local: IndexedDB (immediate, optimistic)
  └─ Remote: WebSocket → Cloudflare DO (background sync)

Extension code unchanged - just infrastructure swap
```

## Component Hierarchy

### Sidepanel View (Compact - Quick Access)

```
SidepanelApp
├─ RecoveryPhraseSetup (if !hasRecoveryPhrase)
│  ├─ CreateNewPhrase
│  │  └─ PhraseDisplay (24 words, copy button)
│  │  └─ VerifyPhrase (3 random words)
│  ├─ ImportPhrase
│  │  └─ PhraseInput (textarea, BIP-39 validation)
│  └─ SkipForNow (evaluation mode)
│     └─ EvaluationWarningDialog
│
├─ EvaluationBanner (if isEvaluationMode)
│  └─ "⚠️ Evaluation Mode - [Create Phrase] [7/10 cards]"
│
├─ BoardList
│  ├─ BoardCard (name, card count, last updated)
│  └─ CreateBoardButton
│
└─ QuickBoardView (if board selected)
   ├─ BoardHeader
   │  ├─ Board name
   │  └─ "Open in fullpage" button
   ├─ ColumnList (compact, scrollable)
   │  └─ Column
   │     ├─ ColumnHeader (title, count)
   │     └─ CardList (simplified)
   │        └─ MiniCard (title, labels only)
   └─ QuickAddCard
```

### Fullpage View (Full Featured - Deep Work)

```
FullpageApp
├─ Sidebar (collapsible)
│  ├─ Logo
│  ├─ BoardList
│  │  ├─ BoardItem (with context menu)
│  │  └─ CreateBoardButton
│  ├─ Settings
│  │  ├─ Theme toggle
│  │  ├─ Export data
│  │  └─ RecoveryPhraseBackup
│  └─ EvaluationBanner (if applicable)
│
└─ Main Content
   ├─ BoardView (if board selected)
   │  ├─ BoardHeader
   │  │  ├─ Board name (editable)
   │  │  ├─ Member avatars
   │  │  ├─ Board menu (settings, archive, delete)
   │  │  └─ Search/filter
   │  │
   │  ├─ KanbanBoard (dnd-kit context)
   │  │  ├─ Column (draggable)
   │  │  │  ├─ ColumnHeader
   │  │  │  │  ├─ Title (editable)
   │  │  │  │  ├─ Card count
   │  │  │  │  └─ Column menu (rename, delete)
   │  │  │  │
   │  │  │  └─ CardList (dnd-kit droppable)
   │  │  │     └─ Card (draggable)
   │  │  │        ├─ Title
   │  │  │        ├─ Description (preview)
   │  │  │        ├─ Labels (badges)
   │  │  │        ├─ DueDate (if set)
   │  │  │        ├─ Assignee avatar
   │  │  │        ├─ Attachment count
   │  │  │        ├─ Comment count
   │  │  │        └─ Card menu (edit, delete)
   │  │  │
   │  │  └─ AddColumnButton
   │  │
   │  └─ CardDetailModal (Dialog)
   │     ├─ Title (editable)
   │     ├─ Description (markdown textarea)
   │     ├─ Labels (add/remove)
   │     ├─ DueDate picker
   │     ├─ Assignee select
   │     ├─ Checklist
   │     │  └─ ChecklistItem (checkbox, text, delete)
   │     ├─ Attachments
   │     │  ├─ FileUpload (drag-drop zone)
   │     │  └─ AttachmentList (download, delete)
   │     └─ Comments
   │        ├─ CommentList
   │        └─ AddComment
   │
   └─ EmptyState (if no board selected)
      └─ "Create your first board" prompt
```

### shadcn/ui Components Used

**Set C: Essential + Rich + Forms**
- Button, Input, Textarea
- Dialog, DropdownMenu
- Badge, Separator, Tabs
- Form (with react-hook-form)
- Select, Checkbox
- DatePicker (for due dates)
- Card (shadcn Card primitive)
- Avatar (for members)

## Recovery Phrase & Evaluation Mode

### Initial Launch Flow

**First Time User (No Recovery Phrase):**
```
Extension opens
  ↓
Check: chrome.storage.local.get('hasRecoveryPhrase')
  ↓
If false → Show RecoveryPhraseSetup component
```

### RecoveryPhraseSetup Options

**1. Create New Recovery Phrase:**
```
→ Generate 24 words using @chatham/crypto (BIP-39)
→ Display phrase with:
  - Large, readable text
  - Copy to clipboard button
  - "I've written this down" checkbox (required)
→ Verify: Ask user to enter 3 random words
→ On success:
  - Derive identity keys from phrase
  - Store encrypted phrase in chrome.storage.local
  - Set hasRecoveryPhrase = true
```

**2. Import Existing Phrase:**
```
→ Textarea for 24-word input
→ Real-time BIP-39 validation
→ On submit:
  - Validate phrase
  - Derive identity keys
  - Store encrypted phrase
  - Set hasRecoveryPhrase = true
```

**3. Skip for Now (Evaluation Mode):**
```
→ Show warning dialog:
  "⚠️ Evaluation Mode

   Your data will be lost when you close the browser.

   Evaluation period expires after:
   • 24 hours, OR
   • 10 cards created
   (whichever comes first)

   [Cancel] [Start Evaluation]"

→ On confirm:
  - Set isEvaluationMode = true
  - Set evaluationStartedAt = Date.now()
  - Set evaluationCardCount = 0
  - Generate temporary session keys (not persisted)
```

### Evaluation Mode Enforcement

**Before Creating Card:**
```typescript
if (authStore.isEvaluationMode) {
  const elapsed = Date.now() - authStore.evaluationStartedAt
  const cardCount = authStore.evaluationCardCount

  // Check 24-hour limit
  if (elapsed > 24 * 60 * 60 * 1000) {
    showForceRecoveryPhraseDialog("24-hour evaluation period ended")
    return
  }

  // Check 10-card limit
  if (cardCount >= 10) {
    showForceRecoveryPhraseDialog("10-card evaluation limit reached")
    return
  }

  // Increment counter
  authStore.incrementCardCount()
}
```

**Persistent Banner (All Views):**
```
When isEvaluationMode = true:

┌────────────────────────────────────────────────────────┐
│ ⚠️ Evaluation Mode - Data will be lost on close        │
│ [Create Recovery Phrase] [7/10 cards remaining]        │
└────────────────────────────────────────────────────────┘
```

## Encryption & Storage

### Recovery Phrase Storage

**Security Model:**
```typescript
// chrome.storage.local stores encrypted phrase
// User must enter password to decrypt on each session
// Prevents phrase theft if extension storage is compromised

await chrome.storage.local.set({
  encryptedPhrase: await encryptWithPassword(phrase, userPassword),
  hasRecoveryPhrase: true,
  // Never store: seed, keys, passwords
})
```

**Alternative (if no password):**
```typescript
// For evaluation or if we decide not to require password:
// Store phrase directly in chrome.storage.local
// Rely on OS-level encryption (Chrome profile encryption)
await chrome.storage.local.set({
  recoveryPhrase: phrase, // Chrome encrypts with OS keychain
  hasRecoveryPhrase: true
})
```

### Board Encryption

**Creating a Board:**
```
1. User creates board with name
2. Generate board key: crypto.subtle.generateKey('AES-GCM', ...)
3. Create Automerge doc with board content
4. Encrypt entire doc with board key
5. Store in IndexedDB:
   {
     id: boardId,
     encryptedContent: blob,
     nonce: Uint8Array,
     createdAt: timestamp
   }
```

**Loading a Board:**
```
1. Fetch encrypted blob from IndexedDB
2. Decrypt with board key
3. Parse as Automerge.Doc<BoardContent>
4. Render in UI
```

### Attachment Encryption

**Uploading File:**
```
1. User selects file
2. Generate file-specific key
3. Read file as ArrayBuffer
4. Encrypt with AES-256-GCM
5. Store in IndexedDB 'attachments' table:
   {
     id: attachmentId,
     name: fileName,
     size: fileSize,
     encryptedData: blob,
     nonce: Uint8Array,
     encryptionKey: string (base64)
   }
6. Add attachment metadata to card
```

**Downloading File:**
```
1. Get attachment record from IndexedDB
2. Decrypt blob with stored encryptionKey
3. Create blob URL
4. Trigger browser download
```

## TDD Testing Strategy

### Test Pyramid

```
         E2E (5-10)
        /         \
    Integration (10-15)
   /                  \
  Component (30-40)
 /                    \
Unit (50-60 tests)
```

### Unit Tests (Domain Layer)

**Fast, pure, no mocks:**
```typescript
// tests/unit/domain/board.test.ts
describe('createBoard', () => {
  test('creates board with default columns', () => {
    const board = createBoard('Security Review', identity)

    expect(board.name).toBe('Security Review')
    expect(board.columns).toHaveLength(3)
    expect(board.columns.map(c => c.title)).toEqual([
      'To Do', 'In Progress', 'Done'
    ])
  })
})

// tests/unit/domain/card.test.ts
describe('addCard', () => {
  test('adds card to specified column', () => {
    const board = createBoard('Test')
    const columnId = board.columns[0].id

    const updated = addCard(board, columnId, {
      title: 'Fix CVE-2024-1234',
      description: 'Critical RCE vulnerability'
    })

    const cards = Object.values(updated.cards)
    expect(cards).toHaveLength(1)
    expect(cards[0].title).toBe('Fix CVE-2024-1234')
    expect(cards[0].columnId).toBe(columnId)
  })
})

describe('moveCard', () => {
  test('updates card position using fractional indexing', () => {
    const board = createBoard('Test')
    const card = addCard(board, 'col-1', { title: 'Card 1' })

    const updated = moveCard(board, card.id, 'col-2', 'a')

    expect(updated.cards[card.id].columnId).toBe('col-2')
    expect(updated.cards[card.id].position).toBe('a')
  })
})
```

### Component Tests (React Testing Library)

**Test user interactions:**
```typescript
// tests/component/Card.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

test('clicking card opens detail modal', async () => {
  const mockCard = createMockCard({ title: 'Test Card' })
  render(<Card card={mockCard} onEdit={vi.fn()} />)

  await userEvent.click(screen.getByText('Test Card'))

  expect(screen.getByRole('dialog')).toBeInTheDocument()
  expect(screen.getByText('Test Card')).toBeInTheDocument()
})

test('editing card title updates immediately', async () => {
  const mockOnEdit = vi.fn()
  render(<Card card={mockCard} onEdit={mockOnEdit} />)

  await userEvent.click(screen.getByRole('button', { name: /edit/i }))
  const titleInput = screen.getByLabelText(/title/i)

  await userEvent.clear(titleInput)
  await userEvent.type(titleInput, 'Updated Title')
  await userEvent.click(screen.getByRole('button', { name: /save/i }))

  expect(mockOnEdit).toHaveBeenCalledWith(
    expect.objectContaining({ title: 'Updated Title' })
  )
})

// tests/component/RecoveryPhraseSetup.test.tsx
test('create new phrase flow', async () => {
  const mockOnComplete = vi.fn()
  render(<RecoveryPhraseSetup onComplete={mockOnComplete} />)

  await userEvent.click(screen.getByText(/create new/i))

  // See 24 words displayed
  expect(screen.getByText(/abandon/i)).toBeInTheDocument()

  // Checkbox required
  const checkbox = screen.getByLabelText(/written this down/i)
  const continueBtn = screen.getByText(/continue/i)
  expect(continueBtn).toBeDisabled()

  await userEvent.click(checkbox)
  expect(continueBtn).toBeEnabled()

  // Verification step
  await userEvent.click(continueBtn)
  // Enter 3 random words...
})
```

### Integration Tests (Full Flows)

**Test with mocked Chrome APIs:**
```typescript
// tests/integration/board-creation-flow.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { mockChromeStorage, mockIndexedDB } from '../mocks'

beforeEach(() => {
  mockChromeStorage()
  mockIndexedDB()
})

test('create board → add card → encrypt → store → retrieve', async () => {
  // Create board
  const { result: createResult } = renderHook(
    () => useCreateBoard(),
    { wrapper: QueryClientProvider }
  )

  await act(() =>
    createResult.current.mutate({ name: 'Security Review' })
  )

  await waitFor(() => expect(createResult.current.isSuccess).toBe(true))
  const boardId = createResult.current.data.id

  // Add card
  const { result: cardResult } = renderHook(
    () => useCreateCard(boardId)
  )

  await act(() =>
    cardResult.current.mutate({
      title: 'CVE-2024-1234',
      description: 'Critical RCE in auth module'
    })
  )

  await waitFor(() => expect(cardResult.current.isSuccess).toBe(true))

  // Verify encryption
  const db = await openDB('chatham')
  const storedBoard = await db.get('boards', boardId)

  // Should be encrypted blob, not readable JSON
  expect(storedBoard.encryptedContent).toBeInstanceOf(Uint8Array)
  expect(() => JSON.parse(storedBoard.encryptedContent)).toThrow()

  // Verify retrieval works
  const { result: queryResult } = renderHook(
    () => useBoard(boardId)
  )

  await waitFor(() => expect(queryResult.current.isSuccess).toBe(true))
  const board = queryResult.current.data

  expect(board.name).toBe('Security Review')
  expect(Object.values(board.cards)).toHaveLength(1)
  expect(Object.values(board.cards)[0].title).toBe('CVE-2024-1234')
})

test('evaluation mode enforces 10-card limit', async () => {
  // Set evaluation mode
  authStore.setState({
    isEvaluationMode: true,
    evaluationStartedAt: Date.now(),
    evaluationCardCount: 9
  })

  const { result } = renderHook(() => useCreateCard(boardId))

  // Create 10th card - should succeed
  await act(() => result.current.mutate({ title: 'Card 10' }))
  expect(result.current.isSuccess).toBe(true)
  expect(authStore.getState().evaluationCardCount).toBe(10)

  // Try 11th card - should fail with dialog
  await act(() => result.current.mutate({ title: 'Card 11' }))
  expect(result.current.isError).toBe(true)
  expect(screen.getByText(/evaluation limit reached/i)).toBeInTheDocument()
})
```

### E2E Tests (Playwright - Validation Phase)

**Run against actual Chrome extension:**
```typescript
// tests/e2e/board-workflow.spec.ts
test('complete board workflow', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/fullpage.html`)

  // Create recovery phrase
  await page.click('text=Create New Recovery Phrase')
  await page.click('input[type="checkbox"]') // Written down
  await page.click('text=Continue')

  // Verify 3 words (enter correct words)
  // ...

  // Create board
  await page.click('text=Create Board')
  await page.fill('input[name="boardName"]', 'Security Audit')
  await page.click('text=Create')

  // Add card
  await page.click('text=Add Card')
  await page.fill('input[name="title"]', 'CVE-2024-5678')
  await page.click('text=Save')

  // Drag to "Done"
  await page.dragAndDrop('.card', '.column-done')

  // Verify persisted
  await page.reload()
  expect(await page.textContent('.column-done')).toContain('CVE-2024-5678')
})
```

## Build Configuration

### Vite Config

```typescript
// apps/extension/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './public/manifest.json'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@chatham/crypto': path.resolve(__dirname, '../../packages/crypto/src'),
      '@chatham/automerge': path.resolve(__dirname, '../../packages/automerge/src'),
      '@chatham/storage': path.resolve(__dirname, '../../packages/storage/src'),
      '@chatham/types': path.resolve(__dirname, '../../packages/types/src')
    }
  },
  build: {
    rollupOptions: {
      input: {
        sidepanel: 'public/sidepanel.html',
        fullpage: 'public/fullpage.html'
      }
    }
  }
})
```

### Chrome Manifest V3

```json
{
  "manifest_version": 3,
  "name": "Chatham",
  "version": "1.0.0",
  "description": "Privacy-first project management with E2E encryption",

  "side_panel": {
    "default_path": "sidepanel.html"
  },

  "action": {
    "default_title": "Open Chatham",
    "default_icon": {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  },

  "permissions": [
    "storage",
    "sidePanel"
  ],

  "background": {
    "service_worker": "src/background/service-worker.ts",
    "type": "module"
  },

  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"
  }
}
```

### Package.json

```json
{
  "name": "@chatham/extension",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.5.0",
    "wouter": "^3.3.0",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "react-hook-form": "^7.53.0",
    "idb": "^8.0.0",
    "@chatham/crypto": "workspace:*",
    "@chatham/automerge": "workspace:*",
    "@chatham/storage": "workspace:*",
    "@chatham/types": "workspace:*"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "@crxjs/vite-plugin": "^2.0.0",
    "vite": "^5.4.0",
    "typescript": "^5.9.3",
    "vitest": "^2.1.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@playwright/test": "^1.48.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

## TDD Implementation Order

### Phase 1: Foundation (Domain Layer)
1. Board creation (Automerge integration)
2. Card CRUD operations
3. Column management
4. Fractional indexing for positions

### Phase 2: Infrastructure (Crypto & Storage)
1. Recovery phrase generation/import
2. Identity key derivation
3. Board encryption/decryption
4. IndexedDB repositories

### Phase 3: UI Core (Sidepanel)
1. RecoveryPhraseSetup component
2. BoardList component
3. Basic Board view (read-only)
4. Evaluation mode logic

### Phase 4: UI Full (Fullpage)
1. Full Board view with dnd-kit
2. Card detail modal
3. Attachments
4. Comments

### Phase 5: Polish
1. Theme support
2. Search/filter
3. Export functionality
4. E2E tests

## Sync Hooks (Future-Ready)

**Infrastructure Layer Placeholder:**
```typescript
// src/infrastructure/sync/sync-hooks.ts

export interface SyncHooks {
  onBoardChange: (boardId: string, changes: Automerge.Change[]) => Promise<void>
  onCardChange: (boardId: string, cardId: string) => Promise<void>
}

// Local-only implementation (no-op)
export const localSyncHooks: SyncHooks = {
  onBoardChange: async () => {
    // No-op for local-only
    // Cloud version: Send changes to WebSocket
  },
  onCardChange: async () => {
    // No-op for local-only
    // Cloud version: Broadcast to Durable Object
  }
}

// Future cloud implementation (chatham-pro):
export const cloudSyncHooks: SyncHooks = {
  onBoardChange: async (boardId, changes) => {
    await websocket.send({ type: 'sync', boardId, changes })
  },
  onCardChange: async (boardId, cardId) => {
    await websocket.send({ type: 'edit', boardId, cardId })
  }
}
```

**Swapping implementations is one line:**
```typescript
// Local version
const syncHooks = localSyncHooks

// Cloud version (chatham-pro)
const syncHooks = cloudSyncHooks
```

## Success Criteria

**MVP Complete When:**
- ✅ All unit tests passing (50-60 tests)
- ✅ All component tests passing (30-40 tests)
- ✅ All integration tests passing (10-15 tests)
- ✅ Can create board locally
- ✅ Can add/edit/delete cards
- ✅ Can drag-drop between columns
- ✅ Can attach files (encrypted in IndexedDB)
- ✅ Recovery phrase works (create/import/verify)
- ✅ Evaluation mode enforces limits (24h / 10 cards)
- ✅ Side panel + fullpage both work
- ✅ Data persists across browser restarts
- ✅ All data encrypted in storage

**Future Cloud Transition:**
- Swap sync hooks from local to cloud
- Extension code unchanged
- Smooth migration path