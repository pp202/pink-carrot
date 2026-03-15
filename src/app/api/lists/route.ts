import { NextRequest, NextResponse } from "next/server"
import { prisma}  from "@/config/prisma"
import { loggedUser } from "@/backend/user"
import { createListSchema } from "../../schema/createListSchema"
import { getArchivedChests, getChests, moveChestBetween } from "@/backend/lists"
import { nextLexoRank } from "@/backend/lexoRank"

export async function POST(request: NextRequest) {
    const body = await request.json()
    const user = await loggedUser();
    const validation = createListSchema.safeParse(body)
    if (!validation.success)
        return NextResponse.json(validation.error.issues, { status: 400 })

    const [lastListRankedChest, lastDashRankedChest] = await Promise.all([
        prisma.chest.findFirst({
            where: {
                userId: user.id,
            },
            select: {
                listRank: true,
            },
            orderBy: [
                { listRank: "desc" },
                { id: "desc" },
            ],
        }),
        prisma.chest.findFirst({
            where: {
                userId: user.id,
            },
            select: {
                dashRank: true,
            },
            orderBy: [
                { dashRank: "desc" },
                { id: "desc" },
            ],
        }),
    ]);

    const newList = await prisma.chest.create({
        data: {
            label: validation.data.name,
            userId: user.id,
            pinned: validation.data.pinned,
            listRank: nextLexoRank(lastListRankedChest?.listRank),
            dashRank: nextLexoRank(lastDashRankedChest?.dashRank),
            carrots: {
                create: validation.data.carrots.map((carrot) => ({
                    label: carrot.label,
                    harvested: carrot.harvested,
                })),
            },
        }
    })
    return NextResponse.json(newList, { status: 201 })
}



export async function PATCH(request: NextRequest) {
  const body = await request.json();

  const chestId = body?.chestId;
  const previousChestId = body?.previousChestId ?? null;
  const nextChestId = body?.nextChestId ?? null;

  if (!Number.isInteger(chestId)) {
    return NextResponse.json({ message: "Invalid chest id" }, { status: 400 });
  }

  if (previousChestId !== null && !Number.isInteger(previousChestId)) {
    return NextResponse.json({ message: "Invalid previous chest id" }, { status: 400 });
  }

  if (nextChestId !== null && !Number.isInteger(nextChestId)) {
    return NextResponse.json({ message: "Invalid next chest id" }, { status: 400 });
  }

  if (chestId === previousChestId || chestId === nextChestId) {
    return NextResponse.json({ message: "Invalid reorder bounds" }, { status: 400 });
  }

  const reordered = await moveChestBetween(chestId, previousChestId, nextChestId);

  if (!reordered) {
    return NextResponse.json({ message: "Unable to reorder chest" }, { status: 404 });
  }

  return NextResponse.json({ message: "Chest reordered" }, { status: 200 });
}

export async function GET(request: NextRequest) {  
  const status = request.nextUrl.searchParams.get('status');
  if (status === 'ARCHIVED') {
    return NextResponse.json(await getArchivedChests(), { status: 200 })
  }

  return NextResponse.json(await getChests(), { status: 200 })
}
