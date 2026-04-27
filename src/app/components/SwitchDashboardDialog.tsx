"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { FaExchangeAlt, FaTimes } from "react-icons/fa";

type DashboardOption = {
  id: number;
  name: string;
};

type Props = {
  chestId: number;
  open: boolean;
  onClose: () => void;
  onSwitched: () => void;
};

export default function SwitchDashboardDialog({ chestId, open, onClose, onSwitched }: Props) {
  const [dashboards, setDashboards] = useState<DashboardOption[]>([]);
  const [selectedDashboardId, setSelectedDashboardId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setIsLoading(true);
    fetch("/api/dashboards", { cache: "no-cache" })
      .then((response) => response.json())
      .then((payload) => {
        const nextDashboards = Array.isArray(payload) ? payload : [];
        setDashboards(nextDashboards);
        setSelectedDashboardId(nextDashboards[0]?.id ?? null);
      })
      .finally(() => setIsLoading(false));
  }, [open]);

  async function handleConfirm(): Promise<void> {
    if (!selectedDashboardId || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      await axios.patch(`/api/lists/${chestId}`, {
        action: "switch-dashboard",
        dashboardId: selectedDashboardId,
      });

      onSwitched();
      onClose();
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
            <FaExchangeAlt />
            Switch dashboard
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="Close switch dashboard dialog"
          >
            <FaTimes />
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-zinc-300">Loading dashboards...</p>
        ) : dashboards.length === 0 ? (
          <p className="text-sm text-zinc-400">No dashboards available.</p>
        ) : (
          <label className="block text-sm text-zinc-200" htmlFor="switch-dashboard-select">
            Dashboard
            <select
              id="switch-dashboard-select"
              value={selectedDashboardId ?? ""}
              onChange={(event) => setSelectedDashboardId(Number(event.target.value))}
              className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-pink-400 focus:outline-none"
            >
              {dashboards.map((dashboard) => (
                <option key={dashboard.id} value={dashboard.id}>
                  {dashboard.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selectedDashboardId || dashboards.length === 0 || isSaving}
          className="mt-4 w-full rounded-md bg-pink-500 px-3 py-2 text-sm font-medium text-zinc-950 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
        >
          {isSaving ? "Switching..." : "Confirm"}
        </button>
      </div>
    </div>
  );
}
