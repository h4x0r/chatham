# ZKKB Backend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build Cloudflare Workers backend with D1 database, R2 storage, and Durable Objects for real-time sync.

**Architecture:** Cloudflare Workers handle API requests, D1 stores metadata and Merkle trees, R2 stores encrypted blobs, Durable Objects manage WebSocket connections per board. All board content is encrypted client-side - server only sees ciphertext.

**Tech Stack:** Cloudflare Workers, D1, R2, Durable Objects, itty-router, Semaphore proof verification

---

## Phase 7: Cloudflare Backend

### Task 7.1: Initialize Workers Project

**Files:**
- Create: `api/package.json`
- Create: `api/wrangler.toml`
- Create: `api/tsconfig.json`
- Create: `api/src/index.ts`

**Step 1: Create api directory**

Run:
```bash
mkdir -p api/src
```

**Step 2: Initialize package.json**

Create `api/package.json`:

```json
{
  "name": "zkkb-api",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "db:migrate": "wrangler d1 execute zkkb --local --file=./schema.sql",
    "db:migrate:prod": "wrangler d1 execute zkkb --file=./schema.sql"
  },
  "dependencies": {
    "itty-router": "^4.0.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20231218.0",
    "typescript": "^5.3.0",
    "wrangler": "^3.22.0"
  }
}
```

**Step 3: Create wrangler.toml**

Create `api/wrangler.toml`:

```toml
name = "zkkb-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "zkkb"
database_id = "placeholder-will-be-replaced"

[[r2_buckets]]
binding = "R2"
bucket_name = "zkkb"

[[durable_objects.bindings]]
name = "BOARD_SYNC"
class_name = "BoardSync"

[[migrations]]
tag = "v1"
new_classes = ["BoardSync"]
```

**Step 4: Create tsconfig.json**

Create `api/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["src/**/*"]
}
```

**Step 5: Create minimal index.ts**

Create `api/src/index.ts`:

```typescript
import { Router } from 'itty-router'

export interface Env {
  DB: D1Database
  R2: R2Bucket
  BOARD_SYNC: DurableObjectNamespace
}

const router = Router()

router.get('/health', () => {
  return new Response(JSON.stringify({ status: 'ok' }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

router.all('*', () => {
  return new Response('Not Found', { status: 404 })
})

export default {
  fetch: router.handle,
}
```

**Step 6: Install dependencies**

Run:
```bash
cd api && npm install
```

**Step 7: Commit**

```bash
git add -A
git commit -m "chore: initialize Cloudflare Workers project"
```

---

### Task 7.2: Create D1 Schema

**Files:**
- Create: `api/schema.sql`

**Step 1: Create schema.sql**

Create `api/schema.sql`:

```sql
-- Users table (email only, no credentials)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL
);

-- Boards table (metadata + merkle tree, no content)
CREATE TABLE IF NOT EXISTS boards (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL,
  merkle_root TEXT NOT NULL,
  merkle_tree_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  archived_at INTEGER,
  FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- User's board list (which boards a user knows about)
CREATE TABLE IF NOT EXISTS user_boards (
  user_id TEXT NOT NULL,
  board_id TEXT NOT NULL,
  added_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, board_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (board_id) REFERENCES boards(id)
);

-- Magic links for passwordless auth
CREATE TABLE IF NOT EXISTS magic_links (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used INTEGER DEFAULT 0
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_magic_links_email ON magic_links(email);
CREATE INDEX IF NOT EXISTS idx_magic_links_code ON magic_links(code);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_boards_user ON user_boards(user_id);
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add D1 database schema"
```

---

### Task 7.3: Create Type Definitions

**Files:**
- Create: `api/src/types.ts`

**Step 1: Create types.ts**

Create `api/src/types.ts`:

