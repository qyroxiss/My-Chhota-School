'use server'
import mammoth from 'mammoth'

/**
 * PDFs created by many tools set hasEOL=false on every text item, producing one
 * long string with no line breaks. This function inserts newlines at the structural
 * boundaries a question paper always has, so the parser can find questions.
 */
function addLineBreaks(raw: string): string {
  let t = raw.replace(/[ \t]+/g, ' ').trim()

  // Separator lines (====...====) get their own line
  t = t.replace(/\s*(={4,})\s*/g, '\n$1\n')

  // SUBJECT: header on its own line
  t = t.replace(/\s+(?=SUBJECT\s*:)/gi, '\n')

  // Roman numeral section headers (I. II. III. IV. V. VI. etc.)
  // Requires a period immediately after and whitespace following — avoids mid-word hits
  t = t.replace(/\s+(?=(?:I{1,3}|IV|VI{0,3}|IX|X{1,3})[.]\s)/g, '\n')

  // Break after a section marks marker like "(10 marks)" so any passage that follows
  // a section header (e.g. reading comprehension text) starts on its own line
  t = t.replace(/(\(\d+\s*marks?\))\s+/gi, '$1\n')

  // Numbered questions: 1. 2. 3. (1–2 digit number + period + space)
  // Won't hit: "102," "23 +" "3.14" — period not followed by space in those cases
  t = t.replace(/\s+(?=\d{1,2}[.]\s+\S)/g, '\n')

  // Q1. Q2. style questions
  t = t.replace(/\s+(?=[Qq]\d+[.:)]\s)/g, '\n')

  // Sub-parts: a) b) c) etc.
  t = t.replace(/\s+(?=[a-z][)]\s)/g, '\n')

  // MCQ options in parens: (a) (b) (c) (d)
  // Won't hit "(play, is...)" because that has more than one letter before the closing paren
  t = t.replace(/\s+(?=\([a-z]\)\s)/g, '\n')

  // Clean up any triple+ newlines introduced above
  return t.replace(/\n{3,}/g, '\n\n').trim()
}

async function extractSingleFile(file: File, deadline: number): Promise<{ text?: string; error?: string }> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const name = file.name.toLowerCase()
  const type = file.type

  // PDF — extract raw text then reconstruct line breaks from content patterns,
  // because many PDF generators set hasEOL=false on every item (one flat string).
  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    const { extractText } = await import('unpdf')
    const uint8Array = new Uint8Array(bytes)
    const { text: pages } = await extractText(uint8Array)
    const raw = (pages as string[]).join('\n\n')
    if (!raw.trim())
      return { error: `"${file.name}": No readable text found. If it is a scanned PDF, upload it as an image instead.` }
    return { text: addLineBreaks(raw) }
  }

  // Word document (.docx)
  if (
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx')
  ) {
    const result = await mammoth.extractRawText({ buffer })
    if (!result.value.trim())
      return { error: `"${file.name}": Could not extract text from the Word document.` }
    return { text: result.value }
  }

  // Image (JPG, PNG, BMP, WEBP) — read with a vision model (reliable on photos,
  // unlike bundled OCR which is slow/unreliable and hangs on serverless).
  if (type.startsWith('image/') || /\.(jpg|jpeg|png|bmp|webp)$/.test(name)) {
    const mime = type && type.startsWith('image/') ? type : guessMime(name)
    const dataUrl = await toCompactDataUrl(buffer, mime)
    return await ocrImageViaVision(dataUrl, file.name, deadline)
  }

  return { error: `"${file.name}": Unsupported file type. Use PDF, .docx, JPG, or PNG.` }
}

// Downscale a photo before sending it to the vision model. Multi-MB phone/HDR
// photos otherwise make the API slow enough to hit the timeout and cascade
// through every fallback model (minutes per image). ~1600px JPEG keeps text
// legible while cutting the payload ~10-20x. Falls back to the original on error.
async function toCompactDataUrl(buffer: Buffer, mime: string): Promise<string> {
  const MAX = 1600
  try {
    const { loadImage, createCanvas } = await import('@napi-rs/canvas')
    const img = await loadImage(buffer)
    const longest = Math.max(img.width, img.height)
    if (longest <= MAX && buffer.length < 900_000) {
      return `data:${mime};base64,${buffer.toString('base64')}`
    }
    const scale = Math.min(1, MAX / longest)
    const w = Math.max(1, Math.round(img.width * scale))
    const h = Math.max(1, Math.round(img.height * scale))
    const canvas = createCanvas(w, h)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, w, h)
    const out = await canvas.encode('jpeg', 80)
    return `data:image/jpeg;base64,${out.toString('base64')}`
  } catch {
    return `data:${mime};base64,${buffer.toString('base64')}`
  }
}

