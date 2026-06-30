import Link from 'next/link'
import { getTemplates } from '@/lib/dal'
import { deleteTemplate } from '@/app/actions/templates'

export default async function TemplatesPage() {
  const templates = await getTemplates()

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-500 mt-1">{templates.length}/5 templates used</p>
        </div>
        {templates.length < 5 && (
          <Link
            href="/templates/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + New Template
          </Link>
        )}
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 max-w-lg">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-600 font-medium">No templates yet</p>
          <p className="text-gray-400 text-sm mt-1">Paste an existing question paper to create your first template.</p>
          <Link href="/templates/new" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            Create Template
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 max-w-2xl">
          {templates.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">{t.name}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {t.class} · {t.subject} · {t.maxMarks} marks
                  {t.duration && ` · ${t.duration}`}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link href={`/papers/new?templateId=${t.id}`} className="text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors font-medium">
                  Use
                </Link>
                <form action={deleteTemplate.bind(null, t.id)}>
                  <button type="submit" className="text-sm text-red-500 hover:text-red-700 transition-colors">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
