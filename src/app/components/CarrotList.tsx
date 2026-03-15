"use client";

import { Chest } from "@/app/generated/prisma/client";
import Spinner from "@/app/components/Spinner";
import { Box, DropdownMenu, Flex, IconButton, Text, Tooltip } from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { FaBars, FaClone, FaGripLines, FaMinus, FaThumbtack } from "react-icons/fa";

const SWIPE_DELETE_THRESHOLD = 90;
const UNDO_VISIBLE_MS = 5000;
type RecentlyArchived = {
  chest: Chest;
};

const CarrotList = () => {
  const [state, setState] = useState<Chest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recentlyArchived, setRecentlyArchived] =
    useState<RecentlyArchived | null>(null);
  const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null);
  const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/lists", { cache: "no-cache" })
      .then((res) => res.json())
      .then((data) => setState(data))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  function queueUndoBanner(chest: Chest): void {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }

    setRecentlyArchived({ chest });
    undoTimerRef.current = setTimeout(() => {
      setRecentlyArchived(null);
      undoTimerRef.current = null;
    }, UNDO_VISIBLE_MS);
  }

  function handleRemove(id: number): void {
    const removedItem = state.find((item) => item.id === id);
    if (!removedItem) {
      return;
    }

    axios.patch(`/api/lists/${id}`, { status: "ARCHIVED" }).then(() => {
      setState((previous) => previous.filter((item) => item.id !== id));
      queueUndoBanner(removedItem);
    });
  }

  function handleUndoArchive(): void {
    if (!recentlyArchived) {
      return;
    }

    const { chest } = recentlyArchived;
    axios.patch(`/api/lists/${chest.id}`, { status: "NEW" }).then(() => {
      setState((previous) => {
        if (previous.some((item) => item.id === chest.id)) {
          return previous;
        }

        const restored: Chest = { ...chest, status: "NEW" as Chest["status"] };

        return [...previous, restored];
      });

      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }

      setRecentlyArchived(null);
    });
  }

  function handlePinnedToggle(id: number, pinned: boolean): void {
    setState((previous) =>
      previous.map((item) => (item.id === id ? { ...item, pinned } : item)),
    );

    axios.patch(`/api/lists/${id}`, { pinned }).catch(() => {
      setState((previous) =>
        previous.map((item) =>
          item.id === id ? { ...item, pinned: !pinned } : item,
        ),
      );
    });
  }

  function handleClone(id: number): void {
    axios.patch(`/api/lists/${id}`, { action: "clone" }).then((response) => {
      setState((previous) => [...previous, response.data as Chest]);
    });
  }

  function handleReorder(startIndex: number, targetIndex: number): void {
    if (startIndex === targetIndex || targetIndex < 0 || targetIndex >= state.length) {
      return;
    }

    const previousState = [...state];
    const nextState = [...state];
    const [dragged] = nextState.splice(startIndex, 1);

    if (!dragged) {
      return;
    }

    nextState.splice(targetIndex, 0, dragged);
    setState(nextState);

    const movedChest = nextState[targetIndex];
    const previousChest = targetIndex > 0 ? nextState[targetIndex - 1] : null;
    const nextChest = targetIndex < (nextState.length - 1) ? nextState[targetIndex + 1] : null;

    axios.patch("/api/lists", {
      chestId: movedChest?.id,
      previousChestId: previousChest?.id ?? null,
      nextChestId: nextChest?.id ?? null,
    }).catch(() => {
      setState(previousState);
    });
  }

  function startDragPreview(sourceIndex: number): void {
    setDragSourceIndex(sourceIndex);
    setDragTargetIndex(sourceIndex);
  }

  function updateDragPreview(targetIndex: number): void {
    setDragTargetIndex(targetIndex);
  }

  function clearDragPreview(): void {
    setDragSourceIndex(null);
    setDragTargetIndex(null);
  }

  return (
    <>
      <Carrots
        carrotList={state}
        isLoading={isLoading}
        onRemove={handleRemove}
        onPinnedToggle={handlePinnedToggle}
        onClone={handleClone}
        onReorder={handleReorder}
        dragSourceIndex={dragSourceIndex}
        dragTargetIndex={dragTargetIndex}
        onDragPreviewStart={startDragPreview}
        onDragPreviewUpdate={updateDragPreview}
        onDragPreviewClear={clearDragPreview}
      />
      {recentlyArchived ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
          <div className="pointer-events-auto rounded-lg border border-zinc-600/40 bg-zinc-900/90 px-3 py-2 text-sm text-zinc-200 shadow-lg shadow-black/30">
            Archived &quot;{recentlyArchived.chest.label}&quot;.{" "}
            <button
              type="button"
              className="underline underline-offset-2 hover:text-zinc-100"
              onClick={handleUndoArchive}
            >
              Undo
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
};

const Carrots = ({
  carrotList,
  isLoading,
  onRemove,
  onPinnedToggle,
  onClone,
  onReorder,
  dragSourceIndex,
  dragTargetIndex,
  onDragPreviewStart,
  onDragPreviewUpdate,
  onDragPreviewClear,
}: {
  carrotList: Chest[];
  isLoading: boolean;
  onRemove: (id: number) => void;
  onPinnedToggle: (id: number, pinned: boolean) => void;
  onClone: (id: number) => void;
  onReorder: (startIndex: number, targetIndex: number) => void;
  dragSourceIndex: number | null;
  dragTargetIndex: number | null;
  onDragPreviewStart: (sourceIndex: number) => void;
  onDragPreviewUpdate: (targetIndex: number) => void;
  onDragPreviewClear: () => void;
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-zinc-300">
        <Spinner />
        <span>Loading lists...</span>
      </div>
    );
  }

  if (carrotList.length === 0) {
    return <p className="text-center text-sm text-zinc-400">No lists yet.</p>;
  }

  return (
    <ul className="space-y-1.5">
      {carrotList.map((item, index) => (
        <CarrotListItem
          key={item.id}
          item={item}
          onRemove={onRemove}
          onPinnedToggle={onPinnedToggle}
          onClone={onClone}
          index={index}
          onReorder={onReorder}
          dragSourceIndex={dragSourceIndex}
          dragTargetIndex={dragTargetIndex}
          onDragPreviewStart={onDragPreviewStart}
          onDragPreviewUpdate={onDragPreviewUpdate}
          onDragPreviewClear={onDragPreviewClear}
        />
      ))}
    </ul>
  );
};

