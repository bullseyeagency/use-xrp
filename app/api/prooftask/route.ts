export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomUUID } from 'crypto'
import { verifyPayment } from '@/lib/xrpl'
import { appendStore, readStore } from '@/lib/storage'
import { ProofStamp } from '@/lib/types/proof'

const DROPS_REQUIRED = 1

export async function POST(req: NextRequest) {
  try {
    const { txHash, taskDescription, taskResult } = await req.json()

    if (!txHash || !taskDescription || !taskResult) {
      return NextResponse.json({ error: 'txHash, taskDescription, and taskResult required' }, { status: 400 })
    }

    const merchantAddress = process.env.MERCHANT_WALLET_ADDRESS
    if (!merchantAddress) {
      return NextResponse.json({ error: 'Merchant wallet not configured' }, { status: 500 })
    }

    // Prevent duplicate tx
    const existing = await readStore<ProofStamp>('proofs.json')
    if (existing.some((p) => p.txHash === txHash)) {
      return NextResponse.json({ error: 'Transaction already used' }, { status: 409 })
    }

    const payment = await verifyPayment(txHash, DROPS_REQUIRED, merchantAddress)
    if (!payment.verified) {
      return NextResponse.json({ error: 'Payment not verified' }, { status: 402 })
    }

    const stampedAt = Date.now()
    const verificationHash = createHash('sha256')
      .update(`${taskDescription}::${taskResult}::${stampedAt}`)
      .digest('hex')

    const stamp: ProofStamp = {
      id: randomUUID(),
      agentAddress: payment.fromAddress!,
      taskDescription,
      taskResult,
      verificationHash,
      txHash,
      stampedAt,
    }

    await appendStore('proofs.json', stamp)

    return NextResponse.json({ success: true, stamp })
  } catch (err) {
    console.error('Proof of task error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
