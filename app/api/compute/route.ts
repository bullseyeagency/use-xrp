export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { verifyPayment } from '@/lib/xrpl'
import Anthropic from '@anthropic-ai/sdk'

const XRP_USD = 1.40

// Blended $/M for each supported model
const MODEL_RATES: Record<string, { blendedPerM: number; apiModel: string; name: string }> = {
  'haiku': {
    name: 'Claude Haiku 4.5',
    apiModel: 'claude-haiku-4-5-20251001',
    blendedPerM: 2.40,
  },
  'sonnet': {
    name: 'Claude Sonnet 4.6',
    apiModel: 'claude-sonnet-4-6',
    blendedPerM: 9.00,
  },
}

function dropsToTokenBudget(drops: number, blendedPerM: number): number {
  // drops × (XRP_USD / 1_000_000) = USD value of drops
  // USD value / (blendedPerM / 1_000_000) = token budget
  const usdValue = drops * (XRP_USD / 1_000_000)
  return Math.floor(usdValue / (blendedPerM / 1_000_000))
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { txHash, prompt, model = 'haiku', systemPrompt } = await req.json()

    if (!txHash || !prompt) {
      return NextResponse.json({ error: 'txHash and prompt required' }, { status: 400 })
    }

    const modelConfig = MODEL_RATES[model]
    if (!modelConfig) {
      return NextResponse.json({
        error: `Unknown model. Supported: ${Object.keys(MODEL_RATES).join(', ')}`,
      }, { status: 400 })
    }

    const merchantAddress = process.env.MERCHANT_WALLET_ADDRESS
    if (!merchantAddress) {
      return NextResponse.json({ error: 'Merchant wallet not configured' }, { status: 500 })
    }

    // Minimum 1 drop to prevent spam
    const payment = await verifyPayment(txHash, 1, merchantAddress)
    if (!payment.verified) {
      return NextResponse.json({ error: 'Payment not verified' }, { status: 402 })
    }

    const dropsReceived = payment.drops!
    const tokenBudget = dropsToTokenBudget(dropsReceived, modelConfig.blendedPerM)

    if (tokenBudget < 10) {
      return NextResponse.json({
        error: `Insufficient drops. ${dropsReceived} drops = ${tokenBudget} tokens. Minimum 10 tokens required.`,
        dropsReceived,
        tokenBudget,
      }, { status: 402 })
    }

    // Cap at model's max reasonable output
    const maxTokens = Math.min(tokenBudget, 4096)

    const messages: Anthropic.MessageParam[] = [{ role: 'user', content: prompt }]

    const response = await client.messages.create({
      model: modelConfig.apiModel,
      max_tokens: maxTokens,
      messages,
      ...(systemPrompt ? { system: systemPrompt } : {}),
    })

    const outputText = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as any).text)
      .join('')

    const inputTokens = response.usage.input_tokens
    const outputTokens = response.usage.output_tokens
    const totalTokens = inputTokens + outputTokens
    const dropsConsumed = parseFloat((totalTokens * (modelConfig.blendedPerM / XRP_USD)).toFixed(4))
    const dropsRefundable = parseFloat((dropsReceived - dropsConsumed).toFixed(4))

    return NextResponse.json({
      success: true,
      output: outputText,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens,
        dropsReceived,
        dropsConsumed,
        dropsRefundable,
        tokenBudget,
        model: modelConfig.name,
        rateDropsPerToken: parseFloat((modelConfig.blendedPerM / XRP_USD).toFixed(4)),
      },
      agentAddress: payment.fromAddress,
      txHash,
    })
  } catch (err) {
    console.error('Compute error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
