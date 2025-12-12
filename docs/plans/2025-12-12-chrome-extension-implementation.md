# Chrome Extension Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build local-only Chrome extension with full kanban functionality using TDD

**Architecture:** Clean architecture (domain/infrastructure/ui layers) with React 18, TanStack Query + Zustand, dnd-kit for drag-drop, shadcn/ui components

**Tech Stack:** React 18, TypeScript, Vite, @crxjs/vite-plugin, TanStack Query, Zustand, Wouter, dnd-kit, shadcn/ui, Vitest, Playwright

---

## Phase 1: Project Setup

### Task 1: Initialize Extension Project

**Files:**
- Create: `apps/extension/package.json`
- Create: `apps/extension/tsconfig.json`
- Create: `apps/extension/vite.config.ts`
- Create: `apps/extension/vitest.config.ts`
- Create: `apps/extension/tailwind.config.ts`
- Create: `apps/extension/postcss.config.js`
- Modify: `pnpm-workspace.yaml`

**Step 1: Create apps/extension directory**

```bash
mkdir -p apps/extension
cd apps/extension
```

**Step 2: Create package.json**

```json
{
  "name": "@chatham/extension",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint src --ext ts,tsx"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@tanstack/react-query": "^5.59.0",
    "zustand": "^4.5.5",
    "wouter": "^3.3.5",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0",
    "zod": "^3.23.8",
    "idb": "^8.0.0",
    "date-fns": "^4.1.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.4",
    "@chatham/crypto": "workspace:*",
    "@chatham/automerge": "workspace:*",
    "@chatham/storage": "workspace:*",
    "@chatham/types": "workspace:*"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@types/chrome": "^0.0.278",
    "@vitejs/plugin-react": "^4.3.3",
    "@crxjs/vite-plugin": "^2.0.0-beta.25",
    "vite": "^5.4.11",
    "typescript": "^5.9.3",
    "vitest": "^2.1.5",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "@testing-library/jest-dom": "^6.6.3",
    "@vitest/ui": "^2.1.5",
    "jsdom": "^25.0.1",
    "happy-dom": "^15.11.7",
    "@playwright/test": "^1.48.2",
    "tailwindcss": "^3.4.15",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "eslint": "^9.15.0",
    "@typescript-eslint/eslint-plugin": "^8.15.0",
    "@typescript-eslint/parser": "^8.15.0"
  }
}
```

**Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,

    "types": ["vite/client", "chrome", "@testing-library/jest-dom"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

**Step 4: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    crx({
      manifest: {
        manifest_version: 3,
        name: 'Chatham',
        version: '1.0.0',
        description: 'Privacy-first project management with E2E encryption',

        side_panel: {
          default_path: 'sidepanel.html'
        },

        action: {
          default_title: 'Open Chatham'
        },

        permissions: ['storage', 'sidePanel']
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    rollupOptions: {
      input: {
        sidepanel: path.resolve(__dirname, 'sidepanel.html'),
        fullpage: path.resolve(__dirname, 'fullpage.html')
      }
    }
  }
})
```

**Step 5: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

**Step 6: Create Tailwind config**

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx}',
    './sidepanel.html',
    './fullpage.html'
  ],
  theme: {
    extend: {}
  },
  plugins: [require('tailwindcss-animate')]
} satisfies Config
```

**Step 7: Create postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

**Step 8: Update pnpm-workspace.yaml**

```bash
cd ../..
```

Modify `pnpm-workspace.yaml`:
```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

**Step 9: Install dependencies**

```bash
cd apps/extension
pnpm install
```

Expected: Dependencies installed successfully

**Step 10: Create HTML entry points**

Create `apps/extension/sidepanel.html`:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Chatham</title>
  </head>
  <body>
    <div id="sidepanel-root"></div>
    <script type="module" src="/src/ui/sidepanel/main.tsx"></script>
  </body>
</html>
```

Create `apps/extension/fullpage.html`:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Chatham</title>
  </head>
  <body>
    <div id="fullpage-root"></div>
    <script type="module" src="/src/ui/fullpage/main.tsx"></script>
  </body>
</html>
```

**Step 11: Create test setup**

Create `apps/extension/tests/setup.ts`:
```typescript
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

afterEach(() => {
  cleanup()
})

// Mock Chrome APIs
global.chrome = {
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn()
    }
  },
  sidePanel: {
    open: vi.fn()
  }
} as any
```

**Step 12: Create directory structure**

```bash
mkdir -p src/domain
mkdir -p src/infrastructure/crypto
mkdir -p src/infrastructure/storage
mkdir -p src/infrastructure/sync
mkdir -p src/ui/sidepanel
mkdir -p src/ui/fullpage
mkdir -p src/ui/shared/components
mkdir -p src/ui/shared/hooks
mkdir -p src/ui/shared/stores
mkdir -p src/ui/shared/lib
mkdir -p tests/unit
mkdir -p tests/component
mkdir -p tests/integration
mkdir -p tests/e2e
mkdir -p tests/mocks
```

**Step 13: Create Tailwind CSS file**

Create `apps/extension/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

**Step 14: Create utils (cn helper)**

Create `apps/extension/src/ui/shared/lib/utils.ts`:
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Step 15: Commit project setup**

```bash
git add apps/extension
git commit -m "feat: initialize Chrome extension project with Vite + React + TanStack Query

- Add package.json with all dependencies
- Configure Vite with @crxjs plugin for Chrome extension
- Configure Vitest for testing
- Set up Tailwind CSS
- Create directory structure (domain/infrastructure/ui)
- Add test setup with Chrome API mocks"
```

---

## Phase 2: Domain Layer (TDD)

### Task 2: Board Creation Logic

**Files:**
- Create: `apps/extension/src/domain/board.ts`
- Create: `apps/extension/tests/unit/domain/board.test.ts`

**Step 1: Write failing test for board creation**

Create `apps/extension/tests/unit/domain/board.test.ts`:
```typescript
import { describe, test, expect } from 'vitest'
import { createBoard } from '@/domain/board'

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
```

**Step 2: Run test to verify it fails**

```bash
pnpm test tests/unit/domain/board.test.ts
```

Expected: FAIL - "Cannot find module '@/domain/board'"

**Step 3: Write minimal implementation**

