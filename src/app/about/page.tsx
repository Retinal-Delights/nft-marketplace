"use client";
import { Box, Heading, Text, Stack } from "@chakra-ui/react";

export default function AboutPage() {
  return (
    <Box px={6} py={10} maxW="1200px" mx="auto">
      <Heading size="2xl" mb={3}>Satoshe Sluggers</Heading>
      <Text color="gray.400" mb={8}>
        A Retinal Delights marketplace on Base. Precision-crafted NFTs, auction-first.
      </Text>

      <Stack spacing={6}>
        <Text>
          Built for speed and transparency: Insight-backed reads, explicit on-chain writes.
          No fluff, no mystery meat.
        </Text>
        <Text>
          Edition: 1 • Total Supply: 7,777 • Rarity Tiers: 11
        </Text>
      </Stack>
    </Box>
  );
}