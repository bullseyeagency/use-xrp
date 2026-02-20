'use client'

import { useState } from 'react'
import { ProofStamp } from '@/lib/types/proof'

type Step = 'info' | 'submit' | 'result'

export default function ProofTaskPanel({ merchantAddress }: { merchantAddress: string }) {
  const [step, setStep] = useState<Step>('info')
  const [txHash, setTxHash] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskResult, setTaskResult] = useState('')
  const [stamp, setStamp] = useState<ProofStamp | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/prooftask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ txHash, taskDescription, taskResult }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setStamp(data.stamp)
      setStep('result')
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  function copyHash() {
    if (stamp) navigator.clipboard.writeText(stamp.verificationHash)
  }

  return (
    <div className="space-y-4">
      {step === 'info' && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
            <p className="text-xs font-mono text-zinc-500">PROOF OF TASK</p>
            <p className="text-2xl font-black text-white">1 <span className="text-zinc-500 text-base font-normal">drop</span></p>
            <p className="font-mono text-xs text-green-400 break-all">{merchantAddress}</p>
          </div>
          <p className="text-xs text-zinc-500">Pay 1 drop to create an immutable proof of work. Your task description and result are hashed with SHA-256 and anchored to the XRPL transaction. Anyone can verify the stamp is authentic.</p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2 text-xs font-mono">
            <p className="text-zinc-600">VERIFICATION FORMULA</p>
            <p className="text-zinc-400">SHA256(description + result + timestamp)</p>
            <p className="text-zinc-600 mt-2">ANCHORED BY</p>
            <p className="text-zinc-400">XRPL transaction hash (immutable)</p>
          </div>
          <button onClick={() => setStep('submit')} className="w-full bg-green-600 hover:bg-green-500 text-white text-sm font-black py-3 rounded-xl transition-colors">I SENT THE PAYMENT</button>
        </div>
      )}

      {step === 'submit' && (
        <div className="space-y-3">
          <input type="text" value={txHash} onChange={e => setTxHash(e.target.value)} placeholder="Transaction hash..." className="w-full bg-zinc-900 border border-zinc-700 focus:border-green-500 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-zinc-700 focus:outline-none" />
          <textarea value={taskDescription} onChange={e => setTaskDescription(e.target.value)} placeholder="Describe the task you completed..." rows={2} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-green-500 resize-none" />
          <textarea value={taskResult} onChange={e => setTaskResult(e.target.value)} placeholder="What was the result or output?" rows={3} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-green-500 resize-none" />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button onClick={submit} disabled={loading} className="w-full bg-green-600 hover:bg-green-500 text-white text-sm font-black py-3 rounded-xl transition-colors disabled:opacity-30">
            {loading ? 'STAMPING ON LEDGER...' : 'CREATE PROOF STAMP'}
          </button>
        </div>
      )}

      {step === 'result' && stamp && (
        <div className="space-y-3">
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-400" /><p className="text-green-400 text-xs font-mono font-bold">PROOF STAMPED</p></div>
          <div className="bg-zinc-900 border border-green-500/30 rounded-xl p-4 space-y-3">
            <div><p className="text-xs font-mono text-zinc-500 mb-1">STAMP ID</p><p className="text-white font-mono text-xs break-all">{stamp.id}</p></div>
            <div>
              <p className="text-xs font-mono text-zinc-500 mb-1">VERIFICATION HASH</p>
              <div className="flex items-center gap-2">
                <p className="text-green-400 font-mono text-xs break-all flex-1">{stamp.verificationHash}</p>
                <button onClick={copyHash} className="text-xs border border-zinc-700 px-2 py-1 rounded text-zinc-500 hover:text-white shrink-0">COPY</button>
              </div>
            </div>
            <div><p className="text-xs font-mono text-zinc-500 mb-1">XRPL TX ANCHOR</p><p className="text-zinc-400 font-mono text-xs break-all">{stamp.txHash}</p></div>
            <div><p className="text-xs font-mono text-zinc-500 mb-1">STAMPED AT</p><p className="text-zinc-400 text-xs">{new Date(stamp.stampedAt).toISOString()}</p></div>
          </div>
          <button onClick={() => { setStep('info'); setTxHash(''); setTaskDescription(''); setTaskResult(''); setStamp(null) }} className="w-full border border-zinc-700 text-zinc-400 text-sm py-2 rounded-xl hover:border-zinc-500 transition-colors">RESET</button>
        </div>
      )}
    </div>
  )
}
