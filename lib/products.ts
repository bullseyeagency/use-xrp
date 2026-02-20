export interface Product {
  id: string
  name: string
  description: string
  drops: number
  xrp: number
  category: string
  outputType: 'conversation' | 'report' | 'analysis'
  prompt: string
}

export const PRODUCTS: Product[] = [
  {
    id: 'agent-greeting',
    name: 'Agent Greeting Exchange',
    description: 'Two AI agents introduce themselves and establish a working relationship.',
    drops: 2,
    xrp: 0.000002,
    category: 'Social',
    outputType: 'conversation',
    prompt: 'Generate a short, professional greeting exchange between two AI agents meeting for the first time. Agent A introduces itself and its capabilities. Agent B responds in kind. Keep it under 200 words.',
  },
  {
    id: 'market-analysis',
    name: 'XRP Market Analysis',
    description: 'Two agents debate and analyze the current XRP market landscape.',
    drops: 4,
    xrp: 0.000004,
    category: 'Finance',
    outputType: 'conversation',
    prompt: 'Generate a sharp, analytical conversation between two AI agents discussing the XRP ecosystem, use cases, and network growth. Include specific observations about XRPL technology. Under 400 words.',
  },
  {
    id: 'task-delegation',
    name: 'Task Delegation Protocol',
    description: 'Agent A assigns a structured task to Agent B with full context.',
    drops: 4,
    xrp: 0.000004,
    category: 'Operations',
    outputType: 'conversation',
    prompt: 'Generate a conversation where Agent A (manager) delegates a research task to Agent B (specialist). Include task definition, success criteria, and Agent B confirming understanding. Under 500 words.',
  },
  {
    id: 'research-exchange',
    name: 'Deep Research Exchange',
    description: 'Multi-turn research conversation between agents covering a topic in depth.',
    drops: 6,
    xrp: 0.000006,
    category: 'Research',
    outputType: 'report',
    prompt: 'Generate a thorough multi-turn conversation between two research AI agents exploring the future of AI-to-AI commerce on blockchain networks. Cover use cases, challenges, and opportunities. Under 800 words.',
  },
  {
    id: 'strategy-session',
    name: 'Strategy Session',
    description: 'Agents co-develop a strategic plan for a given domain.',
    drops: 8,
    xrp: 0.000008,
    category: 'Strategy',
    outputType: 'analysis',
    prompt: 'Generate a structured strategy session between two AI agents building a go-to-market plan for a new XRP-based service. Include situation analysis, key actions, and success metrics. Under 1000 words.',
  },
]

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id)
}

export function dropsToXRP(drops: number): number {
  return drops / 1_000_000
}

export function xrpToDrops(xrp: number): number {
  return Math.floor(xrp * 1_000_000)
}
