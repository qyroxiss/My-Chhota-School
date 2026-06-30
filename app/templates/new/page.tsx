'use client'
import { useActionState, useState } from 'react'
import { createTemplate } from '@/app/actions/templates'
import { parsePaper } from '@/lib/parser'
import type { ParsedPaper } from '@/lib/definitions'

export default function NewTemplatePage() {
  const [state, action, pending] = useActionState(createTemplate, undefined)
  const [preview, setPreview] = useState<ParsedPaper | null>(null)
  const [rawText, setRawText] = useState('')

  function handleTextChange(text: string) {
    setRawText(text)
    if (text.trim().length > 20) {
      try {
        setPreview(parsePaper(text))
      } catch {
        setPreview(null)
      }
    } else {
      setPreview(null)
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create Template</h1>
        <p className="text-gray-500 mt-1">Paste an existing question paper — the system will auto-detect the structure.</p>
      </div>

      <form action={action} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Template Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder='e.g. "Class 5 GK — 20 Marks"'
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="rawText" className="block text-sm font-medium text-gray-700 mb-1">
            Paste Question Paper Text
          </label>
          <textarea
            id="rawText"
            name="rawText"
            rows={14}
            required
            value={rawText}
            onChange={e => handleTextChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder={`Class-5th\nSub:G.K.\nMM: 20\nQ1) Gems of the country (5)\n a) He was the man who laid the foundation of the Birla Group.\n b) A great scientist and a former President of India.\n...`}
          />
          <p className="text-xs text-gray-400 mt-1">Supports Hindi text. Preview updates as you type.</p>
        </div>

        {state?.error && (
          <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>
        )}

        {/* Live preview */}
        {preview && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-blue-800 mb-3">Detected structure:</p>
            <div className="text-sm text-blue-700 space-y-1">
              {preview.class && <p>Class: <strong>{preview.class}</strong></p>}
              {preview.subject && <p>Subject: <strong>{preview.subject}</strong></p>}
              {preview.maxMarks > 0 && <p>Max Marks: <strong>{preview.maxMarks}</strong></p>}
              {preview.duration && <p>Duration: <strong>{preview.duration}</strong></p>}
              <p>Questions detected: <strong>{preview.questions.length}</strong></p>
              {preview.questions.map(q => (
                <div key={q.number} className="ml-3 text-blue-600">
                  Q{q.number}: {q.title} ({q.marks} marks, {q.type === 'table' ? 'table format' : `${q.subParts.length} sub-parts`})
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending || !rawText.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {pending ? 'Saving...' : 'Save Template'}
          </button>
          <a href="/templates" className="px-6 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            Cancel
          </a>
        </div>
      </form>
    </div>
  )
}
