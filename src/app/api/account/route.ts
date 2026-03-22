import { deleteUserAccount } from "@/backend/user";
import { NextResponse } from "next/server";

export async function DELETE() {
  const deletedAccount = await deleteUserAccount();

  if (!deletedAccount) {
    return NextResponse.json({ message: "Account not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Account deleted" }, { status: 200 });
}
