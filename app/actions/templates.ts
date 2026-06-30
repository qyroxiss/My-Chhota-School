'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/session'
import { parsePaper } from '@/lib/parser'
import type { ParsedPaper } from '@/lib/definitions'

export async function createTemplate(state: { error?: string } | undefined, formData: FormData) {
  const session = await verifySession()

  const count = await prisma.template.count({ where: { schoolId: session.schoolId } })
  if (count >= 5) return { error: 'Maximum of 5 templates allowed per school.' }

  const name = formData.get('name') as string
  const rawText = formData.get('rawText') as string

  if (!name || !rawText) return { error: 'Name and text content are required.' }

  const parsed: ParsedPaper = parsePaper(rawText)
  const structure = parsed

  await prisma.template.create({
    data: {
      name,
      class: parsed.class || 'N/A',
      subject: parsed.subject || 'N/A',
      maxMarks: parsed.maxMarks || 0,
      duration: parsed.duration || null,
      schoolId: session.schoolId,
      structure: JSON.stringify(structure),
    },
  })

  revalidatePath('/templates')
  redirect('/templates')
}

export async function deleteTemplate(id: string) {
  const session = await verifySession()
  await prisma.template.deleteMany({ where: { id, schoolId: session.schoolId } })
  revalidatePath('/templates')
}
