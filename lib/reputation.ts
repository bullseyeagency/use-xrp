import { getClient } from './xrpl'

export interface ReputationFactors {
  accountAge: number
  totalTransactions: number
  paymentCount: number
  uniqueCounterparties: number
  averageDropsSent: number
}

export interface ReputationResult {
  walletAddress: string
  score: number
  grade: 'SSS' | 'SS' | 'S' | 'A' | 'B' | 'C' | 'D' | 'UNRATED'
  factors: ReputationFactors
}

function grade(score: number): ReputationResult['grade'] {
  if (score >= 90) return 'SSS'
  if (score >= 80) return 'SS'
  if (score >= 70) return 'S'
  if (score >= 60) return 'A'
  if (score >= 50) return 'B'
  if (score >= 35) return 'C'
  if (score > 0) return 'D'
  return 'UNRATED'
}

export async function scoreWallet(walletAddress: string): Promise<ReputationResult> {
  const client = await getClient()

  try {
    // Get account info
    const accountInfo = await client.request({
      command: 'account_info',
      account: walletAddress,
      ledger_index: 'current',
    }).catch(() => null)

    if (!accountInfo) {
      return {
        walletAddress,
        score: 0,
        grade: 'UNRATED',
        factors: { accountAge: 0, totalTransactions: 0, paymentCount: 0, uniqueCounterparties: 0, averageDropsSent: 0 },
      }
    }

    const sequence = accountInfo.result.account_data.Sequence

    // Get recent transactions
    const txResponse = await client.request({
      command: 'account_tx',
      account: walletAddress,
      limit: 200,
    }).catch(() => null)

    const txList = txResponse?.result?.transactions ?? []
    const totalTxs = txList.length

    const payments = txList.filter((t: any) => t.tx?.TransactionType === 'Payment')
    const paymentCount = payments.length

    const counterparties = new Set<string>()
    let totalDropsSent = 0
    let paymentsSent = 0

    for (const p of payments) {
      const tx = p.tx as any
      if (tx.Account === walletAddress && typeof tx.Amount === 'string') {
        counterparties.add(tx.Destination)
        totalDropsSent += Number(tx.Amount)
        paymentsSent++
      }
      if (tx.Destination === walletAddress) {
        counterparties.add(tx.Account)
      }
    }

    const avgDropsSent = paymentsSent > 0 ? totalDropsSent / paymentsSent : 0

    // Score components (100 pts total)
    const agePts = Math.min(30, Math.floor(sequence / 10))         // 30 pts max
    const txPts = Math.min(30, Math.floor(totalTxs / 5))           // 30 pts max
    const counterpartyPts = Math.min(25, counterparties.size * 2)  // 25 pts max
    const avgPts = Math.min(15, Math.floor(avgDropsSent / 10000))  // 15 pts max

    const score = agePts + txPts + counterpartyPts + avgPts

    return {
      walletAddress,
      score,
      grade: grade(score),
      factors: {
        accountAge: sequence,
        totalTransactions: totalTxs,
        paymentCount,
        uniqueCounterparties: counterparties.size,
        averageDropsSent: Math.round(avgDropsSent),
      },
    }
  } finally {
    await client.disconnect()
  }
}
