"use client";

import axios from "axios";
import Link from "next/link";
import { useState } from "react";
import { FiEdit2 } from "react-icons/fi";
import { GiCarrot } from "react-icons/gi";

type DashboardCarrot = {
  id: string;
  label: string;
  harvested: boolean;
};

type DashboardChest = {
  id: number;
  label: string;
  carrots: DashboardCarrot[];
};

export default function DashboardPinnedChests({
  initialPinnedChests,
}: {
  initialPinnedChests: DashboardChest[];
}) {
  const [pinnedChests, setPinnedChests] = useState(initialPinnedChests);

  function handleHarvestedToggle(chestId: number, carrotId: string, harvested: boolean): void {
    setPinnedChests((previous) =>
      previous.map((chest) =>
        chest.id !== chestId
          ? chest
          : {
              ...chest,
              carrots: chest.carrots.map((carrot) =>
                carrot.id === carrotId ? { ...carrot, harvested } : carrot,
              ),
            },
      ),
    );

    axios.patch(`/api/carrots/${carrotId}`, { harvested }).catch(() => {
      setPinnedChests((previous) =>
        previous.map((chest) =>
          chest.id !== chestId
            ? chest
            : {
                ...chest,
                carrots: chest.carrots.map((carrot) =>
                  carrot.id === carrotId ? { ...carrot, harvested: !harvested } : carrot,
                ),
              },
        ),
      );
    });
  }

  if (pinnedChests.length === 0) {
    return (
      <p className="rounded-xl border border-zinc-600/40 bg-zinc-900/60 px-4 py-6 text-center text-sm text-zinc-400">
        No pinned chests yet. Create one with the plus button.
      </p>
    );
  }

  return (
    <>
      {pinnedChests.map((chest) => (
        <article
          key={chest.id}
          className="rounded-xl border border-zinc-600/40 bg-zinc-900/70 px-5 py-4"
        >
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-sm font-semibold text-zinc-100">{chest.label}</h2>
            <Link
              href={`/my-lists/${chest.id}/edit?from=dashboard`}
              aria-label={`Edit ${chest.label}`}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-600/60 text-zinc-300 transition hover:border-zinc-400 hover:text-zinc-100"
            >
              <FiEdit2 className="text-sm" />
            </Link>
          </div>
          {chest.carrots.length === 0 ? (
            <p className="mt-2 text-xs text-zinc-400">No carrots in this chest yet.</p>
          ) : (
            <ul className="mt-3 space-y-1 text-sm text-zinc-200">
              {chest.carrots.map((carrot) => (
                <li key={carrot.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleHarvestedToggle(chest.id, carrot.id, !carrot.harvested)
                    }
                    className="inline-flex items-center gap-2 rounded px-1 py-0.5 text-left transition hover:bg-zinc-800/70"
                    aria-pressed={carrot.harvested}
                    aria-label={`${carrot.harvested ? "Unharvest" : "Harvest"} ${carrot.label}`}
                  >
                    <GiCarrot
                      aria-hidden
                      className={`text-xs ${carrot.harvested ? "text-zinc-500" : "text-pink-400"}`}
                    />
                    <span
                      className={carrot.harvested ? "text-zinc-400 line-through" : "text-zinc-200"}
                    >
                      {carrot.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </>
  );
}
