/**
 * Client-side E2E encryption for UseXRP Dead Drop.
 *
 * Uses ECIES (Elliptic Curve Integrated Encryption Scheme):
 * - Sender generates an ephemeral key pair
 * - ECDH(ephemeralPrivate, recipientPublic) → shared secret
 * - AES-256-GCM(sharedSecret, message) → encrypted blob
 * - Recipient: ECDH(recipientPrivate, ephemeralPublic) → same shared secret
 *
 * Server NEVER sees plaintext. Private keys NEVER leave the browser.
 * Only secp256k1 wallets supported in v1 (XRPL default).
 */

import * as secp from '@noble/secp256k1'

// ─── Public Key Lookup ────────────────────────────────────────────────────────

/**
 * Fetch an XRPL account's secp256k1 public key from the ledger.
 * Public key is exposed in SigningPubKey field of any signed transaction.
 */
export async function fetchPublicKey(address: string): Promise<string> {
  const res = await fetch('https://xrplcluster.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'account_tx',
      params: [{ account: address, limit: 10, ledger_index_min: -1 }],
    }),
  })

  const data = await res.json()
  const transactions = data.result?.transactions ?? []

  for (const t of transactions) {
    const key: string | undefined = t.tx?.SigningPubKey
    // secp256k1 keys are 33 bytes (66 hex chars), NOT starting with "ED"
    if (key && key.length === 66 && !key.startsWith('ED')) {
      return key
    }
  }

  throw new Error(
    `No secp256k1 public key found for ${address}. ` +
    `The account may not have transacted yet, or may use Ed25519 (not supported in v1).`
  )
}

// ─── Shared Secret Derivation ─────────────────────────────────────────────────

async function deriveAesKey(
  privateKeyBytes: Uint8Array,
  publicKeyHex: string
): Promise<CryptoKey> {
  const publicKeyBytes = hexToBytes(publicKeyHex)
  const sharedPoint = secp.getSharedSecret(privateKeyBytes, publicKeyBytes, true)
  // Hash x-coordinate via Web Crypto (browser-native, correct types)
  const keyMaterial = await crypto.subtle.digest('SHA-256', sharedPoint.slice(1, 33))
  return crypto.subtle.importKey('raw', keyMaterial, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

// ─── Encrypt ─────────────────────────────────────────────────────────────────

export interface EncryptedPayload {
  encryptedBlob: string   // base64(iv[12] + ciphertext + authTag[16])
  ephemeralPublicKey: string  // hex — recipient needs this to decrypt
  recipientAddress: string
  version: 'ecies-secp256k1-aes256gcm-v1'
}

/**
 * Encrypt a message for a recipient using their XRPL public key.
 * Sender does NOT need to provide their private key.
 */
export async function encryptForRecipient(
  recipientPublicKeyHex: string,
  message: string,
  recipientAddress: string
): Promise<EncryptedPayload> {
  // Generate ephemeral key pair (one-time use per message)
  const ephemeralPrivate = secp.utils.randomSecretKey()
  const ephemeralPublic = secp.getPublicKey(ephemeralPrivate, true) // compressed

  // Derive shared AES key
  const aesKey = await deriveAesKey(ephemeralPrivate, recipientPublicKeyHex)

  // Encrypt with AES-256-GCM
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(message)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, encoded)

  // Pack: iv(12) + ciphertext+tag
  const combined = new Uint8Array(12 + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), 12)

  return {
    encryptedBlob: bytesToBase64(combined),
    ephemeralPublicKey: bytesToHex(ephemeralPublic),
    recipientAddress,
    version: 'ecies-secp256k1-aes256gcm-v1',
  }
}

// ─── Decrypt ─────────────────────────────────────────────────────────────────

/**
 * Decrypt a message using the recipient's XRPL private key (seed → privateKey).
 * Private key is used locally only — never transmitted.
 */
export async function decryptFromSender(
  myPrivateKeyHex: string,
  ephemeralPublicKeyHex: string,
  encryptedBlob: string
): Promise<string> {
  // Strip leading "00" prefix that xrpl.js adds to secp256k1 private keys
  const cleanKey = myPrivateKeyHex.startsWith('00')
    ? myPrivateKeyHex.slice(2)
    : myPrivateKeyHex

  const privateKeyBytes = hexToBytes(cleanKey)

  // Derive same shared AES key using our private key + sender's ephemeral public key
  const aesKey = await deriveAesKey(privateKeyBytes, ephemeralPublicKeyHex)

  // Unpack blob
  const combined = base64ToBytes(encryptedBlob)
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)

  // Decrypt
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, ciphertext)
  return new TextDecoder().decode(plaintext)
}

// ─── Key from Seed ────────────────────────────────────────────────────────────

/**
 * Derive private key hex from an XRPL seed (sXXX... format).
 * Uses xrpl Wallet client-side — private key never leaves browser.
 */
export async function privateKeyFromSeed(seed: string): Promise<string> {
  const { Wallet } = await import('xrpl')
  const wallet = Wallet.fromSeed(seed)
  return wallet.privateKey
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

function base64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
}
