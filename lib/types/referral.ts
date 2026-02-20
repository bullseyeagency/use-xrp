export interface ReferralCode {
  id: string
  code: string
  ownerAddress: string
  createTxHash: string
  createdAt: number
  totalEarned: number
  referredAddresses: string[]
}

export interface ReferralCredit {
  id: string
  referralCode: string
  referredAddress: string
  creditTxHash: string
  dropsEarned: number
  creditedAt: number
}
