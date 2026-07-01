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

  // Parse header lines — stop at the first question
  while (i < lines.length && !isQuestionStart(lines[i])) {
    const line = lines[i]

    // Skip visual separator lines like ===, ---, ***
    if (/^[=\-*]{3,}/.test(line)) { i++; continue }

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
  while (i < lines.length) {
    const line = lines[i]

    // Skip separator lines and section headers (Roman numerals: I. II. III.)
    if (/^[=\-*]{3,}/.test(line) || /^(?:I{1,3}|IV|V?I{0,3}|IX|X)[.)]\s+/i.test(line)) {
      i++; continue
    }

    if (!isQuestionStart(line)) { i++; continue }

    const question = parseQuestion(line)
    i++

    // Check for table header (pipe-separated)
    const isTable = i < lines.length && lines[i].startsWith('|')
    if (isTable) {
      question.type = 'table'
      question.tableHeaders = parseTableHeader(lines[i])
      i++
    }

    // Collect sub-parts — skip word bank / passage lines that appear between
    // the question stem and its lettered sub-parts (e.g. "(play, is, drinking, reading)")
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
        !/^(?:I{1,3}|IV|V?I{0,3}|IX|X)[.)]\s+/i.test(subLine)
      ) {
        i++ // skip instruction / word bank line
      } else {
        break
      }
    }

    result.questions.push(question)
  }

  return result
}

function isQuestionStart(line: string): boolean {
  // Q1) Q1. Q1: (existing format)
  if (/^q\d+[.):\s]/i.test(line)) return true
  // 1. or 1) followed by text (plain numbered questions)
  // Exclude Roman numerals by checking it's a digit
  if (/^\d+[.)]\s+\S/.test(line)) return true
  return false
}

function isSubPart(line: string): boolean {
  // lowercase only: a) a. or (a) style — uppercase excluded to avoid matching Roman numeral headers like I. II.
  return /^[a-z]\s*[.)]/.test(line) || /^\([a-z]\)/.test(line)
}

function parseQuestion(line: string): Question {
  // Q1) Title (5)  or  Q2) Title: 5  or  Q1. Title
  const matchQ = line.match(/^q(\d+)[.):\s]+(.+?)\s*(?:\((\d+)\))?\s*$/i)
  // 1. Title (5)  or  1) Title
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
  // (a) content style
  const matchParen = line.match(/^\(([a-z])\)\s*(.*)/i)
  if (matchParen) return { label: matchParen[1].toLowerCase(), content: matchParen[2].trim() }
  // a) or a. style
  const match = line.match(/^([a-z])\s*[.)]\s*(.*)/i)
  if (!match) return { label: '', content: line }
  return { label: match[1].toLowerCase(), content: match[2].trim() }
}

// Strip content from a parsed paper to create a blank template structure
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
