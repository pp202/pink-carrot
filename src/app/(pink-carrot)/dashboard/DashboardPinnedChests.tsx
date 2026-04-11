"use client";

import ChestShareDialog from "@/app/components/ChestShareDialog";
import { Box, DropdownMenu, IconButton, Tooltip } from "@radix-ui/themes";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FaBars,
  FaClone,
  FaEdit,
  FaGripLines,
  FaMinus,
  FaUsers,
} from "react-icons/fa";
import { GiCarrot, GiChest, GiOpenChest } from "react-icons/gi";

const SHARED_TOOLTIP_VISIBLE_MS = 2500;
const DASHBOARD_REFRESH_INTERVAL_MS = 3000;

type DashboardCarrot = {
  id: string;
  label: string;
  harvested: boolean;
};

type DashboardChest = {
  id: number;
  label: string;
  carrots: DashboardCarrot[];
  pinned?: boolean;
  shared?: "NO" | "SHARED" | "UNSHARED";
  sharedWithAliases?: string[];
};

function SharedStatusIcon({
  shared,
  sharedWithAliases,
}: {
  shared: DashboardChest["shared"];
  sharedWithAliases?: string[];
}) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const sharedWithText = sharedWithAliases?.length ? sharedWithAliases.join(", ") : "";
  const sharedTooltip =
    shared === "SHARED"
      ? sharedWithText
        ? `Shared with ${sharedWithText}`
        : "Shared chest"
      : sharedWithText
        ? `Previously shared with ${sharedWithText}`
        : "Previously shared chest";

  useEffect(() => {
    if (!isTooltipOpen) {
      return;
    }

    const timer = setTimeout(() => {
      setIsTooltipOpen(false);
    }, SHARED_TOOLTIP_VISIBLE_MS);

    return () => clearTimeout(timer);
  }, [isTooltipOpen]);

  if (!shared || shared === "NO") {
    return null;
  }

  return (
    <Tooltip content={sharedTooltip} open={isTooltipOpen} onOpenChange={setIsTooltipOpen}>
      <button
        type="button"
        className={`mr-2 inline-flex ${shared === "SHARED" ? "text-emerald-400" : "text-zinc-500"}`}
        aria-label={sharedTooltip}
        onTouchStart={(event) => {
          event.stopPropagation();
          setIsTooltipOpen(true);
        }}
        onClick={(event) => {
          event.stopPropagation();
          setIsTooltipOpen((previous) => !previous);
        }}
      >
        <FaUsers />
      </button>
    </Tooltip>
  );
}

