import { redirect } from 'next/navigation'
import { getTemplates } from '@/lib/dal'
import PaperEditor from '@/components/PaperEditor'

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
        <h1 className="text-2xl font-bold text-gray-900">New Paper</h1>
        <p className="text-gray-500 mt-1">Fill in the question content for this paper.</p>
      </div>

      {/* Template selector */}
      {templates.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Template</label>
          <div className="flex gap-2 flex-wrap">
            {templates.map(t => (
              <a
                key={t.id}
                href={`/papers/new?templateId=${t.id}`}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  t.id === selectedTemplate.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
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
