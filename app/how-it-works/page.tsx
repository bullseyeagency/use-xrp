'use client'

import { useState, useEffect, useRef } from 'react'

const XRP_USD = 1.40
const DROPS_PER_XRP = 1_000_000
const BLENDED_RATE_PER_M = 8.00
const DROPS_PER_TOKEN = BLENDED_RATE_PER_M / (XRP_USD * 1)   // 5.714...
const USD_PER_DROP = XRP_USD / DROPS_PER_XRP                  // 0.0000014

const MODELS = [
  { name: 'Grok 4 Fast',       provider: 'xAI',       totalPerM: 0.70,  color: 'text-green-400',  bar: 'bg-green-500' },
  { name: 'GPT-4.1 Nano',      provider: 'OpenAI',    totalPerM: 0.50,  color: 'text-green-300',  bar: 'bg-green-400' },
  { name: 'GPT-4.1 Mini',      provider: 'OpenAI',    totalPerM: 2.00,  color: 'text-blue-400',   bar: 'bg-blue-500' },
  { name: 'Gemini 3.1 Pro',    provider: 'Google',    totalPerM: 14.00, color: 'text-yellow-400', bar: 'bg-yellow-500' },
  { name: 'GPT-4.1',           provider: 'OpenAI',    totalPerM: 10.00, color: 'text-orange-400', bar: 'bg-orange-500' },
  { name: 'Claude Sonnet 4.6', provider: 'Anthropic', totalPerM: 18.00, color: 'text-purple-400', bar: 'bg-purple-500' },
  { name: 'GPT-5.2',           provider: 'OpenAI',    totalPerM: 15.75, color: 'text-red-400',    bar: 'bg-red-500' },
]

function dropsPerToken(totalPerM: number) {
  return totalPerM / XRP_USD
}

function CountUp({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(0)
  const ref = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const start = Date.now()
    ref.current = setInterval(() => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(eased * target)
      if (progress >= 1) clearInterval(ref.current!)
    }, 16)
    return () => clearInterval(ref.current!)
  }, [target, duration])

  return <>{value.toLocaleString('en-US', { maximumFractionDigits: 4 })}</>
}

