'use server'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'
import { createSession, deleteSession } from '@/lib/session'

export async function login(state: { error?: string } | undefined, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) return { error: 'Email and password are required.' }

  const { data: user } = await supabase
    .from('User')
    .select('id, email, password, role, schoolId')
    .eq('email', email)
    .single()

  if (!user) return { error: 'Invalid email or password.' }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return { error: 'Invalid email or password.' }

  await createSession(user.id, user.role, user.schoolId)
  redirect('/dashboard')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
