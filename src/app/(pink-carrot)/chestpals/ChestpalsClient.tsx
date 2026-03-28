'use client'

import { useEffect, useMemo, useState } from 'react'

type Connection = {
  id: number
  alias: string
}

type Props = {
  initialConnections: Connection[]
  initialNotice: string | null
  initialRemainingMinutes: number | null
}

const ChestpalsClient = ({ initialConnections, initialNotice, initialRemainingMinutes }: Props) => {
  const [connections, setConnections] = useState<Connection[]>(initialConnections)
  const [selectedConnectionIds, setSelectedConnectionIds] = useState<number[]>([])
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [editingConnectionId, setEditingConnectionId] = useState<number | null>(null)
  const [aliasDraft, setAliasDraft] = useState('')
  const [isSavingAlias, setIsSavingAlias] = useState(false)
  const [modalMessage, setModalMessage] = useState<{ tone: 'success' | 'warning'; text: string } | null>(null)

  const hasSelection = selectedConnectionIds.length > 0

  const selectedConnectionIdSet = useMemo(() => new Set(selectedConnectionIds), [selectedConnectionIds])

  const noticeMessage = useMemo(() => {
    if (initialNotice === 'connected') {
      return 'Connected successfully. You can now manage this connection in Chestpals.'
    }

    if (initialNotice === 'owner-active' && initialRemainingMinutes) {
      return `The link is still active for another ${initialRemainingMinutes} minute${initialRemainingMinutes === 1 ? '' : 's'}.`
    }

    if (initialNotice === 'expired') {
      return 'The link is expired.'
    }

    return null
  }, [initialNotice, initialRemainingMinutes])

  useEffect(() => {
    if (!noticeMessage) {
      return
    }

    if (initialNotice === 'connected') {
      setModalMessage({ tone: 'success', text: noticeMessage })
      return
    }

    setModalMessage({ tone: 'warning', text: noticeMessage })
  }, [initialNotice, noticeMessage])

  const createInviteLink = async () => {
    if (isInviting) {
      return
    }

    setIsInviting(true)

    try {
      const response = await fetch('/api/chestpals/invite', {
        method: 'POST',
      })

      if (!response.ok) {
        setModalMessage({ tone: 'warning', text: 'Unable to create an invite link. Please try again.' })
        return
      }

      const data = (await response.json()) as { requestId?: string }

      if (!data.requestId) {
        setModalMessage({ tone: 'warning', text: 'Unable to create an invite link. Please try again.' })
        return
      }

      const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
      const baseUrl = configuredBaseUrl || window.location.origin
      const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
      const inviteLink = `${normalizedBaseUrl}/connect/${data.requestId}`

      await navigator.clipboard.writeText(inviteLink)
      setModalMessage({ tone: 'success', text: 'Invite link copied. You can now share it.' })
    } catch {
      setModalMessage({ tone: 'warning', text: 'Unable to create an invite link. Please try again.' })
    } finally {
      setIsInviting(false)
    }
  }

  const toggleConnection = (connectionId: number) => {
    setSelectedConnectionIds(currentSelection => {
      if (currentSelection.includes(connectionId)) {
        return currentSelection.filter(id => id !== connectionId)
      }

      return [...currentSelection, connectionId]
    })
  }

  const disconnectSelectedConnections = async () => {
    if (!hasSelection || isDisconnecting) {
      return
    }

    setIsDisconnecting(true)

    const response = await fetch('/api/chestpals', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ connectionIds: selectedConnectionIds }),
    })

    if (response.ok) {
      setConnections(currentConnections =>
        currentConnections.filter(connection => !selectedConnectionIdSet.has(connection.id))
      )
      setSelectedConnectionIds([])
      setModalMessage({ tone: 'success', text: 'Selected connections were disconnected.' })
    } else {
      setModalMessage({ tone: 'warning', text: 'Unable to disconnect selected connections. Please try again.' })
    }

    setIsDisconnecting(false)
  }

  const startEditingAlias = (connection: Connection) => {
    setEditingConnectionId(connection.id)
    setAliasDraft(connection.alias)
  }

  const cancelEditingAlias = () => {
    setEditingConnectionId(null)
    setAliasDraft('')
  }

  const saveConnectionAlias = async () => {
    if (!editingConnectionId || isSavingAlias) {
      return
    }

    setIsSavingAlias(true)

    try {
      const response = await fetch('/api/chestpals', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionId: editingConnectionId,
          alias: aliasDraft,
        }),
      })

      if (!response.ok) {
        setModalMessage({ tone: 'warning', text: 'Unable to update alias. Please try again.' })
        return
      }

      const payload = (await response.json()) as { alias: string }

      setConnections(currentConnections =>
        currentConnections.map(connection => (
          connection.id === editingConnectionId
            ? { ...connection, alias: payload.alias }
            : connection
        ))
      )

      cancelEditingAlias()
      setModalMessage({ tone: 'success', text: 'Alias updated.' })
    } catch {
      setModalMessage({ tone: 'warning', text: 'Unable to update alias. Please try again.' })
    } finally {
      setIsSavingAlias(false)
    }
  }

  return (
    <section className="min-h-[calc(100vh-5rem)] bg-zinc-950">
      <div className="container mx-auto flex min-h-[calc(100vh-5rem)] items-stretch justify-center px-6 py-12">
        <div className="w-full max-w-2xl rounded-2xl border border-zinc-600/30 bg-zinc-800 px-8 py-10 shadow-2xl shadow-black/40 md:px-10 md:py-12">
          <header className="mb-8 w-full text-center">
            <h1 className="text-2xl font-semibold text-zinc-100">Chestpals</h1>
          </header>

          <div className="space-y-3">
            {connections.map(connection => (
              <div
                key={connection.id}
                className="rounded-xl border border-zinc-700 bg-zinc-900/70 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedConnectionIdSet.has(connection.id)}
                    onChange={() => toggleConnection(connection.id)}
                    className="h-4 w-4 rounded border-zinc-500 bg-zinc-950 text-zinc-100"
                  />
                  {editingConnectionId === connection.id ? (
                    <>
                      <input
                        type="text"
                        value={aliasDraft}
                        onChange={event => setAliasDraft(event.target.value)}
                        className="min-w-0 flex-1 rounded-md border border-zinc-600 bg-zinc-950 px-3 py-1 text-sm text-zinc-100 focus:border-zinc-400 focus:outline-none"
                        maxLength={255}
                      />
                      <button
                        type="button"
                        onClick={saveConnectionAlias}
                        disabled={isSavingAlias}
                        className="rounded-lg border border-zinc-400/50 bg-zinc-700/40 px-3 py-1 text-xs font-medium text-zinc-100 transition hover:bg-zinc-700/60 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSavingAlias ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditingAlias}
                        disabled={isSavingAlias}
                        className="rounded-lg border border-zinc-500/60 bg-zinc-800/30 px-3 py-1 text-xs font-medium text-zinc-200 transition hover:bg-zinc-700/50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 truncate text-zinc-100">{connection.alias}</span>
                      <button
                        type="button"
                        onClick={() => startEditingAlias(connection)}
                        className="rounded-lg border border-zinc-400/50 bg-zinc-700/40 px-3 py-1 text-xs font-medium text-zinc-100 transition hover:bg-zinc-700/60"
                      >
                        Edit alias
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {connections.length === 0 && (
              <p className="rounded-xl border border-zinc-700 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-300">
                No linked accounts.
              </p>
            )}
          </div>

          <div className="mt-8 flex justify-between gap-3">
            <button
              type="button"
              className="rounded-lg border border-zinc-400/50 bg-zinc-700/40 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:bg-zinc-700/60 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isInviting}
              onClick={createInviteLink}
            >
              {isInviting ? 'Creating invite…' : 'Invite'}
            </button>
            <button
              type="button"
              className="rounded-lg border border-red-500/60 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!hasSelection || isDisconnecting}
              onClick={disconnectSelectedConnections}
            >
              {isDisconnecting ? 'Disconnecting…' : 'Disconnect'}
            </button>
          </div>
        </div>
      </div>
      {modalMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6"
          onClick={() => setModalMessage(null)}
        >
          <div
            className={`w-full max-w-md rounded-2xl border px-6 py-5 text-center shadow-2xl ${
              modalMessage.tone === 'success'
                ? 'border-green-400/70 bg-zinc-900 text-green-100 shadow-[0_0_32px_rgba(74,222,128,0.65)]'
                : 'border-amber-400/70 bg-zinc-900 text-amber-100 shadow-[0_0_32px_rgba(251,146,60,0.65)]'
            }`}
            onClick={event => event.stopPropagation()}
          >
            <p className="text-sm">{modalMessage.text}</p>
            <button
              type="button"
              className={`mt-5 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                modalMessage.tone === 'success'
                  ? 'border-green-300/60 bg-green-500/20 text-green-100 hover:bg-green-500/30'
                  : 'border-amber-300/60 bg-amber-500/20 text-amber-100 hover:bg-amber-500/30'
              }`}
              onClick={() => setModalMessage(null)}
            >
              Noted
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default ChestpalsClient
