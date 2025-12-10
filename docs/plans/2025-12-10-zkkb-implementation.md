# ZKKB Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an E2EE Chrome extension kanban board with Semaphore ZK proofs for anonymous access.

**Architecture:** Chrome extension (side panel) with Preact UI, Automerge CRDT for sync, Cloudflare Workers backend. All encryption client-side using Web Crypto. Semaphore for anonymous board access.

**Tech Stack:** Preact, Tailwind, Vite, Automerge, Semaphore Protocol, Cloudflare Workers/D1/R2/Durable Objects, Web Crypto API, BIP39

---

## Phase 1: Extension Scaffold

### Task 1.1: Initialize Extension Project

**Files:**
- Create: `package.json`
- Create: `manifest.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`

**Step 1: Initialize npm project**

Run:
```bash
cd /Users/4n6h4x0r/src/zkkb
npm init -y
```

**Step 2: Install dependencies**

Run:
```bash
npm install preact @preact/signals
npm install -D vite @preact/preset-vite typescript tailwindcss postcss autoprefixer
npm install -D @types/chrome
```

**Step 3: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [preact()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
        background: resolve(__dirname, 'src/background/service-worker.ts'),
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
})
```

**Step 4: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx",
    "jsxImportSource": "preact",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "rootDir": "src",
    "types": ["chrome"]
  },
  "include": ["src/**/*"]
}
```

**Step 5: Create tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,tsx,ts}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Step 6: Create postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**Step 7: Create manifest.json**

```json
{
  "manifest_version": 3,
  "name": "ZKKB",
  "version": "0.1.0",
  "description": "Zero-Knowledge Kanban Board - End-to-end encrypted kanban",
  "permissions": ["storage", "unlimitedStorage", "sidePanel"],
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "action": {
    "default_title": "Open ZKKB"
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

**Step 8: Update package.json scripts**

Add to `package.json`:
```json
{
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build",
    "test": "vitest"
  }
}
```

**Step 9: Commit**

```bash
git add -A
git commit -m "chore: initialize extension project with Vite + Preact + Tailwind"
```

---

### Task 1.2: Create Side Panel Entry

**Files:**
- Create: `src/sidepanel/index.html`
- Create: `src/sidepanel/main.tsx`
- Create: `src/sidepanel/App.tsx`
- Create: `src/sidepanel/styles.css`

**Step 1: Create src/sidepanel directory**

Run:
```bash
mkdir -p src/sidepanel
```

**Step 2: Create src/sidepanel/index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ZKKB</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

**Step 3: Create src/sidepanel/styles.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-gray-100 text-gray-900 min-h-screen;
}
```

**Step 4: Create src/sidepanel/main.tsx**

```tsx
import { render } from 'preact'
import { App } from './App'
import './styles.css'

render(<App />, document.getElementById('app')!)
```

**Step 5: Create src/sidepanel/App.tsx**

```tsx
export function App() {
  return (
    <div class="p-4">
      <h1 class="text-xl font-bold">ZKKB</h1>
      <p class="text-gray-600 mt-2">Zero-Knowledge Kanban Board</p>
    </div>
  )
}
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add side panel entry point"
```

---

### Task 1.3: Create Background Service Worker

**Files:**
- Create: `src/background/service-worker.ts`

**Step 1: Create src/background directory**

Run:
```bash
mkdir -p src/background
```

**Step 2: Create src/background/service-worker.ts**

```typescript
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error))

chrome.runtime.onInstalled.addListener(() => {
  console.log('ZKKB installed')
})
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add background service worker"
```

---

### Task 1.4: Create Placeholder Icons

**Files:**
- Create: `public/icons/icon16.png`
- Create: `public/icons/icon48.png`
- Create: `public/icons/icon128.png`

**Step 1: Create icons directory**

Run:
```bash
mkdir -p public/icons
```

**Step 2: Create placeholder icons**

Create simple SVG-based placeholder icons. For now, create 1x1 transparent PNGs:

Run:
```bash
# Create minimal valid PNG files (1x1 transparent)
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > public/icons/icon16.png
cp public/icons/icon16.png public/icons/icon48.png
cp public/icons/icon16.png public/icons/icon128.png
```

**Step 3: Update vite.config.ts for public assets**

```typescript
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [preact()],
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
        background: resolve(__dirname, 'src/background/service-worker.ts'),
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
})
```

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: add placeholder icons"
```

---

### Task 1.5: Build and Test Extension Load

**Step 1: Build the extension**

Run:
```bash
npm run build
```

Expected: `dist/` folder with `sidepanel.html`, `sidepanel.js`, `background.js`, `icons/`

**Step 2: Verify dist structure**

Run:
```bash
ls -la dist/
```

Expected output includes: `sidepanel.html`, `background.js`, `icons/`

**Step 3: Copy manifest to dist**

Add copy step. Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { resolve } from 'path'
import { copyFileSync } from 'fs'

export default defineConfig({
  plugins: [
    preact(),
    {
      name: 'copy-manifest',
      closeBundle() {
        copyFileSync('manifest.json', 'dist/manifest.json')
      },
    },
  ],
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
        background: resolve(__dirname, 'src/background/service-worker.ts'),
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
})
```

**Step 4: Rebuild**

Run:
```bash
npm run build
```

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: add manifest copy to build"
```

---

## Phase 2: Crypto Library

### Task 2.1: Install Crypto Dependencies

**Step 1: Install dependencies**

Run:
```bash
npm install bip39 @noble/hashes @noble/curves
npm install -D vitest @vitest/ui
```

**Step 2: Add vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
```

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: add crypto and test dependencies"
```

---

### Task 2.2: Recovery Phrase Generation

**Files:**
- Create: `src/lib/crypto/phrase.ts`
- Create: `src/lib/crypto/phrase.test.ts`

**Step 1: Create lib directory**

Run:
```bash
mkdir -p src/lib/crypto
```

**Step 2: Write the failing test**

Create `src/lib/crypto/phrase.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { generatePhrase, phraseToSeed, validatePhrase } from './phrase'

