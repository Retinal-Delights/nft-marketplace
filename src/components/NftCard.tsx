"use client";
import { Box, Text, Image, HStack, Badge } from "@chakra-ui/react";
import { ipfsToHttp } from "../utils/ipfs";

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
}: {
  tokenId: string;
  name: string;
  imageUrl?: string;
  attributes: Attr[];
  listingId?: string;
  bidCount?: number;
  endSec: number | null;
}) {
  const rarity = String(findAttr(attributes, "rarity_tier") || findAttr(attributes, "tier") || "").toLowerCase();
  const rank = String(findAttr(attributes, "rank") || "");
  const img = ipfsToHttp(imageUrl) || "/placeholder-nft.webp";

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
      borderRadius="md"
      bg="brand.secondary"
      overflow="hidden"
      _hover={{ transform: "scale(1.02)" }}
      transition="all 0.15s ease-in-out"
    >
      <Image src={img} alt={name} width="100%" height="240px" objectFit="cover" />

      <Box p="md">
        <Text fontWeight="semibold" noOfLines={1} color="text.primary">{name}</Text>
        <HStack mt="sm" spacing="sm">
          {rank && <Badge variant="outline" colorScheme="gray">Rank {rank}</Badge>}
          {rarity && <Badge variant="outline" colorScheme="purple">{rarity}</Badge>}
        </HStack>

        <HStack mt="md" justify="space-between" color="text.muted" fontSize="sm">
          <Text>Time: {remainingText}</Text>
          <Text>{bidCount ?? 0} bids</Text>
        </HStack>

        <HStack mt="md" justify="space-between" fontSize="sm">
          <Text color="text.muted">Token #{tokenId}</Text>
          <Text color="text.muted">{listingId ? `Listing ${listingId}` : "Not listed"}</Text>
        </HStack>
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