```typescript
export interface Env {
  DB: D1Database
  R2: R2Bucket
  BOARD_SYNC: DurableObjectNamespace
}

export interface User {
  id: string
  email: string
  created_at: number
}

export interface Board {
  id: string
  creator_id: string
  merkle_root: string
  merkle_tree_json: string
  created_at: number
  archived_at: number | null
}

export interface MagicLink {
  id: string
  email: string
  code: string
  expires_at: number
  used: number
}

export interface Session {
  id: string
  user_id: string
  expires_at: number
}

export interface SemaphoreProof {
  merkleTreeDepth: number
  merkleTreeRoot: string
  nullifier: string
  message: string
  scope: string
  points: string[]
}

export interface AuthenticatedRequest extends Request {
  user?: User
  session?: Session
}

export interface ZKAuthenticatedRequest extends Request {
  proof?: SemaphoreProof
  boardId?: string
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add TypeScript type definitions"
```

---

### Task 7.4: Auth Routes - Send Magic Link

**Files:**
- Create: `api/src/routes/auth.ts`
- Modify: `api/src/index.ts`

**Step 1: Create auth routes file**

Create `api/src/routes/auth.ts`:

```typescript
import { Router } from 'itty-router'
import type { Env, MagicLink, User, Session } from '../types'

const router = Router({ base: '/auth' })

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function generateId(): string {
  return crypto.randomUUID()
}

// POST /auth/send-code
router.post('/send-code', async (request: Request, env: Env) => {
  const body = await request.json() as { email?: string }
  const email = body.email?.toLowerCase().trim()

  if (!email || !email.includes('@')) {
    return new Response(JSON.stringify({ error: 'Invalid email' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const code = generateCode()
  const id = generateId()
  const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes

  // Store magic link
  await env.DB.prepare(
    'INSERT INTO magic_links (id, email, code, expires_at, used) VALUES (?, ?, ?, ?, 0)'
  ).bind(id, email, code, expiresAt).run()

  // TODO: Send email with code
  // For now, log it (in production, integrate with email service)
  console.log(`Magic code for ${email}: ${code}`)

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

// POST /auth/verify
router.post('/verify', async (request: Request, env: Env) => {
  const body = await request.json() as { email?: string; code?: string }
  const email = body.email?.toLowerCase().trim()
  const code = body.code?.trim()

  if (!email || !code) {
    return new Response(JSON.stringify({ error: 'Email and code required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Find valid magic link
  const magicLink = await env.DB.prepare(
    'SELECT * FROM magic_links WHERE email = ? AND code = ? AND used = 0 AND expires_at > ?'
  ).bind(email, code, Date.now()).first<MagicLink>()

  if (!magicLink) {
    return new Response(JSON.stringify({ error: 'Invalid or expired code' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Mark as used
  await env.DB.prepare('UPDATE magic_links SET used = 1 WHERE id = ?')
    .bind(magicLink.id).run()

  // Find or create user
  let user = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
    .bind(email).first<User>()

  if (!user) {
    const userId = generateId()
    await env.DB.prepare('INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)')
      .bind(userId, email, Date.now()).run()
    user = { id: userId, email, created_at: Date.now() }
  }

  // Create session
  const sessionId = generateId()
  const sessionExpires = Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days

  await env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(sessionId, user.id, sessionExpires).run()

  return new Response(JSON.stringify({
    session: sessionId,
    user: { id: user.id, email: user.email },
  }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

// POST /auth/logout
router.post('/logout', async (request: Request, env: Env) => {
  const authHeader = request.headers.get('Authorization')
  const sessionId = authHeader?.replace('Bearer ', '')

  if (sessionId) {
    await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run()
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

export { router as authRouter }
```

**Step 2: Update index.ts to use auth routes**

Replace `api/src/index.ts`:

```typescript
import { Router } from 'itty-router'
import { authRouter } from './routes/auth'
import type { Env } from './types'

const router = Router()

// Health check
router.get('/health', () => {
  return new Response(JSON.stringify({ status: 'ok' }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

// Auth routes
router.all('/auth/*', authRouter.handle)

// 404
router.all('*', () => {
  return new Response('Not Found', { status: 404 })
})

export default {
  fetch: (request: Request, env: Env) => router.handle(request, env),
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add magic link authentication routes"
```

---

### Task 7.5: Session Middleware

**Files:**
- Create: `api/src/middleware/session.ts`

**Step 1: Create session middleware**

