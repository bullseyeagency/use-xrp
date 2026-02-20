'use client'

import { useState, useEffect } from 'react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: '01',
    icon: '◎',
    title: 'Message Typed',
    where: 'BROWSER ONLY',
    desc: 'Plaintext exists only in your browser RAM. It never touches a network request. Never logged anywhere. If you close the tab now, it vanishes permanently.',
    payloadLabel: 'PLAINTEXT — LIVES IN BROWSER MEMORY',
    payload: '"Meet me at the usual spot. Bring the drives."',
    encrypted: false,
    color: { bg: 'bg-blue-500/10', border: 'border-blue-500/40', text: 'text-blue-400', bar: 'bg-blue-500', dot: 'bg-blue-400' },
  },
  {
    num: '02',
    icon: '⬡',
    title: 'Ephemeral Key Pair',
    where: 'BROWSER ONLY',
    desc: 'A cryptographically random 256-bit secp256k1 private key is generated for this message only. It will be discarded the moment encryption completes. It never existed anywhere else.',
    payloadLabel: 'ONE-TIME PRIVATE KEY — DISCARDED AFTER USE',
    payload: 'a7f3c9b2e5d1f8a4c6b3e9d2f5a8c1b4\ne7d0f3a6c9b2e5d8f1a4c7b0e3d6f9a2',
    encrypted: false,
    color: { bg: 'bg-purple-500/10', border: 'border-purple-500/40', text: 'text-purple-400', bar: 'bg-purple-500', dot: 'bg-purple-400' },
  },
  {
    num: '03',
    icon: '◈',
    title: "Recipient's Public Key",
    where: 'FETCHED FROM XRPL',
    desc: "The recipient's secp256k1 public key is read from the XRP Ledger — from the SigningPubKey field of any signed transaction they've ever made. No key servers. No PKI. The blockchain is the directory.",
    payloadLabel: 'RECIPIENT PUBLIC KEY — 33 BYTES, FROM XRPL',
    payload: '028a3f9b2c7d4e1f6b5c3a8d2e7f9012\na4b6c8d0e2f4a6c8d0e2f4a6c8d0e2f4',
    encrypted: false,
    color: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/40', text: 'text-cyan-400', bar: 'bg-cyan-500', dot: 'bg-cyan-400' },
  },
  {
    num: '04',
    icon: '◆',
    title: 'ECDH Shared Secret',
    where: 'BROWSER ONLY',
    desc: 'Elliptic-Curve Diffie-Hellman: the ephemeral private key is multiplied by the recipient\'s public key point on secp256k1. The result is a shared secret only these two keys can produce — and neither key is transmitted.',
    payloadLabel: 'SHARED SECRET — NEVER TRANSMITTED, SHA-256 HASHED FOR AES',
    payload: '7f3a9b2c4d8e1f5a6c3b7d2e8f4a1c5b\n9d7e3f1a5c8b2d6e0f4a9c3b7d1e5f9a',
    encrypted: false,
    color: { bg: 'bg-green-500/10', border: 'border-green-500/40', text: 'text-green-400', bar: 'bg-green-500', dot: 'bg-green-400' },
  },
  {
    num: '05',
    icon: '■',
    title: 'AES-256-GCM Encrypt',
    where: 'WEB CRYPTO API',
    desc: 'The shared secret becomes the 256-bit AES key. A random 96-bit IV is generated. AES-256-GCM provides both encryption and authentication — any tampering invalidates the auth tag and decryption fails entirely.',
    payloadLabel: 'ENCRYPTED BLOB — IV[12B] + CIPHERTEXT + AUTH TAG[16B] → BASE64',
    payload: 'GhYtR3kX9mP2wQ8vL5nJ7cF4bH6dA1eI\n0pK3sM5uN8yOzTbWqVxRlCgDhEiAjFnP\n...(base64 AES-256-GCM output)',
    encrypted: true,
    color: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/40', text: 'text-yellow-400', bar: 'bg-yellow-500', dot: 'bg-yellow-400' },
  },
  {
    num: '06',
    icon: '▲',
    title: 'Ciphertext Stored',
    where: 'SERVER (BLIND)',
    desc: 'Only the encrypted blob and ephemeral public key reach UseXRP servers. No private key. No shared secret. No plaintext. Even a full server breach gives an attacker nothing useful — mathematically.',
    payloadLabel: 'SERVER DATABASE RECORD — ALL THE SERVER EVER SEES',
    payload: '{\n  "encrypted": true,\n  "content": "GhYtR3kX9mP2...",\n  "ephemeralPublicKey": "02a3f9b2...",\n  "encryptionVersion": "ecies-secp256k1-aes256gcm-v1"\n}',
    encrypted: true,
    color: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', text: 'text-emerald-400', bar: 'bg-emerald-500', dot: 'bg-emerald-400' },
  },
]

const THREATS = [
  {
    attack: 'Server hacked / full data breach',
    gets: 'Encrypted blobs only',
    result: 'SAFE',
    reason: 'AES-256-GCM ciphertext is computationally indistinguishable from noise without the shared secret. Brute force: longer than the age of the universe.',
  },
  {
    attack: 'Network interception (MITM)',
    gets: 'Encrypted payload in transit',
    result: 'SAFE',
    reason: 'TLS + ECIES — attacker sees ciphertext they cannot decrypt without the recipient\'s private key. Two independent encryption layers.',
  },
  {
    attack: 'Government subpoena to UseXRP',
    gets: 'What we hand over: ciphertext',
    result: 'SAFE',
    reason: 'We literally cannot decrypt it. No key escrow. No master key. We have no ability to comply with decryption requests — by design.',
  },
  {
    attack: 'Sender\'s device fully compromised',
    gets: 'Messages on that device',
    result: 'PARTIAL',
    reason: 'Before encryption, plaintext exists in memory. This is the fundamental trust boundary: endpoint security. The protocol is not at fault.',
  },
  {
    attack: 'Future quantum computer',
    gets: 'Potentially historical messages',
    result: 'WATCH',
    reason: 'Ephemeral keys limit exposure per-message (forward secrecy). v2 will add a post-quantum layer (Kyber/NTRU) alongside secp256k1.',
  },
  {
    attack: 'Recipient\'s XRPL seed stolen',
    gets: 'All messages to that wallet',
    result: 'EXPOSED',
    reason: 'The seed is the root of trust. Protect it. Hardware wallet support is on the roadmap. This is equivalent to losing your email password.',
  },
]

