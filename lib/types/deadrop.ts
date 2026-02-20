export interface DeadDropMessage {
  id: string
  fromAddress: string
  toAddress: string
  content: string                  // plaintext (legacy) OR base64 encrypted blob
  storeTxHash: string
  storedAt: number
  expiresAt: number
  retrieved: boolean
  retrieveTxHash?: string
  retrievedAt?: number
  // E2E encryption fields
  encrypted?: boolean
  ephemeralPublicKey?: string      // sender's ephemeral EC public key (hex)
  encryptionVersion?: string       // 'ecies-secp256k1-aes256gcm-v1'
}
