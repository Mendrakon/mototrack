'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/dashboard', icon: '🏍️', label: 'Bikes' },
  { href: '/bikes/new', icon: '➕', label: 'Hinzufügen' },
  { href: '/account', icon: '👤', label: 'Konto' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-[#2a2a2a] flex z-50">
      {tabs.map((tab) => {
        const isActive =
          pathname === tab.href ||
          (tab.href !== '/dashboard' && tab.href !== '/account' && pathname.startsWith(tab.href))
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors ${
              isActive ? 'text-[#ff6600]' : 'text-[#888888] hover:text-[#aaaaaa]'
            }`}
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
