import { prisma } from "@/config/prisma";
import { allocateLexoRanks, lexoRankBetween, nextLexoRank } from "./lexoRank";
import { loggedUser } from "./user";

async function rebalanceDashboardRanks(userId: number) {
  const dashboards = await prisma.dashboard.findMany({
    where: { userId },
    select: { id: true },
    orderBy: [{ dashRank: "asc" }, { id: "asc" }],
  });

  if (dashboards.length === 0) {
    return;
  }

  const ranks = allocateLexoRanks(dashboards.length);

  await prisma.$transaction(
    dashboards.map((dashboard, index) =>
      prisma.dashboard.updateMany({
        where: { id: dashboard.id, userId },
        data: { dashRank: ranks[index] },
      }),
    ),
  );
}

export async function ensureDefaultDashboard(userId: number) {
  const existing = await prisma.dashboard.findFirst({
    where: { userId },
    orderBy: [{ dashRank: "asc" }, { id: "asc" }],
    select: { id: true, name: true, dashRank: true },
  });

  if (existing) {
    return existing;
  }

  return prisma.dashboard.create({
    data: {
      userId,
      name: "Dashboard",
      dashRank: nextLexoRank(null),
    },
    select: { id: true, name: true, dashRank: true },
  });
}

export async function getDashboards() {
  const user = await loggedUser();
  await ensureDefaultDashboard(user.id);

  return prisma.dashboard.findMany({
    where: { userId: user.id },
    select: { id: true, name: true, dashRank: true },
    orderBy: [{ dashRank: "asc" }, { id: "asc" }],
  });
}

export async function createDashboard(name: string) {
  const user = await loggedUser();
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("Dashboard name is required.");
  }

  const lastDashboard = await prisma.dashboard.findFirst({
    where: { userId: user.id },
    select: { dashRank: true },
    orderBy: [{ dashRank: "desc" }, { id: "desc" }],
  });

  return prisma.dashboard.create({
    data: {
      userId: user.id,
      name: trimmedName,
      dashRank: nextLexoRank(lastDashboard?.dashRank),
    },
    select: { id: true, name: true, dashRank: true },
  });
}

export async function moveDashboardBetween(
  dashboardId: number,
  previousDashboardId: number | null,
  nextDashboardId: number | null,
) {
  const user = await loggedUser();

  const idsToLoad = [dashboardId, previousDashboardId, nextDashboardId].filter(
    (id): id is number => typeof id === "number",
  );

  const dashboards = await prisma.dashboard.findMany({
    where: {
      userId: user.id,
      id: { in: idsToLoad },
    },
    select: { id: true, dashRank: true },
  });

  const dashboardById = new Map(dashboards.map((dashboard) => [dashboard.id, dashboard]));

  if (!dashboardById.has(dashboardId)) {
    return false;
  }

  const previousRank = previousDashboardId === null ? null : dashboardById.get(previousDashboardId)?.dashRank;
  const nextRank = nextDashboardId === null ? null : dashboardById.get(nextDashboardId)?.dashRank;

  if ((previousDashboardId !== null && !previousRank) || (nextDashboardId !== null && !nextRank)) {
    return false;
  }

  let newRank: string;
  try {
    newRank = lexoRankBetween(previousRank, nextRank);
  } catch {
    await rebalanceDashboardRanks(user.id);

    const refreshed = await prisma.dashboard.findMany({
      where: {
        userId: user.id,
        id: { in: idsToLoad },
      },
      select: { id: true, dashRank: true },
    });

    const refreshedById = new Map(refreshed.map((dashboard) => [dashboard.id, dashboard]));
    const refreshedPreviousRank = previousDashboardId === null ? null : refreshedById.get(previousDashboardId)?.dashRank;
    const refreshedNextRank = nextDashboardId === null ? null : refreshedById.get(nextDashboardId)?.dashRank;

    if ((previousDashboardId !== null && !refreshedPreviousRank) || (nextDashboardId !== null && !refreshedNextRank)) {
      return false;
    }

    try {
      newRank = lexoRankBetween(refreshedPreviousRank, refreshedNextRank);
    } catch {
      return false;
    }
  }

  await prisma.dashboard.updateMany({
    where: {
      id: dashboardId,
      userId: user.id,
    },
    data: {
      dashRank: newRank,
    },
  });

  return true;
}

export async function resolveDashboardId(preferredDashboardId?: number | null) {
  const user = await loggedUser();

  if (preferredDashboardId && Number.isInteger(preferredDashboardId)) {
    const ownedDashboard = await prisma.dashboard.findFirst({
      where: {
        id: preferredDashboardId,
        userId: user.id,
      },
      select: { id: true },
    });

    if (ownedDashboard) {
      return ownedDashboard.id;
    }
  }

  const defaultDashboard = await ensureDefaultDashboard(user.id);
  return defaultDashboard.id;
}
