'use client'
import { useTransition } from 'react'
import { deleteTemplate } from '@/app/actions/templates'

export default function DeleteTemplateButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm('Delete this template?')) return
    startTransition(() => deleteTemplate(id))
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="text-sm text-red-500 hover:text-red-700 disabled:opacity-40 transition-colors"
    >
      {pending ? 'Deleting…' : 'Delete'}
    </button>
  )
}
