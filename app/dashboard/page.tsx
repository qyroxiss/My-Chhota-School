import Link from 'next/link'
import { getUser, getTemplates, getPapers } from '@/lib/dal'

export default async function DashboardPage() {
  const [user, templates, papers] = await Promise.all([getUser(), getTemplates(), getPapers()])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}</h1>
        <p className="text-gray-500 mt-1">Manage your question papers and templates.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8 max-w-md">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-3xl font-bold text-blue-600">{templates.length}</div>
          <div className="text-sm text-gray-500 mt-1">Templates saved</div>
          <div className="text-xs text-gray-400">(max 5)</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-3xl font-bold text-green-600">{papers.length}</div>
          <div className="text-sm text-gray-500 mt-1">Papers generated</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4 max-w-lg">
        <Link
          href="/templates/new"
          className="bg-blue-600 text-white rounded-xl p-5 hover:bg-blue-700 transition-colors"
        >
          <div className="text-2xl mb-2">📋</div>
          <div className="font-semibold">New Template</div>
          <div className="text-blue-200 text-sm mt-1">Paste & parse a paper format</div>
        </Link>

        {templates.length > 0 && (
          <Link
            href="/papers/new"
            className="bg-white border border-gray-200 rounded-xl p-5 hover:bg-gray-50 transition-colors"
          >
            <div className="text-2xl mb-2">📄</div>
            <div className="font-semibold text-gray-900">New Paper</div>
            <div className="text-gray-500 text-sm mt-1">Fill a template with content</div>
          </Link>
        )}
      </div>

      {/* Recent papers */}
      {papers.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Papers</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden max-w-2xl">
            {papers.slice(0, 5).map((paper, i) => (
              <div key={paper.id} className={`flex items-center justify-between px-5 py-3 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                <div>
                  <div className="text-sm font-medium text-gray-900">{paper.template?.subject} — {paper.template?.class}</div>
                  <div className="text-xs text-gray-500 mt-0.5">By {paper.createdBy?.name} · {paper.date || 'No date'}</div>
                </div>
                <Link href={`/papers/${paper.id}/preview`} className="text-sm text-blue-600 hover:underline">
                  View
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
