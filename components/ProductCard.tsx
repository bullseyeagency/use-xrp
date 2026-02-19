import { Product } from '@/lib/products'

interface Props {
  product: Product
  index: number
  onBuy: () => void
}

const categoryStyles: Record<string, { badge: string; glow: string; accent: string }> = {
  Social:     { badge: 'text-purple-400 bg-purple-500/10 border-purple-500/30', glow: 'group-hover:shadow-purple-500/20', accent: 'bg-purple-500' },
  Finance:    { badge: 'text-blue-400 bg-blue-500/10 border-blue-500/30',       glow: 'group-hover:shadow-blue-500/20',   accent: 'bg-blue-500' },
  Operations: { badge: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', glow: 'group-hover:shadow-yellow-500/20', accent: 'bg-yellow-500' },
  Research:   { badge: 'text-green-400 bg-green-500/10 border-green-500/30',    glow: 'group-hover:shadow-green-500/20',  accent: 'bg-green-500' },
  Strategy:   { badge: 'text-orange-400 bg-orange-500/10 border-orange-500/30', glow: 'group-hover:shadow-orange-500/20', accent: 'bg-orange-500' },
}

export default function ProductCard({ product, index, onBuy }: Props) {
  const style = categoryStyles[product.category] ?? categoryStyles.Finance

  return (
    <div
      className={`group relative border border-zinc-800 rounded-2xl p-5 bg-zinc-950/80 card-hover flex flex-col gap-4 cursor-pointer overflow-hidden`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-px ${style.accent} opacity-40 group-hover:opacity-100 transition-opacity`} />

      {/* Corner number */}
      <div className="absolute top-4 right-4 text-zinc-800 font-black text-4xl leading-none select-none">
        {String(index + 1).padStart(2, '0')}
      </div>

      {/* Category + price */}
      <div className="flex items-start justify-between gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${style.badge}`}>
          {product.category.toUpperCase()}
        </span>
      </div>

      {/* Name + description */}
      <div className="flex-1">
        <h3 className="text-white font-bold text-base mb-2 leading-snug">{product.name}</h3>
        <p className="text-zinc-500 text-xs leading-relaxed">{product.description}</p>
      </div>

      {/* Price block */}
      <div className="border-t border-zinc-800/80 pt-4 flex items-end justify-between">
        <div>
          <div className="text-xs text-zinc-600 font-mono mb-0.5">PRICE</div>
          <div className="text-white font-black text-xl leading-none">
            {product.drops.toLocaleString()}
            <span className="text-zinc-500 text-sm font-normal ml-1">drops</span>
          </div>
          <div className="text-zinc-700 text-xs font-mono mt-0.5">{product.xrp} XRP</div>
        </div>
        <button
          onClick={onBuy}
          className="bg-white text-black text-xs font-black px-4 py-2 rounded-xl hover:bg-blue-400 hover:text-white transition-all duration-200 tracking-wide"
        >
          BUY
        </button>
      </div>
    </div>
  )
}
