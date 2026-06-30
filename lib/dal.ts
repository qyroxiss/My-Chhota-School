import 'server-only'
import { cache } from 'react'
import { prisma } from './prisma'
import { verifySession } from './session'

export const getUser = cache(async () => {
  const session = await verifySession()
  return prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true, schoolId: true, school: { select: { id: true, name: true, address: true, logo: true } } },
  })
})

export const getTemplates = cache(async () => {
  const session = await verifySession()
  return prisma.template.findMany({
    where: { schoolId: session.schoolId },
    orderBy: { createdAt: 'desc' },
  })
})

export const getTemplate = cache(async (id: string) => {
  const session = await verifySession()
  return prisma.template.findFirst({
    where: { id, schoolId: session.schoolId },
  })
})

export const getPapers = cache(async () => {
  const session = await verifySession()
  return prisma.paper.findMany({
    where: { schoolId: session.schoolId },
    include: { template: true, createdBy: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
})

export const getPaper = cache(async (id: string) => {
  const session = await verifySession()
  return prisma.paper.findFirst({
    where: { id, schoolId: session.schoolId },
    include: { template: true, school: true },
  })
})

export const getTeachers = cache(async () => {
  const session = await verifySession()
  return prisma.user.findMany({
    where: { schoolId: session.schoolId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
})
