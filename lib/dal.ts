import 'server-only'
import { cache } from 'react'
import { supabase } from './supabase'
import { verifySession } from './session'

export const getUser = cache(async () => {
  const session = await verifySession()
  const { data } = await supabase
    .from('User')
    .select('id, name, email, role, schoolId, School(id, name, address, logo)')
    .eq('id', session.userId)
    .single()
  if (!data) return null
  const { School, ...rest } = data as any
  return { ...rest, school: School }
})

export const getTemplates = cache(async () => {
  const session = await verifySession()
  const { data } = await supabase
    .from('Template')
    .select('*')
    .eq('schoolId', session.schoolId)
    .order('createdAt', { ascending: false })
  return data ?? []
})

export const getTemplate = cache(async (id: string) => {
  const session = await verifySession()
  const { data } = await supabase
    .from('Template')
    .select('*')
    .eq('id', id)
    .eq('schoolId', session.schoolId)
    .single()
  return data
})

export const getPapers = cache(async () => {
  const session = await verifySession()
  const { data } = await supabase
    .from('Paper')
    .select('*, Template(name, class, subject, maxMarks, duration), User(name)')
    .eq('schoolId', session.schoolId)
    .order('createdAt', { ascending: false })
  return (data ?? []).map((p: any) => ({
    ...p,
    template: p.Template,
    createdBy: p.User ? { name: p.User.name } : null,
  }))
})

export const getPaper = cache(async (id: string) => {
  const session = await verifySession()
  const { data } = await supabase
    .from('Paper')
    .select('*, Template(*), School(*)')
    .eq('id', id)
    .eq('schoolId', session.schoolId)
    .single()
  if (!data) return null
  const { Template, School, ...rest } = data as any
  return { ...rest, template: Template, school: School }
})

export const getTeachers = cache(async () => {
  const session = await verifySession()
  const { data } = await supabase
    .from('User')
    .select('id, name, email, role, createdAt')
    .eq('schoolId', session.schoolId)
    .order('createdAt', { ascending: false })
  return data ?? []
})
