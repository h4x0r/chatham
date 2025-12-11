<p align="center">
  <img src="https://img.shields.io/badge/E2E_Encrypted-AES--256--GCM-blue?style=for-the-badge" alt="E2E Encrypted" />
  <img src="https://img.shields.io/badge/Zero_Knowledge-Semaphore-purple?style=for-the-badge" alt="Zero Knowledge" />
  <img src="https://img.shields.io/badge/Real--time-Automerge_CRDT-green?style=for-the-badge" alt="Real-time" />
</p>

<h1 align="center">ZKKB</h1>
<h3 align="center">Zero-Knowledge Kanban Board</h3>

<p align="center">
  <strong>The kanban board where not even we can see your data.</strong><br/>
  End-to-end encrypted. Anonymous collaboration. Real-time sync.
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-features">Features</a> •
  <a href="#-how-it-works">How It Works</a> •
  <a href="#️-privacy-model-who-sees-what">Privacy Model</a> •
  <a href="#-pricing">Pricing</a>
</p>

---

## The Problem

Traditional project management tools have full access to your data. Every card title, every comment, every file—visible to the vendor, vulnerable to breaches, subpoenable by courts.

**Your competitive strategy shouldn't live on someone else's server in plaintext.**

## The Solution

ZKKB uses military-grade encryption where **the server only sees encrypted blobs**. When syncing changes, team members prove they belong using zero-knowledge proofs—the server knows *you're a member* but can't see *which edits are yours*.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        WHAT THE SERVER SEES                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Server knows:                                                     │
│   ✓ alice@company.com is a member of board xyz                      │
│                                                                     │
│   Server cannot see:                                                │
│   ❌ "Launch Q4 campaign"          →   ✓ 0x8f3a...encrypted...4b2c │
│   ❌ "Budget: $50,000"             →   ✓ [encrypted blob]           │
│   ❌ File: strategy.pdf            →   ✓ [encrypted R2 object]      │
│   ❌ "Alice edited card #3"        →   ✓ ZK proof (valid member)    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔐 True End-to-End Encryption
Every card, comment, and attachment encrypted with **AES-256-GCM** before leaving your browser. Keys derived from your recovery phrase never touch our servers.

</td>
<td width="50%">

### 👻 Anonymous Collaboration
**Semaphore zero-knowledge proofs** let team members prove they belong without revealing *who* they are. No tracking. No surveillance.

</td>
</tr>
<tr>
<td width="50%">

### ⚡ Real-time Sync
**Automerge CRDTs** enable conflict-free collaboration. Work offline, sync when connected. No merge conflicts ever.

</td>
<td width="50%">

### 🔑 Your Keys, Your Data
**24-word recovery phrase** means you control your data. Export anytime. No vendor lock-in. We can't help you if you lose it—by design.

</td>
</tr>
</table>

---

## 🎯 How It Works

### The Security Model

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            YOUR DEVICE                                    │
│                                                                          │
│    ┌────────────┐     ┌─────────────┐     ┌─────────────────────┐       │
│    │  Recovery  │────▶│   Derive    │────▶│   Identity Keys     │       │
│    │   Phrase   │     │    Seed     │     │   (X25519 + ZK)     │       │
│    │            │     │             │     │                     │       │
│    │ 24 words   │     │ PBKDF2      │     │ publicKey           │       │
│    │ (BIP-39)   │     │ 100k iter   │     │ privateKey          │       │
│    └────────────┘     └─────────────┘     │ zkIdentity          │       │
│                                           └─────────────────────┘       │
│                                                      │                   │
│                                                      ▼                   │
│    ┌─────────────────────────────────────────────────────────────┐      │
│    │                     BOARD ENCRYPTION                         │      │
│    │                                                              │      │
│    │   Your Data ──▶ AES-256-GCM ──▶ Encrypted Blob ──────────────┼──┐   │
│    │                    │                                         │  │   │
│    │               Board Key                                      │  │   │
│    │              (wrapped)                                       │  │   │
│    └─────────────────────────────────────────────────────────────┘  │   │
│                                                                      │   │
└──────────────────────────────────────────────────────────────────────┼───┘
                                                                       │
        ═══════════════════════════════════════════════════════════════╪═══
                              INTERNET (encrypted)                      │
        ═══════════════════════════════════════════════════════════════╪═══
                                                                       │
