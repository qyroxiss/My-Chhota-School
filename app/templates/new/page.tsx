'use client'
import { useActionState, useState, useRef } from 'react'
import Link from 'next/link'
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [extractProgress, setExtractProgress] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleTextChange(text: string) {
    setRawText(text)
    if (text.trim().length > 20) {
      try { setPreview(parsePaper(text)) } catch { setPreview(null) }
    } else {
      setPreview(null)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setSelectedFiles(files)
    setExtractError(null)
  }

  function removeFile(index: number) {
    const updated = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(updated)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleExtract() {
    if (!selectedFiles.length) return
    setExtracting(true)
    setExtractError(null)
    setExtractProgress(`Extracting ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}…`)

    const fd = new FormData()
    for (const file of selectedFiles) fd.append('file', file)

    const result = await extractTextFromFile(fd)
    setExtracting(false)
    setExtractProgress('')

    if (result.error) {
      setExtractError(result.error)
    } else if (result.text) {
      handleTextChange(result.text)
      setTab('paste')
    }
  }

  const hasImages = selectedFiles.some(f => f.type.startsWith('image/') || /\.(jpg|jpeg|png|bmp|webp)$/i.test(f.name))

  return (
    <div className="p-8 max-w-3xl">
      {/* Breadcrumb + header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
          <Link href="/templates" className="hover:text-slate-900 transition-colors">Templates</Link>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-slate-900 font-medium">New Template</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Create Template</h1>
        <p className="text-slate-500 mt-1 text-sm">Paste or upload a question paper — we'll detect the structure automatically.</p>
      </div>

      <form action={action} className="space-y-5">
        {/* Template name */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1.5">
            Template Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder='e.g. "Class 5 GK — 20 Marks"'
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex border-b border-slate-100 mb-5 -mt-1">
            {(['paste', 'upload'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors capitalize ${
                  tab === t
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {t === 'paste' ? 'Paste Text' : 'Upload Files'}
              </button>
            ))}
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
                className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all"
                placeholder={`Class-5th\nSub: G.K.\nMM: 20\n\nQ1) Fill in the blanks (5)\n   a) The capital of India is _______\n   b) The sun rises in the _______\n\nQ2) True or False (5)\n   a) Fish can fly.\n   b) The sky is blue.`}
              />
              <p className="text-xs text-slate-400 mt-2">Supports Hindi text. Preview updates live.</p>
            </div>
          )}

          {tab === 'upload' && (
            <div className="space-y-4">
              <textarea name="rawText" value={rawText} onChange={() => {}} className="hidden" required />

              {/* Drop zone */}
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all bg-slate-50/50">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-600">Click to select files</p>
                <p className="text-xs text-slate-400 mt-0.5">PDF, Word (.docx), JPG, PNG · multiple allowed · max 25 MB</p>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,.docx,.jpg,.jpeg,.png,.bmp,.webp"
                  onChange={handleFileChange}
                />
              </label>

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected</p>
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base">
                          {file.type.startsWith('image/') ? '🖼️' : file.name.endsWith('.pdf') ? '📄' : '📝'}
                        </span>
                        <span className="text-sm text-slate-700 truncate font-medium">{file.name}</span>
                        <span className="text-xs text-slate-400 shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="ml-2 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {extractError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {extractError}
                </div>
              )}

              <button
                type="button"
                onClick={handleExtract}
                disabled={!selectedFiles.length || extracting}
                className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {extracting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {extractProgress}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    Extract Text from {selectedFiles.length || ''} File{selectedFiles.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>

              {extracting && (
                <p className="text-xs text-slate-500 text-center">
                  {hasImages
                    ? 'Reading images with OCR (English + Hindi). This may take 20–60 seconds per image…'
                    : 'Extracting text from documents…'}
                </p>
              )}
            </div>
          )}
        </div>

        {state?.error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {state.error}
          </div>
        )}

        {/* Live preview */}
        {preview && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <p className="text-sm font-semibold text-indigo-800">Detected structure</p>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {preview.class && <span className="text-xs bg-white border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-lg font-medium">Class: {preview.class}</span>}
              {preview.subject && <span className="text-xs bg-white border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-lg font-medium">Subject: {preview.subject}</span>}
              {preview.maxMarks > 0 && <span className="text-xs bg-white border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-lg font-medium">{preview.maxMarks} marks</span>}
              {preview.duration && <span className="text-xs bg-white border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-lg font-medium">{preview.duration}</span>}
              <span className="text-xs bg-indigo-600 text-white px-2.5 py-1 rounded-lg font-medium">{preview.questions.length} questions</span>
            </div>
            <div className="space-y-1">
              {preview.questions.slice(0, 8).map((q, i) => (
                <div key={i} className="text-xs text-indigo-700 flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-indigo-200 flex items-center justify-center text-indigo-800 font-bold text-xs shrink-0">{i + 1}</span>
                  <span className="truncate">{q.title}</span>
                  {q.subParts.length > 0 && <span className="text-indigo-500 shrink-0">({q.subParts.length} parts)</span>}
                </div>
              ))}
              {preview.questions.length > 8 && (
                <p className="text-xs text-indigo-500 pl-7">+{preview.questions.length - 8} more questions</p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={pending || !rawText.trim()}
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
            ) : 'Save Template'}
          </button>
          <Link href="/templates" className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
