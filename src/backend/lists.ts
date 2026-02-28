import { prisma } from '@/config/prisma'
import { loggedUser } from './user';

export async function getChests() {
    const user = await loggedUser();
    return prisma.chest.findMany({
        where: {
            userId: user.id,
            status: 'NEW',
        },
        orderBy: {
            id: 'asc'
        }
    })
}

export async function getArchivedChests() {
    const user = await loggedUser();
    return prisma.chest.findMany({
        where: {
            userId: user.id,
            status: 'ARCHIVED',
        },
        orderBy: {
            id: 'asc'
        }
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
        orderBy: {
            createdAt: 'desc',
        },
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
    })
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
