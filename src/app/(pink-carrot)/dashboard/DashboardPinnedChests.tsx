"use client";

import axios from "axios";
import { Box, DropdownMenu, IconButton, Tooltip } from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaBars, FaClone, FaEdit, FaMinus } from "react-icons/fa";
import { GiCarrot, GiChest } from "react-icons/gi";

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
};

export default function DashboardPinnedChests({
  initialPinnedChests,
}: {
  initialPinnedChests: DashboardChest[];
}) {
  const router = useRouter();
  const [pinnedChests, setPinnedChests] = useState(initialPinnedChests);
  const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null);
  const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isTouchReordering, setIsTouchReordering] = useState(false);

  useEffect(() => {
    if (!isTouchReordering) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
    };
  }, [isTouchReordering]);

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

  function handleArchive(chestId: number): void {
    const archivedChest = pinnedChests.find((chest) => chest.id === chestId);
    if (!archivedChest) {
      return;
    }

    setPinnedChests((previous) => previous.filter((chest) => chest.id !== chestId));

    axios.patch(`/api/lists/${chestId}`, { status: "ARCHIVED" }).catch(() => {
      setPinnedChests((previous) => {
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

      if (!clonedChest.pinned) {
        return;
      }

      setPinnedChests((previous) => [...previous, clonedChest]);
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
    if (startIndex === targetIndex || targetIndex < 0 || targetIndex >= pinnedChests.length) {
      return;
    }

    const previousState = [...pinnedChests];
    const nextState = [...pinnedChests];
    const [dragged] = nextState.splice(startIndex, 1);

    if (!dragged) {
      return;
    }

    nextState.splice(targetIndex, 0, dragged);
    setPinnedChests(nextState);

    const movedChest = nextState[targetIndex];
    const previousChest = targetIndex > 0 ? nextState[targetIndex - 1] : null;
    const nextChest = targetIndex < (nextState.length - 1) ? nextState[targetIndex + 1] : null;

    axios.patch("/api/lists", {
      chestId: movedChest?.id,
      previousChestId: previousChest?.id ?? null,
      nextChestId: nextChest?.id ?? null,
      rankField: "dashRank",
    }).catch(() => {
      setPinnedChests(previousState);
    });
  }

  function finishTouchReorder(): void {
    if (dragSourceIndex !== null && dragTargetIndex !== null) {
      handleReorder(dragSourceIndex, dragTargetIndex);
    }

    setIsTouchReordering(false);
    clearDragPreview();
    setTimeout(() => setIsDragging(false), 0);
  }

  if (pinnedChests.length === 0) {
    return (
      <p className="rounded-xl border border-zinc-600/40 bg-zinc-900/60 px-4 py-6 text-center text-sm text-zinc-400">
        No pinned chests yet. Create one with the plus button.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {pinnedChests.map((chest, index) => {
        const shouldShowDropIndicator = dragTargetIndex === index && dragSourceIndex !== index;
        const isDraggingDown =
          shouldShowDropIndicator && dragSourceIndex !== null && dragSourceIndex < index;

        return (
          <li
            key={chest.id}
            className="group relative rounded-xl border border-zinc-600/40 bg-zinc-900/70 px-5 py-4"
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
                className={`flex items-center justify-between gap-3 ${
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
                    onTouchStart={(event) => {
                      event.stopPropagation();
                      setIsDragging(true);
                      setIsTouchReordering(true);
                      startDragPreview(index);
                    }}
                    onTouchMove={(event) => {
                      const touch = event.touches[0];
                      if (!touch || !isTouchReordering) {
                        return;
                      }

                      event.preventDefault();
                      const touchTarget = document
                        .elementFromPoint(touch.clientX, touch.clientY)
                        ?.closest("[data-reorder-index]");

                      const targetIndex = Number(touchTarget?.getAttribute("data-reorder-index"));
                      if (!Number.isNaN(targetIndex)) {
                        setDragTargetIndex(targetIndex);
                      }
                    }}
                    onTouchEnd={finishTouchReorder}
                    onTouchCancel={finishTouchReorder}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <GiChest aria-hidden />
                  </button>
                  <h2 className="truncate text-sm font-semibold text-zinc-100">{chest.label}</h2>
                </div>
                <Box className="items-center">
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
                          handleClone(chest.id);
                        }}
                        className="!mt-2 !py-2.5 !text-[1.05rem] sm:!text-sm [&_svg]:!h-[1.15rem] [&_svg]:!w-[1.15rem] sm:[&_svg]:!h-4 sm:[&_svg]:!w-4"
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
                        className="!mt-2 !py-2.5 !text-[1.05rem] sm:!text-sm [&_svg]:!h-[1.15rem] [&_svg]:!w-[1.15rem] sm:[&_svg]:!h-4 sm:[&_svg]:!w-4"
                      >
                        <FaMinus />
                        Archive
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </Box>
              </div>
              {chest.carrots.length === 0 ? (
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
              )}
            </article>
          </li>
        );
      })}
    </ul>
  );
}
