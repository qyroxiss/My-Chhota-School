'use client'
import { useActionState, useState, useRef } from 'react'
import { createTemplate } from '@/app/actions/templates'
import { extractTextFromFile } from '@/app/actions/extract'
import { parsePaper } from '@/lib/parser'
import type { ParsedPaper } from '@/lib/definitions'

export default function NewTemplatePage() {
  const [state, action, pending] = useActionState(createTemplate, undefined)
  const [preview, setPreview] = useState<ParsedPaper | null>(null)
  const [rawText, setRawText] = useState('')
  const [tab, setTab] = useState<'paste' | 'upload'>('paste')
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleTextChange(text: string) {
    setRawText(text)
    if (text.trim().length > 20) {
      try { setPreview(parsePaper(text)) } catch { setPreview(null) }
    } else {
      setPreview(null)
    }
  }

  async function handleExtract() {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setExtracting(true)
    setExtractError(null)
    const fd = new FormData()
    fd.append('file', file)
    const result = await extractTextFromFile(fd)
    setExtracting(false)
    if (result.error) {
      setExtractError(result.error)
    } else if (result.text) {
      handleTextChange(result.text)
      setTab('paste')
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create Template</h1>
        <p className="text-gray-500 mt-1">Paste text or upload a file — the system will auto-detect the question paper structure.</p>
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

        {/* Tabs */}
        <div>
          <div className="flex border-b border-gray-200 mb-4">
            <button
              type="button"
              onClick={() => setTab('paste')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === 'paste'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Paste Text
            </button>
            <button
              type="button"
              onClick={() => setTab('upload')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === 'upload'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Upload File
            </button>
          </div>

          {tab === 'paste' && (
            <div>
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
          )}

          {tab === 'upload' && (
            <div className="space-y-4">
              {/* Hidden textarea to keep form valid */}
              <textarea name="rawText" value={rawText} onChange={() => {}} className="hidden" required />

              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors bg-gray-50">
                <div className="text-center">
                  <svg className="mx-auto mb-2 w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <p className="text-sm text-gray-600">
                    {fileName ? (
                      <span className="font-medium text-blue-600">{fileName}</span>
                    ) : (
                      <>Click to select or drag & drop</>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF, Word (.docx), JPG, PNG — max 10 MB</p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.jpg,.jpeg,.png,.bmp,.webp"
                  onChange={e => setFileName(e.target.files?.[0]?.name ?? null)}
                />
              </label>

              {extractError && (
                <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{extractError}</p>
              )}

              <button
                type="button"
                onClick={handleExtract}
                disabled={!fileName || extracting}
                className="w-full bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {extracting ? 'Extracting text…' : 'Extract Text from File'}
              </button>

              {extracting && (
                <p className="text-xs text-gray-500 text-center">
                  This may take 10–30 seconds for images. Please wait…
                </p>
              )}
            </div>
          )}
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
