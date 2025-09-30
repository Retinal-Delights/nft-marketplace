"use client";

import { Box, Flex, Link, Text, Icon } from "@chakra-ui/react";
import { FaHeart } from "react-icons/fa";

export default function Footer() {
  return (
    <Box as="footer" bg="gray.900" color="gray.300" py={6} px={4}>
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
          gap={4}
          justify={{ base: "center", md: "flex-start" }}
          mb={{ base: 4, md: 0 }}
        >
          <Link href="https://retinaldelights.io/terms" isExternal>
            TERMS OF SERVICE
          </Link>
          <Link href="https://retinaldelights.io/privacy" isExternal>
            PRIVACY POLICY
          </Link>
          <Link href="https://retinaldelights.io/cookies" isExternal>
            COOKIES POLICY
          </Link>
          <Link href="https://retinaldelights.io/nft-license-agreement" isExternal>
            NFT LICENSE AGREEMENT
          </Link>
          <Link href="https://retinaldelights.io/nft-listing-policy" isExternal>
            NFT LISTING
          </Link>
          <Link href="https://retinaldelights.io/acceptable-use-policy" isExternal>
            ACCEPTABLE USE POLICY
          </Link>
          <Link href="https://retinaldelights.io/disclaimer" isExternal>
            DISCLAIMER
          </Link>
        </Flex>

        {/* Right side: Credits */}
        <Flex direction="column" align={{ base: "center", md: "flex-end" }}>
          <Text>
            Created with{" "}
            <Icon as={FaHeart} color="pink.400" mx={1} /> in Los Angeles by{" "}
            <Link href="https://kristenwoerdeman.com" isExternal color="pink.400">
              kwoerd
            </Link>
          </Text>
          <Text fontSize="sm">
            2025 ©{" "}
            <Link href="https://retinaldelights.io" isExternal color="pink.400">
              Retinal Delights, Inc.
            </Link>{" "}
            All Rights Reserved
          </Text>
        </Flex>
      </Flex>
    </Box>
  );
}
