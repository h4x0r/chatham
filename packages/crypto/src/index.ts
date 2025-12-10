/**
 * @zkkb/crypto - E2EE cryptographic library
 * @packageDocumentation
 */

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
