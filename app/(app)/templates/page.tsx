import Link from 'next/link'
import { getTemplates } from '@/lib/dal'
import DeleteTemplateButton from '@/components/DeleteTemplateButton'
import PageHeader from '@/components/PageHeader'

const AVATAR_TINTS = [
  'from-indigo-500 to-violet-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-sky-500 to-blue-600',
  'from-rose-500 to-pink-600',
  'from-fuchsia-500 to-purple-600',
]

export default async function TemplatesPage() {
  const templates = await getTemplates()

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Templates"
        subtitle={templates.length === 0 ? 'No templates yet' : `${templates.length} template${templates.length !== 1 ? 's' : ''}`}
        action={
          <Link href="/templates/new" className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-indigo-600/20 shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Template
          </Link>
        }
      />

      {templates.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t, i) => (
            <div key={t.id} className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col">
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${AVATAR_TINTS[i % AVATAR_TINTS.length]} flex items-center justify-center text-white font-bold shrink-0 shadow-sm`}>
                  {t.subject?.[0]?.toUpperCase() ?? 'T'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate text-sm leading-tight">{t.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{t.subject} · Class {t.class}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                <Tag>{t.maxMarks} marks</Tag>
                {t.duration && <Tag>{t.duration}</Tag>}
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-slate-100 mt-auto">
                <Link href={`/papers/new?templateId=${t.id}`} className="flex-1 text-center bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors">
                  Use Template
                </Link>
                <DeleteTemplateButton id={t.id} name={t.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">{children}</span>
}

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-20 text-center">
      <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg className="w-7 h-7 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 className="font-semibold text-slate-900 mb-1">No templates yet</h3>
      <p className="text-slate-500 text-sm mb-5 max-w-sm mx-auto">Generate one with AI from a chapter, or paste an existing question paper.</p>
      <Link href="/templates/new" className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:brightness-110 transition-all shadow-sm shadow-indigo-600/20">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Create Template
      </Link>
    </div>
  )
}
