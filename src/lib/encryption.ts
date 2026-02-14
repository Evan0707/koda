import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 16

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET environment variable is required for encrypting sensitive data')
  }
  // Derive a 32-byte key from the secret using scrypt
  return scryptSync(secret, 'kodaflow-salt', 32)
}

/**
 * Encrypt a plaintext string. Returns a hex-encoded string: salt:iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  // Format: iv:authTag:ciphertext (all hex)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt a previously encrypted string. Input format: iv:authTag:ciphertext
 */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey()
  const parts = encryptedData.split(':')

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format')
  }

  const [ivHex, authTagHex, ciphertext] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Check if a string looks like it's already encrypted (iv:authTag:ciphertext format)
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(':')
  if (parts.length !== 3) return false
  // Check that all parts are valid hex
  return parts.every(part => /^[0-9a-f]+$/i.test(part))
}

/**
 * Safely decrypt a value that might be plaintext (for migration compatibility).
 * If decryption fails, returns the raw value (assumed plaintext).
 */
export function safeDecrypt(value: string): string {
  if (!process.env.ENCRYPTION_SECRET) {
    // No encryption configured — return as-is
    return value
  }

  if (!isEncrypted(value)) {
    return value
  }

  try {
    return decrypt(value)
  } catch {
    // If decryption fails, assume it's plaintext (pre-migration data)
    return value
  }
}

/**
 * Encrypt a value only if ENCRYPTION_SECRET is configured.
 * Otherwise returns plaintext (graceful degradation).
 */
export function safeEncrypt(value: string): string {
  if (!process.env.ENCRYPTION_SECRET) {
    console.warn('[encryption] ENCRYPTION_SECRET not set — storing value in plaintext')
    return value
  }
  return encrypt(value)
}
