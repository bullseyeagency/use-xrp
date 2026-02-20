'use client'

import { useState } from 'react'
import { AgentRecord } from '@/lib/types/registry'

type Step = 'info' | 'submit' | 'result'
type Mode = 'register' | 'search'

export default function RegistryPanel({ merchantAddress }: { merchantAddress: string }) {
  const [mode, setMode] = useState<Mode>('register')
  const [step, setStep] = useState<Step>('info')
  const [txHash, setTxHash] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [skills, setSkills] = useState('')
  const [endpoint, setEndpoint] = useState('')
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<AgentRecord | AgentRecord[] | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const drops = mode === 'register' ? 10 : 3

  async function submit() {
    if (!txHash.trim()) return
    setLoading(true)
    setError('')

    try {
      const url = mode === 'register' ? '/api/registry/register' : '/api/registry/search'
      const body = mode === 'register'
        ? { txHash, name, description, skills: skills.split(',').map(s => s.trim()).filter(Boolean), endpoint }
        : { txHash, query }

      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setResult(mode === 'register' ? data.agent : data.agents)
      setStep('result')
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['register', 'search'] as Mode[]).map((m) => (
          <button key={m} onClick={() => { setMode(m); setStep('info'); setResult(null); setError('') }}
            className={`px-4 py-1.5 rounded-full text-xs font-mono transition-colors ${mode === m ? 'bg-blue-600 text-white' : 'border border-zinc-700 text-zinc-400 hover:text-white'}`}>
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      {step === 'info' && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
            <p className="text-xs font-mono text-zinc-500">{mode === 'register' ? 'REGISTER YOUR AGENT' : 'SEARCH THE REGISTRY'}</p>
            <p className="text-2xl font-black text-white">{drops} <span className="text-zinc-500 text-base font-normal">drops</span></p>
            <p className="font-mono text-xs text-green-400 break-all">{merchantAddress}</p>
          </div>
          <p className="text-xs text-zinc-500">{mode === 'register' ? 'Pay 10 drops to list your agent in the global registry. Other agents will find you by skills.' : 'Pay 3 drops to search all registered agents by name, description, or skill tag.'}</p>
          <button onClick={() => setStep('submit')} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-black py-3 rounded-xl transition-colors">I SENT THE PAYMENT</button>
        </div>
      )}

      {step === 'submit' && (
        <div className="space-y-3">
          <input type="text" value={txHash} onChange={e => setTxHash(e.target.value)} placeholder="Transaction hash..." className="w-full bg-zinc-900 border border-zinc-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-zinc-700 focus:outline-none" />
          {mode === 'register' ? (
            <>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Agent name" className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-blue-500" />
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What does your agent do?" rows={2} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-blue-500 resize-none" />
              <input type="text" value={skills} onChange={e => setSkills(e.target.value)} placeholder="Skills (comma separated: analysis, trading, research)" className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-blue-500" />
              <input type="text" value={endpoint} onChange={e => setEndpoint(e.target.value)} placeholder="Callback URL (optional)" className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-blue-500" />
            </>
          ) : (
            <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by skill or name..." className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-blue-500" />
          )}
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button onClick={submit} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-black py-3 rounded-xl transition-colors disabled:opacity-30">
            {loading ? 'PROCESSING...' : mode === 'register' ? 'REGISTER AGENT' : 'SEARCH'}
          </button>
        </div>
      )}

      {step === 'result' && result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-400" /><p className="text-green-400 text-xs font-mono font-bold">SUCCESS</p></div>
          {Array.isArray(result) ? (
            result.length === 0 ? <p className="text-zinc-500 text-sm">No agents found.</p> :
            result.map((a) => (
              <div key={a.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-white font-bold text-sm">{a.name}</p>
                <p className="text-zinc-500 text-xs mt-1">{a.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">{a.skills.map(s => <span key={s} className="text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-mono">{s}</span>)}</div>
                <p className="text-zinc-700 text-xs font-mono mt-2">{a.walletAddress}</p>
              </div>
            ))
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-white font-bold">{(result as AgentRecord).name}</p>
              <p className="text-zinc-500 text-xs mt-1">{(result as AgentRecord).description}</p>
              <div className="flex flex-wrap gap-1 mt-2">{(result as AgentRecord).skills.map(s => <span key={s} className="text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-mono">{s}</span>)}</div>
              <p className="text-green-400 text-xs font-mono mt-2">ID: {(result as AgentRecord).id}</p>
            </div>
          )}
          <button onClick={() => { setStep('info'); setTxHash(''); setResult(null) }} className="w-full border border-zinc-700 text-zinc-400 text-sm py-2 rounded-xl hover:border-zinc-500 transition-colors">RESET</button>
        </div>
      )}
    </div>
  )
}
