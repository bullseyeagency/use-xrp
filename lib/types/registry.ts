export interface AgentRecord {
  id: string
  walletAddress: string
  name: string
  description: string
  skills: string[]
  endpoint?: string
  registeredAt: number
  registerTxHash: string
}
