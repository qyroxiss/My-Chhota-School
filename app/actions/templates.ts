'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase'
import { verifySession } from '@/lib/session'
import { parsePaper } from '@/lib/parser'
import type { ParsedPaper } from '@/lib/definitions'

export async function createTemplate(state: { error?: string } | undefined, formData: FormData) {
  const session = await verifySession()

  const name = formData.get('name') as string
  const rawText = formData.get('rawText') as string

  if (!name || !rawText) return { error: 'Name and text content are required.' }

  const parsed: ParsedPaper = parsePaper(rawText)
  const structure = parsed

  await supabase.from('Template').insert({
    id: crypto.randomUUID(),
    name,
    class: parsed.class || 'N/A',
    subject: parsed.subject || 'N/A',
    maxMarks: parsed.maxMarks || 0,
    duration: parsed.duration || null,
    schoolId: session.schoolId,
    structure: JSON.stringify(structure),
  })

  revalidatePath('/', 'layout')
  redirect('/templates')
}

export async function deleteTemplate(id: string) {
  const session = await verifySession()
  await supabase.from('Template').delete().eq('id', id).eq('schoolId', session.schoolId)
  revalidatePath('/', 'layout')
  redirect('/templates')
}
