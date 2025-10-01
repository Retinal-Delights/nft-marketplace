"use client";
import { Box, Text, Image, HStack, VStack, Badge } from "@chakra-ui/react";
import { ipfsToHttp } from "../utils/ipfs";
import { AuctionActions } from "./AuctionActions";

type Attr = { trait_type?: string; value?: string | number };
function findAttr(attrs: Attr[], key: string) {
  const k = key.toLowerCase();
  return attrs.find(a => (a.trait_type || "").toLowerCase() === k)?.value ?? "";
}

export default function NftCard({
  tokenId,
  name,
  imageUrl,
  attributes,
  listingId,
  bidCount,
  endSec,
  minBid,
  buyoutPrice,
  currency = "ETH",
}: {
  tokenId: string;
  name: string;
  imageUrl?: string;
  attributes: Attr[];
  listingId?: string;
  bidCount?: number;
  endSec: number | null;
  minBid?: string;
  buyoutPrice?: string;
  currency?: string;
}) {
  const rarity = String(findAttr(attributes, "rarity_tier") || findAttr(attributes, "tier") || "").toLowerCase();
  const rank = String(findAttr(attributes, "rank") || "");
  const img = ipfsToHttp(imageUrl) || "/media/placeholder-nft.webp";

  const remaining = endSec
    ? Math.max(0, endSec * 1000 - Date.now())
    : null;

  const remainingText = remaining == null
    ? "—"
    : remaining <= 0
      ? "Ended"
      : formatDuration(remaining);

  return (
    <Box
      width="270px"
      borderRadius="md"
      bg="brand.secondary"
      overflow="hidden"
      _hover={{ transform: "scale(1.02)" }}
      transition="all 0.15s ease-in-out"
    >
      <Image 
        src={img} 
        alt={name} 
        width="100%" 
        height="200px" 
        objectFit="contain"
        objectPosition="center"
        fallbackSrc="/media/placeholder-nft.webp"
      />

      <Box p="md">
        <Text fontWeight="semibold" noOfLines={1} color="text.primary">{name}</Text>
        <HStack mt="sm" spacing="sm">
          {rank && <Badge variant="outline" colorScheme="gray">Rank {rank}</Badge>}
          {rarity && <Badge variant="outline" colorScheme="purple">{rarity}</Badge>}
        </HStack>

        <VStack mt="md" spacing="xs" align="stretch" color="text.muted" fontSize="sm">
          <HStack justify="space-between">
            <Text>Time: {remainingText}</Text>
            <Text>{bidCount ?? 0} bids</Text>
          </HStack>
          <HStack justify="space-between">
            <Text>Token #{tokenId}</Text>
            <Text>{listingId ? `Listing ${listingId}` : "Not listed"}</Text>
          </HStack>
          
          {/* Auction Actions */}
          <AuctionActions
            listingId={listingId}
            endSec={endSec || 0}
            minBid={minBid}
            buyoutPrice={buyoutPrice}
            currency={currency}
          />
        </VStack>
      </Box>
    </Box>
  );
}

function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
