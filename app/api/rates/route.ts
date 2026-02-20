export const runtime = 'nodejs'

import { NextResponse } from 'next/server'

const XRP_USD = 1.40
const DROPS_PER_XRP = 1_000_000
const BLENDED_RATE_PER_M = 8.00

const MODELS = {
  'haiku': {
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    inputPerM: 0.80,
    outputPerM: 4.00,
    blendedPerM: 2.40,
  },
  'sonnet': {
    name: 'Claude Sonnet 4.6',
    provider: 'Anthropic',
    inputPerM: 3.00,
    outputPerM: 15.00,
    blendedPerM: 9.00,
  },
  'grok-fast': {
    name: 'Grok 4 Fast',
    provider: 'xAI',
    inputPerM: 0.20,
    outputPerM: 0.50,
    blendedPerM: 0.34,
  },
  'gpt-4-1-mini': {
    name: 'GPT-4.1 Mini',
    provider: 'OpenAI',
    inputPerM: 0.40,
    outputPerM: 1.60,
    blendedPerM: 0.72,
  },
  'gpt-4-1': {
    name: 'GPT-4.1',
    provider: 'OpenAI',
    inputPerM: 2.00,
    outputPerM: 8.00,
    blendedPerM: 3.60,
  },
  'gemini-pro': {
    name: 'Gemini 3.1 Pro',
    provider: 'Google',
    inputPerM: 2.00,
    outputPerM: 12.00,
    blendedPerM: 5.60,
  },
}

function dropsPerToken(blendedPerM: number): number {
  return blendedPerM / XRP_USD
}

export async function GET() {
  const modelRates = Object.entries(MODELS).reduce((acc, [id, m]) => {
    acc[id] = {
      ...m,
      dropsPerToken: parseFloat(dropsPerToken(m.blendedPerM).toFixed(4)),
      tokensPerDrop: parseFloat((1 / dropsPerToken(m.blendedPerM)).toFixed(4)),
    }
    return acc
  }, {} as Record<string, any>)

  return NextResponse.json({
    xrpUsd: XRP_USD,
    dropsPerXrp: DROPS_PER_XRP,
    usdPerDrop: XRP_USD / DROPS_PER_XRP,
    consensusBlendedPerM: BLENDED_RATE_PER_M,
    consensusDropsPerToken: parseFloat(dropsPerToken(BLENDED_RATE_PER_M).toFixed(4)),
    consensusTokensPerDrop: parseFloat((1 / dropsPerToken(BLENDED_RATE_PER_M)).toFixed(4)),
    models: modelRates,
    updatedAt: new Date().toISOString(),
  })
}