describe('phrase', () => {
  it('generates a 24-word phrase', () => {
    const phrase = generatePhrase()
    const words = phrase.split(' ')
    expect(words).toHaveLength(24)
  })

  it('generates different phrases each time', () => {
    const phrase1 = generatePhrase()
    const phrase2 = generatePhrase()
    expect(phrase1).not.toBe(phrase2)
  })

  it('converts phrase to deterministic seed', () => {
    const phrase = generatePhrase()
    const seed1 = phraseToSeed(phrase)
    const seed2 = phraseToSeed(phrase)
    expect(seed1).toEqual(seed2)
    expect(seed1.byteLength).toBe(64)
  })

  it('validates correct phrase', () => {
    const phrase = generatePhrase()
    expect(validatePhrase(phrase)).toBe(true)
  })

  it('rejects invalid phrase', () => {
    expect(validatePhrase('invalid phrase here')).toBe(false)
  })
})
```

**Step 3: Run test to verify it fails**

Run:
```bash
npx vitest run src/lib/crypto/phrase.test.ts
```

Expected: FAIL with "Cannot find module './phrase'"

**Step 4: Write minimal implementation**

Create `src/lib/crypto/phrase.ts`:

```typescript
import * as bip39 from 'bip39'

export function generatePhrase(): string {
  return bip39.generateMnemonic(256) // 24 words
}

export function phraseToSeed(phrase: string): Uint8Array {
  return bip39.mnemonicToSeedSync(phrase)
}

export function validatePhrase(phrase: string): boolean {
  return bip39.validateMnemonic(phrase)
}
```

**Step 5: Run test to verify it passes**

Run:
```bash
npx vitest run src/lib/crypto/phrase.test.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add recovery phrase generation"
```

---

### Task 2.3: Key Derivation from Seed

**Files:**
- Create: `src/lib/crypto/keys.ts`
- Create: `src/lib/crypto/keys.test.ts`

**Step 1: Write the failing test**

Create `src/lib/crypto/keys.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { deriveKeys } from './keys'
import { generatePhrase, phraseToSeed } from './phrase'

describe('keys', () => {
  it('derives keypair from seed', () => {
    const phrase = generatePhrase()
    const seed = phraseToSeed(phrase)
    const keys = deriveKeys(seed)

    expect(keys.publicKey).toBeInstanceOf(Uint8Array)
    expect(keys.privateKey).toBeInstanceOf(Uint8Array)
    expect(keys.publicKey.byteLength).toBe(32)
    expect(keys.privateKey.byteLength).toBe(32)
  })

  it('derives same keys from same seed', () => {
    const phrase = generatePhrase()
    const seed = phraseToSeed(phrase)
    const keys1 = deriveKeys(seed)
    const keys2 = deriveKeys(seed)

    expect(keys1.publicKey).toEqual(keys2.publicKey)
    expect(keys1.privateKey).toEqual(keys2.privateKey)
  })

  it('derives different keys from different seeds', () => {
    const seed1 = phraseToSeed(generatePhrase())
    const seed2 = phraseToSeed(generatePhrase())
    const keys1 = deriveKeys(seed1)
    const keys2 = deriveKeys(seed2)

    expect(keys1.publicKey).not.toEqual(keys2.publicKey)
  })
})
```

**Step 2: Run test to verify it fails**

Run:
```bash
npx vitest run src/lib/crypto/keys.test.ts
```

Expected: FAIL

**Step 3: Write minimal implementation**

Create `src/lib/crypto/keys.ts`:

```typescript
import { hkdf } from '@noble/hashes/hkdf'
import { sha256 } from '@noble/hashes/sha256'
import { x25519 } from '@noble/curves/ed25519'

export interface KeyPair {
  publicKey: Uint8Array
  privateKey: Uint8Array
}

export function deriveKeys(seed: Uint8Array): KeyPair {
  // Derive private key using HKDF
  const privateKey = hkdf(sha256, seed.slice(0, 32), undefined, 'zkkb-x25519', 32)
  const publicKey = x25519.getPublicKey(privateKey)

  return { publicKey, privateKey }
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
npx vitest run src/lib/crypto/keys.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add key derivation from seed"
```

---

### Task 2.4: AES-256-GCM Encryption

**Files:**
- Create: `src/lib/crypto/aes.ts`
- Create: `src/lib/crypto/aes.test.ts`

**Step 1: Write the failing test**

Create `src/lib/crypto/aes.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { generateKey, encrypt, decrypt } from './aes'

describe('aes', () => {
  it('generates a 256-bit key', async () => {
    const key = await generateKey()
    const exported = await crypto.subtle.exportKey('raw', key)
    expect(exported.byteLength).toBe(32)
  })

  it('encrypts and decrypts data', async () => {
    const key = await generateKey()
    const plaintext = new TextEncoder().encode('Hello, World!')

    const { ciphertext, iv } = await encrypt(key, plaintext)
    const decrypted = await decrypt(key, ciphertext, iv)

    expect(decrypted).toEqual(plaintext)
  })

  it('produces different ciphertext each time', async () => {
    const key = await generateKey()
    const plaintext = new TextEncoder().encode('Hello, World!')

    const result1 = await encrypt(key, plaintext)
    const result2 = await encrypt(key, plaintext)

    expect(result1.ciphertext).not.toEqual(result2.ciphertext)
    expect(result1.iv).not.toEqual(result2.iv)
  })

  it('fails to decrypt with wrong key', async () => {
    const key1 = await generateKey()
    const key2 = await generateKey()
    const plaintext = new TextEncoder().encode('Hello, World!')

    const { ciphertext, iv } = await encrypt(key1, plaintext)

    await expect(decrypt(key2, ciphertext, iv)).rejects.toThrow()
  })
})
```

**Step 2: Run test to verify it fails**

Run:
```bash
npx vitest run src/lib/crypto/aes.test.ts
```

Expected: FAIL

**Step 3: Write minimal implementation**

Create `src/lib/crypto/aes.ts`:

```typescript
export async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

export async function importKey(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, true, [
    'encrypt',
    'decrypt',
  ])
}

export async function exportKey(key: CryptoKey): Promise<Uint8Array> {
  const raw = await crypto.subtle.exportKey('raw', key)
  return new Uint8Array(raw)
}

export interface EncryptedData {
  ciphertext: Uint8Array
  iv: Uint8Array
}

export async function encrypt(
  key: CryptoKey,
  plaintext: Uint8Array
): Promise<EncryptedData> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext
  )
  return { ciphertext: new Uint8Array(ciphertext), iv }
}

