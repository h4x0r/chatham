# ADR-002: Semaphore ZK Proofs for Anonymous Access

## Status

Accepted

## Context

ZKKB needs to verify that a user is a member of a board without revealing which user they are. This prevents the server from:
- Tracking which user accesses which board
- Building activity profiles
- Linking board membership to email addresses

Traditional approaches don't provide this:

| Approach | Server Knows |
|----------|--------------|
| JWT tokens | Exact user identity |
| API keys | Which key accessed what |
| Session cookies | User + timestamps |
| IP tracking | Location + patterns |

We need **anonymous authentication**: prove membership without identification.

## Decision

We will use **Semaphore Protocol** for zero-knowledge membership proofs.

```mermaid
flowchart TB
    subgraph Setup["Setup (One-time)"]
        seed[User Seed]
        identity[Semaphore Identity]
        commitment[Public Commitment]
        tree[Merkle Tree]
    end

    subgraph Access["Board Access (Each Request)"]
        proof[ZK Proof]
        verify[Server Verifies]
        access[Grant Access]
    end

    seed -->|Derive| identity
    identity -->|Hash| commitment
    commitment -->|Add to| tree

    identity -->|Generate| proof
    tree -->|Merkle Root| proof
    proof --> verify
    verify -->|Valid| access
```

### How Semaphore Works

1. **Identity**: User has trapdoor + nullifier (private), commitment (public)
2. **Group**: Merkle tree of all member commitments
3. **Proof**: ZK proof that "I know a secret whose commitment is in this tree"
4. **Verification**: Server checks proof against Merkle root, never sees identity

### Data Structures

```typescript
// Server stores (D1)
interface Board {
  id: string;
  merkle_root: string;       // Current tree root
  merkle_tree_json: string;  // Full tree for proof generation
}

// Client generates
interface AccessProof {
  merkleTreeRoot: bigint;
  nullifierHash: bigint;
  signal: string;
  proof: Proof;
}
```

### Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant D as D1 Database

    C->>S: GET /boards/:id/tree
    S->>D: Fetch Merkle tree
    D->>S: Tree JSON
    S->>C: Tree data

    C->>C: Generate ZK proof<br/>"I'm in this tree"

    C->>S: GET /boards/:id/data<br/>+ ZK Proof in header

    S->>S: Verify proof<br/>against Merkle root

    alt Valid Proof
        S->>C: Encrypted board data
    else Invalid Proof
        S->>C: 403 Forbidden
    end
```

### Nullifier Strategy

Each proof includes a nullifier hash to prevent replay attacks:
- Nullifier = `hash(identity.nullifier, scope)`
- Scope = `board_${boardId}_${action}`
- Server can reject duplicate nullifiers within time window

## Consequences

### Positive

- **True anonymity**: Server cannot link access to identity
- **Efficient verification**: ~10ms server-side
- **Standard protocol**: Audited cryptography
- **Scalable**: O(log n) proof size regardless of group size

### Negative

- **Proof generation time**: 2-5 seconds on client (WASM)
- **Bundle size**: ~2MB for Semaphore WASM
- **Complexity**: ZK concepts unfamiliar to most developers
- **No revocation linking**: Can't easily audit "who accessed what"

### Tradeoffs

```mermaid
quadrantChart
    title Privacy vs Operational Needs
    x-axis Low Privacy --> High Privacy
    y-axis Low Ops Visibility --> High Ops Visibility

    quadrant-1 Impossible Zone
    quadrant-2 ZKKB Position
    quadrant-3 Traditional Auth
    quadrant-4 Pseudonymous

    JWT Auth: [0.2, 0.9]
    API Keys: [0.3, 0.85]
    Semaphore: [0.95, 0.2]
    Pseudonymous IDs: [0.6, 0.5]
```

### Mitigations

1. **Proof caching**: Cache proof for 5 minutes to reduce generation overhead
2. **Lazy loading**: Load Semaphore WASM only when needed
3. **Progress UI**: Show "Generating secure proof..." during wait
4. **Fallback**: Graceful degradation if proof fails

## Implementation Details

### Semaphore Version

Using Semaphore v4:
- Groth16 proofs
- Poseidon hash for Merkle tree
- 20-level tree depth (1M members max)

### Key Derivation

```typescript
import { Identity } from '@semaphore-protocol/identity'
import { hkdf } from '@noble/hashes/hkdf'
import { sha256 } from '@noble/hashes/sha256'

function identityFromSeed(seed: Uint8Array): Identity {
  const secret = hkdf(sha256, seed.slice(0, 32), undefined, 'semaphore-identity', 32)
  return new Identity(secret)
}
```

### Proof Generation

```typescript
import { generateProof } from '@semaphore-protocol/proof'

const proof = await generateProof(
  identity,
  group,
  message,    // e.g., "read"
  scope       // e.g., "board_abc123"
)
```

### Server Verification

```typescript
import { verifyProof } from '@semaphore-protocol/proof'

async function verifyAccess(proof: SemaphoreProof, expectedRoot: bigint) {
  if (proof.merkleTreeRoot !== expectedRoot) {
    return false
  }
  return verifyProof(proof)
}
```

## Alternatives Considered

### Ring Signatures

Rejected because:
- Proof size grows with group size
- Less mature tooling
- No nullifier mechanism

### Trusted Execution Environments (TEE)

Rejected because:
- Requires specific hardware
- Trust in TEE manufacturer
- Complex deployment

### Homomorphic Encryption

Rejected because:
- Extremely slow
- Overkill for membership proofs
- Immature browser support

## References

- [Semaphore Protocol](https://semaphore.pse.dev/)
- [Semaphore v4 Docs](https://docs.semaphore.pse.dev/)
- [Privacy & Scaling Explorations](https://pse.dev/)
- [Groth16 Paper](https://eprint.iacr.org/2016/260)
