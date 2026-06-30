'use client'
import { useActionState, useState } from 'react'
import { createPaper } from '@/app/actions/papers'
import type { ParsedPaper, Question } from '@/lib/definitions'

type Template = {
  id: string
  name: string
  structure: string
}

function safeParse(str: string): ParsedPaper {
  try { return JSON.parse(str) } catch { return { class: '', subject: '', maxMarks: 0, duration: '', questions: [] } }
}

export default function PaperEditor({ template }: { template: Template }) {
  const [state, action, pending] = useActionState(createPaper, undefined)
  const structure: ParsedPaper = safeParse(template.structure)
  const [questions, setQuestions] = useState<Question[]>(structure.questions)
  const [date, setDate] = useState('')

  function updateSubPart(qIdx: number, spIdx: number, value: string) {
    setQuestions(prev => prev.map((q, i) =>
      i !== qIdx ? q : {
        ...q,
        subParts: q.subParts.map((sp, j) => j === spIdx ? { ...sp, content: value } : sp),
      }
    ))
  }

  function updateTableCell(qIdx: number, rowIdx: number, colIdx: number, value: string) {
    setQuestions(prev => prev.map((q, i) =>
      i !== qIdx ? q : {
        ...q,
        tableRows: q.tableRows.map((row, j) => j !== rowIdx ? row : {
          ...row,
          columns: row.columns.map((c, k) => k === colIdx ? value : c),
        }),
      }
    ))
  }

  const contentJson = JSON.stringify({ ...structure, questions })

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="templateId" value={template.id} />
      <input type="hidden" name="content" value={contentJson} />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date (optional)</label>
        <input
          type="text"
          name="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          placeholder="e.g. 30 June 2026"
          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((q, qIdx) => (
          <div key={q.number} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-sm font-bold text-gray-900">Q{q.number}) </span>
                <span className="text-sm font-medium text-gray-900">{q.title}</span>
              </div>
              <span className="text-sm text-gray-500 ml-2">({q.marks} marks)</span>
            </div>

            {q.type === 'plain' && (
              <div className="space-y-3">
                {q.subParts.map((sp, spIdx) => (
                  <div key={sp.label} className="flex items-start gap-2">
                    <span className="text-sm text-gray-600 font-medium mt-2 w-5 shrink-0">{sp.label})</span>
                    <input
                      type="text"
                      value={sp.content}
                      onChange={e => updateSubPart(qIdx, spIdx, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Enter answer for ${sp.label})`}
                    />
                  </div>
                ))}
              </div>
            )}

            {q.type === 'table' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 px-2 py-2 bg-gray-50 w-8"></th>
                      {q.tableHeaders.map(h => (
                        <th key={h} className="border border-gray-300 px-3 py-2 bg-gray-50 text-left font-medium text-gray-700">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {q.tableRows.map((row, rowIdx) => (
                      <tr key={row.label}>
                        <td className="border border-gray-300 px-2 py-2 text-gray-600 font-medium text-center">
                          {row.label})
                        </td>
                        {row.columns.map((col, colIdx) => (
                          <td key={colIdx} className="border border-gray-300 px-1 py-1">
                            <input
                              type="text"
                              value={col}
                              onChange={e => updateTableCell(qIdx, rowIdx, colIdx, e.target.value)}
                              className="w-full px-2 py-1 text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                              placeholder="Fill in..."
                            />
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

      {state?.error && (
        <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {pending ? 'Saving...' : 'Save & Preview'}
        </button>
        <a href="/papers" className="px-6 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
          Cancel
        </a>
      </div>
    </form>
  )
}
