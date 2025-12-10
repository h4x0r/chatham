# ZKKB Design

Zero-Knowledge Kanban Board - End-to-end encrypted kanban board with zero-knowledge membership proofs.

## Summary

A Chrome extension kanban board where:
- Server cannot read board content (E2EE)
- Server cannot identify who accesses boards (Semaphore ZK proofs)
- Real-time collaboration via Automerge CRDT
- No passwords, recovery via 24-word phrase

## Technology Stack

| Layer | Choice |
|-------|--------|
| Platform | Chrome extension (side panel) |
| Frontend | Preact + Tailwind CSS |
| Build | Vite |
| CRDT | Automerge |
| Backend | Cloudflare Workers |
| Database | Cloudflare D1 |
| Blob storage | Cloudflare R2 |
| Real-time | Cloudflare Durable Objects (WebSocket) |
| ZK proofs | Semaphore Protocol |

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Chrome Extension                            │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────────────┐  │
│  │  Preact   │  │ Automerge │  │ IndexedDB │  │ Web Crypto  │  │
│  │ +Tailwind │  │  (CRDT)   │  │  (cache)  │  │   (E2EE)    │  │
│  └───────────┘  └───────────┘  └───────────┘  └─────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 Semaphore (ZK proofs)                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ WebSocket (encrypted payloads + ZK proofs)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Cloudflare Edge                               │
│  ┌─────────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Workers (API)   │  │   Durable   │  │  D1 (metadata)      │ │
│  │ - Auth          │  │   Objects   │  │  - users (email)    │ │
│  │ - ZK verify     │  │ (WebSocket  │  │  - merkle trees     │ │
│  │ - Blob access   │  │  per board) │  │  (commitments only) │ │
│  └─────────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                R2 (encrypted blobs)                         ││
│  │                - board data                                 ││
│  │                - attachments                                ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Data Model

### Server-side (D1)

**users**
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL
);
```

**boards**
```sql
CREATE TABLE boards (
  id TEXT PRIMARY KEY,
  merkle_root TEXT NOT NULL,
  merkle_tree_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  archived_at INTEGER
);
```

**magic_links**
```sql
CREATE TABLE magic_links (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used INTEGER DEFAULT 0
);
```

Note: No `board_members` table. Membership is the Merkle tree of commitments. Server cannot link commitments to users.

### Client-side (encrypted board content)

```typescript
interface BoardContent {
  name: string;

  members: {
    [commitment: string]: {
      displayName: string;
      publicKey: ArrayBuffer;      // X25519 for key wrapping
      wrappedBoardKey: ArrayBuffer;
      color: string;
      joinedAt: number;
    };
  };

  columns: Column[];
  cards: { [id: string]: Card };
}

interface Column {
  id: string;
  title: string;
  position: string;  // Fractional indexing
}

interface Card {
  id: string;
  columnId: string;
  position: string;
  title: string;
  description: string;
  labels: string[];
  dueDate: number | null;
  assignee: string | null;  // Commitment, resolved to name client-side
  checklist: ChecklistItem[];
  attachments: Attachment[];
  comments: Comment[];
  createdAt: number;
  updatedAt: number;
}

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

interface Attachment {
  id: string;
  name: string;
  r2Key: string;
  size: number;
  encryptionKey: ArrayBuffer;  // Per-attachment key
}

interface Comment {
  id: string;
  author: string;  // Commitment
  text: string;
  createdAt: number;
}
```

## Key Management

### Key Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│  24-word Recovery Phrase (BIP39)                        │
│  - Shown once at signup                                 │
│  - User's responsibility to save                        │
└──────────────────────┬──────────────────────────────────┘
                       │ derives
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Semaphore Identity                                     │
│  - Trapdoor + nullifier (private, in IndexedDB)         │
│  - Commitment (public, in Merkle trees)                 │
│  - Used for: ZK membership proofs                       │
└─────────────────────────────────────────────────────────┘
                       │ derives
                       ▼
┌─────────────────────────────────────────────────────────┐
│  User Keypair (X25519)                                  │
│  - Private key (in IndexedDB)                           │
│  - Public key (in encrypted board content)              │
│  - Used for: Board Key wrapping                         │
└─────────────────────────────────────────────────────────┘
                       │ unwraps
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Board Key (AES-256-GCM, random per board)              │
│  - Encrypts all board content                           │
│  - Wrapped separately for each member                   │
│  - Stored inside encrypted board content                │
└─────────────────────────────────────────────────────────┘
```

