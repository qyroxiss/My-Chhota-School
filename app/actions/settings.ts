'use server'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'
import { verifySession } from '@/lib/session'

export async function addTeacher(state: { error?: string; success?: string } | undefined, formData: FormData) {
  const session = await verifySession()
  if (session.role !== 'ADMIN') return { error: 'Unauthorized.' }

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!name || !email || !password) return { error: 'All fields are required.' }

  const { data: exists } = await supabase.from('User').select('id').eq('email', email).single()
  if (exists) return { error: 'A user with this email already exists.' }

  const hashed = await bcrypt.hash(password, 10)
  await supabase.from('User').insert({
    id: crypto.randomUUID(),
    name,
    email,
    password: hashed,
    role: 'TEACHER',
    schoolId: session.schoolId,
  })

  revalidatePath('/settings')
  return { success: 'Teacher added successfully.' }
}

export async function updateSchoolProfile(state: { error?: string; success?: string } | undefined, formData: FormData) {
  const session = await verifySession()
  if (session.role !== 'ADMIN') return { error: 'Unauthorized.' }

  const name = formData.get('name') as string
  const address = formData.get('address') as string
  const logoUrl = formData.get('logoUrl') as string

  if (!name?.trim()) return { error: 'School name is required.' }

  await supabase.from('School').update({
    name: name.trim(),
    address: address?.trim() || null,
    logo: logoUrl?.trim() || null,
  }).eq('id', session.schoolId)

  revalidatePath('/settings')
  revalidatePath('/papers')
  return { success: 'School profile updated.' }
}
