export interface ProofStamp {
  id: string
  agentAddress: string
  taskDescription: string
  taskResult: string
  verificationHash: string
  txHash: string
  stampedAt: number
  xrplBlock?: number
}
