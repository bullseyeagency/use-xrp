'use client'

import { useState } from 'react'
import { ReputationResult } from '@/lib/reputation'

type Step = 'info' | 'submit' | 'result'

const gradeColors: Record<string, string> = {
  SSS: 'text-yellow-400', SS: 'text-yellow-300', S: 'text-green-400',
  A: 'text-blue-400', B: 'text-purple-400', C: 'text-orange-400',
  D: 'text-red-400', UNRATED: 'text-zinc-600',
}

export default function ReputationPanel({ merchantAddress }: { merchantAddress: string }) {
  const [step, setStep] = useState<Step>('info')
  const [txHash, setTxHash] = useState('')
  const [targetAddress, setTargetAddress] = useState('')
  const [result, setResult] = useState<ReputationResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!txHash.trim() || !targetAddress.trim()) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/reputation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ txHash, targetAddress }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setResult(data.reputation)
      setStep('result')
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      {step === 'info' && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
            <p className="text-xs font-mono text-zinc-500">REPUTATION SCORE LOOKUP</p>
            <p className="text-2xl font-black text-white">5 <span className="text-zinc-500 text-base font-normal">drops</span></p>
            <p className="font-mono text-xs text-green-400 break-all">{merchantAddress}</p>
          </div>
          <p className="text-xs text-zinc-500">Get an on-chain reputation score for any XRPL wallet. Scored across account age, transaction volume, unique counterparties, and payment patterns.</p>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(gradeColors).filter(([g]) => g !== 'UNRATED').map(([g, c]) => (
              <div key={g} className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-center">
                <div className={`text-lg font-black ${c}`}>{g}</div>
              </div>
            ))}
          </div>
          <button onClick={() => setStep('submit')} className="w-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-black py-3 rounded-xl transition-colors">I SENT THE PAYMENT</button>
        </div>
      )}

      {step === 'submit' && (
        <div className="space-y-3">
          <input type="text" value={txHash} onChange={e => setTxHash(e.target.value)} placeholder="Transaction hash..." className="w-full bg-zinc-900 border border-zinc-700 focus:border-purple-500 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-zinc-700 focus:outline-none" />
          <input type="text" value={targetAddress} onChange={e => setTargetAddress(e.target.value)} placeholder="XRPL wallet address to score..." className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-zinc-700 focus:outline-none focus:border-purple-500" />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button onClick={submit} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-black py-3 rounded-xl transition-colors disabled:opacity-30">
            {loading ? 'SCANNING LEDGER...' : 'GET REPUTATION SCORE'}
          </button>
        </div>
      )}

      {step === 'result' && result && (
        <div className="space-y-4">
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-400" /><p className="text-green-400 text-xs font-mono font-bold">SCORE RETRIEVED</p></div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs font-mono">GRADE</p>
                <p className={`text-5xl font-black ${gradeColors[result.grade]}`}>{result.grade}</p>
              </div>
              <div className="text-right">
                <p className="text-zinc-500 text-xs font-mono">SCORE</p>
                <p className="text-3xl font-black text-white">{result.score}<span className="text-zinc-600 text-base">/100</span></p>
              </div>
            </div>
            <div className="border-t border-zinc-800 pt-4 grid grid-cols-2 gap-3 text-xs">
              <div><p className="text-zinc-600 font-mono">ACCOUNT AGE</p><p className="text-white font-bold">{result.factors.accountAge} seq</p></div>
              <div><p className="text-zinc-600 font-mono">TOTAL TXS</p><p className="text-white font-bold">{result.factors.totalTransactions}</p></div>
              <div><p className="text-zinc-600 font-mono">PAYMENTS</p><p className="text-white font-bold">{result.factors.paymentCount}</p></div>
              <div><p className="text-zinc-600 font-mono">COUNTERPARTIES</p><p className="text-white font-bold">{result.factors.uniqueCounterparties}</p></div>
              <div className="col-span-2"><p className="text-zinc-600 font-mono">AVG DROPS SENT</p><p className="text-white font-bold">{result.factors.averageDropsSent.toLocaleString()}</p></div>
            </div>
            <p className="text-zinc-700 text-xs font-mono break-all">{result.walletAddress}</p>
          </div>
          <button onClick={() => { setStep('info'); setTxHash(''); setTargetAddress(''); setResult(null) }} className="w-full border border-zinc-700 text-zinc-400 text-sm py-2 rounded-xl hover:border-zinc-500 transition-colors">RESET</button>
        </div>
      )}
    </div>
  )
}
