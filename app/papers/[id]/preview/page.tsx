import { getPaper } from '@/lib/dal'
import { notFound } from 'next/navigation'
import PrintButton from '@/components/PrintButton'
import type { ParsedPaper } from '@/lib/definitions'
import Link from 'next/link'

export default async function PaperPreviewPage(props: PageProps<'/papers/[id]/preview'>) {
  const { id } = await props.params
  const paper = await getPaper(id)
  if (!paper) notFound()

  let content: ParsedPaper
  try {
    content = JSON.parse(paper.content)
  } catch {
    notFound()
  }

  return (
    <>
      {/* Top bar — hidden on print */}
      <div className="no-print flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 sticky top-0 z-10">
        <Link href="/papers" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Papers
        </Link>
        <PrintButton />
      </div>

      {/* Paper body */}
      <div className="paper-body max-w-3xl mx-auto my-8 bg-white p-12 shadow-sm rounded-2xl">

        {/* School header */}
        <div className="text-center mb-7 pb-5 border-b-2 border-slate-800">
          {paper.school.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={paper.school.logo} alt="School logo" className="h-14 mx-auto mb-2 object-contain" />
          )}
          <h2 className="text-xl font-bold text-slate-900 uppercase tracking-wide">{paper.school.name}</h2>
          {paper.school.address && (
            <p className="text-sm text-slate-500 mt-0.5">{paper.school.address}</p>
          )}
        </div>

        {/* Paper meta */}
        <div className="flex justify-between items-start mb-8 text-sm">
          <div className="space-y-1">
            <p><span className="font-semibold text-slate-700">Class:</span> <span className="text-slate-900">{content.class}</span></p>
            <p><span className="font-semibold text-slate-700">Subject:</span> <span className="text-slate-900">{content.subject}</span></p>
          </div>
          <div className="text-right space-y-1">
            {paper.date && <p><span className="font-semibold text-slate-700">Date:</span> <span className="text-slate-900">{paper.date}</span></p>}
            <p><span className="font-semibold text-slate-700">M.M.:</span> <span className="text-slate-900">{content.maxMarks}</span></p>
            {content.duration && <p><span className="font-semibold text-slate-700">Time:</span> <span className="text-slate-900">{content.duration}</span></p>}
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-7">
          {content.questions.map((q, idx) => (
            <div key={idx}>
              <div className="flex justify-between items-baseline mb-2.5">
                <p className="font-bold text-slate-900">Q{idx + 1}) {q.title}</p>
                {q.marks > 0 && (
                  <span className="text-sm font-semibold text-slate-600 ml-4 shrink-0">({q.marks})</span>
                )}
              </div>

              {q.type === 'plain' && q.subParts.length > 0 && (
                <div className="space-y-2 ml-5">
                  {q.subParts.map(sp => (
                    <p key={sp.label} className="text-sm text-slate-800">
                      <span className="font-semibold">{sp.label})</span>{' '}
                      {sp.content || <span className="text-slate-400 italic">—</span>}
                    </p>
                  ))}
                </div>
              )}

              {q.type === 'table' && (
                <div className="ml-5 overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-slate-700">
                    <thead>
                      <tr>
                        <th className="border border-slate-700 px-2 py-1.5 bg-slate-100 w-8"></th>
                        {q.tableHeaders.map(h => (
                          <th key={h} className="border border-slate-700 px-3 py-1.5 bg-slate-100 text-left font-semibold text-slate-800">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {q.tableRows.map((row, i) => (
                        <tr key={i}>
                          <td className="border border-slate-700 px-2 py-2 font-semibold text-slate-800 text-center w-8">{row.label})</td>
                          {row.columns.map((col, j) => (
                            <td key={j} className="border border-slate-700 px-3 py-2 text-slate-800">{col || ' '}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