export async function decrypt(
  key: CryptoKey,
  ciphertext: Uint8Array,
  iv: Uint8Array
): Promise<Uint8Array> {
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  )
  return new Uint8Array(plaintext)
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
npx vitest run src/lib/crypto/aes.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add AES-256-GCM encryption"
```

---

### Task 2.5: X25519 Key Wrapping

**Files:**
- Create: `src/lib/crypto/wrap.ts`
- Create: `src/lib/crypto/wrap.test.ts`

**Step 1: Write the failing test**

Create `src/lib/crypto/wrap.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { wrapKey, unwrapKey } from './wrap'
import { deriveKeys } from './keys'
import { generateKey, exportKey, importKey } from './aes'
import { generatePhrase, phraseToSeed } from './phrase'

describe('wrap', () => {
  it('wraps and unwraps a key', async () => {
    const recipient = deriveKeys(phraseToSeed(generatePhrase()))
    const boardKey = await generateKey()
    const boardKeyRaw = await exportKey(boardKey)

    const wrapped = await wrapKey(boardKeyRaw, recipient.publicKey)
    const unwrapped = await unwrapKey(wrapped, recipient.privateKey)

    expect(unwrapped).toEqual(boardKeyRaw)
  })

  it('cannot unwrap with wrong private key', async () => {
    const recipient = deriveKeys(phraseToSeed(generatePhrase()))
    const wrongRecipient = deriveKeys(phraseToSeed(generatePhrase()))
    const boardKey = await generateKey()
    const boardKeyRaw = await exportKey(boardKey)

    const wrapped = await wrapKey(boardKeyRaw, recipient.publicKey)

    await expect(unwrapKey(wrapped, wrongRecipient.privateKey)).rejects.toThrow()
  })
})
```

**Step 2: Run test to verify it fails**

Run:
```bash
npx vitest run src/lib/crypto/wrap.test.ts
```

Expected: FAIL

**Step 3: Write minimal implementation**

Create `src/lib/crypto/wrap.ts`:

```typescript
import { x25519 } from '@noble/curves/ed25519'
import { hkdf } from '@noble/hashes/hkdf'
import { sha256 } from '@noble/hashes/sha256'

export interface WrappedKey {
  ephemeralPublicKey: Uint8Array
  ciphertext: Uint8Array
  iv: Uint8Array
}

export async function wrapKey(
  key: Uint8Array,
  recipientPublicKey: Uint8Array
): Promise<WrappedKey> {
  // Generate ephemeral keypair
  const ephemeralPrivate = crypto.getRandomValues(new Uint8Array(32))
  const ephemeralPublicKey = x25519.getPublicKey(ephemeralPrivate)

  // ECDH shared secret
  const sharedSecret = x25519.getSharedSecret(ephemeralPrivate, recipientPublicKey)

  // Derive wrapping key
  const wrappingKeyRaw = hkdf(sha256, sharedSecret, undefined, 'wrap-key', 32)
  const wrappingKey = await crypto.subtle.importKey(
    'raw',
    wrappingKeyRaw,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  )

  // Encrypt the key
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    wrappingKey,
    key
  )

  return {
    ephemeralPublicKey,
    ciphertext: new Uint8Array(ciphertext),
    iv,
  }
}

export async function unwrapKey(
  wrapped: WrappedKey,
  recipientPrivateKey: Uint8Array
): Promise<Uint8Array> {
  // ECDH shared secret
  const sharedSecret = x25519.getSharedSecret(
    recipientPrivateKey,
    wrapped.ephemeralPublicKey
  )

  // Derive wrapping key
  const wrappingKeyRaw = hkdf(sha256, sharedSecret, undefined, 'wrap-key', 32)
  const wrappingKey = await crypto.subtle.importKey(
    'raw',
    wrappingKeyRaw,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  )

  // Decrypt the key
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: wrapped.iv },
    wrappingKey,
    wrapped.ciphertext
  )

  return new Uint8Array(plaintext)
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
npx vitest run src/lib/crypto/wrap.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add X25519 key wrapping"
```

---

### Task 2.6: Crypto Module Index

**Files:**
- Create: `src/lib/crypto/index.ts`

**Step 1: Create barrel export**

Create `src/lib/crypto/index.ts`:

```typescript
export { generatePhrase, phraseToSeed, validatePhrase } from './phrase'
export { deriveKeys, type KeyPair } from './keys'
export {
  generateKey,
  importKey,
  exportKey,
  encrypt,
  decrypt,
  type EncryptedData,
} from './aes'
export { wrapKey, unwrapKey, type WrappedKey } from './wrap'
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add crypto module index"
```

---

## Phase 3: Semaphore Integration

### Task 3.1: Install Semaphore

**Step 1: Install dependencies**

Run:
```bash
npm install @semaphore-protocol/core @semaphore-protocol/proof @semaphore-protocol/group @semaphore-protocol/identity
```

**Step 2: Commit**

```bash
git add -A
git commit -m "chore: add Semaphore dependencies"
```

---

### Task 3.2: Semaphore Identity from Seed

**Files:**
- Create: `src/lib/semaphore/identity.ts`
- Create: `src/lib/semaphore/identity.test.ts`

**Step 1: Create semaphore directory**

Run:
```bash
mkdir -p src/lib/semaphore
```

**Step 2: Write the failing test**

Create `src/lib/semaphore/identity.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { createIdentity, identityFromSeed } from './identity'
import { generatePhrase, phraseToSeed } from '../crypto/phrase'

describe('semaphore identity', () => {
  it('creates identity from seed deterministically', () => {
    const phrase = generatePhrase()
    const seed = phraseToSeed(phrase)

    const identity1 = identityFromSeed(seed)
    const identity2 = identityFromSeed(seed)

    expect(identity1.commitment).toBe(identity2.commitment)
  })

  it('different seeds produce different identities', () => {
    const seed1 = phraseToSeed(generatePhrase())
    const seed2 = phraseToSeed(generatePhrase())

    const identity1 = identityFromSeed(seed1)
    const identity2 = identityFromSeed(seed2)

    expect(identity1.commitment).not.toBe(identity2.commitment)
  })

  it('identity has commitment, trapdoor, nullifier', () => {
    const seed = phraseToSeed(generatePhrase())
    const identity = identityFromSeed(seed)

    expect(identity.commitment).toBeDefined()
    expect(identity.trapdoor).toBeDefined()
    expect(identity.nullifier).toBeDefined()
  })
})
```

**Step 3: Run test to verify it fails**

Run:
```bash
npx vitest run src/lib/semaphore/identity.test.ts
```

Expected: FAIL

**Step 4: Write minimal implementation**

Create `src/lib/semaphore/identity.ts`:

```typescript
import { Identity } from '@semaphore-protocol/identity'
import { hkdf } from '@noble/hashes/hkdf'
import { sha256 } from '@noble/hashes/sha256'

