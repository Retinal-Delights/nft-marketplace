// src/app/page.tsx  (or any route you prefer)
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box, Flex, Heading, Text,
  SimpleGrid, Card, CardBody,
  Image as CImage, Select, Button, Spinner,
} from "@chakra-ui/react";

type NftItem = {
  token_id: string;
  name?: string;
  image_url?: string;
  extra_metadata?: {
    attributes?: Array<{ trait_type?: string; value?: string }>;
  };
};

type ApiResp = { items: NftItem[]; page: number; limit: number; total: number; error?: string };

const PAGE_SIZE_OPTIONS = [25, 50, 100, 250] as const;
// If you later want to add power-user sizes, merge them in when an "Advanced" toggle is on.

export default function CollectionGrid() {
  const [limit, setLimit] = useState<number>(50);
  const [page, setPage] = useState<number>(0);
  const [data, setData] = useState<ApiResp>({ items: [], page: 0, limit: 50, total: 0 });
  const [loading, setLoading] = useState(false);

  const totalPages = useMemo(() => {
    if (!data.total || !limit) return 0;
    return Math.max(1, Math.ceil(data.total / limit));
  }, [data.total, limit]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/nfts?limit=${limit}&page=${page}`, { cache: "no-store" });
        const json = (await res.json()) as ApiResp;
        if (!alive) return;
        setData(json);

        // Prefetch next page quietly (optional)
        if (page + 1 < totalPages) {
          fetch(`/api/nfts?limit=${limit}&page=${page + 1}`, { cache: "force-cache" }).catch(() => {});
        }
      } catch (e) {
        if (!alive) return;
        setData({ items: [], page, limit, total: 0 });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [limit, page, totalPages]);

  const onChangeLimit = (v: string) => {
    const next = Number(v);
    setLimit(next);
    setPage(0); // reset to first page when size changes
  };

  return (
    <Box px={6} py={8}>
      <Flex align="center" justify="space-between" mb={5} gap={4} wrap="wrap">
        <Heading size="lg">Retinal Delights — Collection</Heading>
        <Flex align="center" gap={3}>
          <Text color="gray.400">Show</Text>
          <Select
            value={String(limit)}
            onChange={(e) => onChangeLimit(e.target.value)}
            maxW="120px"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </Select>
          <Text color="gray.400">per page</Text>
        </Flex>
      </Flex>

      <Flex align="center" justify="space-between" mb={4} wrap="wrap" gap={4}>
        <Text color="gray.400">
          {data.total ? `Total: ${data.total.toLocaleString()} NFTs` : "Loading total…"}
          {data.error ? ` — (Note: ${data.error})` : ""}
        </Text>
        <Flex align="center" gap={2}>
          <Button onClick={() => setPage((p) => Math.max(0, p - 1))} isDisabled={page === 0}>
            Prev
          </Button>
          <Text>
            Page {page + 1} {totalPages ? `of ${totalPages}` : ""}
          </Text>
          <Button
            onClick={() => setPage((p) => (totalPages ? Math.min(totalPages - 1, p + 1) : p + 1))}
            isDisabled={!!totalPages && page + 1 >= totalPages}
          >
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
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={4}>
          {data.items.map((n) => {
            const rarity =
              n.extra_metadata?.attributes?.find(a => (a.trait_type || "").toLowerCase() === "rarity_tier")?.value
              ?? n.extra_metadata?.attributes?.find(a => (a.trait_type || "").toLowerCase() === "tier")?.value
              ?? n.extra_metadata?.attributes?.find(a => (a.trait_type || "").toLowerCase() === "rarity")?.value
              ?? "—";
            return (
              <Card key={n.token_id} bg="#111" color="#eee" border="1px solid #222" _hover={{ borderColor: "#444" }}>
                <CardBody>
                  <Box mb={3} borderRadius="lg" overflow="hidden" bg="#000">
                    {n.image_url ? (
                      <CImage src={n.image_url} alt={n.name || `Token #${n.token_id}`} width="100%" height="auto" loading="lazy" />
                    ) : (
                      <Box h="260px" bg="#222" />
                    )}
                  </Box>
                  <Text fontWeight="bold" fontSize="lg" noOfLines={1}>
                    {n.name || `Token #${n.token_id}`}
                  </Text>
                  <Text color="gray.400" fontSize="sm">Token #{n.token_id}</Text>
                  <Text mt={1} fontSize="sm">Rarity: {String(rarity)}</Text>
                </CardBody>
              </Card>
            );
          })}
        </SimpleGrid>
      )}
    </Box>
  );
}
