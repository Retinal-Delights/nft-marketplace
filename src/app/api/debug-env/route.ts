export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { CLIENT_ID, INSIGHT_BASE } from "../../../consts/env";

export async function GET() {
  const masked = CLIENT_ID ? CLIENT_ID.slice(0, 4) + "…" + CLIENT_ID.slice(-4) : "";
  return NextResponse.json({
    hasClientId: Boolean(CLIENT_ID),
    clientIdMasked: masked,
    insightBase: INSIGHT_BASE,
    nodeVersion: process.version,
  });
}
