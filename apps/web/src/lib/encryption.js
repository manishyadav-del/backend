import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.JWT_SECRET || 'fallback-secret-key-at-least-32-chars-long-12345';
// Ensure key length is exactly 32 bytes (256 bits)
const KEY = crypto.createHash('sha256').update(SECRET_KEY).digest();
const IV_LENGTH = 16; // AES block size

export function encryptText(text) {
  if (!text) return null;
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    return text; // Fallback
  }
}

export function decryptText(encryptedText) {
  if (!encryptedText) return null;
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      // If it doesn't have the IV prefix, return as is (could be unencrypted or fallback)
      return encryptedText;
    }
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedText; // Fallback
  }
}
