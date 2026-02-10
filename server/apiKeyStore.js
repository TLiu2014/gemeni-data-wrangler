/**
 * Encrypted API key storage (Option 1: single file).
 * Uses AES-256-GCM. Master key is stored in server/data/secret.key (generated on first start).
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const MASTER_KEY_PATH = path.join(DATA_DIR, 'secret.key');
const FILE_PATH = path.join(DATA_DIR, 'api-key.enc');
const ALGO = 'aes-256-gcm';
const KEY_LEN = 32;
const IV_LEN = 12;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Get or create the master key. On first run, generates a 32-byte key and writes server/data/secret.key.
 * Returns a 32-byte Buffer for AES-256.
 */
function getEncryptionKey() {
  ensureDataDir();
  if (fs.existsSync(MASTER_KEY_PATH)) {
    const hex = fs.readFileSync(MASTER_KEY_PATH, 'utf8').trim();
    if (hex.length === 64 && /^[0-9a-fA-F]+$/.test(hex)) {
      return Buffer.from(hex, 'hex');
    }
  }

  const masterKey = crypto.randomBytes(KEY_LEN);
  fs.writeFileSync(MASTER_KEY_PATH, masterKey.toString('hex'), 'utf8');
  return masterKey;
}

/**
 * Encrypt and save the API key to server/data/api-key.enc.
 * Returns { ok: true } or { ok: false, error: string }.
 */
function saveEncryptedApiKey(plainKey) {
  const key = getEncryptionKey();
  try {
    const iv = crypto.randomBytes(IV_LEN);
    const cipher = crypto.createCipheriv(ALGO, key, iv);
    const enc = Buffer.concat([
      cipher.update(plainKey, 'utf8'),
      cipher.final()
    ]);
    const authTag = cipher.getAuthTag();
    const line = [iv.toString('hex'), authTag.toString('hex'), enc.toString('hex')].join(':');
    ensureDataDir();
    fs.writeFileSync(FILE_PATH, line, 'utf8');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Read server/data/api-key.enc and decrypt.
 * Returns the plain API key string or null if missing/invalid.
 */
function getDecryptedApiKey() {
  const key = getEncryptionKey();
  if (!fs.existsSync(FILE_PATH)) {
    return null;
  }
  try {
    const line = fs.readFileSync(FILE_PATH, 'utf8').trim();
    const parts = line.split(':');
    if (parts.length !== 3) return null;
    const [ivHex, authTagHex, encHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const enc = Buffer.from(encHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(enc) + decipher.final('utf8');
  } catch (err) {
    console.warn('apiKeyStore: failed to read/decrypt:', err.message);
    return null;
  }
}

module.exports = {
  saveEncryptedApiKey,
  getDecryptedApiKey
};
