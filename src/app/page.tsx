"use client";

import { Box, Flex, Text, Heading, Button, VStack } from "@chakra-ui/react";
import Link from "next/link";

export default function Home() {
  return (
    <Box px="xl" py="3xl">
      <VStack spacing="3xl" align="center" textAlign="center">
        <VStack spacing="lg">
          <Heading fontSize="4xl" fontWeight="bold" color="text.primary">
            Welcome to Retinal Delights
          </Heading>
          <Text fontSize="lg" color="text.secondary" maxW="600px">
            Discover, bid, and collect unique NFTs from our curated marketplace. 
            Experience the future of digital art and collectibles.
          </Text>
        </VStack>

        <VStack spacing="lg">
          <Heading fontSize="h2" fontWeight="semibold" color="text.primary">
            Explore Our Collection
          </Heading>
          <Text color="text.muted" maxW="500px">
            Browse through thousands of unique NFTs, each with their own story and rarity. 
            Find your perfect piece in our carefully curated marketplace.
          </Text>
          <Button as={Link} href="/nfts" size="lg" variant="primary">
            View All NFTs
          </Button>
        </VStack>

        <VStack spacing="lg">
          <Heading fontSize="h2" fontWeight="semibold" color="text.primary">
            Start Trading
          </Heading>
          <Text color="text.muted" maxW="500px">
            Ready to buy or sell? Connect your wallet and start trading NFTs 
            in our secure, decentralized marketplace.
          </Text>
          <Button as={Link} href="/sell" size="lg" variant="secondary">
            List Your NFTs
          </Button>
        </VStack>
      </VStack>
    </Box>
  );
}