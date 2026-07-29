'use client'
import { useActionState, useState, useRef } from 'react'
import Link from 'next/link'
import { createTemplate } from '@/app/actions/templates'
import { extractTextFromFile, type ChapterSegment } from '@/app/actions/extract'
import { generateQuestionPaper, type QuestionSpec } from '@/app/actions/ai'
import { parsePaper } from '@/lib/parser'
import type { ParsedPaper } from '@/lib/definitions'
import PageHeader from '@/components/PageHeader'

const DIFFICULTIES = ['Easy', 'Medium', 'Hard']
const Q_TYPES = ['MCQ', 'Short Answer', 'Long Answer', 'Fill in the Blanks', 'True/False', 'Mixed']

// Shared field styles (inline Tailwind — matches the Template Name input which renders correctly)
const FIELD = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all'
const FIELD_SM = 'w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all'

// Downscale an image File in the browser before upload so multi-MB photos become
// small, fast payloads (and never exceed the request-body limit). Non-images pass through.
async function compressImageFile(file: File, maxDim = 1600, quality = 0.8): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  try {
    const dataUrl: string = await new Promise((res, rej) => {
      const r = new FileReader()
      r.onload = () => res(r.result as string)
      r.onerror = () => rej(new Error('read failed'))
      r.readAsDataURL(file)
    })
    const img: HTMLImageElement = await new Promise((res, rej) => {
      const i = new Image()
      i.onload = () => res(i)
      i.onerror = () => rej(new Error('decode failed'))
      i.src = dataUrl
    })
    const longest = Math.max(img.width, img.height)
    if (longest <= maxDim && file.size < 900_000) return file
    const scale = Math.min(1, maxDim / longest)
    const w = Math.max(1, Math.round(img.width * scale))
    const h = Math.max(1, Math.round(img.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d')?.drawImage(img, 0, 0, w, h)
    const blob: Blob | null = await new Promise(res => canvas.toBlob(res, 'image/jpeg', quality))
    if (!blob) return file
    return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
  } catch {
    return file // fall back to the original on any failure
  }
}

async function buildUploadForm(files: File[]): Promise<FormData> {
  const fd = new FormData()
  for (const file of files) fd.append('file', await compressImageFile(file))
  return fd
}

export default function NewTemplatePage() {
  const [state, action, pending] = useActionState(createTemplate, undefined)
  const [preview, setPreview] = useState<ParsedPaper | null>(null)
  const [rawText, setRawText] = useState('')
  const [tab, setTab] = useState<'ai' | 'paste' | 'upload'>('ai')
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [extractProgress, setExtractProgress] = useState('')
  const [detectedChapters, setDetectedChapters] = useState<ChapterSegment[] | null>(null)
  const [fullExtractedText, setFullExtractedText] = useState('')
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
  // Text carried over from an extraction to use as AI grounding (avoids re-OCR)
  const [aiGroundingText, setAiGroundingText] = useState('')
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
    setDetectedChapters(null)
  }

  function removeFile(index: number) {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
    if (fileRef.current) fileRef.current.value = ''
    setDetectedChapters(null)
  }

  async function handleExtract() {
    if (!selectedFiles.length) return
    setExtracting(true)
    setExtractError(null)
    setDetectedChapters(null)
    setExtractProgress(`Extracting ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}…`)
    // Photo OCR round-trips to a vision model and can take a while — let the
    // user know it's still working rather than looking stuck.
    const hasPhoto = selectedFiles.some(f => f.type.startsWith('image/'))
    const slowNotice = hasPhoto
      ? setTimeout(() => setExtractProgress('Reading photo… can take up to 45s'), 5000)
      : null
    const fd = await buildUploadForm(selectedFiles)
    const result = await extractTextFromFile(fd)
    if (slowNotice) clearTimeout(slowNotice)
    setExtracting(false)
    setExtractProgress('')
    if (result.text) {
      setFullExtractedText(result.text)
      if (result.chapters && result.chapters.length > 1) {
        setDetectedChapters(result.chapters)
        setExtractError(result.error ? `Note: ${result.error}` : null)
      } else {
        handleTextChange(result.text)
        setTab('paste')
        setExtractError(result.error ? `Note: ${result.error}` : null)
      }
    } else {
      setExtractError(result.error || 'Could not extract any text.')
    }
  }

  function selectChapter(chapter: ChapterSegment) {
    handleTextChange(chapter.text)
    if (!aiChapters.trim()) setAiChapters(chapter.title)
    setDetectedChapters(null)
    setTab('paste')
  }

  function useWholeDocument() {
    handleTextChange(fullExtractedText)
    setDetectedChapters(null)
    setTab('paste')
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

    // Grounding: reuse text carried over from an extraction, or read uploaded files now.
    // Grounding is optional — if reading the photo fails, we still generate from the
    // typed Subject/Chapter rather than blocking the user.
    let groundingText = aiGroundingText.trim()
    if (aiFiles.length) {
      const fd = await buildUploadForm(aiFiles)
      const ext = await extractTextFromFile(fd)
      if (ext.text) groundingText = [groundingText, ext.text].filter(Boolean).join('\n\n')
      else if (ext.error && !groundingText) {
        setAiError(`Couldn't read the photo (${ext.error}). Generating from the chapter name instead.`)
      }
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

              {/* Grounding carried over from an extraction */}
              {aiGroundingText.trim() && (
                <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-emerald-800 flex-1">
                    Chapter content attached ({Math.round(aiGroundingText.trim().length / 100) / 10}k chars) — questions will be based on it.
                    <button type="button" onClick={() => setAiGroundingText('')} className="ml-2 font-semibold underline hover:no-underline">Remove</button>
                  </p>
                </div>
              )}

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

              {detectedChapters && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-indigo-900">This looks like a whole book — pick a chapter</p>
                    <p className="text-xs text-indigo-700 mt-0.5">We found {detectedChapters.length} chapters. Questions will be based only on the one you pick.</p>
                  </div>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {detectedChapters.map((ch, i) => (
                      <button key={i} type="button" onClick={() => selectChapter(ch)}
                        className="w-full text-left bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-xl px-4 py-2.5 text-sm text-slate-700 font-medium transition-colors">
                        {ch.title}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={useWholeDocument}
                    className="text-xs font-semibold text-indigo-600 underline hover:no-underline">
                    Use the entire document instead
                  </button>
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

        {/* No questions found — this is study material, not a paper. Offer AI generation. */}
        {preview && preview.questions.length === 0 && rawText.trim().length > 40 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900">No questions found in this content</p>
                <p className="text-sm text-amber-700 mt-0.5">
                  This looks like study material (a lesson or chapter), not a ready-made question paper. Let the AI create questions from it.
                </p>
                <button
                  type="button"
                  onClick={() => { setAiGroundingText(rawText); setTab('ai') }}
                  className="mt-3 inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-indigo-600/20"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Generate questions from this
                </button>
              </div>
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
