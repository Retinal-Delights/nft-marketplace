// src/consts/env.ts
export const BASE_CHAIN_ID = 8453;

export const INSIGHT_BASE =
  (process.env.NEXT_PUBLIC_INSIGHT_BASE_URL ||
    `https://${BASE_CHAIN_ID}.insight.thirdweb.com`).trim();

export const CLIENT_ID = (process.env.NEXT_PUBLIC_CLIENT_ID ?? "").trim();

if (!CLIENT_ID) {
  // This logs during build and runtime so we SEE it.
  // eslint-disable-next-line no-console
  console.warn("⚠️ NEXT_PUBLIC_CLIENT_ID is empty in this process.");
}
