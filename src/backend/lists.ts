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
    return prisma.chest.deleteMany({
        where: {
            id,
            userId: user.id,
        },
    })
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
