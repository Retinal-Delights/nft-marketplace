export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { insight } from "../../utils/insight";

const COLLECTION = process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS!;

export async function GET(request: Request) {
  if (!process.env.NEXT_PUBLIC_CLIENT_ID) {
    return NextResponse.json({ error: "Client ID not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "0");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 1000); // Cap at 1000

  try {
    const response = await insight<{ 
      data: Array<{
        token_id: string;
        name?: string;
        image_url?: string;
        extra_metadata?: { attributes?: Array<{ trait_type?: string; value?: string }> };
      }>;
      total?: number;
    }>(`/v1/nfts/${COLLECTION}`, {
      limit,
      page,
      include_owners: "false",
      resolve_metadata_links: "true",
    });

    return NextResponse.json(response, { 
      headers: { 
        "Cache-Control": "s-maxage=60, stale-while-revalidate=30" 
      } 
    });
  } catch (err) {
    console.warn("NFTs fetch failed:", err);
    return NextResponse.json({ error: "Failed to fetch NFTs" }, { status: 500 });
  }
}