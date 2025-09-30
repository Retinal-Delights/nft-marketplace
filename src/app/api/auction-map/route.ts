export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { CLIENT_ID, INSIGHT_BASE, BASE_CHAIN_ID } from "../../../consts/env";

// ==== CONFIG YOU CAN EDIT (minimal) ====
const MARKETPLACE = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS!; // 0xF0f2...
const YOUR_COLLECTION = process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS!;

// If you truly want to enforce "first live listing is 7":
const MIN_LIVE_LISTING_ID = 7;

// Optional: restrict to known seller wallets (leave empty to include all)
const SELLERS: string[] = [
  // "retinaldelights.eth", "0x52C9...383d", "0x3269...B244"
];

// ==== IMPORTANT: paste exact event signatures from YOUR MarketplaceV3 ABI ====
// Tip: open your ABI, copy the event "name(...types...)" string EXACTLY.
// English auctions (thirdweb v5 MarketplaceV3) usually include events like these:
const EVENT_SIGNATURE_AUCTION_CREATED = "AuctionCreated(uint256,address,address,address,uint256,uint256,uint256,uint256)";
// ^ auctionId, seller, assetContract, currency, tokenId, quantity, startTimestamp, endTimestamp

const EVENT_SIGNATURE_AUCTION_CLOSED = "AuctionClosed(uint256,address,uint256)";
// ^ auctionId, closer, winningBidAmount (names can vary; the types/arity matter)

const EVENT_SIGNATURE_BUYOUT = "Buyout(uint256,address,uint256)";
// ^ auctionId, buyer, pricePaid (again, names can vary, types matter)

// Optional (if you want bidCount per auction):
const EVENT_SIGNATURE_NEW_BID = "NewBid(uint256,address,uint256)";
// ^ auctionId, bidder, bidAmount

// Helper to build Insight URLs
function ev(path: string, qs: Record<string, string | number | boolean | undefined>) {
  const u = new URL(`${INSIGHT_BASE}${path}`);
  Object.entries(qs).forEach(([k, v]) => {
    if (v === undefined) return;
    u.searchParams.append(k, String(v));
  });
  return u.toString();
}

