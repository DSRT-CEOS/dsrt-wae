// Seed key supply chain & competitive relationships
import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: join(__dirname, "..", ".env.local") });

const { default: supabase } = await import("../database/client.js");

const RELATIONSHIPS = [
  // SEMICONDUCTOR SUPPLY CHAIN
  ["TSM", "AAPL", "supplier", 0.95, "TSMC manufactures Apple A-series and M-series chips"],
  ["TSM", "NVDA", "supplier", 0.95, "TSMC manufactures NVIDIA GPUs including H100/B200"],
  ["TSM", "AMD", "supplier", 0.90, "TSMC manufactures AMD Ryzen and EPYC chips"],
  ["TSM", "QCOM", "supplier", 0.80, "TSMC manufactures Qualcomm Snapdragon chips"],
  ["ASML.AS", "TSM", "supplier", 0.95, "ASML EUV lithography critical to TSMC production"],
  ["ASML.AS", "INTC", "supplier", 0.85, "ASML supplies Intel chip fabrication equipment"],
  ["ASML.AS", "005930.KS", "supplier", 0.85, "ASML supplies Samsung Foundry equipment"],
  
  // OIL SUPPLY CHAIN  
  ["2222.SR", "RELIANCE", "supplier", 0.80, "Saudi Aramco major crude supplier to Reliance refineries"],
  ["2222.SR", "IOC", "supplier", 0.85, "Saudi Aramco supplies Indian Oil Corporation"],
  ["2222.SR", "BPCL", "supplier", 0.85, "Saudi Aramco supplies BPCL"],
  ["2222.SR", "HPCL", "supplier", 0.80, "Saudi Aramco supplies HPCL"],
  ["XOM", "RELIANCE", "competitor", 0.70, "ExxonMobil and Reliance compete in refining & petrochemicals"],
  
  // AUTO SUPPLY CHAIN
  ["TSLA", "TSM", "customer", 0.75, "Tesla uses TSMC chips for FSD computers"],
  ["005930.KS", "TSLA", "supplier", 0.70, "Samsung supplies Tesla with memory chips"],
  ["TSLA", "BYDDY", "competitor", 0.85, "Tesla and BYD compete in global EV market"],
  ["TSLA", "NIO", "competitor", 0.70, "Tesla and NIO compete in China EV market"],
  
  // RETAIL/E-COMMERCE
  ["AMZN", "WMT", "competitor", 0.85, "Amazon and Walmart compete in retail & e-commerce"],
  ["BABA", "AMZN", "competitor", 0.75, "Alibaba and Amazon compete in global e-commerce"],
  ["BABA", "PINS", "competitor", 0.90, "Alibaba and Pinduoduo compete in China e-commerce"],
  ["BABA", "JD", "competitor", 0.90, "Alibaba and JD.com compete in China e-commerce"],
  
  // PAYMENTS
  ["V", "MA", "competitor", 0.95, "Visa and Mastercard duopoly in payment networks"],
  ["PYPL", "SQ", "competitor", 0.85, "PayPal and Block compete in fintech"],
  ["V", "PYPL", "competitor", 0.60, "Visa and PayPal compete in payment processing"],
  
  // INDIAN ECOSYSTEM
  ["RELIANCE", "JIO", "subsidiary", 1.0, "Jio Financial Services spun off from Reliance"],
  ["RELIANCE", "BHARTIARTL", "competitor", 0.90, "Reliance Jio and Airtel compete in Indian telecom"],
  ["ADANIENT", "RELIANCE", "competitor", 0.75, "Adani and Reliance compete across multiple sectors"],
  ["ADANIENT", "ADANIPORTS", "subsidiary", 1.0, "Adani Ports part of Adani Group"],
  ["ADANIENT", "ADANIGREEN", "subsidiary", 1.0, "Adani Green Energy part of Adani Group"],
  ["TCS", "INFY", "competitor", 0.95, "TCS and Infosys compete in Indian IT services"],
  ["TCS", "WIPRO", "competitor", 0.90, "TCS and Wipro compete in Indian IT services"],
  ["TCS", "HCLTECH", "competitor", 0.90, "TCS and HCL Tech compete in Indian IT services"],
  ["HDFCBANK", "ICICIBANK", "competitor", 0.95, "HDFC Bank and ICICI Bank compete in private banking"],
  ["HDFCBANK", "AXISBANK", "competitor", 0.90, "HDFC and Axis compete in private banking"],
  ["HDFCBANK", "KOTAKBANK", "competitor", 0.85, "HDFC and Kotak compete in private banking"],
  
  // CLOUD/SOFTWARE
  ["MSFT", "AMZN", "competitor", 0.95, "Microsoft Azure and AWS dominate cloud computing"],
  ["GOOGL", "MSFT", "competitor", 0.85, "Google and Microsoft compete in cloud, productivity, AI"],
  ["GOOGL", "META", "competitor", 0.75, "Google and Meta compete in digital advertising"],
  ["ORCL", "MSFT", "competitor", 0.80, "Oracle and Microsoft compete in enterprise software"],
  ["CRM", "ORCL", "competitor", 0.80, "Salesforce and Oracle compete in CRM/enterprise"],
  ["ADBE", "MSFT", "competitor", 0.60, "Adobe and Microsoft compete in productivity & creative"],
  
  // DEFENSE
  ["LMT", "BA", "competitor", 0.80, "Lockheed and Boeing compete in defense & aerospace"],
  ["LMT", "RTX", "competitor", 0.85, "Lockheed and RTX compete in defense systems"],
  ["LMT", "NOC", "competitor", 0.85, "Lockheed and Northrop compete in defense"],
  ["LMT", "GD", "competitor", 0.80, "Lockheed and General Dynamics compete in defense"],
  
  // BANKING (US)
  ["JPM", "GS", "competitor", 0.85, "JPMorgan and Goldman Sachs compete in investment banking"],
  ["JPM", "MS", "competitor", 0.85, "JPMorgan and Morgan Stanley compete in IB and wealth"],
  ["GS", "MS", "competitor", 0.95, "Goldman Sachs and Morgan Stanley fierce competitors"],
  
  // SOCIAL MEDIA
  ["META", "GOOGL", "competitor", 0.90, "Meta and Google compete in digital ads"],
  ["META", "NFLX", "competitor", 0.40, "Meta and Netflix compete for screen time"],
  ["TSLA", "GOOGL", "competitor", 0.50, "Tesla FSD vs Google Waymo in autonomous"],
  
  // PHARMA
  ["PFE", "JNJ", "competitor", 0.85, "Pfizer and J&J compete in pharma"],
  ["NOVN.SW", "PFE", "competitor", 0.80, "Novartis and Pfizer compete globally"],
  ["ROG.SW", "PFE", "competitor", 0.80, "Roche and Pfizer compete in pharma"],
  ["SUNPHARMA", "DRREDDY", "competitor", 0.90, "Sun Pharma and Dr Reddy compete in Indian pharma"],
  ["SUNPHARMA", "CIPLA", "competitor", 0.90, "Sun Pharma and Cipla compete in Indian pharma"],
  ["SUNPHARMA", "LUPIN", "competitor", 0.85, "Sun Pharma and Lupin compete in pharma"],
];

