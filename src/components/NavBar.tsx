"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import {
  Box, Flex, HStack, Link as CLink, Text, Image, Spacer,
} from "@chakra-ui/react";
import { ConnectButton } from "thirdweb/react";
import { client } from "../lib/thirdweb";
import { base } from "thirdweb/chains";

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
      fontWeight={active ? "semibold" : "medium"}
      letterSpacing="wide"
      color={active ? "text.primary" : "text.secondary"}
      borderBottom="2px solid"
      borderColor={active ? "brand.accent" : "transparent"}
      _hover={{ 
        textDecoration: "none", 
        color: "brand.highlight",
        borderColor: "brand.highlight"
      }}
      transition="all 150ms ease-in-out"
    >
      {label}
    </CLink>
  );
}

export default function NavBar() {
  const pathname = usePathname();

  return (
    <Box 
      as="header" 
      bg="brand.primary" 
      borderBottom="1px" 
      borderColor="gray.800" 
      px="lg" 
      py="md" 
      position="sticky" 
      top={0} 
      zIndex={50}
      height="64px"
    >
      <Flex align="center" gap="xl" maxW="1200px" mx="auto" height="100%">
        {/* Brand */}
        <HStack as={NextLink} href="/" spacing="md" _hover={{ textDecoration: "none" }}>
          <Image src="/logo-eye.svg" alt="Retinal Delights" boxSize="28px" />
          <Text fontSize="h2" fontWeight="semibold" letterSpacing="wide">
            <Text as="span" color="text.primary">RETINAL</Text>{" "}
            <Text as="span" color="text.secondary" fontStyle="italic">Delights</Text>
          </Text>
        </HStack>

        {/* Center links */}
        <HStack spacing="xs" mx="auto" display={{ base: "none", md: "flex" }}>
          {LINKS.map((l) => (
            <NavItem key={l.href} href={l.href} label={l.label} active={pathname === l.href} />
          ))}
        </HStack>

        <Spacer />

        {/* Right controls */}
        <ConnectButton client={client} chain={base} theme="dark" />
      </Flex>
    </Box>
  );
}
