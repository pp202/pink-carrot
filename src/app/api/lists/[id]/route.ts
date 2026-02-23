import { deleteList } from "@/backend/lists";
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
  
