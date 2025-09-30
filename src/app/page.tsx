"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Flex, Text, Heading, Button, Card, CardBody, Image as CImage, Input, Select, HStack, VStack } from "@chakra-ui/react";
import { getContract, prepareContractCall, sendTransaction } from "thirdweb";
import { base } from "thirdweb/chains";
import { useActiveAccount } from "thirdweb/react";
import { getOwnedNftsByWallet } from "./utils/insight";
import { client } from "../consts/client";
const COLLECTION  = process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS!;
const MARKETPLACE = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS!;

type NftItem = {
  token_id: string;
  name?: string;
  image_url?: string;
  extra_metadata?: {
    attributes?: Array<{ trait_type?: string; value?: string }>;
  };
};

type NftsResp = { data?: NftItem[] };

export default function Home() {
  const [nfts, setNfts]   = useState<NftItem[]>([]);
  const [stats, setStats] = useState<Record<string, { endMs: number; bidCount: number; buyoutWei: string; auctionId: string }>>({});
  const [myBid, setMyBid] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [totalNfts, setTotalNfts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const account = useActiveAccount();

  // 1) load NFTs with pagination
  useEffect(() => {
    const loadNfts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/nfts?page=${currentPage}&limit=${pageSize}`);
        const data = await response.json();
        setNfts(data?.data ?? []);
        setTotalNfts(data?.total ?? 0);
      } catch (error) {
        console.error("Failed to load NFTs:", error);
        setNfts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadNfts();
  }, [currentPage, pageSize]);

  // 2) load auction stats (our cached API)
  useEffect(() => {
    fetch("/api/auction-index").then((r) => r.json()).then(setStats).catch(() => setStats({}));
  }, []);

  // 3) join for cards
  const items = useMemo(() => {
    const now = Date.now();
    return (nfts ?? [])
      .filter((n) => stats[n.token_id]) // show only those currently in auction
      .map((n) => {
        const s = stats[n.token_id];
        const remaining = s.endMs > now ? msToClock(s.endMs - now) : "—";
        const attrs = n.extra_metadata?.attributes ?? [];
        const rank   = pick(attrs, ["rank", "Rank"]);
        const rarity = pick(attrs, ["rarity_percent", "rarity", "Rarity"]);
        const tier   = pick(attrs, ["rarity_tier", "tier", "Tier"]);
        return {
          tokenId: n.token_id,
          name: n.name || `Token #${n.token_id}`,
          img: n.image_url || "",
          remaining,
          rank, rarity, tier,
          bidCount: s.bidCount,
          auctionId: s.auctionId,
          buyoutWei: s.buyoutWei,
        };
      })
      .sort((a, b) => Number(a.tokenId) - Number(b.tokenId));
  }, [nfts, stats]);

  // 4) thirdweb v5 writes (SDK) — replace ABI paths with your files under src/abi/
  const handleBid = async (auctionId: string, ethAmount: string) => {
    const market = getContract({
      client, chain: base,
      address: MARKETPLACE,
      // ✅ ONLY use thirdweb v5 sdk — ensure this ABI matches your deployed Marketplace
      abi: (await import("../abi/nft_marketplace_abi.json")).default as any,
    });

    const wei = toWei(ethAmount);
    const tx = await prepareContractCall({
      contract: market,
      method: "function bidInAuction(uint256 _auctionId, uint256 _bidAmount) payable",
      params: [BigInt(auctionId), wei],
      value: wei,
    });
    await sendTransaction({ transaction: tx, account: account! });
  };

  const handleBuyNow = async (auctionId: string, buyoutWei: string) => {
    const market = getContract({
      client, chain: base,
      address: MARKETPLACE,
      abi: (await import("../abi/nft_marketplace_abi.json")).default as any,
    });

    const wei = BigInt(buyoutWei || "0");
    const tx = await prepareContractCall({
      contract: market,
      method: "function bidInAuction(uint256 _auctionId, uint256 _bidAmount) payable",
      params: [BigInt(auctionId), wei],
      value: wei,
    });
    await sendTransaction({ transaction: tx, account: account! });
  };

  const totalPages = Math.ceil(totalNfts / pageSize);
  const pageOptions = [25, 50, 100, 250];

  return (
    <Box px="xl" py="3xl">
      <VStack spacing="xl" align="stretch">
        <Flex justify="space-between" align="center">
          <Heading fontSize="h1" fontWeight="semibold" color="text.primary">
            Live English Auctions
          </Heading>
          <HStack spacing="lg">
            <Text fontSize="sm" color="text.muted">
              {totalNfts} total NFTs
            </Text>
            <Select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(0); // Reset to first page when changing page size
              }}
              width="120px"
              bg="brand.secondary"
              borderColor="gray.800"
              color="text.primary"
            >
              {pageOptions.map(size => (
                <option key={size} value={size}>{size} per page</option>
              ))}
            </Select>
          </HStack>
        </Flex>

        {isLoading ? (
          <Text color="text.secondary" textAlign="center" py="3xl">
            Loading NFTs...
          </Text>
        ) : (
          <>
            <Flex wrap="wrap" gap="lg">
        {items.map((it) => (
          <Card key={it.tokenId} w="320px" bg="brand.secondary" color="text.primary" border="1px solid" borderColor="gray.800">
            <CardBody>
              <Box mb="md" borderRadius="md" overflow="hidden" bg="brand.primary">
                {it.img ? <CImage src={it.img} alt={it.name} width="100%" height="auto" /> : <Box h="320px" bg="gray.800" />}
              </Box>

              <Text fontWeight="semibold" fontSize="lg" color="text.primary">{it.name}</Text>
              <Text fontSize="sm" color="text.secondary">Ends: {it.remaining}</Text>

              <Box mt="sm" fontSize="sm" color="text.secondary">
                <Text>Rank: {it.rank ?? "—"}</Text>
                <Text>Rarity: {it.rarity ?? "—"}</Text>
                <Text>Tier: {it.tier ?? "—"}</Text>
                <Text>Bids: {it.bidCount}</Text>
              </Box>

              <Flex mt="md" gap="sm" align="center">
                <Input
                  size="sm"
                  w="50%"
                  placeholder="0.01"
                  value={myBid[it.tokenId] ?? ""}
                  onChange={(e) => setMyBid((p) => ({ ...p, [it.tokenId]: e.target.value }))}
                  bg="brand.secondary"
                  borderColor="gray.800"
                  color="text.primary"
                />
                <Button size="sm" variant="secondary" onClick={() => handleBid(it.auctionId, myBid[it.tokenId] || "0")}>
                  BID
                </Button>
                <Button size="sm" variant="primary" onClick={() => handleBuyNow(it.auctionId, it.buyoutWei)}>
                  BUY
                </Button>
              </Flex>
            </CardBody>
          </Card>
        ))}
            </Flex>

            {/* Pagination Controls */}
            <Flex justify="center" align="center" gap="lg" mt="xl">
              <Button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                isDisabled={currentPage === 0}
                size="sm"
                variant="secondary"
              >
                Previous
              </Button>
              
              <Text fontSize="sm" color="text.secondary">
                Page {currentPage + 1} of {totalPages}
              </Text>
              
              <Button
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                isDisabled={currentPage >= totalPages - 1}
                size="sm"
                variant="secondary"
              >
                Next
              </Button>
            </Flex>
          </>
        )}
      </VStack>
    </Box>
  );
}

/* -------- helpers -------- */
function msToClock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d) return `${d}d ${h}h ${m}m`;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${sec}s`;
  return `${sec}s`;
}
function pick(attrs: Array<{ trait_type?: string; value?: string }> = [], keys: string[]) {
  const set = new Set(keys.map((k) => k.toLowerCase()));
  const f = attrs.find((a) => set.has(String(a.trait_type ?? "").toLowerCase()));
  return f?.value;
}
function toWei(eth: string) {
  const [i, f = ""] = eth.trim().split(".");
  const wei = (i || "0") + (f + "000000000000000000").slice(0, 18);
  return BigInt(wei.replace(/^0+/, "") || "0");
}
