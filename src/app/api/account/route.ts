import { deleteUserAccount, getUserProfile, updateAlias } from "@/backend/user";
import { NextResponse } from "next/server";

export async function GET() {
  const profile = await getUserProfile();
  return NextResponse.json(profile);
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const alias = typeof body?.alias === "string" ? body.alias : "";

  const updatedAlias = await updateAlias(alias);

  return NextResponse.json({ alias: updatedAlias });
}

export async function DELETE() {
  const deletedAccount = await deleteUserAccount();

  if (!deletedAccount) {
    return NextResponse.json({ message: "Account not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Account deleted" }, { status: 200 });
}
