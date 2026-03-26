import { setCarrotHarvested } from "@/backend/lists";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  if (typeof body?.harvested !== "boolean") {
    return NextResponse.json({ message: "Invalid harvested value" }, { status: 400 });
  }

  const updated = await setCarrotHarvested(parseInt(id), body.harvested);
  if (updated.count === 0) {
    return NextResponse.json({ message: "Carrot not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Carrot updated" }, { status: 200 });
}