function guessMime(name: string): string {
  if (name.endsWith('.png')) return 'image/png'
  if (name.endsWith('.webp')) return 'image/webp'
  if (name.endsWith('.bmp')) return 'image/bmp'
  return 'image/jpeg'
}

// Transcribe an image using a free OpenRouter vision model, with a per-request
// timeout and a fallback chain so it never hangs and survives rate limits.
// Real vision-language models only. NOT `openrouter/free` — its auto-router
// sometimes lands on a content-safety classifier that returns "User Safety: safe"
// instead of the page text. These are ordered fastest-first (measured 1-6s each).
const VISION_MODELS = [
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'google/gemma-4-26b-a4b-it:free',
]

const PER_REQUEST_MS = 30_000 // hard cap per model call
const OVERALL_DEADLINE_MS = 100_000 // whole extraction can never exceed this

// A response that is a safety verdict or too short to be a page is not OCR.
function looksLikeJunkOcr(text: string): boolean {
  return text.length < 15 || /user safety|^\W*(un)?safe\b|content is (un)?safe/i.test(text)
}

async function ocrImageViaVision(dataUrl: string, filename: string, deadline: number): Promise<{ text?: string; error?: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey)
    return { error: `"${filename}": Reading photos needs OPENROUTER_API_KEY in .env (free key at openrouter.ai/keys).` }

  const messages = [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text:
            'You are an OCR engine. Transcribe ALL readable text from this page image exactly as written, ' +
            'preserving reading order, headings, question numbers, options, and lists. ' +
            'Output plain text only — no commentary, no markdown.',
        },
        { type: 'image_url', image_url: { url: dataUrl } },
      ],
    },
  ]

  const models = process.env.OPENROUTER_VISION_MODEL ? [process.env.OPENROUTER_VISION_MODEL] : VISION_MODELS
  let lastError = 'request failed'

  for (const model of models) {
    const remaining = deadline - Date.now()
    if (remaining <= 1000) { lastError = 'time budget exhausted'; break }
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), Math.min(PER_REQUEST_MS, remaining))
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://my-chhota-school.vercel.app',
          'X-Title': 'My Chhota School - Image OCR',
        },
        body: JSON.stringify({ model, temperature: 0, messages }),
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (res.ok) {
        const data = await res.json()
        const text: string = (data?.choices?.[0]?.message?.content ?? '').trim()
        if (text && !looksLikeJunkOcr(text)) return { text }
        lastError = text ? `non-OCR response ("${text.slice(0, 30)}")` : 'empty response'
        continue // try the next model
      }
      if (res.status === 401) return { error: `"${filename}": AI key rejected (401). Check OPENROUTER_API_KEY.` }
      const detail = await res.text().catch(() => '')
      lastError = `(${res.status}) ${detail.slice(0, 140)}`
      if (res.status === 404 || res.status === 429) continue
      return { error: `"${filename}": image read failed ${lastError}` }
    } catch (err: any) {
      clearTimeout(timeout)
      lastError = err.name === 'AbortError' ? 'timed out' : err.message
      continue
    }
  }

  return { error: `"${filename}": could not read the image (${lastError}). The free AI vision service may be busy — try again in a minute, upload fewer images, or type the chapter into the "Generate with AI" tab instead.` }
}

export async function extractTextFromFile(
  formData: FormData
): Promise<{ text?: string; error?: string }> {
  const files = formData.getAll('file') as File[]
  const valid = files.filter(f => f && f.name)
  if (!valid.length) return { error: 'No files provided.' }

  // Whole operation is bounded so it can never hang (e.g. when the free vision
  // service is throttled). Files are processed with limited concurrency.
  const deadline = Date.now() + OVERALL_DEADLINE_MS
  const CONCURRENCY = 3
  const results: { text?: string; error?: string }[] = new Array(valid.length)

  let next = 0
  async function worker() {
    while (next < valid.length) {
      const i = next++
      const file = valid[i]
      try {
        results[i] = await extractSingleFile(file, deadline)
      } catch (err: any) {
        results[i] = { error: `"${file.name}": ${err.message}` }
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, valid.length) }, worker))

  const parts = results.filter(r => r?.text).map(r => r!.text!.trim())
  const errors = results.filter(r => r?.error).map(r => r!.error!)

  if (!parts.length) return { error: errors.join(' | ') || 'No text could be extracted.' }
  // Some succeeded, some failed — return what we got but note the failures.
  if (errors.length) return { text: parts.join('\n\n'), error: `Some files could not be read: ${errors.length}` }
  return { text: parts.join('\n\n') }
}