### Crypto Primitives

| Purpose | Algorithm |
|---------|-----------|
| Recovery phrase | BIP39 (24 words = 256 bits entropy) |
| Semaphore identity | Derived from phrase |
| User keypair | X25519 (key exchange) |
| Board encryption | AES-256-GCM |
| Key wrapping | X25519 ECDH + HKDF + AES-256-GCM |
| Attachment encryption | AES-256-GCM (per-attachment key) |

## Authentication Flow

### Signup

```
1. User enters email
2. Server sends magic link (6-digit code)
3. User verifies code
4. Extension generates 24-word phrase
5. Derive: Semaphore identity + X25519 keypair
6. Show phrase: "Save this. Only way to recover."
7. Store identity + keypair in IndexedDB
8. Server stores email only (no keys)
```

### Board Access

```
1. User opens board
2. Extension fetches Merkle tree from D1
3. Generate ZK proof: "I'm in this tree"
4. Send proof to server (no JWT, no user ID)
5. Server verifies proof via Semaphore
6. Server returns encrypted blob from R2
7. Decrypt locally with Board Key
8. Render board
```

### New Device Recovery

```
1. User enters 24-word phrase
2. Derive Semaphore identity + X25519 keypair
3. Commitment matches Merkle trees
4. Can generate valid proofs
5. Access restored
```

## Invite Flow (Out-of-band)

```
┌─────────────────────────────────────────────────────────┐
│  Alice (admin)                                          │
│                                                         │
│  1. Click "Invite"                                      │
│  2. Extension generates invite payload:                 │
│     - boardId                                           │
│     - boardKey (encrypted with invite secret)           │
│     - inviteSecret (random, shown once)                 │
│  3. Encode as URL: zkkb://invite?data=<base64>          │
│  4. Show: "Send this link to your teammate"             │
└─────────────────────────────────────────────────────────┘
                         │
                         │ Alice sends via Slack/Signal/email
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Bob (invitee)                                          │
│                                                         │
│  1. Opens link in extension                             │
│  2. Prompts: "Join board? Enter display name:"          │
│  3. Decrypt Board Key with invite secret                │
│  4. Re-wrap Board Key for Bob's public key              │
│  5. Add Bob's commitment + profile to board content     │
│  6. Update Merkle tree on D1                            │
│  7. Sync encrypted blob to R2                           │
└─────────────────────────────────────────────────────────┘
```

Server sees: new commitment in Merkle tree, updated blob.
Server doesn't see: who Bob is, that Alice invited him.

## Real-time Sync

### Architecture

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Alice   │     │   Bob    │     │  Carol   │
└────┬─────┘     └────┬─────┘     └────┬─────┘
     │ WebSocket      │ WebSocket      │ WebSocket
     └────────────────┼────────────────┘
                      ▼
            ┌─────────────────┐
            │ Durable Object  │
            │ (board_xxx)     │
            │                 │
            │ - connections[] │
            │ - broadcast()   │
            │ - persist to R2 │
            └─────────────────┘
