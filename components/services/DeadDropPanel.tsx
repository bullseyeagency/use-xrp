'use client'

import { useState } from 'react'

type Step = 'info' | 'submit' | 'result'
type Mode = 'send' | 'retrieve'

export default function DeadDropPanel({ merchantAddress }: { merchantAddress: string }) {
  const [mode, setMode] = useState<Mode>('send')
  const [step, setStep] = useState<Step>('info')
  const [txHash, setTxHash] = useState('')
  const [toAddress, setToAddress] = useState('')
  const [content, setContent] = useState('')
  const [messageId, setMessageId] = useState('')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const drops = mode === 'send' ? 5 : 3

  async function submit() {
    setLoading(true); setError('')
    try {
      const url = mode === 'send' ? '/api/deadrop/store' : '/api/deadrop/retrieve'
      const body = mode === 'send' ? { txHash, toAddress, content } : { txHash, messageId }
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setResult(data)
      setStep('result')
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['send', 'retrieve'] as Mode[]).map((m) => (
          <button key={m} onClick={() => { setMode(m); setStep('info'); setResult(null); setError('') }}
            className={`px-4 py-1.5 rounded-full text-xs font-mono transition-colors ${mode === m ? 'bg-green-600 text-white' : 'border border-zinc-700 text-zinc-400 hover:text-white'}`}>
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      {step === 'info' && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
            <p className="text-xs font-mono text-zinc-500">{mode === 'send' ? 'STORE A DEAD DROP' : 'RETRIEVE A MESSAGE'}</p>
            <p className="text-2xl font-black text-white">{drops} <span className="text-zinc-500 text-base font-normal">drops</span></p>
            <p className="font-mono text-xs text-green-400 break-all">{merchantAddress}</p>
          </div>
          <p className="text-xs text-zinc-500">{mode === 'send' ? 'Pay 5 drops to store a private message for a specific wallet address. Share the message ID with the recipient. Expires in 7 days.' : 'Pay 3 drops to retrieve a message stored for your wallet. Only the intended recipient can access it.'}</p>
          <button onClick={() => setStep('submit')} className="w-full bg-green-700 hover:bg-green-600 text-white text-sm font-black py-3 rounded-xl transition-colors">I SENT THE PAYMENT</button>
        </div>
      )}

      {step === 'submit' && (
        <div className="space-y-3">
          <input type="text" value={txHash} onChange={e => setTxHash(e.target.value)} placeholder="Transaction hash..." className="w-full bg-zinc-900 border border-zinc-700 focus:border-green-500 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-zinc-700 focus:outline-none" />
          {mode === 'send' ? (
            <>
              <input type="text" value={toAddress} onChange={e => setToAddress(e.target.value)} placeholder="Recipient wallet address (rXXX...)" className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-sm font-mono text-white placeholder-zinc-700 focus:outline-none focus:border-green-500" />
              <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Your message (max 2048 chars)..." rows={4} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-green-500 resize-none" />
            </>
          ) : (
            <input type="text" value={messageId} onChange={e => setMessageId(e.target.value)} placeholder="Message ID (UUID from sender)" className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-sm font-mono text-white placeholder-zinc-700 focus:outline-none focus:border-green-500" />
          )}
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button onClick={submit} disabled={loading} className="w-full bg-green-700 hover:bg-green-600 text-white text-sm font-black py-3 rounded-xl transition-colors disabled:opacity-30">
            {loading ? 'PROCESSING...' : mode === 'send' ? 'STORE MESSAGE' : 'RETRIEVE MESSAGE'}
          </button>
        </div>
      )}

      {step === 'result' && result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-400" /><p className="text-green-400 text-xs font-mono font-bold">{mode === 'send' ? 'MESSAGE STORED' : 'MESSAGE RETRIEVED'}</p></div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
            {mode === 'send' ? (
              <>
                <div><p className="text-zinc-500 text-xs font-mono">MESSAGE ID (share with recipient)</p><p className="text-green-400 font-mono text-sm break-all">{result.messageId}</p></div>
                <div><p className="text-zinc-500 text-xs font-mono">EXPIRES</p><p className="text-white text-xs">{new Date(result.expiresAt).toLocaleString()}</p></div>
              </>
            ) : (
              <>
                <div><p className="text-zinc-500 text-xs font-mono">FROM</p><p className="text-white font-mono text-xs break-all">{result.from}</p></div>
                <div><p className="text-zinc-500 text-xs font-mono">MESSAGE</p><pre className="text-zinc-200 text-xs leading-relaxed whitespace-pre-wrap font-mono bg-black/40 rounded-lg p-3 mt-1">{result.content}</pre></div>
              </>
            )}
          </div>
          <button onClick={() => { setStep('info'); setTxHash(''); setResult(null) }} className="w-full border border-zinc-700 text-zinc-400 text-sm py-2 rounded-xl hover:border-zinc-500 transition-colors">RESET</button>
        </div>
      )}
    </div>
  )
}
