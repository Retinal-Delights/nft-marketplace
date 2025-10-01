// src/app/api/auction-map/route.ts
import { NextResponse } from "next/server";

const CHAIN_ID = 8453;
const MARKETPLACE = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS!;
const INSIGHT_BASE = process.env.INSIGHT_BASE_URL || "https://insight.thirdweb.com";
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID!;
const MIN_LIVE_LISTING_ID = 7;
const SKIP_TOKEN_IDS = new Set<string>(["0", "1"]); // optional poison pills

// Event signatures (verified)
const EVENT_SIGNATURE_AUCTION_CREATED =
  "NewAuction(address,uint256,address,(uint256,uint256,uint256,uint256,uint256,uint64,uint64,uint64,uint64,address,address,address,uint8,uint8))";
const EVENT_SIGNATURE_BID =
  "NewBid(uint256,address,address,uint256,(uint256,uint256,uint256,uint256,uint256,uint64,uint64,uint64,uint64,address,address,address,uint8,uint8))";
const EVENT_SIGNATURE_AUCTION_CLOSED =
  "AuctionClosed(uint256,address,address,uint256,address,address)";

type AuctionLite = {
  auctionId: string; // listingId
  tokenId: string;
  endSec: number;
};

type MapEntry = {
  tokenId: string;
  listingId: string;
  bidCount: number;
  endSec: number;
};

function readArg(obj: any, keyOrIndex: number | string) {
  if (!obj) return undefined;
  if (typeof keyOrIndex === "number") {
    if (Array.isArray(obj)) return obj[keyOrIndex];
    if (obj && typeof obj === "object" && String(keyOrIndex) in obj) return obj[String(keyOrIndex)];
    return undefined;
  }
  return obj[keyOrIndex];
}

function coerceBigish(x: any) {
  if (x == null) return undefined;
  if (typeof x === "string") return x;
  if (typeof x === "number") return String(x);
  if (typeof x === "bigint") return x.toString();
  if (x?.hex) return BigInt(x.hex).toString();
  return String(x);
}

function extractAuctionFromNewAuction(item: any): AuctionLite | undefined {
  const args = item?.args ?? item?.data?.args ?? item?.decoded_parameters ?? item?.parameters;
  if (!args) return;
  const auctionId = coerceBigish(args.auctionId ?? readArg(args, 1));
  const auction = args.auction ?? readArg(args, 3);
  const tokenId = coerceBigish(auction?.tokenId ?? readArg(auction, 4));
  const endTimestamp = coerceBigish(auction?.endTimestamp ?? readArg(auction, 6));
  if (!auctionId || !tokenId || !endTimestamp) return;
  return {
    auctionId,
    tokenId,
    endSec: Number(endTimestamp),
  };
}

function extractAuctionFromNewBid(item: any): { auctionId: string; tokenId?: string } | undefined {
  const args = item?.args ?? item?.data?.args ?? item?.decoded_parameters ?? item?.parameters;
  if (!args) return;
  const auctionId = coerceBigish(args.auctionId ?? readArg(args, 0));
  // Prefer struct tokenId if Insight includes it; otherwise we'll look up via auctionId
  const auction = args.auction ?? readArg(args, 4);
  const tokenId = coerceBigish(auction?.tokenId ?? readArg(auction, 4));
  if (!auctionId) return;
  return { auctionId, tokenId };
}

function extractClosedAuctionId(item: any): string | undefined {
  const args = item?.args ?? item?.data?.args ?? item?.decoded_parameters ?? item?.parameters;
  const auctionId = coerceBigish(args?.auctionId ?? readArg(args, 0));
  return auctionId;
}

async function fetchInsightEvents(eventSig: string, limit = 1000) {
  const url = `${INSIGHT_BASE}/v1/events/${MARKETPLACE}/${encodeURIComponent(
    eventSig
  )}?chain_id=${CHAIN_ID}&limit=${limit}`;
  const res = await fetch(url, { headers: { "x-client-id": CLIENT_ID } });
  if (!res.ok) throw new Error(`Insight ${eventSig} HTTP ${res.status}`);
  const json = await res.json();
  // Expect json.items = array
  return Array.isArray(json?.items) ? json.items : [];
}

export async function GET() {
  try {
    if (!MARKETPLACE || !CLIENT_ID) {
      return NextResponse.json({ error: "Missing env" }, { status: 500 });
    }

    // Fetch three event sets in parallel
    const [created, bids, closed] = await Promise.all([
      fetchInsightEvents(EVENT_SIGNATURE_AUCTION_CREATED),
      fetchInsightEvents(EVENT_SIGNATURE_BID),
      fetchInsightEvents(EVENT_SIGNATURE_AUCTION_CLOSED),
    ]);

    // Build closed set
    const closedSet = new Set<string>();
    for (const item of closed) {
      const id = extractClosedAuctionId(item);
      if (id) closedSet.add(id);
    }

    // Index auctions by auctionId (listingId) and prefer the latest endTimestamp if duplicates
    const auctionsById = new Map<string, AuctionLite>();
    for (const item of created) {
      const a = extractAuctionFromNewAuction(item);
      if (!a) continue;
      if (Number(a.auctionId) < MIN_LIVE_LISTING_ID) continue;
      if (closedSet.has(a.auctionId)) continue;
      if (SKIP_TOKEN_IDS.has(a.tokenId)) continue;

      const prev = auctionsById.get(a.auctionId);
      if (!prev || a.endSec >= prev.endSec) {
        auctionsById.set(a.auctionId, a);
      }
    }

    // Count bids; if bid doesn't include tokenId, we'll resolve via auctionId map
    const bidCountsByAuctionId = new Map<string, number>();
    for (const item of bids) {
      const b = extractAuctionFromNewBid(item);
      if (!b) continue;
      if (Number(b.auctionId) < MIN_LIVE_LISTING_ID) continue;
      if (closedSet.has(b.auctionId)) continue;
      if (!auctionsById.has(b.auctionId)) continue; // ignore bids for auctions we filtered out
      bidCountsByAuctionId.set(b.auctionId, (bidCountsByAuctionId.get(b.auctionId) ?? 0) + 1);
    }

    // Collapse to tokenId -> { listingId, bidCount, endSec }
    const byToken = new Map<string, MapEntry>();
    for (const [auctionId, a] of auctionsById.entries()) {
      const bidCount = bidCountsByAuctionId.get(auctionId) ?? 0;
      // If multiple live auctions for same token, keep the one ending soonest in the future
      const existing = byToken.get(a.tokenId);
      const candidate: MapEntry = {
        tokenId: a.tokenId,
        listingId: auctionId,
        bidCount,
        endSec: a.endSec,
      };
      if (!existing) byToken.set(a.tokenId, candidate);
      else {
        const now = Math.floor(Date.now() / 1000);
        const existingDelta = Math.max(existing.endSec - now, 0);
        const candidateDelta = Math.max(candidate.endSec - now, 0);
        // prefer a still-running (or later-closing) auction
        byToken.set(
          a.tokenId,
          candidateDelta >= existingDelta ? candidate : existing
        );
      }
    }

    const items = Array.from(byToken.values());
    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "unknown error" }, { status: 500 });
  }
}