const CarrotListItem = ({
  item,
  onRemove,
  onPinnedToggle,
  onClone,
  index,
  onReorder,
  dragSourceIndex,
  dragTargetIndex,
  onDragPreviewStart,
  onDragPreviewUpdate,
  onDragPreviewClear,
}: {
  item: Chest;
  onRemove: (id: number) => void;
  onPinnedToggle: (id: number, pinned: boolean) => void;
  onClone: (id: number) => void;
  index: number;
  onReorder: (startIndex: number, targetIndex: number) => void;
  dragSourceIndex: number | null;
  dragTargetIndex: number | null;
  onDragPreviewStart: (sourceIndex: number) => void;
  onDragPreviewUpdate: (targetIndex: number) => void;
  onDragPreviewClear: () => void;
}) => {
  const router = useRouter();
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);
  const [touchDeltaY, setTouchDeltaY] = useState(0);
  const shouldShowDropIndicator = dragTargetIndex === index && dragSourceIndex !== index;
  const isDraggingDown =
    shouldShowDropIndicator && dragSourceIndex !== null && dragSourceIndex < index;
  const [isDragging, setIsDragging] = useState(false);
  const [isTouchReordering, setIsTouchReordering] = useState(false);
  const bodyScrollWasLockedRef = useRef(false);

  useEffect(() => () => {
    document.body.style.overflow = "";
    document.documentElement.style.overscrollBehavior = "";
  }, []);

  function setPageScrollLock(locked: boolean): void {
    if (locked) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overscrollBehavior = "none";
      bodyScrollWasLockedRef.current = true;
      return;
    }

    if (bodyScrollWasLockedRef.current) {
      document.body.style.overflow = "";
      document.documentElement.style.overscrollBehavior = "";
      bodyScrollWasLockedRef.current = false;
    }
  }

  function handleTouchStart(event: React.TouchEvent<HTMLLIElement>): void {
    if (isTouchReordering) {
      return;
    }

    setTouchStartX(event.touches[0]?.clientX ?? null);
    setTouchStartY(event.touches[0]?.clientY ?? null);
    setTouchDeltaX(0);
    setTouchDeltaY(0);
  }

  function handleTouchMove(event: React.TouchEvent<HTMLLIElement>): void {
    if (isTouchReordering) {
      return;
    }

    if (touchStartX === null) {
      return;
    }

    const currentTouch = event.touches[0];
    const currentX = currentTouch?.clientX;
    const currentY = currentTouch?.clientY;

    if (typeof currentX !== "number" || typeof currentY !== "number") {
      return;
    }

    if (touchStartY === null) {
      return;
    }

    setTouchDeltaX(currentX - touchStartX);
    setTouchDeltaY(currentY - touchStartY);
  }

  function handleTouchEnd(): void {
    if (isTouchReordering) {
      return;
    }

    const isHorizontalSwipe = Math.abs(touchDeltaX) > Math.abs(touchDeltaY);
    const hasTriggeredDelete =
      isHorizontalSwipe && Math.abs(touchDeltaX) >= SWIPE_DELETE_THRESHOLD;

    setTouchStartX(null);
    setTouchStartY(null);
    setTouchDeltaX(0);
    setTouchDeltaY(0);

    if (hasTriggeredDelete) {
      onRemove(item.id);
    }
  }

  function handleItemNavigation(): void {
    router.push(`/my-lists/${item.id}/edit`);
  }

  function handleDragHandleTouchStart(event: React.TouchEvent<HTMLButtonElement>): void {
    event.stopPropagation();

    setIsDragging(true);
    setIsTouchReordering(true);
    onDragPreviewStart(index);
    setPageScrollLock(true);

    setTouchStartX(null);
    setTouchStartY(null);
    setTouchDeltaX(0);
    setTouchDeltaY(0);
  }

  function handleDragHandleTouchMove(event: React.TouchEvent<HTMLButtonElement>): void {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    if (!isTouchReordering) {
      return;
    }

    event.preventDefault();
    const touchTarget = document
      .elementFromPoint(touch.clientX, touch.clientY)
      ?.closest("[data-reorder-index]");

    const targetIndex = Number(touchTarget?.getAttribute("data-reorder-index"));
    if (!Number.isNaN(targetIndex)) {
      onDragPreviewUpdate(targetIndex);
    }
  }

  function finishTouchReorder(): void {
    if (dragSourceIndex !== null && dragTargetIndex !== null) {
      onReorder(dragSourceIndex, dragTargetIndex);
    }

    setIsTouchReordering(false);
    setPageScrollLock(false);
    onDragPreviewClear();
    setTimeout(() => setIsDragging(false), 0);
  }

  function handleItemClick(event: React.MouseEvent<HTMLLIElement>): void {
    const target = event.target as HTMLElement;
    if (isDragging || target.closest("button, a, input, label")) {
      return;
    }

    handleItemNavigation();
  }

  function handleItemKeyDown(event: React.KeyboardEvent<HTMLLIElement>): void {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleItemNavigation();
    }
  }

  return (
    <li
      className="group relative cursor-pointer rounded-xl border border-zinc-600/40 bg-zinc-900/70 px-3 py-2.5 transition-transform duration-150"
      data-reorder-index={index}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleItemClick}
      onKeyDown={handleItemKeyDown}
      role="button"
      tabIndex={0}
      style={{
        transform: `translateX(${isTouchReordering ? 0 : Math.max(-60, Math.min(60, touchDeltaX))}px)`,
        opacity: dragSourceIndex === index ? 0.45 : 1,
      }}
      onDragEnter={(event) => {
        event.preventDefault();
        if (dragSourceIndex !== null) {
          onDragPreviewUpdate(index);
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        const sourceIndex = Number(event.dataTransfer.getData("text/plain"));
        if (!Number.isNaN(sourceIndex)) {
          onReorder(sourceIndex, index);
        }

        setPageScrollLock(false);
        onDragPreviewClear();
      }}
    >
      {shouldShowDropIndicator ? (
        <div
          className={`pointer-events-none absolute inset-x-4 h-1 rounded-full bg-amber-400/80 ${
            isDraggingDown ? "-bottom-1" : "-top-1"
          }`}
        />
      ) : null}
      <Flex
        className={`min-h-8 items-center gap-1.5 pr-6 ${
          dragTargetIndex === index ? "rounded-lg bg-zinc-800/70" : ""
        }`}
      >
        <Tooltip content="Drag to reorder">
          <IconButton
            size="3"
            variant="ghost"
            aria-label="Drag chest"
            className="-m-1 self-start cursor-grab p-2 text-zinc-400 active:cursor-grabbing hover:text-zinc-200"
            draggable
            onDragStart={(event) => {
              setIsDragging(true);
              onDragPreviewStart(index);
              setPageScrollLock(true);
              event.dataTransfer.setData("text/plain", String(index));
              event.dataTransfer.effectAllowed = "move";
            }}
            onDragEnd={() => {
              setPageScrollLock(false);
              onDragPreviewClear();
              setTimeout(() => setIsDragging(false), 0);
            }}
            onTouchStart={handleDragHandleTouchStart}
            onTouchMove={handleDragHandleTouchMove}
            onTouchEnd={finishTouchReorder}
            onTouchCancel={finishTouchReorder}
            onClick={(event) => event.stopPropagation()}
            style={{ touchAction: "none" }}
          >
            <FaGripLines />
          </IconButton>
        </Tooltip>
        <Box className="flex min-h-8 grow items-center">
          <Text className="text-sm font-medium leading-tight text-zinc-100">{item.label}</Text>
        </Box>
        <Tooltip content={item.pinned ? "Unpin" : "Pin"}>
          <IconButton
            size="1"
            variant="ghost"
            className={
              item.pinned
                ? "!text-red-500 hover:!text-red-400"
                : "!text-zinc-400 hover:!text-zinc-300"
            }
            onClick={() => onPinnedToggle(item.id, !item.pinned)}
          >
            <FaThumbtack />
          </IconButton>
        </Tooltip>
        <Box className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center md:inline-flex md:invisible md:pointer-events-none md:opacity-0 md:transition-opacity md:group-hover:pointer-events-auto md:group-hover:visible md:group-hover:opacity-100 md:group-focus-within:pointer-events-auto md:group-focus-within:visible md:group-focus-within:opacity-100">
          <DropdownMenu.Root>
            <Tooltip content="More actions">
              <DropdownMenu.Trigger>
                <IconButton
                  size="1"
                  variant="ghost"
                  className="text-zinc-300"
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
                  onClone(item.id);
                }}
                className="!py-2.5 !text-[1.05rem] sm:!text-sm [&_svg]:!h-[1.15rem] [&_svg]:!w-[1.15rem] sm:[&_svg]:!h-4 sm:[&_svg]:!w-4"
              >
                <FaClone />
                Clone
              </DropdownMenu.Item>
              <DropdownMenu.Item
                color="red"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(item.id);
                }}
                className="!mt-2 !py-2.5 !text-[1.05rem] sm:!text-sm [&_svg]:!h-[1.15rem] [&_svg]:!w-[1.15rem] sm:[&_svg]:!h-4 sm:[&_svg]:!w-4"
              >
                <FaMinus />
                Archive
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </Box>
      </Flex>
    </li>
  );
};

export default CarrotList;
