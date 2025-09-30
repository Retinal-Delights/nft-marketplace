"use client";
import { useState } from "react";
import { Box, Heading, Text, Stack, Input, Button, FormLabel, Select } from "@chakra-ui/react";

export default function SellPage() {
  const [tokenId, setTokenId] = useState("");
  const [type, setType] = useState<"auction" | "direct">("auction");
  const [price, setPrice] = useState("");

  // TODO: wire to thirdweb v5 write (MarketplaceV3: createAuction / createListing)
  const onSubmit = () => {
    // validate then call contract write
  };

  return (
    <Box px={6} py={10} maxW="800px" mx="auto">
      <Heading size="xl" mb={2}>List Your NFT</Heading>
      <Text color="gray.400" mb={8}>English auctions or buy-now listings.</Text>

      <Stack spacing={5}>
        <div>
          <FormLabel>Token ID</FormLabel>
          <Input value={tokenId} onChange={(e) => setTokenId(e.target.value)} placeholder="e.g. 1234" />
        </div>
        <div>
          <FormLabel>Type</FormLabel>
          <Select value={type} onChange={(e) => setType(e.target.value as any)}>
            <option value="auction">English Auction</option>
            <option value="direct">Buy Now</option>
          </Select>
        </div>
        <div>
          <FormLabel>{type === "auction" ? "Starting Bid (wei/ETH)" : "Buy Now (wei/ETH)"}</FormLabel>
          <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 0.015" />
        </div>
        <Button onClick={onSubmit} colorScheme="pink">Create Listing</Button>
        <Text fontSize="sm" color="gray.500">
          Reads stay on Insight. Writes use thirdweb v5 directly to your MarketplaceV3.
        </Text>
      </Stack>
    </Box>
  );
}
