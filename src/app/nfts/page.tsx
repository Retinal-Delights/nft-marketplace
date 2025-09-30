"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box, SimpleGrid, Heading, HStack, Select, Text, Spinner,
} from "@chakra-ui/react";
import NftCard from "../../components/NftCard";

type AuctionRow = {
  tokenId: string;
  listingId: string;
  bidCount: number;
  endSec: number | null;
  status: "active";
};

type NftItem = {
  token_id: string;
  name?: string;
  image_url?: string;
  extra_metadata?: {
    attributes?: Array<{ trait_type?: string; value?: string | number }>;
  };
};

type NftsApiResp = {
  items: NftItem[];
  page: number;
  limit: number;
  total: number;
};

export default function NftsPage() {
  // paging
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(25); // 25 | 50 | 100 | 250 (safe with Insight)
  const [loading, setLoading] = useState(true);
  const [nfts, setNfts] = useState<NftsApiResp>({ items: [], page: 0, limit: 25, total: 0 });
  const [auctions, setAuctions] = useState<Record<string, AuctionRow>>({}); // key: tokenId

  // fetch NFTs (read-only via your API route -> Insight)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/nfts?limit=${limit}&page=${page}`, { cache: "no-store" });
        const data = (await res.json()) as NftsApiResp;
        if (!alive) return;
        setNfts({
          items: data?.items ?? [],
          page: data?.page ?? page,
          limit: data?.limit ?? limit,
          total: data?.total ?? 0,
        });
      } catch (e) {
        console.warn("NFTs fetch failed", e);
        if (!alive) return;
        setNfts({ items: [], page: 0, limit, total: 0 });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [page, limit]);

  // fetch auction mapping (tokenId -> listingId, bidCount, endSec)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/auction-map", { cache: "no-store" });
        const j = await res.json();
        const map: Record<string, AuctionRow> = {};
        for (const r of j?.items ?? []) {
          map[String(r.tokenId)] = {
            tokenId: String(r.tokenId),
            listingId: String(r.listingId),
            bidCount: Number(r.bidCount || 0),
            endSec: r.endSec ? Number(r.endSec) : null,
            status: "active",
          };
        }
        if (alive) setAuctions(map);
      } catch (e) {
        console.warn("auction-map fetch failed", e);
        if (alive) setAuctions({});
      }
    })();
    return () => { alive = false; };
  }, []);

  const totalPages = useMemo(() => {
    const t = nfts.total ?? 0;
    return t > 0 ? Math.ceil(t / limit) : 1;
  }, [nfts.total, limit]);

  const items = nfts.items ?? [];

  return (
    <Box px="xl" py="3xl" maxW="1200px" mx="auto">
      <HStack justify="space-between" mb="xl">
        <Heading fontSize="h1" fontWeight="semibold" color="text.primary">NFTs</Heading>
        <HStack>
          <Text color="text.muted" fontSize="sm">Per page</Text>
          <Select
            size="sm"
            width="90px"
            value={limit}
            onChange={(e) => { setPage(0); setLimit(Number(e.target.value)); }}
            bg="brand.secondary"
            borderColor="gray.800"
            color="text.primary"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
          </Select>
        </HStack>
      </HStack>

      {loading ? (
        <HStack justify="center" py="3xl">
          <Spinner color="brand.accent" />
          <Text color="text.muted">Loading NFTs…</Text>
        </HStack>
      ) : items.length === 0 ? (
        <Text color="text.muted">No NFTs found.</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
          {items.map((n) => {
            const tokenId = String(n.token_id);
            const auction = auctions[tokenId];
            return (
              <NftCard
                key={tokenId}
                tokenId={tokenId}
                name={n.name || `Token #${tokenId}`}
                imageUrl={n.image_url}
                attributes={n.extra_metadata?.attributes || []}
                listingId={auction?.listingId}
                bidCount={auction?.bidCount ?? 0}
                endSec={auction?.endSec ?? null}
              />
            );
          })}
        </SimpleGrid>
      )}

      {/* simple pager */}
      <HStack justify="space-between" mt="3xl">
        <Text color="text.muted" fontSize="sm">
          Page {page + 1} / {totalPages} • Total {nfts.total ?? 0}
        </Text>
        <HStack>
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            style={{
              padding: '8px 16px',
              backgroundColor: page === 0 ? '#2C2C2C' : '#1A1A1A',
              color: page === 0 ? '#6E6E6E' : '#FFFFFF',
              border: '1px solid #2C2C2C',
              borderRadius: '2px',
              cursor: page === 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            ‹ Prev
          </button>
          <button
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            style={{
              padding: '8px 16px',
              backgroundColor: page + 1 >= totalPages ? '#2C2C2C' : '#1A1A1A',
              color: page + 1 >= totalPages ? '#6E6E6E' : '#FFFFFF',
              border: '1px solid #2C2C2C',
              borderRadius: '2px',
              cursor: page + 1 >= totalPages ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            Next ›
          </button>
        </HStack>
      </HStack>
    </Box>
  );
}
