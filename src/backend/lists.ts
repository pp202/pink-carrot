import { prisma } from '@/config/prisma'
import { loggedUser } from './user';

export async function getChests() {
    const user = await loggedUser();
    return prisma.chest.findMany({
        where: {
            userId: user.id
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
            AND : {
                userId: user.id,
            },
        },
    })
}

export async function deleteList(id: number) {
    const user = await loggedUser();
    const chest = await prisma.chest.findFirst({
        where: {
            id,
            userId: user.id,
        },
        select: {
            id: true,
        },
    });

    if (!chest) {
        return { count: 0 };
    }

    const [, deletedChests] = await prisma.$transaction([
        prisma.carrot.deleteMany({
            where: {
                chestId: chest.id,
            },
        }),
        prisma.chest.deleteMany({
            where: {
                id: chest.id,
            },
        }),
    ]);

    return deletedChests;
}

export async function setPinned(id: number, pinned: boolean) {
    const user = await loggedUser();
    return prisma.chest.updateMany({
        where: {
            id,
            userId: user.id,
        },
        data: {
            pinned,
        },
    })
}
