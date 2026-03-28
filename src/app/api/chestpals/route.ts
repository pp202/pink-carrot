import { disconnectConnections, getChestpalsData, updateConnectionAlias } from "@/backend/user";
import { NextResponse } from "next/server";

export async function GET() {
  const data = await getChestpalsData();
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => null);
  const connectionIds = Array.isArray(body?.connectionIds)
    ? body.connectionIds.filter((id: unknown) => typeof id === "number")
    : [];

  const disconnected = await disconnectConnections(connectionIds);

  return NextResponse.json({ disconnected });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const connectionId = typeof body?.connectionId === "number" ? body.connectionId : Number.NaN;
  const alias = typeof body?.alias === "string" ? body.alias : "";

  if (!Number.isFinite(connectionId)) {
    return NextResponse.json({ error: "Invalid connectionId" }, { status: 400 });
  }

  try {
    const updatedAlias = await updateConnectionAlias(connectionId, alias);
    return NextResponse.json({ alias: updatedAlias });
  } catch {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }
}
