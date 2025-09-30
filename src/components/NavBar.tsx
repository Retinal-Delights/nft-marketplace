"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import {
  Box, Flex, HStack, Link as CLink, IconButton, useColorMode, Text, Image, Spacer,
} from "@chakra-ui/react";
import { SunIcon, MoonIcon } from "@chakra-ui/icons";
import { ConnectButton } from "thirdweb/react";
import { client } from "../consts/client";

const LINKS = [
  { href: "/", label: "HOME" },
  { href: "/about", label: "ABOUT" },
  { href: "/nfts", label: "NFTS" },
  { href: "/sell", label: "SELL" },
  { href: "/contact", label: "CONTACT" },
  { href: "/my-nfts", label: "MY NFTS" },
];

function NavItem({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <CLink
      as={NextLink}
      href={href}
      px="3"
      py="2"
      fontWeight={active ? "bold" : "medium"}
      letterSpacing="wide"
      color={active ? "white" : "gray.300"}
      borderBottom="2px solid"
      borderColor={active ? "pink.400" : "transparent"}
      _hover={{ textDecoration: "none", color: "white" }}
      transition="all 0.15s ease"
    >
      {label}
    </CLink>
  );
}

export default function NavBar() {
  const pathname = usePathname();
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Box as="header" bg="gray.900" borderBottom="1px" borderColor="whiteAlpha.200" px={6} py={3} position="sticky" top={0} zIndex={50}>
      <Flex align="center" gap={6} maxW="1200px" mx="auto">
        {/* Brand */}
        <HStack as={NextLink} href="/" spacing={3} _hover={{ textDecoration: "none" }}>
          <Image src="/logo-eye.svg" alt="Retinal Delights" boxSize="28px" />
          <Text fontSize="xl" fontWeight="bold" letterSpacing="wide">
            <Text as="span" color="white">RETINAL</Text>{" "}
            <Text as="span" color="gray.300" fontStyle="italic">Delights</Text>
          </Text>
        </HStack>

        {/* Center links */}
        <HStack spacing={1} mx="auto" display={{ base: "none", md: "flex" }}>
          {LINKS.map((l) => (
            <NavItem key={l.href} href={l.href} label={l.label} active={pathname === l.href} />
          ))}
        </HStack>

        <Spacer />

        {/* Right controls */}
        <HStack spacing={3}>
          <IconButton
            aria-label="Toggle color mode"
            size="sm"
            variant="ghost"
            icon={colorMode === "dark" ? <SunIcon /> : <MoonIcon />}
            onClick={toggleColorMode}
          />
          <ConnectButton client={client} theme="dark" />
        </HStack>
      </Flex>
    </Box>
  );
}
