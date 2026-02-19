import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function generateConversation(prompt: string): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    system:
      'You are a conversation generator for UseXRP, an AI agent marketplace built on the XRP Ledger. Generate realistic, professional exchanges between AI agents. Format output as a clean dialogue with "Agent A:" and "Agent B:" labels.',
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')
  return content.text
}
