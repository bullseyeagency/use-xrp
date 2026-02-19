'use client'

import { useState } from 'react'
import { Product } from '@/lib/products'

interface Props {
  product: Product
  merchantAddress: string
  onClose: () => void
}

type Step = 'instructions' | 'submit' | 'result'

export default function PurchaseModal({ product, merchantAddress, onClose }: Props) {
  const [step, setStep] = useState<Step>('instructions')
  const [txHash, setTxHash] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleVerify() {
    if (!txHash.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash: txHash.trim(), productId: product.id }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Verification failed')
        setLoading(false)
        return
      }

      setOutput(data.output)
      setStep('result')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function copyAddress() {
    navigator.clipboard.writeText(merchantAddress)
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      {/* Glow behind modal */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden">
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/80">
          <div>
            <p className="text-xs font-mono text-blue-400 mb-0.5">PURCHASING</p>
            <h2 className="text-white font-bold text-sm">{product.name}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-white font-black">{product.drops.toLocaleString()}</div>
              <div className="text-zinc-600 text-xs font-mono">DROPS</div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-colors text-sm"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex border-b border-zinc-800/80">
          {['SEND', 'VERIFY', 'RECEIVE'].map((s, i) => {
            const stepIndex = step === 'instructions' ? 0 : step === 'submit' ? 1 : 2
            const active = i === stepIndex
            const done = i < stepIndex
            return (
              <div
                key={s}
                className={`flex-1 text-center py-2 text-xs font-mono transition-colors ${
                  active ? 'text-blue-400 border-b-2 border-blue-500' :
                  done ? 'text-green-400' : 'text-zinc-700'
                }`}
              >
                {done ? '✓ ' : ''}{s}
              </div>
            )
          })}
        </div>

        {/* Step: Instructions */}
        {step === 'instructions' && (
          <div className="p-5 space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
              <div>
                <p className="text-xs font-mono text-zinc-500 mb-1">SEND EXACTLY</p>
                <p className="text-white font-black text-3xl">{product.drops.toLocaleString()}<span className="text-zinc-500 text-lg font-normal ml-2">drops</span></p>
                <p className="text-zinc-600 text-xs font-mono mt-0.5">{product.xrp} XRP</p>
              </div>

              <div>
                <p className="text-xs font-mono text-zinc-500 mb-1">TO THIS ADDRESS</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-xs text-green-400 break-all flex-1">{merchantAddress}</p>
                  <button
                    onClick={copyAddress}
                    className="text-xs border border-zinc-700 px-2 py-1 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors shrink-0"
                  >
                    COPY
                  </button>
                </div>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Use any XRP wallet — Xumm, Ledger, Coinbase, Binance. Send the exact amount above.
              Once confirmed on-chain, click below and paste your transaction hash.
            </p>

            <button
              onClick={() => setStep('submit')}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-black py-3 rounded-xl transition-colors tracking-wide glow-blue"
            >
              I SENT THE PAYMENT
            </button>
          </div>
        )}

        {/* Step: Submit TX Hash */}
        {step === 'submit' && (
          <div className="p-5 space-y-4">
            <div>
              <p className="text-xs font-mono text-zinc-500 mb-1">TRANSACTION HASH</p>
              <p className="text-xs text-zinc-600">Copy the tx hash from your wallet or xrpl.org explorer</p>
            </div>

            <input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="Paste transaction hash here..."
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-zinc-700 focus:outline-none transition-colors"
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <p className="text-red-400 text-xs font-mono">{error}</p>
              </div>
            )}

            <button
              onClick={handleVerify}
              disabled={loading || !txHash.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-black py-3 rounded-xl transition-all tracking-wide glow-blue disabled:opacity-30 disabled:cursor-not-allowed disabled:glow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  VERIFYING ON LEDGER...
                </span>
              ) : 'VERIFY & CLAIM PRODUCT'}
            </button>
          </div>
        )}

        {/* Step: Result */}
        {step === 'result' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-glow" />
              <p className="text-green-400 text-xs font-mono font-bold">PAYMENT VERIFIED · PRODUCT DELIVERED</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 max-h-64 overflow-y-auto">
              <pre className="text-zinc-300 text-xs leading-relaxed whitespace-pre-wrap font-mono">{output}</pre>
            </div>

            <button
              onClick={onClose}
              className="w-full border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-sm font-mono py-3 rounded-xl transition-colors"
            >
              CLOSE
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