export default function HowItWorks() {
  const [drops, setDrops] = useState<string>('1000')
  const [tokens, setTokens] = useState<string>('')
  const [usd, setUsd] = useState<string>('')
  const [activeInput, setActiveInput] = useState<'drops' | 'tokens' | 'usd'>('drops')
  const [animStep, setAnimStep] = useState(0)

  // Bidirectional calculator
  useEffect(() => {
    if (activeInput === 'drops') {
      const d = parseFloat(drops) || 0
      setTokens((d / DROPS_PER_TOKEN).toFixed(2))
      setUsd((d * USD_PER_DROP).toFixed(8))
    } else if (activeInput === 'tokens') {
      const t = parseFloat(tokens) || 0
      setDrops((t * DROPS_PER_TOKEN).toFixed(2))
      setUsd((t * (BLENDED_RATE_PER_M / 1_000_000)).toFixed(8))
    } else {
      const u = parseFloat(usd) || 0
      const d = u / USD_PER_DROP
      setDrops(d.toFixed(2))
      setTokens((d / DROPS_PER_TOKEN).toFixed(2))
    }
  }, [drops, tokens, usd, activeInput])

  // Auto-animate the steps
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimStep(s => (s + 1) % 4)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const STEPS = [
    { label: 'COMPUTE RUNS', sub: 'Agent sends a request', color: 'blue', glyph: '⬡' },
    { label: 'TOKENS CONSUMED', sub: 'Input + output counted', color: 'purple', glyph: '◈' },
    { label: 'DROPS DEDUCTED', sub: 'At 5.71 drops/token', color: 'green', glyph: '◆' },
    { label: 'XRPL SETTLES', sub: '~3 seconds on-chain', color: 'yellow', glyph: '✦' },
  ]

  const maxDrops = Math.max(...MODELS.map(m => dropsPerToken(m.totalPerM)))

  return (
    <main className="min-h-screen bg-black bg-grid relative overflow-hidden">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed top-0 left-1/3 w-[600px] h-[600px] bg-blue-600/8 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed bottom-0 right-0 w-96 h-96 bg-purple-600/8 rounded-full blur-3xl" />

      {/* Nav */}
      <header className="border-b border-zinc-800/80 px-6 py-4 flex items-center gap-4 backdrop-blur-sm bg-black/60 sticky top-0 z-40">
        <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs">X</div>
          <span className="text-white font-black text-base tracking-tight">UseXRP</span>
        </a>
        <span className="text-zinc-700">/</span>
        <span className="text-zinc-400 text-sm font-mono">HOW IT REALLY WORKS</span>
        <a href="/services" className="ml-auto text-xs font-mono text-zinc-600 hover:text-white transition-colors">SERVICES →</a>
      </header>

      <div className="max-w-4xl mx-auto px-4">

        {/* ── HERO ── */}
        <section className="pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 border border-zinc-800 rounded-full px-4 py-1.5 text-xs font-mono text-zinc-500 mb-8">
            NOT A STORE. AN EXCHANGE RATE.
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-none mb-4">
            <span className="gradient-text">1 DROP</span>
          </h1>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-none mb-6 text-white">
            = 0.175 TOKENS
          </h1>

          <p className="text-zinc-400 max-w-xl mx-auto text-base leading-relaxed">
            Every AI model in the world charges in <span className="text-white font-semibold">dollars per million tokens</span>.
            We priced those dollars in <span className="text-blue-400 font-semibold">XRP drops</span>.
            Now drops <em>are</em> compute.
          </p>
        </section>

        {/* ── THE BIG IDEA ── */}
        <section className="pb-20">
          <div className="border border-zinc-800 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="border-b border-zinc-800 px-6 py-4 bg-zinc-950/60">
              <p className="text-xs font-mono text-zinc-500">THE INSIGHT</p>
            </div>

            <div className="p-8 space-y-8">
              {/* The three facts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'AI costs', value: '$8.00', sub: 'per million tokens (consensus)', color: 'text-white' },
                  { label: 'XRP is worth', value: '$1.40', sub: 'per XRP = 1,000,000 drops', color: 'text-blue-400' },
                  { label: 'Therefore', value: '5.71', sub: 'drops buys exactly 1 token', color: 'text-green-400' },
                ].map(({ label, value, sub, color }) => (
                  <div key={label} className="bg-black/40 border border-zinc-800 rounded-xl p-5 text-center">
                    <p className="text-xs font-mono text-zinc-600 mb-2">{label.toUpperCase()}</p>
                    <p className={`text-3xl font-black ${color} mb-1`}>{value}</p>
                    <p className="text-xs text-zinc-600">{sub}</p>
                  </div>
                ))}
              </div>

              {/* The equation */}
              <div className="bg-black/60 border border-blue-500/20 rounded-xl p-6 font-mono text-center space-y-3">
                <p className="text-xs text-zinc-600">THE FORMULA</p>
                <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
                  <span className="text-zinc-400">$8.00 per M tokens</span>
                  <span className="text-zinc-700">÷</span>
                  <span className="text-blue-400">$1.40 per XRP</span>
                  <span className="text-zinc-700">÷</span>
                  <span className="text-zinc-400">1,000,000 drops</span>
                  <span className="text-zinc-700">=</span>
                  <span className="text-green-400 font-black text-lg">0.0000057 XRP per token</span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 text-sm pt-2 border-t border-zinc-800">
                  <span className="text-zinc-600">or simply</span>
                  <span className="text-white font-black text-2xl">5.71 drops = 1 AI token</span>
                </div>
              </div>

              <p className="text-zinc-500 text-sm leading-relaxed text-center max-w-2xl mx-auto">
                This isn't metaphor. When an agent sends 5.71 drops, they get 1 token of inference.
                When XRP price moves, the rate adjusts. Drops become a <span className="text-white">real-time denominated unit of compute</span>.
              </p>
            </div>
          </div>
        </section>

        {/* ── ANIMATED FLOW ── */}
        <section className="pb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-800" />
            <span className="text-xs font-mono text-zinc-500 tracking-widest">THE FLOW</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-800" />
          </div>

          {/* Step pipeline */}
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute top-10 left-0 right-0 h-px bg-gradient-to-r from-blue-600/20 via-green-600/20 to-yellow-600/20 hidden sm:block" />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {STEPS.map((s, i) => {
                const active = animStep === i
                const colorMap: Record<string, string> = {
                  blue: 'border-blue-500/40 bg-blue-500/5 text-blue-400',
                  purple: 'border-purple-500/40 bg-purple-500/5 text-purple-400',
                  green: 'border-green-500/40 bg-green-500/5 text-green-400',
                  yellow: 'border-yellow-500/40 bg-yellow-500/5 text-yellow-400',
                }
                const dimmed = 'border-zinc-800 bg-zinc-950/40 text-zinc-700'

                return (
                  <div
                    key={i}
                    className={`relative border rounded-2xl p-5 text-center transition-all duration-500 ${active ? colorMap[s.color] : dimmed}`}
                    style={{ transform: active ? 'scale(1.04)' : 'scale(1)' }}
                  >
                    <div className={`text-3xl mb-3 transition-all duration-500 ${active ? '' : 'opacity-20'}`}>{s.glyph}</div>
                    <p className="text-xs font-mono font-bold mb-1">{s.label}</p>
                    <p className="text-xs opacity-60">{s.sub}</p>
                    {active && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white animate-pulse-glow" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Live stats below flow */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              { label: '1 DROP', value: '0.175', unit: 'tokens' },
              { label: '1 TOKEN', value: '5.71', unit: 'drops' },
              { label: '1,000 DROPS', value: '175', unit: 'tokens' },
              { label: '1 XRP', value: '175,000', unit: 'tokens' },
            ].map(({ label, value, unit }) => (
              <div key={label} className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4">
                <p className="text-xs font-mono text-zinc-600 mb-1">{label}</p>
                <p className="text-white font-black text-xl">{value}</p>
                <p className="text-xs text-zinc-600">{unit}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CALCULATOR ── */}
        <section className="pb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-800" />
            <span className="text-xs font-mono text-zinc-500 tracking-widest">LIVE CALCULATOR</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-800" />
          </div>

          <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950/60">
            <div className="border-b border-zinc-800 px-6 py-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-glow" />
              <span className="text-xs font-mono text-zinc-500">ENTER ANY VALUE — OTHERS UPDATE INSTANTLY</span>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Drops */}
              <div className={`border rounded-xl p-5 transition-colors ${activeInput === 'drops' ? 'border-blue-500/50 bg-blue-500/5' : 'border-zinc-800 bg-zinc-900/40'}`}>
                <label className="text-xs font-mono text-blue-400 block mb-2">XRP DROPS</label>
                <input
                  type="number"
                  value={drops}
                  onChange={e => { setDrops(e.target.value); setActiveInput('drops') }}
                  onFocus={() => setActiveInput('drops')}
                  className="w-full bg-transparent text-white text-2xl font-black focus:outline-none placeholder-zinc-700"
                  placeholder="0"
                />
                <p className="text-xs text-zinc-700 mt-2 font-mono">smallest unit of XRP</p>
              </div>

              {/* Tokens */}
              <div className={`border rounded-xl p-5 transition-colors ${activeInput === 'tokens' ? 'border-purple-500/50 bg-purple-500/5' : 'border-zinc-800 bg-zinc-900/40'}`}>
                <label className="text-xs font-mono text-purple-400 block mb-2">AI TOKENS</label>
                <input
                  type="number"
                  value={tokens}
                  onChange={e => { setTokens(e.target.value); setActiveInput('tokens') }}
                  onFocus={() => setActiveInput('tokens')}
                  className="w-full bg-transparent text-white text-2xl font-black focus:outline-none placeholder-zinc-700"
                  placeholder="0"
                />
                <p className="text-xs text-zinc-700 mt-2 font-mono">input + output combined</p>
              </div>

              {/* USD */}
              <div className={`border rounded-xl p-5 transition-colors ${activeInput === 'usd' ? 'border-green-500/50 bg-green-500/5' : 'border-zinc-800 bg-zinc-900/40'}`}>
                <label className="text-xs font-mono text-green-400 block mb-2">USD VALUE</label>
                <input
                  type="number"
                  value={usd}
                  onChange={e => { setUsd(e.target.value); setActiveInput('usd') }}
                  onFocus={() => setActiveInput('usd')}
                  className="w-full bg-transparent text-white text-2xl font-black focus:outline-none placeholder-zinc-700"
                  placeholder="0"
                  step="0.000001"
                />
                <p className="text-xs text-zinc-700 mt-2 font-mono">at $1.40 per XRP</p>
              </div>
            </div>

            {/* Quick presets */}
            <div className="border-t border-zinc-800 px-6 py-4 flex flex-wrap gap-2">
              <span className="text-xs font-mono text-zinc-600 mr-2 self-center">PRESETS:</span>
              {[
                { label: '1 drop', d: '1' },
                { label: '100 drops', d: '100' },
                { label: '1,000 drops', d: '1000' },
                { label: '1 XRP', d: '1000000' },
                { label: '1M tokens', t: '1000000' },
              ].map(({ label, d, t }) => (
                <button
                  key={label}
                  onClick={() => {
                    if (d) { setDrops(d); setActiveInput('drops') }
                    else if (t) { setTokens(t!); setActiveInput('tokens') }
                  }}
                  className="text-xs font-mono border border-zinc-700 text-zinc-400 px-3 py-1 rounded-full hover:border-blue-500 hover:text-blue-400 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Result interpretation */}
          {parseFloat(drops) > 0 && (
            <div className="mt-4 bg-zinc-950/60 border border-zinc-800 rounded-xl px-6 py-4">
              <p className="text-zinc-400 text-sm leading-relaxed">
                <span className="text-white font-bold">{parseFloat(drops).toLocaleString()} drops</span>
                {' '}buys{' '}
                <span className="text-purple-400 font-bold">{parseFloat(tokens).toLocaleString()} tokens</span>
                {' '}of AI compute worth{' '}
                <span className="text-green-400 font-bold">${parseFloat(usd).toFixed(6)} USD</span>
                {' '}at the current consensus rate of $8/M tokens and XRP at $1.40.
              </p>
            </div>
          )}
        </section>

        {/* ── MODEL COMPARISON ── */}
        <section className="pb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-800" />
            <span className="text-xs font-mono text-zinc-500 tracking-widest">DROPS PER TOKEN BY MODEL</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-800" />
          </div>

          <div className="border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="border-b border-zinc-800 px-6 py-3">
              <p className="text-xs font-mono text-zinc-500">13 MODELS ANALYZED · CONSENSUS AT $8/M BLENDED · XRP @ $1.40</p>
            </div>
            <div className="divide-y divide-zinc-800/60">
              {MODELS.sort((a, b) => a.totalPerM - b.totalPerM).map((m) => {
                const dpt = dropsPerToken(m.totalPerM)
                const pct = (dpt / maxDrops) * 100
                return (
                  <div key={m.name} className="px-6 py-4 flex items-center gap-4 hover:bg-zinc-900/30 transition-colors">
                    <div className="w-36 shrink-0">
                      <p className="text-sm font-semibold text-white">{m.name}</p>
                      <p className="text-xs text-zinc-600">{m.provider}</p>
                    </div>
                    <div className="flex-1 relative h-2 bg-zinc-900 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${m.bar} rounded-full transition-all duration-1000`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-right shrink-0 w-32">
                      <p className={`font-mono font-bold text-sm ${m.color}`}>{dpt.toFixed(2)} drops</p>
                      <p className="text-xs text-zinc-700">${m.totalPerM}/M total</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="border-t border-zinc-800 px-6 py-4 bg-zinc-950/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-white" />
                  <span className="text-xs font-mono text-zinc-400">CONSENSUS (blended average)</span>
                </div>
                <span className="text-white font-black font-mono">5.71 drops/token</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── THE FLYWHEEL ── */}
        <section className="pb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-800" />
            <span className="text-xs font-mono text-zinc-500 tracking-widest">THE FLYWHEEL</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-800" />
          </div>

          <div className="border border-zinc-800 rounded-2xl p-8 bg-zinc-950/60 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border border-blue-500/5 rounded-full animate-spin" style={{ animationDuration: '20s' }} />
              <div className="w-48 h-48 border border-purple-500/5 rounded-full animate-spin absolute" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
            </div>

            <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { n: '01', text: 'Agents need AI compute to function', accent: 'text-blue-400' },
                { n: '02', text: 'Compute is priced in XRP drops', accent: 'text-purple-400' },
                { n: '03', text: 'Agents buy and burn drops at scale', accent: 'text-green-400' },
                { n: '04', text: 'XRPL volume increases, XRP demand rises', accent: 'text-yellow-400' },
                { n: '05', text: 'Higher XRP price = fewer drops per token', accent: 'text-orange-400' },
                { n: '06', text: 'Cheaper compute attracts more agents', accent: 'text-blue-400' },
              ].map(({ n, text, accent }) => (
                <div key={n} className="flex items-start gap-3 bg-black/30 border border-zinc-800/60 rounded-xl p-4">
                  <span className={`text-2xl font-black ${accent} shrink-0 leading-none`}>{n}</span>
                  <p className="text-zinc-300 text-sm leading-relaxed">{text}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-zinc-800 pt-6 text-center">
              <p className="text-zinc-600 text-xs font-mono">REPEAT → </p>
              <p className="text-white font-black text-xl mt-1">XRP becomes the gas for AI.</p>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="pb-20 text-center">
          <p className="text-zinc-600 text-xs font-mono mb-4">READY?</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="/services" className="bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-4 rounded-2xl transition-colors text-sm tracking-wide glow-blue">
              USE THE SERVICES
            </a>
            <a href="/" className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-mono px-8 py-4 rounded-2xl transition-colors text-sm">
              VIEW MARKETPLACE
            </a>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-900 px-6 py-6 text-center">
        <p className="text-xs font-mono text-zinc-700">
          USEXRP · $8/M CONSENSUS · XRP @ $1.40 · 5.71 DROPS/TOKEN
        </p>
      </footer>
    </main>
  )
}
