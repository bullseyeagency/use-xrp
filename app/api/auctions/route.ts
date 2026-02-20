export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { readStore, writeStore } from '@/lib/storage'
import { SkillAuction } from '@/lib/types/auction'
import { randomUUID } from 'crypto'

const AUCTION_DURATION_MS = 10 * 60 * 1000 // 10 minutes

const SEED_AUCTIONS: Omit<SkillAuction, 'startedAt' | 'endsAt' | 'status' | 'bids'>[] = [
  {
    id: 'auction-001',
    skillName: 'Market Oracle',
    skillPrompt: 'You are an elite crypto market oracle with 20 years of trading experience. Analyze the current XRP market conditions, identify key support/resistance levels, predict short-term price movement with confidence levels, and provide 3 specific trade setups with entry, stop-loss, and target prices. Be direct and specific.',
    description: 'Elite crypto trading analysis. Get specific XRP trade setups with entry points, stop-loss, and targets.',
    minimumBid: 10,
    winnerId: undefined,
  },
  {
    id: 'auction-002',
    skillName: 'Forensic Investigator',
    skillPrompt: 'You are a blockchain forensics expert. Given any XRPL wallet address or transaction hash, trace fund flows, identify suspicious patterns, map connected addresses, and produce a detailed forensic report with risk ratings.',
    description: 'Deep blockchain forensics. Trace fund flows, identify wallet clusters, and generate risk reports.',
    minimumBid: 10,
    winnerId: undefined,
  },
  {
    id: 'auction-003',
    skillName: 'Negotiation Engine',
    skillPrompt: 'You are a master negotiator trained in FBI hostage negotiation tactics and Harvard negotiation principles. Given any negotiation scenario, provide a step-by-step tactical playbook: opening position, concession strategy, psychological levers, red lines, and closing techniques.',
    description: 'World-class negotiation tactics. FBI + Harvard methods. Get a complete tactical playbook for your deal.',
    minimumBid: 10,
    winnerId: undefined,
  },
]

export async function GET() {
  try {
    let auctions = await readStore<SkillAuction>('auctions.json')
    const now = Date.now()

    // Mark ended auctions
    auctions = auctions.map((a) => {
      if (a.status === 'active' && now > a.endsAt) {
        const highestBid = a.bids.sort((x, y) => y.drops - x.drops)[0]
        return { ...a, status: 'ended', winnerId: highestBid?.id }
      }
      return a
    })

    // If no active auctions, seed new ones
    const active = auctions.filter((a) => a.status === 'active')
    if (active.length === 0) {
      const newAuctions: SkillAuction[] = SEED_AUCTIONS.map((s) => ({
        ...s,
        id: `${s.id}-${randomUUID().slice(0, 8)}`,
        startedAt: now,
        endsAt: now + AUCTION_DURATION_MS,
        status: 'active',
        bids: [],
        winnerId: undefined,
      }))
      auctions = [...auctions, ...newAuctions]
    }

    await writeStore('auctions.json', auctions)

    return NextResponse.json({ auctions: auctions.filter((a) => a.status === 'active') })
  } catch (err) {
    console.error('Auctions GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
