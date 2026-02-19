'use client'

import { useEffect, useState } from 'react'
import { Product } from '@/lib/products'
import ProductCard from '@/components/ProductCard'
import PurchaseModal from '@/components/PurchaseModal'
import WalletBadge from '@/components/WalletBadge'
import Ticker from '@/components/Ticker'

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
          XRPL LEDGER · BLOCK #102,362,110
        </div>

        <h2 className="text-5xl sm:text-7xl font-black text-white mb-2 tracking-tight leading-none">
          <span className="gradient-text">AI AGENTS</span>
        </h2>
        <h2 className="text-5xl sm:text-7xl font-black text-white mb-6 tracking-tight leading-none">
          SPEND XRP
        </h2>

        <p className="text-zinc-500 max-w-md mx-auto text-sm leading-relaxed mb-10">
          The first virtual marketplace where AI agents transact with real XRP drops.
          Buy AI-generated content. Every purchase hits the XRP Ledger mainnet.
        </p>

        {/* Stats row */}
        <div className="flex flex-wrap items-center justify-center gap-8 mb-10">
          <div className="text-center">
            <div className="text-2xl font-black text-white text-glow-blue">~3s</div>
            <div className="text-xs text-zinc-600 font-mono mt-0.5">SETTLEMENT</div>
          </div>
          <div className="w-px h-8 bg-zinc-800" />
          <div className="text-center">
            <div className="text-2xl font-black text-white text-glow-green">1,500</div>
            <div className="text-xs text-zinc-600 font-mono mt-0.5">TPS</div>
          </div>
          <div className="w-px h-8 bg-zinc-800" />
          <div className="text-center">
            <div className="text-2xl font-black text-white text-glow-blue">100</div>
            <div className="text-xs text-zinc-600 font-mono mt-0.5">MIN DROPS</div>
          </div>
          <div className="w-px h-8 bg-zinc-800" />
          <div className="text-center">
            <div className="text-2xl font-black text-white">{products.length}</div>
            <div className="text-xs text-zinc-600 font-mono mt-0.5">PRODUCTS</div>
          </div>
        </div>

        {/* Agent API pill */}
        <div className="inline-flex flex-wrap items-center justify-center gap-3 bg-zinc-900/60 border border-zinc-800 rounded-xl px-5 py-3 text-xs font-mono">
          <span className="text-green-400">GET</span>
          <span className="text-zinc-300">/api/products</span>
          <span className="text-zinc-700">|</span>
          <span className="text-blue-400">POST</span>
          <span className="text-zinc-300">/api/verify</span>
          <span className="text-zinc-700">|</span>
          <span className="text-zinc-500">agent-readable endpoints</span>
        </div>
      </section>

      {/* Product Grid */}
      <section className="px-6 pb-20 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-800" />
          <span className="text-xs font-mono text-zinc-500 tracking-widest">MARKETPLACE</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-800" />
        </div>

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

      {/* Footer */}
      <footer className="border-t border-zinc-900 px-6 py-8 text-center">
        <p className="text-xs font-mono text-zinc-700">
          USEXRP · POWERED BY XRP LEDGER · AGENTS BY CLAUDE · {new Date().getFullYear()}
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
