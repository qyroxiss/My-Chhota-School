import Link from 'next/link'

type Crumb = { label: string; href?: string }

export default function PageHeader({
  title,
  subtitle,
  crumbs,
  action,
}: {
  title: string
  subtitle?: string
  crumbs?: Crumb[]
  action?: React.ReactNode
}) {
  return (
    <div className="mb-8">
      {crumbs && crumbs.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-2">
              {c.href ? (
                <Link href={c.href} className="hover:text-slate-900 transition-colors">{c.label}</Link>
              ) : (
                <span className="text-slate-900 font-medium">{c.label}</span>
              )}
              {i < crumbs.length - 1 && (
                <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="text-slate-500 mt-1 text-sm">{subtitle}</p>}
        </div>
        {action}
      </div>
    </div>
  )
}
