import Link from 'next/link'
import { getPapers, getTemplates } from '@/lib/dal'
import { deletePaper } from '@/app/actions/papers'

export default async function PapersPage() {
  const [papers, templates] = await Promise.all([getPapers(), getTemplates()])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Papers</h1>
          <p className="text-gray-500 mt-1">{papers.length} paper{papers.length !== 1 ? 's' : ''} generated</p>
        </div>
        {templates.length > 0 && (
          <Link href="/papers/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            + New Paper
          </Link>
        )}
      </div>

      {papers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 max-w-lg">
          <div className="text-4xl mb-3">📄</div>
          <p className="text-gray-600 font-medium">No papers yet</p>
          <p className="text-gray-400 text-sm mt-1">
            {templates.length === 0
              ? 'Create a template first, then generate papers from it.'
              : 'Choose a template and fill in the content to generate a paper.'}
          </p>
          <Link
            href={templates.length === 0 ? '/templates/new' : '/papers/new'}
            className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {templates.length === 0 ? 'Create Template' : 'New Paper'}
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden max-w-3xl">
          {papers.map((paper, i) => (
            <div key={paper.id} className={`flex items-center justify-between px-5 py-4 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
              <div>
                <div className="font-medium text-gray-900">{paper.template?.subject} — {paper.template?.class}</div>
                <div className="text-sm text-gray-500 mt-0.5">
                  {paper.template?.maxMarks} marks · By {paper.createdBy?.name}
                  {paper.date && ` · ${paper.date}`}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Link href={`/papers/${paper.id}/preview`} className="text-sm text-blue-600 hover:underline font-medium">
                  View / Print
                </Link>
                <form action={deletePaper.bind(null, paper.id)}>
                  <button type="submit" className="text-sm text-red-500 hover:text-red-700">Delete</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
