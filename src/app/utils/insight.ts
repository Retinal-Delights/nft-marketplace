// utils/insight.ts

import { CLIENT_ID, INSIGHT_BASE, BASE_CHAIN_ID } from "../../consts/env";

/** Core helper: calls Insight with your client ID and chain_id=8453 (Base). */
export async function insight<T>(
  path: string,
  params?: Record<string, string | number | boolean | (string | number)[]>
): Promise<T> {
  const url  = new URL(path, INSIGHT_BASE);

  // Always include Base (8453). You can add more later via params (repeatable).
  url.searchParams.append("chain_id", String(BASE_CHAIN_ID));

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (Array.isArray(v)) v.forEach((x) => url.searchParams.append(k, String(x)));
      else if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    headers: { "x-client-id": CLIENT_ID },
    // App Router server components can add caching around this if desired
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Insight ${res.status}: ${res.statusText} — ${text}`);
  }
  return res.json();
}

/* ---------------- Your existing wrappers (now using the helper) ---------------- */

export async function getNftTransfers(limit = 5) {
  const addr = process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS!;
  return insight(`/v1/events/${addr}/Transfer(address,address,uint256)`, { limit });
}

export async function getMarketplaceListings(limit = 5) {
  // NOTE: This "NewListing" signature is typical for fixed-price listings.
  // If you are using English auctions, use the NewAuction/NewBid helpers below instead.
  const mkt = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS!;
  return insight(`/v1/events/${mkt}/NewListing(address,uint256,uint256)`, { limit });
}

export async function getTransactionStats() {
  return insight(`/v1/transactions`, {
    "aggregate": "count() AS transaction_count",
  });
}

export async function getBlockMetrics() {
  // Multiple aggregates are passed by repeating the param
  const basePath = `/v1/blocks`;
  // URLSearchParams handles repeats when called via our helper
  return insight(basePath, [
    "count() AS block_count",
    "sum(gas_used) AS total_gas",
  ].reduce<Record<string, string[]>>((acc, agg, i) => {
    (acc.aggregate ||= []).push(agg);
    return acc;
  }, {}));
}

/* ---------------- Extra helpers you’ll actually use for the grid ---------------- */

/** Pull NFTs (name, image_url, attributes) directly from Insight. */
export async function getNftsByContract(limit = 1000) {
  const col = process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS!;
  // include_owners=false keeps payload small; resolve_metadata_links=true resolves ipfs://
  return insight<{ data: any[] }>(`/v1/nfts/${col}`, {
    limit,
    include_owners: "false",
    resolve_metadata_links: "true",
  });
}

/** English auction events (from your ABI): */
const EV_NEW_AUCTION = "NewAuction(address,uint256,address,tuple)";
const EV_NEW_BID     = "NewBid(uint256,address,address,uint256,tuple)";

/** Raw auction events */
export async function getAuctionEvents(limits = { auctions: 5000, bids: 10000 }) {
  const mkt = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS!;
  const [au, bi] = await Promise.all([
    insight<{ events?: any[] }>(`/v1/events/${mkt}/${encodeURIComponent(EV_NEW_AUCTION)}`, { limit: limits.auctions }),
    insight<{ events?: any[] }>(`/v1/events/${mkt}/${encodeURIComponent(EV_NEW_BID)}`,     { limit: limits.bids }),
  ]);
  return { auctions: au.events ?? [], bids: bi.events ?? [] };
}

/** Build a compact index keyed by tokenId: { endMs, bidCount, buyoutWei, auctionId } */
export async function buildAuctionIndex() {
  const { auctions, bids } = await getAuctionEvents();
  const out: Record<string, { endMs: number; bidCount: number; buyoutWei: string; auctionId: string }> = {};
  const argsOf = (e: any) => e?.args ?? e?.data?.args ?? {};

  for (const e of auctions) {
    const a = argsOf(e);
    const A = a.auction ?? a.Auction ?? a;
    const tokenId   = String(A?.tokenId ?? a?.tokenId ?? "");
    if (!tokenId) continue;
    const endSec    = Number(A?.endTimestamp ?? a?.endTimestamp ?? 0);
    const auctionId = String(a?.auctionId ?? A?.auctionId ?? "");
    const buyoutWei = String(A?.buyoutBidAmount ?? a?.buyoutBidAmount ?? "0");
    out[tokenId] = { endMs: endSec * 1000, bidCount: 0, buyoutWei, auctionId };
  }
  for (const e of bids) {
    const a = argsOf(e);
    const A = a.auction ?? a.Auction ?? a;
    const tokenId = String(A?.tokenId ?? a?.tokenId ?? "");
    if (!tokenId) continue;
    out[tokenId] = out[tokenId] || { endMs: 0, bidCount: 0, buyoutWei: "0", auctionId: String(a?.auctionId ?? A?.auctionId ?? "") };
    out[tokenId].bidCount += 1;
  }
  return out;
}

export async function getTokenTransfersById(
  contractAddress: string,
  tokenId: string,
  opts?: { limit?: number }
): Promise<{ data: Array<{
  from_address: string; to_address: string; block_timestamp: string; transaction_hash: string;
}> }> {
  const url  = new URL(`/v1/nfts/transfers/${contractAddress}/${tokenId}`, INSIGHT_BASE);
  url.searchParams.set("chain_id", String(BASE_CHAIN_ID));
  url.searchParams.set("limit", String(opts?.limit ?? 200));
  url.searchParams.set("metadata", "false");
  url.searchParams.set("include_owners", "true");
  url.searchParams.set("resolve_metadata_links", "false");
  url.searchParams.set("sales", "true");         // include sale meta when present
  url.searchParams.set("sort_order", "desc");    // newest first

  const res = await fetch(url.toString(), { headers: { "x-client-id": CLIENT_ID } });
  if (!res.ok) throw new Error(`Insight ${res.status}: ${res.statusText}`);
  return res.json() as Promise<{ data: Array<{
    from_address: string; to_address: string; block_timestamp: string; transaction_hash: string;
  }> }>;
}

export async function getOwnedNftsByWallet(ownerAddress: string, limit = 1000) {
  const col  = process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS!;
  const url  = new URL("/v1/nfts", INSIGHT_BASE);

  url.searchParams.append("chain_id", String(BASE_CHAIN_ID));
  url.searchParams.append("limit", String(limit));
  url.searchParams.append("owner_address", ownerAddress);
  url.searchParams.append("contract_address", col);
  url.searchParams.append("include_owners", "false");
  url.searchParams.append("resolve_metadata_links", "true");

  const res = await fetch(url.toString(), { headers: { "x-client-id": CLIENT_ID } });
  if (!res.ok) throw new Error(`Insight ${res.status}: ${res.statusText}`);
  return res.json() as Promise<{ data: Array<{
    token_id: string;
    name?: string;
    image_url?: string;
    extra_metadata?: { attributes?: Array<{ trait_type?: string; value?: string }> };
  }> }>;
}