Create `apps/extension/src/domain/board.ts`:
```typescript
import * as Automerge from '@automerge/automerge'
import type { BoardContent } from '@chatham/types'
import { createEmptyBoard, initializeBoard } from '@chatham/automerge'

export function createBoard(name: string, creatorCommitment: string): Automerge.Doc<BoardContent> {
  return initializeBoard(
    name,
    creatorCommitment,
    'Anonymous', // Default display name
    '', // publicKey placeholder
    '', // wrappedBoardKey placeholder
    '#3b82f6' // Default blue color
  )
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm test tests/unit/domain/board.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/domain/board.ts tests/unit/domain/board.test.ts
git commit -m "feat(domain): add board creation with default columns

Test: creates board with name and 3 default columns (To Do, In Progress, Done)
Implementation: uses @chatham/automerge initializeBoard function"
```

### Task 3: Add Card to Board

**Files:**
- Modify: `apps/extension/src/domain/board.ts`
- Create: `apps/extension/tests/unit/domain/board.test.ts` (add test)

**Step 1: Write failing test**

Add to `apps/extension/tests/unit/domain/board.test.ts`:
```typescript
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
```

**Step 2: Run test to verify it fails**

```bash
pnpm test tests/unit/domain/board.test.ts
```

Expected: FAIL - "addCard is not defined"

**Step 3: Write minimal implementation**

Add to `apps/extension/src/domain/board.ts`:
```typescript
export interface CardInput {
  title: string
  description: string
}

export function addCard(
  board: Automerge.Doc<BoardContent>,
  columnId: string,
  input: CardInput
): Automerge.Doc<BoardContent> {
  return Automerge.change(board, 'Add card', (doc) => {
    const cardId = crypto.randomUUID()
    const now = Date.now()

    doc.cards[cardId] = {
      id: cardId,
      columnId,
      position: generatePosition(), // Fractional indexing
      title: input.title,
      description: input.description,
      labels: [],
      dueDate: null,
      assignee: null,
      checklist: [],
      attachments: [],
      comments: [],
      createdAt: now,
      updatedAt: now
    }
  })
}

function generatePosition(): string {
  // Simple fractional indexing - use 'a' + random for now
  return 'a' + Math.random().toString(36).substring(2, 9)
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm test tests/unit/domain/board.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/domain/board.ts tests/unit/domain/board.test.ts
git commit -m "feat(domain): add card creation to board

Test: adds card with title and description to specified column
Implementation: uses Automerge.change with fractional indexing for position"
```

### Task 4: Move Card Between Columns

**Step 1: Write failing test**

Add to `apps/extension/tests/unit/domain/board.test.ts`:
```typescript
describe('moveCard', () => {
  test('moves card to different column with new position', () => {
    const board = createBoard('Test', 'user-123')
    const todoCol = board.columns[0].id
    const doneCol = board.columns[2].id

    let updated = addCard(board, todoCol, { title: 'Task', description: '' })
    const cardId = Object.keys(updated.cards)[0]

    updated = moveCard(updated, cardId, doneCol, 'z')

    expect(updated.cards[cardId].columnId).toBe(doneCol)
    expect(updated.cards[cardId].position).toBe('z')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
pnpm test tests/unit/domain/board.test.ts
```

Expected: FAIL - "moveCard is not defined"

**Step 3: Write minimal implementation**

Add to `apps/extension/src/domain/board.ts`:
```typescript
export function moveCard(
  board: Automerge.Doc<BoardContent>,
  cardId: string,
  targetColumnId: string,
  position: string
): Automerge.Doc<BoardContent> {
  return Automerge.change(board, 'Move card', (doc) => {
    if (!doc.cards[cardId]) {
      throw new Error(`Card ${cardId} not found`)
    }

    doc.cards[cardId].columnId = targetColumnId
    doc.cards[cardId].position = position
    doc.cards[cardId].updatedAt = Date.now()
  })
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm test tests/unit/domain/board.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/domain/board.ts tests/unit/domain/board.test.ts
git commit -m "feat(domain): add card movement between columns

Test: moves card to different column with new position
Implementation: updates columnId and position using Automerge.change"
```

### Task 5: Update Card Content

**Step 1: Write failing test**

Add to `apps/extension/tests/unit/domain/board.test.ts`:
```typescript
describe('updateCard', () => {
  test('updates card title and description', () => {
    let board = createBoard('Test', 'user-123')
    board = addCard(board, board.columns[0].id, { title: 'Old', description: 'Old desc' })
    const cardId = Object.keys(board.cards)[0]

    const updated = updateCard(board, cardId, {
      title: 'Updated CVE',
      description: 'New details'
    })

    expect(updated.cards[cardId].title).toBe('Updated CVE')
    expect(updated.cards[cardId].description).toBe('New details')
    expect(updated.cards[cardId].updatedAt).toBeGreaterThan(board.cards[cardId].createdAt)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
pnpm test tests/unit/domain/board.test.ts
```

Expected: FAIL - "updateCard is not defined"

**Step 3: Write minimal implementation**

Add to `apps/extension/src/domain/board.ts`:
```typescript
export interface CardUpdate {
  title?: string
  description?: string
  labels?: Label[]
  dueDate?: number | null
  assignee?: string | null
}

export function updateCard(
  board: Automerge.Doc<BoardContent>,
  cardId: string,
  updates: CardUpdate
): Automerge.Doc<BoardContent> {
  return Automerge.change(board, 'Update card', (doc) => {
    if (!doc.cards[cardId]) {
      throw new Error(`Card ${cardId} not found`)
    }

    const card = doc.cards[cardId]
    if (updates.title !== undefined) card.title = updates.title
    if (updates.description !== undefined) card.description = updates.description
    if (updates.labels !== undefined) card.labels = updates.labels
    if (updates.dueDate !== undefined) card.dueDate = updates.dueDate
    if (updates.assignee !== undefined) card.assignee = updates.assignee
    card.updatedAt = Date.now()
  })
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm test tests/unit/domain/board.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/domain/board.ts tests/unit/domain/board.test.ts
git commit -m "feat(domain): add card update functionality

Test: updates card title, description, and metadata
Implementation: partial updates with Automerge.change, preserves unchanged fields"
```

### Task 6: Delete Card

**Step 1: Write failing test**

