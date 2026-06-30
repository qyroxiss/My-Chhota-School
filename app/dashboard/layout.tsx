import Link from 'next/link'
import { getUser } from '@/lib/dal'
import { logout } from '@/app/actions/auth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="text-sm font-semibold text-gray-900 truncate">{user?.school?.name}</div>
          <div className="text-xs text-gray-500 mt-0.5 truncate">{user?.name}</div>
          <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">
            {user?.role?.toLowerCase()}
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <NavItem href="/dashboard" label="Dashboard" icon="🏠" />
          <NavItem href="/templates" label="Templates" icon="📋" />
          <NavItem href="/papers" label="Papers" icon="📄" />
          {user?.role === 'ADMIN' && (
            <NavItem href="/settings" label="Settings" icon="⚙️" />
          )}
        </nav>

        <form action={logout} className="p-3 border-t border-gray-200">
          <button
            type="submit"
            className="w-full text-left text-sm text-gray-500 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Sign out
          </button>
        </form>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}

function NavItem({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  )
}
