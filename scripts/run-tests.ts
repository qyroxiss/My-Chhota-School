/**
 * End-to-end test harness for the extraction + parsing pipeline.
 * Runs every file in the Test assets folder through the REAL production code
 * (extractTextFromFile + parsePaper) and prints a report.
 *
 *   npx tsx scripts/run-tests.ts            # everything
 *   npx tsx scripts/run-tests.ts docs       # only .txt/.pdf/.docx (no API calls)
 *   npx tsx scripts/run-tests.ts images     # only images (vision API)
 */
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, resolve, extname } from 'path'
import { parsePaper } from '../lib/parser'
import { extractTextFromFile } from '../app/actions/extract'

// ── load .env so extract.ts sees OPENROUTER_API_KEY ──
for (const line of readFileSync(resolve(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)
  if (!m) continue
  let v = m[2].trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  if (!process.env[m[1]]) process.env[m[1]] = v
}

const ASSETS = 'D:/My Chhota School/Test assets'
const filter = (process.argv[2] || 'all').toLowerCase()

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.bmp': 'image/bmp',
  '.pdf': 'application/pdf', '.txt': 'text/plain',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}
const isImage = (ext: string) => ['.jpg', '.jpeg', '.png', '.webp', '.bmp'].includes(ext)

function pass(cond: boolean) { return cond ? '✅' : '❌' }

async function run() {
  const files = readdirSync(ASSETS).filter(f => statSync(join(ASSETS, f)).isFile()).sort()
  const results: any[] = []

  for (const name of files) {
    const ext = extname(name).toLowerCase()
    if (ext === '.jpeg' && name === 'logo.jpeg') continue // logo, not a paper
    if (filter === 'docs' && isImage(ext)) continue
    if (filter === 'images' && !isImage(ext)) continue

    const buf = readFileSync(join(ASSETS, name))
    let text = ''
    let err = ''
    const started = Date.now()

    try {
      if (ext === '.txt') {
        text = buf.toString('utf8') // .txt isn't an upload type; read directly
      } else {
        const file = new File([new Uint8Array(buf)], name, { type: MIME[ext] || 'application/octet-stream' })
        const fd = new FormData()
        fd.append('file', file)
        const res = await extractTextFromFile(fd)
        if (res.error) err = res.error
        text = res.text ?? ''
      }
    } catch (e: any) {
      err = e.message
    }

    const secs = ((Date.now() - started) / 1000).toFixed(1)
    const parsed = text ? parsePaper(text) : null
    const row = {
      file: name,
      kb: Math.round(buf.length / 1024),
      secs,
      chars: text.length,
      questions: parsed?.questions.length ?? 0,
      subject: parsed?.subject || '—',
      class: parsed?.class || '—',
      mm: parsed?.maxMarks ?? 0,
      err,
    }
    results.push(row)

    console.log(
      `${pass(!err && text.length > 0)} ${name}  [${row.kb}KB, ${secs}s]  ` +
      `chars=${text.length}  questions=${row.questions}  subject="${row.subject}"` +
      (err ? `  ERROR: ${err.slice(0, 120)}` : '')
    )
    if (text && !err && ext !== '.txt') {
      console.log(`     ↳ snippet: ${text.replace(/\s+/g, ' ').slice(0, 160)}…`)
    }
  }

  // ── Summary ──
  console.log('\n================ SUMMARY ================')
  const ok = results.filter(r => !r.err && r.chars > 0)
  console.log(`Files tested:      ${results.length}`)
  console.log(`Extracted text:    ${ok.length}`)
  console.log(`Failed:            ${results.length - ok.length}`)
  console.log(`Detected questions in: ${results.filter(r => r.questions > 0).length} file(s)`)
  const failed = results.filter(r => r.err || r.chars === 0)
  if (failed.length) {
    console.log('\nFailures:')
    for (const r of failed) console.log(`  ❌ ${r.file} — ${r.err || 'no text extracted'}`)
  }
}

run().catch(e => { console.error(e); process.exit(1) })
