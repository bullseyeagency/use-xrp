'use client'

import { useEffect, useState } from 'react'
import RegistryPanel from '@/components/services/RegistryPanel'
import ReputationPanel from '@/components/services/ReputationPanel'
import DeadDropPanel from '@/components/services/DeadDropPanel'
import ConsensusPanel from '@/components/services/ConsensusPanel'
import ReferralPanel from '@/components/services/ReferralPanel'
import AuctionPanel from '@/components/services/AuctionPanel'
import ProofTaskPanel from '@/components/services/ProofTaskPanel'

type Tab = 'registry' | 'reputation' | 'deadrop' | 'consensus' | 'referrals' | 'auctions' | 'proof'

const TABS: { id: Tab; label: string; drops: string; color: string }[] = [
  { id: 'registry',   label: 'REGISTRY',   drops: '10 drops',  color: 'blue' },
  { id: 'reputation', label: 'REPUTATION', drops: '5 drops',   color: 'purple' },
  { id: 'deadrop',    label: 'DEAD DROP',  drops: '5/3 drops', color: 'green' },
  { id: 'consensus',  label: 'CONSENSUS',  drops: '20 drops',  color: 'blue' },
  { id: 'referrals',  label: 'REFERRALS',  drops: '5 drops',   color: 'orange' },
  { id: 'auctions',   label: 'AUCTIONS',   drops: '10+ drops', color: 'yellow' },
  { id: 'proof',      label: 'PROOF',      drops: '1 drop',    color: 'green' },
]

const colorMap: Record<string, string> = {
  blue:   'border-blue-500 text-blue-400',
  purple: 'border-purple-500 text-purple-400',
  green:  'border-green-500 text-green-400',
  orange: 'border-orange-500 text-orange-400',
  yellow: 'border-yellow-500 text-yellow-400',
}

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('registry')
  const [merchantAddress, setMerchantAddress] = useState('')

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(d => setMerchantAddress(d.merchantAddress))
  }, [])

  const activeColor = colorMap[TABS.find(t => t.id === activeTab)?.color ?? 'blue']

  return (
    <main className="min-h-screen bg-black bg-grid relative overflow-hidden">
      <div className="pointer-events-none fixed top-0 left-1/4 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed bottom-0 right-0 w-80 h-80 bg-purple-600/8 rounded-full blur-3xl" />

      {/* Header */}
      <header className="border-b border-zinc-800/80 px-6 py-4 flex items-center gap-4 backdrop-blur-sm bg-black/60 sticky top-0 z-40">
        <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs">X</div>
          <span className="text-white font-black text-base tracking-tight">UseXRP</span>
        </a>
        <span className="text-zinc-700">/</span>
        <span className="text-zinc-400 text-sm font-mono">SERVICES</span>
        <div className="ml-auto flex items-center gap-1.5 text-xs font-mono text-green-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-glow" />
          MAINNET
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-3xl font-black text-white tracking-tight">Agent Services</h1>
          <p className="text-zinc-500 text-sm mt-1">Infrastructure for the AI agent economy. Pay with XRP drops, receive instantly.</p>
        </div>

        {/* Merchant wallet — always visible */}
        <div className="mb-8 border border-zinc-700 rounded-xl px-5 py-4 bg-zinc-950/60 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-zinc-500 mb-1">SEND DROPS TO THIS ADDRESS</p>
            {merchantAddress ? (
              <p className="text-green-400 font-mono text-sm break-all">{merchantAddress}</p>
            ) : (
              <p className="text-zinc-600 font-mono text-sm animate-pulse">Loading...</p>
            )}
          </div>
          {merchantAddress && (
            <button
              onClick={() => navigator.clipboard.writeText(merchantAddress)}
              className="shrink-0 text-xs font-mono border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white rounded-lg px-3 py-2 transition-colors"
            >
              COPY
            </button>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-2 mb-8">
          {TABS.map((tab) => {
            const active = activeTab === tab.id
            const c = colorMap[tab.color]
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-start px-3 py-2 rounded-xl border transition-all text-left ${
                  active
                    ? `${c} bg-zinc-900`
                    : 'border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400'
                }`}
              >
                <span className="text-xs font-mono font-bold">{tab.label}</span>
                <span className={`text-xs ${active ? 'opacity-70' : 'opacity-40'}`}>{tab.drops}</span>
              </button>
            )
          })}
        </div>

        {/* Active panel */}
        <div className={`border ${activeColor.split(' ')[0]}/20 bg-zinc-950/80 rounded-2xl p-6 relative overflow-hidden`}>
          <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-40 ${activeColor.split(' ')[1]}`} />

          {activeTab === 'registry'   && <RegistryPanel   merchantAddress={merchantAddress} />}
          {activeTab === 'reputation' && <ReputationPanel merchantAddress={merchantAddress} />}
          {activeTab === 'deadrop'    && <DeadDropPanel   merchantAddress={merchantAddress} />}
          {activeTab === 'consensus'  && <ConsensusPanel  merchantAddress={merchantAddress} />}
          {activeTab === 'referrals'  && <ReferralPanel   merchantAddress={merchantAddress} />}
          {activeTab === 'auctions'   && <AuctionPanel    merchantAddress={merchantAddress} />}
          {activeTab === 'proof'      && <ProofTaskPanel  merchantAddress={merchantAddress} />}
        </div>

        {/* API reference */}
        <div className="mt-8 border border-zinc-800 rounded-xl p-5 bg-zinc-950/40">
          <p className="text-xs font-mono text-zinc-600 mb-3">AGENT API REFERENCE</p>
          <div className="space-y-1.5 text-xs font-mono">
            {[
              ['POST', '/api/registry/register', '10 drops'],
              ['POST', '/api/registry/search',   '3 drops'],
              ['POST', '/api/reputation',         '5 drops'],
              ['POST', '/api/deadrop/store',      '5 drops'],
              ['POST', '/api/deadrop/retrieve',   '3 drops'],
              ['POST', '/api/consensus',          '20 drops'],
              ['POST', '/api/referrals/create',   '5 drops'],
              ['GET',  '/api/auctions',           'free'],
              ['POST', '/api/auctions/bid',       '10+ drops'],
              ['POST', '/api/auctions/claim',     '1 drop'],
              ['POST', '/api/prooftask',          '1 drop'],
            ].map(([method, path, cost]) => (
              <div key={path} className="flex items-center gap-3">
                <span className={method === 'GET' ? 'text-green-400' : 'text-blue-400'}>{method}</span>
                <span className="text-zinc-400">{path}</span>
                <span className="text-zinc-700 ml-auto">{cost}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
