import { createDashboard, getDashboards, moveDashboardBetween } from "@/backend/dashboards";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const dashboards = await getDashboards();
  return NextResponse.json(dashboards, { status: 200 });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (typeof body?.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ message: "Dashboard name is required" }, { status: 400 });
  }

  const dashboard = await createDashboard(body.name);
  return NextResponse.json(dashboard, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();

  const dashboardId = body?.dashboardId;
  const previousDashboardId = body?.previousDashboardId ?? null;
  const nextDashboardId = body?.nextDashboardId ?? null;

  if (!Number.isInteger(dashboardId)) {
    return NextResponse.json({ message: "Invalid dashboard id" }, { status: 400 });
  }

  if (previousDashboardId !== null && !Number.isInteger(previousDashboardId)) {
    return NextResponse.json({ message: "Invalid previous dashboard id" }, { status: 400 });
  }

  if (nextDashboardId !== null && !Number.isInteger(nextDashboardId)) {
    return NextResponse.json({ message: "Invalid next dashboard id" }, { status: 400 });
  }

  if (dashboardId === previousDashboardId || dashboardId === nextDashboardId) {
    return NextResponse.json({ message: "Invalid reorder bounds" }, { status: 400 });
  }

  const reordered = await moveDashboardBetween(dashboardId, previousDashboardId, nextDashboardId);

  if (!reordered) {
    return NextResponse.json({ message: "Unable to reorder dashboard" }, { status: 404 });
  }

  return NextResponse.json({ message: "Dashboard reordered" }, { status: 200 });
}
