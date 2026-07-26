/**
 * Export all schools, templates, and papers from Supabase into an
 * Obsidian-ready folder of Markdown notes.
 *
 * Usage (from the school-app/ folder):
 *   npx tsx scripts/export-obsidian.ts                 -> writes ./obsidian-export
 *   npx tsx scripts/export-obsidian.ts "D:/My Vault"   -> writes to that folder
 *
 * The output folder can be opened directly in Obsidian as a vault.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, mkdirSync, writeFileSync, existsSync, readdirSync, copyFileSync } from 'fs'
import { join, resolve } from 'path'
import type { ParsedPaper, Question } from '../lib/definitions'

// ── Load .env manually (a plain tsx script doesn't get Next.js env loading) ──
function loadEnv() {
  const envPath = resolve(__dirname, '..', '.env')
  const raw = readFileSync(envPath, 'utf8')
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)
    if (!m) continue
    let val = m[2].trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1)
    if (!process.env[m[1]]) process.env[m[1]] = val
  }
}
loadEnv()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}
const supabase = createClient(url, key)

const OUT = resolve(process.argv[2] || './obsidian-export')

// ── Helpers ──
function sanitize(name: string): string {
  return (name || 'Untitled').replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim().slice(0, 120)
}

function safeParse(json: string): ParsedPaper | null {
  try { return JSON.parse(json) } catch { return null }
}

// Render a ParsedPaper's questions to Markdown
function renderQuestions(paper: ParsedPaper): string {
  const out: string[] = []
  paper.questions.forEach((q: Question, idx) => {
    if (q.sectionLabel) {
      out.push(`\n### Subject: ${q.sectionLabel.subject}`)
      const meta = [
        q.sectionLabel.maxMarks > 0 ? `M.M.: ${q.sectionLabel.maxMarks}` : '',
        q.sectionLabel.duration ? `Time: ${q.sectionLabel.duration}` : '',
      ].filter(Boolean).join(' · ')
      if (meta) out.push(`*${meta}*`)
    }
    if (q.subsectionLabel) out.push(`\n**${q.subsectionLabel}**`)
    if (q.subsectionIntro) out.push(`\n> ${q.subsectionIntro}`)

    const marks = q.marks > 0 ? ` **(${q.marks})**` : ''
    out.push(`\n**Q${idx + 1}.** ${q.title}${marks}`)
    if (q.intro) out.push(`*${q.intro}*`)

    if (q.type === 'table' && q.tableRows.length) {
      out.push('')
      out.push(`| # | ${q.tableHeaders.join(' | ')} |`)
      out.push(`| --- | ${q.tableHeaders.map(() => '---').join(' | ')} |`)
      for (const row of q.tableRows) out.push(`| ${row.label} | ${row.columns.join(' | ')} |`)
    } else {
      for (const sp of q.subParts) out.push(`- **${sp.label})** ${sp.content || '________'}`)
    }
  })
  return out.join('\n')
}

function frontmatter(fields: Record<string, string | number | undefined>, tags: string[]): string {
  const lines = ['---']
  for (const [k, v] of Object.entries(fields)) if (v !== undefined && v !== '') lines.push(`${k}: ${JSON.stringify(v)}`)
  if (tags.length) lines.push(`tags: [${tags.join(', ')}]`)
  lines.push('---', '')
  return lines.join('\n')
}

async function main() {
  console.log('Connecting to Supabase…')
  const [{ data: schools }, { data: templates }, { data: papers }] = await Promise.all([
    supabase.from('School').select('id, name, address'),
    supabase.from('Template').select('*'),
    supabase.from('Paper').select('*, Template(name, class, subject), User(name)'),
  ])

  const schoolName = (id: string) => (schools ?? []).find((s: any) => s.id === id)?.name ?? 'Unknown School'

  mkdirSync(join(OUT, 'Templates'), { recursive: true })
  mkdirSync(join(OUT, 'Papers'), { recursive: true })
  mkdirSync(join(OUT, 'Project Notes'), { recursive: true })

  // ── Templates ──
  const templateLinks: string[] = []
  for (const t of templates ?? []) {
    const parsed = safeParse(t.structure)
    const fname = sanitize(t.name)
    templateLinks.push(`- [[${fname}]] — ${t.subject}, Class ${t.class}, ${t.maxMarks} marks`)
    const body =
      frontmatter(
        { title: t.name, type: 'template', school: schoolName(t.schoolId), class: t.class, subject: t.subject, maxMarks: t.maxMarks, duration: t.duration ?? '', created: t.createdAt },
        ['template', sanitize(t.subject).replace(/\s+/g, '-')]
      ) +
      `# ${t.name}\n\n` +
      `**School:** ${schoolName(t.schoolId)}  \n**Class:** ${t.class} · **Subject:** ${t.subject} · **Max Marks:** ${t.maxMarks}${t.duration ? ` · **Time:** ${t.duration}` : ''}\n` +
      (parsed ? `\n${renderQuestions(parsed)}\n` : '\n*(could not parse structure)*\n')
    writeFileSync(join(OUT, 'Templates', `${fname}.md`), body, 'utf8')
  }

  // ── Papers ──
  const paperLinks: string[] = []
  for (const p of papers ?? []) {
    const parsed = safeParse(p.content)
    const subject = p.Template?.subject ?? parsed?.subject ?? 'Paper'
    const cls = p.Template?.class ?? parsed?.class ?? ''
    const label = `${subject} - Class ${cls}${p.date ? ` - ${p.date}` : ''} - ${p.id.slice(0, 6)}`
    const fname = sanitize(label)
    paperLinks.push(`- [[${fname}]]${p.date ? ` — ${p.date}` : ''}`)
    const body =
      frontmatter(
        { title: label, type: 'paper', school: schoolName(p.schoolId), class: cls, subject, date: p.date ?? '', createdBy: p.User?.name ?? '', created: p.createdAt, template: p.Template?.name ?? '' },
        ['paper', sanitize(subject).replace(/\s+/g, '-')]
      ) +
      `# ${subject} — Class ${cls}\n\n` +
      `**School:** ${schoolName(p.schoolId)}  \n` +
      (p.Template?.name ? `**From template:** [[${sanitize(p.Template.name)}]]  \n` : '') +
      `**Date:** ${p.date || '—'} · **Created by:** ${p.User?.name || '—'}\n` +
      (parsed ? `\n${renderQuestions(parsed)}\n` : '\n*(could not parse content)*\n')
    writeFileSync(join(OUT, 'Papers', `${fname}.md`), body, 'utf8')
  }

  // ── Copy this project's memory notes if present ──
  const memoryDir = 'C:/Users/Dell/.claude/projects/d--My-Chhota-School/memory'
  let copiedNotes = 0
  if (existsSync(memoryDir)) {
    for (const f of readdirSync(memoryDir)) {
      if (f.endsWith('.md')) { copyFileSync(join(memoryDir, f), join(OUT, 'Project Notes', f)); copiedNotes++ }
    }
  }

  // ── Index / Map of Content ──
  const index =
    frontmatter({ title: 'My Chhota School — Index' }, ['moc']) +
    `# 🏫 My Chhota School — Vault Index\n\n` +
    `Exported ${papers?.length ?? 0} paper(s) and ${templates?.length ?? 0} template(s) from Supabase.\n\n` +
    `## Templates\n${templateLinks.join('\n') || '- _none_'}\n\n` +
    `## Papers\n${paperLinks.join('\n') || '- _none_'}\n\n` +
    `## Project Notes\n${copiedNotes ? `${copiedNotes} note(s) copied into [[Project Notes]].` : '- _none found_'}\n`
  writeFileSync(join(OUT, 'index.md'), index, 'utf8')

  console.log(`\n✅ Done. Exported to:\n   ${OUT}\n`)
  console.log(`   Templates: ${templates?.length ?? 0}`)
  console.log(`   Papers:    ${papers?.length ?? 0}`)
  console.log(`   Project notes copied: ${copiedNotes}`)
  console.log(`\nOpen that folder in Obsidian as a vault (Open folder as vault).`)
}

main().catch(err => { console.error('Export failed:', err); process.exit(1) })
