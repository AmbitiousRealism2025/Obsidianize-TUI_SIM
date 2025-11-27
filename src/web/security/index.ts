/**
 * Client-side security module
 * Exports encryption utilities for API key management
 */

export {
  encrypt,
  decrypt,
  saveApiKey,
  loadApiKey,
  clearApiKey,
  hasStoredApiKey,
  generateDevicePassphrase,
  type EncryptedData,
} from "./encryption.js";
