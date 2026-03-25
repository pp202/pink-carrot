"use client";

import Spinner from "@/app/components/Spinner";
import { AlertDialog, Button, Flex } from "@radix-ui/themes";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { FaRedoAlt, FaTrash } from "react-icons/fa";

const ArchiveList = () => {
  const [state, setState] = useState<ListChest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArchiveIds, setSelectedArchiveIds] = useState<number[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const visibleSelectedArchiveIds = useMemo(
    () => selectedArchiveIds.filter((id) => state.some((item) => item.id === id)),
    [selectedArchiveIds, state],
  );

  useEffect(() => {
    fetch("/api/lists?status=ARCHIVED", { cache: "no-cache" })
      .then((res) => res.json())
      .then((data) => setState(data))
      .finally(() => setIsLoading(false));
  }, []);

  function handleArchiveSelectionToggle(id: number): void {
    setSelectedArchiveIds((previous) =>
      previous.includes(id)
        ? previous.filter((existingId) => existingId !== id)
        : [...previous, id],
    );
  }

  function handleRestoreSelected(): void {
    if (visibleSelectedArchiveIds.length === 0) {
      return;
    }

    const idsToRestore = [...visibleSelectedArchiveIds];
    Promise.all(
      idsToRestore.map((id) => axios.patch(`/api/lists/${id}`, { status: "NEW" })),
    ).then(() => {
      setState((previous) =>
        previous.filter((item) => !idsToRestore.includes(item.id)),
      );
      setSelectedArchiveIds([]);
    });
  }

  function handleDeleteSelected(): void {
    if (visibleSelectedArchiveIds.length === 0) {
      return;
    }
    setIsDeleteDialogOpen(true);
  }

  function confirmDeleteSelected(): void {
    if (visibleSelectedArchiveIds.length === 0) {
      return;
    }

    const idsToDelete = [...visibleSelectedArchiveIds];
    Promise.all(idsToDelete.map((id) => axios.delete(`/api/lists/${id}`))).then(
      () => {
        setState((previous) =>
          previous.filter((item) => !idsToDelete.includes(item.id)),
        );
        setSelectedArchiveIds([]);
        setIsDeleteDialogOpen(false);
      },
    );
  }

  const isArchiveActionDisabled = visibleSelectedArchiveIds.length === 0;
  const isSingleSelectedChest = visibleSelectedArchiveIds.length === 1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-zinc-300">
        <Spinner />
        <span>Loading lists...</span>
      </div>
    );
  }

  if (state.length === 0) {
    return <p className="text-center text-sm text-zinc-400">No archived lists.</p>;
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {state.map((item) => (
          <li
            key={item.id}
            className="relative rounded-xl border border-zinc-600/40 bg-zinc-900/70 px-4 py-4"
          >
            <div className="flex items-center gap-2">
              <p className="grow text-sm font-medium text-zinc-100">{item.label}</p>
              <input
                type="checkbox"
                checked={visibleSelectedArchiveIds.includes(item.id)}
                onChange={() => handleArchiveSelectionToggle(item.id)}
                aria-label={`Select ${item.label}`}
                className="h-4 w-4 cursor-pointer accent-zinc-200"
              />
            </div>
          </li>
        ))}
      </ul>
      <div className="flex justify-center gap-2">
        <Button
          size="2"
          variant="soft"
          color="green"
          disabled={isArchiveActionDisabled}
          onClick={handleRestoreSelected}
        >
          <FaRedoAlt />
          Restore
        </Button>
        <AlertDialog.Root
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialog.Trigger>
            <Button
              size="2"
              variant="soft"
              color="red"
              disabled={isArchiveActionDisabled}
              onClick={handleDeleteSelected}
            >
              <FaTrash />
              Delete
            </Button>
          </AlertDialog.Trigger>
          <AlertDialog.Content maxWidth="28rem">
            <AlertDialog.Title>
              Delete archived list{isSingleSelectedChest ? "" : "s"}?
            </AlertDialog.Title>
            <AlertDialog.Description size="2">
              {isSingleSelectedChest
                ? "This permanently deletes the selected archived list."
                : "This permanently deletes the selected archived lists."}
            </AlertDialog.Description>
            <Flex gap="3" mt="4" justify="end">
              <AlertDialog.Cancel>
                <Button variant="soft" color="red">
                  Cancel
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action>
                <Button variant="solid" color="green" onClick={confirmDeleteSelected}>
                  Confirm delete
                </Button>
              </AlertDialog.Action>
            </Flex>
          </AlertDialog.Content>
        </AlertDialog.Root>
      </div>
    </div>
  );
};

type ListChest = {
  id: number;
  chestId: number;
  label: string;
  createdAt: string;
  status: "NEW" | "ARCHIVED";
  pinned: boolean;
  listRank: string;
  dashRank: string;
};

export default ArchiveList;