Add to `apps/extension/tests/unit/domain/board.test.ts`:
```typescript
describe('deleteCard', () => {
  test('removes card from board', () => {
    let board = createBoard('Test', 'user-123')
    board = addCard(board, board.columns[0].id, { title: 'Delete me', description: '' })
    const cardId = Object.keys(board.cards)[0]

    const updated = deleteCard(board, cardId)

    expect(updated.cards[cardId]).toBeUndefined()
    expect(Object.keys(updated.cards)).toHaveLength(0)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
pnpm test tests/unit/domain/board.test.ts
```

Expected: FAIL - "deleteCard is not defined"

**Step 3: Write minimal implementation**

Add to `apps/extension/src/domain/board.ts`:
```typescript
export function deleteCard(
  board: Automerge.Doc<BoardContent>,
  cardId: string
): Automerge.Doc<BoardContent> {
  return Automerge.change(board, 'Delete card', (doc) => {
    if (!doc.cards[cardId]) {
      throw new Error(`Card ${cardId} not found`)
    }

    delete doc.cards[cardId]
  })
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm test tests/unit/domain/board.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/domain/board.ts tests/unit/domain/board.test.ts
git commit -m "feat(domain): add card deletion

Test: removes card from board.cards
Implementation: delete operation with Automerge.change"
```

---

## Phase 3: Infrastructure Layer - Crypto

### Task 7: Recovery Phrase Generation

**Files:**
- Create: `apps/extension/src/infrastructure/crypto/recovery-phrase.ts`
- Create: `apps/extension/tests/unit/infrastructure/recovery-phrase.test.ts`

**Step 1: Write failing test**

Create `apps/extension/tests/unit/infrastructure/recovery-phrase.test.ts`:
```typescript
import { describe, test, expect } from 'vitest'
import { generateRecoveryPhrase, validatePhrase } from '@/infrastructure/crypto/recovery-phrase'

describe('generateRecoveryPhrase', () => {
  test('generates 24-word BIP-39 phrase', () => {
    const phrase = generateRecoveryPhrase()

    const words = phrase.split(' ')
    expect(words).toHaveLength(24)
    expect(phrase).toMatch(/^[a-z]+(?: [a-z]+){23}$/)
  })

  test('generates different phrases each time', () => {
    const phrase1 = generateRecoveryPhrase()
    const phrase2 = generateRecoveryPhrase()

    expect(phrase1).not.toBe(phrase2)
  })
})

describe('validatePhrase', () => {
  test('accepts valid BIP-39 phrase', () => {
    const phrase = generateRecoveryPhrase()
    expect(validatePhrase(phrase)).toBe(true)
  })

  test('rejects invalid phrase', () => {
    expect(validatePhrase('not a valid phrase')).toBe(false)
    expect(validatePhrase('abandon abandon abandon')).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
pnpm test tests/unit/infrastructure/recovery-phrase.test.ts
```

Expected: FAIL - "Cannot find module"

**Step 3: Write minimal implementation**

Create `apps/extension/src/infrastructure/crypto/recovery-phrase.ts`:
```typescript
import { generateMnemonic, validateMnemonic } from 'bip39'

export function generateRecoveryPhrase(): string {
  // 256 bits = 24 words
  return generateMnemonic(256)
}

export function validatePhrase(phrase: string): boolean {
  return validateMnemonic(phrase)
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm test tests/unit/infrastructure/recovery-phrase.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/infrastructure/crypto/recovery-phrase.ts tests/unit/infrastructure/recovery-phrase.test.ts
git commit -m "feat(crypto): add recovery phrase generation and validation

Test: generates 24-word BIP-39 phrase, validates correctly
Implementation: wraps bip39 library for phrase operations"
```

### Task 8: Derive Identity from Phrase

**Step 1: Write failing test**

Add to `apps/extension/tests/unit/infrastructure/recovery-phrase.test.ts`:
```typescript
import { deriveIdentityFromPhrase } from '@/infrastructure/crypto/recovery-phrase'

describe('deriveIdentityFromPhrase', () => {
  test('derives same identity from same phrase', async () => {
    const phrase = generateRecoveryPhrase()

    const identity1 = await deriveIdentityFromPhrase(phrase)
    const identity2 = await deriveIdentityFromPhrase(phrase)

    expect(identity1.commitment).toBe(identity2.commitment)
    expect(identity1.publicKey).toBe(identity2.publicKey)
  })

  test('derives different identities from different phrases', async () => {
    const phrase1 = generateRecoveryPhrase()
    const phrase2 = generateRecoveryPhrase()

    const identity1 = await deriveIdentityFromPhrase(phrase1)
    const identity2 = await deriveIdentityFromPhrase(phrase2)

    expect(identity1.commitment).not.toBe(identity2.commitment)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
pnpm test tests/unit/infrastructure/recovery-phrase.test.ts
```

Expected: FAIL - "deriveIdentityFromPhrase is not defined"

**Step 3: Write minimal implementation**

Add to `apps/extension/src/infrastructure/crypto/recovery-phrase.ts`:
```typescript
import { mnemonicToSeedSync } from 'bip39'
import { deriveKeys } from '@chatham/crypto'

export interface Identity {
  commitment: string
  publicKey: string
  privateKey: string
}

export async function deriveIdentityFromPhrase(phrase: string): Promise<Identity> {
  const seed = mnemonicToSeedSync(phrase)
  const keys = await deriveKeys(seed)

  return {
    commitment: keys.commitment,
    publicKey: keys.publicKey,
    privateKey: keys.privateKey
  }
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm test tests/unit/infrastructure/recovery-phrase.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/infrastructure/crypto/recovery-phrase.ts tests/unit/infrastructure/recovery-phrase.test.ts
git commit -m "feat(crypto): add identity derivation from recovery phrase

Test: deterministic identity from phrase, different phrases yield different identities
Implementation: uses @chatham/crypto deriveKeys with BIP-39 seed"
```

---

## Phase 4: Infrastructure Layer - Storage

### Task 9: Board Repository (Save/Load)

**Files:**
- Create: `apps/extension/src/infrastructure/storage/board-repository.ts`
- Create: `apps/extension/tests/unit/infrastructure/board-repository.test.ts`

**Step 1: Write failing test**

Create `apps/extension/tests/unit/infrastructure/board-repository.test.ts`:
```typescript
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
```

