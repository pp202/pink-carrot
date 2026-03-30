"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { FaTimes, FaUsers } from "react-icons/fa";

type ChestpalShareOption = {
  id: number;
  alias: string;
  shared: boolean;
};

type Props = {
  chestId: number;
  open: boolean;
  onClose: () => void;
  onSharedStateChange: (isShared: boolean) => void;
};

export default function ChestShareDialog({ chestId, open, onClose, onSharedStateChange }: Props) {
  const [connections, setConnections] = useState<ChestpalShareOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setIsLoading(true);
    fetch(`/api/lists/${chestId}?shareOptions=1`, { cache: "no-cache" })
      .then((response) => response.json())
      .then((payload) => {
        const nextConnections = Array.isArray(payload?.connections) ? payload.connections : [];
        setConnections(nextConnections);
        setSelectedIds([]);
      })
      .finally(() => setIsLoading(false));
  }, [open, chestId]);

  const allSelectedAreShared = useMemo(
    () => selectedIds.length > 0 && selectedIds.every((id) => connections.find((item) => item.id === id)?.shared),
    [connections, selectedIds],
  );

  const actionLabel = allSelectedAreShared ? "Unshare" : "Share";

  function toggleSelection(id: number): void {
    setSelectedIds((previous) =>
      previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id],
    );
  }

  async function submitAction(): Promise<void> {
    if (selectedIds.length === 0 || isSaving) {
      return;
    }

    setIsSaving(true);
    const action = allSelectedAreShared ? "unshare" : "share";

    try {
      await axios.patch(`/api/lists/${chestId}`, {
        action,
        connectionIds: selectedIds,
      });

      const updated = connections.map((connection) =>
        selectedIds.includes(connection.id)
          ? { ...connection, shared: action === "share" }
          : connection,
      );
      setConnections(updated);
      setSelectedIds([]);
      onSharedStateChange(updated.some((connection) => connection.shared));
    } finally {
      setIsSaving(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-600/50 bg-zinc-900 p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <FaUsers />
            Share chest
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="Close share dialog"
          >
            <FaTimes />
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-zinc-300">Loading chestpals...</p>
        ) : connections.length === 0 ? (
          <p className="text-sm text-zinc-400">No chestpals available.</p>
        ) : (
          <ul className="max-h-64 space-y-2 overflow-auto">
            {connections.map((connection) => (
              <li key={connection.id} className="flex items-center justify-between rounded border border-zinc-700/70 px-3 py-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-100">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(connection.id)}
                    onChange={() => toggleSelection(connection.id)}
                  />
                  <span>{connection.alias}</span>
                </label>
                {connection.shared ? (
                  <span className="text-xs text-emerald-400">Shared</span>
                ) : (
                  <span className="text-xs text-zinc-500">Not shared</span>
                )}
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={submitAction}
          disabled={selectedIds.length === 0 || isSaving}
          className="mt-4 w-full rounded-md bg-pink-500 px-3 py-2 text-sm font-medium text-zinc-950 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
        >
          {isSaving ? `${actionLabel}ing...` : actionLabel}
        </button>
      </div>
    </div>
  );
}
