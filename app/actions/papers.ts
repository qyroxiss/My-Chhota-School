'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/session'

export async function createPaper(state: { error?: string } | undefined, formData: FormData) {
  const session = await verifySession()

  const templateId = formData.get('templateId') as string
  const date = formData.get('date') as string
  const contentJson = formData.get('content') as string

  if (!templateId || !contentJson) return { error: 'Missing required fields.' }

  const template = await prisma.template.findFirst({ where: { id: templateId, schoolId: session.schoolId } })
  if (!template) return { error: 'Template not found.' }

  const paper = await prisma.paper.create({
    data: {
      templateId,
      schoolId: session.schoolId,
      createdById: session.userId,
      date: date || null,
      content: contentJson,
    },
  })

  revalidatePath('/papers')
  redirect(`/papers/${paper.id}/preview`)
}

export async function deletePaper(id: string) {
  const session = await verifySession()
  await prisma.paper.deleteMany({ where: { id, schoolId: session.schoolId } })
  revalidatePath('/papers')
}
