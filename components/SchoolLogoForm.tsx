'use client'
import { useActionState } from 'react'
import { updateSchoolProfile } from '@/app/actions/settings'

type Props = {
  currentName: string
  currentAddress: string | null
  currentLogo: string | null
}

export default function SchoolProfileForm({ currentName, currentAddress, currentLogo }: Props) {
  const [state, action, pending] = useActionState(updateSchoolProfile, undefined)

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
        <input
          name="name"
          type="text"
          required
          defaultValue={currentName}
          placeholder="e.g. Delhi Public School"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">School Address</label>
        <input
          name="address"
          type="text"
          defaultValue={currentAddress ?? ''}
          placeholder="e.g. Sector 14, Rohini, New Delhi — 110085"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-400 mt-1">Appears on the printed paper header below the school name.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (optional)</label>
        <div className="flex items-center gap-3">
          {currentLogo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentLogo} alt="Logo" className="h-12 w-12 object-contain rounded border border-gray-200 shrink-0" />
          )}
          <input
            name="logoUrl"
            type="url"
            defaultValue={currentLogo ?? ''}
            placeholder="https://your-school.com/logo.png"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">Paste a public image URL. The logo prints at the top of every paper.</p>
      </div>

      {state?.error && <p className="text-red-600 text-sm">{state.error}</p>}
      {state?.success && <p className="text-green-600 text-sm">{state.success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {pending ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  )
}
