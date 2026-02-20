export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { verifyPayment } from '@/lib/xrpl'
import { readStore, writeStore } from '@/lib/storage'
import { SkillAuction } from '@/lib/types/auction'
import Anthropic from '@anthropic-ai/sdk'

const CLAIM_FEE_DROPS = 1
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { txHash, auctionId } = await req.json()

    if (!txHash || !auctionId) {
      return NextResponse.json({ error: 'txHash and auctionId required' }, { status: 400 })
    }

    const merchantAddress = process.env.MERCHANT_WALLET_ADDRESS
    if (!merchantAddress) {
      return NextResponse.json({ error: 'Merchant wallet not configured' }, { status: 500 })
    }

    const payment = await verifyPayment(txHash, CLAIM_FEE_DROPS, merchantAddress)
    if (!payment.verified) {
      return NextResponse.json({ error: 'Claim fee not verified' }, { status: 402 })
    }

    const auctions = await readStore<SkillAuction>('auctions.json')
    const auction = auctions.find((a) => a.id === auctionId)

    if (!auction) return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
    if (auction.status === 'claimed') return NextResponse.json({ error: 'Already claimed' }, { status: 409 })
    if (auction.status === 'active' && Date.now() < auction.endsAt) {
      return NextResponse.json({ error: 'Auction still active' }, { status: 400 })
    }

    const highestBid = [...auction.bids].sort((a, b) => b.drops - a.drops)[0]
    if (!highestBid) return NextResponse.json({ error: 'No bids on this auction' }, { status: 400 })

    if (payment.fromAddress !== highestBid.bidderAddress) {
      return NextResponse.json({ error: 'Only the winning bidder can claim' }, { status: 403 })
    }

    // Generate content using the skill prompt
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: auction.skillPrompt,
      messages: [{ role: 'user', content: `Execute your skill. Demonstrate your full capability as ${auction.skillName}.` }],
    })

    const skillOutput = (msg.content[0] as any).text as string

    const updated = auctions.map((a) =>
      a.id === auctionId
        ? { ...a, status: 'claimed' as const, claimTxHash: txHash }
        : a
    )
    await writeStore('auctions.json', updated)

    return NextResponse.json({
      success: true,
      skillName: auction.skillName,
      skillOutput,
      winningBid: highestBid.drops,
    })
  } catch (err) {
    console.error('Auction claim error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