const TECH_SPECS = [
  { spec: 'Protocol', value: 'ECIES', note: 'Elliptic Curve Integrated Encryption Scheme — standard hybrid encryption' },
  { spec: 'Elliptic Curve', value: 'secp256k1', note: 'Same curve as Bitcoin, Ethereum, XRP — 256-bit security level' },
  { spec: 'Key Exchange', value: 'ECDH', note: 'Elliptic-Curve Diffie-Hellman with ephemeral sender keys' },
  { spec: 'Key Derivation', value: 'SHA-256 (Web Crypto)', note: 'Of ECDH shared point x-coordinate → 256-bit AES key' },
  { spec: 'Symmetric Cipher', value: 'AES-256-GCM', note: 'NIST SP 800-38D authenticated encryption, 96-bit random IV per message' },
  { spec: 'Authentication Tag', value: '128 bits', note: 'GCM auth tag — any ciphertext tampering causes full decryption failure' },
  { spec: 'Message Format', value: 'base64(IV[12B] ‖ Ciphertext ‖ AuthTag[16B])', note: 'Self-contained encrypted blob' },
  { spec: 'Public Key Source', value: 'XRPL account_tx → SigningPubKey', note: 'No key servers, no PKI — the ledger is the directory' },
  { spec: 'Private Key Scope', value: 'Browser memory only', note: 'Derived from XRPL seed locally. Never transmitted. Never stored.' },
  { spec: 'Crypto Runtime', value: 'Web Crypto API (browser-native)', note: 'Hardware-accelerated AES. Sandboxed. No third-party JS for symmetric crypto.' },
  { spec: 'Version String', value: 'ecies-secp256k1-aes256gcm-v1', note: 'Protocol versioning for future upgrades' },
  { spec: 'Content Size Limit', value: '8192 chars (post-encoding)', note: 'Supports messages, keys, files up to ~6KB plaintext' },
]

// ─── Curve Points (y² = x³ + 7 over reals, mapped to SVG 400×200) ──────────
// x: [-2,4] → SVG [0,400]   y: [-8,8] → SVG [200,0]
const CURVE_UPPER = 'M 7,95 L 33,76 L 67,69 L 100,67 L 133,67 L 167,67 L 200,65 L 233,60 L 267,52 L 300,41 L 333,27 L 367,12'
const CURVE_LOWER = 'M 7,105 L 33,124 L 67,131 L 100,133 L 133,133 L 167,133 L 200,135 L 233,140 L 267,148 L 300,160 L 333,173 L 367,188'

// ─── Component ────────────────────────────────────────────────────────────────

