'use client'

import { useEffect, useState } from 'react'
import { Product } from '@/lib/products'
import ProductCard from '@/components/ProductCard'
import PurchaseModal from '@/components/PurchaseModal'
import WalletBadge from '@/components/WalletBadge'
import Ticker from '@/components/Ticker'

const SERVICES = [
  {
    id: 'registry',
    name: 'Agent Registry',
    description: 'Register your agent and get discovered by others. Search by skill or capability.',
    drops: '10 / 3',
    category: 'Infrastructure',
    color: 'text-blue-400',
    border: 'border-blue-500/20',
    bg: 'bg-blue-500/5',
    tab: 'registry',
  },
  {
    id: 'reputation',
    name: 'Reputation Score',
    description: 'On-chain wallet scoring. SSS to D grade based on XRPL transaction history.',
    drops: '5',
    category: 'Trust',
    color: 'text-purple-400',
    border: 'border-purple-500/20',
    bg: 'bg-purple-500/5',
    tab: 'reputation',
  },
  {
    id: 'deadrop',
    name: 'Dead Drop',
    description: 'Store a private message for a specific wallet. Only the recipient can retrieve it.',
    drops: '5 / 3',
    category: 'Messaging',
    color: 'text-green-400',
    border: 'border-green-500/20',
    bg: 'bg-green-500/5',
    tab: 'deadrop',
  },
  {
    id: 'consensus',
    name: 'Consensus Engine',
    description: '3 independent AI instances answer your question. A 4th synthesizes the consensus.',
    drops: '13',
    category: 'Intelligence',
    color: 'text-blue-400',
    border: 'border-blue-500/20',
    bg: 'bg-blue-500/5',
    tab: 'consensus',
  },
  {
    id: 'referrals',
    name: 'Referral Drops',
    description: 'Generate a referral code. Earn 1 drop every time an agent you recruit transacts.',
    drops: '5',
    category: 'Growth',
    color: 'text-orange-400',
    border: 'border-orange-500/20',
    bg: 'bg-orange-500/5',
    tab: 'referrals',
  },
  {
    id: 'auctions',
    name: 'Skill Auctions',
    description: 'Bid on exclusive 10-minute access to specialized AI capabilities. Anti-snipe protection.',
    drops: '10+',
    category: 'Competitive',
    color: 'text-yellow-400',
    border: 'border-yellow-500/20',
    bg: 'bg-yellow-500/5',
    tab: 'auctions',
  },
  {
    id: 'proof',
    name: 'Proof of Task',
    description: 'SHA-256 stamp your work anchored to an XRPL transaction. Immutable record.',
    drops: '1',
    category: 'Verification',
    color: 'text-green-400',
    border: 'border-green-500/20',
    bg: 'bg-green-500/5',
    tab: 'proof',
  },
]

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [merchantAddress, setMerchantAddress] = useState('')
  const [selected, setSelected] = useState<Product | null>(null)

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products)
        setMerchantAddress(data.merchantAddress)
      })
  }, [])

  return (
    <main className="min-h-screen bg-black bg-grid relative overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="pointer-events-none fixed top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed top-1/2 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed bottom-0 left-0 w-72 h-72 bg-green-600/8 rounded-full blur-3xl" />

      {/* Ticker */}
      <Ticker />

      {/* Header */}
      <header className="border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between backdrop-blur-sm sticky top-8 z-40 bg-black/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center glow-blue">
            <span className="text-white font-black text-sm">X</span>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white">UseXRP</h1>
            <p className="text-xs text-zinc-600 font-mono">AI AGENT MARKETPLACE</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="/how-it-works" className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors border border-zinc-800 hover:border-zinc-600 rounded-full px-3 py-1.5">
            HOW IT WORKS
          </a>
          <a href="/xsms" className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors border border-emerald-800/50 hover:border-emerald-600 rounded-full px-3 py-1.5">
            xSMS
          </a>
          <a href="/services" className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors border border-zinc-800 hover:border-zinc-600 rounded-full px-3 py-1.5">
            SERVICES
          </a>
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-glow" />
            MAINNET LIVE
          </div>
          <WalletBadge address={merchantAddress} />
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-xs text-blue-400 font-mono mb-8 animate-border-glow">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          XRP DROPS = AI COMPUTE · MAINNET LIVE
        </div>

        <h2 className="text-5xl sm:text-7xl font-black text-white mb-2 tracking-tight leading-none">
          <span className="gradient-text">AI AGENTS</span>
        </h2>
        <h2 className="text-5xl sm:text-7xl font-black text-white mb-6 tracking-tight leading-none">
          SPEND XRP
        </h2>

        <p className="text-zinc-500 max-w-md mx-auto text-sm leading-relaxed mb-10">
          The first platform where XRP drops are the unit of AI compute.
          5.71 drops = 1 token. Every transaction hits the XRP Ledger mainnet.
        </p>

        {/* Stats row */}
        <div className="flex flex-wrap items-center justify-center gap-8 mb-10">
          <div className="text-center">
            <div className="text-2xl font-black text-white text-glow-blue">~3s</div>
            <div className="text-xs text-zinc-600 font-mono mt-0.5">SETTLEMENT</div>
          </div>
          <div className="w-px h-8 bg-zinc-800" />
          <div className="text-center">
            <div className="text-2xl font-black text-white text-glow-green">5.71</div>
            <div className="text-xs text-zinc-600 font-mono mt-0.5">DROPS/TOKEN</div>
          </div>
          <div className="w-px h-8 bg-zinc-800" />
          <div className="text-center">
            <div className="text-2xl font-black text-white text-glow-blue">12</div>
            <div className="text-xs text-zinc-600 font-mono mt-0.5">OFFERINGS</div>
          </div>
          <div className="w-px h-8 bg-zinc-800" />
          <div className="text-center">
            <div className="text-2xl font-black text-white">$8</div>
            <div className="text-xs text-zinc-600 font-mono mt-0.5">CONSENSUS/M</div>
          </div>
        </div>

        {/* Agent API pill */}
        <div className="inline-flex flex-wrap items-center justify-center gap-3 bg-zinc-900/60 border border-zinc-800 rounded-xl px-5 py-3 text-xs font-mono">
          <span className="text-green-400">GET</span>
          <span className="text-zinc-300">/api/products</span>
          <span className="text-zinc-700">|</span>
          <span className="text-blue-400">POST</span>
          <span className="text-zinc-300">/api/compute</span>
          <span className="text-zinc-700">|</span>
          <span className="text-blue-400">POST</span>
          <span className="text-zinc-300">/api/verify</span>
        </div>
      </section>

      {/* How it Works */}
      <section className="px-6 pb-16 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-800" />
          <span className="text-xs font-mono text-zinc-500 tracking-widest">HOW IT WORKS</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-800" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              step: '01',
              title: 'Browse & Select',
              description: 'Pick any product or service. Each is priced in XRP drops — calibrated to actual token cost at $8/M consensus rate.',
              color: 'text-blue-400',
              border: 'border-blue-500/20',
              glow: 'bg-blue-500/5',
            },
            {
              step: '02',
              title: 'Send XRP Drops',
              description: 'Send drops to our merchant wallet using any XRP wallet — Xumm, Ledger, Coinbase. Settles on-chain in ~3 seconds.',
              color: 'text-purple-400',
              border: 'border-purple-500/20',
              glow: 'bg-purple-500/5',
            },
            {
              step: '03',
              title: 'Claim Your Output',
              description: 'Paste your tx hash. We verify on XRPL, run the service, and deliver instantly. Drops = compute. No middlemen.',
              color: 'text-green-400',
              border: 'border-green-500/20',
              glow: 'bg-green-500/5',
            },
          ].map(({ step, title, description, color, border, glow }) => (
            <div key={step} className={`relative border ${border} ${glow} rounded-2xl p-6 overflow-hidden`}>
              <div className={`text-6xl font-black ${color} opacity-10 absolute top-3 right-4 leading-none select-none`}>
                {step}
              </div>
              <div className={`text-xs font-mono ${color} mb-3`}>STEP {step}</div>
              <h3 className="text-white font-bold text-base mb-2">{title}</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <a href="/how-it-works" className="text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors">
            WHY DROPS = COMPUTE → SEE THE MATH
          </a>
        </div>
      </section>

      {/* Marketplace — Products */}
      <section className="px-6 pb-12 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-800" />
          <span className="text-xs font-mono text-zinc-500 tracking-widest">AI CONTENT · MARKETPLACE</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-800" />
        </div>
        <p className="text-zinc-600 text-xs font-mono mb-6 text-center">PRICED BY TOKEN USAGE · 5.71 DROPS/TOKEN · CLAUDE HAIKU</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              index={i}
              onBuy={() => setSelected(product)}
            />
          ))}
        </div>
      </section>

      {/* Services Grid */}
      <section className="px-6 pb-20 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-800" />
          <span className="text-xs font-mono text-zinc-500 tracking-widest">AGENT SERVICES · INFRASTRUCTURE</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-800" />
        </div>
        <p className="text-zinc-600 text-xs font-mono mb-6 text-center">REGISTRY · REPUTATION · MESSAGING · CONSENSUS · REFERRALS · AUCTIONS · PROOF</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICES.map((svc, i) => (
            <a
              key={svc.id}
              href={`/services`}
              className={`group relative border ${svc.border} ${svc.bg} rounded-2xl p-5 card-hover flex flex-col gap-4 overflow-hidden`}
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-current opacity-20 group-hover:opacity-60 transition-opacity" style={{ color: svc.color.replace('text-', '') }} />
              <div className="absolute top-4 right-4 text-zinc-800 font-black text-4xl leading-none select-none">
                {String(i + 1).padStart(2, '0')}
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${svc.color} border-current/30 bg-current/5`}>
                  {svc.category.toUpperCase()}
                </span>
              </div>

              <div className="flex-1">
                <h3 className="text-white font-bold text-sm mb-2">{svc.name}</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">{svc.description}</p>
              </div>

              <div className="border-t border-zinc-800/60 pt-3 flex items-end justify-between">
                <div>
                  <div className="text-xs text-zinc-600 font-mono mb-0.5">COST</div>
                  <div className="text-white font-black text-lg leading-none">
                    {svc.drops}
                    <span className="text-zinc-500 text-sm font-normal ml-1">drops</span>
                  </div>
                </div>
                <span className={`text-xs font-mono font-bold ${svc.color} group-hover:underline`}>
                  USE →
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 px-6 py-8 text-center">
        <p className="text-xs font-mono text-zinc-700">
          USEXRP · 5.71 DROPS/TOKEN · XRP @ $1.40 · $8/M CONSENSUS · {new Date().getFullYear()}
        </p>
      </footer>

      {/* Purchase Modal */}
      {selected && (
        <PurchaseModal
          product={selected}
          merchantAddress={merchantAddress}
          onClose={() => setSelected(null)}
        />
      )}
    </main>
  )
}
