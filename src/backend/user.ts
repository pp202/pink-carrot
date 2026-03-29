import { prisma } from "@/config/prisma";
import { auth } from "@/";

const CONNECTION_REQUEST_LIFESPAN_MS = 10 * 60 * 1000;

type ConsumeInviteStatus =
  | { status: "connected"; alias: string }
  | { status: "already-connected"; alias: string }
  | { status: "expired" }
  | { status: "owner-active"; remainingMinutes: number };

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
        alias: "Chest wizard",
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

  const connections = await prisma.connection.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      alias: true,
      connectionUser: {
        select: {
          id: true,
        },
      },
    },
  });

  return {
    connections: connections.map(({ alias, connectionUser }) => ({
      id: connectionUser.id,
      alias: alias?.trim() ? alias : "Chest wizard",
    })),
  };
}

export async function getUserProfile() {
  const user = await loggedUser();
  return {
    alias: user.alias?.trim() ? user.alias : "Chest wizard",
  };
}

export async function updateAlias(alias: string) {
  const user = await loggedUser();
  const nextAlias = alias.trim() || "Chest wizard";

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      alias: nextAlias,
    },
    select: {
      alias: true,
    },
  });

  return updatedUser.alias;
}

export async function disconnectConnections(connectionIds: number[]) {
  const user = await loggedUser();

  if (connectionIds.length === 0) {
    return 0;
  }

  const linkedConnections = await prisma.connection.findMany({
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

  if (linkedConnections.length === 0) {
    return 0;
  }

  const linkedIds = linkedConnections.map((connection) => connection.connectionUserId);

  await prisma.connection.deleteMany({
    where: {
      OR: [
        {
          userId: user.id,
          connectionUserId: {
            in: linkedIds,
          },
        },
        {
          userId: {
            in: linkedIds,
          },
          connectionUserId: user.id,
        },
      ],
    },
  });

  return linkedIds.length;
}

export async function updateConnectionAlias(connectionId: number, alias: string) {
  const user = await loggedUser();
  const nextAlias = alias.trim() || "Chest wizard";

  const connection = await prisma.connection.updateMany({
    where: {
      userId: user.id,
      connectionUserId: connectionId,
    },
    data: {
      alias: nextAlias,
    },
  });

  if (connection.count === 0) {
    throw new Error("Connection not found");
  }

  return nextAlias;
}

export async function createConnectionRequest() {
  const user = await loggedUser();

  const request = await prisma.connectionRequest.create({
    data: {
      userId: user.id,
    },
    select: {
      id: true,
    },
  });

  return request.id;
}

export async function consumeConnectionRequest(requestId: string): Promise<ConsumeInviteStatus> {
  const user = await loggedUser();

  const connectionRequest = await prisma.connectionRequest.findUnique({
    where: {
      id: requestId,
    },
    include: {
      user: {
        select: {
          id: true,
          alias: true,
        },
      },
    },
  });

  if (!connectionRequest) {
    return { status: "expired" };
  }

  const expiresAt = connectionRequest.createdAt.getTime() + CONNECTION_REQUEST_LIFESPAN_MS;
  const now = Date.now();

  if (expiresAt <= now) {
    await prisma.connectionRequest.deleteMany({
      where: {
        id: requestId,
      },
    });

    return { status: "expired" };
  }

  if (connectionRequest.userId === user.id) {
    const remainingMinutes = Math.max(1, Math.ceil((expiresAt - now) / 60000));
    return { status: "owner-active", remainingMinutes };
  }

  const connectionAlias = connectionRequest.user.alias?.trim() ? connectionRequest.user.alias : "Chest wizard";

  const existingConnection = await prisma.connection.findFirst({
    where: {
      userId: user.id,
      connectionUserId: connectionRequest.userId,
    },
    select: {
      userId: true,
    },
  });

  if (existingConnection) {
    await prisma.connectionRequest.deleteMany({
      where: {
        id: requestId,
      },
    });

    return { status: "already-connected", alias: connectionAlias };
  }

  await prisma.$transaction([
    prisma.connection.createMany({
      data: [
        {
          userId: user.id,
          connectionUserId: connectionRequest.userId,
          alias: connectionAlias,
        },
        {
          userId: connectionRequest.userId,
          connectionUserId: user.id,
          alias: user.alias?.trim() ? user.alias : "Chest wizard",
        },
      ],
      skipDuplicates: true,
    }),
    prisma.connectionRequest.deleteMany({
      where: {
        id: requestId,
      },
    }),
  ]);

  return { status: "connected", alias: connectionAlias };
}
