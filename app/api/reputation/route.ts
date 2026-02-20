export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { verifyPayment } from '@/lib/xrpl'
import { scoreWallet } from '@/lib/reputation'

const DROPS_REQUIRED = 5

export async function POST(req: NextRequest) {
  try {
    const { txHash, targetAddress } = await req.json()

    if (!txHash || !targetAddress) {
      return NextResponse.json({ error: 'txHash and targetAddress required' }, { status: 400 })
    }

    const merchantAddress = process.env.MERCHANT_WALLET_ADDRESS
    if (!merchantAddress) {
      return NextResponse.json({ error: 'Merchant wallet not configured' }, { status: 500 })
    }

    const payment = await verifyPayment(txHash, DROPS_REQUIRED, merchantAddress)
    if (!payment.verified) {
      return NextResponse.json({ error: 'Payment not verified' }, { status: 402 })
    }

    const reputation = await scoreWallet(targetAddress)

    return NextResponse.json({ success: true, reputation, checkedAt: Date.now() })
  } catch (err) {
    console.error('Reputation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
