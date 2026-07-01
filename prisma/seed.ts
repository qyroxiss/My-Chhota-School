import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  const school = await prisma.school.upsert({
    where: { id: 'seed-school-1' },
    update: {},
    create: { id: 'seed-school-1', name: 'Demo School' },
  })

  const hashed = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@school.com' },
    update: {},
    create: {
      name: 'School Admin',
      email: 'admin@school.com',
      password: hashed,
      role: 'ADMIN',
      schoolId: school.id,
    },
  })

  console.log('Seed complete.')
  console.log('Login: admin@school.com / admin123')
}

main().catch(console.error).finally(() => prisma.$disconnect())
