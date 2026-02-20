'use client'

import { useState } from 'react'
import { fetchPublicKey, encryptForRecipient, decryptFromSender, privateKeyFromSeed } from '@/lib/crypto.client'

type Step = 'info' | 'submit' | 'result'
type Mode = 'send' | 'retrieve'

export default function DeadDropPanel({ merchantAddress }: { merchantAddress: string }) {
  const [mode, setMode] = useState<Mode>('send')
  const [step, setStep] = useState<Step>('info')
  const [txHash, setTxHash] = useState('')
  const [toAddress, setToAddress] = useState('')
  const [content, setContent] = useState('')
  const [seed, setSeed] = useState('')
  const [messageId, setMessageId] = useState('')
  const [result, setResult] = useState<any>(null)
  const [decryptedMessage, setDecryptedMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingKey, setLoadingKey] = useState(false)
  const [recipientKeyFetched, setRecipientKeyFetched] = useState(false)

  const drops = mode === 'send' ? 5 : 3

  async function checkRecipientKey() {
    if (!toAddress) return
    setLoadingKey(true)
    setError('')
    try {
      await fetchPublicKey(toAddress)
      setRecipientKeyFetched(true)
    } catch (e: any) {
      setError(e.message)
      setRecipientKeyFetched(false)
    } finally {
      setLoadingKey(false)
    }
  }

  async function submit() {
    setLoading(true)
    setError('')
    try {
      if (mode === 'send') {
        // Fetch recipient public key from XRPL
        let recipientPubKey: string
        try {
          recipientPubKey = await fetchPublicKey(toAddress)
        } catch (e: any) {
          setError(e.message)
          return
        }

        // Encrypt message client-side — server never sees plaintext
        const payload = await encryptForRecipient(recipientPubKey, content, toAddress)

        const res = await fetch('/api/deadrop/store', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            txHash,
            toAddress,
            content: payload.encryptedBlob,
            encrypted: true,
            ephemeralPublicKey: payload.ephemeralPublicKey,
            encryptionVersion: payload.version,
          }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error); return }
        setResult(data)
        setStep('result')
      } else {
        // Retrieve encrypted blob from server
        const res = await fetch('/api/deadrop/retrieve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ txHash, messageId }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error); return }

        // Decrypt client-side using recipient's seed
        if (data.encrypted && data.ephemeralPublicKey) {
          if (!seed) { setError('Seed required to decrypt this message'); return }
          const privateKey = await privateKeyFromSeed(seed)
          const plaintext = await decryptFromSender(privateKey, data.ephemeralPublicKey, data.content)
          setDecryptedMessage(plaintext)
        } else {
          setDecryptedMessage(data.content)
        }
        setResult(data)
        setStep('result')
      }
    } catch (e: any) {
      setError(e.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setStep('info')
    setTxHash('')
    setToAddress('')
    setContent('')
    setSeed('')
    setMessageId('')
    setResult(null)
    setDecryptedMessage('')
    setError('')
    setRecipientKeyFetched(false)
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        {(['send', 'retrieve'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setStep('info'); setResult(null); setError(''); setRecipientKeyFetched(false) }}
            className={`px-4 py-1.5 rounded-full text-xs font-mono transition-colors ${mode === m ? 'bg-green-600 text-white' : 'border border-zinc-700 text-zinc-400 hover:text-white'}`}
          >
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      {/* E2E encryption badge */}
      <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-800/40 rounded-lg px-3 py-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
        <p className="text-emerald-400 text-xs font-mono font-bold">END-TO-END ENCRYPTED</p>
        <span className="text-zinc-600 text-xs hidden sm:block">— server never sees plaintext</span>
      </div>

      {step === 'info' && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
            <p className="text-xs font-mono text-zinc-500">{mode === 'send' ? 'STORE AN ENCRYPTED DEAD DROP' : 'RETRIEVE & DECRYPT A MESSAGE'}</p>
            <p className="text-2xl font-black text-white">{drops} <span className="text-zinc-500 text-base font-normal">drops</span></p>
            <p className="font-mono text-xs text-green-400 break-all">{merchantAddress}</p>
          </div>
          <div className="text-xs text-zinc-500 space-y-1.5 font-mono">
            {mode === 'send' ? (
              <>
                <p><span className="text-zinc-600">1.</span> Pay 5 drops to the address above</p>
                <p><span className="text-zinc-600">2.</span> Enter recipient wallet — their public key is fetched from XRPL</p>
                <p><span className="text-zinc-600">3.</span> Message encrypts in your browser before upload</p>
                <p><span className="text-zinc-600">4.</span> Only the recipient&apos;s seed can decrypt it</p>
              </>
            ) : (
              <>
                <p><span className="text-zinc-600">1.</span> Pay 3 drops to the address above</p>
                <p><span className="text-zinc-600">2.</span> Enter the message ID and your seed phrase</p>
                <p><span className="text-zinc-600">3.</span> Encrypted blob is fetched from the server</p>
                <p><span className="text-zinc-600">4.</span> Decryption runs in your browser — seed never transmitted</p>
              </>
            )}
          </div>
          <button
            onClick={() => setStep('submit')}
            className="w-full bg-green-700 hover:bg-green-600 text-white text-sm font-black py-3 rounded-xl transition-colors"
          >
            I SENT THE PAYMENT
          </button>
        </div>
      )}

      {step === 'submit' && (
        <div className="space-y-3">
          <input
            type="text"
            value={txHash}
            onChange={e => setTxHash(e.target.value)}
            placeholder="Transaction hash..."
            className="w-full bg-zinc-900 border border-zinc-700 focus:border-green-500 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-zinc-700 focus:outline-none"
          />

          {mode === 'send' ? (
            <>
              {/* Recipient address + key check */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={toAddress}
                  onChange={e => { setToAddress(e.target.value); setRecipientKeyFetched(false) }}
                  placeholder="Recipient wallet (rXXX...)"
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-sm font-mono text-white placeholder-zinc-700 focus:outline-none focus:border-green-500"
                />
                <button
                  onClick={checkRecipientKey}
                  disabled={loadingKey || !toAddress}
                  className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-colors whitespace-nowrap ${
                    recipientKeyFetched
                      ? 'bg-emerald-900 text-emerald-300 border border-emerald-700'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
                  } disabled:opacity-30`}
                >
                  {loadingKey ? '...' : recipientKeyFetched ? 'KEY OK' : 'VERIFY KEY'}
                </button>
              </div>
              {recipientKeyFetched && (
                <p className="text-emerald-400 text-xs font-mono">secp256k1 public key found on-chain</p>
              )}

              {/* Plaintext message (encrypted before submission) */}
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Your message — encrypted in browser before upload..."
                rows={4}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-green-500 resize-none"
              />
              <p className="text-zinc-600 text-xs font-mono">ECIES · secp256k1 ECDH · AES-256-GCM</p>
            </>
          ) : (
            <>
              <input
                type="text"
                value={messageId}
                onChange={e => setMessageId(e.target.value)}
                placeholder="Message ID (UUID from sender)"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-sm font-mono text-white placeholder-zinc-700 focus:outline-none focus:border-green-500"
              />

              {/* Seed — masked, local only */}
              <div className="space-y-1">
                <input
                  type="password"
                  value={seed}
                  onChange={e => setSeed(e.target.value)}
                  placeholder="Your XRPL seed (sXXX...) — never transmitted"
                  className="w-full bg-zinc-900 border border-amber-900/50 focus:border-amber-600 rounded-xl px-4 py-2 text-sm font-mono text-white placeholder-zinc-700 focus:outline-none"
                />
                <p className="text-amber-700 text-xs font-mono">Seed stays in your browser. Used only to derive your private key for local decryption.</p>
              </div>
            </>
          )}

          {error && <p className="text-red-400 text-xs font-mono">{error}</p>}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full bg-green-700 hover:bg-green-600 text-white text-sm font-black py-3 rounded-xl transition-colors disabled:opacity-30"
          >
            {loading
              ? (mode === 'send' ? 'ENCRYPTING + STORING...' : 'FETCHING + DECRYPTING...')
              : (mode === 'send' ? 'ENCRYPT & STORE' : 'RETRIEVE & DECRYPT')}
          </button>
        </div>
      )}

      {step === 'result' && result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <p className="text-green-400 text-xs font-mono font-bold">
              {mode === 'send' ? 'ENCRYPTED & STORED' : 'DECRYPTED LOCALLY'}
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
            {mode === 'send' ? (
              <>
                <div>
                  <p className="text-zinc-500 text-xs font-mono mb-1">MESSAGE ID (share with recipient)</p>
                  <p className="text-green-400 font-mono text-sm break-all">{result.messageId}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs font-mono mb-1">EXPIRES</p>
                  <p className="text-white text-xs">{new Date(result.expiresAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <p className="text-emerald-400 text-xs font-mono">E2E encrypted — only the recipient can decrypt</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-zinc-500 text-xs font-mono mb-1">FROM</p>
                  <p className="text-white font-mono text-xs break-all">{result.from}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs font-mono mb-1">MESSAGE</p>
                  <pre className="text-zinc-200 text-xs leading-relaxed whitespace-pre-wrap font-mono bg-black/40 rounded-lg p-3 mt-1">
                    {decryptedMessage}
                  </pre>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <p className="text-emerald-400 text-xs font-mono">Decrypted in your browser — server never saw this</p>
                </div>
              </>
            )}
          </div>

          <button
            onClick={reset}
            className="w-full border border-zinc-700 text-zinc-400 text-sm py-2 rounded-xl hover:border-zinc-500 transition-colors"
          >
            RESET
          </button>
        </div>
      )}
    </div>
  )
}
