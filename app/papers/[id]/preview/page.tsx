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
      <div className="no-print print:hidden flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200 sticky top-0 z-10">
        <Link href="/papers" className="text-sm text-gray-500 hover:text-gray-900">← Back to Papers</Link>
        <PrintButton />
      </div>

      <div className="paper-body max-w-3xl mx-auto my-8 bg-white p-10 shadow-sm rounded-xl">

        <div className="text-center mb-6 border-b-2 border-gray-800 pb-4">
          {paper.school.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={paper.school.logo} alt="School logo" className="h-14 mx-auto mb-2 object-contain" />
          )}
          <h2 className="text-xl font-bold text-gray-900 uppercase">{paper.school.name}</h2>
          {paper.school.address && (
            <p className="text-sm text-gray-600 mt-0.5">{paper.school.address}</p>
          )}
        </div>

        <div className="flex justify-between items-start mb-6 text-sm">
          <div className="space-y-0.5">
            <p><span className="font-semibold">Class:</span> {content.class}</p>
            <p><span className="font-semibold">Subject:</span> {content.subject}</p>
          </div>
          <div className="text-right space-y-0.5">
            {paper.date && <p><span className="font-semibold">Date:</span> {paper.date}</p>}
            <p><span className="font-semibold">M.M.:</span> {content.maxMarks}</p>
            {content.duration && <p><span className="font-semibold">Time:</span> {content.duration}</p>}
          </div>
        </div>

        <div className="space-y-6">
          {content.questions.map(q => (
            <div key={q.number}>
              <div className="flex justify-between items-baseline mb-2">
                <p className="font-bold text-gray-900">Q{q.number}) {q.title}</p>
                <span className="text-sm font-medium text-gray-700 ml-4 shrink-0">({q.marks})</span>
              </div>

              {q.type === 'plain' && (
                <div className="space-y-1.5 ml-4">
                  {q.subParts.map(sp => (
                    <p key={sp.label} className="text-sm text-gray-800">
                      <span className="font-medium">{sp.label})</span>{' '}
                      {sp.content || <span className="text-gray-400 italic">—</span>}
                    </p>
                  ))}
                </div>
              )}

              {q.type === 'table' && (
                <div className="ml-4 overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-gray-700">
                    <thead>
                      <tr>
                        <th className="border border-gray-700 px-2 py-1.5 bg-gray-100 w-8"></th>
                        {q.tableHeaders.map(h => (
                          <th key={h} className="border border-gray-700 px-3 py-1.5 bg-gray-100 text-left font-semibold text-gray-800">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {q.tableRows.map((row, i) => (
                        <tr key={i}>
                          <td className="border border-gray-700 px-2 py-2 font-medium text-gray-800 text-center w-8">
                            {row.label})
                          </td>
                          {row.columns.map((col, j) => (
                            <td key={j} className="border border-gray-700 px-3 py-2 text-gray-800">
                              {col || ' '}
                            </td>
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
