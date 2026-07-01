import Link from 'next/link'
import { getPapers, getTemplates } from '@/lib/dal'
import DeletePaperButton from '@/components/DeletePaperButton'

export default async function PapersPage() {
  const [papers, templates] = await Promise.all([getPapers(), getTemplates()])

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Papers</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {papers.length === 0 ? 'No papers yet' : `${papers.length} paper${papers.length !== 1 ? 's' : ''} generated`}
          </p>
        </div>
        {templates.length > 0 && (
          <Link
            href="/papers/new"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Paper
          </Link>
        )}
      </div>

      {papers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-20 text-center shadow-sm">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">No papers yet</h3>
          <p className="text-slate-500 text-sm mb-5">
            {templates.length === 0
              ? 'Create a template first, then generate papers from it.'
              : 'Choose a template and fill in the content to generate your first paper.'}
          </p>
          <Link
            href={templates.length === 0 ? '/templates/new' : '/papers/new'}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            {templates.length === 0 ? 'Create Template' : 'New Paper'}
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Paper</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">By</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Date</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              {papers.map((paper, i) => (
                <tr key={paper.id} className={`hover:bg-slate-50 transition-colors ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-900">{paper.template?.subject}</div>
                    <div className="flex gap-1.5 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium">
                        Class {paper.template?.class}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                        {paper.template?.maxMarks} marks
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600 hidden md:table-cell">{paper.createdBy?.name}</td>
                  <td className="px-5 py-4 text-slate-500 hidden md:table-cell">{paper.date || '—'}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/papers/${paper.id}/preview`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        View
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </Link>
                      <DeletePaperButton id={paper.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
