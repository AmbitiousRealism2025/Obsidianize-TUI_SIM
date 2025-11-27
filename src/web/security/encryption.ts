/**
 * Client-side encryption for API keys
 * Uses Web Crypto API (SubtleCrypto) for secure encryption
 */

export interface EncryptedData {
  encrypted: string;
  iv: string;
  salt: string;
}

/**
 * Derives an encryption key from a user passphrase using PBKDF2
 */
async function deriveKey(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passphraseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    passphraseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts data using AES-GCM
 */
export async function encrypt(
  data: string,
  passphrase: string
): Promise<EncryptedData> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(data)
  );

  return {
    encrypted: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv),
    salt: arrayBufferToBase64(salt),
  };
}

/**
 * Decrypts data using AES-GCM
 */
export async function decrypt(
  encryptedData: EncryptedData,
  passphrase: string
): Promise<string> {
  const salt = base64ToArrayBuffer(encryptedData.salt);
  const iv = base64ToArrayBuffer(encryptedData.iv);
  const encrypted = base64ToArrayBuffer(encryptedData.encrypted);
  const key = await deriveKey(passphrase, new Uint8Array(salt));

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    throw new Error("Decryption failed. Invalid passphrase or corrupted data.");
  }
}

/**
 * Converts ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts Base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Storage key for encrypted API key
 */
const STORAGE_KEY = "obsidianize_encrypted_api_key";

/**
 * Saves encrypted API key to localStorage
 */
export async function saveApiKey(
  apiKey: string,
  passphrase: string
): Promise<void> {
  const encrypted = await encrypt(apiKey, passphrase);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(encrypted));
}

/**
 * Loads and decrypts API key from localStorage
 */
export async function loadApiKey(passphrase: string): Promise<string | null> {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    const encrypted = JSON.parse(stored) as EncryptedData;
    return await decrypt(encrypted, passphrase);
  } catch (error) {
    console.error("Failed to decrypt API key:", error);
    return null;
  }
}

/**
 * Removes encrypted API key from localStorage
 */
export function clearApiKey(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Checks if an encrypted API key exists in localStorage
 */
export function hasStoredApiKey(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

/**
 * Generates a device-specific passphrase
 * Uses browser fingerprint elements for consistent device-based encryption
 */
export function generateDevicePassphrase(): string {
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    screen.colorDepth,
    screen.width + "x" + screen.height,
  ].join("|");

  // Create a simple hash of the fingerprint
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return `device_${Math.abs(hash).toString(36)}`;
}
