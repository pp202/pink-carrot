import { deleteList, setPinned } from "@/backend/lists";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await deleteList(parseInt(id));
  if (deleted.count === 0) {
    return NextResponse.json({ message: "List not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "List deleted" }, { status: 200 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

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
