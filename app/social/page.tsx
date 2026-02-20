export default function XSocialPage() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed top-0 left-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed bottom-0 right-1/4 w-80 h-80 bg-purple-600/8 rounded-full blur-3xl" />

      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 border-b border-zinc-800/80 px-6 py-4 flex items-center gap-3 backdrop-blur-sm bg-black/60 z-40">
        <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-pink-600 flex items-center justify-center text-white font-black text-xs">X</div>
          <span className="text-white font-black text-base tracking-tight">UseXRP</span>
        </a>
        <span className="text-zinc-700">/</span>
        <span className="text-pink-400 text-sm font-mono font-bold tracking-wider">xSocial</span>
      </header>

      {/* Content */}
      <div className="text-center max-w-lg relative">
        <div className="inline-flex items-center gap-2 border border-pink-800/50 bg-pink-950/20 rounded-full px-5 py-2 text-xs font-mono text-pink-400 mb-10">
          <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
          COMING SOON · v0.5
        </div>

        <div className="mb-6">
          <span className="text-7xl sm:text-9xl font-black tracking-tight text-white">x</span>
          <span className="text-7xl sm:text-9xl font-black tracking-tight" style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Social</span>
        </div>

        <p className="text-xl font-black text-zinc-200 mb-4 tracking-tight">
          On-chain social. Every action costs drops.
        </p>
        <p className="text-zinc-500 text-sm leading-relaxed mb-10">
          Wallet address = identity. No username. No password. No deplatforming.
          Likes send drops directly to authors. Amplification costs real money.
          The feed is public. The identity is yours.
        </p>

        {/* Action pricing preview */}
        <div className="border border-zinc-800 rounded-2xl overflow-hidden mb-10 text-left">
          <div className="border-b border-zinc-800 px-4 py-3 bg-zinc-950/60">
            <p className="text-xs font-mono text-zinc-500 tracking-widest">DROP COST PER ACTION</p>
          </div>
          {[
            { action: 'Post (≤280 chars)', drops: '2', note: 'Proof of Task stamp' },
            { action: 'Post (long-form)', drops: '5', note: 'SHA-256 anchor' },
            { action: 'Like / Upvote', drops: '1', note: 'Goes to author' },
            { action: 'Reply', drops: '2', note: 'Thread attached on-chain' },
            { action: 'Follow', drops: '3', note: 'One-time per pair' },
            { action: 'Boost / Repost', drops: '5', note: 'Amplification = real cost' },
            { action: 'Tip', drops: 'N', note: 'Direct to author wallet' },
          ].map(({ action, drops, note }, i) => (
            <div key={action} className={`px-4 py-3 flex items-center justify-between gap-4 ${i > 0 ? 'border-t border-zinc-800/60' : ''}`}>
              <div>
                <p className="text-zinc-300 text-xs font-semibold">{action}</p>
                <p className="text-zinc-600 text-xs font-mono">{note}</p>
              </div>
              <span className="text-pink-400 font-black text-sm font-mono shrink-0">{drops} drops</span>
            </div>
          ))}
        </div>

        <a href="/" className="text-xs font-mono text-zinc-500 hover:text-white transition-colors border border-zinc-800 hover:border-zinc-600 rounded-full px-4 py-2">
          ← BACK TO USEXRP
        </a>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-zinc-900 px-6 py-4 text-center">
        <p className="text-xs font-mono text-zinc-700">xSocial · UseXRP · Wallet = Identity · Drops = Engagement</p>
      </footer>
    </main>
  )
}
