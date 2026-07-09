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
  let pendingSubsectionIntro: string | null = null

  // Parse header lines — stop at the first question
  while (i < lines.length && !isQuestionStart(lines[i])) {
    const line = lines[i]

    if (/^[=\-*]{3,}/.test(line)) { i++; continue }

    // Roman numeral subsection headers before the first question (first section)
    if (/^(?:I{1,3}|IV|V?I{0,3}|IX|X)[.)]\s+/i.test(line)) {
      pendingSubsection = line
      pendingSubsectionIntro = null
      i++; continue
    }

    // After a subsection header, capture passage / instruction text (e.g. reading comprehension)
    if (pendingSubsection && !isHeaderMeta(line)) {
      pendingSubsectionIntro = pendingSubsectionIntro ? `${pendingSubsectionIntro} ${line}` : line
      i++; continue
    }

    const classMatch = line.match(/^class[:\s-]+(.+)/i)
    const subMatch = line.match(/^sub(?:ject)?[:\s]+(.+)/i)
    const mm = extractMarks(line)
    const dur = extractDuration(line)

    if (classMatch && !result.class) result.class = cleanSubjectName(classMatch[1])
    else if (subMatch && !result.subject) result.subject = cleanSubjectName(subMatch[1])
    if (mm !== null && !result.maxMarks) result.maxMarks = mm
    if (dur && !result.duration) result.duration = dur
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
      pendingSubsectionIntro = null
      i++; continue
    }

    // Detect new SUBJECT: line (multi-subject papers)
    const subjectMatch = line.match(/^sub(?:ject)?[:\s]+(.+)/i)
    if (subjectMatch) {
      const full = subjectMatch[1]
      pendingSection = {
        subject: cleanSubjectName(full),
        maxMarks: extractMarks(full) ?? 0,
        duration: extractDuration(full) ?? '',
      }
      i++; continue
    }

    // When a pending section is open, absorb its marks/duration lines before any questions
    if (pendingSection && !isQuestionStart(line)) {
      const mm = extractMarks(line)
      const dur = extractDuration(line)
      if (mm !== null || dur !== null) {
        if (mm !== null) pendingSection.maxMarks = mm
        if (dur !== null) pendingSection.duration = dur
        i++; continue
      }
      // otherwise fall through — it is passage / instruction text
    }

    // After a subsection header, capture passage / instruction text before the first question
    if (pendingSubsection && !isQuestionStart(line)) {
      pendingSubsectionIntro = pendingSubsectionIntro ? `${pendingSubsectionIntro} ${line}` : line
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
    if (pendingSubsectionIntro) {
      question.subsectionIntro = pendingSubsectionIntro
      pendingSubsectionIntro = null
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
        // Word bank / instruction line between a question and its sub-parts — keep it
        if (question.subParts.length === 0 && question.tableRows.length === 0) {
          question.intro = question.intro ? `${question.intro} ${subLine}` : subLine
        }
        i++
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
  // Marks may be integer or decimal (e.g. "(2)" or "(2.5)")
  const matchQ = line.match(/^q(\d+)[.):\s]+(.+?)\s*(?:\((\d+(?:\.\d+)?)\s*(?:marks?)?\))?\s*$/i)
  const matchN = line.match(/^(\d+)[.)]\s+(.+?)\s*(?:\((\d+(?:\.\d+)?)\s*(?:marks?)?\))?\s*$/i)

  let number = 1, title = '', marks = 0

  if (matchQ) {
    number = parseInt(matchQ[1])
    title = matchQ[2].trim()
    marks = matchQ[3] ? parseFloat(matchQ[3]) : 0
  } else if (matchN) {
    number = parseInt(matchN[1])
    title = matchN[2].trim()
    marks = matchN[3] ? parseFloat(matchN[3]) : 0
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

// Extract a max-marks value ("Total Marks: 20", "Max Marks: 20", "MM: 20", "M.M.: 20").
// Keyword may be at line start, after a pipe, or after the subject name (a space).
function extractMarks(s: string): number | null {
  const m = s.match(/(?:^|[|\s])(?:total\s*marks?|max\.?\s*marks?|m\.?\s*m\.?)\s*[:\-]?\s*(\d+)/i)
  return m ? parseInt(m[1]) : null
}

// Extract a duration value ("Time: 1 Hour", "Duration: 30 Minutes"), stopping at a pipe/end.
function extractDuration(s: string): string | null {
  const m = s.match(/(?:^|[|\s])(?:time|duration)\s*[:\-]?\s*(.+?)(?:\s*\||$)/i)
  return m ? m[1].trim() : null
}

function isHeaderMeta(line: string): boolean {
  return (
    /^class[:\s-]/i.test(line) ||
    /^sub(?:ject)?[:\s]/i.test(line) ||
    /(?:^|\|)\s*(?:mm|max\.?\s*marks?|total\s*marks?)[:\s]/i.test(line) ||
    /(?:^|\|)\s*(?:time|duration)[:\s]/i.test(line) ||
    /^[=\-*]{3,}/.test(line)
  )
}

function cleanSubjectName(raw: string): string {
  return raw
    .replace(/\s*\|.*$/, '')                       // strip " | Time: ..." suffix
    .replace(/\s+total\s*marks?\s*:.*$/i, '')      // strip "Total Marks: ..."
    .replace(/\s+max\.?\s*marks?\s*:.*$/i, '')     // strip "Max Marks: ..."
    .replace(/\s+mm\s*:.*$/i, '')                  // strip "MM: ..."
    .replace(/\s+time\s*:.*$/i, '')                // strip "Time: ..."
    .replace(/\s+duration\s*:.*$/i, '')            // strip "Duration: ..."
    .trim()
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