Create `api/src/middleware/session.ts`:

```typescript
import type { Env, User, Session, AuthenticatedRequest } from '../types'

export async function withSession(
  request: AuthenticatedRequest,
  env: Env
): Promise<Response | void> {
  const authHeader = request.headers.get('Authorization')
  const sessionId = authHeader?.replace('Bearer ', '')

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const session = await env.DB.prepare(
    'SELECT * FROM sessions WHERE id = ? AND expires_at > ?'
  ).bind(sessionId, Date.now()).first<Session>()

  if (!session) {
    return new Response(JSON.stringify({ error: 'Session expired' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(session.user_id).first<User>()

  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  request.user = user
  request.session = session
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add session authentication middleware"
```

---

### Task 7.6: ZK Proof Middleware

**Files:**
- Create: `api/src/middleware/zkproof.ts`
- Modify: `api/package.json`

**Step 1: Add Semaphore dependency**

Update `api/package.json` dependencies:

```json
{
  "dependencies": {
    "itty-router": "^4.0.0",
    "@semaphore-protocol/proof": "^4.0.0",
    "@semaphore-protocol/core": "^4.0.0"
  }
}
```

Run:
```bash
cd api && npm install
```

**Step 2: Create ZK proof middleware**

Create `api/src/middleware/zkproof.ts`:

```typescript
import { verifyProof } from '@semaphore-protocol/proof'
import type { Env, Board, ZKAuthenticatedRequest, SemaphoreProof } from '../types'

export async function withZKProof(
  request: ZKAuthenticatedRequest,
  env: Env
): Promise<Response | void> {
  const proofHeader = request.headers.get('X-ZK-Proof')
  const boardId = request.headers.get('X-Board-ID')

  if (!proofHeader || !boardId) {
    return new Response(JSON.stringify({ error: 'ZK proof required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let proof: SemaphoreProof
  try {
    proof = JSON.parse(proofHeader)
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid proof format' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Get board's merkle root
  const board = await env.DB.prepare('SELECT * FROM boards WHERE id = ?')
    .bind(boardId).first<Board>()

  if (!board) {
    return new Response(JSON.stringify({ error: 'Board not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Verify proof matches board's merkle root
  if (proof.merkleTreeRoot !== board.merkle_root) {
    return new Response(JSON.stringify({ error: 'Merkle root mismatch' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Verify the ZK proof
  const isValid = await verifyProof(proof)

  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Invalid ZK proof' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  request.proof = proof
  request.boardId = boardId
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add ZK proof verification middleware"
```

---

### Task 7.7: Board Routes - Create and List

**Files:**
- Create: `api/src/routes/boards.ts`
- Modify: `api/src/index.ts`

**Step 1: Create boards routes**

Create `api/src/routes/boards.ts`:

```typescript
import { Router } from 'itty-router'
import { withSession } from '../middleware/session'
import { withZKProof } from '../middleware/zkproof'
import type { Env, AuthenticatedRequest, ZKAuthenticatedRequest, Board } from '../types'

const router = Router({ base: '/boards' })

function generateId(): string {
  return crypto.randomUUID()
}

// GET /boards - List user's boards (requires session)
router.get('/', withSession, async (request: AuthenticatedRequest, env: Env) => {
  const user = request.user!

  const { results } = await env.DB.prepare(`
    SELECT b.id, b.created_at, b.archived_at
    FROM boards b
    JOIN user_boards ub ON b.id = ub.board_id
    WHERE ub.user_id = ?
    ORDER BY ub.added_at DESC
  `).bind(user.id).all<{ id: string; created_at: number; archived_at: number | null }>()

  return new Response(JSON.stringify({ boards: results }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

// POST /boards - Create new board (requires session)
router.post('/', withSession, async (request: AuthenticatedRequest, env: Env) => {
  const user = request.user!
  const body = await request.json() as { merkleRoot: string; merkleTreeJson: string }

  if (!body.merkleRoot || !body.merkleTreeJson) {
    return new Response(JSON.stringify({ error: 'Merkle tree required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const boardId = generateId()
  const now = Date.now()

  // Create board
  await env.DB.prepare(`
    INSERT INTO boards (id, creator_id, merkle_root, merkle_tree_json, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(boardId, user.id, body.merkleRoot, body.merkleTreeJson, now).run()

  // Add to user's boards
  await env.DB.prepare(`
    INSERT INTO user_boards (user_id, board_id, added_at) VALUES (?, ?, ?)
  `).bind(user.id, boardId, now).run()

  return new Response(JSON.stringify({ id: boardId }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  })
})

