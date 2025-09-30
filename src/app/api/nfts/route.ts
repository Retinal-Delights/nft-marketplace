export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";

const CHAIN_ID = 8453;
const CONTRACT = process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS!;
const BASE = process.env.NEXT_PUBLIC_INSIGHT_BASE_URL || "https://insight.thirdweb.com";
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID!;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 25), 1000);
  const page = Math.max(Number(searchParams.get("page") ?? 0), 0);

  const url = `${BASE}/v1/nfts/${CONTRACT}?chain_id=${CHAIN_ID}&limit=${limit}&page=${page}&include_owners=false&resolve_metadata_links=true`;

  const res = await fetch(url, { headers: { "x-client-id": CLIENT_ID }, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ items: [], page, limit, total: 0, error: text }, { status: 200 });
  }

  const j = await res.json();
  const data = Array.isArray(j?.data) ? j.data : [];

  const items = data.map((n: any) => {
    // Prefer image_url, fallback to extra_metadata.image
    const image = n.image_url || n?.extra_metadata?.image || n?.extra_metadata?.image_url || null;
    return {
      ...n,
      image_url: image, // keep the field name the UI expects
    };
  });

  // total is not provided directly; approximate from page+limit when needed
  const total = (items.length < limit && page === 0) ? items.length : (page + 1) * limit;

  return NextResponse.json({ items, page, limit, total }, { status: 200 });
}