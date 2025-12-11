# ADR-006: Decoupled Identity Architecture for True Membership Anonymity

## Status

Accepted

## Context

The current architecture links email addresses to board membership via the `user_boards` table and `boards.creator_id`. This means the server knows exactly which boards each user belongs to — violating the "Chatham House" promise.

**Current privacy leak:**
```sql
user_boards (user_id, board_id)  -- Server knows alice@... is in board_xyz
boards (creator_id)              -- Server knows alice@... created board_xyz
```

**Goal:** Server should know:
- That alice@... exists and pays for Pro
- That board_xyz exists
- **NOT** that alice@... has anything to do with board_xyz

## Decision

Separate the system into two unlinkable domains:

```
┌─────────────────────────────────────────────────────────────────┐
│                       EMAIL DOMAIN                               │
│  (billing, tier, storage quota pool)                            │
│                                                                  │
│  users: { email, tier, funded_commitment_count }                │
│  sessions: { user_id }                                          │
│                                                                  │
│  Server knows: alice@... is Pro, has funded 1 commitment        │
└─────────────────────────────────────────────────────────────────┘

              ║  NO LINK  ║  (only client knows both)
              ╚═══════════╝

┌─────────────────────────────────────────────────────────────────┐
│                    COMMITMENT DOMAIN                             │
│  (boards, membership, activity)                                  │
│                                                                  │
│  boards: { id, creator_commitment, tier, merkle_root }          │
│  commitment_quotas: { commitment, board_count, storage_limit }  │
│  commitment_data: { commitment, encrypted_blob }                │
│                                                                  │
│  Server knows: commitment 0x1a2b owns 3 boards, has 10GB quota  │
│  Server CANNOT know: whose commitment that is                    │
└─────────────────────────────────────────────────────────────────┘
```

The client holds the only link between domains (seed → identity → commitment).

## Schema

### Tables to Remove

```sql
DROP TABLE user_boards;  -- Links email to boards (privacy leak)
```

