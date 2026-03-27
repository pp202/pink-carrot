import { prisma } from "@/config/prisma";
import { auth } from "@/";


export async function loggedUser() {
  const data = await auth();
  if (!data || !data.user || !data.user.email) {
    throw new Error("User not logged in");
  }
  const user = await getUser(data.user.email);
  if (!user) {
    throw new Error("User not found: " + data.user.email);
  }
  return user;
}

export async function createUserIfNew(username: string) {
  const lcUsername = username.toLocaleLowerCase();
  if (!(await getUser(lcUsername))) {
    const newUser = await prisma.user.create({
      data: {
        username: lcUsername,
      },
    });
    console.log("New user registered, ID:", newUser.id);
  }
}

export async function getUser(username: string) {
  const lcUsername = username.toLocaleLowerCase();
  return prisma.user.findFirst({
    where: {
      username: lcUsername,
    },
  });
}

export async function deleteUserAccount() {
  const user = await loggedUser();

  const deletedAccount = await prisma.$transaction(async (tx) => {
    await tx.carrot.deleteMany({
      where: {
        chest: {
          chestPads: {
            some: {
              userId: user.id,
            },
          },
        },
      },
    });

    await tx.chestPad.deleteMany({
      where: {
        userId: user.id,
      },
    });

    await tx.chest.deleteMany({
      where: {
        chestPads: {
          none: {},
        },
      },
    });

    return tx.user.deleteMany({
      where: {
        id: user.id,
      },
    });
  });

  return deletedAccount.count > 0;
}

export async function getChestpalsData() {
  const user = await loggedUser();

  const linkedUsers = await prisma.user.findMany({
    where: {
      uuid: user.uuid,
      id: {
        not: user.id,
      },
    },
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      alias: true,
      username: true,
    },
  });

  return {
    nickname: user.alias ?? "",
    connections: linkedUsers.map((linkedUser) => ({
      id: linkedUser.id,
      alias: linkedUser.alias?.trim() ? linkedUser.alias : linkedUser.username,
    })),
  };
}

export async function updateNickname(nickname: string) {
  const user = await loggedUser();

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      alias: nickname.trim() || null,
    },
    select: {
      alias: true,
    },
  });

  return updatedUser.alias ?? "";
}

export async function disconnectConnections(connectionIds: number[]) {
  const user = await loggedUser();

  if (connectionIds.length === 0) {
    return 0;
  }

  const linkedUsers = await prisma.user.findMany({
    where: {
      uuid: user.uuid,
      id: {
        in: connectionIds,
        not: user.id,
      },
    },
    select: {
      id: true,
    },
  });

  if (linkedUsers.length === 0) {
    return 0;
  }

  await prisma.$transaction(
    linkedUsers.map((linkedUser) =>
      prisma.user.update({
        where: {
          id: linkedUser.id,
        },
        data: {
          uuid: crypto.randomUUID(),
        },
      })
    )
  );

  return linkedUsers.length;
}
