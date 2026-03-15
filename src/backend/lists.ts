import { prisma } from '@/config/prisma'
import { loggedUser } from './user';
import { allocateLexoRanks, lexoRankBetween, nextLexoRank } from './lexoRank';


async function rebalanceChestRanks(userId: number, rankField: 'listRank' | 'dashRank') {
    const chests = await prisma.chest.findMany({
        where: {
            userId,
            status: 'NEW',
        },
        select: {
            id: true,
            listRank: true,
            dashRank: true,
        },
        orderBy: [
            { [rankField]: 'asc' },
            { id: 'asc' },
        ],
    });

    if (chests.length === 0) {
        return;
    }

    const allocatedRanks = allocateLexoRanks(chests.length);

    await prisma.$transaction(
        chests.map((chest, index) =>
            prisma.chest.updateMany({
                where: {
                    id: chest.id,
                    userId,
                    status: 'NEW',
                },
                data: {
                    [rankField]: allocatedRanks[index],
                },
            }),
        ),
    );
}

export async function getChests() {
    const user = await loggedUser();
    return prisma.chest.findMany({
        where: {
            userId: user.id,
            status: 'NEW',
        },
        orderBy: [
            { listRank: 'asc' },
            { id: 'asc' },
        ],
    })
}

export async function getArchivedChests() {
    const user = await loggedUser();
    return prisma.chest.findMany({
        where: {
            userId: user.id,
            status: 'ARCHIVED',
        },
        orderBy: [
            { listRank: 'asc' },
            { id: 'asc' },
        ],
    })
}

export async function getPinnedChestsWithCarrots() {
    const user = await loggedUser();
    return prisma.chest.findMany({
        where: {
            userId: user.id,
            pinned: true,
            status: 'NEW',
        },
        include: {
            carrots: {
                orderBy: {
                    id: 'asc',
                },
            },
        },
        orderBy: [
            { dashRank: 'asc' },
            { id: 'asc' },
        ],
    })
}

export async function getChest(id: number) {
    const user = await loggedUser();
    return prisma.chest.findFirst({
        where: {
            id: id,
            userId: user.id,
            status: 'NEW',
        },
        include: {
            carrots: {
                select: {
                    label: true,
                    harvested: true,
                },
                orderBy: {
                    id: 'asc',
                },
            },
        },
    })
}

export async function updateChest(
    id: number,
    name: string,
    carrots: Array<{ label: string; harvested?: boolean }>
) {
    const user = await loggedUser();

    const existing = await prisma.chest.findFirst({
        where: {
            id,
            userId: user.id,
            status: 'NEW',
        },
        select: {
            id: true,
        },
    });

    if (!existing) {
        return null;
    }

    return prisma.chest.update({
        where: {
            id,
        },
        data: {
            label: name,
            carrots: {
                deleteMany: {},
                create: carrots.map((carrot) => ({
                    label: carrot.label,
                    harvested: carrot.harvested ?? false,
                })),
            },
        },
        include: {
            carrots: {
                select: {
                    label: true,
                    harvested: true,
                },
                orderBy: {
                    id: 'asc',
                },
            },
        },
    });
}

export async function setCarrotHarvested(carrotId: bigint, harvested: boolean) {
    const user = await loggedUser();

    return prisma.carrot.updateMany({
        where: {
            id: carrotId,
            chest: {
                userId: user.id,
                status: 'NEW',
            },
        },
        data: {
            harvested,
        },
    });
}

export async function archiveList(id: number) {
    const user = await loggedUser();
    return prisma.chest.updateMany({
        where: {
            id,
            userId: user.id,
            status: 'NEW',
        },
        data: {
            status: 'ARCHIVED',
        },
    });
}

export async function unarchiveList(id: number) {
    const user = await loggedUser();
    return prisma.chest.updateMany({
        where: {
            id,
            userId: user.id,
            status: 'ARCHIVED',
        },
        data: {
            status: 'NEW',
        },
    });
}

export async function setPinned(id: number, pinned: boolean) {
    const user = await loggedUser();
    return prisma.chest.updateMany({
        where: {
            id,
            userId: user.id,
            status: 'NEW',
        },
        data: {
            pinned,
        },
    })
}