async function seedRelationships() {
  console.log(`\nSeeding ${RELATIONSHIPS.length} relationships...\n`);

  // First get all company IDs by ticker
  const { data: companies } = await supabase
    .from("wae_companies")
    .select("id, ticker");
  
  const tickerToId = {};
  companies?.forEach(c => { tickerToId[c.ticker] = c.id; });
  
  console.log(`Found ${Object.keys(tickerToId).length} companies in DB\n`);

  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (const [tickerA, tickerB, type, strength, description] of RELATIONSHIPS) {
    const idA = tickerToId[tickerA];
    const idB = tickerToId[tickerB];
    
    if (!idA || !idB) {
      console.log(`  Skip ${tickerA} <-> ${tickerB} (one or both not in DB)`);
      skipped++;
      continue;
    }
    
    try {
      const { error } = await supabase
        .from("wae_company_relationships")
        .upsert({
          company_a: idA,
          company_b: idB,
          relationship_type: type,
          strength,
          description,
        }, {
          onConflict: "company_a,company_b,relationship_type",
        });
      
      if (error) {
        console.log(`  Error ${tickerA}<->${tickerB}: ${error.message}`);
        failed++;
      } else {
        inserted++;
      }
    } catch (err) {
      failed++;
    }
  }

  console.log("\n========================================");
  console.log(`RELATIONSHIPS SEEDED`);
  console.log(`========================================`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped (missing companies): ${skipped}`);
  console.log(`Failed: ${failed}`);

  const { count } = await supabase
    .from("wae_company_relationships")
    .select("*", { count: "exact", head: true });
  
  console.log(`Total relationships in DB: ${count}`);
}

seedRelationships().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
