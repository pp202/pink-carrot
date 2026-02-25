import { NextRequest, NextResponse } from "next/server"
import { prisma}  from "@/config/prisma"
import { loggedUser } from "@/backend/user"
import { createListSchema } from "../../schema/createListSchema"
import { getChests } from "@/backend/lists"

export async function POST(request: NextRequest) {
    const body = await request.json()
    const user = await loggedUser();
    const validation = createListSchema.safeParse(body)
    if (!validation.success)
        return NextResponse.json(validation.error.issues, { status: 400 })
    const newList = await prisma.chest.create({
        data: {
            label: body.name,
            userId: user.id
        }
    })
    return NextResponse.json(newList, { status: 201 })
}

export async function GET(request: NextRequest) {  
  return NextResponse.json(await getChests(), { status: 200 })
}

