import { getUser } from '@/lib/dal'
import { logout } from '@/app/actions/auth'
import NavLink from '@/components/NavLink'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  const schoolInitial = user?.school?.name?.[0]?.toUpperCase() ?? 'S'
  const userInitial = user?.name?.[0]?.toUpperCase() ?? 'U'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="no-print w-64 flex flex-col shrink-0 fixed inset-y-0 left-0 z-20 bg-gradient-to-b from-slate-950 to-slate-900 border-r border-white/5">
        {/* School brand */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-indigo-600/30">
            {schoolInitial}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate leading-tight">{user?.school?.name}</div>
            <div className="text-[11px] text-slate-400 truncate">Paper Generator</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-2 mt-2">Menu</p>

          <NavLink href="/dashboard">
            <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </NavLink>

          <NavLink href="/templates">
            <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Templates
          </NavLink>

          <NavLink href="/papers">
            <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Papers
          </NavLink>

          {/* Highlighted AI action */}
          <NavLink href="/templates/new">
            <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Generate with AI
          </NavLink>

          {user?.role === 'ADMIN' && (
            <NavLink href="/settings">
              <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </NavLink>
          )}
        </nav>

        {/* User + sign out */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-white truncate leading-tight">{user?.name}</div>
              <div className="text-[11px] text-slate-400 capitalize">{user?.role?.toLowerCase()}</div>
            </div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main — offset by sidebar width */}
      <main className="ml-64 min-w-0 min-h-screen">{children}</main>
    </div>
  )
}
