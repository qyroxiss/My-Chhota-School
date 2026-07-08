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

  // Image (JPG, PNG, BMP, WEBP)
  if (type.startsWith('image/') || /\.(jpg|jpeg|png|bmp|webp)$/.test(name)) {
    const { createWorker } = await import('tesseract.js')
    // eng+hin covers English and Hindi (Devanagari) text
    const worker = await createWorker('eng+hin', 1, { cachePath: '/tmp' })
    const { data: { text } } = await worker.recognize(buffer)
    await worker.terminate()
    if (!text.trim())
      return { error: `"${file.name}": Could not read text from image. Ensure the photo is clear and well-lit.` }
    return { text }
  }

  return { error: `"${file.name}": Unsupported file type. Use PDF, .docx, JPG, or PNG.` }
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
