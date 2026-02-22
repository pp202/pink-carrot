import { deleteList } from "@/backend/lists";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest , { params }: { params: { id: string } } ) {
    const list = deleteList(parseInt(params.id))
    if (!list)
        return NextResponse.json({message: 'List not found'}, { status: 400 })
    return NextResponse.json({message: 'List not found'}, { status: 200 });
  }
  