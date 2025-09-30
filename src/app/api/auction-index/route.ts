export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { insight } from "../../utils/insight";

const EV_NEW_AUCTION = "NewAuction(address,uint256,address,tuple)";
const EV_NEW_BID     = "NewBid(uint256,address,address,uint256,tuple)";
const MARKET = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS!;

let cache: { ts: number; data: Record<string, { endMs: number; bidCount: number; buyoutWei: string; auctionId: string }> } | null = null;
const TTL = 60_000;

export async function GET() {
  if (!process.env.NEXT_PUBLIC_CLIENT_ID) {
    return NextResponse.json({}, { headers: { "Cache-Control": "no-store" } });
  }

  const now = Date.now();
  if (cache && now - cache.ts < TTL) {
    return NextResponse.json(cache.data, { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" } });
  }

  try {
    // ↓↓↓ REDUCED LIMITS (max 1000)
    const [au, bi] = await Promise.all([
      insight<{ events?: any[] }>(`/v1/events/${MARKET}/${encodeURIComponent(EV_NEW_AUCTION)}`, { limit: 1000 }),
      insight<{ events?: any[] }>(`/v1/events/${MARKET}/${encodeURIComponent(EV_NEW_BID)}`,     { limit: 1000 }),
    ]);

    const out: Record<string, { endMs: number; bidCount: number; buyoutWei: string; auctionId: string }> = {};
    const argsOf = (e: any) => e?.args ?? e?.data?.args ?? {};

    for (const e of au.events ?? []) {
      const a = argsOf(e);
      const A = a.auction ?? a.Auction ?? a;
      const tokenId   = String(A?.tokenId ?? a?.tokenId ?? "");
      if (!tokenId) continue;
      const endSec    = Number(A?.endTimestamp ?? a?.endTimestamp ?? 0);
      const auctionId = String(a?.auctionId ?? A?.auctionId ?? "");
      const buyoutWei = String(A?.buyoutBidAmount ?? a?.buyoutBidAmount ?? "0");
      out[tokenId] = { endMs: endSec * 1000, bidCount: 0, buyoutWei, auctionId };
    }

    for (const e of bi.events ?? []) {
      const a = argsOf(e);
      const A = a.auction ?? a.Auction ?? a;
      const tokenId = String(A?.tokenId ?? a?.tokenId ?? "");
      if (!tokenId) continue;
      out[tokenId] = out[tokenId] || { endMs: 0, bidCount: 0, buyoutWei: "0", auctionId: String(a?.auctionId ?? A?.auctionId ?? "") };
      out[tokenId].bidCount += 1;
    }

    cache = { ts: now, data: out };
    return NextResponse.json(out, { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" } });
  } catch (err) {
    console.warn("auction-index failed:", err);
    return NextResponse.json({}, { headers: { "Cache-Control": "no-store" } });
  }
}