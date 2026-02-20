export interface AuctionBid {
  id: string
  auctionId: string
  bidderAddress: string
  drops: number
  bidTxHash: string
  placedAt: number
}

export interface SkillAuction {
  id: string
  skillName: string
  skillPrompt: string
  description: string
  minimumBid: number
  startedAt: number
  endsAt: number
  status: 'active' | 'ended' | 'claimed'
  bids: AuctionBid[]
  winnerId?: string
  claimTxHash?: string
}
