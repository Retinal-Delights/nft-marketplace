export function pickAttr(attrs: any[] | undefined, keys: string[]): string | undefined {
  if (!Array.isArray(attrs)) return undefined;
  const lower = keys.map(k => k.toLowerCase());
  for (const a of attrs) {
    const key = String(a?.trait_type ?? a?.traitType ?? "").toLowerCase();
    if (lower.includes(key)) return a?.value != null ? String(a.value) : undefined;
  }
  return undefined;
}
  
  export function toCardFields(n: any) {
    const attrs = n?.extra_metadata?.attributes as any[] | undefined;
    const rarity = pickAttr(attrs, ["rarity_tier", "tier", "rarity"]);
    const rank = pickAttr(attrs, ["rank", "overall_rank"]);
    const tier  = pickAttr(attrs, ["tier", "rarity_tier"]);
    return { rarity, rank, tier };
  }
  