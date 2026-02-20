export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { verifyPayment } from '@/lib/xrpl'
import { readStore } from '@/lib/storage'
import { AgentRecord } from '@/lib/types/registry'

const DROPS_REQUIRED = 3

export async function POST(req: NextRequest) {
  try {
    const { txHash, query } = await req.json()

    if (!txHash || !query) {
      return NextResponse.json({ error: 'txHash and query required' }, { status: 400 })
    }

    const merchantAddress = process.env.MERCHANT_WALLET_ADDRESS
    if (!merchantAddress) {
      return NextResponse.json({ error: 'Merchant wallet not configured' }, { status: 500 })
    }

    const payment = await verifyPayment(txHash, DROPS_REQUIRED, merchantAddress)
    if (!payment.verified) {
      return NextResponse.json({ error: 'Payment not verified' }, { status: 402 })
    }

    const agents = await readStore<AgentRecord>('agents.json')
    const q = String(query).toLowerCase()

    const results = agents.filter((a) =>
      a.name.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.skills.some((s) => s.toLowerCase().includes(q))
    )

    return NextResponse.json({ success: true, agents: results, count: results.length, query })
  } catch (err) {
    console.error('Registry search error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
