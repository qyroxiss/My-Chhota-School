'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase'
import { verifySession } from '@/lib/session'

export async function createPaper(state: { error?: string } | undefined, formData: FormData) {
  const session = await verifySession()

  const templateId = formData.get('templateId') as string
  const date = formData.get('date') as string
  const contentJson = formData.get('content') as string

  if (!templateId || !contentJson) return { error: 'Missing required fields.' }

  const { data: template } = await supabase
    .from('Template')
    .select('id')
    .eq('id', templateId)
    .eq('schoolId', session.schoolId)
    .single()
  if (!template) return { error: 'Template not found.' }

  const paperId = crypto.randomUUID()
  await supabase.from('Paper').insert({
    id: paperId,
    templateId,
    schoolId: session.schoolId,
    createdById: session.userId,
    date: date || null,
    content: contentJson,
  })

  revalidatePath('/papers')
  redirect(`/papers/${paperId}/preview`)
}

export async function deletePaper(id: string) {
  const session = await verifySession()
  await supabase.from('Paper').delete().eq('id', id).eq('schoolId', session.schoolId)
  revalidatePath('/papers')
}
