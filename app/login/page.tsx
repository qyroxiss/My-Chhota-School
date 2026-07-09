'use client'
import { useActionState } from 'react'
import { login } from '@/app/actions/auth'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-4 relative overflow-hidden">
      {/* ambient glows */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 rounded-full bg-violet-600/20 blur-3xl" />

      <div className="w-full max-w-sm relative">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 mb-4 shadow-xl shadow-indigo-600/40">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Question Paper Generator</h1>
          <p className="text-slate-400 mt-1 text-sm">Sign in to your school account</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 shadow-2xl">
          <form action={action} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full px-3.5 py-2.5 bg-white/10 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="admin@school.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 bg-white/10 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            {state?.error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3.5 py-2.5 rounded-lg">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 text-white py-2.5 px-4 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/30 mt-2"
            >
              {pending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">My Chhota School · Kanpur</p>
      </div>
    </div>
  )
}
