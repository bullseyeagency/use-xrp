export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { verifyPayment } from '@/lib/xrpl'
import { appendStore, readStore } from '@/lib/storage'
import { AgentRecord } from '@/lib/types/registry'

const DROPS_REQUIRED = 10

export async function POST(req: NextRequest) {
  try {
    const { txHash, name, description, skills, endpoint } = await req.json()

    if (!txHash || !name || !description || !Array.isArray(skills)) {
      return NextResponse.json({ error: 'txHash, name, description, and skills required' }, { status: 400 })
    }

    const merchantAddress = process.env.MERCHANT_WALLET_ADDRESS
    if (!merchantAddress) {
      return NextResponse.json({ error: 'Merchant wallet not configured' }, { status: 500 })
    }

    const existing = await readStore<AgentRecord>('agents.json')
    if (existing.some((a) => a.registerTxHash === txHash)) {
      return NextResponse.json({ error: 'Transaction already used' }, { status: 409 })
    }

    const payment = await verifyPayment(txHash, DROPS_REQUIRED, merchantAddress)
    if (!payment.verified) {
      return NextResponse.json({ error: 'Payment not verified' }, { status: 402 })
    }

    const agent: AgentRecord = {
      id: randomUUID(),
      walletAddress: payment.fromAddress!,
      name: String(name).slice(0, 64),
      description: String(description).slice(0, 256),
      skills: skills.map((s: unknown) => String(s).slice(0, 32)).slice(0, 10),
      endpoint: endpoint ? String(endpoint).slice(0, 128) : undefined,
      registeredAt: Date.now(),
      registerTxHash: txHash,
    }

    await appendStore('agents.json', agent)

    return NextResponse.json({ success: true, agent })
  } catch (err) {
    console.error('Registry register error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
