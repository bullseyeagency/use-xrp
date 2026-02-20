'use client'

import { useState } from 'react'

type Step = 'info' | 'submit' | 'result'

export default function ReferralPanel({ merchantAddress }: { merchantAddress: string }) {
  const [step, setStep] = useState<Step>('info')
  const [txHash, setTxHash] = useState('')
  const [result, setResult] = useState<{ code: string; ownerAddress: string } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/referrals/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ txHash }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setResult(data)
      setStep('result')
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  function copyCode() {
    if (result) navigator.clipboard.writeText(result.code)
  }

  return (
    <div className="space-y-4">
      {step === 'info' && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
            <p className="text-xs font-mono text-zinc-500">CREATE REFERRAL CODE</p>
            <p className="text-2xl font-black text-white">5 <span className="text-zinc-500 text-base font-normal">drops</span></p>
            <p className="font-mono text-xs text-green-400 break-all">{merchantAddress}</p>
          </div>
          <p className="text-xs text-zinc-500">Pay 5 drops to generate a unique referral code tied to your wallet. Every agent that transacts using your code earns you 1 drop. Share it broadly — the more agents you bring, the more you earn.</p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs font-mono text-zinc-600 mb-2">HOW EARNINGS WORK</p>
            <div className="space-y-1 text-xs text-zinc-500">
              <div className="flex justify-between"><span>Each referred transaction</span><span className="text-green-400">+1 drop</span></div>
              <div className="flex justify-between"><span>No cap on referrals</span><span className="text-green-400">unlimited</span></div>
              <div className="flex justify-between"><span>Code never expires</span><span className="text-green-400">forever</span></div>
            </div>
          </div>
          <button onClick={() => setStep('submit')} className="w-full bg-orange-600 hover:bg-orange-500 text-white text-sm font-black py-3 rounded-xl transition-colors">I SENT THE PAYMENT</button>
        </div>
      )}

      {step === 'submit' && (
        <div className="space-y-3">
          <input type="text" value={txHash} onChange={e => setTxHash(e.target.value)} placeholder="Transaction hash..." className="w-full bg-zinc-900 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-zinc-700 focus:outline-none" />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button onClick={submit} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-500 text-white text-sm font-black py-3 rounded-xl transition-colors disabled:opacity-30">
            {loading ? 'GENERATING CODE...' : 'GENERATE REFERRAL CODE'}
          </button>
        </div>
      )}

      {step === 'result' && result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-400" /><p className="text-green-400 text-xs font-mono font-bold">CODE GENERATED</p></div>
          <div className="bg-zinc-900 border border-orange-500/30 rounded-xl p-5 text-center">
            <p className="text-xs font-mono text-zinc-500 mb-3">YOUR REFERRAL CODE</p>
            <p className="text-4xl font-black text-orange-400 tracking-widest mb-4">{result.code}</p>
            <button onClick={copyCode} className="text-xs border border-zinc-700 px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors font-mono">COPY CODE</button>
          </div>
          <p className="text-xs text-zinc-600 text-center">Share this code with other agents. They include it in their API requests to credit your wallet.</p>
          <button onClick={() => { setStep('info'); setTxHash(''); setResult(null) }} className="w-full border border-zinc-700 text-zinc-400 text-sm py-2 rounded-xl hover:border-zinc-500 transition-colors">RESET</button>
        </div>
      )}
    </div>
  )
}
