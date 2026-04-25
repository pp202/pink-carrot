'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { IoCreateOutline } from 'react-icons/io5'

type Dashboard = {
  id: number
  name: string
}

const DashboardsClient = () => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/dashboards', { cache: 'no-cache' })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Unable to load dashboards.')
        }

        return response.json() as Promise<Dashboard[]>
      })
      .then((items) => setDashboards(items))
      .catch((loadError) => {
        const message = loadError instanceof Error ? loadError.message : 'Unable to load dashboards.'
        setError(message)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const createDashboard = async () => {
    if (isCreating) {
      return
    }

    const name = window.prompt('Dashboard name', `Dashboard ${dashboards.length + 1}`)
    if (!name?.trim()) {
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        throw new Error('Unable to create dashboard.')
      }

      const created = await response.json() as Dashboard
      setDashboards((previous) => [...previous, created])
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : 'Unable to create dashboard.'
      setError(message)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <section className="min-h-[calc(100vh-5rem)] bg-zinc-950">
      <div className="container mx-auto flex min-h-[calc(100vh-5rem)] items-stretch justify-center px-6 py-12">
        <div className="w-full max-w-2xl rounded-2xl border border-zinc-600/30 bg-zinc-800 px-8 py-10 shadow-2xl shadow-black/40 md:px-10 md:py-12">
          <header className="mb-8 w-full text-center">
            <h1 className="text-2xl font-semibold text-zinc-100">Dashboards</h1>
          </header>

          {error && (
            <p className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </p>
          )}

          {isLoading ? (
            <p className="rounded-xl border border-zinc-700 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-300">Loading dashboards…</p>
          ) : (
            <div className="space-y-3">
              {dashboards.map((dashboard) => (
                <div
                  key={dashboard.id}
                  className="rounded-xl border border-zinc-700 bg-zinc-900/70 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="min-w-0 flex-1 truncate text-zinc-100">{dashboard.name}</span>
                    <Link
                      href={`/dashboards/${dashboard.id}/edit`}
                      className="rounded-md p-1 text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
                      aria-label={`Edit ${dashboard.name}`}
                    >
                      <IoCreateOutline size={18} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              className="rounded-lg border border-zinc-300 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isCreating}
              onClick={() => void createDashboard()}
            >
              {isCreating ? 'Creating…' : 'Create dashboard'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DashboardsClient