export async function deleteArchivedList(id: number) {
    const user = await loggedUser();

    const deletedCarrots = await prisma.carrot.deleteMany({
        where: {
            chestId: id,
            chest: {
                userId: user.id,
                status: 'ARCHIVED',
            },
        },
    });

    const deletedChests = await prisma.chest.deleteMany({
        where: {
            id,
            userId: user.id,
            status: 'ARCHIVED',
        },
    });

    return {
        deletedChests,
        deletedCarrots,
    };
}

export async function cloneChest(id: number) {
    const user = await loggedUser();

    const chest = await prisma.chest.findFirst({
        where: {
            id,
            userId: user.id,
            status: 'NEW',
        },
        include: {
            carrots: {
                orderBy: {
                    id: 'asc',
                },
            },
        },
    });

    if (!chest) {
        return null;
    }

    const [lastListRankedChest, lastDashRankedChest] = await Promise.all([
        prisma.chest.findFirst({
            where: {
                userId: user.id,
            },
            select: {
                listRank: true,
            },
            orderBy: [
                { listRank: 'desc' },
                { id: 'desc' },
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
                { dashRank: 'desc' },
                { id: 'desc' },
            ],
        }),
    ]);

    return prisma.chest.create({
        data: {
            label: `${chest.label} (Copy)`,
            status: 'NEW',
            pinned: false,
            userId: user.id,
            listRank: nextLexoRank(lastListRankedChest?.listRank),
            dashRank: nextLexoRank(lastDashRankedChest?.dashRank),
            carrots: {
                create: chest.carrots.map((carrot) => ({
                    label: carrot.label,
                    harvested: carrot.harvested,
                })),
            },
        },
    });
}

export async function moveChestBetween(
    chestId: number,
    previousChestId: number | null,
    nextChestId: number | null,
    rankField: 'listRank' | 'dashRank' = 'listRank',
) {
    const user = await loggedUser();

    const idsToLoad = [chestId, previousChestId, nextChestId].filter(
        (id): id is number => typeof id === 'number',
    );

    const chests = await prisma.chest.findMany({
        where: {
            userId: user.id,
            status: 'NEW',
            id: {
                in: idsToLoad,
            },
        },
        select: {
            id: true,
            listRank: true,
            dashRank: true,
        },
    });

    const chestById = new Map(chests.map((chest) => [chest.id, chest]));

    if (!chestById.has(chestId)) {
        return false;
    }

    const previousRank = previousChestId === null
        ? null
        : chestById.get(previousChestId)?.[rankField];

    const nextRank = nextChestId === null
        ? null
        : chestById.get(nextChestId)?.[rankField];

    if ((previousChestId !== null && !previousRank) || (nextChestId !== null && !nextRank)) {
        return false;
    }

    let nextRankValue: string;

    try {
        nextRankValue = lexoRankBetween(previousRank, nextRank);
    } catch {
        await rebalanceChestRanks(user.id, rankField);

        const refreshedChests = await prisma.chest.findMany({
            where: {
                userId: user.id,
                status: 'NEW',
                id: {
                    in: idsToLoad,
                },
            },
            select: {
                id: true,
                listRank: true,
                dashRank: true,
            },
        });

        const refreshedById = new Map(refreshedChests.map((chest) => [chest.id, chest]));
        const refreshedPreviousRank = previousChestId === null
            ? null
            : refreshedById.get(previousChestId)?.[rankField];
        const refreshedNextRank = nextChestId === null
            ? null
            : refreshedById.get(nextChestId)?.[rankField];

        if ((previousChestId !== null && !refreshedPreviousRank) || (nextChestId !== null && !refreshedNextRank)) {
            return false;
        }

        try {
            nextRankValue = lexoRankBetween(refreshedPreviousRank, refreshedNextRank);
        } catch {
            return false;
        }
    }

    await prisma.chest.updateMany({
        where: {
            id: chestId,
            userId: user.id,
            status: 'NEW',
        },
        data: {
            [rankField]: nextRankValue,
        },
    });

    return true;
}
