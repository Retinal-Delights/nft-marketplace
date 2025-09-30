import React from "react";

type NftAttr = { trait_type?: string; traitType?: string; value: unknown };

type Props = {
  /** Can be an attributes ARRAY from NFT metadata, or an OBJECT map. */
  attributes: Record<string, unknown> | NftAttr[] | undefined | null;
  /** Optional label formatter */
  labelCase?: "raw" | "title";
};

function toAttrMap(
  attrs: Record<string, unknown> | NftAttr[] | undefined | null
): Record<string, unknown> {
  if (!attrs) return {};
  if (!Array.isArray(attrs)) return attrs;
  const map: Record<string, unknown> = {};
  for (const a of attrs) {
    const key = (a?.trait_type ?? a?.traitType ?? "").toString().trim();
    if (key) map[key] = a?.value;
  }
  return map;
}

function prettyLabel(k: string, mode: "raw" | "title") {
  if (mode === "raw") return k;
  // simple Title Case
  return k.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function NftAttributes({ attributes, labelCase = "title" }: Props) {
  const map = toAttrMap(attributes);
  const entries = Object.entries(map);

  if (entries.length === 0) {
    return <div style={{ opacity: 0.7 }}>No attributes</div>;
  }

  return (
    <div>
      {entries.map(([k, v]) => (
        <div key={k} style={{ display: "flex", gap: 8, fontSize: 14, lineHeight: "22px" }}>
          <strong>{prettyLabel(k, labelCase)}:</strong>
          <span>{String(v)}</span>
        </div>
      ))}
    </div>
  );
}


/*

import NftAttributes from "@/components/NftAttributes";

// If your metadata has an array:
<NftAttributes attributes={nft.extra_metadata?.attributes} />

// If your shape is already an object/map:
<NftAttributes attributes={nft.attributes} />

*/