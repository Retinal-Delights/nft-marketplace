import { client } from "@/consts/client";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Flex,
  Heading,
  Link,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { FaExternalLinkAlt } from "react-icons/fa";
import { balanceOf, getNFT as getERC1155 } from "thirdweb/extensions/erc1155";
import { getNFT as getERC721 } from "thirdweb/extensions/erc721";
import {
  MediaRenderer,
  useActiveAccount,
  useReadContract,
} from "thirdweb/react";
import { shortenAddress } from "thirdweb/utils";
import { NftAttributes } from "./NftAttributes";
import { CreateListing } from "./CreateListing";
import { useMarketplaceContext } from "@/hooks/useMarketplaceContext";
import dynamic from "next/dynamic";
import { NftDetails } from "./NftDetails";
import RelatedListings from "./RelatedListings";
import { getTokenTransfersById } from "@/app/utils/insight";
import { useState, useEffect } from "react";

const CancelListingButton = dynamic(() => import("./CancelListingButton"), {
  ssr: false,
});
const BuyFromListingButton = dynamic(() => import("./BuyFromListingButton"), {
  ssr: false,
});

type Props = {
  tokenId: bigint;
};

export function Token(props: Props) {
  const {
    type,
    nftContract,
    allAuctions,
    isLoading,
    contractMetadata,
    isRefetchingAllListings,
    listingsInSelectedCollection,
  } = useMarketplaceContext();
  const { tokenId } = props;
  const account = useActiveAccount();

  // Provenance state
  const [transfers, setTransfers] = useState<Array<{
    from_address: string; to_address: string; block_timestamp: string; transaction_hash: string;
  }>>([]);
  const [agg, setAgg] = useState<{ uniqueSellers: number; uniqueBuyers: number; total: number }>({
    uniqueSellers: 0, uniqueBuyers: 0, total: 0
  });
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(false);

  const { data: nft, isLoading: isLoadingNFT } = useReadContract(
    type === "ERC1155" ? getERC1155 : getERC721,
    {
      tokenId: BigInt(tokenId),
      contract: nftContract,
      includeOwner: true,
    }
  );

  const { data: ownedQuantity1155 } = useReadContract(balanceOf, {
    contract: nftContract,
    owner: account?.address!,
    tokenId: tokenId,
    queryOptions: {
      enabled: !!account?.address && type === "ERC1155",
    },
  });

  const listings = (listingsInSelectedCollection || []).filter(
    (item) =>
      item.assetContractAddress.toLowerCase() ===
        nftContract.address.toLowerCase() && item.asset.id === BigInt(tokenId)
  );

  const auctions = (allAuctions || []).filter(
    (item) =>
      item.assetContractAddress.toLowerCase() ===
        nftContract.address.toLowerCase() && item.asset.id === BigInt(tokenId)
  );

  const allLoaded = !isLoadingNFT && !isLoading && !isRefetchingAllListings;

  const ownedByYou =
    nft?.owner?.toLowerCase() === account?.address.toLowerCase();

  // Fetch transfer data
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoadingTransfers(true);
        const resp = await getTokenTransfersById(
          nftContract.address, // you already import this in the file
          String(tokenId),
          { limit: 300 }         // adjust if you want more history
        );
        if (!mounted) return;
        const rows = resp?.data ?? [];

        // Compute aggregations client-side
        const sellers = new Set<string>();
        const buyers  = new Set<string>();
        for (const r of rows) {
          if (r.from_address) sellers.add(r.from_address.toLowerCase());
          if (r.to_address)   buyers.add(r.to_address.toLowerCase());
        }
        setTransfers(rows);
        setAgg({ uniqueSellers: sellers.size, uniqueBuyers: buyers.size, total: rows.length });
      } catch (e) {
        console.warn("Transfers fetch failed:", e);
        setTransfers([]); setAgg({ uniqueSellers: 0, uniqueBuyers: 0, total: 0 });
      } finally {
        setIsLoadingTransfers(false);
      }
    })();
    return () => { mounted = false; };
  }, [tokenId, nftContract.address]);

  return (
    <Flex direction="column">
      <Box mt="24px" mx="auto">
        <Flex
          direction={{ lg: "row", base: "column" }}
          justifyContent={{ lg: "center", base: "space-between" }}
          gap={{ lg: 20, base: 5 }}
        >
          <Flex direction="column" w={{ lg: "45vw", base: "90vw" }} gap="5">
            <MediaRenderer
              client={client}
              src={nft?.metadata.image}
              style={{ width: "max-content", height: "auto", aspectRatio: "1" }}
            />
            <Accordion allowMultiple defaultIndex={[0, 1, 2]}>
              {nft?.metadata.description && (
                <AccordionItem>
                  <Text>
                    <AccordionButton>
                      <Box as="span" flex="1" textAlign="left">
                        Description
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </Text>
                  <AccordionPanel pb={4}>
                    <Text>{nft.metadata.description}</Text>
                  </AccordionPanel>
                </AccordionItem>
              )}

              {nft?.metadata?.attributes &&
                Array.isArray(nft?.metadata?.attributes) &&
                nft?.metadata?.attributes.length > 0 && (
                  <NftAttributes attributes={nft.metadata.attributes as any} />
                )}

              {nft && <NftDetails nft={nft} />}
            </Accordion>
          </Flex>
          <Box w={{ lg: "45vw", base: "90vw" }}>
            <Text>Collection</Text>
            <Flex direction="row" gap="3">
              <Heading>{contractMetadata?.name}</Heading>
              <Link
                color="gray"
                href={`/collection/${nftContract.chain.id}/${nftContract.address}`}
              >
                <FaExternalLinkAlt size={20} />
              </Link>
            </Flex>
            <br />
            <Text># {nft?.id.toString()}</Text>
            <Heading>{nft?.metadata.name}</Heading>
            <br />
            {type === "ERC1155" ? (
              <>
                {account && ownedQuantity1155 && (
                  <>
                    <Text>You own</Text>
                    <Heading>{ownedQuantity1155.toString()}</Heading>
                  </>
                )}
              </>
            ) : (
              <>
                <Text>Current owner</Text>
                <Flex direction="row">
                  <Heading>
                    {nft?.owner ? shortenAddress(nft.owner) : "N/A"}{" "}
                  </Heading>
                  {ownedByYou && <Text color="gray">(You)</Text>}
                </Flex>
              </>
            )}

            {/* Provenance & Activity Section */}
            <Box mt="30px" p="16px" bg="gray.800" borderRadius="md" border="1px solid" borderColor="gray.700">
              <Heading size="lg" mb="16px" color="#fffbeb">Provenance & Activity</Heading>
              <Flex gap="16px" mb="16px" fontSize="sm">
                <Box>
                  <Text color="gray.400" mb="4px">Unique Sellers</Text>
                  <Text fontWeight="semibold" color="#fffbeb">
                    {isLoadingTransfers ? "…" : agg.uniqueSellers}
                  </Text>
                </Box>
                <Box>
                  <Text color="gray.400" mb="4px">Unique Buyers</Text>
                  <Text fontWeight="semibold" color="#fffbeb">
                    {isLoadingTransfers ? "…" : agg.uniqueBuyers}
                  </Text>
                </Box>
                <Box>
                  <Text color="gray.400" mb="4px">Total Transfers</Text>
                  <Text fontWeight="semibold" color="#fffbeb">
                    {isLoadingTransfers ? "…" : agg.total}
                  </Text>
                </Box>
              </Flex>

              <Box maxH="224px" overflow="auto" borderRadius="md" border="1px solid" borderColor="gray.700">
                <Table size="sm">
                  <Thead bg="gray.900" position="sticky" top="0">
                    <Tr>
                      <Th color="gray.400" fontWeight="medium" px="12px" py="8px">When</Th>
                      <Th color="gray.400" fontWeight="medium" px="12px" py="8px">From → To</Th>
                      <Th color="gray.400" fontWeight="medium" px="12px" py="8px">Tx</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {isLoadingTransfers ? (
                      <Tr><Td colSpan={3} px="12px" py="12px" color="gray.400">Loading transfers…</Td></Tr>
                    ) : transfers.length === 0 ? (
                      <Tr><Td colSpan={3} px="12px" py="12px" color="gray.400">No on-chain transfers yet.</Td></Tr>
                    ) : (
                      transfers.map((t, i) => {
                        const when = new Date(Number(t.block_timestamp) * 1000).toLocaleString("en-US", {
                          month: "2-digit", day: "2-digit", year: "numeric",
                          hour: "numeric", minute: "2-digit", hour12: true,
                          timeZone: "America/Los_Angeles"
                        });
                        return (
                          <Tr key={t.transaction_hash + i} borderTop="1px solid" borderColor="gray.800">
                            <Td px="12px" py="8px" color="#fffbeb">{when}</Td>
                            <Td px="12px" py="8px">
                              <Text color="gray.300" fontFamily="mono">
                                {short(t.from_address)} → {short(t.to_address)}
                              </Text>
                            </Td>
                            <Td px="12px" py="8px">
                              <Link
                                color="blue.400"
                                _hover={{ textDecoration: "underline" }}
                                fontFamily="mono"
                                href={`https://basescan.org/tx/${t.transaction_hash}`}
                                isExternal
                              >
                                {t.transaction_hash.slice(0, 8)}…
                              </Link>
                            </Td>
                          </Tr>
                        );
                      })
                    )}
                  </Tbody>
                </Table>
              </Box>
            </Box>

            {account &&
              nft &&
              (ownedByYou || (ownedQuantity1155 && ownedQuantity1155 > 0n)) && (
                <CreateListing tokenId={nft?.id} account={account} />
              )}
            <Accordion
              mt="30px"
              sx={{ container: {} }}
              defaultIndex={[0, 1]}
              allowMultiple
            >
              <AccordionItem>
                <Text>
                  <AccordionButton>
                    <Box as="span" flex="1" textAlign="left">
                      Listings ({listings.length})
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </Text>
                <AccordionPanel pb={4}>
                  {listings.length > 0 ? (
                    <TableContainer>
                      <Table
                        variant="simple"
                        sx={{ "th, td": { borderBottom: "none" } }}
                      >
                        <Thead>
                          <Tr>
                            <Th>Price</Th>
                            {type === "ERC1155" && <Th px={1}>Qty</Th>}
                            <Th>Expiration</Th>
                            <Th px={1}>From</Th>
                            <Th>{""}</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {listings.map((item) => {
                            const listedByYou =
                              item.creatorAddress.toLowerCase() ===
                              account?.address.toLowerCase();
                            return (
                              <Tr key={item.id.toString()}>
                                <Td>
                                  <Text>
                                    {item.currencyValuePerToken.displayValue}{" "}
                                    {item.currencyValuePerToken.symbol}
                                  </Text>
                                </Td>
                                {type === "ERC1155" && (
                                  <Td px={1}>
                                    <Text>{item.quantity.toString()}</Text>
                                  </Td>
                                )}
                                <Td>
                                  <Text>
                                    {getExpiration(item.endTimeInSeconds)}
                                  </Text>
                                </Td>
                                <Td px={1}>
                                  <Text>
                                    {item.creatorAddress.toLowerCase() ===
                                    account?.address.toLowerCase()
                                      ? "You"
                                      : shortenAddress(item.creatorAddress)}
                                  </Text>
                                </Td>
                                {account && (
                                  <Td>
                                    {!listedByYou ? (
                                      <BuyFromListingButton
                                        account={account}
                                        listing={item}
                                      />
                                    ) : (
                                      <CancelListingButton
                                        account={account}
                                        listingId={item.id}
                                      />
                                    )}
                                  </Td>
                                )}
                              </Tr>
                            );
                          })}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Text>This item is not listed for sale</Text>
                  )}
                </AccordionPanel>
              </AccordionItem>

              <RelatedListings excludedListingId={listings[0]?.id ?? -1n} />
            </Accordion>
          </Box>
        </Flex>
      </Box>
    </Flex>
  );
}

function getExpiration(endTimeInSeconds: bigint) {
  // Get the current date and time
  const currentDate = new Date();

  // Convert seconds to milliseconds (bigint)
  const milliseconds: bigint = endTimeInSeconds * 1000n;

  // Calculate the future date by adding milliseconds to the current date
  const futureDate = new Date(currentDate.getTime() + Number(milliseconds));

  // Format the future date
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    timeZoneName: "short",
  };
  const formattedDate = futureDate.toLocaleDateString("en-US", options);
  return formattedDate;
}

function short(a?: string) {
  if (!a) return "—";
  return a.slice(0, 6) + "…" + a.slice(-4);
}
