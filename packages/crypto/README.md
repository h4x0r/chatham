# @chatham/crypto

End-to-end encryption library for Chatham.

## Features

- **BIP39 Recovery Phrases**: 24-word mnemonic generation and validation
- **Key Derivation**: Deterministic key derivation from seed using HKDF
- **AES-256-GCM**: Symmetric encryption for board content
- **X25519 Key Wrapping**: Asymmetric key exchange for sharing board keys

## Installation

```bash
npm install @chatham/crypto
```

## Usage

### Recovery Phrase

```typescript
import { generatePhrase, phraseToSeed, validatePhrase } from '@chatham/crypto'

// Generate a new 24-word recovery phrase
const phrase = generatePhrase()
console.log(phrase) // "abandon ability able ... zone zoo"

// Validate a phrase
if (validatePhrase(phrase)) {
  // Convert to seed for key derivation
  const seed = phraseToSeed(phrase)
}
```

### Key Derivation

```typescript
import { deriveKeys, phraseToSeed } from '@chatham/crypto'

const seed = phraseToSeed(phrase)
const { publicKey, privateKey } = deriveKeys(seed)
```

### Encryption

```typescript
import { generateKey, encrypt, decrypt } from '@chatham/crypto'

// Generate a random AES-256 key
const key = await generateKey()

// Encrypt data
const plaintext = new TextEncoder().encode('Hello, World!')
const { ciphertext, iv } = await encrypt(key, plaintext)

// Decrypt data
const decrypted = await decrypt(key, ciphertext, iv)
```

### Key Wrapping

```typescript
import { wrapKey, unwrapKey, deriveKeys } from '@chatham/crypto'

// Wrap a board key for a recipient
const recipient = deriveKeys(recipientSeed)
const wrapped = await wrapKey(boardKeyRaw, recipient.publicKey)

// Recipient unwraps with their private key
const unwrapped = await unwrapKey(wrapped, recipient.privateKey)
```

## Security

This library uses:
- **BIP39** for mnemonic phrases (256 bits entropy)
- **HKDF-SHA256** for key derivation
- **AES-256-GCM** for authenticated encryption
- **X25519** for key exchange (via @noble/curves)

All cryptographic operations use the Web Crypto API or audited libraries (@noble/*).

## License

MIT
