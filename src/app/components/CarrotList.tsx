'use client';

import { Chest } from '@/app/generated/prisma/client';
import Spinner from '@/app/components/Spinner';
import { Box, Flex, IconButton, Tooltip, Text } from '@radix-ui/themes';
import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { FaMinus, FaThumbtack, FaTrash } from 'react-icons/fa';

const SWIPE_DELETE_THRESHOLD = 90;
const UNDO_VISIBLE_MS = 5000;

type RecentlyArchived = {
  chest: Chest;
};

type CarrotListProps = {
  mode?: 'active' | 'archived';
};

const CarrotList = ({ mode = 'active' }: CarrotListProps) => {
  const [state, setState] = useState<Chest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recentlyArchived, setRecentlyArchived] =
    useState<RecentlyArchived | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isArchiveMode = mode === 'archived';

  useEffect(() => {
    const statusParam = isArchiveMode ? '?status=ARCHIVED' : '';

    fetch(`/api/lists${statusParam}`, { cache: 'no-cache' })
      .then((res) => res.json())
      .then((data) => setState(data))
      .finally(() => setIsLoading(false));
  }, [isArchiveMode]);

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

    if (isArchiveMode) {
      axios.delete(`/api/lists/${id}`).then(() => {
        setState((previous) => previous.filter((item) => item.id !== id));
      });
      return;
    }

    axios.patch(`/api/lists/${id}`, { status: 'ARCHIVED' }).then(() => {
      setState((previous) => previous.filter((item) => item.id !== id));
      queueUndoBanner(removedItem);
    });
  }

  function handleUndoArchive(): void {
    if (!recentlyArchived || isArchiveMode) {
      return;
    }

    const { chest } = recentlyArchived;
    axios.patch(`/api/lists/${chest.id}`, { status: 'NEW' }).then(() => {
      setState((previous) => {
        if (previous.some((item) => item.id === chest.id)) {
          return previous;
        }

        const restored: Chest = { ...chest, status: 'NEW' as Chest['status'] };

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
      previous.map((item) => (item.id === id ? { ...item, pinned } : item))
    );

    axios.patch(`/api/lists/${id}`, { pinned }).catch(() => {
      setState((previous) =>
        previous.map((item) =>
          item.id === id ? { ...item, pinned: !pinned } : item
        )
      );
    });
  }

  return (
    <>
      <Carrots
        carrotList={state}
        isLoading={isLoading}
        onRemove={handleRemove}
        onPinnedToggle={handlePinnedToggle}
        mode={mode}
      />
      {recentlyArchived && !isArchiveMode ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
          <div className="pointer-events-auto rounded-lg border border-zinc-600/40 bg-zinc-900/90 px-3 py-2 text-sm text-zinc-200 shadow-lg shadow-black/30">
            Archived "{recentlyArchived.chest.label}".{' '}
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
  mode,
}: {
  carrotList: Chest[];
  isLoading: boolean;
  onRemove: (id: number) => void;
  onPinnedToggle: (id: number, pinned: boolean) => void;
  mode: 'active' | 'archived';
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
    return (
      <p className="text-center text-sm text-zinc-400">
        {mode === 'archived' ? 'No archived lists.' : 'No lists yet.'}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {carrotList.map((item) => (
        <CarrotListItem
          key={item.id}
          item={item}
          onRemove={onRemove}
          onPinnedToggle={onPinnedToggle}
          mode={mode}
        />
      ))}
    </ul>
  );
};

const CarrotListItem = ({
  item,
  onRemove,
  onPinnedToggle,
  mode,
}: {
  item: Chest;
  onRemove: (id: number) => void;
  onPinnedToggle: (id: number, pinned: boolean) => void;
  mode: 'active' | 'archived';
}) => {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);
  const [touchDeltaY, setTouchDeltaY] = useState(0);
  const isArchiveMode = mode === 'archived';

  function handleTouchStart(event: React.TouchEvent<HTMLLIElement>): void {
    setTouchStartX(event.touches[0]?.clientX ?? null);
    setTouchStartY(event.touches[0]?.clientY ?? null);
    setTouchDeltaX(0);
    setTouchDeltaY(0);
  }

  function handleTouchMove(event: React.TouchEvent<HTMLLIElement>): void {
    if (touchStartX === null) {
      return;
    }

    const currentTouch = event.touches[0];
    const currentX = currentTouch?.clientX;
    const currentY = currentTouch?.clientY;

    if (typeof currentX !== 'number' || typeof currentY !== 'number') {
      return;
    }

    if (touchStartY === null) {
      return;
    }

    setTouchDeltaX(currentX - touchStartX);
    setTouchDeltaY(currentY - touchStartY);
  }

  function handleTouchEnd(): void {
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

  return (
    <li
      className="group relative rounded-xl border border-zinc-600/40 bg-zinc-900/70 px-4 py-3 transition-transform duration-150"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ transform: `translateX(${Math.max(-60, Math.min(60, touchDeltaX))}px)` }}
    >
      <Flex className="items-center gap-2 pr-8">
        <Box className="grow">
          <Text className="text-sm font-medium text-zinc-100">{item.label}</Text>
        </Box>
        {!isArchiveMode ? (
          <Box>
            <Tooltip content={item.pinned ? 'Unpin' : 'Pin'}>
              <IconButton
                size="1"
                variant="ghost"
                className={item.pinned ? '!text-red-500 hover:!text-red-400' : '!text-zinc-400 hover:!text-zinc-300'}
                onClick={() => onPinnedToggle(item.id, !item.pinned)}
              >
                <FaThumbtack />
              </IconButton>
            </Tooltip>
          </Box>
        ) : null}
        <Box className="absolute right-3 top-1/2 -translate-y-1/2">
          <Tooltip content={isArchiveMode ? 'Delete permanently' : 'Archive'}>
            <IconButton
              size="1"
              variant="ghost"
              className="hidden text-zinc-300 md:inline-flex md:invisible md:opacity-0 md:pointer-events-none md:transition-opacity md:group-hover:visible md:group-hover:opacity-100 md:group-hover:pointer-events-auto md:group-focus-within:visible md:group-focus-within:opacity-100 md:group-focus-within:pointer-events-auto"
              onClick={() => onRemove(item.id)}
            >
              {isArchiveMode ? <FaTrash /> : <FaMinus />}
            </IconButton>
          </Tooltip>
        </Box>
      </Flex>
    </li>
  );
};

export default CarrotList;
