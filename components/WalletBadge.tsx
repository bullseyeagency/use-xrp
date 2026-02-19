'use client'

interface Props {
  address: string
}

export default function WalletBadge({ address }: Props) {
  if (!address) return null

  const short = `${address.slice(0, 6)}...${address.slice(-4)}`

  return (
    <a
      href={`https://livenet.xrpl.org/accounts/${address}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 border border-green-500/30 bg-green-500/5 rounded-full px-3 py-1.5 hover:border-green-500/60 hover:bg-green-500/10 transition-all"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-glow" />
      <span className="text-xs font-mono text-green-400">{short}</span>
      <span className="hidden sm:inline text-xs text-zinc-600 font-mono">MAINNET</span>
    </a>
  )
}