export default function XSMSPage() {
  const [activeStep, setActiveStep] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)
  const [messageCount, setMessageCount] = useState(20)

  // Cost constants (drops) — 1 exchange = 1 send + 1 receive
  const PLATFORM_FEE_DROPS = 5   // platform fee per tx (send or receive)
  const TX_FEE_DROPS = 10        // XRPL network fee per tx (to validators)
  const USD_PER_DROP = 1.40 / 1_000_000

  const platformDrops = PLATFORM_FEE_DROPS * 2 * messageCount   // 10/exchange (5 send + 5 receive)
  const txFeeDrops    = TX_FEE_DROPS * 2 * messageCount          // 20/exchange (2 txs)
  const totalDrops    = platformDrops + txFeeDrops               // 30/exchange
  const totalUSD      = totalDrops * USD_PER_DROP
  const perMsgDrops   = 30                                       // drops per exchange

  useEffect(() => {
    if (!autoPlay) return
    const t = setTimeout(() => setActiveStep(s => (s + 1) % STEPS.length), 3200)
    return () => clearTimeout(t)
  }, [activeStep, autoPlay])

  const step = STEPS[activeStep]

  return (
    <main className="min-h-screen bg-black overflow-hidden">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed top-0 left-0 w-[700px] h-[500px] bg-green-600/6 rounded-full blur-3xl -translate-x-1/3" />
      <div className="pointer-events-none fixed top-1/3 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-3xl translate-x-1/3" />
      <div className="pointer-events-none fixed bottom-0 left-1/2 w-[600px] h-[400px] bg-purple-600/5 rounded-full blur-3xl -translate-x-1/2" />

      {/* ── NAV ── */}
      <header className="border-b border-zinc-800/80 px-6 py-4 flex items-center gap-4 backdrop-blur-sm bg-black/70 sticky top-0 z-40">
        <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center text-white font-black text-xs">X</div>
          <span className="text-white font-black text-base tracking-tight">UseXRP</span>
        </a>
        <span className="text-zinc-700">/</span>
        <span className="text-green-400 text-sm font-mono font-bold tracking-wider">xSMS XRP</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-emerald-400 border border-emerald-800/50 bg-emerald-950/30 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            E2E ENCRYPTED
          </span>
          <a href="/services" className="text-xs font-mono text-zinc-500 hover:text-white transition-colors border border-zinc-800 hover:border-zinc-600 rounded-full px-3 py-1.5">
            SEND MESSAGE →
          </a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4">

        {/* ── HERO ── */}
        <section className="pt-24 pb-20 text-center relative">
          {/* Background hex rain */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
            <div className="font-mono text-green-400/4 text-xs leading-5 break-all">
              {'028a3f9b2c7d4e1f6b5c3a8d2e7f9012a4b6c8d0e2f4a6c8d0e2GhYtR3kX9mP2wQ8vL5nJ7cF4bH6dA1eI0pK3sM5uN8yOzTbWqVxRlCgDhEiAjFnPa7f3c9b2e5d1f8a4c6b3e9d2f5a8c1b47f3a9b2c4d8e1f5a6c3b7d2e8f4a1c5b'.repeat(180)}
            </div>
          </div>

          <div className="relative">
            <div className="inline-flex items-center gap-2 border border-green-800/50 bg-green-950/20 rounded-full px-5 py-2 text-xs font-mono text-green-400 mb-10">
              ECIES · secp256k1 · AES-256-GCM · ZERO KNOWLEDGE
            </div>

            <div className="mb-6">
              <span className="text-7xl sm:text-9xl font-black tracking-tight text-white">x</span>
              <span className="text-7xl sm:text-9xl font-black tracking-tight" style={{ background: 'linear-gradient(135deg, #22c55e, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SMS</span>
            </div>

            <p className="text-xl sm:text-2xl font-black text-zinc-200 mb-4 tracking-tight">
              Secure Messaging on the XRP Ledger.
            </p>
            <p className="text-lg text-zinc-400 mb-8 font-mono">
              Not "we promise we can't read it" — <span className="text-white font-bold">mathematically impossible</span> for anyone to read it.
            </p>

            <p className="text-zinc-500 max-w-2xl mx-auto text-sm leading-relaxed mb-10">
              Your XRPL wallet already contains a secp256k1 key pair — the same elliptic curve used by Bitcoin and Ethereum.
              xSMS uses that identity to encrypt messages so thoroughly that UseXRP, any hacker, any government,
              and any supercomputer in existence <span className="text-white">cannot decrypt them</span> without your private key.
              The math is public. The guarantee is permanent.
            </p>

            <div className="flex flex-wrap gap-3 justify-center">
              <a href="/services" className="bg-green-700 hover:bg-green-600 text-white font-black px-8 py-4 rounded-2xl transition-colors text-sm tracking-wide">
                SEND ENCRYPTED MESSAGE
              </a>
              <a href="#ceremony" className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-mono px-8 py-4 rounded-2xl transition-colors text-sm">
                SEE THE MATH ↓
              </a>
            </div>
          </div>
        </section>

        {/* ── THREE PILLARS ── */}
        <section className="pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                badge: 'YOUR WALLET',
                headline: 'secp256k1',
                sub: 'The same elliptic curve as Bitcoin. Your XRPL wallet already has a key pair. No registration needed.',
                color: 'text-blue-400',
                border: 'border-blue-500/20',
                bg: 'bg-blue-500/5',
              },
              {
                badge: 'THE EXCHANGE',
                headline: 'ECDH',
                sub: 'Two parties, two private keys, one shared secret. Derived independently. Transmitted never.',
                color: 'text-green-400',
                border: 'border-green-500/20',
                bg: 'bg-green-500/5',
              },
              {
                badge: 'THE CIPHER',
                headline: 'AES-256',
                sub: '2²⁵⁶ possible keys. Brute force at the speed of light takes longer than the age of the universe.',
                color: 'text-purple-400',
                border: 'border-purple-500/20',
                bg: 'bg-purple-500/5',
              },
            ].map(({ badge, headline, sub, color, border, bg }) => (
              <div key={badge} className={`border ${border} ${bg} rounded-2xl p-8 text-center`}>
                <p className="text-xs font-mono text-zinc-600 mb-4 tracking-widest">{badge}</p>
                <p className={`text-5xl font-black ${color} mb-4`}>{headline}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── VS COMPARISON ── */}
        <section className="pb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-800" />
            <span className="text-xs font-mono text-zinc-500 tracking-widest">WHY THIS IS DIFFERENT</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-800" />
          </div>

          <div className="border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800">
              <div className="p-8">
                <div className="flex items-center gap-2 mb-6">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <p className="text-xs font-mono text-red-400 font-bold">TRADITIONAL MESSAGING</p>
                </div>
                <div className="space-y-4">
                  {[
                    ['Company holds your keys', 'They can read every message. So can a hacker who breaches them.'],
                    ['Identity requires signup', 'Email, phone, username — account can be suspended or deplatformed.'],
                    ['Server breach = exposure', 'Plaintext or server-decryptable ciphertext stored at rest.'],
                    ['Legal compliance possible', 'Subpoena → company provides plaintext. Policy, not math.'],
                    ['Trust the corporation', 'Security depends on their promises, not cryptographic guarantees.'],
                  ].map(([title, detail]) => (
                    <div key={title} className="flex items-start gap-3">
                      <span className="text-red-500 mt-0.5 shrink-0 font-bold">✗</span>
                      <div>
                        <p className="text-zinc-300 text-xs font-semibold">{title}</p>
                        <p className="text-zinc-600 text-xs mt-0.5">{detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 bg-green-950/10">
                <div className="flex items-center gap-2 mb-6">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-xs font-mono text-green-400 font-bold">xSMS XRP</p>
                </div>
                <div className="space-y-4">
                  {[
                    ['You hold the only key', 'Your private key never leaves your browser. Mathematically impossible for us to decrypt.'],
                    ['Identity = XRPL wallet', 'Your wallet address is your identity. No email. No deplatforming. Censorship-resistant.'],
                    ['Server breach = noise', 'Attacker gets AES-256-GCM ciphertext. Computationally indistinguishable from random bytes.'],
                    ['Subpoena = ciphertext', 'We hand over what we have. We literally cannot provide plaintext. Math, not policy.'],
                    ['Trust the math', 'secp256k1 and AES-256-GCM have been publicly scrutinized for decades. The code is auditable.'],
                  ].map(([title, detail]) => (
                    <div key={title} className="flex items-start gap-3">
                      <span className="text-green-400 mt-0.5 shrink-0 font-bold">✓</span>
                      <div>
                        <p className="text-zinc-200 text-xs font-semibold">{title}</p>
                        <p className="text-zinc-500 text-xs mt-0.5">{detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CONVERSATION COST CALCULATOR ── */}
        <section className="pb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-800" />
            <span className="text-xs font-mono text-zinc-500 tracking-widest">CONVERSATION COST CALCULATOR</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-800" />
          </div>

          <div className="border border-zinc-800 rounded-2xl overflow-hidden">
            {/* Slider */}
            <div className="p-8 border-b border-zinc-800">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-xs font-mono text-zinc-500 mb-1">MESSAGES IN CONVERSATION</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black text-white tabular-nums">{messageCount}</span>
                    <span className="text-zinc-500 font-mono text-sm">msg{messageCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono text-zinc-600 mb-1">TOTAL COST</p>
                  <p className="text-3xl font-black text-green-400 tabular-nums">{totalDrops.toLocaleString()}</p>
                  <p className="text-zinc-500 text-xs font-mono">drops <span className="text-zinc-600">(${totalUSD < 0.001 ? totalUSD.toFixed(6) : totalUSD.toFixed(4)})</span></p>
                </div>
              </div>

              {/* Range input */}
              <div className="relative mt-6">
                <input
                  type="range"
                  min={1}
                  max={500}
                  value={messageCount}
                  onChange={e => setMessageCount(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #22c55e ${(messageCount / 500) * 100}%, #27272a ${(messageCount / 500) * 100}%)`,
                  }}
                />
                <div className="flex justify-between mt-2 text-xs font-mono text-zinc-700">
                  <span>1</span>
                  <span>100</span>
                  <span>200</span>
                  <span>300</span>
                  <span>400</span>
                  <span>500</span>
                </div>
              </div>

              {/* Quick presets */}
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="text-xs font-mono text-zinc-600 self-center mr-1">PRESETS:</span>
                {[
                  { label: '10 msgs', v: 10 },
                  { label: '50 msgs', v: 50 },
                  { label: '100 msgs', v: 100 },
                  { label: '1 day', v: 40 },
                  { label: '1 week', v: 200 },
                  { label: '1 month', v: 500 },
                ].map(({ label, v }) => (
                  <button
                    key={label}
                    onClick={() => setMessageCount(v)}
                    className={`text-xs font-mono border rounded-full px-3 py-1 transition-colors ${
                      messageCount === v
                        ? 'border-green-600 text-green-400 bg-green-950/30'
                        : 'border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cost breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800">
              {/* Platform send fee */}
              <div className="p-6">
                <p className="text-xs font-mono text-zinc-600 mb-1">PLATFORM FEE (SEND)</p>
                <p className="text-2xl font-black text-blue-400 tabular-nums">{(PLATFORM_FEE_DROPS * messageCount).toLocaleString()}</p>
                <p className="text-zinc-600 text-xs font-mono">drops <span className="text-zinc-700">(${((PLATFORM_FEE_DROPS * messageCount) * USD_PER_DROP).toFixed(6)})</span></p>
                <div className="mt-3 space-y-1 text-xs font-mono text-zinc-600">
                  <div className="flex justify-between">
                    <span>5 drops × {messageCount} exchanges</span>
                    <span className="text-zinc-500">{(PLATFORM_FEE_DROPS * messageCount).toLocaleString()} <span className="text-zinc-700">(${((PLATFORM_FEE_DROPS * messageCount) * USD_PER_DROP).toFixed(6)})</span></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Goes to UseXRP</span>
                    <span className="text-zinc-500">—</span>
                  </div>
                </div>
              </div>

              {/* Platform receive fee */}
              <div className="p-6">
                <p className="text-xs font-mono text-zinc-600 mb-1">PLATFORM FEE (RECEIVE)</p>
                <p className="text-2xl font-black text-yellow-400 tabular-nums">{(PLATFORM_FEE_DROPS * messageCount).toLocaleString()}</p>
                <p className="text-zinc-600 text-xs font-mono">drops <span className="text-zinc-700">(${((PLATFORM_FEE_DROPS * messageCount) * USD_PER_DROP).toFixed(6)})</span></p>
                <div className="mt-3 space-y-1 text-xs font-mono text-zinc-600">
                  <div className="flex justify-between">
                    <span>5 drops × {messageCount} exchanges</span>
                    <span className="text-zinc-500">{(PLATFORM_FEE_DROPS * messageCount).toLocaleString()} <span className="text-zinc-700">(${((PLATFORM_FEE_DROPS * messageCount) * USD_PER_DROP).toFixed(6)})</span></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Goes to UseXRP</span>
                    <span className="text-zinc-500">—</span>
                  </div>
                </div>
              </div>

              {/* TX fee */}
              <div className="p-6">
                <p className="text-xs font-mono text-zinc-600 mb-1">XRPL NETWORK FEE</p>
                <p className="text-2xl font-black text-purple-400 tabular-nums">{txFeeDrops.toLocaleString()}</p>
                <p className="text-zinc-600 text-xs font-mono">drops <span className="text-zinc-700">(${(txFeeDrops * USD_PER_DROP).toFixed(6)})</span></p>
                <div className="mt-3 space-y-1 text-xs font-mono text-zinc-600">
                  <div className="flex justify-between">
                    <span>2 txs × 10 drops × {messageCount}</span>
                    <span className="text-zinc-500">{txFeeDrops.toLocaleString()} <span className="text-zinc-700">(${(txFeeDrops * USD_PER_DROP).toFixed(6)})</span></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Goes to XRPL validators</span>
                    <span className="text-zinc-500">—</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stacked bar */}
            <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/40">
              <p className="text-xs font-mono text-zinc-600 mb-2">COST BREAKDOWN</p>
              <div className="flex h-3 rounded-full overflow-hidden gap-px">
                <div
                  className="bg-blue-500 transition-all duration-300"
                  style={{ width: `${((PLATFORM_FEE_DROPS * messageCount) / totalDrops) * 100}%` }}
                  title={`Platform send: ${(PLATFORM_FEE_DROPS * messageCount).toLocaleString()} drops`}
                />
                <div
                  className="bg-yellow-500 transition-all duration-300"
                  style={{ width: `${((PLATFORM_FEE_DROPS * messageCount) / totalDrops) * 100}%` }}
                  title={`Platform receive: ${(PLATFORM_FEE_DROPS * messageCount).toLocaleString()} drops`}
                />
                <div
                  className="bg-purple-500 transition-all duration-300"
                  style={{ width: `${(txFeeDrops / totalDrops) * 100}%` }}
                  title={`Network TX: ${txFeeDrops.toLocaleString()} drops`}
                />
              </div>
              <div className="flex gap-4 mt-2">
                {[
                  { color: 'bg-blue-500', label: 'Platform Send', pct: Math.round(((PLATFORM_FEE_DROPS * messageCount) / totalDrops) * 100) },
                  { color: 'bg-yellow-500', label: 'Platform Receive', pct: Math.round(((PLATFORM_FEE_DROPS * messageCount) / totalDrops) * 100) },
                  { color: 'bg-purple-500', label: 'Network TX', pct: Math.round((txFeeDrops / totalDrops) * 100) },
                ].map(({ color, label, pct }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs font-mono text-zinc-500">
                    <span className={`w-2 h-2 rounded-full ${color} shrink-0`} />
                    {label} {pct}%
                  </div>
                ))}
              </div>
            </div>

            {/* USD + per-exchange + context */}
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800 border-t border-zinc-800">
              <div className="p-6 bg-green-950/10">
                <p className="text-xs font-mono text-zinc-500 mb-1">TOTAL IN USD</p>
                <p className="text-3xl font-black text-green-400 tabular-nums">
                  ${totalUSD < 0.001 ? totalUSD.toFixed(6) : totalUSD.toFixed(4)}
                </p>
                <p className="text-zinc-500 text-xs font-mono mt-1">at XRP = $1.40</p>
              </div>

              <div className="p-6">
                <p className="text-xs font-mono text-zinc-500 mb-1">PER EXCHANGE</p>
                <p className="text-3xl font-black text-white tabular-nums">{perMsgDrops}</p>
                <p className="text-zinc-500 text-xs font-mono mt-1">
                  drops <span className="text-zinc-600">(${(perMsgDrops * USD_PER_DROP).toFixed(7)})</span>
                </p>
              </div>

              <div className="p-6">
                <p className="text-xs font-mono text-zinc-500 mb-1">$1 BUYS YOU</p>
                <p className="text-3xl font-black text-white tabular-nums">
                  {Math.floor(1 / (totalUSD / messageCount)).toLocaleString()}
                </p>
                <p className="text-zinc-500 text-xs font-mono mt-1">
                  encrypted messages
                </p>
              </div>
            </div>

            {/* Competitor comparison */}
            <div className="border-t border-zinc-800 p-6 bg-zinc-950/40">
              <p className="text-xs font-mono text-zinc-600 mb-4">COST COMPARISON FOR {messageCount} MESSAGES</p>
              <div className="space-y-2">
                {[
                  {
                    name: 'iMessage / WhatsApp',
                    cost: '$0.00',
                    note: 'Apple / Meta store and can access your metadata. US law enforcement requests honored.',
                    bar: 0,
                    color: 'bg-zinc-700',
                    tag: 'FREE YOUR DATA',
                    tagColor: 'text-red-500 border-red-900/50',
                  },
                  {
                    name: 'Signal',
                    cost: '$0.00',
                    note: 'Strong E2E encryption. Non-profit. But a subpoena could compel metadata or key disclosure in edge cases.',
                    bar: 0,
                    color: 'bg-zinc-600',
                    tag: 'TRUST THE ORG',
                    tagColor: 'text-yellow-600 border-yellow-900/50',
                  },
                  {
                    name: 'xSMS XRP',
                    cost: `$${totalUSD < 0.001 ? totalUSD.toFixed(6) : totalUSD.toFixed(4)}`,
                    note: `${totalDrops.toLocaleString()} drops · 30/exchange (15 send + 15 receive) · 10 to platform · Server mathematically blind.`,
                    bar: 100,
                    color: 'bg-green-500',
                    tag: 'TRUST MATH',
                    tagColor: 'text-green-400 border-green-800/50',
                  },
                ].map(({ name, cost, note, bar, color, tag, tagColor }) => (
                  <div key={name} className="flex items-start gap-3">
                    <div className="w-32 shrink-0 pt-0.5">
                      <p className="text-zinc-300 text-xs font-semibold">{name}</p>
                      <p className="text-zinc-600 text-xs font-mono">{cost}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden mb-1">
                        <div className={`h-full ${color} rounded-full`} style={{ width: bar > 0 ? '100%' : '4px' }} />
                      </div>
                      <p className="text-zinc-600 text-xs leading-relaxed">{note}</p>
                    </div>
                    <span className={`shrink-0 text-xs font-mono border rounded-full px-2 py-0.5 ${tagColor}`}>{tag}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── THE ENCRYPTION CEREMONY ── */}
        <section id="ceremony" className="pb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-800" />
            <span className="text-xs font-mono text-zinc-500 tracking-widest">THE ENCRYPTION CEREMONY</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-800" />
          </div>

          <p className="text-zinc-500 text-xs font-mono text-center mb-6">
            Every xSMS message goes through 6 cryptographic steps — all in your browser before anything touches a server.
          </p>

          {/* Step tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => { setActiveStep(i); setAutoPlay(false) }}
                className={`shrink-0 w-10 h-10 rounded-xl text-xs font-mono font-black transition-all border ${
                  activeStep === i
                    ? `${s.color.bg} ${s.color.border} ${s.color.text}`
                    : 'border-zinc-800 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700'
                }`}
              >
                {s.num}
              </button>
            ))}
            <button
              onClick={() => setAutoPlay(a => !a)}
              className={`shrink-0 px-4 h-10 rounded-xl text-xs font-mono border transition-colors ml-auto ${
                autoPlay ? 'border-zinc-600 text-zinc-400 bg-zinc-900/50' : 'border-zinc-800 text-zinc-600 hover:text-zinc-400'
              }`}
            >
              {autoPlay ? '⏸ PAUSE' : '▶ AUTO'}
            </button>
          </div>

          {/* Active step */}
          <div className={`border ${step.color.border} ${step.color.bg} rounded-2xl overflow-hidden transition-all duration-500`}>
            <div className="p-8">
              <div className="flex items-start gap-5 mb-6">
                <div className={`w-14 h-14 rounded-2xl ${step.color.bg} border ${step.color.border} flex items-center justify-center text-3xl ${step.color.text} shrink-0`}>
                  {step.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className={`text-xs font-mono font-bold ${step.color.text}`}>STEP {step.num}</span>
                    <span className="text-zinc-700">·</span>
                    <span className={`text-xs font-mono ${step.color.text} border ${step.color.border} rounded-full px-2 py-0.5`}>{step.where}</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">{step.title}</h3>
                </div>
              </div>

              <p className="text-zinc-300 text-sm leading-relaxed mb-6 max-w-2xl">{step.desc}</p>

              <div className="bg-black/60 border border-zinc-800 rounded-xl p-4">
                <p className={`text-xs font-mono ${step.color.text} mb-2 font-bold`}>{step.payloadLabel}</p>
                <pre className={`font-mono text-xs leading-relaxed whitespace-pre-wrap break-all ${step.encrypted ? 'text-zinc-600' : 'text-zinc-200'}`}>
                  {step.payload}
                </pre>
                {step.encrypted && (
                  <p className="text-zinc-700 text-xs mt-3 font-mono italic">
                    ↑ Indistinguishable from random noise without the shared secret. No pattern. No structure. No information.
                  </p>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-zinc-900/80">
              <div
                className={`h-full ${step.color.bar} transition-all duration-500`}
                style={{ width: `${((activeStep + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step grid nav */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
            {STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => { setActiveStep(i); setAutoPlay(false) }}
                className={`text-left border rounded-xl p-3 transition-all text-xs ${
                  activeStep === i
                    ? `${s.color.border} ${s.color.bg}`
                    : 'border-zinc-800/60 opacity-40 hover:opacity-70'
                }`}
              >
                <span className={`font-mono font-bold ${s.color.text} block mb-0.5`}>{s.num}</span>
                <span className="text-white font-semibold">{s.title}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── THE ECDH KEY EXCHANGE ── */}
        <section className="pb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-800" />
            <span className="text-xs font-mono text-zinc-500 tracking-widest">THE KEY EXCHANGE — VISUALIZED</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-800" />
          </div>

          <div className="border border-zinc-800 rounded-2xl overflow-hidden">
            {/* Curve */}
            <div className="border-b border-zinc-800 p-8 bg-zinc-950/40">
              <p className="text-xs font-mono text-zinc-600 mb-2 text-center tracking-widest">secp256k1 — y² = x³ + 7</p>
              <p className="text-xs font-mono text-zinc-700 mb-6 text-center">The elliptic curve shared by Bitcoin, Ethereum, and your XRPL wallet</p>

              <div className="flex justify-center">
                <svg width="480" height="220" viewBox="0 0 480 220" className="max-w-full overflow-visible">
                  {/* Grid */}
                  <line x1="0" y1="110" x2="480" y2="110" stroke="#27272a" strokeWidth="1" />
                  <line x1="240" y1="0" x2="240" y2="220" stroke="#27272a" strokeWidth="1" />
                  <text x="244" y="12" fill="#3f3f46" fontSize="9" fontFamily="monospace">y</text>
                  <text x="463" y="118" fill="#3f3f46" fontSize="9" fontFamily="monospace">x</text>

                  {/* Upper curve */}
                  <path d={CURVE_UPPER} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
                  {/* Lower curve */}
                  <path d={CURVE_LOWER} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />

                  {/* Dashed lines between points */}
                  <line x1="120" y1="79" x2="280" y2="62" stroke="#4b5563" strokeWidth="1" strokeDasharray="4,3" />
                  <line x1="120" y1="79" x2="360" y2="162" stroke="#4b5563" strokeWidth="1" strokeDasharray="4,3" />

                  {/* Shared secret S */}
                  <circle cx="197" cy="68" r="8" fill="#22c55e" fillOpacity="0.2" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="3,2" />
                  <text x="172" y="57" fill="#4ade80" fontSize="11" fontFamily="monospace" fontWeight="bold">S</text>
                  <text x="158" y="47" fill="#4ade80" fontSize="8" fontFamily="monospace">(shared secret)</text>

                  {/* Generator point G */}
                  <circle cx="120" cy="79" r="6" fill="#3b82f6" />
                  <text x="100" y="70" fill="#60a5fa" fontSize="10" fontFamily="monospace" fontWeight="bold">G</text>
                  <text x="82" y="60" fill="#60a5fa" fontSize="8" fontFamily="monospace">generator</text>

                  {/* Ephemeral public key */}
                  <circle cx="280" cy="62" r="6" fill="#a855f7" />
                  <text x="286" y="56" fill="#c084fc" fontSize="10" fontFamily="monospace" fontWeight="bold">kₑ·G</text>
                  <text x="286" y="46" fill="#c084fc" fontSize="8" fontFamily="monospace">ephemeral pub</text>

                  {/* Recipient public key */}
                  <circle cx="360" cy="162" r="6" fill="#06b6d4" />
                  <text x="366" y="157" fill="#22d3ee" fontSize="10" fontFamily="monospace" fontWeight="bold">kᵣ·G</text>
                  <text x="366" y="175" fill="#22d3ee" fontSize="8" fontFamily="monospace">recipient pub</text>

                  {/* Equation overlay */}
                  <rect x="10" y="185" width="460" height="28" rx="4" fill="#0a0a0a" />
                  <text x="240" y="203" fill="#4ade80" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    kₑ × (kᵣ·G) = kᵣ × (kₑ·G) = S
                  </text>
                </svg>
              </div>

              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {[
                  { dot: 'bg-blue-500', label: 'G — Generator point (public, fixed on secp256k1)' },
                  { dot: 'bg-purple-500', label: 'kₑ·G — Ephemeral public key (sent with message)' },
                  { dot: 'bg-cyan-500', label: 'kᵣ·G — Recipient public key (from XRPL)' },
                  { dot: 'bg-green-500', label: 'S — Shared secret (never transmitted)' },
                ].map(({ dot, label }) => (
                  <div key={label} className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                    <span className={`w-2 h-2 rounded-full ${dot} shrink-0`} />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Side-by-side computation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800">
              <div className="p-6">
                <p className="text-purple-400 text-xs font-mono font-bold mb-4">SENDER BROWSER</p>
                <div className="space-y-2">
                  {[
                    ['1.', 'Generate random', 'kₑ', '(ephemeral private key)'],
                    ['2.', 'Compute', 'kₑ·G', '= ephemeral public key'],
                    ['3.', 'Fetch recipient\'s', 'kᵣ·G', 'from XRPL on-chain'],
                    ['4.', 'Compute', 'S = kₑ × (kᵣ·G)', '(ECDH)'],
                    ['5.', 'SHA-256(S.x)', '→ AES-256 key', ''],
                    ['6.', 'AES-GCM encrypt', 'message', ''],
                  ].map(([n, a, b, c]) => (
                    <div key={n} className="flex items-center gap-2 font-mono text-xs text-zinc-500">
                      <span className="text-zinc-700 w-4 shrink-0">{n}</span>
                      <span>{a}</span>
                      <span className="text-purple-300 font-bold">{b}</span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6">
                <p className="text-cyan-400 text-xs font-mono font-bold mb-4">RECIPIENT BROWSER</p>
                <div className="space-y-2">
                  {[
                    ['1.', 'Retrieve encrypted blob from server', '', ''],
                    ['2.', 'Extract ephemeral public key', 'kₑ·G', ''],
                    ['3.', 'Use own private key', 'kᵣ', '(from seed)'],
                    ['4.', 'Compute', 'S = kᵣ × (kₑ·G)', '(same ECDH)'],
                    ['5.', 'SHA-256(S.x)', '→ same AES key', ''],
                    ['6.', 'AES-GCM decrypt', '→ plaintext', ''],
                  ].map(([n, a, b, c]) => (
                    <div key={n} className="flex items-center gap-2 font-mono text-xs text-zinc-500">
                      <span className="text-zinc-700 w-4 shrink-0">{n}</span>
                      <span>{a}</span>
                      <span className="text-cyan-300 font-bold">{b}</span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* The insight */}
            <div className="border-t border-zinc-800 p-6 bg-green-950/10">
              <p className="text-center font-mono text-sm">
                <span className="text-green-400 font-black text-lg">kₑ × (kᵣ·G) = kᵣ × (kₑ·G)</span>
              </p>
              <p className="text-center text-zinc-500 text-xs mt-2">
                The commutative property of elliptic curve point multiplication.
                Two parties. Two private keys. One shared secret. Zero communication of the secret itself.
              </p>
            </div>
          </div>
        </section>

        {/* ── FORWARD SECRECY ── */}
        <section className="pb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-800" />
            <span className="text-xs font-mono text-zinc-500 tracking-widest">FORWARD SECRECY — WHY EPHEMERAL KEYS MATTER</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-800" />
          </div>

          <div className="border border-zinc-800 rounded-2xl p-8 bg-zinc-950/40">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
              <div className="border border-red-900/30 bg-red-950/10 rounded-xl p-5">
                <p className="text-red-400 font-mono text-xs font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  WITHOUT FORWARD SECRECY
                </p>
                <div className="space-y-3">
                  {[
                    'Same private key used for every message',
                    'Attacker records all encrypted traffic (cheap)',
                    'Later, attacker steals or breaks your private key',
                    'All historical messages decrypted retroactively',
                    'Every message you ever sent is compromised',
                  ].map((s, i) => (
                    <div key={i} className="flex items-start gap-2 font-mono text-xs text-zinc-500">
                      <span className="text-red-600 shrink-0">{i + 1}.</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-green-800/30 bg-green-950/10 rounded-xl p-5">
                <p className="text-green-400 font-mono text-xs font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  xSMS — EPHEMERAL KEYS
                </p>
                <div className="space-y-3">
                  {[
                    'Fresh random key pair generated per message',
                    'Ephemeral private key discarded immediately after encrypt',
                    'Attacker records all encrypted traffic (useless)',
                    'Later, attacker steals your permanent wallet key',
                    'Past messages: keys are gone. Mathematically impossible.',
                  ].map((s, i) => (
                    <div key={i} className="flex items-start gap-2 font-mono text-xs text-zinc-400">
                      <span className="text-green-400 shrink-0">{i + 1}.</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-black/50 border border-zinc-800 rounded-xl p-5 text-center">
              <p className="text-zinc-400 text-sm leading-relaxed">
                Each message generates a unique AES-256 key derived from a unique ephemeral key pair.
                <span className="text-white font-bold"> Compromise message #1,000 — you get message #1,000.</span>
                <br />Messages #1 through #999 and #1,001 onward remain encrypted. Permanently.
              </p>
            </div>
          </div>
        </section>

        {/* ── SERVER BLINDNESS ── */}
        <section className="pb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-800" />
            <span className="text-xs font-mono text-zinc-500 tracking-widest">WHAT THE SERVER ACTUALLY SEES</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-800" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-zinc-700 rounded-2xl overflow-hidden">
              <div className="border-b border-zinc-700 px-4 py-3 flex items-center gap-2 bg-zinc-900/60">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs font-mono text-zinc-400 font-bold">SERVER DATABASE (+ ANY HACKER WHO BREACHES IT)</span>
              </div>
              <div className="p-5 bg-zinc-950">
                <pre className="text-xs font-mono text-zinc-600 leading-relaxed">
{`{
  "id": "3f7a2c-9b4e-...",
  "toAddress": "rXXX...",
  "fromAddress": "rYYY...",
  "encrypted": true,
  "ephemeralPublicKey": "028a3f9b2c...",
  "encryptionVersion":
    "ecies-secp256k1-aes256gcm-v1",
  "content": "GhYtR3kX9mP2wQ8vL5nJ7c
    F4bH6dA1eI0pK3sM5uN8yOzTbW
    qVxRlCgDhEiAjFnPm...",
  "storedAt": 1708000000000,
  "expiresAt": 1708604800000,
  "retrieved": false
}`}
                </pre>
                <div className="mt-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <p className="text-red-500/60 text-xs font-mono">Useless without the recipient's private key — which is never here</p>
                </div>
              </div>
            </div>

            <div className="border border-green-800/50 rounded-2xl overflow-hidden">
              <div className="border-b border-green-800/50 px-4 py-3 flex items-center gap-2 bg-green-950/20">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-mono text-green-400 font-bold">RECIPIENT'S BROWSER (AFTER LOCAL DECRYPTION)</span>
              </div>
              <div className="p-5 bg-zinc-950">
                <div className="bg-green-950/20 border border-green-800/30 rounded-xl p-5 mb-4">
                  <p className="text-zinc-100 text-sm font-mono leading-relaxed">
                    "Meet me at the usual spot. Bring the drives."
                  </p>
                </div>
                <div className="space-y-2">
                  {[
                    'Decrypted in the browser',
                    'Private key never left their device',
                    'Server never saw this text',
                    'This message cannot be subpoenaed from UseXRP',
                  ].map(line => (
                    <div key={line} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                      <p className="text-zinc-500 text-xs font-mono">{line}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECURITY GUARANTEES ── */}
        <section className="pb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-800" />
            <span className="text-xs font-mono text-zinc-500 tracking-widest">SECURITY PROPERTIES</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-800" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                glyph: '◈',
                title: 'Mathematically Enforced',
                desc: 'Not a policy statement. The laws of mathematics prevent decryption without the private key. 2²⁵⁶ AES key combinations. The sun burns out first.',
                color: 'text-green-400', border: 'border-green-500/20', bg: 'bg-green-500/5',
              },
              {
                glyph: '⬡',
                title: 'Forward Secrecy',
                desc: 'Ephemeral key pairs mean compromising your current key cannot decrypt past messages. Each message has its own independent AES key.',
                color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/5',
              },
              {
                glyph: '◆',
                title: 'Zero Knowledge Server',
                desc: 'UseXRP stores ciphertext. We cannot read your messages — not by policy but by impossibility. No master key. No escrow.',
                color: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-500/5',
              },
              {
                glyph: '▲',
                title: 'Blockchain Identity',
                desc: 'No usernames. No passwords. No email. Your XRPL wallet address is your identity — cryptographically linked to your secp256k1 key pair on a public ledger.',
                color: 'text-yellow-400', border: 'border-yellow-500/20', bg: 'bg-yellow-500/5',
              },
              {
                glyph: '■',
                title: 'Tamper Detection',
                desc: 'AES-256-GCM includes a 128-bit authentication tag. Any modification to the ciphertext in transit causes decryption to fail completely. Tampering is detected, not silently accepted.',
                color: 'text-cyan-400', border: 'border-cyan-500/20', bg: 'bg-cyan-500/5',
              },
              {
                glyph: '◎',
                title: 'Open Protocol',
                desc: 'ECIES with secp256k1 is a public standard. The cryptography is auditable. Any client that implements the protocol can encrypt/decrypt messages — no proprietary lock-in.',
                color: 'text-orange-400', border: 'border-orange-500/20', bg: 'bg-orange-500/5',
              },
            ].map(({ glyph, title, desc, color, border, bg }) => (
              <div key={title} className={`border ${border} ${bg} rounded-2xl p-6`}>
                <div className={`text-4xl ${color} mb-4`}>{glyph}</div>
                <h3 className="text-white font-bold text-sm mb-2">{title}</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── THREAT MODEL ── */}
        <section className="pb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-800" />
            <span className="text-xs font-mono text-zinc-500 tracking-widest">THREAT MODEL</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-800" />
          </div>

          <div className="border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="border-b border-zinc-800 px-6 py-3 bg-zinc-950/40">
              <p className="text-xs font-mono text-zinc-500">WHAT HAPPENS WHEN DIFFERENT THINGS GO WRONG</p>
            </div>
            <div className="divide-y divide-zinc-800/60">
              {THREATS.map(({ attack, gets, result, reason }) => {
                const resultColor = result === 'SAFE' ? 'text-green-400 border-green-800/50 bg-green-950/30' : result === 'PARTIAL' ? 'text-yellow-400 border-yellow-800/50 bg-yellow-950/20' : result === 'WATCH' ? 'text-orange-400 border-orange-800/50 bg-orange-950/20' : 'text-red-400 border-red-800/50 bg-red-950/20'
                return (
                  <div key={attack} className="px-6 py-5 grid grid-cols-1 sm:grid-cols-4 gap-3 hover:bg-zinc-900/20 transition-colors">
                    <div className="sm:col-span-1">
                      <p className="text-zinc-500 text-xs font-mono font-bold mb-1">SCENARIO</p>
                      <p className="text-zinc-300 text-xs leading-relaxed">{attack}</p>
                    </div>
                    <div className="sm:col-span-1">
                      <p className="text-zinc-500 text-xs font-mono font-bold mb-1">ATTACKER GETS</p>
                      <p className="text-zinc-400 text-xs">{gets}</p>
                    </div>
                    <div className="sm:col-span-1">
                      <p className="text-zinc-500 text-xs font-mono font-bold mb-1">STATUS</p>
                      <span className={`text-xs font-mono font-black border rounded-full px-2 py-0.5 ${resultColor}`}>{result}</span>
                    </div>
                    <div className="sm:col-span-1">
                      <p className="text-zinc-500 text-xs font-mono font-bold mb-1">WHY</p>
                      <p className="text-zinc-600 text-xs leading-relaxed">{reason}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── TECH SPECS ── */}
        <section className="pb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-800" />
            <span className="text-xs font-mono text-zinc-500 tracking-widest">TECHNICAL SPECIFICATION</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-800" />
          </div>

          <div className="border border-zinc-800 rounded-2xl overflow-hidden">
            {TECH_SPECS.map(({ spec, value, note }, i) => (
              <div
                key={spec}
                className={`px-6 py-4 grid grid-cols-3 gap-4 hover:bg-zinc-900/20 transition-colors ${i > 0 ? 'border-t border-zinc-800/60' : ''}`}
              >
                <div>
                  <p className="text-zinc-600 text-xs font-mono">{spec}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-white text-xs font-mono font-semibold">{value}</p>
                  <p className="text-zinc-600 text-xs mt-0.5 leading-relaxed">{note}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="pb-24 text-center">
          <div className="border border-green-800/40 bg-green-950/15 rounded-2xl p-12 relative overflow-hidden">
            {/* Glow */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 bg-green-500/5 rounded-full blur-3xl" />
            </div>

            <div className="relative">
              <p className="text-xs font-mono text-green-600 mb-4 tracking-widest">ZERO KNOWLEDGE · ZERO PASSWORDS · ZERO TRUST REQUIRED</p>
              <h2 className="text-4xl font-black text-white mb-4">
                Send your first encrypted message.
              </h2>
              <p className="text-zinc-500 text-sm max-w-lg mx-auto mb-8 leading-relaxed">
                15 drops to send. 15 drops to receive. 30 per exchange.
                Your private key never leaves your browser.
                The XRP Ledger verifies identity.
                The math handles the rest.
              </p>

              <div className="flex flex-wrap gap-3 justify-center">
                <a href="/services" className="bg-green-700 hover:bg-green-600 text-white font-black px-10 py-4 rounded-2xl transition-colors text-sm tracking-wide">
                  OPEN DEAD DROP →
                </a>
                <a href="/how-it-works" className="border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white font-mono px-10 py-4 rounded-2xl transition-colors text-sm">
                  HOW DROPS = COMPUTE
                </a>
              </div>

              <p className="text-zinc-700 text-xs font-mono mt-8">
                ECIES · secp256k1 · AES-256-GCM · Forward Secrecy · Zero Knowledge Server
              </p>
            </div>
          </div>
        </section>

      </div>

      <footer className="border-t border-zinc-900 px-6 py-6 text-center">
        <p className="text-xs font-mono text-zinc-700">
          xSMS XRP · UseXRP · ECIES · secp256k1 · AES-256-GCM · Zero Knowledge
        </p>
      </footer>
    </main>
  )
}
