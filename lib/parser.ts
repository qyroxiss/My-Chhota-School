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

  // Parse header lines (Class, Sub, MM, Time)
  while (i < lines.length && !isQuestionStart(lines[i])) {
    const line = lines[i]
    const classMatch = line.match(/^class[:\s-]+(.+)/i)
    const subMatch = line.match(/^sub(?:ject)?[:\s]+(.+)/i)
    const mmMatch = line.match(/^(?:mm|max\.?\s*marks?|total\s*marks?)[:\s]+(\d+)/i)
    const timeMatch = line.match(/^(?:time|duration)[:\s]+(.+)/i)

    if (classMatch) result.class = classMatch[1].trim()
    else if (subMatch) result.subject = subMatch[1].trim()
    else if (mmMatch) result.maxMarks = parseInt(mmMatch[1])
    else if (timeMatch) result.duration = timeMatch[1].trim()
    i++
  }

  // Parse question blocks
  while (i < lines.length) {
    const line = lines[i]
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

    // Collect sub-parts
    while (i < lines.length && isSubPart(lines[i])) {
      const subLine = lines[i]
      const { label, content } = parseSubPart(subLine)

      if (isTable) {
        const blankCols = Math.max(0, question.tableHeaders.length - 1)
        question.tableRows.push({ label, columns: [content, ...Array(blankCols).fill('')] })
      } else {
        question.subParts.push({ label, content })
      }
      i++
    }

    result.questions.push(question)
  }

  return result
}

function isQuestionStart(line: string): boolean {
  return /^q\d+[.)]/i.test(line)
}

function isSubPart(line: string): boolean {
  return /^[a-z]\s*[.)]/i.test(line)
}

function parseQuestion(line: string): Question {
  // Match: Q1) Title (5)  or  Q2) Title: 5
  const matchParen = line.match(/^q(\d+)[.)]\s*(.+?)\s*\((\d+)\)\s*$/i)
  const matchColon = line.match(/^q(\d+)[.)]\s*(.+?)[:\s]+(\d+)\s*$/i)
  const matchPlain = line.match(/^q(\d+)[.)]\s*(.+)/i)

  let number = 1, title = '', marks = 0

  if (matchParen) {
    number = parseInt(matchParen[1])
    title = matchParen[2].trim()
    marks = parseInt(matchParen[3])
  } else if (matchColon) {
    number = parseInt(matchColon[1])
    title = matchColon[2].trim()
    marks = parseInt(matchColon[3])
  } else if (matchPlain) {
    number = parseInt(matchPlain[1])
    title = matchPlain[2].trim()
  }

  return { number, title, marks, type: 'plain', subParts: [], tableHeaders: [], tableRows: [] }
}

function parseTableHeader(line: string): string[] {
  return line.split('|').map(h => h.trim()).filter(h => h.length > 0)
}

function parseSubPart(line: string): { label: string; content: string } {
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
