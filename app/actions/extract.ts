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

async function extractSingleFile(file: File): Promise<{ text?: string; error?: string }> {
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
    const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`
    return await ocrImageViaVision(dataUrl, file.name)
  }

  return { error: `"${file.name}": Unsupported file type. Use PDF, .docx, JPG, or PNG.` }
}

function guessMime(name: string): string {
  if (name.endsWith('.png')) return 'image/png'
  if (name.endsWith('.webp')) return 'image/webp'
  if (name.endsWith('.bmp')) return 'image/bmp'
  return 'image/jpeg'
}

// Transcribe an image using a free OpenRouter vision model, with a per-request
// timeout and a fallback chain so it never hangs and survives rate limits.
const VISION_MODELS = [
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'openrouter/free',
  'google/gemma-4-31b-it:free',
]

async function ocrImageViaVision(dataUrl: string, filename: string): Promise<{ text?: string; error?: string }> {
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
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60_000) // 60s hard cap
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
        if (text) return { text }
        lastError = 'empty response'
        continue
      }
      if (res.status === 401) return { error: `"${filename}": AI key rejected (401). Check OPENROUTER_API_KEY.` }
      const detail = await res.text().catch(() => '')
      lastError = `(${res.status}) ${detail.slice(0, 140)}`
      if (res.status === 404 || res.status === 429) continue
      return { error: `"${filename}": image read failed ${lastError}` }
    } catch (err: any) {
      clearTimeout(timeout)
      lastError = err.name === 'AbortError' ? 'timed out after 60s' : err.message
      continue
    }
  }

  return { error: `"${filename}": could not read the image (${lastError}). Try a clearer, flatter photo.` }
}

export async function extractTextFromFile(
  formData: FormData
): Promise<{ text?: string; error?: string }> {
  const files = formData.getAll('file') as File[]
  const valid = files.filter(f => f && f.name)
  if (!valid.length) return { error: 'No files provided.' }

  const parts: string[] = []
  const errors: string[] = []

  for (const file of valid) {
    try {
      const result = await extractSingleFile(file)
      if (result.text) parts.push(result.text.trim())
      else if (result.error) errors.push(result.error)
    } catch (err: any) {
      errors.push(`"${file.name}": ${err.message}`)
    }
  }

  if (!parts.length) return { error: errors.join(' | ') || 'No text could be extracted.' }
  return { text: parts.join('\n\n') }
}