### Users Table (Billing Only)

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free',      -- 'free', 'pro', 'enterprise'
  tier_expires_at INTEGER,                 -- NULL for free
  funded_commitment_count INTEGER NOT NULL DEFAULT 0,  -- How many funded (not which)
  created_at INTEGER NOT NULL
);
```

### Boards Table (Commitment-Based)

```sql
CREATE TABLE boards (
  id TEXT PRIMARY KEY,
  creator_commitment TEXT NOT NULL,        -- ZK commitment, NOT user ID
  tier TEXT NOT NULL DEFAULT 'free',       -- Board's tier (upgradeable)
  merkle_root TEXT NOT NULL,
  merkle_tree_json TEXT NOT NULL,
  member_count INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_boards_creator_commitment ON boards(creator_commitment);
```

### Commitment Quotas (Limit Enforcement)

```sql
CREATE TABLE commitment_quotas (
  commitment TEXT PRIMARY KEY,
  board_count INTEGER NOT NULL DEFAULT 0,
  storage_bytes INTEGER NOT NULL DEFAULT 0,
  storage_limit INTEGER NOT NULL,          -- Quota granted during funding
  funded_at INTEGER NOT NULL,
  expires_at INTEGER                       -- NULL for free (never expires)
);
```

### Commitment Data (Encrypted Board List)

```sql
CREATE TABLE commitment_data (
  commitment TEXT PRIMARY KEY,
  encrypted_blob BLOB NOT NULL,            -- Encrypted board list + metadata
  updated_at INTEGER NOT NULL
);
```

## Funding Flow

The one-time operation that grants quota to a commitment without permanently linking it to email.

```
POST /commitment/fund
Authorization: Bearer <session_token>
Body: { commitment, zkProof }
```

### Flow

```
Client                    Server                    D1
  │                         │                        │
  │ POST /fund              │                        │
  │ + session token         │                        │
  │ + commitment            │                        │
  │ + ZK proof of ownership │                        │
  │────────────────────────▶│                        │
  │                         │                        │
  │                         │ 1. Validate session    │
  │                         │───────────────────────▶│
  │                         │                        │
  │                         │ 2. Check tier limits:  │
  │                         │    Free: funded_commitment_count must be 0
  │                         │    Pro: unlimited      │
  │                         │                        │
  │                         │ 3. Insert commitment_quotas
  │                         │    (commitment, limit) │
  │                         │───────────────────────▶│
  │                         │                        │
  │                         │ 4. Increment user.funded_commitment_count
  │                         │    (but NOT store which commitment)
  │                         │───────────────────────▶│
  │                         │                        │
  │◀────────────────────────│                        │
  │ { success: true }       │                        │
```

### Key Privacy Property

Server records two separate facts:
1. "User alice@... has funded 1 commitment" (in `users` table)
2. "Commitment 0x1a2b has 100MB quota" (in `commitment_quotas` table)

**No record links these two facts.** Only timing correlation could reveal it.

### Tier Limits

| Tier | Commitments | Storage per Commitment | Board Limit | Expiry |
|------|-------------|------------------------|-------------|--------|
| Free | 1 | 100MB | 3 boards | Never |
| Pro | Unlimited | 10GB | Unlimited | With subscription |

## Board Operations

All board operations use ZK proofs — no session auth, no email involvement.

### Create Board

```
POST /boards
Headers: X-ZK-Proof: <proof>
Body: { boardId, creatorCommitment, merkleTree }
```

Server checks:
1. Verify ZK proof (proves ownership of `creatorCommitment`)
2. Check `commitment_quotas` exists for this commitment
3. Check `board_count < limit` based on commitment's funded tier
4. Insert board with `creator_commitment`, inherit tier from commitment quota
5. Increment `commitment_quotas.board_count`

### Access Board Data

```
GET /boards/:id/data
Headers: X-ZK-Proof: <proof>
```

Server checks:
1. Verify ZK proof against board's `merkle_root`
2. Return encrypted blob from R2

### Upgrade Board (Auto-Migration)

```
POST /boards/:id/upgrade
Headers: X-ZK-Proof: <proof>
```

Server checks:
1. Verify ZK proof proves ownership of `board.creator_commitment`
2. Check `commitment_quotas` for creator_commitment has Pro-level quota
3. Update `board.tier = 'pro'`

When a user upgrades to Pro and funds their commitment with Pro quota, the client automatically calls this endpoint for each owned board.

### API Auth Summary

| Endpoint | Auth Method | Email Involved? |
|----------|-------------|-----------------|
| `POST /auth/*` | Magic link | Yes |
| `POST /commitment/fund` | Session token | Yes (one-time) |
| `POST /boards` | ZK proof | No |
| `GET /boards/:id/*` | ZK proof | No |
| `PUT /boards/:id/*` | ZK proof | No |
| `POST /boards/:id/upgrade` | ZK proof | No |
| `GET /commitment/data` | ZK proof | No |
| `PUT /commitment/data` | ZK proof | No |

## Client-Side Changes

### Board List Management

Client manages its own encrypted board index stored in `commitment_data`.

```typescript
// Derive board list encryption key from seed
const boardListKey = await hkdf(seed, 'chatham-board-list')

// Board list structure (encrypted in R2)
interface BoardIndex {
  boards: Array<{
    id: string
    name: string           // Plaintext here, encrypted on server
    boardKey: string       // Wrapped board encryption key
    role: 'owner' | 'member'
    addedAt: number
  }>
  updatedAt: number
}

// Sync board list
async function syncBoardList(): Promise<BoardIndex> {
  const blob = await api.getCommitmentData(commitment, zkProof)
  const decrypted = await decrypt(boardListKey, blob)
  return JSON.parse(decrypted)
}

// Save board list
async function saveBoardList(index: BoardIndex): Promise<void> {
  const encrypted = await encrypt(boardListKey, JSON.stringify(index))
  await api.putCommitmentData(commitment, zkProof, encrypted)
}
```

### New Device Flow

```
1. User enters 24-word recovery phrase
2. Derive seed → commitment → boardListKey
3. Fetch encrypted board list from server (ZK proof auth)
4. Decrypt → now have all board IDs and keys
5. Ready to use
```

### Signup + Funding Flow

```
1. User signs up with email → gets session
2. User generates recovery phrase → derives commitment
3. Client calls POST /commitment/fund with session + commitment
4. Server grants quota to commitment (no permanent link stored)
5. From now on: all board ops use ZK proof, never session
```

## Consequences

### Positive

- **True Chatham House privacy**: Server cannot link email to boards
- **Monetization preserved**: Tier enforcement via commitment quotas
- **Abuse prevention**: One commitment per free account
- **Auto-upgrade path**: Pro users can upgrade boards via ZK proof
- **Simpler schema**: No `user_boards` table, cleaner separation
- **Court-order resistant**: Server cannot enumerate user's boards

### Negative

- **Timing correlation**: Server could theoretically correlate funding events by timestamp/amount (acceptable risk)
- **No server-side board list**: Client must sync encrypted index
- **Recovery phrase critical**: Lose phrase = lose board access AND board list
- **One-time funding moment**: The only correlation risk point

### Privacy Comparison

| Aspect | Before (Current) | After (This ADR) |
|--------|------------------|------------------|
| Server knows membership | Yes (`user_boards`) | No |
| Server knows creator | Yes (`creator_id`) | No (only commitment) |
| Board list | Server-side | Client-encrypted blob |
| Tier enforcement | By `user_id` | By `commitment` |
| Subpoena response | Full board list | "We don't know" |

## Security Considerations

### Timing Correlation Attack

An adversary with database access could correlate:
- "alice@... funded a commitment at 14:32:05"
- "Commitment 0x1a2b was created at 14:32:05"

**Mitigation**: Acceptable for MVP. Future improvement: blind funding tokens.

### Commitment Enumeration

Server can enumerate all commitments and their board counts, but cannot link to emails.

### Recovery Phrase Loss

More critical than before — phrase is now the ONLY way to access boards. No "I forgot my password" fallback.

**Mitigation**: Clear UX messaging, optional encrypted cloud backup (future).

## References

- [ADR-001: E2EE with BIP39](001-e2ee-recovery-phrase.md)
- [ADR-002: Semaphore ZK Proofs](002-semaphore-zk-proofs.md)
- [Chatham House Rule](https://www.chathamhouse.org/about-us/chatham-house-rule)