export function identityFromSeed(seed: Uint8Array): Identity {
  // Derive deterministic secret from seed
  const secret = hkdf(sha256, seed.slice(0, 32), undefined, 'semaphore-identity', 32)
  return new Identity(secret)
}

export function createIdentity(): Identity {
  return new Identity()
}
```

**Step 5: Run test to verify it passes**

Run:
```bash
npx vitest run src/lib/semaphore/identity.test.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Semaphore identity from seed"
```

---

### Task 3.3: Semaphore Group Management

**Files:**
- Create: `src/lib/semaphore/group.ts`
- Create: `src/lib/semaphore/group.test.ts`

**Step 1: Write the failing test**

Create `src/lib/semaphore/group.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { createGroup, addMember, removeMember, isMember, exportGroup, importGroup } from './group'
import { identityFromSeed } from './identity'
import { generatePhrase, phraseToSeed } from '../crypto/phrase'

describe('semaphore group', () => {
  it('creates empty group', () => {
    const group = createGroup()
    expect(group.members.length).toBe(0)
  })

  it('adds member to group', () => {
    const group = createGroup()
    const identity = identityFromSeed(phraseToSeed(generatePhrase()))

    addMember(group, identity.commitment)

    expect(group.members.length).toBe(1)
    expect(isMember(group, identity.commitment)).toBe(true)
  })

  it('removes member from group', () => {
    const group = createGroup()
    const identity = identityFromSeed(phraseToSeed(generatePhrase()))

    addMember(group, identity.commitment)
    removeMember(group, identity.commitment)

    expect(isMember(group, identity.commitment)).toBe(false)
  })

  it('exports and imports group', () => {
    const group = createGroup()
    const identity = identityFromSeed(phraseToSeed(generatePhrase()))
    addMember(group, identity.commitment)

    const exported = exportGroup(group)
    const imported = importGroup(exported)

    expect(imported.root).toBe(group.root)
    expect(isMember(imported, identity.commitment)).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

Run:
```bash
npx vitest run src/lib/semaphore/group.test.ts
```

Expected: FAIL

**Step 3: Write minimal implementation**

Create `src/lib/semaphore/group.ts`:

```typescript
import { Group } from '@semaphore-protocol/group'

export function createGroup(): Group {
  return new Group()
}

export function addMember(group: Group, commitment: bigint): void {
  group.addMember(commitment)
}

export function removeMember(group: Group, commitment: bigint): void {
  const index = group.indexOf(commitment)
  if (index !== -1) {
    group.removeMember(index)
  }
}

export function isMember(group: Group, commitment: bigint): boolean {
  return group.indexOf(commitment) !== -1
}

export interface ExportedGroup {
  members: string[]
}

export function exportGroup(group: Group): ExportedGroup {
  return {
    members: group.members.map((m) => m.toString()),
  }
}

export function importGroup(exported: ExportedGroup): Group {
  const group = new Group()
  for (const member of exported.members) {
    group.addMember(BigInt(member))
  }
  return group
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
npx vitest run src/lib/semaphore/group.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Semaphore group management"
```

---

### Task 3.4: Semaphore Proof Generation

**Files:**
- Create: `src/lib/semaphore/proof.ts`
- Create: `src/lib/semaphore/proof.test.ts`

**Step 1: Write the failing test**

Create `src/lib/semaphore/proof.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { generateMembershipProof, verifyMembershipProof } from './proof'
import { createGroup, addMember } from './group'
import { identityFromSeed } from './identity'
import { generatePhrase, phraseToSeed } from '../crypto/phrase'

describe('semaphore proof', () => {
  it('generates and verifies valid proof', async () => {
    const group = createGroup()
    const identity = identityFromSeed(phraseToSeed(generatePhrase()))
    addMember(group, identity.commitment)

    const scope = 'board_123'
    const message = 'access'

    const proof = await generateMembershipProof(identity, group, message, scope)
    const valid = await verifyMembershipProof(proof, group.root)

    expect(valid).toBe(true)
  }, 30000) // ZK proofs can take time

  it('rejects proof from non-member', async () => {
    const group = createGroup()
    const member = identityFromSeed(phraseToSeed(generatePhrase()))
    const nonMember = identityFromSeed(phraseToSeed(generatePhrase()))
    addMember(group, member.commitment)

    const scope = 'board_123'
    const message = 'access'

    await expect(
      generateMembershipProof(nonMember, group, message, scope)
    ).rejects.toThrow()
  }, 30000)
})
```

**Step 2: Run test to verify it fails**

Run:
```bash
npx vitest run src/lib/semaphore/proof.test.ts
```

Expected: FAIL

**Step 3: Write minimal implementation**

Create `src/lib/semaphore/proof.ts`:

```typescript
import { generateProof, verifyProof, type SemaphoreProof } from '@semaphore-protocol/proof'
import { Group } from '@semaphore-protocol/group'
import { Identity } from '@semaphore-protocol/identity'

export async function generateMembershipProof(
  identity: Identity,
  group: Group,
  message: string,
  scope: string
): Promise<SemaphoreProof> {
  return generateProof(identity, group, message, scope)
}

export async function verifyMembershipProof(
  proof: SemaphoreProof,
  merkleRoot: bigint
): Promise<boolean> {
  // Verify the proof matches the expected root
  if (proof.merkleTreeRoot !== merkleRoot) {
    return false
  }
  return verifyProof(proof)
}

export type { SemaphoreProof }
```

**Step 4: Run test to verify it passes**

Run:
```bash
npx vitest run src/lib/semaphore/proof.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Semaphore proof generation and verification"
```

---

### Task 3.5: Semaphore Module Index

**Files:**
- Create: `src/lib/semaphore/index.ts`

**Step 1: Create barrel export**

Create `src/lib/semaphore/index.ts`:

```typescript
export { identityFromSeed, createIdentity } from './identity'
export {
  createGroup,
  addMember,
  removeMember,
  isMember,
  exportGroup,
  importGroup,
  type ExportedGroup,
} from './group'
export {
  generateMembershipProof,
  verifyMembershipProof,
  type SemaphoreProof,
} from './proof'
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add Semaphore module index"
```

---

## Phase 4: Storage Layer

### Task 4.1: Install IndexedDB Wrapper

**Step 1: Install idb**

Run:
```bash
npm install idb
```

**Step 2: Commit**

```bash
git add -A
git commit -m "chore: add idb dependency"
```

---

### Task 4.2: Storage Schema

**Files:**
- Create: `src/lib/storage/db.ts`
- Create: `src/lib/storage/db.test.ts`

**Step 1: Create storage directory**

Run:
```bash
mkdir -p src/lib/storage
```

**Step 2: Write the failing test**

Create `src/lib/storage/db.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { openDatabase, clearDatabase } from './db'

describe('database', () => {
  beforeEach(async () => {
    await clearDatabase()
  })

  it('opens database', async () => {
    const db = await openDatabase()
    expect(db.name).toBe('zkkb')
  })

  it('has required object stores', async () => {
    const db = await openDatabase()
    expect(db.objectStoreNames.contains('identity')).toBe(true)
    expect(db.objectStoreNames.contains('boards')).toBe(true)
    expect(db.objectStoreNames.contains('attachmentCache')).toBe(true)
  })
})
```

**Step 3: Run test to verify it fails**

Run:
```bash
npx vitest run src/lib/storage/db.test.ts
```

Expected: FAIL

**Step 4: Write minimal implementation**

Create `src/lib/storage/db.ts`:

```typescript
import { openDB, deleteDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'zkkb'
const DB_VERSION = 1

export interface ZKKBDB {
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

let dbInstance: IDBPDatabase<ZKKBDB> | null = null

export async function openDatabase(): Promise<IDBPDatabase<ZKKBDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<ZKKBDB>(DB_NAME, DB_VERSION, {
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

export async function clearDatabase(): Promise<void> {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
  await deleteDB(DB_NAME)
}
```

**Step 5: Run test to verify it passes**

Run:
```bash
npx vitest run src/lib/storage/db.test.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add IndexedDB schema"
```

---

### Task 4.3: Identity Storage

**Files:**
- Create: `src/lib/storage/identity.ts`
- Create: `src/lib/storage/identity.test.ts`

**Step 1: Write the failing test**

Create `src/lib/storage/identity.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { saveIdentity, loadIdentity, hasIdentity, clearIdentity } from './identity'
import { clearDatabase } from './db'

describe('identity storage', () => {
  beforeEach(async () => {
    await clearDatabase()
  })

  it('saves and loads identity', async () => {
    const identity = {
      privateKey: new Uint8Array([1, 2, 3]),
      publicKey: new Uint8Array([4, 5, 6]),
      semaphoreSecret: new Uint8Array([7, 8, 9]),
      commitment: '12345',
    }

    await saveIdentity(identity)
    const loaded = await loadIdentity()

    expect(loaded).not.toBeNull()
    expect(loaded!.privateKey).toEqual(identity.privateKey)
    expect(loaded!.publicKey).toEqual(identity.publicKey)
    expect(loaded!.commitment).toBe(identity.commitment)
  })

  it('returns null when no identity exists', async () => {
    const loaded = await loadIdentity()
    expect(loaded).toBeNull()
  })

  it('checks if identity exists', async () => {
    expect(await hasIdentity()).toBe(false)

    await saveIdentity({
      privateKey: new Uint8Array([1]),
      publicKey: new Uint8Array([2]),
      semaphoreSecret: new Uint8Array([3]),
      commitment: '123',
    })

    expect(await hasIdentity()).toBe(true)
  })

  it('clears identity', async () => {
    await saveIdentity({
      privateKey: new Uint8Array([1]),
      publicKey: new Uint8Array([2]),
      semaphoreSecret: new Uint8Array([3]),
      commitment: '123',
    })

    await clearIdentity()

    expect(await hasIdentity()).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**

Run:
```bash
npx vitest run src/lib/storage/identity.test.ts
```

Expected: FAIL

**Step 3: Write minimal implementation**

Create `src/lib/storage/identity.ts`:

```typescript
import { openDatabase } from './db'

export interface StoredIdentity {
  privateKey: Uint8Array
  publicKey: Uint8Array
  semaphoreSecret: Uint8Array
  commitment: string
  phrase?: string
}

const IDENTITY_KEY = 'current'

export async function saveIdentity(identity: StoredIdentity): Promise<void> {
  const db = await openDatabase()
  await db.put('identity', {
    id: IDENTITY_KEY,
    ...identity,
  })
}

export async function loadIdentity(): Promise<StoredIdentity | null> {
  const db = await openDatabase()
  const stored = await db.get('identity', IDENTITY_KEY)
  if (!stored) return null

  return {
    privateKey: stored.privateKey,
    publicKey: stored.publicKey,
    semaphoreSecret: stored.semaphoreSecret,
    commitment: stored.commitment,
    phrase: stored.phrase,
  }
}

export async function hasIdentity(): Promise<boolean> {
  const identity = await loadIdentity()
  return identity !== null
}

export async function clearIdentity(): Promise<void> {
  const db = await openDatabase()
  await db.delete('identity', IDENTITY_KEY)
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
npx vitest run src/lib/storage/identity.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add identity storage"
```

---

### Task 4.4: Storage Module Index

**Files:**
- Create: `src/lib/storage/index.ts`

**Step 1: Create barrel export**

Create `src/lib/storage/index.ts`:

```typescript
export { openDatabase, clearDatabase } from './db'
export {
  saveIdentity,
  loadIdentity,
  hasIdentity,
  clearIdentity,
  type StoredIdentity,
} from './identity'
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add storage module index"
```

---

## Phase 5: Automerge Integration

### Task 5.1: Install Automerge

**Step 1: Install dependencies**

Run:
```bash
npm install @automerge/automerge
```

**Step 2: Commit**

```bash
git add -A
git commit -m "chore: add Automerge dependency"
```

---

### Task 5.2: Board Document Type

**Files:**
- Create: `src/lib/automerge/schema.ts`
- Create: `src/types/board.ts`

**Step 1: Create directories**

Run:
```bash
mkdir -p src/lib/automerge src/types
```

**Step 2: Create board types**

Create `src/types/board.ts`:

```typescript
export interface BoardMember {
  displayName: string
  publicKey: string // base64
  wrappedBoardKey: string // base64
  color: string
  joinedAt: number
}

export interface Column {
  id: string
  title: string
  position: string
}

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

export interface Attachment {
  id: string
  name: string
  r2Key: string
  size: number
  encryptionKey: string // base64
}

export interface Comment {
  id: string
  author: string // commitment
  text: string
  createdAt: number
}

export interface Card {
  id: string
  columnId: string
  position: string
  title: string
  description: string
  labels: string[]
  dueDate: number | null
  assignee: string | null // commitment
  checklist: ChecklistItem[]
  attachments: Attachment[]
  comments: Comment[]
  createdAt: number
  updatedAt: number
}

export interface BoardContent {
  name: string
  members: { [commitment: string]: BoardMember }
  columns: Column[]
  cards: { [id: string]: Card }
}
```

**Step 3: Create Automerge schema helper**

Create `src/lib/automerge/schema.ts`:

```typescript
import * as Automerge from '@automerge/automerge'
import type { BoardContent } from '../../types/board'

export function createEmptyBoard(name: string): Automerge.Doc<BoardContent> {
  return Automerge.from<BoardContent>({
    name,
    members: {},
    columns: [],
    cards: {},
  })
}

export function initializeBoard(
  name: string,
  creatorCommitment: string,
  creatorDisplayName: string,
  creatorPublicKey: string,
  wrappedBoardKey: string,
  creatorColor: string
): Automerge.Doc<BoardContent> {
  return Automerge.from<BoardContent>({
    name,
    members: {
      [creatorCommitment]: {
        displayName: creatorDisplayName,
        publicKey: creatorPublicKey,
        wrappedBoardKey,
        color: creatorColor,
        joinedAt: Date.now(),
      },
    },
    columns: [
      { id: crypto.randomUUID(), title: 'To Do', position: 'a' },
      { id: crypto.randomUUID(), title: 'In Progress', position: 'n' },
      { id: crypto.randomUUID(), title: 'Done', position: 'z' },
    ],
    cards: {},
  })
}
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add board types and Automerge schema"
```

---

### Task 5.3: Board Document Operations

**Files:**
- Create: `src/lib/automerge/operations.ts`
- Create: `src/lib/automerge/operations.test.ts`

**Step 1: Write the failing test**

Create `src/lib/automerge/operations.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import * as Automerge from '@automerge/automerge'
import { createEmptyBoard } from './schema'
import {
  addColumn,
  removeColumn,
  addCard,
  moveCard,
  updateCard,
  addComment,
} from './operations'

describe('board operations', () => {
  it('adds a column', () => {
    let doc = createEmptyBoard('Test')
    doc = addColumn(doc, 'New Column', 'm')

    expect(doc.columns.length).toBe(1)
    expect(doc.columns[0].title).toBe('New Column')
  })

  it('removes a column', () => {
    let doc = createEmptyBoard('Test')
    doc = addColumn(doc, 'Column 1', 'a')
    const columnId = doc.columns[0].id
    doc = removeColumn(doc, columnId)

    expect(doc.columns.length).toBe(0)
  })

  it('adds a card', () => {
    let doc = createEmptyBoard('Test')
    doc = addColumn(doc, 'Column 1', 'a')
    const columnId = doc.columns[0].id
    doc = addCard(doc, columnId, 'Test Card', 'a')

    const cardIds = Object.keys(doc.cards)
    expect(cardIds.length).toBe(1)
    expect(doc.cards[cardIds[0]].title).toBe('Test Card')
    expect(doc.cards[cardIds[0]].columnId).toBe(columnId)
  })

  it('moves a card between columns', () => {
    let doc = createEmptyBoard('Test')
    doc = addColumn(doc, 'Column 1', 'a')
    doc = addColumn(doc, 'Column 2', 'b')
    const col1Id = doc.columns[0].id
    const col2Id = doc.columns[1].id
    doc = addCard(doc, col1Id, 'Test Card', 'a')
    const cardId = Object.keys(doc.cards)[0]

    doc = moveCard(doc, cardId, col2Id, 'm')

    expect(doc.cards[cardId].columnId).toBe(col2Id)
    expect(doc.cards[cardId].position).toBe('m')
  })

  it('updates card properties', () => {
    let doc = createEmptyBoard('Test')
    doc = addColumn(doc, 'Column 1', 'a')
    const columnId = doc.columns[0].id
    doc = addCard(doc, columnId, 'Test Card', 'a')
    const cardId = Object.keys(doc.cards)[0]

    doc = updateCard(doc, cardId, { title: 'Updated', description: 'New desc' })

    expect(doc.cards[cardId].title).toBe('Updated')
    expect(doc.cards[cardId].description).toBe('New desc')
  })

  it('adds comment to card', () => {
    let doc = createEmptyBoard('Test')
    doc = addColumn(doc, 'Column 1', 'a')
    const columnId = doc.columns[0].id
    doc = addCard(doc, columnId, 'Test Card', 'a')
    const cardId = Object.keys(doc.cards)[0]

    doc = addComment(doc, cardId, 'commitment123', 'Hello!')

    expect(doc.cards[cardId].comments.length).toBe(1)
    expect(doc.cards[cardId].comments[0].text).toBe('Hello!')
    expect(doc.cards[cardId].comments[0].author).toBe('commitment123')
  })
})
```

**Step 2: Run test to verify it fails**

Run:
```bash
npx vitest run src/lib/automerge/operations.test.ts
```

Expected: FAIL

**Step 3: Write minimal implementation**

Create `src/lib/automerge/operations.ts`:

```typescript
import * as Automerge from '@automerge/automerge'
import type { BoardContent, Card, Column } from '../../types/board'

export function addColumn(
  doc: Automerge.Doc<BoardContent>,
  title: string,
  position: string
): Automerge.Doc<BoardContent> {
  return Automerge.change(doc, (d) => {
    d.columns.push({
      id: crypto.randomUUID(),
      title,
      position,
    })
  })
}

export function removeColumn(
  doc: Automerge.Doc<BoardContent>,
  columnId: string
): Automerge.Doc<BoardContent> {
  return Automerge.change(doc, (d) => {
    const index = d.columns.findIndex((c) => c.id === columnId)
    if (index !== -1) {
      d.columns.splice(index, 1)
    }
    // Remove cards in this column
    for (const cardId of Object.keys(d.cards)) {
      if (d.cards[cardId].columnId === columnId) {
        delete d.cards[cardId]
      }
    }
  })
}

export function addCard(
  doc: Automerge.Doc<BoardContent>,
  columnId: string,
  title: string,
  position: string
): Automerge.Doc<BoardContent> {
  return Automerge.change(doc, (d) => {
    const id = crypto.randomUUID()
    const now = Date.now()
    d.cards[id] = {
      id,
      columnId,
      position,
      title,
      description: '',
      labels: [],
      dueDate: null,
      assignee: null,
      checklist: [],
      attachments: [],
      comments: [],
      createdAt: now,
      updatedAt: now,
    }
  })
}

export function moveCard(
  doc: Automerge.Doc<BoardContent>,
  cardId: string,
  columnId: string,
  position: string
): Automerge.Doc<BoardContent> {
  return Automerge.change(doc, (d) => {
    if (d.cards[cardId]) {
      d.cards[cardId].columnId = columnId
      d.cards[cardId].position = position
      d.cards[cardId].updatedAt = Date.now()
    }
  })
}

export function updateCard(
  doc: Automerge.Doc<BoardContent>,
  cardId: string,
  updates: Partial<Pick<Card, 'title' | 'description' | 'labels' | 'dueDate' | 'assignee'>>
): Automerge.Doc<BoardContent> {
  return Automerge.change(doc, (d) => {
    if (d.cards[cardId]) {
      Object.assign(d.cards[cardId], updates)
      d.cards[cardId].updatedAt = Date.now()
    }
  })
}

export function addComment(
  doc: Automerge.Doc<BoardContent>,
  cardId: string,
  author: string,
  text: string
): Automerge.Doc<BoardContent> {
  return Automerge.change(doc, (d) => {
    if (d.cards[cardId]) {
      d.cards[cardId].comments.push({
        id: crypto.randomUUID(),
        author,
        text,
        createdAt: Date.now(),
      })
      d.cards[cardId].updatedAt = Date.now()
    }
  })
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
npx vitest run src/lib/automerge/operations.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Automerge board operations"
```

---

### Task 5.4: Automerge Module Index

**Files:**
- Create: `src/lib/automerge/index.ts`

**Step 1: Create barrel export**

Create `src/lib/automerge/index.ts`:

```typescript
export { createEmptyBoard, initializeBoard } from './schema'
export {
  addColumn,
  removeColumn,
  addCard,
  moveCard,
  updateCard,
  addComment,
} from './operations'
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add Automerge module index"
```

---

## Phase 6: UI Components

### Task 6.1: Board List Component

**Files:**
- Create: `src/sidepanel/components/BoardList.tsx`

**Step 1: Create components directory**

Run:
```bash
mkdir -p src/sidepanel/components
```

**Step 2: Create BoardList component**

Create `src/sidepanel/components/BoardList.tsx`:

```tsx
import { Signal } from '@preact/signals'

interface Board {
  id: string
  name: string
  lastAccessed: number
}

interface BoardListProps {
  boards: Signal<Board[]>
  onSelect: (boardId: string) => void
  onCreate: () => void
}

export function BoardList({ boards, onSelect, onCreate }: BoardListProps) {
  return (
    <div class="p-4">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-xl font-bold">Boards</h1>
        <button
          onClick={onCreate}
          class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + New
        </button>
      </div>

      {boards.value.length === 0 ? (
        <p class="text-gray-500">No boards yet. Create one to get started.</p>
      ) : (
        <ul class="space-y-2">
          {boards.value.map((board) => (
            <li key={board.id}>
              <button
                onClick={() => onSelect(board.id)}
                class="w-full text-left p-3 bg-white rounded shadow hover:shadow-md transition-shadow"
              >
                <div class="font-medium">{board.name}</div>
                <div class="text-sm text-gray-500">
                  Last accessed: {new Date(board.lastAccessed).toLocaleDateString()}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add BoardList component"
```

---

### Task 6.2: Column Component

**Files:**
- Create: `src/sidepanel/components/Column.tsx`

**Step 1: Create Column component**

Create `src/sidepanel/components/Column.tsx`:

```tsx
import type { Column as ColumnType, Card } from '../../types/board'

interface ColumnProps {
  column: ColumnType
  cards: Card[]
  onAddCard: () => void
  onCardClick: (cardId: string) => void
  onCardDrop: (cardId: string, position: string) => void
}

export function Column({
  column,
  cards,
  onAddCard,
  onCardClick,
  onCardDrop,
}: ColumnProps) {
  const sortedCards = [...cards].sort((a, b) => a.position.localeCompare(b.position))

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    const cardId = e.dataTransfer?.getData('text/plain')
    if (cardId) {
      // Calculate position based on drop location
      const position = 'm' // Simplified for now
      onCardDrop(cardId, position)
    }
  }

  return (
    <div
      class="flex-shrink-0 w-72 bg-gray-200 rounded-lg p-2"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div class="flex justify-between items-center mb-2 px-2">
        <h3 class="font-semibold text-gray-700">{column.title}</h3>
        <span class="text-sm text-gray-500">{cards.length}</span>
      </div>

      <div class="space-y-2 min-h-[100px]">
        {sortedCards.map((card) => (
          <div
            key={card.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer?.setData('text/plain', card.id)
            }}
            onClick={() => onCardClick(card.id)}
            class="bg-white p-3 rounded shadow cursor-pointer hover:shadow-md transition-shadow"
          >
            <div class="font-medium text-sm">{card.title}</div>
            {card.labels.length > 0 && (
              <div class="flex gap-1 mt-2">
                {card.labels.map((label) => (
                  <span
                    key={label}
                    class="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
            {card.dueDate && (
              <div class="text-xs text-gray-500 mt-2">
                Due: {new Date(card.dueDate).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onAddCard}
        class="w-full mt-2 p-2 text-gray-500 hover:bg-gray-300 rounded text-sm"
      >
        + Add card
      </button>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add Column component"
```

---

### Task 6.3: Board Component

**Files:**
- Create: `src/sidepanel/components/Board.tsx`

**Step 1: Create Board component**

Create `src/sidepanel/components/Board.tsx`:

```tsx
import { Signal } from '@preact/signals'
import type { BoardContent } from '../../types/board'
import { Column } from './Column'

interface BoardProps {
  board: Signal<BoardContent | null>
  onBack: () => void
  onAddCard: (columnId: string) => void
  onCardClick: (cardId: string) => void
  onMoveCard: (cardId: string, columnId: string, position: string) => void
}

export function Board({
  board,
  onBack,
  onAddCard,
  onCardClick,
  onMoveCard,
}: BoardProps) {
  if (!board.value) {
    return <div class="p-4">Loading...</div>
  }

  const sortedColumns = [...board.value.columns].sort((a, b) =>
    a.position.localeCompare(b.position)
  )

  return (
    <div class="h-full flex flex-col">
      <div class="flex items-center gap-4 p-4 border-b">
        <button
          onClick={onBack}
          class="text-gray-600 hover:text-gray-900"
        >
          ← Back
        </button>
        <h1 class="text-xl font-bold">{board.value.name}</h1>
      </div>

      <div class="flex-1 overflow-x-auto p-4">
        <div class="flex gap-4 h-full">
          {sortedColumns.map((column) => {
            const columnCards = Object.values(board.value!.cards).filter(
              (card) => card.columnId === column.id
            )
            return (
              <Column
                key={column.id}
                column={column}
                cards={columnCards}
                onAddCard={() => onAddCard(column.id)}
                onCardClick={onCardClick}
                onCardDrop={(cardId, position) => onMoveCard(cardId, column.id, position)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add Board component"
```

---

### Task 6.4: CardModal Component

**Files:**
- Create: `src/sidepanel/components/CardModal.tsx`

**Step 1: Create CardModal component**

Create `src/sidepanel/components/CardModal.tsx`:

```tsx
import { Signal, signal } from '@preact/signals'
import type { Card, BoardContent } from '../../types/board'

interface CardModalProps {
  card: Signal<Card | null>
  members: Signal<BoardContent['members']>
  myCommitment: string
  onClose: () => void
  onUpdate: (updates: Partial<Card>) => void
  onAddComment: (text: string) => void
}

export function CardModal({
  card,
  members,
  myCommitment,
  onClose,
  onUpdate,
  onAddComment,
}: CardModalProps) {
  const commentText = signal('')

  if (!card.value) return null

  function getMemberName(commitment: string): string {
    return members.value[commitment]?.displayName || 'Unknown'
  }

  function handleSubmitComment(e: Event) {
    e.preventDefault()
    if (commentText.value.trim()) {
      onAddComment(commentText.value.trim())
      commentText.value = ''
    }
  }

  return (
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="p-4 border-b flex justify-between items-start">
          <input
            type="text"
            value={card.value.title}
            onInput={(e) => onUpdate({ title: (e.target as HTMLInputElement).value })}
            class="text-xl font-bold w-full bg-transparent border-none focus:outline-none"
          />
          <button onClick={onClose} class="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div class="p-4 space-y-4">
          {/* Description */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={card.value.description}
              onInput={(e) =>
                onUpdate({ description: (e.target as HTMLTextAreaElement).value })
              }
              class="w-full p-2 border rounded min-h-[100px]"
              placeholder="Add a description..."
            />
          </div>

          {/* Due Date */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={
                card.value.dueDate
                  ? new Date(card.value.dueDate).toISOString().split('T')[0]
                  : ''
              }
              onInput={(e) => {
                const val = (e.target as HTMLInputElement).value
                onUpdate({ dueDate: val ? new Date(val).getTime() : null })
              }}
              class="p-2 border rounded"
            />
          </div>

          {/* Checklist */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Checklist
            </label>
            <ul class="space-y-1">
              {card.value.checklist.map((item, index) => (
                <li key={item.id} class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={(e) => {
                      const newChecklist = [...card.value!.checklist]
                      newChecklist[index] = {
                        ...item,
                        done: (e.target as HTMLInputElement).checked,
                      }
                      onUpdate({ checklist: newChecklist })
                    }}
                  />
                  <span class={item.done ? 'line-through text-gray-400' : ''}>
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Comments */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Comments
            </label>
            <div class="space-y-2 mb-2">
              {card.value.comments.map((comment) => (
                <div key={comment.id} class="bg-gray-50 p-2 rounded">
                  <div class="text-sm font-medium">
                    {getMemberName(comment.author)}
                  </div>
                  <div class="text-sm">{comment.text}</div>
                  <div class="text-xs text-gray-400">
                    {new Date(comment.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSubmitComment} class="flex gap-2">
              <input
                type="text"
                value={commentText.value}
                onInput={(e) => {
                  commentText.value = (e.target as HTMLInputElement).value
                }}
                class="flex-1 p-2 border rounded"
                placeholder="Add a comment..."
              />
              <button
                type="submit"
                class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add CardModal component"
```

---

## Phase 7: Cloudflare Backend

This phase will be documented in a separate plan file due to length.

See: `docs/plans/2025-12-10-zkkb-backend.md`

---

## Phase 8: Integration & Polish

This phase will be documented in a separate plan file due to length.

See: `docs/plans/2025-12-10-zkkb-integration.md`

---

## Summary

**Phase 1:** Extension scaffold (5 tasks)
**Phase 2:** Crypto library (6 tasks)
**Phase 3:** Semaphore integration (5 tasks)
**Phase 4:** Storage layer (4 tasks)
**Phase 5:** Automerge integration (4 tasks)
**Phase 6:** UI components (4 tasks)
**Phase 7:** Cloudflare backend (separate doc)
**Phase 8:** Integration & polish (separate doc)

**Total Phase 1-6:** 28 tasks

Each task follows TDD: write failing test → verify failure → implement → verify pass → commit.