**Step 2: Run test to verify it fails**

```bash
pnpm test tests/unit/infrastructure/board-repository.test.ts
```

Expected: FAIL - "Cannot find module"

**Step 3: Install fake-indexeddb**

```bash
pnpm add -D fake-indexeddb
```

**Step 4: Write minimal implementation**

Create `apps/extension/src/infrastructure/storage/board-repository.ts`:
```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb'
import * as Automerge from '@automerge/automerge'
import type { BoardContent } from '@chatham/types'

interface ChathamDB extends DBSchema {
  boards: {
    key: string
    value: {
      id: string
      encryptedContent: Uint8Array
      nonce: Uint8Array
      createdAt: number
      updatedAt: number
    }
  }
}

export class BoardRepository {
  private db: IDBPDatabase<ChathamDB> | null = null

  async initialize(): Promise<void> {
    this.db = await openDB<ChathamDB>('chatham', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('boards')) {
          db.createObjectStore('boards', { keyPath: 'id' })
        }
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

    await this.db.put('boards', {
      id: boardId,
      encryptedContent: new Uint8Array(encrypted),
      nonce,
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
}
```

**Step 5: Run test to verify it passes**

```bash
pnpm test tests/unit/infrastructure/board-repository.test.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add src/infrastructure/storage/board-repository.ts tests/unit/infrastructure/board-repository.test.ts
git commit -m "feat(storage): add board repository with encryption

Test: save/retrieve board with encryption, list board IDs
Implementation: IndexedDB with AES-GCM encryption, Automerge serialization
Uses fake-indexeddb for testing"
```

---

## Phase 5: State Management

### Task 10: Auth Store (Zustand)

**Files:**
- Create: `apps/extension/src/ui/shared/stores/auth-store.ts`
- Create: `apps/extension/tests/unit/stores/auth-store.test.ts`

**Step 1: Write failing test**

Create `apps/extension/tests/unit/stores/auth-store.test.ts`:
```typescript
import { describe, test, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/ui/shared/stores/auth-store'

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      hasRecoveryPhrase: false,
      isEvaluationMode: false,
      evaluationStartedAt: null,
      evaluationCardCount: 0
    })
  })

  test('starts in unauthenticated state', () => {
    const state = useAuthStore.getState()

    expect(state.hasRecoveryPhrase).toBe(false)
    expect(state.isEvaluationMode).toBe(false)
  })

  test('checkEvaluationLimit returns true when under limit', () => {
    useAuthStore.setState({
      isEvaluationMode: true,
      evaluationStartedAt: Date.now(),
      evaluationCardCount: 5
    })

    const state = useAuthStore.getState()
    expect(state.checkEvaluationLimit()).toBe(true)
  })

  test('checkEvaluationLimit returns false when 10 cards reached', () => {
    useAuthStore.setState({
      isEvaluationMode: true,
      evaluationStartedAt: Date.now(),
      evaluationCardCount: 10
    })

    const state = useAuthStore.getState()
    expect(state.checkEvaluationLimit()).toBe(false)
  })

  test('checkEvaluationLimit returns false when 24 hours passed', () => {
    useAuthStore.setState({
      isEvaluationMode: true,
      evaluationStartedAt: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
      evaluationCardCount: 0
    })

    const state = useAuthStore.getState()
    expect(state.checkEvaluationLimit()).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
pnpm test tests/unit/stores/auth-store.test.ts
```

Expected: FAIL - "Cannot find module"

**Step 3: Write minimal implementation**

Create `apps/extension/src/ui/shared/stores/auth-store.ts`:
```typescript
import { create } from 'zustand'

interface AuthState {
  hasRecoveryPhrase: boolean
  isEvaluationMode: boolean
  evaluationStartedAt: number | null
  evaluationCardCount: number
}

interface AuthActions {
  setHasRecoveryPhrase: (value: boolean) => void
  startEvaluationMode: () => void
  incrementCardCount: () => void
  checkEvaluationLimit: () => boolean
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  hasRecoveryPhrase: false,
  isEvaluationMode: false,
  evaluationStartedAt: null,
  evaluationCardCount: 0,

  setHasRecoveryPhrase: (value) => set({ hasRecoveryPhrase: value }),

  startEvaluationMode: () => set({
    isEvaluationMode: true,
    evaluationStartedAt: Date.now(),
    evaluationCardCount: 0
  }),

  incrementCardCount: () => set((state) => ({
    evaluationCardCount: state.evaluationCardCount + 1
  })),

  checkEvaluationLimit: () => {
    const state = get()
    if (!state.isEvaluationMode) return true

    const elapsed = Date.now() - (state.evaluationStartedAt || 0)
    const hoursPassed = elapsed / (60 * 60 * 1000)

    if (hoursPassed >= 24) return false
    if (state.evaluationCardCount >= 10) return false

    return true
  }
}))
```

**Step 4: Run test to verify it passes**

```bash
pnpm test tests/unit/stores/auth-store.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/ui/shared/stores/auth-store.ts tests/unit/stores/auth-store.test.ts
git commit -m "feat(stores): add auth store with evaluation mode logic

Test: evaluation mode enforcement (24h OR 10 cards limit)
Implementation: Zustand store with checkEvaluationLimit method"
```

---

## Phase 6: React Components (Basic)

### Task 11: Recovery Phrase Setup Component

**Files:**
- Create: `apps/extension/src/ui/shared/components/RecoveryPhraseSetup.tsx`
- Create: `apps/extension/tests/component/RecoveryPhraseSetup.test.tsx`
- Install: shadcn Button, Dialog, Input components

**Step 1: Install shadcn components**

```bash
npx shadcn@latest init
# Choose: Default style, Zinc color, CSS variables: yes

npx shadcn@latest add button dialog input label card
```

**Step 2: Write failing test**

