import type { Chain } from "thirdweb";
import { base } from "./chains";

type MarketplaceContract = {
  address: string;
  chain: Chain;
};

/**
 * You need a marketplace contract on each of the chain you want to support
 * Only list one marketplace contract address for each chain
 */
export const MARKETPLACE_CONTRACTS: MarketplaceContract[] = [
  {
    address: process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS!,
    chain: base,
  },
];
