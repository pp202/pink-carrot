import { deleteList } from "@/backend/lists";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest , { params }: { params: { id: string } } ) {
    const deleted = await deleteList(parseInt(params.id));
    if (deleted.count === 0) {
        return NextResponse.json({ message: 'List not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'List deleted' }, { status: 200 });
  }
  