Create `apps/extension/tests/component/RecoveryPhraseSetup.test.tsx`:
```typescript
import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecoveryPhraseSetup } from '@/ui/shared/components/RecoveryPhraseSetup'

describe('RecoveryPhraseSetup', () => {
  test('shows three options on initial render', () => {
    render(<RecoveryPhraseSetup onComplete={vi.fn()} />)

    expect(screen.getByText(/create new recovery phrase/i)).toBeInTheDocument()
    expect(screen.getByText(/import existing phrase/i)).toBeInTheDocument()
    expect(screen.getByText(/skip for now/i)).toBeInTheDocument()
  })

  test('create new phrase shows 24 words', async () => {
    const user = userEvent.setup()
    render(<RecoveryPhraseSetup onComplete={vi.fn()} />)

    await user.click(screen.getByText(/create new/i))

    // Should show phrase display
    const words = screen.getAllByTestId('phrase-word')
    expect(words).toHaveLength(24)
  })

  test('skip for now shows warning dialog', async () => {
    const user = userEvent.setup()
    render(<RecoveryPhraseSetup onComplete={vi.fn()} />)

    await user.click(screen.getByText(/skip for now/i))

    expect(screen.getByText(/evaluation mode/i)).toBeInTheDocument()
    expect(screen.getByText(/24 hours/i)).toBeInTheDocument()
    expect(screen.getByText(/10 cards/i)).toBeInTheDocument()
  })
})
```

**Step 3: Run test to verify it fails**

```bash
pnpm test tests/component/RecoveryPhraseSetup.test.tsx
```

Expected: FAIL - "Cannot find module"

**Step 4: Write minimal implementation**

Create `apps/extension/src/ui/shared/components/RecoveryPhraseSetup.tsx`:
```typescript
import { useState } from 'react'
import { Button } from '@/ui/shared/components/ui/button'
import { Card } from '@/ui/shared/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/ui/shared/components/ui/dialog'
import { generateRecoveryPhrase } from '@/infrastructure/crypto/recovery-phrase'

interface Props {
  onComplete: (phrase: string, isEvaluation: boolean) => void
}

type Step = 'choose' | 'create' | 'import' | 'evaluate'

export function RecoveryPhraseSetup({ onComplete }: Props) {
  const [step, setStep] = useState<Step>('choose')
  const [phrase, setPhrase] = useState<string>('')
  const [showEvaluationWarning, setShowEvaluationWarning] = useState(false)

  const handleCreateNew = () => {
    const newPhrase = generateRecoveryPhrase()
    setPhrase(newPhrase)
    setStep('create')
  }

  const handleSkipForNow = () => {
    setShowEvaluationWarning(true)
  }

  const handleConfirmEvaluation = () => {
    onComplete('', true) // Empty phrase for evaluation mode
  }

  if (step === 'choose') {
    return (
      <div className="p-6 space-y-4">
        <h2 className="text-2xl font-bold">Welcome to Chatham</h2>

        <div className="space-y-3">
          <Button onClick={handleCreateNew} className="w-full">
            Create New Recovery Phrase
          </Button>

          <Button onClick={() => setStep('import')} variant="outline" className="w-full">
            Import Existing Phrase
          </Button>

          <Button onClick={handleSkipForNow} variant="ghost" className="w-full">
            Skip for Now
          </Button>
        </div>

        <Dialog open={showEvaluationWarning} onOpenChange={setShowEvaluationWarning}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>⚠️ Evaluation Mode</DialogTitle>
              <DialogDescription className="space-y-2">
                <p>Your data will be lost when you close the browser.</p>
                <p>Evaluation period expires after:</p>
                <ul className="list-disc pl-5">
                  <li>24 hours, OR</li>
                  <li>10 cards created</li>
                </ul>
                <p>(whichever comes first)</p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEvaluationWarning(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmEvaluation}>
                Start Evaluation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  if (step === 'create') {
    const words = phrase.split(' ')

    return (
      <div className="p-6 space-y-4">
        <h2 className="text-2xl font-bold">Your Recovery Phrase</h2>
        <p className="text-sm text-muted-foreground">
          Write these 24 words down. You'll need them to recover your data.
        </p>

        <div className="grid grid-cols-3 gap-2">
          {words.map((word, i) => (
            <div key={i} data-testid="phrase-word" className="p-2 bg-muted rounded text-center">
              {word}
            </div>
          ))}
        </div>

        <Button onClick={() => onComplete(phrase, false)}>
          I've Written This Down
        </Button>
      </div>
    )
  }

  return null
}
```

**Step 5: Run test to verify it passes**

```bash
pnpm test tests/component/RecoveryPhraseSetup.test.tsx
```

Expected: PASS

**Step 6: Commit**

```bash
git add src/ui/shared/components/RecoveryPhraseSetup.tsx tests/component/RecoveryPhraseSetup.test.tsx
git commit -m "feat(ui): add RecoveryPhraseSetup component

Test: shows three options, displays 24 words when creating, shows warning for evaluation
Implementation: shadcn Dialog/Button/Card, generates phrase with @chatham/crypto"
```

---

## Phase 7: Integration & Wiring

### Task 12: Board List Hook with TanStack Query

**Files:**
- Create: `apps/extension/src/ui/shared/hooks/useBoards.ts`
- Create: `apps/extension/tests/integration/useBoards.test.ts`

**Step 1: Write failing test**

Create `apps/extension/tests/integration/useBoards.test.ts`:
```typescript
import { describe, test, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useBoards, useCreateBoard } from '@/ui/shared/hooks/useBoards'
import 'fake-indexeddb/auto'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useBoards', () => {
  beforeEach(() => {
    // Reset IndexedDB
    indexedDB = new IDBFactory()
  })

  test('returns empty list initially', async () => {
    const { result } = renderHook(() => useBoards(), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })
})

describe('useCreateBoard', () => {
  test('creates board and invalidates boards query', async () => {
    const wrapper = createWrapper()
    const { result: createResult } = renderHook(() => useCreateBoard(), { wrapper })
    const { result: listResult } = renderHook(() => useBoards(), { wrapper })

    await waitFor(() => expect(listResult.current.isSuccess).toBe(true))
    expect(listResult.current.data).toHaveLength(0)

    createResult.current.mutate({ name: 'Test Board' })

    await waitFor(() => expect(createResult.current.isSuccess).toBe(true))
    await waitFor(() => expect(listResult.current.data).toHaveLength(1))

    expect(listResult.current.data?.[0].name).toBe('Test Board')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
pnpm test tests/integration/useBoards.test.ts
```

Expected: FAIL - "Cannot find module"

**Step 3: Write minimal implementation**

