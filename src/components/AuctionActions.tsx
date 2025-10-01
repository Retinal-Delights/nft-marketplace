// src/components/AuctionActions.tsx
"use client";

import * as React from "react";
import {
  Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalFooter, ModalCloseButton, useDisclosure, Input, HStack, Text,
  useToast, VStack, Badge,
} from "@chakra-ui/react";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { bidInAuction, buyoutAuction } from "thirdweb/extensions/marketplace";
import { marketplace } from "@/lib/thirdweb";

type AuctionActionsProps = {
  listingId?: string | number;
  endSec?: number;
  minBid?: string;
  buyoutPrice?: string;
  currency?: string;
};

function Countdown({ endSec }: { endSec: number }) {
  const [remaining, setRemaining] = React.useState(endSec - Math.floor(Date.now() / 1000));
  
  React.useEffect(() => {
    const id = setInterval(() => setRemaining(endSec - Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, [endSec]);

  if (!endSec || remaining <= 0) return <Badge colorScheme="red">Ended</Badge>;
  
  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  return <Badge colorScheme="green">{`${h}h ${m}m ${s}s`}</Badge>;
}

export function AuctionActions({ 
  listingId, 
  endSec = 0, 
  minBid = "0", 
  buyoutPrice = "0", 
  currency = "ETH" 
}: AuctionActionsProps) {
  const account = useActiveAccount();
  const { mutate: sendTx, isPending } = useSendTransaction();
  const toast = useToast();

  const [amount, setAmount] = React.useState<string>("");
  const { isOpen, onOpen, onClose } = useDisclosure();

  const canWrite = !!account && listingId !== undefined && listingId !== null;
  const isEnded = endSec > 0 && endSec <= Math.floor(Date.now() / 1000);

  const onBuyout = () => {
    if (!canWrite || isEnded) return;
    
    const tx = buyoutAuction({
      contract: marketplace,
      auctionId: BigInt(String(listingId)),
    });
    
    sendTx(tx, {
      onSuccess: () => {
        toast({
          title: "Buyout successful!",
          description: `You bought the NFT for ${buyoutPrice} ${currency}`,
          status: "success",
          duration: 5000,
        });
      },
      onError: (error) => {
        toast({
          title: "Buyout failed",
          description: error?.message || "Transaction failed",
          status: "error",
          duration: 5000,
        });
      },
    });
  };

  const onPlaceBid = () => {
    if (!canWrite || !amount || isEnded) return;
    
    const tx = bidInAuction({
      contract: marketplace,
      auctionId: BigInt(String(listingId)),
      bidAmount: amount, // human-readable string, e.g. "0.05" for 0.05 units of the auction currency
    });
    
    sendTx(tx, { 
      onSuccess: () => {
        toast({
          title: "Bid placed!",
          description: `You bid ${amount} ${currency}`,
          status: "success",
          duration: 5000,
        });
        onClose();
      },
      onError: (error) => {
        toast({
          title: "Bid failed",
          description: error?.message || "Transaction failed",
          status: "error",
          duration: 5000,
        });
      },
    });
  };

  if (!listingId) {
    return <Badge colorScheme="gray">Not listed</Badge>;
  }

  return (
    <VStack align="stretch" spacing={3}>
      {endSec > 0 && <Countdown endSec={endSec} />}
      
      <HStack spacing="3" justify="center">
        <Button 
          size="sm" 
          variant="solid" 
          colorScheme="red" 
          onClick={onBuyout} 
          isDisabled={!canWrite || isEnded} 
          isLoading={isPending}
        >
          Buy Now ({buyoutPrice} {currency})
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onOpen} 
          isDisabled={!canWrite || isEnded}
        >
          Place Bid
        </Button>
      </HStack>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent bg="#1A1A1A" color="white">
          <ModalHeader>Place a Bid</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3}>
              <Text fontSize="sm" color="gray.300">
                Enter your bid amount in {currency}. Minimum bid: {minBid} {currency}
              </Text>
              <Input
                placeholder={`e.g. ${minBid}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                step="0.0001"
                min={minBid}
              />
              <Text fontSize="xs" color="gray.500">
                Buyout price: {buyoutPrice} {currency}
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onPlaceBid} isLoading={isPending} colorScheme="blue" mr={3}>
              Submit Bid
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
