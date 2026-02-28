import { NextRequest, NextResponse } from "next/server"
import { prisma}  from "@/config/prisma"
import { loggedUser } from "@/backend/user"
import { createListSchema } from "../../schema/createListSchema"
import { getArchivedChests, getChests } from "@/backend/lists"

export async function POST(request: NextRequest) {
    const body = await request.json()
    const user = await loggedUser();
    const validation = createListSchema.safeParse(body)
    if (!validation.success)
        return NextResponse.json(validation.error.issues, { status: 400 })

    const newList = await prisma.chest.create({
        data: {
            label: validation.data.name,
            userId: user.id,
            pinned: validation.data.pinned,
            carrots: {
                create: validation.data.carrots.map((carrot) => ({
                    label: carrot.label,
                })),
            },
        }
    })
    return NextResponse.json(newList, { status: 201 })
}

export async function GET(request: NextRequest) {  
  const status = request.nextUrl.searchParams.get('status');
  if (status === 'ARCHIVED') {
    return NextResponse.json(await getArchivedChests(), { status: 200 })
  }

  return NextResponse.json(await getChests(), { status: 200 })
}
