import { prisma } from '@/config/prisma'
import { loggedUser } from './user';
import { allocateLexoRanks, lexoRankBetween, nextLexoRank } from './lexoRank';

function toChestPadId(id: number): bigint {
    return BigInt(id);
}

function serializeChestPad(chestPad: {
    id: bigint;
    status: 'NEW' | 'ARCHIVED';
    pinned: boolean;
    listRank: string;
    dashRank: string;
    chest: {
        id: number;
        label: string;
        createdAt: Date;
        carrots?: Array<{ id: bigint; label: string; harvested: boolean }>;
    };
}) {
    return {
        id: Number(chestPad.id),
        chestId: chestPad.chest.id,
        label: chestPad.chest.label,
        createdAt: chestPad.chest.createdAt,
        status: chestPad.status,
        pinned: chestPad.pinned,
        listRank: chestPad.listRank,
        dashRank: chestPad.dashRank,
        carrots: (chestPad.chest.carrots ?? []).map((carrot) => ({
            id: Number(carrot.id),
            label: carrot.label,
            harvested: carrot.harvested,
        })),
    };
}

async function rebalanceChestRanks(userId: number, rankField: 'listRank' | 'dashRank') {
    const chestPads = await prisma.chestPad.findMany({
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

    if (chestPads.length === 0) {
        return;
    }

    const allocatedRanks = allocateLexoRanks(chestPads.length);

    await prisma.$transaction(
        chestPads.map((chestPad, index) =>
            prisma.chestPad.updateMany({
                where: {
                    id: chestPad.id,
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
    const chestPads = await prisma.chestPad.findMany({
        where: {
            userId: user.id,
            status: 'NEW',
        },
        include: {
            chest: true,
        },
        orderBy: [
            { listRank: 'asc' },
            { id: 'asc' },
        ],
    });

    return chestPads.map(serializeChestPad);
}

export async function getArchivedChests() {
    const user = await loggedUser();
    const chestPads = await prisma.chestPad.findMany({
        where: {
            userId: user.id,
            status: 'ARCHIVED',
        },
        include: {
            chest: true,
        },
        orderBy: [
            { listRank: 'asc' },
            { id: 'asc' },
        ],
    });

    return chestPads.map(serializeChestPad);
}

export async function getPinnedChestsWithCarrots() {
    const user = await loggedUser();
    const chestPads = await prisma.chestPad.findMany({
        where: {
            userId: user.id,
            pinned: true,
            status: 'NEW',
        },
        include: {
            chest: {
                include: {
                    carrots: {
                        orderBy: {
                            id: 'asc',
                        },
                    },
                },
            },
        },
        orderBy: [
            { dashRank: 'asc' },
            { id: 'asc' },
        ],
    });

    return chestPads.map(serializeChestPad);
}

export async function getChest(id: number) {
    const user = await loggedUser();
    const chestPad = await prisma.chestPad.findFirst({
        where: {
            id: toChestPadId(id),
            userId: user.id,
            status: 'NEW',
        },
        include: {
            chest: {
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
            },
        },
    });

    if (!chestPad) {
        return null;
    }

    return {
        id: Number(chestPad.id),
        label: chestPad.chest.label,
        carrots: chestPad.chest.carrots,
    };
}

export async function updateChest(
    id: number,
    name: string,
    carrots: Array<{ label: string; harvested?: boolean }>
) {
    const user = await loggedUser();

    const chestPad = await prisma.chestPad.findFirst({
        where: {
            id: toChestPadId(id),
            userId: user.id,
            status: 'NEW',
        },
        select: {
            chestId: true,
        },
    });

    if (!chestPad) {
        return null;
    }

    const updatedChest = await prisma.chest.update({
        where: {
            id: chestPad.chestId,
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

    return {
        id,
        label: updatedChest.label,
        carrots: updatedChest.carrots,
    };
}

export async function setCarrotHarvested(carrotId: bigint, harvested: boolean) {
    const user = await loggedUser();

    return prisma.carrot.updateMany({
        where: {
            id: carrotId,
            chest: {
                chestPads: {
                    some: {
                        userId: user.id,
                        status: 'NEW',
                    },
                },
            },
        },
        data: {
            harvested,
        },
    });
}

export async function archiveList(id: number) {
    const user = await loggedUser();
    return prisma.chestPad.updateMany({
        where: {
            id: toChestPadId(id),
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
    return prisma.chestPad.updateMany({
        where: {
            id: toChestPadId(id),
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
    return prisma.chestPad.updateMany({
        where: {
            id: toChestPadId(id),
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

    const chestPad = await prisma.chestPad.findFirst({
        where: {
            id: toChestPadId(id),
            userId: user.id,
            status: 'ARCHIVED',
        },
        select: {
            id: true,
            chestId: true,
        },
    });

    if (!chestPad) {
        return {
            deletedChests: { count: 0 },
            deletedCarrots: { count: 0 },
        };
    }

    const result = await prisma.$transaction(async (tx) => {
        await tx.chestPad.delete({
            where: {
                id: chestPad.id,
            },
        });

        const remainingRefs = await tx.chestPad.count({
            where: {
                chestId: chestPad.chestId,
            },
        });

        if (remainingRefs > 0) {
            return {
                deletedChests: { count: 1 },
                deletedCarrots: { count: 0 },
            };
        }

        const deletedCarrots = await tx.carrot.deleteMany({
            where: {
                chestId: chestPad.chestId,
            },
        });

        const deletedChests = await tx.chest.deleteMany({
            where: {
                id: chestPad.chestId,
            },
        });

        return {
            deletedChests,
            deletedCarrots,
        };
    });

    return result;
}

export async function cloneChest(id: number) {
    const user = await loggedUser();

    const chestPad = await prisma.chestPad.findFirst({
        where: {
            id: toChestPadId(id),
            userId: user.id,
            status: 'NEW',
        },
        include: {
            chest: {
                include: {
                    carrots: {
                        orderBy: {
                            id: 'asc',
                        },
                    },
                },
            },
        },
    });

    if (!chestPad) {
        return null;
    }

    const [lastListRankedChestPad, lastDashRankedChestPad] = await Promise.all([
        prisma.chestPad.findFirst({
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
        prisma.chestPad.findFirst({
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

    const cloned = await prisma.chestPad.create({
        data: {
            status: 'NEW',
            pinned: false,
            user: {
                connect: {
                    id: user.id,
                },
            },
            listRank: nextLexoRank(lastListRankedChestPad?.listRank),
            dashRank: nextLexoRank(lastDashRankedChestPad?.dashRank),
            chest: {
                create: {
                    label: `${chestPad.chest.label} (Copy)`,
                    carrots: {
                        create: chestPad.chest.carrots.map((carrot) => ({
                            label: carrot.label,
                            harvested: carrot.harvested,
                        })),
                    },
                },
            },
        },
        include: {
            chest: {
                include: {
                    carrots: {
                        orderBy: {
                            id: 'asc',
                        },
                    },
                },
            },
        },
    });

    return serializeChestPad(cloned);
}

export async function moveChestBetween(
    chestId: number,
    previousChestId: number | null,
    nextChestId: number | null,
    rankField: 'listRank' | 'dashRank' = 'listRank',
) {
    const user = await loggedUser();

    const idsToLoad = [chestId, previousChestId, nextChestId]
        .filter((id): id is number => typeof id === 'number')
        .map((id) => toChestPadId(id));

    const chestPads = await prisma.chestPad.findMany({
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

    const chestById = new Map(chestPads.map((chest) => [Number(chest.id), chest]));

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

        const refreshedChests = await prisma.chestPad.findMany({
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

        const refreshedById = new Map(refreshedChests.map((chest) => [Number(chest.id), chest]));
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

    await prisma.chestPad.updateMany({
        where: {
            id: toChestPadId(chestId),
            userId: user.id,
            status: 'NEW',
        },
        data: {
            [rankField]: nextRankValue,
        },
    });

    return true;
}
