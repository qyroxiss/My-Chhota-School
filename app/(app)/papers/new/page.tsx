import { redirect } from 'next/navigation'
import { getTemplates } from '@/lib/dal'
import PaperEditor from '@/components/PaperEditor'
import PageHeader from '@/components/PageHeader'

export default async function NewPaperPage(props: PageProps<'/papers/new'>) {
  const { templateId } = await props.searchParams as { templateId?: string }
  const templates = await getTemplates()

  if (templates.length === 0) redirect('/templates/new')

  const selectedTemplate = templateId
    ? templates.find(t => t.id === templateId)
    : templates[0]

  if (!selectedTemplate) redirect('/templates')

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto">
      <PageHeader
        title="New Paper"
        subtitle="Fill in the question content for this paper."
        crumbs={[{ label: 'Papers', href: '/papers' }, { label: 'New Paper' }]}
      />

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
