import { disconnectConnections, getChestpalsData } from "@/backend/user";
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
