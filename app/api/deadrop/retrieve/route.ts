export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { verifyPayment } from '@/lib/xrpl'
import { readStore, writeStore } from '@/lib/storage'
import { DeadDropMessage } from '@/lib/types/deadrop'

const DROPS_REQUIRED = 3

export async function POST(req: NextRequest) {
  try {
    const { txHash, messageId } = await req.json()

    if (!txHash || !messageId) {
      return NextResponse.json({ error: 'txHash and messageId required' }, { status: 400 })
    }

    const merchantAddress = process.env.MERCHANT_WALLET_ADDRESS
    if (!merchantAddress) {
      return NextResponse.json({ error: 'Merchant wallet not configured' }, { status: 500 })
    }

    const payment = await verifyPayment(txHash, DROPS_REQUIRED, merchantAddress)
    if (!payment.verified) {
      return NextResponse.json({ error: 'Payment not verified' }, { status: 402 })
    }

    const messages = await readStore<DeadDropMessage>('messages.json')
    const message = messages.find((m) => m.id === messageId)

    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    if (message.retrieved) return NextResponse.json({ error: 'Message already retrieved' }, { status: 410 })
    if (Date.now() > message.expiresAt) return NextResponse.json({ error: 'Message expired' }, { status: 410 })
    if (payment.fromAddress !== message.toAddress) {
      return NextResponse.json({ error: 'Not the intended recipient' }, { status: 403 })
    }

    const updated = messages.map((m) =>
      m.id === messageId
        ? { ...m, retrieved: true, retrieveTxHash: txHash, retrievedAt: Date.now() }
        : m
    )
    await writeStore('messages.json', updated)

    return NextResponse.json({
      success: true,
      content: message.content,
      from: message.fromAddress,
      sentAt: message.storedAt,
      // Encryption metadata — decryption happens client-side
      encrypted: message.encrypted ?? false,
      ephemeralPublicKey: message.ephemeralPublicKey,
      encryptionVersion: message.encryptionVersion,
    })
  } catch (err) {
    console.error('Dead drop retrieve error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