export default function DashboardPinnedChests({
  initialPinnedChests,
}: {
  initialPinnedChests: DashboardChest[];
}) {
  const router = useRouter();
  const [chests, setChests] = useState(initialPinnedChests);
  const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null);
  const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sharingChestId, setSharingChestId] = useState<number | null>(null);

  useEffect(() => {
    setChests(initialPinnedChests);
  }, [initialPinnedChests]);

  useEffect(() => {
    let isMounted = true;

    const refreshChests = async () => {
      if (isDragging) {
        return;
      }

      try {
        const response = await axios.get("/api/lists");
        const latestChests = (response.data as Array<{
          id: number;
          label: string;
          pinned?: boolean;
          shared?: "NO" | "SHARED" | "UNSHARED";
          sharedWithAliases?: string[];
          carrots?: Array<{ id: number; label: string; harvested: boolean }>;
        }>).map((chest) => ({
          id: chest.id,
          label: chest.label,
          pinned: chest.pinned,
          shared: chest.shared,
          sharedWithAliases: chest.sharedWithAliases,
          carrots: (chest.carrots ?? []).map((carrot) => ({
            id: carrot.id.toString(),
            label: carrot.label,
            harvested: carrot.harvested,
          })),
        }));

        if (isMounted) {
          setChests(latestChests);
        }
      } catch {
        // keep current dashboard state when sync fails
      }
    };

    const intervalId = setInterval(refreshChests, DASHBOARD_REFRESH_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshChests();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    void refreshChests();

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isDragging]);

  function handleHarvestedToggle(chestId: number, carrotId: string, harvested: boolean): void {
    setChests((previous) =>
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
      setChests((previous) =>
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

  function handleExpandToggle(chestId: number, pinned: boolean): void {
    setChests((previous) =>
      previous.map((chest) => (chest.id === chestId ? { ...chest, pinned } : chest)),
    );

    axios.patch(`/api/lists/${chestId}`, { pinned }).catch(() => {
      setChests((previous) =>
        previous.map((chest) =>
          chest.id === chestId ? { ...chest, pinned: !pinned } : chest,
        ),
      );
    });
  }

  function handleArchive(chestId: number): void {
    const archivedChest = chests.find((chest) => chest.id === chestId);
    if (!archivedChest) {
      return;
    }

    setChests((previous) => previous.filter((chest) => chest.id !== chestId));

    axios.patch(`/api/lists/${chestId}`, { status: "ARCHIVED" }).catch(() => {
      setChests((previous) => {
        if (previous.some((chest) => chest.id === chestId)) {
          return previous;
        }

        return [...previous, archivedChest];
      });
    });
  }

  function handleClone(chestId: number): void {
    axios.patch(`/api/lists/${chestId}`, { action: "clone" }).then((response) => {
      const clonedChest = response.data as DashboardChest;
      setChests((previous) => [...previous, clonedChest]);
    });
  }

  function startDragPreview(sourceIndex: number): void {
    setDragSourceIndex(sourceIndex);
    setDragTargetIndex(sourceIndex);
  }

  function clearDragPreview(): void {
    setDragSourceIndex(null);
    setDragTargetIndex(null);
  }

  function handleReorder(startIndex: number, targetIndex: number): void {
    if (startIndex === targetIndex || targetIndex < 0 || targetIndex >= chests.length) {
      return;
    }

    const previousState = [...chests];
    const nextState = [...chests];
    const [dragged] = nextState.splice(startIndex, 1);

    if (!dragged) {
      return;
    }

    nextState.splice(targetIndex, 0, dragged);
    setChests(nextState);

    const movedChest = nextState[targetIndex];
    const previousChest = targetIndex > 0 ? nextState[targetIndex - 1] : null;
    const nextChest = targetIndex < nextState.length - 1 ? nextState[targetIndex + 1] : null;

    axios
      .patch("/api/lists", {
        chestId: movedChest?.id,
        previousChestId: previousChest?.id ?? null,
        nextChestId: nextChest?.id ?? null,
        rankField: "dashRank",
      })
      .catch(() => {
        setChests(previousState);
      });
  }

  if (chests.length === 0) {
    return (
      <p className="rounded-xl border border-zinc-600/40 bg-zinc-900/60 px-4 py-6 text-center text-sm text-zinc-400">
        No chests yet. Create one with the plus button.
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {chests.map((chest, index) => {
          const isExpanded = Boolean(chest.pinned);
          const shouldShowDropIndicator = dragTargetIndex === index && dragSourceIndex !== index;
          const isDraggingDown =
            shouldShowDropIndicator && dragSourceIndex !== null && dragSourceIndex < index;

          return (
            <li
              key={chest.id}
              className={`group relative rounded-xl border border-zinc-600/40 bg-zinc-900/70 ${
                isExpanded ? "px-5 py-4" : "px-3 py-2.5"
              }`}
              data-reorder-index={index}
              style={{
                opacity: dragSourceIndex === index ? 0.45 : 1,
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                if (dragSourceIndex !== null) {
                  setDragTargetIndex(index);
                }
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const sourceIndex = Number(event.dataTransfer.getData("text/plain"));
                if (!Number.isNaN(sourceIndex)) {
                  handleReorder(sourceIndex, index);
                }

                clearDragPreview();
              }}
            >
              {shouldShowDropIndicator ? (
                <div
                  className={`pointer-events-none absolute inset-x-4 h-1 rounded-full bg-amber-400/80 ${
                    isDraggingDown ? "-bottom-1" : "-top-1"
                  }`}
                />
              ) : null}
              <article>
                <div
                  className={`flex items-center justify-between gap-2 ${
                    dragTargetIndex === index ? "rounded-lg bg-zinc-800/70" : ""
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <button
                      type="button"
                      aria-label="Drag chest"
                      className="-m-1 cursor-grab rounded p-1 text-zinc-400 active:cursor-grabbing hover:text-zinc-200"
                      draggable
                      onDragStart={(event) => {
                        setIsDragging(true);
                        startDragPreview(index);
                        event.dataTransfer.setData("text/plain", String(index));
                        event.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => {
                        clearDragPreview();
                        setTimeout(() => setIsDragging(false), 0);
                      }}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <FaGripLines aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label={isExpanded ? "Collapse chest" : "Expand chest"}
                      className="-m-1 rounded p-1 text-zinc-300 hover:text-zinc-100"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleExpandToggle(chest.id, !isExpanded);
                      }}
                    >
                      {isExpanded ? <GiOpenChest aria-hidden /> : <GiChest aria-hidden />}
                    </button>
                    <button
                      type="button"
                      className="truncate text-left text-sm font-semibold text-zinc-100 hover:text-zinc-50"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleExpandToggle(chest.id, !isExpanded);
                      }}
                    >
                      {chest.label}
                    </button>
                  </div>
                  <Box className="items-center">
                    <SharedStatusIcon
                      shared={chest.shared}
                      sharedWithAliases={chest.sharedWithAliases}
                    />
                    <DropdownMenu.Root>
                      <Tooltip content="More actions">
                        <DropdownMenu.Trigger>
                          <IconButton
                            size="1"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-zinc-300"
                            aria-label="More actions"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <FaBars />
                          </IconButton>
                        </DropdownMenu.Trigger>
                      </Tooltip>
                      <DropdownMenu.Content
                        size="1"
                        align="end"
                        className="space-y-2"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <DropdownMenu.Item
                          onClick={(event) => {
                            event.stopPropagation();
                            router.push(`/my-lists/${chest.id}/edit?from=dashboard`);
                          }}
                          className="!py-2.5 !text-[1.05rem] sm:!text-sm [&_svg]:!h-[1.15rem] [&_svg]:!w-[1.15rem] sm:[&_svg]:!h-4 sm:[&_svg]:!w-4"
                        >
                          <FaEdit />
                          Edit
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          onClick={(event) => {
                            event.stopPropagation();
                            setSharingChestId(chest.id);
                          }}
                          className="mt-3 !py-2.5 !text-[1.05rem] sm:!text-sm [&_svg]:!h-[1.15rem] [&_svg]:!w-[1.15rem] sm:[&_svg]:!h-4 sm:[&_svg]:!w-4"
                        >
                          <FaUsers />
                          Share
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          onClick={(event) => {
                            event.stopPropagation();
                            handleClone(chest.id);
                          }}
                          className="mt-3 !py-2.5 !text-[1.05rem] sm:!text-sm [&_svg]:!h-[1.15rem] [&_svg]:!w-[1.15rem] sm:[&_svg]:!h-4 sm:[&_svg]:!w-4"
                        >
                          <FaClone />
                          Clone
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          color="red"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleArchive(chest.id);
                          }}
                          className="mt-3 !py-2.5 !text-[1.05rem] sm:!text-sm [&_svg]:!h-[1.15rem] [&_svg]:!w-[1.15rem] sm:[&_svg]:!h-4 sm:[&_svg]:!w-4"
                        >
                          <FaMinus />
                          Archive
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  </Box>
                </div>
                {isExpanded ? (
                  chest.carrots.length === 0 ? (
                    <p className="mt-2 text-xs text-zinc-400">No carrots in this chest yet.</p>
                  ) : (
                    <ul className="mt-3 space-y-1 text-sm text-zinc-200">
                      {chest.carrots.map((carrot) => (
                        <li key={carrot.id} className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isDragging}
                            onClick={() =>
                              handleHarvestedToggle(chest.id, carrot.id, !carrot.harvested)
                            }
                            className="inline-flex items-center gap-2 rounded px-1 py-0.5 text-left transition hover:bg-zinc-800/70 disabled:pointer-events-none"
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
                  )
                ) : null}
              </article>
            </li>
          );
        })}
      </ul>
      <ChestShareDialog
        chestId={sharingChestId ?? 0}
        open={sharingChestId !== null}
        onClose={() => setSharingChestId(null)}
        onSharedStateChange={(isShared) => {
          if (!sharingChestId) {
            return;
          }

          setChests((previous) =>
            previous.map((chest) =>
              chest.id === sharingChestId
                ? {
                    ...chest,
                    shared: isShared ? "SHARED" : chest.shared === "NO" ? "NO" : "UNSHARED",
                  }
                : chest,
            ),
          );
        }}
      />
    </>
  );
}
