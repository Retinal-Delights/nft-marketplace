"use client";
import { Card, CardBody, Box, Text, Flex, Button, Tooltip } from "@chakra-ui/react";

export type AuctionInfo = { endMs: number; bidCount: number; buyoutWei: string; auctionId: string };

export type NftCardProps = {
  tokenId: string;
  name: string;
  image: string | null;
  rank?: string | number;
  rarity?: string;
  tier?: string;
  endsAt?: number | null;      // ms
  bidCount?: number;           // from auction-index
  onBid?: () => void;          // wire later to thirdweb v5
  onBuy?: () => void;          // wire later to thirdweb v5
};

function formatCountdown(ms?: number | null) {
  if (!ms || ms <= Date.now()) return "Ended";
  const s = Math.floor((ms - Date.now()) / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

export default function NftCard({
  tokenId, name, image, rank, rarity, tier, endsAt, bidCount = 0, onBid, onBuy,
}: NftCardProps) {
  return (
    <Card bg="#17181c" color="#eee" border="1px solid #26282d" _hover={{ borderColor: "#3b3d45" }}>
      <CardBody>
        <Box borderRadius="lg" overflow="hidden" bg="#0f1013" mb={3} aspectRatio={1}>
          {image ? (
            // Chakra Image sometimes flickers with remote URLs; native img is fine here.
            // You can switch to next/image later.
            <img src={image} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
          ) : (
            <Box h="260px" bg="#20222a" />
          )}
        </Box>

        <Text fontWeight="bold" fontSize="lg" noOfLines={1}>{name}</Text>
        <Text color="gray.400" fontSize="sm">Ends: {formatCountdown(endsAt)}</Text>

        <Flex mt={2} gap={3} wrap="wrap" fontSize="sm">
          <Text><strong>Rank:</strong> {rank ?? "—"}</Text>
          <Text><strong>Rarity:</strong> {rarity ?? "—"}</Text>
          <Text><strong>Tier:</strong> {tier ?? "—"}</Text>
          <Text><strong>Bids:</strong> {bidCount}</Text>
        </Flex>

        <Flex mt={3} gap={2}>
          <Tooltip label="Place a bid (hooks into MarketplaceV3 later)">
            <Button size="sm" variant="outline" onClick={onBid} isDisabled={!onBid}>BID</Button>
          </Tooltip>
          <Tooltip label="Buy now (hooks into MarketplaceV3 later)">
            <Button size="sm" colorScheme="pink" onClick={onBuy} isDisabled={!onBuy}>BUY</Button>
          </Tooltip>
        </Flex>
      </CardBody>
    </Card>
  );
}
