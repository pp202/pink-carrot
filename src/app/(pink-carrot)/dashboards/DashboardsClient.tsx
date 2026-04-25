'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { IoCreateOutline } from 'react-icons/io5'

type Dashboard = {
  id: number
  name: string
}

const DASHBOARDS_UPDATED_EVENT = 'pink-carrot:dashboards-updated'

const DashboardsClient = () => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null)
  const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null)

  const broadcastDashboards = (items: Dashboard[]) => {
    if (typeof window === 'undefined') {
      return
    }

    window.dispatchEvent(
      new CustomEvent<{ dashboards: Dashboard[] }>(DASHBOARDS_UPDATED_EVENT, {
        detail: { dashboards: items },
      }),
    )
  }

  useEffect(() => {
    fetch('/api/dashboards', { cache: 'no-cache' })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Unable to load dashboards.')
        }

        return response.json() as Promise<Dashboard[]>
      })
      .then((items) => {
        setDashboards(items)
        broadcastDashboards(items)
      })
      .catch((loadError) => {
        const message = loadError instanceof Error ? loadError.message : 'Unable to load dashboards.'
        setError(message)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const createDashboard = async () => {
    if (isCreating || !nameDraft.trim()) {
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameDraft.trim() }),
      })

      if (!response.ok) {
        throw new Error('Unable to create dashboard.')
      }

      const created = await response.json() as Dashboard
      setDashboards((previous) => {
        const next = [...previous, created]
        broadcastDashboards(next)
        return next
      })
      setIsCreateDialogOpen(false)
      setNameDraft('')
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : 'Unable to create dashboard.'
      setError(message)
    } finally {
      setIsCreating(false)
    }
  }

  const clearDragPreview = () => {
    setDragSourceIndex(null)
    setDragTargetIndex(null)
  }

  const reorderDashboards = async (sourceIndex: number, targetIndex: number) => {
    if (sourceIndex === targetIndex || targetIndex < 0 || targetIndex >= dashboards.length) {
      return
    }

    const previous = [...dashboards]
    const next = [...dashboards]
    const [dragged] = next.splice(sourceIndex, 1)

    if (!dragged) {
      return
    }

    next.splice(targetIndex, 0, dragged)
    setDashboards(next)
    broadcastDashboards(next)
    setError(null)

    const moved = next[targetIndex]
    const previousItem = targetIndex > 0 ? next[targetIndex - 1] : null
    const nextItem = targetIndex < next.length - 1 ? next[targetIndex + 1] : null

    try {
      const response = await fetch('/api/dashboards', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dashboardId: moved.id,
          previousDashboardId: previousItem?.id ?? null,
          nextDashboardId: nextItem?.id ?? null,
        }),
      })

      if (!response.ok) {
        throw new Error('Unable to reorder dashboard.')
      }
    } catch {
      setDashboards(previous)
      broadcastDashboards(previous)
      setError('Unable to reorder dashboard.')
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
            <ul className="space-y-3">
              {dashboards.map((dashboard, index) => {
                const isDraggingRow = dragSourceIndex === index
                const shouldShowDropIndicator = dragTargetIndex === index && dragSourceIndex !== index
                const isDraggingDown = shouldShowDropIndicator && dragSourceIndex !== null && dragSourceIndex < index

                return (
                  <li
                    key={dashboard.id}
                    className="group relative rounded-xl border border-zinc-700 bg-zinc-900/70 px-4 py-3"
                    style={{ opacity: isDraggingRow ? 0.45 : 1 }}
                    onDragEnter={(event) => {
                      event.preventDefault()
                      if (dragSourceIndex !== null) {
                        setDragTargetIndex(index)
                      }
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault()
                      const sourceIndex = Number(event.dataTransfer.getData('text/plain'))
                      if (!Number.isNaN(sourceIndex)) {
                        void reorderDashboards(sourceIndex, index)
                      }
                      clearDragPreview()
                    }}
                  >
                    {shouldShowDropIndicator ? (
                      <div
                        className={`pointer-events-none absolute inset-x-4 h-1 rounded-full bg-amber-400/80 ${
                          isDraggingDown ? '-bottom-1' : '-top-1'
                        }`}
                      />
                    ) : null}

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        draggable
                        onDragStart={(event) => {
                          setDragSourceIndex(index)
                          setDragTargetIndex(index)
                          event.dataTransfer.setData('text/plain', String(index))
                          event.dataTransfer.effectAllowed = 'move'
                        }}
                        onDragEnd={clearDragPreview}
                        className="cursor-grab rounded-md px-1 text-lg leading-none text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200 active:cursor-grabbing"
                        aria-label={`Move ${dashboard.name}`}
                      >
                        ⋮⋮
                      </button>

                      <span className="min-w-0 flex-1 truncate text-zinc-100">{dashboard.name}</span>
                      <Link
                        href={`/dashboards/${dashboard.id}/edit`}
                        className="rounded-md p-1 text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
                        aria-label={`Edit ${dashboard.name}`}
                      >
                        <IoCreateOutline size={18} />
                      </Link>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              className="rounded-lg border border-zinc-300 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isCreating}
              onClick={() => {
                setNameDraft(`Dashboard ${dashboards.length + 1}`)
                setIsCreateDialogOpen(true)
              }}
            >
              {isCreating ? 'Creating…' : 'Create dashboard'}
            </button>
          </div>
        </div>
      </div>

      {isCreateDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="w-full max-w-md rounded-2xl border border-zinc-600/30 bg-zinc-800 px-6 py-6 shadow-2xl shadow-black/50">
            <h2 className="text-lg font-semibold text-zinc-100">Create dashboard</h2>
            <p className="mt-2 text-sm text-zinc-300">Choose a name for your new chest board.</p>

            <label className="mt-4 block text-sm font-medium text-zinc-300" htmlFor="dashboard-name">
              Name
            </label>
            <input
              id="dashboard-name"
              type="text"
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-400"
              maxLength={100}
            />

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-zinc-600 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
                onClick={() => {
                  if (isCreating) {
                    return
                  }

                  setIsCreateDialogOpen(false)
                  setNameDraft('')
                }}
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => void createDashboard()}
                disabled={isCreating || nameDraft.trim().length === 0}
              >
                {isCreating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default DashboardsClient
