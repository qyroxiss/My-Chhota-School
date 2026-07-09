'use client'
import { useActionState, useState, useRef } from 'react'
import Link from 'next/link'
import { createTemplate } from '@/app/actions/templates'
import { extractTextFromFile } from '@/app/actions/extract'
import { generateQuestionPaper, type QuestionSpec } from '@/app/actions/ai'
import { parsePaper } from '@/lib/parser'
import type { ParsedPaper } from '@/lib/definitions'
import PageHeader from '@/components/PageHeader'

const DIFFICULTIES = ['Easy', 'Medium', 'Hard']
const Q_TYPES = ['MCQ', 'Short Answer', 'Long Answer', 'Fill in the Blanks', 'True/False', 'Mixed']

// Shared field styles (inline Tailwind — matches the Template Name input which renders correctly)
const FIELD = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all'
const FIELD_SM = 'w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all'

export default function NewTemplatePage() {
  const [state, action, pending] = useActionState(createTemplate, undefined)
  const [preview, setPreview] = useState<ParsedPaper | null>(null)
  const [rawText, setRawText] = useState('')
  const [tab, setTab] = useState<'ai' | 'paste' | 'upload'>('ai')
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [extractProgress, setExtractProgress] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // ── AI generator state ──
  const [aiStandard, setAiStandard] = useState('')
  const [aiSubject, setAiSubject] = useState('')
  const [aiBook, setAiBook] = useState('')
  const [aiChapters, setAiChapters] = useState('')
  const [aiDuration, setAiDuration] = useState('1 Hour')
  const [specs, setSpecs] = useState<QuestionSpec[]>([
    { count: 5, marksPerQ: 1, difficulty: 'Medium', type: 'MCQ' },
  ])
  const [aiFiles, setAiFiles] = useState<File[]>([])
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const aiFileRef = useRef<HTMLInputElement>(null)

  const totalMarks = specs.reduce((sum, s) => sum + (s.count || 0) * (s.marksPerQ || 0), 0)

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
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
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
    if (result.error) setExtractError(result.error)
    else if (result.text) { handleTextChange(result.text); setTab('paste') }
  }

  // ── AI generation handlers ──
  function updateSpec(idx: number, patch: Partial<QuestionSpec>) {
    setSpecs(prev => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)))
  }
  function addSpec() {
    setSpecs(prev => [...prev, { count: 5, marksPerQ: 1, difficulty: 'Medium', type: 'Short Answer' }])
  }
  function removeSpec(idx: number) {
    setSpecs(prev => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev))
  }

  async function handleGenerate() {
    if (!aiSubject.trim() || !aiChapters.trim()) {
      setAiError('Please enter at least the Subject and the Chapters/Topics.')
      return
    }
    setAiGenerating(true)
    setAiError(null)

    // Optional: extract grounding text from an uploaded PDF/doc first
    let groundingText = ''
    if (aiFiles.length) {
      const fd = new FormData()
      for (const f of aiFiles) fd.append('file', f)
      const ext = await extractTextFromFile(fd)
      if (ext.error) {
        setAiGenerating(false)
        setAiError(`Could not read the uploaded file: ${ext.error}`)
        return
      }
      groundingText = ext.text ?? ''
    }

    const result = await generateQuestionPaper({
      standard: aiStandard,
      subject: aiSubject,
      book: aiBook,
      chapters: aiChapters,
      totalMarks,
      duration: aiDuration,
      specs,
      groundingText,
    })
    setAiGenerating(false)

    if (result.error) { setAiError(result.error); return }
    if (result.text) { handleTextChange(result.text); setTab('paste') }
  }

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto">
      <PageHeader
        title="Create Template"
        subtitle="Generate with AI, paste, or upload a question paper — we'll detect the structure automatically."
        crumbs={[{ label: 'Templates', href: '/templates' }, { label: 'New Template' }]}
      />

      <form action={action} className="space-y-5">
        {/* rawText is always submitted here, regardless of the active tab */}
        <input type="hidden" name="rawText" value={rawText} />

        {/* Template name */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1.5">Template Name</label>
          <input
            id="name" name="name" type="text" required
            placeholder='e.g. "Class 5 GK — 20 Marks"'
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex border-b border-slate-100 mb-5 -mt-1">
            {([
              ['ai', '✨ Generate with AI'],
              ['paste', 'Paste Text'],
              ['upload', 'Upload Files'],
            ] as const).map(([t, label]) => (
              <button
                key={t} type="button" onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                  tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── AI GENERATOR TAB ── */}
          {tab === 'ai' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Class / Standard">
                  <input value={aiStandard} onChange={e => setAiStandard(e.target.value)} placeholder="e.g. Class 5"
                    className={FIELD} />
                </Field>
                <Field label="Subject" required>
                  <input value={aiSubject} onChange={e => setAiSubject(e.target.value)} placeholder="e.g. Science"
                    className={FIELD} />
                </Field>
              </div>

              <Field label="Book / Textbook">
                <input value={aiBook} onChange={e => setAiBook(e.target.value)} placeholder="e.g. NCERT Science Class 5"
                  className={FIELD} />
              </Field>

              <Field label="Topics / Chapters" required>
                <textarea value={aiChapters} onChange={e => setAiChapters(e.target.value)} rows={3}
                  placeholder="e.g. Chapter 3: Plants and Animals; Photosynthesis; Food chains"
                  className={`${FIELD} resize-none`} />
              </Field>

              {/* Optional PDF grounding */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1.5">Upload Textbook / Chapter PDF <span className="text-slate-400 font-normal">(optional — grounds the questions)</span></p>
                <label className="flex items-center gap-3 w-full border-2 border-dashed border-slate-200 rounded-xl px-4 py-3 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all">
                  <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="text-sm text-slate-600 truncate">
                    {aiFiles.length ? aiFiles.map(f => f.name).join(', ') : 'Click to attach a PDF, Word doc, or image'}
                  </span>
                  <input ref={aiFileRef} type="file" multiple className="hidden" accept=".pdf,.docx,.jpg,.jpeg,.png,.bmp,.webp"
                    onChange={e => setAiFiles(Array.from(e.target.files ?? []))} />
                </label>
              </div>

              {/* Question & Marks Distribution */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-700">Question &amp; Marks Distribution</p>
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">Total: {totalMarks} marks</span>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_1fr_1.2fr_1.4fr_auto] gap-2 px-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    <span>No. Qs</span><span>Marks/Q</span><span>Difficulty</span><span>Type</span><span></span>
                  </div>
                  {specs.map((s, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_1.2fr_1.4fr_auto] gap-2 items-center">
                      <input type="number" min={1} value={s.count}
                        onChange={e => updateSpec(i, { count: parseInt(e.target.value) || 0 })} className={FIELD_SM} />
                      <input type="number" min={1} value={s.marksPerQ}
                        onChange={e => updateSpec(i, { marksPerQ: parseInt(e.target.value) || 0 })} className={FIELD_SM} />
                      <select value={s.difficulty} onChange={e => updateSpec(i, { difficulty: e.target.value })} className={FIELD_SM}>
                        {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                      </select>
                      <select value={s.type} onChange={e => updateSpec(i, { type: e.target.value })} className={FIELD_SM}>
                        {Q_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                      <button type="button" onClick={() => removeSpec(i)} disabled={specs.length === 1}
                        className="text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed p-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                <button type="button" onClick={addSpec}
                  className="w-full mt-2 border border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 rounded-xl py-2.5 text-sm font-semibold transition-colors">
                  + Add more questions
                </button>
              </div>

              <Field label="Duration">
                <input value={aiDuration} onChange={e => setAiDuration(e.target.value)} placeholder="e.g. 1 Hour" className={`${FIELD} max-w-xs`} />
              </Field>

              {aiError && <ErrorBox>{aiError}</ErrorBox>}

              <button type="button" onClick={handleGenerate} disabled={aiGenerating}
                className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
                {aiGenerating ? (
                  <><Spinner /> Generating question paper…</>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    Generate Question Paper
                  </>
                )}
              </button>
              <p className="text-xs text-slate-400 text-center">Generated questions appear in the “Paste Text” tab where you can review and edit before saving.</p>
            </div>
          )}

          {/* ── PASTE TAB ── */}
          {tab === 'paste' && (
            <div>
              <textarea
                id="rawText" rows={14} value={rawText}
                onChange={e => handleTextChange(e.target.value)}
                className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all"
                placeholder={`Class-5th\nSub: G.K.\nMM: 20\n\nQ1) Fill in the blanks (5)\n   a) The capital of India is _______`}
              />
              <p className="text-xs text-slate-400 mt-2">Supports Hindi text. Preview updates live.</p>
            </div>
          )}

          {/* ── UPLOAD TAB ── */}
          {tab === 'upload' && (
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all bg-slate-50/50">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-600">Click to select files</p>
                <p className="text-xs text-slate-400 mt-0.5">PDF, Word (.docx), JPG, PNG · multiple allowed · max 25 MB</p>
                <input ref={fileRef} type="file" multiple className="hidden" accept=".pdf,.docx,.jpg,.jpeg,.png,.bmp,.webp" onChange={handleFileChange} />
              </label>

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected</p>
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base">{file.type.startsWith('image/') ? '🖼️' : file.name.endsWith('.pdf') ? '📄' : '📝'}</span>
                        <span className="text-sm text-slate-700 truncate font-medium">{file.name}</span>
                        <span className="text-xs text-slate-400 shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                      </div>
                      <button type="button" onClick={() => removeFile(i)} className="ml-2 text-slate-400 hover:text-red-500 transition-colors shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {extractError && <ErrorBox>{extractError}</ErrorBox>}

              <button type="button" onClick={handleExtract} disabled={!selectedFiles.length || extracting}
                className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                {extracting ? <><Spinner /> {extractProgress}</> : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    Extract Text from {selectedFiles.length || ''} File{selectedFiles.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {state?.error && <ErrorBox>{state.error}</ErrorBox>}

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
              {preview.class && <Chip>Class: {preview.class}</Chip>}
              {preview.subject && <Chip>Subject: {preview.subject}</Chip>}
              {preview.maxMarks > 0 && <Chip>{preview.maxMarks} marks</Chip>}
              {preview.duration && <Chip>{preview.duration}</Chip>}
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
              {preview.questions.length > 8 && <p className="text-xs text-indigo-500 pl-7">+{preview.questions.length - 8} more questions</p>}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={pending || !rawText.trim()}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
            {pending ? <><Spinner /> Saving…</> : 'Save Template'}
          </button>
          <Link href="/templates" className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">Cancel</Link>
        </div>
      </form>
    </div>
  )
}

// ── small presentational helpers ──
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="text-xs bg-white border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-lg font-medium">{children}</span>
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      {children}
    </div>
  )
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
