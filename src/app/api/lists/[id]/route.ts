import { archiveList, deleteArchivedList, setPinned, unarchiveList } from "@/backend/lists";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await deleteArchivedList(parseInt(id));
  if (deleted.deletedChests.count === 0) {
    return NextResponse.json({ message: "Archived list not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Archived list deleted" }, { status: 200 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  if (body?.status === "ARCHIVED") {
    const archived = await archiveList(parseInt(id));
    if (archived.count === 0) {
      return NextResponse.json({ message: "List not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "List archived" }, { status: 200 });
  }

  if (body?.status === "NEW") {
    const unarchived = await unarchiveList(parseInt(id));
    if (unarchived.count === 0) {
      return NextResponse.json({ message: "List not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "List restored" }, { status: 200 });
  }

  if (typeof body?.pinned !== "boolean") {
    return NextResponse.json(
      { message: "Invalid pinned value" },
      { status: 400 }
    );
  }

  const updated = await setPinned(parseInt(id), body.pinned);
  if (updated.count === 0) {
    return NextResponse.json({ message: "List not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "List updated" }, { status: 200 });
}