// GET /boards/:id/tree - Get merkle tree (requires ZK proof)
router.get('/:id/tree', withZKProof, async (request: ZKAuthenticatedRequest, env: Env) => {
  const boardId = request.boardId!

  const board = await env.DB.prepare('SELECT merkle_tree_json FROM boards WHERE id = ?')
    .bind(boardId).first<{ merkle_tree_json: string }>()

  if (!board) {
    return new Response(JSON.stringify({ error: 'Board not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(board.merkle_tree_json, {
    headers: { 'Content-Type': 'application/json' },
  })
})

// PUT /boards/:id/tree - Update merkle tree (requires ZK proof)
router.put('/:id/tree', withZKProof, async (request: ZKAuthenticatedRequest, env: Env) => {
  const boardId = request.boardId!
  const body = await request.json() as { merkleRoot: string; merkleTreeJson: string }

  if (!body.merkleRoot || !body.merkleTreeJson) {
    return new Response(JSON.stringify({ error: 'Merkle tree required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  await env.DB.prepare(`
    UPDATE boards SET merkle_root = ?, merkle_tree_json = ? WHERE id = ?
  `).bind(body.merkleRoot, body.merkleTreeJson, boardId).run()

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

export { router as boardsRouter }
```

**Step 2: Update index.ts**

Replace `api/src/index.ts`:

```typescript
import { Router } from 'itty-router'
import { authRouter } from './routes/auth'
import { boardsRouter } from './routes/boards'
import type { Env } from './types'

const router = Router()

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-ZK-Proof, X-Board-ID',
}

// Handle preflight
router.options('*', () => {
  return new Response(null, { headers: corsHeaders })
})

// Health check
router.get('/health', () => {
  return new Response(JSON.stringify({ status: 'ok' }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
})

// Auth routes
router.all('/auth/*', authRouter.handle)

// Board routes
router.all('/boards/*', boardsRouter.handle)

// 404
router.all('*', () => {
  return new Response('Not Found', { status: 404, headers: corsHeaders })
})

export default {
  fetch: async (request: Request, env: Env) => {
    const response = await router.handle(request, env)
    // Add CORS headers to all responses
    const newHeaders = new Headers(response.headers)
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value)
    })
    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    })
  },
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add board CRUD routes"
```

---

### Task 7.8: R2 Board Data Routes

**Files:**
- Modify: `api/src/routes/boards.ts`

**Step 1: Add data routes to boards.ts**

Add to `api/src/routes/boards.ts` before the export:

```typescript
// GET /boards/:id/data - Get encrypted board data from R2 (requires ZK proof)
router.get('/:id/data', withZKProof, async (request: ZKAuthenticatedRequest, env: Env) => {
  const boardId = request.boardId!

  const object = await env.R2.get(`boards/${boardId}/data`)

  if (!object) {
    return new Response(JSON.stringify({ error: 'Board data not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'ETag': object.etag,
    },
  })
})

// PUT /boards/:id/data - Update encrypted board data in R2 (requires ZK proof)
router.put('/:id/data', withZKProof, async (request: ZKAuthenticatedRequest, env: Env) => {
  const boardId = request.boardId!
  const data = await request.arrayBuffer()

  await env.R2.put(`boards/${boardId}/data`, data, {
    customMetadata: {
      updatedAt: Date.now().toString(),
    },
  })

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add R2 board data routes"
```

---

### Task 7.9: Attachment Routes

**Files:**
- Create: `api/src/routes/attachments.ts`
- Modify: `api/src/index.ts`

**Step 1: Create attachments routes**

Create `api/src/routes/attachments.ts`:

```typescript
import { Router } from 'itty-router'
import { withZKProof } from '../middleware/zkproof'
import type { Env, ZKAuthenticatedRequest } from '../types'

const router = Router({ base: '/attachments' })

function generateId(): string {
  return crypto.randomUUID()
}

// POST /attachments/upload-url - Get presigned upload URL (requires ZK proof)
router.post('/upload-url', withZKProof, async (request: ZKAuthenticatedRequest, env: Env) => {
  const boardId = request.boardId!
  const body = await request.json() as { filename: string; contentType: string }

  if (!body.filename || !body.contentType) {
    return new Response(JSON.stringify({ error: 'Filename and content type required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const attachmentId = generateId()
  const key = `attachments/${boardId}/${attachmentId}`

  // R2 doesn't support presigned URLs directly in Workers
  // Instead, we return the key and client uploads through our endpoint
  return new Response(JSON.stringify({
    id: attachmentId,
    key,
    uploadUrl: `/attachments/${key}`,
  }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

// PUT /attachments/attachments/:boardId/:attachmentId - Upload attachment
router.put('/attachments/:boardId/:attachmentId', withZKProof, async (request: ZKAuthenticatedRequest, env: Env) => {
  const boardId = request.boardId!
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const attachmentId = pathParts[pathParts.length - 1]

  const key = `attachments/${boardId}/${attachmentId}`
  const data = await request.arrayBuffer()

  await env.R2.put(key, data, {
    customMetadata: {
      uploadedAt: Date.now().toString(),
    },
  })

  return new Response(JSON.stringify({ success: true, key }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

// GET /attachments/:key - Download attachment (requires ZK proof)
router.get('/:boardId/:attachmentId', withZKProof, async (request: ZKAuthenticatedRequest, env: Env) => {
  const boardId = request.boardId!
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const attachmentId = pathParts[pathParts.length - 1]

  const key = `attachments/${boardId}/${attachmentId}`
  const object = await env.R2.get(key)

  if (!object) {
    return new Response(JSON.stringify({ error: 'Attachment not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'ETag': object.etag,
    },
  })
})

// DELETE /attachments/:boardId/:attachmentId - Delete attachment (requires ZK proof)
router.delete('/:boardId/:attachmentId', withZKProof, async (request: ZKAuthenticatedRequest, env: Env) => {
  const boardId = request.boardId!
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const attachmentId = pathParts[pathParts.length - 1]

  const key = `attachments/${boardId}/${attachmentId}`
  await env.R2.delete(key)

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

export { router as attachmentsRouter }
```

**Step 2: Update index.ts**

Add to imports in `api/src/index.ts`:

```typescript
import { attachmentsRouter } from './routes/attachments'
```

Add route before 404:

```typescript
// Attachment routes
router.all('/attachments/*', attachmentsRouter.handle)
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add attachment upload/download routes"
```

---

### Task 7.10: Durable Object for WebSocket Sync

**Files:**
- Create: `api/src/durable-objects/BoardSync.ts`
- Modify: `api/src/index.ts`

**Step 1: Create BoardSync Durable Object**

Create `api/src/durable-objects/BoardSync.ts`:

```typescript
import type { Env } from '../types'

interface WebSocketSession {
  socket: WebSocket
  id: string
}

export class BoardSync {
  private state: DurableObjectState
  private env: Env
  private sessions: Map<string, WebSocketSession> = new Map()

  constructor(state: DurableObjectState, env: Env) {
    this.state = state
    this.env = env
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/websocket') {
      return this.handleWebSocket(request)
    }

    return new Response('Not Found', { status: 404 })
  }

  private async handleWebSocket(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade')
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 })
    }

    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)

    const sessionId = crypto.randomUUID()

    server.accept()

    this.sessions.set(sessionId, { socket: server, id: sessionId })

    server.addEventListener('message', (event) => {
      this.handleMessage(sessionId, event.data)
    })

    server.addEventListener('close', () => {
      this.sessions.delete(sessionId)
    })

    server.addEventListener('error', () => {
      this.sessions.delete(sessionId)
    })

    return new Response(null, {
      status: 101,
      webSocket: client,
    })
  }

  private handleMessage(senderId: string, data: string | ArrayBuffer) {
    // Broadcast to all other connected clients
    for (const [id, session] of this.sessions) {
      if (id !== senderId) {
        try {
          session.socket.send(data)
        } catch {
          // Client disconnected, clean up
          this.sessions.delete(id)
        }
      }
    }
  }
}
```

**Step 2: Update index.ts to export Durable Object and add sync route**

Replace `api/src/index.ts`:

```typescript
import { Router } from 'itty-router'
import { authRouter } from './routes/auth'
import { boardsRouter } from './routes/boards'
import { attachmentsRouter } from './routes/attachments'
import type { Env } from './types'

// Re-export Durable Object
export { BoardSync } from './durable-objects/BoardSync'

const router = Router()

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-ZK-Proof, X-Board-ID',
}

// Handle preflight
router.options('*', () => {
  return new Response(null, { headers: corsHeaders })
})

// Health check
router.get('/health', () => {
  return new Response(JSON.stringify({ status: 'ok' }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
})

// Auth routes
router.all('/auth/*', authRouter.handle)

// Board routes
router.all('/boards/*', boardsRouter.handle)

// Attachment routes
router.all('/attachments/*', attachmentsRouter.handle)

// WebSocket sync route
router.get('/sync/:boardId', async (request: Request, env: Env) => {
  const url = new URL(request.url)
  const boardId = url.pathname.split('/').pop()

  if (!boardId) {
    return new Response('Board ID required', { status: 400 })
  }

  // Get Durable Object for this board
  const id = env.BOARD_SYNC.idFromName(boardId)
  const stub = env.BOARD_SYNC.get(id)

  // Forward request to Durable Object
  const doUrl = new URL(request.url)
  doUrl.pathname = '/websocket'

  return stub.fetch(new Request(doUrl.toString(), request))
})

// 404
router.all('*', () => {
  return new Response('Not Found', { status: 404, headers: corsHeaders })
})

export default {
  fetch: async (request: Request, env: Env) => {
    const response = await router.handle(request, env)
    // Add CORS headers to all responses (except WebSocket upgrades)
    if (response.status !== 101) {
      const newHeaders = new Headers(response.headers)
      Object.entries(corsHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value)
      })
      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      })
    }
    return response
  },
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add BoardSync Durable Object for WebSocket real-time sync"
```

---

### Task 7.11: Add Board to User's List Route

**Files:**
- Modify: `api/src/routes/boards.ts`

**Step 1: Add route to join board**

Add to `api/src/routes/boards.ts` before the export:

```typescript
// POST /boards/:id/join - Add board to user's list (requires session)
// Used after accepting an invite
router.post('/:id/join', withSession, async (request: AuthenticatedRequest, env: Env) => {
  const user = request.user!
  const boardId = request.params?.id

  if (!boardId) {
    return new Response(JSON.stringify({ error: 'Board ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Check board exists
  const board = await env.DB.prepare('SELECT id FROM boards WHERE id = ?')
    .bind(boardId).first()

  if (!board) {
    return new Response(JSON.stringify({ error: 'Board not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Add to user's boards (ignore if already exists)
  await env.DB.prepare(`
    INSERT OR IGNORE INTO user_boards (user_id, board_id, added_at) VALUES (?, ?, ?)
  `).bind(user.id, boardId, Date.now()).run()

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add route to join board after invite"
```

---

## Summary

**Phase 7 Tasks:**
1. Task 7.1: Initialize Workers project
2. Task 7.2: Create D1 schema
3. Task 7.3: Create type definitions
4. Task 7.4: Auth routes (magic link)
5. Task 7.5: Session middleware
6. Task 7.6: ZK proof middleware
7. Task 7.7: Board routes (CRUD)
8. Task 7.8: R2 board data routes
9. Task 7.9: Attachment routes
10. Task 7.10: Durable Object for WebSocket sync
11. Task 7.11: Join board route

**Total:** 11 tasks

**Next:** Phase 8 (Integration) - Wire extension to backend, end-to-end flows
