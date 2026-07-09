import Link from 'next/link'
import { getPapers, getTemplates } from '@/lib/dal'
import DeletePaperButton from '@/components/DeletePaperButton'
import PageHeader from '@/components/PageHeader'

export default async function PapersPage() {
  const [papers, templates] = await Promise.all([getPapers(), getTemplates()])

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Papers"
        subtitle={papers.length === 0 ? 'No papers yet' : `${papers.length} paper${papers.length !== 1 ? 's' : ''} generated`}
        action={
          templates.length > 0 ? (
            <Link href="/papers/new" className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-indigo-600/20 shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Paper
            </Link>
          ) : undefined
        }
      />

      {papers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-20 text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">No papers yet</h3>
          <p className="text-slate-500 text-sm mb-5 max-w-sm mx-auto">
            {templates.length === 0
              ? 'Create a template first, then generate papers from it.'
              : 'Choose a template and fill in the content to generate your first paper.'}
          </p>
          <Link href={templates.length === 0 ? '/templates/new' : '/papers/new'}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:brightness-110 transition-all shadow-sm shadow-indigo-600/20">
            {templates.length === 0 ? 'Create Template' : 'New Paper'}
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/70">
                <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Paper</th>
                <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">By</th>
                <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              {papers.map((paper, i) => (
                <tr key={paper.id} className={`hover:bg-slate-50 transition-colors ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                        {paper.template?.subject?.[0]?.toUpperCase() ?? 'P'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 truncate">{paper.template?.subject}</div>
                        <div className="flex gap-1.5 mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium">Class {paper.template?.class}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">{paper.template?.maxMarks} marks</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600 hidden md:table-cell">{paper.createdBy?.name}</td>
                  <td className="px-5 py-4 text-slate-500 hidden md:table-cell">{paper.date || '—'}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/papers/${paper.id}/preview`} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
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
