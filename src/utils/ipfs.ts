export function ipfsToHttp(url?: string | null) {
  if (!url) return null;
  if (url.startsWith("ipfs://")) {
    const cid = url.replace("ipfs://", "");
    return `https://ipfs.thirdwebcdn.com/ipfs/${cid}`;
  }
  return url;
}
