'use client'

import { useState, useEffect } from 'react'
import { SkillAuction } from '@/lib/types/auction'

type Step = 'info' | 'submit' | 'result'
type Mode = 'bid' | 'claim'

export default function AuctionPanel({ merchantAddress }: { merchantAddress: string }) {
  const [auctions, setAuctions] = useState<SkillAuction[]>([])
  const [selected, setSelected] = useState<SkillAuction | null>(null)
  const [mode, setMode] = useState<Mode>('bid')
  const [step, setStep] = useState<Step>('info')
  const [txHash, setTxHash] = useState('')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    fetch('/api/auctions').then(r => r.json()).then(d => setAuctions(d.auctions ?? []))
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  function timeLeft(endsAt: number) {
    const ms = endsAt - now
    if (ms <= 0) return 'ENDED'
    const m = Math.floor(ms / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  function topBid(a: SkillAuction) {
    if (!a.bids.length) return null
    return [...a.bids].sort((x, y) => y.drops - x.drops)[0]
  }

  async function submit() {
    if (!selected) return
    setLoading(true); setError('')
    try {
      const url = mode === 'bid' ? '/api/auctions/bid' : '/api/auctions/claim'
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ txHash, auctionId: selected.id }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setResult(data)
      setStep('result')
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  if (!selected) {
    return (
      <div className="space-y-4">
        <p className="text-xs font-mono text-zinc-500">ACTIVE AUCTIONS — 10 MIN WINDOWS · ANTI-SNIPE PROTECTION</p>
        {auctions.length === 0 && <p className="text-zinc-600 text-sm">No active auctions. Check back soon.</p>}
        {auctions.map((a) => {
          const top = topBid(a)
          return (
            <div key={a.id} className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 cursor-pointer transition-colors" onClick={() => { setSelected(a); setStep('info') }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-white font-bold text-sm">{a.skillName}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">{a.description}</p>
                </div>
                <span className="text-xs font-mono text-yellow-400 shrink-0 ml-3">{timeLeft(a.endsAt)}</span>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-zinc-600">Current bid: <span className="text-white font-bold">{top ? `${top.drops} drops` : `${a.minimumBid} min`}</span></span>
                <span className="text-xs font-mono text-blue-400">{a.bids.length} bid{a.bids.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const top = topBid(selected)
  const minBid = top ? top.drops + 1 : selected.minimumBid

  return (
    <div className="space-y-4">
      <button onClick={() => setSelected(null)} className="text-xs font-mono text-zinc-500 hover:text-white transition-colors">← BACK TO AUCTIONS</button>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <p className="text-white font-bold">{selected.skillName}</p>
        <p className="text-zinc-500 text-xs mt-1">{selected.description}</p>
        <div className="flex items-center justify-between mt-3 text-xs font-mono">
          <span className="text-yellow-400">TIME LEFT: {timeLeft(selected.endsAt)}</span>
          <span className="text-white">{top ? `${top.drops} drops` : 'NO BIDS'}</span>
        </div>
      </div>

      <div className="flex gap-2">
        {(['bid', 'claim'] as Mode[]).map((m) => (
          <button key={m} onClick={() => { setMode(m); setStep('info'); setError('') }}
            className={`px-4 py-1.5 rounded-full text-xs font-mono transition-colors ${mode === m ? 'bg-yellow-600 text-white' : 'border border-zinc-700 text-zinc-400 hover:text-white'}`}>
            {m === 'bid' ? `BID (${minBid}+ drops)` : 'CLAIM WIN (1 drop)'}
          </button>
        ))}
      </div>

      {step === 'info' && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
            <p className="text-xs font-mono text-zinc-500">{mode === 'bid' ? 'PLACE BID' : 'CLAIM WINNING SKILL'}</p>
            <p className="text-2xl font-black text-white">{mode === 'bid' ? `${minBid}+ drops` : '1 drop'}</p>
            <p className="font-mono text-xs text-green-400 break-all">{merchantAddress}</p>
          </div>
          <p className="text-xs text-zinc-500">{mode === 'bid' ? `Send at least ${minBid} drops. The actual amount you send IS your bid. Anti-snipe protection extends time by 1 min if you bid in the final minute.` : 'If you are the winning bidder, pay 1 drop claim fee to unlock the skill and receive the AI output.'}</p>
          <button onClick={() => setStep('submit')} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-black py-3 rounded-xl transition-colors">I SENT THE PAYMENT</button>
        </div>
      )}

      {step === 'submit' && (
        <div className="space-y-3">
          <input type="text" value={txHash} onChange={e => setTxHash(e.target.value)} placeholder="Transaction hash..." className="w-full bg-zinc-900 border border-zinc-700 focus:border-yellow-500 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-zinc-700 focus:outline-none" />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button onClick={submit} disabled={loading} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-black py-3 rounded-xl transition-colors disabled:opacity-30">
            {loading ? 'PROCESSING...' : mode === 'bid' ? 'PLACE BID' : 'CLAIM SKILL'}
          </button>
        </div>
      )}

      {step === 'result' && result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-400" /><p className="text-green-400 text-xs font-mono font-bold">{mode === 'bid' ? 'BID PLACED' : 'SKILL UNLOCKED'}</p></div>
          {mode === 'bid' ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
              <p className="text-xs font-mono text-zinc-500">YOUR BID</p>
              <p className="text-white font-black text-2xl">{result.bid?.drops} drops</p>
              <p className="text-zinc-500 text-xs">You are the current leader. Time remaining: {timeLeft(result.endsAt)}</p>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-yellow-500/30 rounded-xl p-4 space-y-2">
              <p className="text-xs font-mono text-yellow-400">SKILL: {result.skillName}</p>
              <pre className="text-zinc-200 text-xs leading-relaxed whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">{result.skillOutput}</pre>
            </div>
          )}
          <button onClick={() => { setSelected(null); setStep('info'); setTxHash(''); setResult(null) }} className="w-full border border-zinc-700 text-zinc-400 text-sm py-2 rounded-xl hover:border-zinc-500 transition-colors">BACK TO AUCTIONS</button>
        </div>
      )}
    </div>
  )
}
