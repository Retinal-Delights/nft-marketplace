// src/app/my-nfts/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  Image as CImage,
  Skeleton,
  Input,
  Select,
} from "@chakra-ui/react";

// thirdweb v5 (wallet)
import { useActiveAccount } from "thirdweb/react";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------
type InsightOwnedResp = {
  data?: Array<{
    token_id: string;
    name?: string;
    image_url?: string;
    extra_metadata?: {
      attributes?: Array<{ trait_type?: string; value?: string }>;
    };
  }>;
};

// Card shape
type OwnedCard = {
  id: string;
  name: string;
  image: string;
  rarity: string;
};

// ------------------------------------------------------------
// Page Component
// ------------------------------------------------------------
export default function MyNftsPage() {
  const account = useActiveAccount(); // requires your thirdweb provider higher up
  const [owned, setOwned] = useState<OwnedCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // optional UX sugar
  const [query, setQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<"" | "common" | "uncommon" | "rare" | "epic" | "legendary">("");

  useEffect(() => {
    const fetchOwned = async () => {
      if (!account?.address) {
        setOwned([]);
        return;
      }
      try {
        setIsLoading(true);

        const base = process.env.NEXT_PUBLIC_INSIGHT_BASE_URL || process.env.INSIGHT_BASE_URL || "https://insight.thirdweb.com";
        const cid  = process.env.NEXT_PUBLIC_CLIENT_ID!;
        const col  = process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS!;
        const url  = new URL("/v1/nfts", base);

        // Only this collection on Base (8453) for this wallet
        url.searchParams.append("chain_id", "8453");
        url.searchParams.append("limit", "1000");
        url.searchParams.append("owner_address", account.address);
        url.searchParams.append("contract_address", col);
        url.searchParams.append("include_owners", "false");
        url.searchParams.append("resolve_metadata_links", "true");

        const res = await fetch(url.toString(), { headers: { "x-client-id": cid } });
        if (!res.ok) throw new Error(`Insight ${res.status}: ${res.statusText}`);

        const json: InsightOwnedResp = await res.json();
        const items = (json.data ?? []).map((n) => {
          const attrs = n.extra_metadata?.attributes ?? [];
          const rarityRaw =
            attrs.find(a => (a.trait_type || "").toLowerCase() === "rarity_tier")?.value ??
            attrs.find(a => (a.trait_type || "").toLowerCase() === "tier")?.value ??
            attrs.find(a => (a.trait_type || "").toLowerCase() === "rarity")?.value ??
            "unknown";
          return {
            id: n.token_id,
            name: n.name || `Token #${n.token_id}`,
            image: n.image_url || "/placeholder-nft.webp",
            rarity: String(rarityRaw).toLowerCase(),
          } as OwnedCard;
        });

        // Sort by numeric token id ascending by default
        items.sort((a, b) => Number(a.id) - Number(b.id));
        setOwned(items);
      } catch (e) {
        console.warn("Owned NFTs (Insight) failed:", e);
        setOwned([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOwned();
  }, [account?.address]);

  // simple client-side search & filter
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return owned.filter((x) => {
      const matchesQuery =
        !q ||
        x.name.toLowerCase().includes(q) ||
        x.id.toLowerCase().includes(q) ||
        x.rarity.toLowerCase().includes(q);
      const matchesTier = !tierFilter || x.rarity === tierFilter;
      return matchesQuery && matchesTier;
    });
  }, [owned, query, tierFilter]);

  return (
    <Box px={6} py={8}>
      <Heading mb={2}>My NFTs</Heading>
      <Text color="gray.400" mb={6}>
        Wallet: {account?.address ? short(account.address) : "Not connected"}
      </Text>

      {/* Controls */}
      <Flex gap={3} mb={6} wrap="wrap">
        <Input
          placeholder="Search by name, token id, or rarity…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          maxW="360px"
        />
        <Select
          placeholder="Filter by tier/rarity"
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value as typeof tierFilter)}
          maxW="240px"
        >
          <option value="common">Common</option>
          <option value="uncommon">Uncommon</option>
          <option value="rare">Rare</option>
          <option value="epic">Epic</option>
          <option value="legendary">Legendary</option>
        </Select>
        <Flex align="center" ml="auto" gap={2}>
          <Text color="gray.400">Total:</Text>
          <Text fontWeight="semibold">{isLoading ? "…" : owned.length}</Text>
        </Flex>
      </Flex>

      {/* Loading state */}
      {isLoading && (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={4}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} bg="#111" border="1px solid #222">
              <CardBody>
                <Skeleton height="260px" mb={3} />
                <Skeleton height="20px" mb={2} />
                <Skeleton height="16px" mb={1} />
                <Skeleton height="16px" />
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {/* Empty / Not connected */}
      {!isLoading && (!account?.address || owned.length === 0) && (
        <Box
          border="1px solid #222"
          bg="#0f0f0f"
          color="#ddd"
          borderRadius="lg"
          p={8}
          textAlign="center"
        >
          <Heading size="md" mb={2}>
            {account?.address ? "No NFTs found in this collection" : "Connect your wallet"}
          </Heading>
          <Text color="gray.400">
            {account?.address
              ? "When you own items from this collection on Base, they’ll show up here."
              : "Use the connect button (top-right) and we’ll fetch your owned NFTs on Base (8453)."}
          </Text>
        </Box>
      )}

      {/* Grid */}
      {!isLoading && account?.address && visible.length > 0 && (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={4}>
          {visible.map((nft) => (
            <Card key={nft.id} bg="#111" color="#eee" border="1px solid #222" _hover={{ borderColor: "#444" }}>
              <CardBody>
                <Box mb={3} borderRadius="lg" overflow="hidden" bg="#000">
                  {nft.image ? (
                    <CImage src={nft.image} alt={nft.name} width="100%" height="auto" />
                  ) : (
                    <Box h="260px" bg="#222" />
                  )}
                </Box>
                <Text fontWeight="bold" fontSize="lg" noOfLines={1}>
                  {nft.name}
                </Text>
                <Text color="gray.400" fontSize="sm">Token #{nft.id}</Text>
                <Text mt={1} fontSize="sm">Rarity: {pretty(nft.rarity)}</Text>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function short(a?: string) {
  if (!a) return "—";
  return a.slice(0, 6) + "…" + a.slice(-4);
}
function pretty(s: string) {
  if (!s) return "—";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
