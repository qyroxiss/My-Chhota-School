import { getUser, getTeachers } from '@/lib/dal'
import { redirect } from 'next/navigation'
import AddTeacherForm from '@/components/AddTeacherForm'
import SchoolProfileForm from '@/components/SchoolLogoForm'

export default async function SettingsPage() {
  const user = await getUser()
  if (user?.role !== 'ADMIN') redirect('/dashboard')

  const teachers = await getTeachers()

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">School Profile</h2>
        <SchoolProfileForm
          currentName={user?.school.name ?? ''}
          currentAddress={user?.school.address ?? null}
          currentLogo={user?.school.logo ?? null}
        />
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Team Members</h2>
        <div className="space-y-2 mb-6">
          {teachers.map(t => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-500">{t.email}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                t.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {t.role.toLowerCase()}
              </span>
            </div>
          ))}
        </div>
        <AddTeacherForm schoolId={user?.schoolId ?? ''} />
      </section>
    </div>
  )
}
