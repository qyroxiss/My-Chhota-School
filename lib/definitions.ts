export type SessionPayload = {
  userId: string
  role: string
  schoolId: string
  expiresAt: Date
}

export type SubPart = {
  label: string
  content: string
}

export type TableRow = {
  label: string
  columns: string[]
}

export type Question = {
  number: number
  title: string
  marks: number
  type: 'plain' | 'table'
  subParts: SubPart[]
  tableHeaders: string[]
  tableRows: TableRow[]
}

export type ParsedPaper = {
  class: string
  subject: string
  maxMarks: number
  duration: string
  questions: Question[]
}
