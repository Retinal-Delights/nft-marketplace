// src/components/NavWallet.tsx
"use client";

import { ConnectButton } from "thirdweb/react";
import { base } from "thirdweb/chains";
import { client } from "@/lib/thirdweb";

export default function NavWallet() {
  return <ConnectButton client={client} chain={base} />;
}
