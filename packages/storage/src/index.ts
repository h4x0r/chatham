/**
 * @chatham/storage - IndexedDB storage layer
 * @packageDocumentation
 */

export { openDatabase, clearDatabase, type ZKKBDB } from './db'
export {
  saveIdentity,
  loadIdentity,
  hasIdentity,
  clearIdentity,
  type StoredIdentity,
} from './identity'
