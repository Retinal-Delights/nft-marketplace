// src/lib/thirdweb.ts
"use client";

import { createThirdwebClient, getContract } from "thirdweb";
import { base } from "thirdweb/chains";

export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID!, // == NEXT_PUBLIC_CLIENT_ID
});

export const marketplace = getContract({
  client,
  chain: base,
  address: process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as `0x${string}`,
});
