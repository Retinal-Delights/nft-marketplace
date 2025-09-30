import { getContract } from "thirdweb";
import { getAllAuctions } from "thirdweb/extensions/marketplace";
import { createThirdwebClient } from "thirdweb";
import { base } from "thirdweb/chains";
import fs from "fs";
import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID,
});

const chain = base; // Base chain
const marketplace = getContract({
  client,
  chain,
  address: process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS,
});

async function main() {
  console.log("🔍 Fetching all auctions from marketplace...");
  
  try {
    const auctions = await getAllAuctions({ contract: marketplace });
    console.log(`📊 Found ${auctions.length} total auctions`);

    // Filter for active auctions only
    const active = auctions
      .filter(a => {
        const listingId = Number(a.id);
        const isActive = !a.closed;
        const isAboveMinId = listingId >= 7;
        
        if (!isAboveMinId) {
          console.log(`⚠️  Skipping listing ${listingId} (below minimum ID 7)`);
        }
        if (!isActive) {
          console.log(`⚠️  Skipping listing ${listingId} (closed)`);
        }
        
        return isActive && isAboveMinId;
      })
      .map(a => ({
        listingId: Number(a.id),
        tokenId: Number(a.tokenId),
        seller: a.seller,
        endTime: Number(a.endTimeInSeconds),
        status: "active"
      }));

    console.log(`✅ Found ${active.length} active auctions`);
    
    // Sort by tokenId for easier reading
    active.sort((a, b) => a.tokenId - b.tokenId);
    
    // Write to JSON file
    const outputPath = "public/data/auction-map.json";
    fs.writeFileSync(outputPath, JSON.stringify(active, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value, 2));
    
    console.log(`💾 Auction map written to ${outputPath}`);
    console.log(`📋 Sample entries:`);
    active.slice(0, 5).forEach(entry => {
      console.log(`   Token ${entry.tokenId} → Listing ${entry.listingId}`);
    });
    
    if (active.length > 5) {
      console.log(`   ... and ${active.length - 5} more`);
    }
    
  } catch (error) {
    console.error("❌ Error building auction map:", error);
    process.exit(1);
  }
}

main().catch(console.error);
