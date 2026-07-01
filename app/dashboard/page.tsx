import Link from 'next/link'
import { getUser, getTemplates, getPapers } from '@/lib/dal'

export default async function DashboardPage() {
  const [user, templates, papers] = await Promise.all([getUser(), getTemplates(), getPapers()])

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Here's what's happening at {user?.school?.name}.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8 max-w-sm">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Templates</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{templates.length}</div>
          <Link href="/templates" className="text-xs text-indigo-600 hover:underline mt-1 inline-block">View all →</Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Papers</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{papers.length}</div>
          <Link href="/papers" className="text-xs text-emerald-600 hover:underline mt-1 inline-block">View all →</Link>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mb-10">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
          <Link
            href="/templates/new"
            className="group bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl p-5 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="font-semibold text-sm">New Template</div>
            <div className="text-indigo-200 text-xs mt-0.5">Paste or upload a paper format</div>
          </Link>

          {templates.length > 0 ? (
            <Link
              href="/papers/new"
              className="group bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-5 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="font-semibold text-sm text-slate-900">New Paper</div>
              <div className="text-slate-500 text-xs mt-0.5">Fill a template with content</div>
            </Link>
          ) : (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-5 opacity-60">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="font-semibold text-sm text-slate-400">New Paper</div>
              <div className="text-slate-400 text-xs mt-0.5">Create a template first</div>
            </div>
          )}
        </div>
      </div>

      {/* Recent papers */}
      {papers.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Recent Papers</h2>
            <Link href="/papers" className="text-xs text-indigo-600 hover:underline">View all</Link>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Paper</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Created by</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Date</th>
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
                      <Link href={`/papers/${paper.id}/preview`} className="text-indigo-600 hover:text-indigo-800 font-medium text-xs">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {papers.length === 0 && templates.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">Get started</h3>
          <p className="text-slate-500 text-sm mb-4">Create your first template by pasting or uploading a question paper.</p>
          <Link href="/templates/new" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            Create your first template
          </Link>
        </div>
      )}
    </div>
  )
}
