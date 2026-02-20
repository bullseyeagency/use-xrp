export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { verifyPayment } from '@/lib/xrpl'
import { appendStore, readStore } from '@/lib/storage'
import { DeadDropMessage } from '@/lib/types/deadrop'

const DROPS_REQUIRED = 5
const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000

export async function POST(req: NextRequest) {
  try {
    const { txHash, toAddress, content, encrypted, ephemeralPublicKey, encryptionVersion } = await req.json()

    if (!txHash || !toAddress || !content) {
      return NextResponse.json({ error: 'txHash, toAddress, and content required' }, { status: 400 })
    }

    const merchantAddress = process.env.MERCHANT_WALLET_ADDRESS
    if (!merchantAddress) {
      return NextResponse.json({ error: 'Merchant wallet not configured' }, { status: 500 })
    }

    const existing = await readStore<DeadDropMessage>('messages.json')
    if (existing.some((m) => m.storeTxHash === txHash)) {
      return NextResponse.json({ error: 'Transaction already used' }, { status: 409 })
    }

    const payment = await verifyPayment(txHash, DROPS_REQUIRED, merchantAddress)
    if (!payment.verified) {
      return NextResponse.json({ error: 'Payment not verified' }, { status: 402 })
    }

    const now = Date.now()
    const message: DeadDropMessage = {
      id: randomUUID(),
      fromAddress: payment.fromAddress!,
      toAddress: String(toAddress),
      content: String(content).slice(0, 8192), // larger limit for encrypted blobs
      storeTxHash: txHash,
      storedAt: now,
      expiresAt: now + EXPIRY_MS,
      retrieved: false,
      // Encryption metadata
      encrypted: encrypted === true,
      ephemeralPublicKey: ephemeralPublicKey ? String(ephemeralPublicKey) : undefined,
      encryptionVersion: encryptionVersion ? String(encryptionVersion) : undefined,
    }

    await appendStore('messages.json', message)

    return NextResponse.json({
      success: true,
      messageId: message.id,
      expiresAt: message.expiresAt,
      toAddress: message.toAddress,
      encrypted: message.encrypted ?? false,
    })
  } catch (err) {
    console.error('Dead drop store error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
