import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const schoolId = 'seed-school-1'

  const { error: schoolError } = await supabase.from('School').upsert(
    { id: schoolId, name: 'Demo School' },
    { onConflict: 'id' }
  )
  if (schoolError) { console.error('School error:', schoolError); process.exit(1) }

  const hashed = await bcrypt.hash('admin123', 10)
  const { error: userError } = await supabase.from('User').upsert(
    { id: 'seed-admin-1', name: 'School Admin', email: 'admin@school.com', password: hashed, role: 'ADMIN', schoolId },
    { onConflict: 'email' }
  )
  if (userError) { console.error('User error:', userError); process.exit(1) }

  console.log('Seed complete. Login: admin@school.com / admin123')
}

main().catch(console.error)
