const GATEWAY = "https://ipfs.thirdwebcdn.com/ipfs";

export function ipfsToHttp(url?: string | null) {
  if (!url) return null;

  // Already http(s)
  if (/^https?:\/\//i.test(url)) {
    // Normalize common gateways to our preferred CDN
    const m = url.match(/\/ipfs\/([^/?#]+)(.*)?$/i);
    if (m) return `${GATEWAY}/${m[1]}${m[2] || ""}`;
    return url;
  }

  // ipfs://CID/path
  if (url.startsWith("ipfs://")) {
    const rest = url.slice("ipfs://".length).replace(/^ipfs\//i, "");
    return `${GATEWAY}/${rest}`;
  }

  // Bare CID
  if (/^[A-Za-z0-9]{46,}$/.test(url)) return `${GATEWAY}/${url}`;

  return url;
}
