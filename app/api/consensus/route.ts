export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { verifyPayment } from '@/lib/xrpl'
import { ConsensusResponse } from '@/lib/types/consensus'
import Anthropic from '@anthropic-ai/sdk'

const DROPS_REQUIRED = 20
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function askInstance(question: string, instanceId: number): Promise<string> {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: `You are AI Agent Instance #${instanceId} in a consensus system. Answer the question independently and concisely. Do not reference other instances. Be direct and specific.`,
    messages: [{ role: 'user', content: question }],
  })
  return (msg.content[0] as any).text as string
}

async function synthesize(question: string, answers: [string, string, string]): Promise<{ consensus: string; agreementLevel: ConsensusResponse['agreementLevel'] }> {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: 'You are a consensus analyzer. Given a question and 3 independent answers, identify where they agree, synthesize a consensus answer, and rate agreement as UNANIMOUS (all agree), MAJORITY (2 of 3 agree), or SPLIT (all differ). Output JSON only: { "consensus": "...", "agreementLevel": "..." }',
    messages: [{
      role: 'user',
      content: `Question: ${question}\n\nAnswer 1: ${answers[0]}\n\nAnswer 2: ${answers[1]}\n\nAnswer 3: ${answers[2]}`,
    }],
  })
  const text = (msg.content[0] as any).text as string
  const match = text.match(/\{[\s\S]*\}/)
  if (match) {
    const parsed = JSON.parse(match[0])
    return { consensus: parsed.consensus, agreementLevel: parsed.agreementLevel }
  }
  return { consensus: answers[0], agreementLevel: 'SPLIT' }
}

export async function POST(req: NextRequest) {
  try {
    const { txHash, question } = await req.json()

    if (!txHash || !question) {
      return NextResponse.json({ error: 'txHash and question required' }, { status: 400 })
    }

    const merchantAddress = process.env.MERCHANT_WALLET_ADDRESS
    if (!merchantAddress) {
      return NextResponse.json({ error: 'Merchant wallet not configured' }, { status: 500 })
    }

    const payment = await verifyPayment(txHash, DROPS_REQUIRED, merchantAddress)
    if (!payment.verified) {
      return NextResponse.json({ error: 'Payment not verified' }, { status: 402 })
    }

    const [a1, a2, a3] = await Promise.all([
      askInstance(question, 1),
      askInstance(question, 2),
      askInstance(question, 3),
    ])

    const { consensus, agreementLevel } = await synthesize(question, [a1, a2, a3])

    const result: ConsensusResponse = {
      question,
      instanceAnswers: [a1, a2, a3],
      consensus,
      agreementLevel,
      txHash,
      processedAt: Date.now(),
    }

    return NextResponse.json({ success: true, result })
  } catch (err) {
    console.error('Consensus error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
