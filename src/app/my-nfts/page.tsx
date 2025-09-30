"use client";
import { Box, Heading, Text } from "@chakra-ui/react";

export default function MyNftsPage() {
  return (
    <Box px={6} py={10} maxW="1200px" mx="auto">
      <Heading size="xl" mb={2}>My NFTs</Heading>
      <Text color="gray.400" mb={8}>Connect your wallet to see owned Sluggers on Base.</Text>
      {/* TODO: plug in the Insight-owned query we outlined earlier */}
    </Box>
  );
}