```

### Flow

1. Client connects with valid ZK proof
2. Local edit → Automerge sync message → encrypt → send
3. Durable Object broadcasts to other connections
4. Recipients decrypt → Automerge merge → UI update
5. Durable Object persists to R2 (debounced)

### Offline Support

- Edits saved to IndexedDB
- On reconnect: send pending Automerge sync messages
- Automerge handles merge automatically

## Attachment Handling

### Upload

```
1. User drops file onto card
2. Generate random attachment key (AES-256)
3. Encrypt file with attachment key
4. Request presigned upload URL from Worker
5. Upload encrypted blob to R2
6. Store in card: { id, name, r2Key, size, encryptionKey }
```

### Download

```
1. User clicks attachment
2. Check IndexedDB cache (LRU, max 100MB)
3. If cached → decrypt, display
4. If not → fetch presigned URL, download, decrypt
5. Display to user
6. Cache in IndexedDB, evict if over limit
```

## Extension Structure

```
zkkb/
├── src/
│   ├── background/
│   │   └── service-worker.ts
│   ├── sidepanel/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Board.tsx
│   │   │   ├── Column.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── CardModal.tsx
│   │   │   ├── BoardList.tsx
│   │   │   └── Settings.tsx
│   │   └── styles.css
│   ├── lib/
│   │   ├── automerge.ts
│   │   ├── crypto.ts
│   │   ├── semaphore.ts
│   │   ├── sync.ts
│   │   ├── storage.ts
│   │   └── api.ts
│   └── types/
│       └── index.ts
├── public/
│   └── icons/
├── manifest.json
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

## Backend Structure

```
zkkb-api/
├── src/
│   ├── index.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── boards.ts
│   │   ├── attachments.ts
│   │   └── sync.ts
│   ├── durable-objects/
│   │   └── BoardSync.ts
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── semaphore.ts
│   │   ├── email.ts
│   │   └── db.ts
│   └── types.ts
├── schema.sql
├── wrangler.toml
└── package.json
```

## API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | /auth/send-code | None | Send magic link |
| POST | /auth/verify | None | Verify code, return session |
| GET | /boards | Session | List boards (IDs only) |
| POST | /boards | Session | Create board |
| GET | /boards/:id/tree | ZK proof | Get Merkle tree |
| GET | /boards/:id/data | ZK proof | Get encrypted blob |
| PUT | /boards/:id/data | ZK proof | Update encrypted blob |
| PUT | /boards/:id/tree | ZK proof | Update Merkle tree |
| GET | /boards/:id/sync | ZK proof | WebSocket upgrade |
| POST | /attachments/upload-url | ZK proof | Get presigned upload URL |
| GET | /attachments/:key | ZK proof | Get presigned download URL |

## Security Model

### What's Protected

| Data | Protection |
|------|------------|
| Board content | AES-256-GCM encryption |
| Member identities | ZK proofs (server sees commitments only) |
| Who accesses what | ZK proofs (unlinkable) |
| Attachments | Per-file AES-256-GCM |

### What Server Sees

- Email addresses (signup only)
- Board IDs
- Merkle trees (commitments, not identities)
- Encrypted blobs (ciphertext)
- Access timestamps (but not who)

### What Server Cannot See

- Board names or content
- Card data
- Who is in which board
- Which user is accessing
- Attachment contents

### Threat Mitigations

| Threat | Mitigation |
|--------|------------|
| Server compromise | Only encrypted blobs + commitments |
| MITM | HTTPS/WSS everywhere |
| Stolen device | Keys in IndexedDB, browser profile password |
| Lost phrase | No recovery (by design) |
| Malicious member | Remove → re-key board |
| Replay attacks | Automerge vector clocks |
| Brute force magic link | 6-digit + 5min expiry + rate limit |
| XSS | Preact escaping, CSP |

## Dependencies

### Extension

- preact
- @preact/signals
- tailwindcss
- automerge
- @semaphore-protocol/identity
- @semaphore-protocol/proof
- @semaphore-protocol/group
- idb (IndexedDB wrapper)
- bip39 (recovery phrase)

### Backend

- @cloudflare/workers-types
- @semaphore-protocol/proof (verification)
- itty-router

## Cost Estimate

| Service | Free Tier | Expected Cost |
|---------|-----------|---------------|
| Workers | 100K req/day | $0 |
| D1 | 5GB, 5M reads/day | $0 |
| R2 | 10GB, 10M reads/mo | $0 |
| Durable Objects | None | ~$5/mo minimum |
| **Total** | | **~$5/mo** |

## Future Considerations

- Mobile app (React Native, shared crypto lib)
- Browser extension for Firefox
- Export/backup encrypted archives
- Audit log (append-only, encrypted)
- File versioning for attachments
