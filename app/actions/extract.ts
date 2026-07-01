'use server'
import mammoth from 'mammoth'
import pdfParse from 'pdf-parse'

export async function extractTextFromFile(
  formData: FormData
): Promise<{ text?: string; error?: string }> {
  const file = formData.get('file') as File
  if (!file || !file.name) return { error: 'No file provided.' }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const name = file.name.toLowerCase()
  const type = file.type

  try {
    // PDF
    if (type === 'application/pdf' || name.endsWith('.pdf')) {
      const data = await pdfParse(buffer)
      if (!data.text.trim())
        return { error: 'No readable text found in this PDF. If it is a scanned PDF, upload it as an image instead.' }
      return { text: data.text }
    }

    // Word document (.docx)
    if (
      type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      name.endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ buffer })
      if (!result.value.trim())
        return { error: 'Could not extract text from the Word document.' }
      return { text: result.value }
    }

    // Image (JPG, PNG, BMP, WEBP)
    if (type.startsWith('image/') || /\.(jpg|jpeg|png|bmp|webp)$/.test(name)) {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker('eng', 1, { cachePath: '/tmp' })
      const { data: { text } } = await worker.recognize(buffer)
      await worker.terminate()
      if (!text.trim())
        return { error: 'Could not read text from the image. Make sure the image is clear and well-lit.' }
      return { text }
    }

    return { error: 'Unsupported file type. Please upload a PDF, Word document (.docx), or image (JPG, PNG).' }
  } catch (err: any) {
    return { error: `Extraction failed: ${err.message}` }
  }
}
