"use client";

// import { Token } from "../../../../components/token-page/TokenPage";

export default function ListingPage({
  params,
}: {
  params: { tokenId: string };
}) {
  const { tokenId } = params;
  if (!tokenId) {
    throw new Error("Missing listingId");
  }
  return <div>Token page for {tokenId}</div>;
}
