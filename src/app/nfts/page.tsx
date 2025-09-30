"use client";
import { useEffect, useMemo, useState } from "react";
import { Box, Flex, Heading, Text, SimpleGrid, Select, Button, Spinner } from "@chakra-ui/react";
import NftCard, { AuctionInfo } from "../../components/market/NftCard";
import { toCardFields } from "../../components/market/traitHelpers";
import { ipfsToHttp } from "../../utils/ipfs";
import { ErrorBoundary } from "../../components/ErrorBoundary";

type InsightNft = {
  token_id: string;
  name?: string;
  image_url?: string;
  extra_metadata?: { attributes?: Array<{ trait_type?: string; value?: string }> };
};
type NftApiResp = { items: InsightNft[]; page: number; limit: number; total: number; error?: string };
type AuctionIndexResp = Record<string, AuctionInfo>;

const EMPTY: NftApiResp = { items: [], page: 0, limit: 50, total: 0 };
const PAGE_SIZE_OPTIONS = [25, 50, 100, 250] as const;

export default function NftsPage() {
  const [limit, setLimit] = useState<number>(50);
  const [page, setPage]   = useState<number>(0);
  const [data, setData]   = useState<NftApiResp>(EMPTY);
  const [auctions, setAuctions] = useState<AuctionIndexResp>({});
  const [loading, setLoading] = useState(false);

  const totalPages = useMemo(() => data.total && limit ? Math.max(1, Math.ceil(data.total / limit)) : 0, [data.total, limit]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [listRes, aucRes] = await Promise.all([
          fetch(`/api/nfts?limit=${limit}&page=${page}`, { cache: "no-store" }),
          fetch(`/api/auction-index`, { cache: "no-store" }),
        ]);
        const listJson = (await listRes.json()) as NftApiResp;
        const aucJson  = (await aucRes.json())  as AuctionIndexResp;
        if (!alive) return;
        
        // Ensure we always have a valid shape
        const safeData: NftApiResp = {
          items: Array.isArray(listJson?.items) ? listJson.items : [],
          page: typeof listJson?.page === 'number' ? listJson.page : page,
          limit: typeof listJson?.limit === 'number' ? listJson.limit : limit,
          total: typeof listJson?.total === 'number' ? listJson.total : 0,
          error: listJson?.error
        };
        
        setData(safeData);
        setAuctions(aucJson || {});
      } catch {
        if (!alive) return;
        setData(EMPTY);
        setAuctions({});
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [limit, page]);

  return (
    <Box px={6} py={8}>
      <Heading size="xl" mb={2}>Live English Auctions</Heading>

      <Flex align="center" justify="space-between" mb={5} gap={4} wrap="wrap">
        <Text color="gray.400">{data.total ? `${data.total.toLocaleString()} total NFTs` : "Loading total…"}</Text>
        <Flex align="center" gap={2}>
          <Select value={String(limit)} onChange={(e) => { setLimit(Number(e.target.value)); setPage(0); }} maxW="150px">
            {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n} per page</option>)}
          </Select>
          <Button onClick={() => setPage(p => Math.max(0, p - 1))} isDisabled={page === 0}>Previous</Button>
          <Text>Page {page + 1}{totalPages ? ` of ${totalPages}` : ""}</Text>
          <Button onClick={() => setPage(p => (totalPages ? Math.min(totalPages - 1, p + 1) : p + 1))}
                  isDisabled={!!totalPages && page + 1 >= totalPages}>
            Next
          </Button>
        </Flex>
      </Flex>

      {loading && data.items.length === 0 ? (
        <Flex align="center" justify="center" minH="40vh" direction="column" gap={3}>
          <Spinner />
          <Text color="gray.400">Loading NFTs…</Text>
        </Flex>
      ) : (
        <ErrorBoundary>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={4}>
            {(data?.items ?? []).map(n => {
              const { rarity, rank, tier } = toCardFields(n);
              const a = auctions[n.token_id];
              const img = ipfsToHttp(n.image_url);
              return (
                <NftCard
                  key={n.token_id}
                  tokenId={n.token_id}
                  name={n.name || `Satoshe Slugger #${n.token_id}`}
                  image={img}
                  rank={rank}
                  rarity={rarity}
                  tier={tier}
                  endsAt={a?.endMs ?? null}
                  bidCount={a?.bidCount ?? 0}
                  // onBid / onBuy will be wired to thirdweb v5 writes later:
                  onBid={undefined}
                  onBuy={undefined}
                />
              );
            })}
          </SimpleGrid>
        </ErrorBoundary>
      )}
    </Box>
  );
}
