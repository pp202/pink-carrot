'use client';

import { Chest } from '@/app/generated/prisma/client';
import Spinner from '@/app/components/Spinner';
import { Box, Flex, IconButton, Tooltip, Text } from '@radix-ui/themes';
import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { FaArchive, FaThumbtack } from 'react-icons/fa';

const SWIPE_DELETE_THRESHOLD = 90;
const UNDO_VISIBLE_MS = 5000;

type RecentlyArchived = {
  chest: Chest;
  index: number;
};

const CarrotList = () => {
  const [state, setState] = useState<Chest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recentlyArchived, setRecentlyArchived] =
    useState<RecentlyArchived | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/api/lists', { cache: 'no-cache' })
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

  function queueUndoBanner(chest: Chest, index: number): void {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }

    setRecentlyArchived({ chest, index });
    undoTimerRef.current = setTimeout(() => {
      setRecentlyArchived(null);
      undoTimerRef.current = null;
    }, UNDO_VISIBLE_MS);
  }

  function handleArchive(id: number): void {
    const archivedItem = state.find((item) => item.id === id);
    if (!archivedItem) {
      return;
    }

    const archivedIndex = state.findIndex((item) => item.id === id);

    axios.patch(`/api/lists/${id}`, { status: 'ARCHIVED' }).then(() => {
      setState((previous) => previous.filter((item) => item.id !== id));
      queueUndoBanner(archivedItem, archivedIndex);
    });
  }

  function handleUndoArchive(): void {
    if (!recentlyArchived) {
      return;
    }

    const { chest, index } = recentlyArchived;
    axios.patch(`/api/lists/${chest.id}`, { status: 'NEW' }).then(() => {
      setState((previous) => {
        if (previous.some((item) => item.id === chest.id)) {
          return previous;
        }

        const restored: Chest = { ...chest, status: 'NEW' as Chest['status'] };
        const insertAt = Math.min(Math.max(index, 0), previous.length);

        return [
          ...previous.slice(0, insertAt),
          restored,
          ...previous.slice(insertAt),
        ];
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
      {recentlyArchived ? (
        <div className="mb-3 rounded-lg border border-zinc-600/40 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-200">
          Archived "{recentlyArchived.chest.label}".{' '}
          <button
            type="button"
            className="underline underline-offset-2 hover:text-zinc-100"
            onClick={handleUndoArchive}
          >
            Undo
          </button>
        </div>
      ) : null}
      <Carrots
        carrotList={state}
        isLoading={isLoading}
        onRemove={handleArchive}
        onPinnedToggle={handlePinnedToggle}
      />
    </>
  );
};

const Carrots = ({
  carrotList,
  isLoading,
  onRemove,
  onPinnedToggle,
}: {
  carrotList: Chest[];
  isLoading: boolean;
  onRemove: (id: number) => void;
  onPinnedToggle: (id: number, pinned: boolean) => void;
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-zinc-300">
        <Spinner />
        <span>Loading lists...</span>
      </div>
    );
  }

  const activeCarrotList = carrotList.filter((item) => item.status === 'NEW');

  if (activeCarrotList.length === 0) {
    return <p className="text-center text-sm text-zinc-400">No lists yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {activeCarrotList.map((item) => (
        <CarrotListItem
          key={item.id}
          item={item}
          onRemove={onRemove}
          onPinnedToggle={onPinnedToggle}
        />
      ))}
    </ul>
  );
};

const CarrotListItem = ({
  item,
  onRemove,
  onPinnedToggle,
}: {
  item: Chest;
  onRemove: (id: number) => void;
  onPinnedToggle: (id: number, pinned: boolean) => void;
}) => {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);
  const [touchDeltaY, setTouchDeltaY] = useState(0);

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
      className="rounded-xl border border-zinc-600/40 bg-zinc-900/70 px-4 py-3 transition-transform duration-150"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ transform: `translateX(${Math.max(-60, Math.min(60, touchDeltaX))}px)` }}
    >
      <Flex className="items-center gap-2">
        <Box className="grow">
          <Text className="text-sm font-medium text-zinc-100">{item.label}</Text>
        </Box>
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
        <Box className="hidden md:block">
          <Tooltip content="Archive">
            <IconButton
              size="1"
              variant="ghost"
              className="text-zinc-300"
              onClick={() => onRemove(item.id)}
            >
              <FaArchive />
            </IconButton>
          </Tooltip>
        </Box>
      </Flex>
    </li>
  );
};

export default CarrotList;
