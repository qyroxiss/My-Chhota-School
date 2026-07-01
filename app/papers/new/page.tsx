import { redirect } from 'next/navigation'
import { getTemplates } from '@/lib/dal'
import PaperEditor from '@/components/PaperEditor'
import Link from 'next/link'

export default async function NewPaperPage(props: PageProps<'/papers/new'>) {
  const { templateId } = await props.searchParams as { templateId?: string }
  const templates = await getTemplates()

  if (templates.length === 0) redirect('/templates/new')

  const selectedTemplate = templateId
    ? templates.find(t => t.id === templateId)
    : templates[0]

  if (!selectedTemplate) redirect('/templates')

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
          <Link href="/papers" className="hover:text-slate-900 transition-colors">Papers</Link>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-slate-900 font-medium">New Paper</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">New Paper</h1>
        <p className="text-slate-500 mt-1 text-sm">Fill in the question content for this paper.</p>
      </div>

      {/* Template selector */}
      {templates.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Select Template</label>
          <div className="flex gap-2 flex-wrap">
            {templates.map(t => (
              <a
                key={t.id}
                href={`/papers/new?templateId=${t.id}`}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                  t.id === selectedTemplate.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:text-indigo-700'
                }`}
              >
                {t.name}
              </a>
            ))}
          </div>
        </div>
      )}

      <PaperEditor template={selectedTemplate} />
    </div>
  )
}
