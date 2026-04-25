import { NextRequest, NextResponse } from "next/server"
import { prisma}  from "@/config/prisma"
import { loggedUser } from "@/backend/user"
import { createListSchema } from "../../schema/createListSchema"
import { getArchivedChests, getChests, getPinnedChestsWithCarrots, moveChestBetween } from "@/backend/lists"
import { nextLexoRank } from "@/backend/lexoRank"
import { resolveDashboardId } from "@/backend/dashboards"

export async function POST(request: NextRequest) {
    const body = await request.json()
    const user = await loggedUser();
    const validation = createListSchema.safeParse(body)
    if (!validation.success)
        return NextResponse.json(validation.error.issues, { status: 400 })

    const selectedDashboardId = await resolveDashboardId(
      Number.isInteger(body?.dashboardId) ? body.dashboardId : null,
    );

    const lastDashRankedChestPad = await prisma.chestPad.findFirst({
        where: {
            userId: user.id,
            dashboardId: selectedDashboardId,
        },
        select: {
            dashRank: true,
        },
        orderBy: [
            { dashRank: "desc" },
            { id: "desc" },
        ],
    });

    const newList = await prisma.chestPad.create({
        data: {
            user: {
                connect: {
                    id: user.id,
                },
            },
            status: "NEW",
            pinned: validation.data.pinned,
            dashboard: {
                connect: {
                    id: selectedDashboardId,
                },
            },
            dashRank: nextLexoRank(lastDashRankedChestPad?.dashRank),
            chest: {
                create: {
                    label: validation.data.name,
                    carrots: {
                        create: validation.data.carrots.map((carrot) => ({
                            label: carrot.label,
                            harvested: carrot.harvested,
                        })),
                    },
                },
            }
        },
        include: {
            chest: true,
        }
    })
    return NextResponse.json({
      id: Number(newList.id),
      chestId: newList.chest.id,
      label: newList.chest.label,
      createdAt: newList.chest.createdAt,
      status: newList.status,
      pinned: newList.pinned,
      dashRank: newList.dashRank,
    }, { status: 201 })
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
  const pinned = request.nextUrl.searchParams.get('pinned');
  const dashboardIdParam = request.nextUrl.searchParams.get('dashboardId');
  const dashboardId = dashboardIdParam ? Number.parseInt(dashboardIdParam, 10) : undefined;
  if (status === 'ARCHIVED') {
    return NextResponse.json(await getArchivedChests(dashboardId), { status: 200 })
  }

  if (pinned === 'true') {
    return NextResponse.json(await getPinnedChestsWithCarrots(dashboardId), { status: 200 })
  }

  return NextResponse.json(await getChests(dashboardId), { status: 200 })
}