Create `apps/extension/src/ui/shared/hooks/useBoards.ts`:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BoardRepository } from '@/infrastructure/storage/board-repository'
import { createBoard as createBoardDomain } from '@/domain/board'
import type { BoardContent } from '@chatham/types'
import * as Automerge from '@automerge/automerge'

const repository = new BoardRepository()

// Initialize on module load
repository.initialize()

interface BoardListItem {
  id: string
  name: string
  cardCount: number
  updatedAt: number
}

export function useBoards() {
  return useQuery({
    queryKey: ['boards'],
    queryFn: async (): Promise<BoardListItem[]> => {
      const boardIds = await repository.listBoardIds()
      // For now, return minimal data
      // TODO: Store metadata separately for performance
      return boardIds.map(id => ({
        id,
        name: 'Board', // Placeholder
        cardCount: 0,
        updatedAt: Date.now()
      }))
    }
  })
}

interface CreateBoardInput {
  name: string
}

export function useCreateBoard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateBoardInput) => {
      const boardId = crypto.randomUUID()
      const board = createBoardDomain(input.name, 'temp-user')

      // Generate board key
      const boardKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      )

      await repository.saveBoard(boardId, board, boardKey)

      return { id: boardId, board }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
    }
  })
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm test tests/integration/useBoards.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/ui/shared/hooks/useBoards.ts tests/integration/useBoards.test.ts
git commit -m "feat(hooks): add useBoards and useCreateBoard with TanStack Query

Test: lists boards, creates board and invalidates query
Implementation: TanStack Query hooks wrapping BoardRepository"
```

---

## Phase 8: Sidepanel UI

### Task 13: Sidepanel App Shell

**Files:**
- Modify: `apps/extension/src/ui/sidepanel/main.tsx`
- Create: `apps/extension/src/ui/sidepanel/SidepanelApp.tsx`
- Create: `apps/extension/tests/component/SidepanelApp.test.tsx`

**Step 1: Write failing test**

Create `apps/extension/tests/component/SidepanelApp.test.tsx`:
```typescript
import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SidepanelApp } from '@/ui/sidepanel/SidepanelApp'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