┌──────────────────────────────────────────────────────────────────────┼───┐
│                          CLOUDFLARE EDGE                             ▼   │
│                                                                          │
│    ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐     │
│    │     D1       │    │      R2      │    │   Durable Objects    │     │
│    │  (Metadata)  │    │   (Blobs)    │    │   (WebSocket Sync)   │     │
│    │              │    │              │    │                      │     │
│    │ • user IDs   │    │ • encrypted  │    │ • broadcast sync     │     │
│    │ • board IDs  │    │   board data │    │ • presence tracking  │     │
│    │ • merkle     │    │ • encrypted  │    │ • connection mgmt    │     │
│    │   roots      │    │   files      │    │                      │     │
│    └──────────────┘    └──────────────┘    └──────────────────────┘     │
│                                                                          │
│    Server sees: encrypted blobs, ZK proofs, merkle roots                 │
│    Server CANNOT see: card content, member names, file contents          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Zero-Knowledge Authentication

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PROVING MEMBERSHIP WITHOUT IDENTITY                   │
│                                                                         │
│    Traditional Auth:                                                    │
│    ┌─────────────┐                      ┌─────────────┐                 │
│    │   Client    │ ───"I am Alice"───▶  │   Server    │                 │
│    │             │ ◀───"Welcome"─────   │  (knows you) │                 │
│    └─────────────┘                      └─────────────┘                 │
│                                                                         │
│    ZKKB (Zero-Knowledge):                                               │
│    ┌─────────────┐                      ┌─────────────┐                 │
│    │   Client    │ ──ZK Proof: "I'm────▶│   Server    │                 │
│    │             │   in the group,      │  (doesn't   │                 │
│    │             │   but I won't say    │   know who) │                 │
│    │             │   which member"      │             │                 │
│    │             │ ◀──"Verified"────    │             │                 │
│    └─────────────┘                      └─────────────┘                 │
│                                                                         │
│    The server verifies you're authorized WITHOUT learning your identity │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Real-time Collaboration Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CONFLICT-FREE SYNC (CRDT)                        │
│                                                                         │
│      Alice (offline)              Bob (online)              Carol       │
│            │                           │                       │        │
│            │                           │                       │        │
│    ┌───────▼───────┐           ┌───────▼───────┐       ┌───────▼──────┐│
│    │ Add card      │           │ Move card     │       │ Edit card    ││
│    │ "Design v2"   │           │ to "Done"     │       │ description  ││
│    └───────┬───────┘           └───────┬───────┘       └───────┬──────┘│
│            │                           │                       │        │
│            │    Automerge CRDT    ─────┴───────────────────────┘        │
│            │    merges changes                                          │
│            │    automatically                                           │
│            │                                                            │
│            ▼                                                            │
│    ┌─────────────────────────────────────────────────────────────┐     │
│    │                    FINAL STATE (ALL CLIENTS)                 │     │
│    │                                                              │     │
│    │   • Alice's new card appears                                 │     │
│    │   • Bob's card move preserved                                │     │
│    │   • Carol's description edit included                        │     │
│    │   • No conflicts, no data loss                               │     │
│    └─────────────────────────────────────────────────────────────┘     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 💰 Pricing

<table>
<tr>
<th width="50%">Free</th>
<th width="50%">Pro</th>
</tr>
<tr>
<td>

**Perfect for small teams**

- ✅ 3 boards
- ✅ 5 members per board
- ✅ 100MB storage
- ✅ Full E2EE
- ✅ ZK anonymous collaboration
- ✅ Real-time sync
- ✅ Offline support

**$0/month forever**

</td>
<td>

**For growing teams**

- ✅ **Unlimited** boards
- ✅ **Unlimited** members
- ✅ **10GB** storage
- ✅ Full E2EE
- ✅ ZK anonymous collaboration
- ✅ Real-time sync
- ✅ Offline support
- ✅ Calendar view
- ✅ Card templates
- ✅ Audit logs

**Contact for pricing**

</td>
</tr>
</table>

> **Upgrade when you need to:** Team grows past 5, need a 4th board, or hit 100MB storage.

---

## 🚀 Quick Start

### Install the Extension

1. Download from Chrome Web Store *(coming soon)*
2. Click the extension icon
3. Create your account with a recovery phrase

### Or Build from Source

```bash
# Clone the repository
git clone https://github.com/user/zkkb.git
cd zkkb

# Install dependencies
pnpm install

# Build the extension
pnpm build
cd zkkb-pro/apps/extension
pnpm build

# Load in Chrome
# 1. Go to chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the dist/ folder
```

---

## 📦 Open Source Packages

The cryptographic foundation is **MIT licensed** and fully auditable:

| Package | Description | NPM |
|---------|-------------|-----|
| **[@zkkb/crypto](packages/crypto)** | E2EE primitives: BIP-39 phrases, AES-256-GCM, X25519 ECDH | [![npm](https://img.shields.io/npm/v/@zkkb/crypto?style=flat-square)](https://npmjs.com/package/@zkkb/crypto) |
| **[@zkkb/semaphore](packages/semaphore)** | Semaphore ZK proof generation & verification | [![npm](https://img.shields.io/npm/v/@zkkb/semaphore?style=flat-square)](https://npmjs.com/package/@zkkb/semaphore) |
| **[@zkkb/automerge](packages/automerge)** | CRDT operations for kanban boards | [![npm](https://img.shields.io/npm/v/@zkkb/automerge?style=flat-square)](https://npmjs.com/package/@zkkb/automerge) |
| **[@zkkb/storage](packages/storage)** | IndexedDB persistence layer | [![npm](https://img.shields.io/npm/v/@zkkb/storage?style=flat-square)](https://npmjs.com/package/@zkkb/storage) |
| **[@zkkb/types](packages/types)** | TypeScript definitions | [![npm](https://img.shields.io/npm/v/@zkkb/types?style=flat-square)](https://npmjs.com/package/@zkkb/types) |

### Code Examples

<details>
<summary><strong>Generate Recovery Phrase & Derive Keys</strong></summary>

```typescript
import { generatePhrase, phraseToSeed } from '@zkkb/crypto'
import { deriveKeyPair } from '@zkkb/crypto'

// Generate a new 24-word recovery phrase
const phrase = generatePhrase()
// "abandon ability able about above absent absorb abstract..."

// Derive cryptographic keys from the phrase
const seed = await phraseToSeed(phrase)
const { publicKey, privateKey } = await deriveKeyPair(seed)
```

</details>

<details>
<summary><strong>Encrypt & Decrypt Data</strong></summary>

```typescript
import { generateKey, encrypt, decrypt, exportKey, importKey } from '@zkkb/crypto'

// Generate a board encryption key
const boardKey = await generateKey()

// Encrypt sensitive data
const plaintext = new TextEncoder().encode('Secret project details')
const ciphertext = await encrypt(boardKey, plaintext)

// Later, decrypt
const decrypted = await decrypt(boardKey, ciphertext)
const text = new TextDecoder().decode(decrypted)
// "Secret project details"
```

</details>

<details>
<summary><strong>Generate Zero-Knowledge Membership Proof</strong></summary>

```typescript
import { identityFromSeed, createGroup, addMember, generateProof, verifyProof } from '@zkkb/semaphore'

// Create ZK identity from your seed
const identity = await identityFromSeed(seed)

// Board owner creates a group and adds members
const group = createGroup()
addMember(group, identity.commitment)
addMember(group, otherMember.commitment)

// Prove you're in the group WITHOUT revealing which member you are
const proof = await generateProof(
  identity,
  group,
  boardId,  // external nullifier
  Date.now() // message (for uniqueness)
)

// Server verifies the proof
const isValid = await verifyProof(proof, group.root)
// true - but server doesn't know WHO you are
```

</details>

---

## 🧪 Test Coverage

```
303 tests passing

┌──────────────────────────────────────────────────────────┐
│  Package           │  Tests  │  Coverage                │
├────────────────────┼─────────┼──────────────────────────┤
│  @zkkb/crypto      │    24   │  Phrase, AES, X25519     │
│  @zkkb/storage     │    10   │  IndexedDB operations    │
│  @zkkb/semaphore   │    24   │  Identity, Group, Proof  │
│  @zkkb/automerge   │    31   │  Schema, Operations      │
│  zkkb-api          │    65   │  Routes, Middleware, DO  │
│  zkkb-extension    │   130   │  Components, State, API  │
│  E2E (Playwright)  │    19   │  Auth, Navigation, A11y  │
└──────────────────────────────────────────────────────────┘
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Product Requirements](docs/PRD.md) | Full product specification |
| [Freemium Model](docs/FREEMIUM.md) | Business model details |
| [ADR-001: E2EE](docs/adr/001-e2ee-recovery-phrase.md) | Why BIP-39 + AES-256-GCM |
| [ADR-002: ZK Proofs](docs/adr/002-semaphore-zk-proofs.md) | Why Semaphore for anonymity |
| [ADR-003: CRDTs](docs/adr/003-automerge-crdt.md) | Why Automerge for sync |
| [ADR-004: Infrastructure](docs/adr/004-cloudflare-infrastructure.md) | Why Cloudflare edge |
| [ADR-005: Licensing](docs/adr/005-dual-licensing.md) | Open core model |

---

## 👁️ Privacy Model: Who Sees What

Understanding exactly what's private and what's not:

### The Server Knows

| Data | Visibility | Why |
|------|------------|-----|
| Your email | ✅ Visible | Magic link authentication |
| Which boards you created | ✅ Visible | Ownership tracking |
| Which boards you're a member of | ✅ Visible | Access control |
| When you authenticate | ✅ Visible | Session management |
| Your tier (free/pro) | ✅ Visible | Limit enforcement |

### The Server Cannot See

| Data | Visibility | Why |
|------|------------|-----|
| Board names & content | 🔒 Encrypted | AES-256-GCM, key never leaves device |
| Card text, comments | 🔒 Encrypted | Inside encrypted board blob |
| Column names | 🔒 Encrypted | Inside encrypted board blob |
| Attachment contents | 🔒 Encrypted | Encrypted before upload |
| Your display name in boards | 🔒 Encrypted | Stored in encrypted member data |
| Who made which edit | 🔒 Anonymous | ZK proofs don't reveal identity |

### What Other Board Members See

| Data | Visibility | Why |
|------|------------|-----|
| Your display name | ✅ Visible | You choose it per-board |
| Your avatar color | ✅ Visible | For visual identification |
| Your edits & comments | ✅ Visible | Collaboration requires it |
| Your email | ❌ Hidden | Never shared with members |
| Your other boards | ❌ Hidden | Completely separate |

### The ZK Proof Advantage

When you sync changes to a board:

```
Traditional:  "User alice@example.com edited card #123"
                ↓ Server logs who did what

ZKKB:         "Valid member proof for board xyz" + [encrypted changes]
                ↓ Server knows SOMEONE edited, but not WHO
```

The server can verify you're authorized without learning which member you are. This prevents building activity timelines per-user.

**Bottom line:** The server knows *that* you're a member, but not *what* you do as a member. Your email is known; your activity is anonymous.

---

## 🔒 Security

### What We Can't Do

- ❌ Read your board contents (encrypted client-side)
- ❌ See what your team discusses (cards, comments, columns)
- ❌ Access your file contents (encrypted before upload)
- ❌ Know who made which specific edit (ZK proofs)
- ❌ Reset your password (there is none)
- ❌ Recover your data without your phrase

### What We Can See

- ✅ Your email (for authentication)
- ✅ Which boards you're a member of
- ✅ That activity happened (not what or by whom)

### What This Means

- ✅ **Content-proof**: Board content is unreadable to us
- ✅ **Activity-anonymous**: Can't attribute edits to users
- ✅ **You're in control**: Your phrase = your data

### Threat Model

| Threat | Mitigation |
|--------|------------|
| Server compromise | All content encrypted client-side |
| Man-in-the-middle | TLS + E2EE (double encryption) |
| Malicious insider | Server has no decryption keys |
| Legal compulsion | Content is unreadable; only metadata (emails, board IDs) |
| Activity tracking | ZK proofs prevent attributing edits to specific users |

---

## 🤝 Contributing

We welcome contributions to the open-source packages! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Security issues?** Email security@zkkb.io (PGP key available)

---

## 📜 License

- **Crypto packages** (`packages/*`): [MIT License](LICENSE)
- **Application** (`zkkb-pro/*`): Proprietary

---

<p align="center">
  <strong>Stop trusting. Start verifying.</strong><br/>
  <sub>Built with 🔐 by privacy advocates, for privacy advocates.</sub>
</p>
