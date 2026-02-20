export interface DeadDropMessage {
  id: string
  fromAddress: string
  toAddress: string
  content: string
  storeTxHash: string
  storedAt: number
  expiresAt: number
  retrieved: boolean
  retrieveTxHash?: string
  retrievedAt?: number
}
