import { deleteDashboard, getDashboardForEdit, renameDashboard } from "@/backend/dashboards";
import { NextRequest, NextResponse } from "next/server";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const dashboardId = Number.parseInt(id, 10);

  if (!Number.isInteger(dashboardId)) {
    return NextResponse.json({ message: "Invalid dashboard id" }, { status: 400 });
  }

  const payload = await getDashboardForEdit(dashboardId);
  if (!payload) {
    return NextResponse.json({ message: "Dashboard not found" }, { status: 404 });
  }

  return NextResponse.json(payload, { status: 200 });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const dashboardId = Number.parseInt(id, 10);

  if (!Number.isInteger(dashboardId)) {
    return NextResponse.json({ message: "Invalid dashboard id" }, { status: 400 });
  }

  const body = await request.json();
  if (typeof body?.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ message: "Dashboard name is required" }, { status: 400 });
  }

  const updated = await renameDashboard(dashboardId, body.name);
  if (!updated) {
    return NextResponse.json({ message: "Dashboard not found" }, { status: 404 });
  }

  return NextResponse.json(updated, { status: 200 });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const dashboardId = Number.parseInt(id, 10);

  if (!Number.isInteger(dashboardId)) {
    return NextResponse.json({ message: "Invalid dashboard id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const moveToDashboardId = Number.isInteger(body?.moveToDashboardId) ? body.moveToDashboardId : null;

  const result = await deleteDashboard(dashboardId, moveToDashboardId);

  if (result.status === "not-found") {
    return NextResponse.json({ message: "Dashboard not found" }, { status: 404 });
  }

  if (result.status === "last-dashboard") {
    return NextResponse.json({ message: "At least one dashboard is required" }, { status: 400 });
  }

  if (result.status === "move-required") {
    return NextResponse.json({ message: "Select a dashboard to move chests to before deleting" }, { status: 400 });
  }

  if (result.status === "invalid-move-target") {
    return NextResponse.json({ message: "Invalid dashboard move target" }, { status: 400 });
  }

  return NextResponse.json({ message: "Dashboard deleted" }, { status: 200 });
}
