import { prisma } from '@/config/prisma'
import { loggedUser } from './user';
import { allocateLexoRanks, lexoRankBetween, nextLexoRank } from './lexoRank';
import { resolveDashboardId } from './dashboards';

function serializeChestPad(chestPad: {
    id: number;
    status: 'NEW' | 'ARCHIVED';
    pinned: boolean;
    shared: 'NO' | 'SHARED' | 'UNSHARED';
    dashRank: string;
    chest: {
        id: number;
        label: string;
        createdAt: Date;
        carrots?: Array<{ id: number; label: string; harvested: boolean }>;
        _count?: {
            chestPads: number;
        };
    };
    sharedWithAliases?: string[];
}) {
    return {
        id: chestPad.id,
        chestId: chestPad.chest.id,
        label: chestPad.chest.label,
        createdAt: chestPad.chest.createdAt,
        status: chestPad.status,
        pinned: chestPad.pinned,
        dashRank: chestPad.dashRank,
        shared: chestPad.shared,
        sharedWithAliases: chestPad.sharedWithAliases ?? [],
        carrots: (chestPad.chest.carrots ?? []).map((carrot) => ({
            id: carrot.id,
            label: carrot.label,
            harvested: carrot.harvested,
        })),
    };
}

async function hydrateSharedAliasesForUser<T extends { chestId: number; userId: number }>(
    userId: number,
    chestPads: T[],
) {
    const relatedUserIds = Array.from(
        new Set(
            chestPads
                .map((chestPad) => chestPad.userId)
                .filter((relatedUserId) => relatedUserId !== userId),
        ),
    );

    if (relatedUserIds.length === 0) {
        return new Map<number, string>();
    }

    const connections = await prisma.connection.findMany({
        where: {
            userId,
            connectionUserId: {
                in: relatedUserIds,
            },
        },
        select: {
            connectionUserId: true,
            alias: true,
        },
    });

    return new Map(
        connections.map((connection) => [
            connection.connectionUserId,
            connection.alias?.trim() ? connection.alias : "Chest wizard",
        ]),
    );
}

async function rebalanceChestRanks(userId: number, dashboardId: number) {
    const chestPads = await prisma.chestPad.findMany({
        where: {
            userId,
            status: 'NEW',
            dashboardId,
        },
        select: {
            id: true,
            dashRank: true,
        },
        orderBy: [
            { dashRank: 'asc' },
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
                    dashRank: allocatedRanks[index],
                },
            }),
        ),
    );
}

