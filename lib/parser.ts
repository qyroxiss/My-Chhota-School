import type { ParsedPaper, Question, SubPart, TableRow } from './definitions'

export function parsePaper(text: string): ParsedPaper {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)

  const result: ParsedPaper = {
    class: '',
    subject: '',
    maxMarks: 0,
    duration: '',
    questions: [],
  }

  let i = 0
  let pendingSubsection: string | null = null

  // Parse header lines — stop at the first question
  while (i < lines.length && !isQuestionStart(lines[i])) {
    const line = lines[i]

    if (/^[=\-*]{3,}/.test(line)) { i++; continue }

    // Roman numeral subsection headers before the first question (first section)
    if (/^(?:I{1,3}|IV|V?I{0,3}|IX|X)[.)]\s+/i.test(line)) {
      pendingSubsection = line
      i++; continue
    }

    const classMatch = line.match(/^class[:\s-]+(.+)/i)
    const subMatch = line.match(/^sub(?:ject)?[:\s]+(.+)/i)
    const mmMatch = line.match(/(?:^|\|)\s*(?:mm|max\.?\s*marks?|total\s*marks?)[:\s]+(\d+)/i)
    const timeMatch = line.match(/(?:^|\|)\s*(?:time|duration)[:\s]+(.+?)(?:\s*\||$)/i)

    if (classMatch && !result.class) result.class = classMatch[1].trim()
    else if (subMatch && !result.subject) result.subject = subMatch[1].trim()
    if (mmMatch && !result.maxMarks) result.maxMarks = parseInt(mmMatch[1])
    if (timeMatch && !result.duration) result.duration = timeMatch[1].trim()
    i++
  }

  // Parse question blocks
  let pendingSection: { subject: string; maxMarks: number; duration: string } | null = null

  while (i < lines.length) {
    const line = lines[i]

    // Skip visual separators
    if (/^[=\-*]{3,}/.test(line)) { i++; continue }

    // Detect Roman numeral subsection headers (I. Grammar…, II. Reading…)
    if (/^(?:I{1,3}|IV|V?I{0,3}|IX|X)[.)]\s+/i.test(line)) {
      pendingSubsection = line
      i++; continue
    }

    // Detect new SUBJECT: line (multi-subject papers)
    const subjectMatch = line.match(/^sub(?:ject)?[:\s]+(.+)/i)
    if (subjectMatch) {
      pendingSection = { subject: subjectMatch[1].trim(), maxMarks: 0, duration: '' }
      i++; continue
    }

    // When a pending section is open, absorb its marks/duration lines before any questions
    if (pendingSection && !isQuestionStart(line)) {
      const mm = line.match(/(?:^|\|)\s*(?:mm|max\.?\s*marks?|total\s*marks?)[:\s]+(\d+)/i)
      const tm = line.match(/(?:^|\|)\s*(?:time|duration)[:\s]+(.+?)(?:\s*\||$)/i)
      if (mm) pendingSection.maxMarks = parseInt(mm[1])
      if (tm) pendingSection.duration = tm[1].trim()
      i++; continue
    }

    if (!isQuestionStart(line)) { i++; continue }

    const question = parseQuestion(line)
    i++

    // Attach pending section / subsection labels to the first question in each group
    if (pendingSection) {
      question.sectionLabel = { ...pendingSection }
      pendingSection = null
    }
    if (pendingSubsection) {
      question.subsectionLabel = pendingSubsection
      pendingSubsection = null
    }

    // Table check
    const isTable = i < lines.length && lines[i].startsWith('|')
    if (isTable) {
      question.type = 'table'
      question.tableHeaders = parseTableHeader(lines[i])
      i++
    }

    // Collect sub-parts — skip word bank / passage lines between question and sub-parts
    while (i < lines.length) {
      const subLine = lines[i]
      if (isSubPart(subLine)) {
        const { label, content } = parseSubPart(subLine)
        if (isTable) {
          const blankCols = Math.max(0, question.tableHeaders.length - 1)
          question.tableRows.push({ label, columns: [content, ...Array(blankCols).fill('')] })
        } else {
          question.subParts.push({ label, content })
        }
        i++
      } else if (
        !isQuestionStart(subLine) &&
        !/^[=\-*]{3,}/.test(subLine) &&
        !/^(?:I{1,3}|IV|V?I{0,3}|IX|X)[.)]\s+/i.test(subLine) &&
        !/^sub(?:ject)?[:\s]+/i.test(subLine)
      ) {
        i++ // skip word bank / instruction / passage lines
      } else {
        break
      }
    }

    result.questions.push(question)
  }

  return result
}

function isQuestionStart(line: string): boolean {
  if (/^q\d+[.):\s]/i.test(line)) return true
  if (/^\d+[.)]\s+\S/.test(line)) return true
  return false
}

function isSubPart(line: string): boolean {
  // Lowercase only — excludes uppercase Roman numeral headers like I. II.
  return /^[a-z]\s*[.)]/.test(line) || /^\([a-z]\)/.test(line)
}

function parseQuestion(line: string): Question {
  const matchQ = line.match(/^q(\d+)[.):\s]+(.+?)\s*(?:\((\d+)\))?\s*$/i)
  const matchN = line.match(/^(\d+)[.)]\s+(.+?)\s*(?:\((\d+)\))?\s*$/i)

  let number = 1, title = '', marks = 0

  if (matchQ) {
    number = parseInt(matchQ[1])
    title = matchQ[2].trim()
    marks = matchQ[3] ? parseInt(matchQ[3]) : 0
  } else if (matchN) {
    number = parseInt(matchN[1])
    title = matchN[2].trim()
    marks = matchN[3] ? parseInt(matchN[3]) : 0
  }

  return { number, title, marks, type: 'plain', subParts: [], tableHeaders: [], tableRows: [] }
}

function parseTableHeader(line: string): string[] {
  return line.split('|').map(h => h.trim()).filter(h => h.length > 0)
}

function parseSubPart(line: string): { label: string; content: string } {
  const matchParen = line.match(/^\(([a-z])\)\s*(.*)/i)
  if (matchParen) return { label: matchParen[1].toLowerCase(), content: matchParen[2].trim() }
  const match = line.match(/^([a-z])\s*[.)]\s*(.*)/i)
  if (!match) return { label: '', content: line }
  return { label: match[1].toLowerCase(), content: match[2].trim() }
}

export function stripContent(paper: ParsedPaper): ParsedPaper {
  return {
    ...paper,
    questions: paper.questions.map(q => ({
      ...q,
      subParts: q.subParts.map(sp => ({ ...sp, content: '' })),
      tableRows: q.tableRows.map(tr => ({ ...tr, columns: tr.columns.map(() => '') })),
    })),
  }
}
