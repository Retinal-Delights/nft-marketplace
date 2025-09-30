export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { CLIENT_ID, INSIGHT_BASE, BASE_CHAIN_ID } from "../../consts/env";

const COLLECTION = process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS!;
const ALLOWED_LIMITS = new Set([25, 50, 100, 250]);

export async function GET(request: Request) {
  const headers = { "x-client-id": CLIENT_ID };
  
  if (!headers["x-client-id"]) {
    return NextResponse.json({ items: [], page: 0, limit: 50, total: 0 }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(0, parseInt(searchParams.get("page") || "0"));
  const requestedLimit = parseInt(searchParams.get("limit") || "50");
  const limit = ALLOWED_LIMITS.has(requestedLimit) ? requestedLimit : 50;

  try {
    const url = `${INSIGHT_BASE}/v1/nfts/${COLLECTION}?chain_id=${BASE_CHAIN_ID}&limit=${limit}&page=${page}&include_owners=false&resolve_metadata_links=true`;
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Insight ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      items: data?.data ?? [],
      page,
      limit,
      total: data?.total ?? 0
    }, { 
      headers: { 
        "Cache-Control": "s-maxage=60, stale-while-revalidate=30" 
      } 
    });
  } catch (err) {
    console.warn("NFTs fetch failed:", err);
    return NextResponse.json({ items: [], page, limit, total: 0 }, { 
      headers: { 
        "Cache-Control": "no-store" 
      } 
    });
  }
}