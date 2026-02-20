export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { verifyPayment } from '@/lib/xrpl'
import { readStore, writeStore } from '@/lib/storage'
import { SkillAuction, AuctionBid } from '@/lib/types/auction'

const ANTI_SNIPE_BUFFER_MS = 60 * 1000 // extend by 1 min if bid in final minute

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

    const auctions = await readStore<SkillAuction>('auctions.json')
    const auction = auctions.find((a) => a.id === auctionId)

    if (!auction) return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
    if (auction.status !== 'active') return NextResponse.json({ error: 'Auction is not active' }, { status: 400 })
    if (Date.now() > auction.endsAt) return NextResponse.json({ error: 'Auction has ended' }, { status: 400 })

    // Check duplicate tx
    if (auction.bids.some((b) => b.bidTxHash === txHash)) {
      return NextResponse.json({ error: 'Transaction already used' }, { status: 409 })
    }

    const highestBid = auction.bids.sort((a, b) => b.drops - a.drops)[0]
    const minimumRequired = highestBid ? highestBid.drops + 1 : auction.minimumBid

    // Verify payment — actual drops sent IS the bid
    const payment = await verifyPayment(txHash, minimumRequired, merchantAddress)
    if (!payment.verified) {
      return NextResponse.json({
        error: `Payment not verified. Minimum bid is ${minimumRequired} drops.`,
      }, { status: 402 })
    }

    const now = Date.now()
    const bid: AuctionBid = {
      id: randomUUID(),
      auctionId,
      bidderAddress: payment.fromAddress!,
      drops: payment.drops!,
      bidTxHash: txHash,
      placedAt: now,
    }

    // Anti-snipe: extend if bid in final minute
    const timeRemaining = auction.endsAt - now
    const newEndsAt = timeRemaining < ANTI_SNIPE_BUFFER_MS
      ? auction.endsAt + ANTI_SNIPE_BUFFER_MS
      : auction.endsAt

    const updated = auctions.map((a) =>
      a.id === auctionId
        ? { ...a, bids: [...a.bids, bid], endsAt: newEndsAt }
        : a
    )
    await writeStore('auctions.json', updated)

    return NextResponse.json({
      success: true,
      bid,
      currentLeader: bid.bidderAddress,
      endsAt: newEndsAt,
    })
  } catch (err) {
    console.error('Auction bid error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