function renderWithProviders(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('SidepanelApp', () => {
  test('shows RecoveryPhraseSetup when no phrase exists', () => {
    renderWithProviders(<SidepanelApp />)

    expect(screen.getByText(/create new recovery phrase/i)).toBeInTheDocument()
  })

  test('shows BoardList when phrase exists', () => {
    // Mock auth store to have recovery phrase
    renderWithProviders(<SidepanelApp hasRecoveryPhrase={true} />)

    expect(screen.getByText(/create board/i)).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
pnpm test tests/component/SidepanelApp.test.tsx
```

Expected: FAIL - "Cannot find module"

**Step 3: Write minimal implementation**

Create `apps/extension/src/ui/sidepanel/SidepanelApp.tsx`:
```typescript
import { useAuthStore } from '@/ui/shared/stores/auth-store'
import { RecoveryPhraseSetup } from '@/ui/shared/components/RecoveryPhraseSetup'

export function SidepanelApp() {
  const hasRecoveryPhrase = useAuthStore((state) => state.hasRecoveryPhrase)

  if (!hasRecoveryPhrase) {
    return (
      <RecoveryPhraseSetup
        onComplete={(phrase, isEvaluation) => {
          if (isEvaluation) {
            useAuthStore.getState().startEvaluationMode()
          } else {
            // TODO: Save phrase to chrome.storage
            useAuthStore.getState().setHasRecoveryPhrase(true)
          }
        }}
      />
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-lg font-bold mb-4">Chatham</h1>
      <button className="w-full p-2 border rounded">Create Board</button>
    </div>
  )
}
```

Modify `apps/extension/src/ui/sidepanel/main.tsx`:
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SidepanelApp } from './SidepanelApp'
import '../shared/index.css'

const queryClient = new QueryClient()

createRoot(document.getElementById('sidepanel-root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SidepanelApp />
    </QueryClientProvider>
  </StrictMode>
)
```

**Step 4: Run test to verify it passes**

```bash
pnpm test tests/component/SidepanelApp.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/ui/sidepanel/SidepanelApp.tsx src/ui/sidepanel/main.tsx tests/component/SidepanelApp.test.tsx
git commit -m "feat(ui): add sidepanel app shell with conditional rendering

Test: shows RecoveryPhraseSetup when no phrase, shows board list when phrase exists
Implementation: conditional rendering based on auth store state"
```

### Task 14: Board List Component

**Files:**
- Create: `apps/extension/src/ui/shared/components/BoardList.tsx`
- Create: `apps/extension/tests/component/BoardList.test.tsx`

**Step 1: Write failing test**

Create `apps/extension/tests/component/BoardList.test.tsx`:
```typescript
import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BoardList } from '@/ui/shared/components/BoardList'

describe('BoardList', () => {
  test('displays empty state when no boards', () => {
    render(<BoardList boards={[]} onSelect={vi.fn()} onCreate={vi.fn()} />)

    expect(screen.getByText(/no boards yet/i)).toBeInTheDocument()
    expect(screen.getByText(/create your first board/i)).toBeInTheDocument()
  })

  test('displays board cards when boards exist', () => {
    const boards = [
      { id: '1', name: 'Security Review', cardCount: 5, updatedAt: Date.now() },
      { id: '2', name: 'Risk Register', cardCount: 3, updatedAt: Date.now() }
    ]

    render(<BoardList boards={boards} onSelect={vi.fn()} onCreate={vi.fn()} />)

    expect(screen.getByText('Security Review')).toBeInTheDocument()
    expect(screen.getByText('Risk Register')).toBeInTheDocument()
    expect(screen.getByText('5 cards')).toBeInTheDocument()
  })

  test('calls onSelect when board clicked', async () => {
    const mockSelect = vi.fn()
    const boards = [{ id: '1', name: 'Test', cardCount: 0, updatedAt: Date.now() }]

    render(<BoardList boards={boards} onSelect={mockSelect} onCreate={vi.fn()} />)

    await userEvent.click(screen.getByText('Test'))

    expect(mockSelect).toHaveBeenCalledWith('1')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
pnpm test tests/component/BoardList.test.tsx
```

Expected: FAIL - "Cannot find module"

**Step 3: Write minimal implementation**

Create `apps/extension/src/ui/shared/components/BoardList.tsx`:
```typescript
import { Card } from '@/ui/shared/components/ui/card'
import { Button } from '@/ui/shared/components/ui/button'

interface BoardListItem {
  id: string
  name: string
  cardCount: number
  updatedAt: number
}

interface Props {
  boards: BoardListItem[]
  onSelect: (boardId: string) => void
  onCreate: () => void
}

export function BoardList({ boards, onSelect, onCreate }: Props) {
  if (boards.length === 0) {
    return (
      <div className="p-4 text-center space-y-4">
        <p className="text-muted-foreground">No boards yet</p>
        <p className="text-sm">Create your first board to get started</p>
        <Button onClick={onCreate}>Create Board</Button>
      </div>
    )
  }

  return (
    <div className="space-y-2 p-2">
      {boards.map((board) => (
        <Card
          key={board.id}
          className="p-3 cursor-pointer hover:bg-accent"
          onClick={() => onSelect(board.id)}
        >
          <h3 className="font-medium">{board.name}</h3>
          <p className="text-sm text-muted-foreground">{board.cardCount} cards</p>
        </Card>
      ))}
      <Button onClick={onCreate} variant="outline" className="w-full">
        Create Board
      </Button>
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm test tests/component/BoardList.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/ui/shared/components/BoardList.tsx tests/component/BoardList.test.tsx
git commit -m "feat(ui): add BoardList component with empty state

Test: displays empty state, shows boards, handles click
Implementation: shadcn Card/Button with board list and create action"
```

### Task 15: Integrate BoardList into Sidepanel

**Files:**
- Modify: `apps/extension/src/ui/sidepanel/SidepanelApp.tsx`
- Modify: `apps/extension/tests/component/SidepanelApp.test.tsx`

**Step 1: Write failing test**

Add to `apps/extension/tests/component/SidepanelApp.test.tsx`:
```typescript
test('integrates BoardList when phrase exists', async () => {
  // Mock useBoards hook to return test data
  vi.mock('@/ui/shared/hooks/useBoards', () => ({
    useBoards: () => ({
      data: [{ id: '1', name: 'Test Board', cardCount: 0, updatedAt: Date.now() }],
      isLoading: false
    })
  }))

  renderWithProviders(<SidepanelApp hasRecoveryPhrase={true} />)

  expect(screen.getByText('Test Board')).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

```bash
pnpm test tests/component/SidepanelApp.test.tsx
```

Expected: FAIL - "Cannot find 'Test Board'"

**Step 3: Write minimal implementation**

Modify `apps/extension/src/ui/sidepanel/SidepanelApp.tsx`:
```typescript
import { useState } from 'react'
import { useAuthStore } from '@/ui/shared/stores/auth-store'
import { RecoveryPhraseSetup } from '@/ui/shared/components/RecoveryPhraseSetup'
import { BoardList } from '@/ui/shared/components/BoardList'
import { useBoards } from '@/ui/shared/hooks/useBoards'

export function SidepanelApp() {
  const hasRecoveryPhrase = useAuthStore((state) => state.hasRecoveryPhrase)
  const { data: boards = [], isLoading } = useBoards()
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)

  if (!hasRecoveryPhrase) {
    return (
      <RecoveryPhraseSetup
        onComplete={(phrase, isEvaluation) => {
          if (isEvaluation) {
            useAuthStore.getState().startEvaluationMode()
          } else {
            // TODO: Save phrase to chrome.storage
            useAuthStore.getState().setHasRecoveryPhrase(true)
          }
        }}
      />
    )
  }

  if (isLoading) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <div className="h-full flex flex-col">
      <BoardList
        boards={boards}
        onSelect={setSelectedBoardId}
        onCreate={() => {
          // TODO: Open create board dialog
        }}
      />
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm test tests/component/SidepanelApp.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/ui/sidepanel/SidepanelApp.tsx tests/component/SidepanelApp.test.tsx
git commit -m "feat(ui): integrate BoardList into sidepanel app

Test: displays boards from useBoards hook
Implementation: connects BoardList component with TanStack Query data"
```

---

## Phase 9: Fullpage UI

### Task 16: Fullpage App Shell

**Files:**
- Modify: `apps/extension/src/ui/fullpage/main.tsx`
- Create: `apps/extension/src/ui/fullpage/FullpageApp.tsx`
- Create: `apps/extension/tests/component/FullpageApp.test.tsx`

**Step 1: Write failing test**

Create `apps/extension/tests/component/FullpageApp.test.tsx`:
```typescript
import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FullpageApp } from '@/ui/fullpage/FullpageApp'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

function renderWithProviders(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('FullpageApp', () => {
  test('shows RecoveryPhraseSetup when no phrase exists', () => {
    renderWithProviders(<FullpageApp />)

    expect(screen.getByText(/create new recovery phrase/i)).toBeInTheDocument()
  })

  test('shows sidebar and main content when phrase exists', () => {
    renderWithProviders(<FullpageApp hasRecoveryPhrase={true} />)

    expect(screen.getByRole('complementary')).toBeInTheDocument() // Sidebar
    expect(screen.getByRole('main')).toBeInTheDocument() // Main content
  })
})
```

**Step 2: Run test to verify it fails**

```bash
pnpm test tests/component/FullpageApp.test.tsx
```

Expected: FAIL - "Cannot find module"

**Step 3: Write minimal implementation**

Create `apps/extension/src/ui/fullpage/FullpageApp.tsx`:
```typescript
import { useAuthStore } from '@/ui/shared/stores/auth-store'
import { RecoveryPhraseSetup } from '@/ui/shared/components/RecoveryPhraseSetup'

export function FullpageApp() {
  const hasRecoveryPhrase = useAuthStore((state) => state.hasRecoveryPhrase)

  if (!hasRecoveryPhrase) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-full max-w-md">
          <RecoveryPhraseSetup
            onComplete={(phrase, isEvaluation) => {
              if (isEvaluation) {
                useAuthStore.getState().startEvaluationMode()
              } else {
                // TODO: Save phrase
                useAuthStore.getState().setHasRecoveryPhrase(true)
              }
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex">
      <aside role="complementary" className="w-64 border-r p-4">
        <h2 className="text-lg font-bold">Sidebar</h2>
      </aside>
      <main role="main" className="flex-1 p-4">
        <h1 className="text-2xl font-bold">Main Content</h1>
      </main>
    </div>
  )
}
```

Modify `apps/extension/src/ui/fullpage/main.tsx`:
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FullpageApp } from './FullpageApp'
import '../shared/index.css'

const queryClient = new QueryClient()

createRoot(document.getElementById('fullpage-root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <FullpageApp />
    </QueryClientProvider>
  </StrictMode>
)
```

**Step 4: Run test to verify it passes**

```bash
pnpm test tests/component/FullpageApp.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/ui/fullpage/FullpageApp.tsx src/ui/fullpage/main.tsx tests/component/FullpageApp.test.tsx
git commit -m "feat(ui): add fullpage app shell with sidebar layout

Test: conditional rendering based on recovery phrase, shows sidebar and main
Implementation: two-column layout (sidebar + main content)"
```

### Task 17: Evaluation Mode Banner Component

**Files:**
- Create: `apps/extension/src/ui/shared/components/EvaluationBanner.tsx`
- Create: `apps/extension/tests/component/EvaluationBanner.test.tsx`

**Step 1: Write failing test**

Create `apps/extension/tests/component/EvaluationBanner.test.tsx`:
```typescript
import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EvaluationBanner } from '@/ui/shared/components/EvaluationBanner'

describe('EvaluationBanner', () => {
  test('displays warning and cards remaining', () => {
    render(<EvaluationBanner cardsRemaining={7} onCreatePhrase={vi.fn()} />)

    expect(screen.getByText(/evaluation mode/i)).toBeInTheDocument()
    expect(screen.getByText(/data will be lost/i)).toBeInTheDocument()
    expect(screen.getByText(/7\/10 cards/i)).toBeInTheDocument()
  })

  test('calls onCreatePhrase when button clicked', async () => {
    const mockCreate = vi.fn()
    render(<EvaluationBanner cardsRemaining={5} onCreatePhrase={mockCreate} />)

    await userEvent.click(screen.getByText(/create recovery phrase/i))

    expect(mockCreate).toHaveBeenCalled()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
pnpm test tests/component/EvaluationBanner.test.tsx
```

Expected: FAIL - "Cannot find module"

**Step 3: Write minimal implementation**

Create `apps/extension/src/ui/shared/components/EvaluationBanner.tsx`:
```typescript
import { Button } from '@/ui/shared/components/ui/button'

interface Props {
  cardsRemaining: number
  onCreatePhrase: () => void
}

export function EvaluationBanner({ cardsRemaining, onCreatePhrase }: Props) {
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-yellow-800">⚠️ Evaluation Mode</p>
          <p className="text-sm text-yellow-700">Data will be lost on close</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{cardsRemaining}/10 cards</span>
          <Button size="sm" onClick={onCreatePhrase}>
            Create Recovery Phrase
          </Button>
        </div>
      </div>
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm test tests/component/EvaluationBanner.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/ui/shared/components/EvaluationBanner.tsx tests/component/EvaluationBanner.test.tsx
git commit -m "feat(ui): add evaluation mode banner component

Test: displays warning and cards remaining, handles create phrase click
Implementation: yellow warning banner with card counter and CTA button"
```

---

## Remaining Tasks (18-47) - Summary

Due to the large scope of the remaining implementation (30 more tasks), I recommend:

**Option A:** Continue expanding each task in detail (will require significant document size)

**Option B:** Create task groups with shared patterns and let subagents follow the established TDD pattern from Tasks 1-17

**Option C:** Pause plan expansion and begin implementing Tasks 13-17 (which are now detailed), then expand remaining tasks as needed

The current plan provides:
- ✅ Tasks 1-12: Fully detailed (COMPLETED)
- ✅ Tasks 13-16: Fully detailed (READY TO IMPLEMENT)
- ⏸️ Tasks 17-47: High-level summaries only

Would you like me to continue with full detail for all 30 remaining tasks, or implement Tasks 13-16 first?

---

## TDD Workflow for Each Task

**RED:**
1. Write failing test
2. Run: `pnpm test <test-file>`
3. Confirm: FAIL with expected error

**GREEN:**
1. Write minimal code
2. Run: `pnpm test <test-file>`
3. Confirm: PASS

**REFACTOR:**
1. Improve code (if needed)
2. Run: `pnpm test`
3. Confirm: All tests still PASS

**COMMIT:**
```bash
git add <files>
git commit -m "feat(<scope>): <description>

Test: <what test verifies>
Implementation: <how it works>"
```

---

## Success Criteria

MVP complete when:
- [ ] All unit tests passing (50-60 tests)
- [ ] All component tests passing (30-40 tests)
- [ ] All integration tests passing (10-15 tests)
- [ ] Can create board locally
- [ ] Can add/edit/delete cards
- [ ] Can drag-drop between columns
- [ ] Can attach files (encrypted in IndexedDB)
- [ ] Recovery phrase works (create/import/skip)
- [ ] Evaluation mode enforces limits
- [ ] Sidepanel + fullpage both functional
- [ ] Data persists across browser restarts
- [ ] All data encrypted in storage

---

## Notes for Implementation

**TDD Discipline:**
- NEVER write implementation before test fails
- ALWAYS watch test fail before writing code
- Keep implementation minimal (just enough to pass)
- Refactor only when green
- Commit after each GREEN

**Testing Mocks:**
```typescript
// tests/mocks/chrome.ts
export function mockChromeStorage() {
  const storage = new Map()
  global.chrome = {
    storage: {
      local: {
        get: vi.fn((keys) => Promise.resolve(Object.fromEntries(storage))),
        set: vi.fn((items) => {
          Object.entries(items).forEach(([k, v]) => storage.set(k, v))
          return Promise.resolve()
        })
      }
    }
  } as any
}
```

**Common Patterns:**
- Domain functions: Pure, no side effects
- Infrastructure: All external deps (crypto, storage, Chrome APIs)
- UI: Presentation only, delegate to hooks
- Hooks: Bridge between UI and infrastructure

**References:**
- Design: `docs/plans/2025-12-12-chrome-extension-design.md`
- ADR: `docs/adr/007-chrome-extension-architecture.md`
- TDD Skill: `superpowers:test-driven-development`
