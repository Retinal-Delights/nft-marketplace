"use client";

import { client } from "@/consts/client";
import { useGetENSAvatar } from "@/hooks/useGetENSAvatar";
import { useGetENSName } from "@/hooks/useGetENSName";
import { Link } from "@chakra-ui/next-js";
import {
  Box,
  Button,
  Flex,
  Heading,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Image,
  useColorMode,
} from "@chakra-ui/react";
import { blo } from "blo";
import { FaRegMoon } from "react-icons/fa";
import { FiUser } from "react-icons/fi";
import { IoSunny } from "react-icons/io5";
import {
  ConnectButton,
  useActiveAccount,
  useActiveWallet,
  useDisconnect,
  darkTheme,
} from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";
import type { Wallet } from "thirdweb/wallets";
import { SideMenu } from "./SideMenu";

const wallets = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("walletConnect"),
];

export function Navbar() {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { colorMode } = useColorMode();
  return (
    <Box py="30px" px={{ base: "20px", lg: "50px" }}>
      <Flex direction="row" justifyContent="space-between">
        <Box my="auto">
          <Heading
            as={Link}
            href="/"
            _hover={{ textDecoration: "none" }}
            bgGradient="linear(to-l, #7928CA, #FF0080)"
            bgClip="text"
            fontWeight="extrabold"
          >
            {/* Replace this with your own branding */}
            THIRDMART
          </Heading>
        </Box>
        <Box display={{ lg: "block", base: "none" }}>
          <ToggleThemeButton />
          {account && wallet ? (
            <ProfileButton address={account.address} wallet={wallet} />
          ) : (
            <ConnectButton
              client={client}
              connectButton={{ label: "CONNECT" }}
              connectModal={{
                privacyPolicyUrl: "https://retinaldelights.io/privacy",
                size: "compact",
                termsOfServiceUrl: "https://retinaldelights.io/terms",
              }}
              theme={darkTheme({
                colors: {
                  accentText: "hsl(324, 100%, 50%)",
                  accentButtonBg: "hsl(324, 100%, 50%)",
                  primaryButtonBg: "hsl(324, 100%, 50%)",
                  primaryButtonText: "hsl(0, 0%, 100%)",
                  modalBg: "hsl(0, 0%, 9%)",
                  borderColor: "hsl(0, 0%, 40%)",
                  separatorLine: "hsl(0, 0%, 14%)",
                  tertiaryBg: "hsl(0, 0%, 7%)",
                  skeletonBg: "hsl(0, 0%, 13%)",
                  secondaryButtonBg: "hsl(0, 0%, 13%)",
                  secondaryIconHoverBg: "hsl(0, 0%, 9%)",
                  tooltipText: "hsl(0, 0%, 9%)",
                  inputAutofillBg: "hsl(0, 0%, 9%)",
                  scrollbarBg: "hsl(0, 0%, 9%)",
                  secondaryIconColor: "hsl(0, 0%, 40%)",
                  connectedButtonBg: "hsl(0, 0%, 9%)",
                  connectedButtonBgHover: "hsl(0, 0%, 2%)",
                  secondaryButtonHoverBg: "hsl(0, 0%, 9%)",
                  selectedTextColor: "hsl(0, 0%, 9%)",
                  secondaryText: "hsl(0, 0%, 82%)",
                  primaryText: "hsl(0, 0%, 100%)",
                },
              })}
              wallets={wallets}
            />
          )}
        </Box>
        <SideMenu />
      </Flex>
    </Box>
  );
}

function ProfileButton({
  address,
  wallet,
}: {
  address: string;
  wallet: Wallet;
}) {
  const { disconnect } = useDisconnect();
  const { data: ensName } = useGetENSName({ address });
  const { data: ensAvatar } = useGetENSAvatar({ ensName });
  const { colorMode } = useColorMode();
  return (
    <Menu>
      <MenuButton as={Button} height="56px">
        <Flex direction="row" gap="5">
          <Box my="auto">
            <FiUser size={30} />
          </Box>
          <Image
            src={ensAvatar ?? blo(address as `0x${string}`)}
            height="40px"
            rounded="8px"
          />
        </Flex>
      </MenuButton>
      <MenuList>
        <MenuItem display="flex">
          <Box mx="auto">
            <ConnectButton client={client} theme={colorMode} />
          </Box>
        </MenuItem>
        <MenuItem as={Link} href="/profile" _hover={{ textDecoration: "none" }}>
          Profile {ensName ? `(${ensName})` : ""}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (wallet) disconnect(wallet);
          }}
        >
          Logout
        </MenuItem>
      </MenuList>
    </Menu>
  );
}

function ToggleThemeButton() {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <Button height="56px" w="56px" onClick={toggleColorMode} mr="10px">
      {colorMode === "light" ? <FaRegMoon /> : <IoSunny />}
    </Button>
  );
}
