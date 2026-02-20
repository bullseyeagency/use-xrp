'use client'

import { useState } from 'react'
import { ConsensusResponse } from '@/lib/types/consensus'

type Step = 'info' | 'submit' | 'result'

export default function ConsensusPanel({ merchantAddress }: { merchantAddress: string }) {
  const [step, setStep] = useState<Step>('info')
  const [txHash, setTxHash] = useState('')
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState<ConsensusResponse | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/consensus', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ txHash, question }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setResult(data.result)
      setStep('result')
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  const agreementColors = { UNANIMOUS: 'text-green-400', MAJORITY: 'text-blue-400', SPLIT: 'text-orange-400' }

  return (
    <div className="space-y-4">
      {step === 'info' && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
            <p className="text-xs font-mono text-zinc-500">CONSENSUS ENGINE</p>
            <p className="text-2xl font-black text-white">20 <span className="text-zinc-500 text-base font-normal">drops</span></p>
            <p className="font-mono text-xs text-green-400 break-all">{merchantAddress}</p>
          </div>
          <p className="text-xs text-zinc-500">3 independent AI instances answer your question separately. A 4th instance synthesizes and identifies consensus. Eliminates single-agent bias and hallucination risk.</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {['INSTANCE 1', 'INSTANCE 2', 'INSTANCE 3'].map((l) => (
              <div key={l} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                <p className="text-xs font-mono text-blue-400">{l}</p>
                <p className="text-zinc-600 text-xs mt-1">independent</p>
              </div>
            ))}
          </div>
          <button onClick={() => setStep('submit')} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-black py-3 rounded-xl transition-colors">I SENT THE PAYMENT</button>
        </div>
      )}

      {step === 'submit' && (
        <div className="space-y-3">
          <input type="text" value={txHash} onChange={e => setTxHash(e.target.value)} placeholder="Transaction hash..." className="w-full bg-zinc-900 border border-zinc-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-zinc-700 focus:outline-none" />
          <textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Your question for the consensus engine..." rows={3} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-blue-500 resize-none" />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button onClick={submit} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-black py-3 rounded-xl transition-colors disabled:opacity-30">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                RUNNING 3 INSTANCES...
              </span>
            ) : 'RUN CONSENSUS'}
          </button>
        </div>
      )}

      {step === 'result' && result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-400" /><p className="text-green-400 text-xs font-mono font-bold">CONSENSUS REACHED</p></div>
            <span className={`text-xs font-mono font-bold ${agreementColors[result.agreementLevel]}`}>{result.agreementLevel}</span>
          </div>

          <div className="bg-zinc-900 border border-green-500/30 rounded-xl p-4">
            <p className="text-xs font-mono text-green-400 mb-2">CONSENSUS ANSWER</p>
            <p className="text-zinc-200 text-sm leading-relaxed">{result.consensus}</p>
          </div>

          <details className="group">
            <summary className="text-xs font-mono text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors">VIEW INDIVIDUAL INSTANCES</summary>
            <div className="mt-3 space-y-3">
              {result.instanceAnswers.map((ans, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                  <p className="text-xs font-mono text-blue-400 mb-1">INSTANCE {i + 1}</p>
                  <p className="text-zinc-400 text-xs leading-relaxed">{ans}</p>
                </div>
              ))}
            </div>
          </details>

          <button onClick={() => { setStep('info'); setTxHash(''); setQuestion(''); setResult(null) }} className="w-full border border-zinc-700 text-zinc-400 text-sm py-2 rounded-xl hover:border-zinc-500 transition-colors">RESET</button>
        </div>
      )}
    </div>
  )
}
