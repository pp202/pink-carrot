import { createConnectionRequest } from "@/backend/user";
import { NextResponse } from "next/server";

export async function POST() {
  const requestId = await createConnectionRequest();

  return NextResponse.json({ requestId });
}
