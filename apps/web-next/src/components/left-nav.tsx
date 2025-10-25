import Link from 'next/link'

const items = [
  ['Dashboard', '/dashboard'],
  ['Market Data', '/market-data'],
  ['Strategy Lab', '/strategy-lab'],
  ['Backtest', '/backtest'],
  ['Portfolio', '/portfolio'],
  ['Alerts', '/alerts']
] as const

export default function LeftNav() {
  return (
    <aside className="w-56 border-r h-full p-3 space-y-1">
      {items.map(([title, href]) => (
        <Link 
          key={href} 
          href={href} 
          className="block px-3 py-2 rounded-lg hover:bg-zinc-900 text-sm transition-colors"
        >
          {title}
        </Link>
      ))}
    </aside>
  )
}

