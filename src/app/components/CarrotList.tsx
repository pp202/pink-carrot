'use client';

import { Chest } from '@/app/generated/prisma/client';
import { Box, Flex, IconButton, Tooltip, Text } from '@radix-ui/themes';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { FaArchive, FaThumbtack } from 'react-icons/fa';

const CarrotList = () => {
  const [state, setState] = useState<Chest[]>([]);

  useEffect(() => {
    fetch('/api/lists', { cache: 'no-cache' })
      .then((res) => res.json())
      .then((data) => setState(data));
  }, []);

  function handleRemove(id: number): void {
    axios.delete(`/api/lists/${id}`).then(() => {
      const newState = state.filter((item) => item.id !== id);
      setState(newState);
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
    <Carrots
      carrotList={state}
      onRemove={handleRemove}
      onPinnedToggle={handlePinnedToggle}
    />
  );
};

const Carrots = ({
  carrotList,
  onRemove,
  onPinnedToggle,
}: {
  carrotList: Chest[];
  onRemove: (id: number) => void;
  onPinnedToggle: (id: number, pinned: boolean) => void;
}) => {
  if (carrotList.length === 0) {
    return <p className="text-center text-sm text-zinc-400">No lists yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {carrotList.map((item) => (
        <li
          key={item.id}
          className="rounded-xl border border-zinc-600/40 bg-zinc-900/70 px-4 py-3"
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
                  className={item.pinned ? 'text-red-500' : 'text-zinc-400'}
                  onClick={() => onPinnedToggle(item.id, !item.pinned)}
                >
                  <FaThumbtack />
                </IconButton>
              </Tooltip>
            </Box>
            <Box>
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
      ))}
    </ul>
  );
};

export default CarrotList;