export async function getChests(dashboardId?: number) {
    const user = await loggedUser();
    const selectedDashboardId = await resolveDashboardId(dashboardId);
    const chestPads = await prisma.chestPad.findMany({
        where: {
            userId: user.id,
            status: 'NEW',
            dashboardId: selectedDashboardId,
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

    const chestIds = chestPads.map((chestPad) => chestPad.chestId);
    const sharedPads = chestIds.length > 0
        ? await prisma.chestPad.findMany({
            where: {
                chestId: {
                    in: chestIds,
                },
                status: "NEW",
            },
            select: {
                chestId: true,
                userId: true,
            },
        })
        : [];
    const aliasByUserId = await hydrateSharedAliasesForUser(user.id, sharedPads);

    const sharedAliasesByChestId = new Map<number, string[]>();
    for (const sharedPad of sharedPads) {
        if (sharedPad.userId === user.id) {
            continue;
        }

        const alias = aliasByUserId.get(sharedPad.userId);
        if (!alias) {
            continue;
        }

        const existing = sharedAliasesByChestId.get(sharedPad.chestId) ?? [];
        if (!existing.includes(alias)) {
            existing.push(alias);
        }
        sharedAliasesByChestId.set(sharedPad.chestId, existing);
    }

    return chestPads.map((chestPad) =>
        serializeChestPad({
            ...chestPad,
            sharedWithAliases: sharedAliasesByChestId.get(chestPad.chestId) ?? [],
        }),
    );
}

export async function getArchivedChests(dashboardId?: number) {
    const user = await loggedUser();
    const selectedDashboardId = await resolveDashboardId(dashboardId);
    const chestPads = await prisma.chestPad.findMany({
        where: {
            userId: user.id,
            status: 'ARCHIVED',
            dashboardId: selectedDashboardId,
        },
        include: {
            chest: {
                include: {
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

export async function getPinnedChestsWithCarrots(dashboardId?: number) {
    const user = await loggedUser();
    const selectedDashboardId = await resolveDashboardId(dashboardId);
    const chestPads = await prisma.chestPad.findMany({
        where: {
            userId: user.id,
            pinned: true,
            status: 'NEW',
            dashboardId: selectedDashboardId,
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

    const chestIds = chestPads.map((chestPad) => chestPad.chestId);
    const sharedPads = chestIds.length > 0
        ? await prisma.chestPad.findMany({
            where: {
                chestId: {
                    in: chestIds,
                },
                status: "NEW",
            },
            select: {
                chestId: true,
                userId: true,
            },
        })
        : [];
    const aliasByUserId = await hydrateSharedAliasesForUser(user.id, sharedPads);

    const sharedAliasesByChestId = new Map<number, string[]>();
    for (const sharedPad of sharedPads) {
        if (sharedPad.userId === user.id) {
            continue;
        }

        const alias = aliasByUserId.get(sharedPad.userId);
        if (!alias) {
            continue;
        }

        const existing = sharedAliasesByChestId.get(sharedPad.chestId) ?? [];
        if (!existing.includes(alias)) {
            existing.push(alias);
        }
        sharedAliasesByChestId.set(sharedPad.chestId, existing);
    }

    return chestPads.map((chestPad) =>
        serializeChestPad({
            ...chestPad,
            sharedWithAliases: sharedAliasesByChestId.get(chestPad.chestId) ?? [],
        }),
    );
}

export async function getChest(id: number) {
    const user = await loggedUser();
    const chestPad = await prisma.chestPad.findFirst({
        where: {
            id,
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
        id: chestPad.id,
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
            id,
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

export async function setCarrotHarvested(carrotId: number, harvested: boolean) {
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
    return prisma.chestPad.updateMany({
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
    return prisma.chestPad.updateMany({
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

    const chestPad = await prisma.chestPad.findFirst({
        where: {
            id,
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
            await tx.chestPad.updateMany({
                where: {
                    chestId: chestPad.chestId,
                },
                data: {
                    shared: remainingRefs > 1 ? 'SHARED' : 'UNSHARED',
                },
            });

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
            id,
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
                    _count: {
                        select: {
                            chestPads: true,
                        },
                    },
                },
            },
        },
    });

    if (!chestPad) {
        return null;
    }

    const lastDashRankedChestPad = await prisma.chestPad.findFirst({
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
    });

    const cloned = await prisma.chestPad.create({
        data: {
            status: 'NEW',
            pinned: false,
            user: {
                connect: {
                    id: user.id,
                },
            },
            dashboard: {
                connect: {
                    id: chestPad.dashboardId,
                },
            },
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

export async function getChestShareTargets(id: number) {
    const user = await loggedUser();

    const chestPad = await prisma.chestPad.findFirst({
        where: {
            id,
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

    const [connections, sharedPads] = await Promise.all([
        prisma.connection.findMany({
            where: {
                userId: user.id,
            },
            orderBy: {
                createdAt: 'asc',
            },
            select: {
                connectionUserId: true,
                alias: true,
            },
        }),
        prisma.chestPad.findMany({
            where: {
                chestId: chestPad.chestId,
            },
            select: {
                userId: true,
            },
        }),
    ]);

    const sharedByUserId = new Set(sharedPads.map((pad) => pad.userId));

    return connections.map((connection) => ({
        id: connection.connectionUserId,
        alias: connection.alias?.trim() ? connection.alias : 'Chest wizard',
        shared: sharedByUserId.has(connection.connectionUserId),
    }));
}

export async function shareChestWithConnections(id: number, connectionIds: number[]) {
    const user = await loggedUser();

    if (connectionIds.length === 0) {
        return { shared: 0 };
    }

    const chestPad = await prisma.chestPad.findFirst({
        where: {
            id,
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

    const validConnections = await prisma.connection.findMany({
        where: {
            userId: user.id,
            connectionUserId: {
                in: connectionIds,
            },
        },
        select: {
            connectionUserId: true,
        },
    });

    const candidateUserIds = validConnections.map((connection) => connection.connectionUserId);
    if (candidateUserIds.length === 0) {
        return { shared: 0 };
    }

    const existingPads = await prisma.chestPad.findMany({
        where: {
            chestId: chestPad.chestId,
            userId: {
                in: candidateUserIds,
            },
            status: 'NEW',
        },
        select: {
            userId: true,
        },
    });

    const existingUsers = new Set(existingPads.map((pad) => pad.userId));
    const usersToShare = candidateUserIds.filter((userId) => !existingUsers.has(userId));

    await Promise.all(usersToShare.map(async (targetUserId) => {
        const targetDashboard = await prisma.dashboard.findFirst({
            where: {
                userId: targetUserId,
            },
            select: {
                id: true,
            },
            orderBy: [
                { dashRank: 'asc' },
                { id: 'asc' },
            ],
        });

        if (!targetDashboard) {
            return;
        }

        const lastDashRankedChestPad = await prisma.chestPad.findFirst({
            where: {
                userId: targetUserId,
                dashboardId: targetDashboard.id,
            },
            select: {
                dashRank: true,
            },
            orderBy: [
                { dashRank: 'desc' },
                { id: 'desc' },
            ],
        });

        await prisma.chestPad.create({
            data: {
                status: 'NEW',
                pinned: false,
                shared: 'SHARED',
                userId: targetUserId,
                chestId: chestPad.chestId,
                dashboardId: targetDashboard.id,
                dashRank: nextLexoRank(lastDashRankedChestPad?.dashRank),
            },
        });
    }));

    if (usersToShare.length > 0) {
        await prisma.chestPad.updateMany({
            where: {
                id,
                userId: user.id,
            },
            data: {
                shared: 'SHARED',
            },
        });
    }

    return { shared: usersToShare.length };
}

export async function unshareChestFromConnections(id: number, connectionIds: number[]) {
    const user = await loggedUser();

    if (connectionIds.length === 0) {
        return { unshared: 0 };
    }

    const chestPad = await prisma.chestPad.findFirst({
        where: {
            id,
            userId: user.id,
            status: 'NEW',
        },
        select: {
            chestId: true,
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

    const validConnections = await prisma.connection.findMany({
        where: {
            userId: user.id,
            connectionUserId: {
                in: connectionIds,
            },
        },
        select: {
            connectionUserId: true,
        },
    });

    const candidateUserIds = validConnections.map((connection) => connection.connectionUserId);
    if (candidateUserIds.length === 0) {
        return { unshared: 0 };
    }

    const sharedPads = await prisma.chestPad.findMany({
        where: {
            chestId: chestPad.chestId,
            status: 'NEW',
            userId: {
                in: candidateUserIds,
            },
        },
        select: {
            userId: true,
        },
    });

    const usersToUnshare = Array.from(new Set(sharedPads.map((pad) => pad.userId)));

    await Promise.all(usersToUnshare.map(async (targetUserId) => {
        await prisma.$transaction(async (tx) => {
            const clonedChest = await tx.chest.create({
                data: {
                    label: chestPad.chest.label,
                    carrots: {
                        create: chestPad.chest.carrots.map((carrot) => ({
                            label: carrot.label,
                            harvested: carrot.harvested,
                        })),
                    },
                },
                select: {
                    id: true,
                },
            });

            await tx.chestPad.updateMany({
                where: {
                    userId: targetUserId,
                    chestId: chestPad.chestId,
                },
                data: {
                    chestId: clonedChest.id,
                    shared: 'UNSHARED',
                },
            });
        });
    }));

    const remainingSharedPads = await prisma.chestPad.count({
        where: {
            chestId: chestPad.chestId,
            status: 'NEW',
            userId: {
                not: user.id,
            },
        },
    });

    await prisma.chestPad.updateMany({
        where: {
            id,
            userId: user.id,
            status: 'NEW',
        },
        data: {
            shared: remainingSharedPads > 0 ? 'SHARED' : 'UNSHARED',
        },
    });

    return { unshared: usersToUnshare.length };
}

export async function moveChestBetween(
    chestId: number,
    previousChestId: number | null,
    nextChestId: number | null,
) {
    const user = await loggedUser();
    const movedChest = await prisma.chestPad.findFirst({
        where: {
            id: chestId,
            userId: user.id,
            status: 'NEW',
        },
        select: {
            dashboardId: true,
        },
    });

    if (!movedChest) {
        return false;
    }

    const idsToLoad = [chestId, previousChestId, nextChestId]
        .filter((id): id is number => typeof id === 'number');

    const chestPads = await prisma.chestPad.findMany({
        where: {
            userId: user.id,
            status: 'NEW',
            dashboardId: movedChest.dashboardId,
            id: {
                in: idsToLoad,
            },
        },
        select: {
            id: true,
            dashRank: true,
        },
    });

    const chestById = new Map(chestPads.map((chest) => [chest.id, chest]));

    if (!chestById.has(chestId)) {
        return false;
    }

    const previousRank = previousChestId === null ? null : chestById.get(previousChestId)?.dashRank;

    const nextRank = nextChestId === null ? null : chestById.get(nextChestId)?.dashRank;

    if ((previousChestId !== null && !previousRank) || (nextChestId !== null && !nextRank)) {
        return false;
    }

    let nextRankValue: string;

    try {
        nextRankValue = lexoRankBetween(previousRank, nextRank);
    } catch {
        await rebalanceChestRanks(user.id, movedChest.dashboardId);

        const refreshedChests = await prisma.chestPad.findMany({
            where: {
                userId: user.id,
                status: 'NEW',
                dashboardId: movedChest.dashboardId,
                id: {
                    in: idsToLoad,
                },
            },
            select: {
                id: true,
                dashRank: true,
            },
        });

        const refreshedById = new Map(refreshedChests.map((chest) => [chest.id, chest]));
        const refreshedPreviousRank = previousChestId === null
            ? null
            : refreshedById.get(previousChestId)?.dashRank;
        const refreshedNextRank = nextChestId === null
            ? null
            : refreshedById.get(nextChestId)?.dashRank;

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
            id: chestId,
            userId: user.id,
            status: 'NEW',
        },
        data: {
            dashRank: nextRankValue,
        },
    });

    return true;
}

export async function moveChestToDashboard(id: number, dashboardId: number) {
    const user = await loggedUser();

    const [chestPad, targetDashboard] = await Promise.all([
        prisma.chestPad.findFirst({
            where: {
                id,
                userId: user.id,
                status: 'NEW',
            },
            select: {
                id: true,
                dashboardId: true,
            },
        }),
        prisma.dashboard.findFirst({
            where: {
                id: dashboardId,
                userId: user.id,
            },
            select: {
                id: true,
            },
        }),
    ]);

    if (!chestPad || !targetDashboard) {
        return false;
    }

    if (chestPad.dashboardId === dashboardId) {
        return true;
    }

    const lastDashRankedChestPad = await prisma.chestPad.findFirst({
        where: {
            userId: user.id,
            status: 'NEW',
            dashboardId,
        },
        select: {
            dashRank: true,
        },
        orderBy: [
            { dashRank: 'desc' },
            { id: 'desc' },
        ],
    });

    await prisma.chestPad.updateMany({
        where: {
            id,
            userId: user.id,
            status: 'NEW',
        },
        data: {
            dashboardId,
            dashRank: nextLexoRank(lastDashRankedChestPad?.dashRank),
        },
    });

    return true;
}
