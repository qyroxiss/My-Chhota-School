import { getUser, getTeachers } from '@/lib/dal'
import { redirect } from 'next/navigation'
import AddTeacherForm from '@/components/AddTeacherForm'
import SchoolProfileForm from '@/components/SchoolLogoForm'
import PageHeader from '@/components/PageHeader'

export default async function SettingsPage() {
  const user = await getUser()
  if (user?.role !== 'ADMIN') redirect('/dashboard')

  const teachers = await getTeachers()

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      <PageHeader title="Settings" subtitle="Manage your school profile and team." />

      {/* School Profile */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 mb-5 shadow-sm">
        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">School Profile</h2>
            <p className="text-xs text-slate-500">Shown on every printed paper.</p>
          </div>
        </div>
        <SchoolProfileForm
          currentName={user?.school.name ?? ''}
          currentAddress={user?.school.address ?? null}
          currentLogo={user?.school.logo ?? null}
        />
      </section>

      {/* Team */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Team Members</h2>
            <p className="text-xs text-slate-500">{teachers.length} member{teachers.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          {teachers.map(t => (
            <div key={t.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold shrink-0">
                  {t.name[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.email}</p>
                </div>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                t.role === 'ADMIN'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {t.role.toLowerCase()}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 pt-5">
          <p className="text-sm font-semibold text-slate-900 mb-3">Add Team Member</p>
          <AddTeacherForm schoolId={user?.schoolId ?? ''} />
        </div>
      </section>
    </div>
  )
}