// Generic fetcher with header
async function insightGET(url: string) {
  const res = await fetch(url, {
    headers: { "x-client-id": CLIENT_ID },
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Insight ${res.status}: ${txt || res.statusText}`);
  }
  return res.json();
}

type InsightEvent = {
  address?: string;               // contract address (marketplace)
  chain_id: number;
  block_number?: string;
  transaction_hash?: string;
  log_index?: number;
  // The args location differs across chains/deploys:
  args?: any;                     // some deployments
  data?: { args?: any };          // others
};

// Pull args no matter where they are
function getArgs(e: InsightEvent): any {
  return (e as any).args ?? (e as any).data?.args ?? {};
}

function addrEq(a?: string, b?: string) {
  return a && b && a.toLowerCase() === b.toLowerCase();
}

// Optional seller filter check
function sellerAllowed(seller?: string) {
  if (!SELLERS.length) return true;
  return SELLERS.some((s) => addrEq(seller, s));
}

export async function GET(req: Request) {
  try {
    if (!CLIENT_ID) {
      return NextResponse.json({ error: "Missing NEXT_PUBLIC_CLIENT_ID" }, { status: 400 });
    }
    if (!MARKETPLACE) {
      return NextResponse.json({ error: "Missing NEXT_PUBLIC_MARKETPLACE_ADDRESS" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";

    // 1) Get all created auctions (paginate in case you have many)
    const createdUrl = (page = 0) =>
      ev(`/v1/events/${MARKETPLACE}/${EVENT_SIGNATURE_AUCTION_CREATED}`, {
        chain_id: BASE_CHAIN_ID,
        limit: 1000, // max allowed
        page,
      });

    let created: InsightEvent[] = [];
    for (let page = 0; page < 20; page++) {
      const j = await insightGET(createdUrl(page));
      const batch: InsightEvent[] = j?.data ?? [];
      created = created.concat(batch);
      if (!batch.length || batch.length < 1000) break; // done
    }

    // 2) Get closures/buyouts to subtract "inactive" auctions
    const closedUrl = (page = 0) =>
      ev(`/v1/events/${MARKETPLACE}/${EVENT_SIGNATURE_AUCTION_CLOSED}`, {
        chain_id: BASE_CHAIN_ID,
        limit: 1000,
        page,
      });
    const buyoutUrl = (page = 0) =>
      ev(`/v1/events/${MARKETPLACE}/${EVENT_SIGNATURE_BUYOUT}`, {
        chain_id: BASE_CHAIN_ID,
        limit: 1000,
        page,
      });

    let closed: InsightEvent[] = [];
    for (let page = 0; page < 20; page++) {
      const j = await insightGET(closedUrl(page));
      const batch: InsightEvent[] = j?.data ?? [];
      closed = closed.concat(batch);
      if (!batch.length || batch.length < 1000) break;
    }

    let boughtOut: InsightEvent[] = [];
    for (let page = 0; page < 20; page++) {
      const j = await insightGET(buyoutUrl(page));
      const batch: InsightEvent[] = j?.data ?? [];
      boughtOut = boughtOut.concat(batch);
      if (!batch.length || batch.length < 1000) break;
    }

    // 3) Build a set of inactive auctionIds
    const inactive = new Set<string>();
    for (const e of closed) {
      const a = getArgs(e);
      if (a?.auctionId != null) inactive.add(String(a.auctionId));
      else if (a?.id != null) inactive.add(String(a.id));
    }
    for (const e of boughtOut) {
      const a = getArgs(e);
      if (a?.auctionId != null) inactive.add(String(a.auctionId));
      else if (a?.id != null) inactive.add(String(a.id));
    }

    // 4) Reduce created → active map by tokenKey
    // tokenKey = `${assetContract}:${tokenId}`
    type Row = {
      tokenId: string;
      assetContract: string;
      auctionId: string; // a.k.a. listingId for auctions
      seller?: string;
      endSec?: number;
    };

    const byToken = new Map<string, Row>();

    for (const e of created) {
      const args = getArgs(e);

      // Normalize from various field names
      const auctionId = String(args?.auctionId ?? args?.id ?? "");
      const tokenId   = String(args?.tokenId ?? "");
      const asset     = String(args?.assetContract ?? args?.collection ?? args?.nftContract ?? "");
      const seller    = String(args?.seller ?? args?.lister ?? args?.owner ?? "");
      const endSec    = Number(args?.endTimestamp ?? args?.endTime ?? args?.end ?? 0);

      if (!auctionId || !tokenId || !asset) continue;
      if (Number(auctionId) < MIN_LIVE_LISTING_ID) continue;             // skip 0..6 per your rule
      if (!sellerAllowed(seller)) continue;                               // optional seller filter
      if (inactive.has(auctionId)) continue;                              // drop closed/buyout

      const tokenKey = `${asset.toLowerCase()}:${tokenId}`;
      // last-write-wins (newer events later in the array typically)
      byToken.set(tokenKey, { tokenId, assetContract: asset, auctionId, seller, endSec });
    }

    // 5) (Optional) Gather bid counts
    let bidCounts: Record<string, number> = {};
    try {
      const bidsUrl = (page = 0) =>
        ev(`/v1/events/${MARKETPLACE}/${EVENT_SIGNATURE_NEW_BID}`, {
          chain_id: BASE_CHAIN_ID,
          limit: 1000,
          page,
        });
      let bids: InsightEvent[] = [];
      for (let page = 0; page < 20; page++) {
        const j = await insightGET(bidsUrl(page));
        const batch: InsightEvent[] = j?.data ?? [];
        bids = bids.concat(batch);
        if (!batch.length || batch.length < 1000) break;
      }
      for (const e of bids) {
        const a = getArgs(e);
        const auctionId = String(a?.auctionId ?? a?.id ?? "");
        if (!auctionId) continue;
        bidCounts[auctionId] = (bidCounts[auctionId] || 0) + 1;
      }
    } catch {
      // bid counting is optional—ignore errors here
    }

    // 6) Build final rows keyed by tokenId (your collection only)
    const rows = Array.from(byToken.values())
      .filter(r => r.assetContract.toLowerCase() === YOUR_COLLECTION.toLowerCase())
      .sort((a, b) => Number(a.tokenId) - Number(b.tokenId))
      .map(r => ({
        tokenId: r.tokenId,
        listingId: r.auctionId,
        seller: r.seller,
        endSec: r.endSec || null,
        bidCount: bidCounts[r.auctionId] || 0,
        status: "active",
      }));

    if (format === "csv") {
      const header = "tokenId,listingId,seller,endSec,bidCount,status";
      const lines = rows.map(r =>
        [r.tokenId, r.listingId, r.seller ?? "", r.endSec ?? "", r.bidCount, r.status].join(",")
      );
      const csv = [header, ...lines].join("\n");
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    return NextResponse.json(
      { updatedAt: Date.now(), count: rows.length, items: rows },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
