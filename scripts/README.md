# Scripts

## build-auction-map.js

This script builds a static mapping of active auctions from your marketplace contract using thirdweb's `getAllAuctions()` function.

### Usage

```bash
# Run the script
pnpm run build-auction-map

# Or directly with node
node scripts/build-auction-map.js
```

### What it does

1. **Fetches all auctions** from your marketplace contract using thirdweb v5
2. **Filters active auctions** only (excludes closed/cancelled)
3. **Enforces minimum listing ID** (skips listings < 7 as per your requirements)
4. **Extracts mapping data**: `{ listingId, tokenId, seller, endTime, status }`
5. **Saves to JSON file**: `public/data/auction-map.json`

### Benefits

- **No wasted API calls**: Only queries active listings, not all 7,777 tokenIds
- **Fast loading**: Static file loads instantly vs. multiple Insight API calls
- **Deterministic**: Clear mapping of tokenId → listingId
- **Easy to refresh**: Re-run script when new listings are added

### Output

The script creates `public/data/auction-map.json` with entries like:

```json
[
  {
    "listingId": 7,
    "tokenId": 1,
    "seller": "0x...",
    "endTime": 1704067200,
    "status": "active"
  },
  {
    "listingId": 7806,
    "tokenId": 0,
    "seller": "0x...",
    "endTime": 1704153600,
    "status": "active"
  }
]
```

### Environment Variables Required

- `NEXT_PUBLIC_CLIENT_ID`: Your thirdweb client ID
- `NEXT_PUBLIC_MARKETPLACE_ADDRESS`: Your marketplace contract address

### When to run

- **Initial setup**: Run once to create the mapping file
- **After new listings**: Re-run when new auctions are created
- **Periodically**: Refresh to sync with any changes

The `/api/auction-map` route will automatically use this static file when available, falling back to the Insight API if it doesn't exist.
