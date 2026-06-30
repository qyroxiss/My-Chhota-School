'use client'
import { useActionState } from 'react'
import { addTeacher } from '@/app/actions/settings'

export default function AddTeacherForm({ schoolId }: { schoolId: string }) {
  const [state, action, pending] = useActionState(addTeacher, undefined)

  return (
    <form action={action} className="space-y-3 pt-2">
      <p className="text-sm font-medium text-gray-700">Add Teacher Account</p>
      <div className="grid grid-cols-2 gap-3">
        <input
          name="name"
          type="text"
          required
          placeholder="Full name"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <input
        name="password"
        type="password"
        required
        minLength={6}
        placeholder="Temporary password (min 6 chars)"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {state?.error && <p className="text-red-600 text-sm">{state.error}</p>}
      {state?.success && <p className="text-green-600 text-sm">{state.success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {pending ? 'Adding...' : 'Add Teacher'}
      </button>
    </form>
  )
}
