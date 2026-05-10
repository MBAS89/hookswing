import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// Load key from env. If missing/invalid, encryption is disabled (plaintext fallback).
function loadKey(): Buffer | null {
  const raw = process.env.HOOKSWING_ENCRYPTION_KEY;
  if (!raw) return null;
  // Support both base64-encoded and raw hex keys
  const key = raw.length === 64 ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
  if (key.length !== KEY_LENGTH) {
    console.warn(`[Encryption] HOOKSWING_ENCRYPTION_KEY length is ${key.length}, expected ${KEY_LENGTH}. Encryption disabled.`);
    return null;
  }
  return key;
}

const KEY = loadKey();

function isEnabled(): boolean {
  return KEY !== null;
}

function encryptString(plaintext: string): string {
  if (!KEY) return plaintext;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'base64')]);
  return 'enc:' + combined.toString('base64');
}

function decryptString(ciphertext: string | null): string | null {
  if (!ciphertext || !ciphertext.startsWith('enc:')) return ciphertext;
  if (!KEY) {
    console.warn('[Encryption] Cannot decrypt: HOOKSWING_ENCRYPTION_KEY not set');
    return ciphertext;
  }
  try {
    const combined = Buffer.from(ciphertext.slice(4), 'base64');
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err: any) {
    console.error('[Encryption] Decrypt failed:', err.message);
    return ciphertext;
  }
}

function encryptJson(value: any): any {
  if (!KEY || value === null || value === undefined) return value;
  const plaintext = JSON.stringify(value);
  return { __encrypted: encryptString(plaintext).slice(4) }; // strip 'enc:' prefix for JSON wrapper
}

function decryptJson(value: any): any {
  if (!value || typeof value !== 'object' || !value.__encrypted) return value;
  if (!KEY) {
    console.warn('[Encryption] Cannot decrypt JSON field: HOOKSWING_ENCRYPTION_KEY not set');
    return value;
  }
  try {
    const decrypted = decryptString('enc:' + value.__encrypted);
    if (decrypted && decrypted !== 'enc:' + value.__encrypted) {
      return JSON.parse(decrypted);
    }
    return value;
  } catch (err: any) {
    console.error('[Encryption] JSON decrypt failed:', err.message);
    return value;
  }
}

// Encrypt webhook fields before saving to DB
export function encryptWebhook(data: any): any {
  if (!isEnabled()) return data;
  const encrypted = { ...data };
  if (encrypted.headers !== undefined) encrypted.headers = encryptJson(encrypted.headers);
  if (encrypted.body !== undefined) encrypted.body = encryptJson(encrypted.body);
  if (encrypted.rawBody !== undefined && encrypted.rawBody !== null) {
    encrypted.rawBody = encryptString(encrypted.rawBody);
  }
  if (encrypted.query !== undefined) encrypted.query = encryptJson(encrypted.query);
  if (encrypted.responseBody !== undefined && encrypted.responseBody !== null) {
    encrypted.responseBody = encryptString(encrypted.responseBody);
  }
  return encrypted;
}

// Decrypt webhook fields after reading from DB
export function decryptWebhook(webhook: any): any {
  if (!webhook) return webhook;
  const decrypted = { ...webhook };
  if (decrypted.headers !== undefined) decrypted.headers = decryptJson(decrypted.headers);
  if (decrypted.body !== undefined) decrypted.body = decryptJson(decrypted.body);
  if (decrypted.rawBody !== undefined && decrypted.rawBody !== null) {
    decrypted.rawBody = decryptString(decrypted.rawBody);
  }
  if (decrypted.query !== undefined) decrypted.query = decryptJson(decrypted.query);
  if (decrypted.responseBody !== undefined && decrypted.responseBody !== null) {
    decrypted.responseBody = decryptString(decrypted.responseBody);
  }
  return decrypted;
}

// Decrypt an array of webhooks
export function decryptWebhooks(webhooks: any[]): any[] {
  return webhooks.map(decryptWebhook);
}

export function encryptionStatus(): { enabled: boolean; keyPresent: boolean } {
  return { enabled: isEnabled(), keyPresent: !!process.env.HOOKSWING_ENCRYPTION_KEY };
}
