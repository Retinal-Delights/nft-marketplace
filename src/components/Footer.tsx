"use client";

import { Box, Flex, Link, Text, Icon } from "@chakra-ui/react";
import { FaHeart } from "react-icons/fa";

export default function Footer() {
  return (
    <Box as="footer" bg="brand.primary" color="text.muted" py="xl" px="lg">
      <Flex
        direction={{ base: "column", md: "row" }}
        align="center"
        justify="space-between"
        maxW="7xl"
        mx="auto"
      >
        {/* Left side: Legal links */}
        <Flex
          wrap="wrap"
          gap="lg"
          justify={{ base: "center", md: "flex-start" }}
          mb={{ base: "lg", md: 0 }}
        >
          <Link href="https://retinaldelights.io/terms" isExternal color="text.muted" fontSize="sm" _hover={{ color: "brand.highlight" }}>
            TERMS OF SERVICE
          </Link>
          <Link href="https://retinaldelights.io/privacy" isExternal color="text.muted" fontSize="sm" _hover={{ color: "brand.highlight" }}>
            PRIVACY POLICY
          </Link>
          <Link href="https://retinaldelights.io/cookies" isExternal color="text.muted" fontSize="sm" _hover={{ color: "brand.highlight" }}>
            COOKIES POLICY
          </Link>
          <Link href="https://retinaldelights.io/nft-license-agreement" isExternal color="text.muted" fontSize="sm" _hover={{ color: "brand.highlight" }}>
            NFT LICENSE AGREEMENT
          </Link>
          <Link href="https://retinaldelights.io/nft-listing-policy" isExternal color="text.muted" fontSize="sm" _hover={{ color: "brand.highlight" }}>
            NFT LISTING
          </Link>
          <Link href="https://retinaldelights.io/acceptable-use-policy" isExternal color="text.muted" fontSize="sm" _hover={{ color: "brand.highlight" }}>
            ACCEPTABLE USE POLICY
          </Link>
          <Link href="https://retinaldelights.io/disclaimer" isExternal color="text.muted" fontSize="sm" _hover={{ color: "brand.highlight" }}>
            DISCLAIMER
          </Link>
        </Flex>

        {/* Right side: Credits */}
        <Flex direction="column" align={{ base: "center", md: "flex-end" }}>
          <Text fontSize="sm" color="text.muted">
            Created with{" "}
            <Icon as={FaHeart} color="brand.accent" mx="xs" /> in Los Angeles by{" "}
            <Link href="https://kristenwoerdeman.com" isExternal color="brand.highlight" _hover={{ textDecoration: "underline" }}>
              kwoerd
            </Link>
          </Text>
          <Text fontSize="sm" color="text.muted">
            2025 ©{" "}
            <Link href="https://retinaldelights.io" isExternal color="brand.highlight" _hover={{ textDecoration: "underline" }}>
              Retinal Delights, Inc.
            </Link>{" "}
            All Rights Reserved
          </Text>
        </Flex>
      </Flex>
    </Box>
  );
}
