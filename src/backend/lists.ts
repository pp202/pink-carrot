import { log } from 'console'
import prisma from '../config/prisma'
import { loggedUser } from './user';

export async function getLists() {
    const user = await loggedUser();
    return prisma.list.findMany({
        where: {
            userId: user.id
        },
        orderBy: {
            id: 'asc'
        }
    })
}

export async function getList(id: number) {
    const user = await loggedUser();
    return prisma.list.findFirst({
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
    return prisma.list.delete({
        where: {
            id: id,            
            AND : {
                userId: user.id,
            },
        },
    })
}

