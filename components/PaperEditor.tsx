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

      {/* Date */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date <span className="text-slate-400 font-normal">(optional)</span></label>
        <input
          type="text"
          name="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          placeholder="e.g. 30 June 2026"
          className="w-full max-w-xs px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, qIdx) => (
          <div key={qIdx}>
            {/* Section break (new subject) */}
            {q.sectionLabel && (
              <div className="flex items-center justify-between border-t-2 border-b border-slate-300 bg-slate-100 px-4 py-2 rounded-lg mt-6 mb-2">
                <p className="font-bold text-slate-800 uppercase text-xs tracking-widest">Subject: {q.sectionLabel.subject}</p>
                <div className="text-xs text-slate-600 space-x-3">
                  {q.sectionLabel.maxMarks > 0 && <span>M.M.: {q.sectionLabel.maxMarks}</span>}
                  {q.sectionLabel.duration && <span>Time: {q.sectionLabel.duration}</span>}
                </div>
              </div>
            )}
            {/* Subsection header */}
            {q.subsectionLabel && (
              <p className="text-xs font-semibold text-slate-500 italic px-1 mt-3 mb-1">{q.subsectionLabel}</p>
            )}

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Question header */}
            <div className="flex items-start justify-between px-5 py-4 bg-slate-50 border-b border-slate-100">
              <div className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold shrink-0 mt-0.5">
                  {qIdx + 1}
                </span>
                <p className="text-sm font-semibold text-slate-900 leading-snug">{q.title}</p>
              </div>
              {q.marks > 0 && (
                <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full ml-3 shrink-0">
                  {q.marks} marks
                </span>
              )}
            </div>

            {/* Sub-parts / table */}
            {q.type === 'plain' && q.subParts.length > 0 && (
              <div className="p-4 space-y-2.5">
                {q.subParts.map((sp, spIdx) => (
                  <div key={sp.label} className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-500 w-6 text-right shrink-0">{sp.label})</span>
                    <input
                      type="text"
                      value={sp.content}
                      onChange={e => updateSubPart(qIdx, spIdx, e.target.value)}
                      className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder={`Answer for ${sp.label})`}
                    />
                  </div>
                ))}
              </div>
            )}

            {q.type === 'table' && (
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-slate-200 px-2 py-2 bg-slate-50 w-8"></th>
                      {q.tableHeaders.map(h => (
                        <th key={h} className="border border-slate-200 px-3 py-2 bg-slate-50 text-left font-semibold text-slate-700 text-xs">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {q.tableRows.map((row, rowIdx) => (
                      <tr key={row.label}>
                        <td className="border border-slate-200 px-2 py-2 text-slate-600 font-semibold text-center text-xs">
                          {row.label})
                        </td>
                        {row.columns.map((col, colIdx) => (
                          <td key={colIdx} className="border border-slate-200 px-1 py-1">
                            <input
                              type="text"
                              value={col}
                              onChange={e => updateTableCell(qIdx, rowIdx, colIdx, e.target.value)}
                              className="w-full px-2 py-1.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg"
                              placeholder="Fill in…"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {q.type === 'plain' && q.subParts.length === 0 && (
              <div className="px-5 py-3">
                <p className="text-xs text-slate-400 italic">No sub-parts — answer goes on the printed paper</p>
              </div>
            )}
          </div>
          </div>
        ))}
      </div>

      {state?.error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {state.error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {pending ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Save &amp; Preview
            </>
          )}
        </button>
        <a
          href="/papers"
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  )
}
