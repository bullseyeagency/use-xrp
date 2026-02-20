export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { verifyPayment } from '@/lib/xrpl'
import { appendStore, readStore } from '@/lib/storage'
import { ReferralCode } from '@/lib/types/referral'

const DROPS_REQUIRED = 5

function generateCode(): string {
  return Math.random().toString(36).toUpperCase().slice(2, 10)
}

export async function POST(req: NextRequest) {
  try {
    const { txHash } = await req.json()

    if (!txHash) {
      return NextResponse.json({ error: 'txHash required' }, { status: 400 })
    }

    const merchantAddress = process.env.MERCHANT_WALLET_ADDRESS
    if (!merchantAddress) {
      return NextResponse.json({ error: 'Merchant wallet not configured' }, { status: 500 })
    }

    const existing = await readStore<ReferralCode>('referrals.json')
    if (existing.some((r) => r.createTxHash === txHash)) {
      return NextResponse.json({ error: 'Transaction already used' }, { status: 409 })
    }

    const payment = await verifyPayment(txHash, DROPS_REQUIRED, merchantAddress)
    if (!payment.verified) {
      return NextResponse.json({ error: 'Payment not verified' }, { status: 402 })
    }

    // Ensure unique code
    let code = generateCode()
    while (existing.some((r) => r.code === code)) {
      code = generateCode()
    }

    const referral: ReferralCode = {
      id: randomUUID(),
      code,
      ownerAddress: payment.fromAddress!,
      createTxHash: txHash,
      createdAt: Date.now(),
      totalEarned: 0,
      referredAddresses: [],
    }

    await appendStore('referrals.json', referral)

    return NextResponse.json({ success: true, code, ownerAddress: referral.ownerAddress })
  } catch (err) {
    console.error('Referral create error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
