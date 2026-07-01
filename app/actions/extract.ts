'use server'
import mammoth from 'mammoth'

async function extractSingleFile(file: File): Promise<{ text?: string; error?: string }> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const name = file.name.toLowerCase()
  const type = file.type

  // PDF
  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse')
    const data = await pdfParse(buffer)
    if (!data.text.trim())
      return { error: `"${file.name}": No readable text found. If it is a scanned PDF, upload it as an image instead.` }
    return { text: data.text }
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
