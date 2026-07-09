import Link from 'next/link'
import { getUser, getTemplates, getPapers } from '@/lib/dal'

export default async function DashboardPage() {
  const [user, templates, papers] = await Promise.all([getUser(), getTemplates(), getPapers()])
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto">
      {/* Hero greeting */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 p-7 sm:p-8 mb-8 shadow-lg shadow-indigo-600/20">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -right-4 bottom-0 w-32 h-32 rounded-full bg-violet-400/20 blur-2xl" />
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Welcome back, {firstName} 👋</h1>
          <p className="text-indigo-100 mt-1.5 text-sm max-w-lg">
            Here&apos;s what&apos;s happening at {user?.school?.name}. Generate a paper with AI or start from a template.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Link href="/templates/new" className="inline-flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Generate with AI
            </Link>
            {templates.length > 0 && (
              <Link href="/papers/new" className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all backdrop-blur">
                New Paper
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Templates" value={templates.length} href="/templates" tint="indigo"
          icon="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        <StatCard label="Papers" value={papers.length} href="/papers" tint="emerald"
          icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        <StatCard label="Team" href={user?.role === 'ADMIN' ? '/settings' : undefined} tint="violet"
          icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </div>

      {/* Recent papers */}
      {papers.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">Recent Papers</h2>
            <Link href="/papers" className="text-xs font-medium text-indigo-600 hover:text-indigo-800">View all →</Link>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/70">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Paper</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Created by</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {papers.slice(0, 6).map((paper, i) => (
                  <tr key={paper.id} className={`hover:bg-slate-50 transition-colors ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-900">{paper.template?.subject}</div>
                      <div className="text-xs text-slate-400 mt-0.5">Class {paper.template?.class} · {paper.template?.maxMarks} marks</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 hidden sm:table-cell">{paper.createdBy?.name}</td>
                    <td className="px-5 py-3.5 text-slate-500 hidden sm:table-cell">{paper.date || '—'}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Link href={`/papers/${paper.id}/preview`} className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs">View →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">Create your first paper</h3>
          <p className="text-slate-500 text-sm mb-5 max-w-sm mx-auto">Let AI generate questions from a chapter, or paste an existing paper to save as a template.</p>
          <Link href="/templates/new" className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:brightness-110 transition-all shadow-sm shadow-indigo-600/20">
            Get started
          </Link>
        </div>
      )}
    </div>
  )
}

const TINTS: Record<string, string> = {
  indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-500/25',
  emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-500/25',
  violet: 'from-violet-500 to-violet-600 shadow-violet-500/25',
}

function StatCard({ label, value, href, icon, tint }: { label: string; value?: number; href?: string; icon: string; tint: string }) {
  const inner = (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all h-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${TINTS[tint]} flex items-center justify-center shadow-lg`}>
          <svg className="w-[18px] h-[18px] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
      </div>
      {value !== undefined ? (
        <div className="text-3xl font-bold text-slate-900">{value}</div>
      ) : (
        <div className="text-sm text-slate-400 pt-2">{href ? 'Manage members →' : 'Members'}</div>
      )}
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}
