'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type MoveOption = {
  id: number
  name: string
}

type DashboardPayload = {
  dashboard: {
    id: number
    name: string
    _count: {
      chestPads: number
    }
  }
  totalDashboards: number
  moveOptions: MoveOption[]
}

const EditDashboardPage = () => {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const dashboardId = Number.parseInt(params.id, 10)

  const [nameDraft, setNameDraft] = useState('')
  const [chestCount, setChestCount] = useState(0)
  const [totalDashboards, setTotalDashboards] = useState(0)
  const [moveOptions, setMoveOptions] = useState<MoveOption[]>([])
  const [moveToDashboardId, setMoveToDashboardId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canDelete = totalDashboards > 1
  const needsMoveSelection = chestCount > 0

  useEffect(() => {
    if (!Number.isInteger(dashboardId)) {
      setError('Invalid dashboard id.')
      setIsLoading(false)
      return
    }

    fetch(`/api/dashboards/${dashboardId}`, { cache: 'no-cache' })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Unable to load dashboard.')
        }

        return response.json() as Promise<DashboardPayload>
      })
      .then((payload) => {
        setNameDraft(payload.dashboard.name)
        setChestCount(payload.dashboard._count.chestPads)
        setTotalDashboards(payload.totalDashboards)
        setMoveOptions(payload.moveOptions)
        if (payload.moveOptions.length > 0) {
          setMoveToDashboardId(payload.moveOptions[0].id.toString())
        }
      })
      .catch((loadError) => {
        const message = loadError instanceof Error ? loadError.message : 'Unable to load dashboard.'
        setError(message)
      })
      .finally(() => setIsLoading(false))
  }, [dashboardId])

  const selectedMoveTarget = useMemo(
    () => (moveToDashboardId ? Number.parseInt(moveToDashboardId, 10) : null),
    [moveToDashboardId],
  )

  const saveName = async () => {
    if (isSaving || !nameDraft.trim()) {
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/dashboards/${dashboardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameDraft }),
      })

      if (!response.ok) {
        throw new Error('Unable to save dashboard.')
      }

      router.push('/dashboards')
      router.refresh()
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Unable to save dashboard.'
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const deleteDashboard = async () => {
    if (!canDelete || isDeleting) {
      return
    }

    const warning = needsMoveSelection
      ? 'Delete this dashboard and move all chests to the selected dashboard?'
      : 'Delete this dashboard?'

    if (!window.confirm(warning)) {
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/dashboards/${dashboardId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moveToDashboardId: selectedMoveTarget }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.message ?? 'Unable to delete dashboard.')
      }

      router.push('/dashboards')
      router.refresh()
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : 'Unable to delete dashboard.'
      setError(message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className="min-h-[calc(100vh-5rem)] bg-zinc-950">
      <div className="container mx-auto flex min-h-[calc(100vh-5rem)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-zinc-600/30 bg-zinc-800 px-8 py-10 shadow-2xl shadow-black/40 md:px-10 md:py-12">
          <header className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-zinc-100">Edit dashboard</h1>
          </header>

          {error && (
            <p className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </p>
          )}

          {isLoading ? (
            <p className="rounded-xl border border-zinc-700 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-300">Loading dashboard…</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300" htmlFor="dashboard-name">Name</label>
                <input
                  id="dashboard-name"
                  type="text"
                  value={nameDraft}
                  onChange={(event) => setNameDraft(event.target.value)}
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-400"
                  maxLength={100}
                />
              </div>

              {!canDelete && (
                <p className="rounded-xl border border-zinc-700 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-300">
                  You cannot delete this dashboard because it is the only remaining dashboard.
                </p>
              )}

              {canDelete && needsMoveSelection && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300" htmlFor="move-target">
                    Move {chestCount} chest{chestCount === 1 ? '' : 's'} to
                  </label>
                  <select
                    id="move-target"
                    className="w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-400"
                    value={moveToDashboardId}
                    onChange={(event) => setMoveToDashboardId(event.target.value)}
                  >
                    {moveOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-between gap-3">
                <button
                  type="button"
                  className="rounded-md border border-red-400/70 bg-red-500/15 px-3 py-2 text-sm font-medium text-red-100 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => void deleteDashboard()}
                  disabled={!canDelete || isSaving || isDeleting || (needsMoveSelection && !selectedMoveTarget)}
                >
                  {isDeleting ? 'Deleting…' : 'Delete'}
                </button>

                <div className="flex gap-2">
                  <Link
                    href="/dashboards"
                    className="rounded-md border border-zinc-600 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
                  >
                    Cancel
                  </Link>
                  <button
                    type="button"
                    className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => void saveName()}
                    disabled={isSaving || isDeleting || nameDraft.trim().length === 0}
                  >
                    {isSaving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default EditDashboardPage
