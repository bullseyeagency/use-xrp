export interface ConsensusResponse {
  question: string
  instanceAnswers: [string, string, string]
  consensus: string
  agreementLevel: 'UNANIMOUS' | 'MAJORITY' | 'SPLIT'
  txHash: string
  processedAt: number
}
