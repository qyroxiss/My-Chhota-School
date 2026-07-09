'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  let isActive: boolean
  if (href === '/dashboard' || href === '/templates/new') {
    // exact match only (these must not swallow deeper routes)
    isActive = pathname === href
  } else if (href === '/templates') {
    // active on /templates and /templates/* — but NOT the AI generator route
    isActive = pathname === '/templates' || (pathname.startsWith('/templates/') && pathname !== '/templates/new')
  } else {
    isActive = pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <Link
      href={href}
      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        isActive
          ? 'bg-white/10 text-white shadow-sm'
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-gradient-to-b from-indigo-400 to-violet-500" />
      )}
      {children}
    </Link>
  )
}
