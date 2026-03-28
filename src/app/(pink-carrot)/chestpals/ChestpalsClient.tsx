'use client'

import { useMemo, useState } from 'react'

type Connection = {
  id: number
  alias: string
}

type Props = {
  initialConnections: Connection[]
}

const ChestpalsClient = ({ initialConnections }: Props) => {
  const [connections, setConnections] = useState<Connection[]>(initialConnections)
  const [selectedConnectionIds, setSelectedConnectionIds] = useState<number[]>([])
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const hasSelection = selectedConnectionIds.length > 0

  const selectedConnectionIdSet = useMemo(() => new Set(selectedConnectionIds), [selectedConnectionIds])

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
    }

    setIsDisconnecting(false)
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
              <label
                key={connection.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900/70 px-4 py-3"
              >
                <input
                  type="checkbox"
                  checked={selectedConnectionIdSet.has(connection.id)}
                  onChange={() => toggleConnection(connection.id)}
                  className="h-4 w-4 rounded border-zinc-500 bg-zinc-950 text-zinc-100"
                />
                <span className="text-zinc-100">{connection.alias}</span>
              </label>
            ))}
            {connections.length === 0 && (
              <p className="rounded-xl border border-zinc-700 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-300">
                No linked accounts.
              </p>
            )}
          </div>

          <div className="mt-8 flex justify-end">
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
    </section>
  )
}

export default ChestpalsClient
