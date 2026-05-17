// ============================================
// SEED WAVE 2: Mid-Caps + Missing Sectors
// 50+ additional companies across the world
// ============================================

import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: join(__dirname, "..", ".env.local") });

const { default: supabase } = await import("../database/client.js");

const COMPANIES = [
  // ===== INDIAN MID-CAPS + EMERGING =====
  { ticker: "VEDL", exchange: "NSE", name: "Vedanta Limited", aliases: ["Vedanta", "Anil Agarwal company"], sector: "Materials", industry: "Mining", country: "India", headquarters_city: "Mumbai", employees: 65000, founded_year: 1976, ceo: "Sunil Duggal", market_cap_usd: 18000000000, website: "https://www.vedantalimited.com", description: "Indian mining company. Zinc, copper, iron ore, oil and gas." },
  
  { ticker: "HINDALCO", exchange: "NSE", name: "Hindalco Industries", aliases: ["Hindalco", "Aditya Birla Aluminium"], sector: "Materials", industry: "Aluminium", country: "India", headquarters_city: "Mumbai", employees: 38000, founded_year: 1958, ceo: "Satish Pai", market_cap_usd: 19000000000, website: "https://www.hindalco.com", description: "Aditya Birla Group flagship metals company. Aluminium and copper." },
  
  { ticker: "GRASIM", exchange: "NSE", name: "Grasim Industries", aliases: ["Grasim", "Aditya Birla Grasim"], sector: "Materials", industry: "Cement & Chemicals", country: "India", headquarters_city: "Nagda", employees: 24000, founded_year: 1947, ceo: "Hari Krishna Agarwal", market_cap_usd: 22000000000, website: "https://www.grasim.com", description: "Aditya Birla Group company. Cement, chemicals, textiles." },
  
  { ticker: "DABUR", exchange: "NSE", name: "Dabur India Limited", aliases: ["Dabur"], sector: "Consumer Staples", industry: "FMCG Ayurveda", country: "India", headquarters_city: "Ghaziabad", employees: 7000, founded_year: 1884, ceo: "Mohit Malhotra", market_cap_usd: 11000000000, website: "https://www.dabur.com", description: "India largest ayurvedic and natural healthcare company." },
  
  { ticker: "BRITANNIA", exchange: "NSE", name: "Britannia Industries", aliases: ["Britannia"], sector: "Consumer Staples", industry: "FMCG Food", country: "India", headquarters_city: "Bangalore", employees: 4400, founded_year: 1892, ceo: "Varun Berry", market_cap_usd: 17000000000, website: "https://www.britannia.co.in", description: "Major Indian food company. Biscuits, dairy, breads." },
  
  { ticker: "GODREJCP", exchange: "NSE", name: "Godrej Consumer Products", aliases: ["Godrej", "Godrej Consumer"], sector: "Consumer Staples", industry: "FMCG", country: "India", headquarters_city: "Mumbai", employees: 13000, founded_year: 2001, ceo: "Sudhir Sitapati", market_cap_usd: 14000000000, website: "https://www.godrejcp.com", description: "Indian consumer goods company. Personal care, hair color, household." },
  
  { ticker: "PIDILITIND", exchange: "NSE", name: "Pidilite Industries", aliases: ["Pidilite", "Fevicol maker"], sector: "Materials", industry: "Specialty Chemicals", country: "India", headquarters_city: "Mumbai", employees: 7000, founded_year: 1959, ceo: "Bharat Puri", market_cap_usd: 18000000000, website: "https://www.pidilite.com", description: "Indian adhesives and chemicals company. Makers of Fevicol." },
  
  { ticker: "IRCTC", exchange: "NSE", name: "Indian Railway Catering and Tourism", aliases: ["IRCTC", "Indian Railway Catering"], sector: "Consumer Discretionary", industry: "Travel & Tourism", country: "India", headquarters_city: "New Delhi", employees: 2500, founded_year: 1999, ceo: "Sanjay Kumar Jain", market_cap_usd: 10000000000, website: "https://www.irctc.co.in", description: "Indian state-owned. Online railway tickets, catering, tourism." },
  
  { ticker: "DLF", exchange: "NSE", name: "DLF Limited", aliases: ["DLF"], sector: "Real Estate", industry: "Real Estate Developer", country: "India", headquarters_city: "Gurugram", employees: 3500, founded_year: 1946, ceo: "Aakash Ohri", market_cap_usd: 25000000000, website: "https://www.dlf.in", description: "India largest real estate developer. Commercial and residential." },
  
  { ticker: "AMBUJACEM", exchange: "NSE", name: "Ambuja Cements", aliases: ["Ambuja", "Ambuja Cement"], sector: "Materials", industry: "Cement", country: "India", headquarters_city: "Mumbai", employees: 4500, founded_year: 1983, ceo: "Ajay Kapur", market_cap_usd: 18000000000, website: "https://www.ambujacement.com", description: "Major Indian cement company. Acquired by Adani Group in 2022." },
  
  { ticker: "ACC", exchange: "NSE", name: "ACC Limited", aliases: ["ACC", "ACC Cement"], sector: "Materials", industry: "Cement", country: "India", headquarters_city: "Mumbai", employees: 6500, founded_year: 1936, ceo: "Sridhar Balakrishnan", market_cap_usd: 6500000000, website: "https://www.acclimited.com", description: "One of India oldest cement manufacturers. Adani Group company." },
  
  { ticker: "LICI", exchange: "NSE", name: "Life Insurance Corporation of India", aliases: ["LIC", "Life Insurance Corp"], sector: "Financials", industry: "Insurance", country: "India", headquarters_city: "Mumbai", employees: 113000, founded_year: 1956, ceo: "Siddhartha Mohanty", market_cap_usd: 70000000000, website: "https://www.licindia.in", description: "India largest life insurance company. State-owned." },
  
  { ticker: "SBILIFE", exchange: "NSE", name: "SBI Life Insurance", aliases: ["SBI Life"], sector: "Financials", industry: "Insurance", country: "India", headquarters_city: "Mumbai", employees: 19000, founded_year: 2001, ceo: "Amit Jhingran", market_cap_usd: 18000000000, website: "https://www.sbilife.co.in", description: "Joint venture between SBI and BNP Paribas Cardif." },
  
  { ticker: "HDFCLIFE", exchange: "NSE", name: "HDFC Life Insurance", aliases: ["HDFC Life"], sector: "Financials", industry: "Insurance", country: "India", headquarters_city: "Mumbai", employees: 22000, founded_year: 2000, ceo: "Vibha Padalkar", market_cap_usd: 17000000000, website: "https://www.hdfclife.com", description: "Major Indian life insurance company. HDFC subsidiary." },
  
  { ticker: "DIVISLAB", exchange: "NSE", name: "Divis Laboratories", aliases: ["Divis Labs", "Divis"], sector: "Healthcare", industry: "Pharmaceuticals API", country: "India", headquarters_city: "Hyderabad", employees: 17000, founded_year: 1990, ceo: "Murali Divi", market_cap_usd: 18000000000, website: "https://www.divislaboratories.com", description: "Indian API manufacturer. Major supplier to global pharma." },
  
  { ticker: "LUPIN", exchange: "NSE", name: "Lupin Limited", aliases: ["Lupin"], sector: "Healthcare", industry: "Pharmaceuticals", country: "India", headquarters_city: "Mumbai", employees: 19000, founded_year: 1968, ceo: "Vinita Gupta", market_cap_usd: 11000000000, website: "https://www.lupin.com", description: "Indian multinational pharmaceutical company. Generics globally." },
  
  // ===== US ADDITIONAL =====
  { ticker: "AMD", exchange: "NASDAQ", name: "Advanced Micro Devices", aliases: ["AMD"], sector: "Technology", industry: "Semiconductors", country: "United States", headquarters_city: "Santa Clara", employees: 26000, founded_year: 1969, ceo: "Lisa Su", market_cap_usd: 220000000000, website: "https://www.amd.com", description: "Semiconductor company. CPUs, GPUs, embedded processors." },
  
  { ticker: "INTC", exchange: "NASDAQ", name: "Intel Corporation", aliases: ["Intel"], sector: "Technology", industry: "Semiconductors", country: "United States", headquarters_city: "Santa Clara", employees: 124000, founded_year: 1968, ceo: "Lip-Bu Tan", market_cap_usd: 110000000000, website: "https://www.intel.com", description: "American multinational chipmaker. Largest semiconductor company by revenue." },
  
  { ticker: "ORCL", exchange: "NYSE", name: "Oracle Corporation", aliases: ["Oracle"], sector: "Technology", industry: "Enterprise Software", country: "United States", headquarters_city: "Austin", employees: 159000, founded_year: 1977, ceo: "Safra Catz", market_cap_usd: 480000000000, website: "https://www.oracle.com", description: "American database, cloud and enterprise software company." },
  
  { ticker: "CRM", exchange: "NYSE", name: "Salesforce Inc", aliases: ["Salesforce"], sector: "Technology", industry: "SaaS", country: "United States", headquarters_city: "San Francisco", employees: 76000, founded_year: 1999, ceo: "Marc Benioff", market_cap_usd: 320000000000, website: "https://www.salesforce.com", description: "Cloud-based CRM software leader. Founded by Marc Benioff." },
  
  { ticker: "ADBE", exchange: "NASDAQ", name: "Adobe Inc", aliases: ["Adobe"], sector: "Technology", industry: "Creative Software", country: "United States", headquarters_city: "San Jose", employees: 30000, founded_year: 1982, ceo: "Shantanu Narayen", market_cap_usd: 220000000000, website: "https://www.adobe.com", description: "Creative software. Photoshop, Illustrator, Acrobat, Cloud services." },
  
  { ticker: "NFLX", exchange: "NASDAQ", name: "Netflix Inc", aliases: ["Netflix"], sector: "Communication Services", industry: "Streaming Media", country: "United States", headquarters_city: "Los Gatos", employees: 14000, founded_year: 1997, ceo: "Ted Sarandos", market_cap_usd: 380000000000, website: "https://www.netflix.com", description: "Largest streaming media subscription service in the world." },
  
  { ticker: "DIS", exchange: "NYSE", name: "Walt Disney Company", aliases: ["Disney", "Walt Disney"], sector: "Communication Services", industry: "Media & Entertainment", country: "United States", headquarters_city: "Burbank", employees: 225000, founded_year: 1923, ceo: "Bob Iger", market_cap_usd: 200000000000, website: "https://www.disney.com", description: "Entertainment conglomerate. Theme parks, movies, ESPN, Disney+." },
  
  { ticker: "PFE", exchange: "NYSE", name: "Pfizer Inc", aliases: ["Pfizer"], sector: "Healthcare", industry: "Pharmaceuticals", country: "United States", headquarters_city: "New York", employees: 88000, founded_year: 1849, ceo: "Albert Bourla", market_cap_usd: 150000000000, website: "https://www.pfizer.com", description: "American multinational pharmaceutical and biotechnology corporation." },
  
  { ticker: "JNJ", exchange: "NYSE", name: "Johnson & Johnson", aliases: ["Johnson Johnson", "J&J", "JNJ"], sector: "Healthcare", industry: "Pharmaceuticals & MedTech", country: "United States", headquarters_city: "New Brunswick", employees: 138000, founded_year: 1886, ceo: "Joaquin Duato", market_cap_usd: 380000000000, website: "https://www.jnj.com", description: "American multinational. Pharmaceuticals and medical devices." },
  
  { ticker: "KO", exchange: "NYSE", name: "Coca-Cola Company", aliases: ["Coca-Cola", "Coke"], sector: "Consumer Staples", industry: "Beverages", country: "United States", headquarters_city: "Atlanta", employees: 79000, founded_year: 1892, ceo: "James Quincey", market_cap_usd: 290000000000, website: "https://www.coca-cola.com", description: "American multinational beverage corporation. World largest beverage company." },
  
  { ticker: "PEP", exchange: "NASDAQ", name: "PepsiCo Inc", aliases: ["PepsiCo", "Pepsi"], sector: "Consumer Staples", industry: "Beverages & Snacks", country: "United States", headquarters_city: "Purchase", employees: 318000, founded_year: 1898, ceo: "Ramon Laguarta", market_cap_usd: 220000000000, website: "https://www.pepsico.com", description: "American multinational. Beverages, snacks, foods." },
  
  { ticker: "MCD", exchange: "NYSE", name: "McDonald's Corporation", aliases: ["McDonalds", "McDonald"], sector: "Consumer Discretionary", industry: "Restaurants", country: "United States", headquarters_city: "Chicago", employees: 150000, founded_year: 1940, ceo: "Chris Kempczinski", market_cap_usd: 210000000000, website: "https://www.mcdonalds.com", description: "World largest fast food restaurant chain by revenue." },
  
  { ticker: "NKE", exchange: "NYSE", name: "Nike Inc", aliases: ["Nike"], sector: "Consumer Discretionary", industry: "Apparel & Footwear", country: "United States", headquarters_city: "Beaverton", employees: 79000, founded_year: 1964, ceo: "Elliott Hill", market_cap_usd: 110000000000, website: "https://www.nike.com", description: "World largest athletic footwear and apparel company." },
  
  { ticker: "V", exchange: "NYSE", name: "Visa Inc", aliases: ["Visa"], sector: "Financials", industry: "Payments", country: "United States", headquarters_city: "San Francisco", employees: 28000, founded_year: 1958, ceo: "Ryan McInerney", market_cap_usd: 600000000000, website: "https://www.visa.com", description: "Global payment technology company. Largest payment processor by volume." },
  
  { ticker: "MA", exchange: "NYSE", name: "Mastercard Inc", aliases: ["Mastercard"], sector: "Financials", industry: "Payments", country: "United States", headquarters_city: "Purchase", employees: 33000, founded_year: 1966, ceo: "Michael Miebach", market_cap_usd: 470000000000, website: "https://www.mastercard.com", description: "Multinational financial services company. Second-largest payment network." },
  
  // ===== ENERGY / OIL EXTRAS =====
  { ticker: "BP.L", exchange: "LSE", name: "BP plc", aliases: ["BP", "British Petroleum"], sector: "Energy", industry: "Oil & Gas Integrated", country: "United Kingdom", headquarters_city: "London", employees: 87000, founded_year: 1909, ceo: "Murray Auchincloss", market_cap_usd: 95000000000, website: "https://www.bp.com", description: "British multinational oil and gas company. Major global energy supplier." },
  
  { ticker: "TTE", exchange: "NYSE", name: "TotalEnergies SE", aliases: ["TotalEnergies", "Total"], sector: "Energy", industry: "Oil & Gas Integrated", country: "France", headquarters_city: "Courbevoie", employees: 102000, founded_year: 1924, ceo: "Patrick Pouyanne", market_cap_usd: 165000000000, website: "https://www.totalenergies.com", description: "French multinational integrated oil and gas company." },
  
  // ===== DEFENSE =====
  { ticker: "RTX", exchange: "NYSE", name: "RTX Corporation", aliases: ["Raytheon", "RTX", "Raytheon Technologies"], sector: "Industrials", industry: "Defense & Aerospace", country: "United States", headquarters_city: "Arlington", employees: 185000, founded_year: 2020, ceo: "Christopher Calio", market_cap_usd: 165000000000, website: "https://www.rtx.com", description: "American multinational aerospace and defense conglomerate." },
  
  { ticker: "NOC", exchange: "NYSE", name: "Northrop Grumman", aliases: ["Northrop Grumman", "Northrop"], sector: "Industrials", industry: "Defense", country: "United States", headquarters_city: "Falls Church", employees: 101000, founded_year: 1994, ceo: "Kathy Warden", market_cap_usd: 75000000000, website: "https://www.northropgrumman.com", description: "American multinational aerospace and defense technology company." },
  
  { ticker: "GD", exchange: "NYSE", name: "General Dynamics", aliases: ["General Dynamics"], sector: "Industrials", industry: "Defense", country: "United States", headquarters_city: "Reston", employees: 117000, founded_year: 1952, ceo: "Phebe Novakovic", market_cap_usd: 75000000000, website: "https://www.gd.com", description: "American aerospace and defense corporation. Major shipbuilder." },
  
  // ===== CRYPTO / FINTECH =====
  { ticker: "MSTR", exchange: "NASDAQ", name: "MicroStrategy Inc", aliases: ["MicroStrategy", "Saylor"], sector: "Technology", industry: "Software & Bitcoin", country: "United States", headquarters_city: "Tysons Corner", employees: 1700, founded_year: 1989, ceo: "Phong Le", market_cap_usd: 80000000000, website: "https://www.microstrategy.com", description: "Business intelligence software. Largest corporate Bitcoin holder." },
  
  { ticker: "SQ", exchange: "NYSE", name: "Block Inc", aliases: ["Block", "Square", "Jack Dorsey company"], sector: "Financials", industry: "Fintech", country: "United States", headquarters_city: "San Francisco", employees: 12000, founded_year: 2009, ceo: "Jack Dorsey", market_cap_usd: 50000000000, website: "https://www.block.xyz", description: "Financial services and digital payments. Square, Cash App, Bitcoin." },
  
  { ticker: "PYPL", exchange: "NASDAQ", name: "PayPal Holdings", aliases: ["PayPal"], sector: "Financials", industry: "Payments", country: "United States", headquarters_city: "San Jose", employees: 27000, founded_year: 1998, ceo: "Alex Chriss", market_cap_usd: 75000000000, website: "https://www.paypal.com", description: "American multinational financial technology company. Online payments." },
  
  // ===== ASIAN ADDITIONAL =====
  { ticker: "NIO", exchange: "NYSE", name: "NIO Inc", aliases: ["NIO"], sector: "Consumer Discretionary", industry: "Electric Vehicles", country: "China", headquarters_city: "Shanghai", employees: 27000, founded_year: 2014, ceo: "William Li", market_cap_usd: 8000000000, website: "https://www.nio.com", description: "Chinese electric vehicle manufacturer. Premium EV brand." },
  
  { ticker: "BIDU", exchange: "NASDAQ", name: "Baidu Inc", aliases: ["Baidu"], sector: "Communication Services", industry: "Internet Services", country: "China", headquarters_city: "Beijing", employees: 38000, founded_year: 2000, ceo: "Robin Li", market_cap_usd: 32000000000, website: "https://www.baidu.com", description: "Chinese search engine and AI company." },
  
  { ticker: "9618.HK", exchange: "HKEX", name: "JD.com Inc HK", aliases: ["JD HK", "Jingdong"], sector: "Consumer Discretionary", industry: "E-commerce", country: "China", headquarters_city: "Beijing", employees: 517000, founded_year: 1998, ceo: "Sandy Xu", market_cap_usd: 60000000000, website: "https://www.jd.com", description: "Chinese e-commerce. Hong Kong secondary listing." },
  
  { ticker: "BYDDY", exchange: "OTC", name: "BYD Company Limited", aliases: ["BYD", "Build Your Dreams"], sector: "Consumer Discretionary", industry: "Electric Vehicles", country: "China", headquarters_city: "Shenzhen", employees: 700000, founded_year: 1995, ceo: "Wang Chuanfu", market_cap_usd: 120000000000, website: "https://www.byd.com", description: "Chinese multinational. Largest EV maker by volume. Backed by Buffett." },
  
  { ticker: "9988.HK", exchange: "HKEX", name: "Alibaba Group HK", aliases: ["Alibaba HK", "Taobao"], sector: "Consumer Discretionary", industry: "E-commerce", country: "China", headquarters_city: "Hangzhou", employees: 198000, founded_year: 1999, ceo: "Eddie Wu", market_cap_usd: 200000000000, website: "https://www.alibabagroup.com", description: "Alibaba Hong Kong primary listing." },
  
  // ===== JAPAN/KOREA EXTRAS =====
  { ticker: "SONY", exchange: "NYSE", name: "Sony Group Corporation", aliases: ["Sony"], sector: "Technology", industry: "Consumer Electronics", country: "Japan", headquarters_city: "Tokyo", employees: 113000, founded_year: 1946, ceo: "Hiroki Totoki", market_cap_usd: 110000000000, website: "https://www.sony.com", description: "Japanese conglomerate. Electronics, gaming, music, movies, semiconductors." },
  
  { ticker: "9984.T", exchange: "TSE", name: "SoftBank Group", aliases: ["SoftBank", "Masayoshi Son"], sector: "Financials", industry: "Conglomerate", country: "Japan", headquarters_city: "Tokyo", employees: 65000, founded_year: 1981, ceo: "Masayoshi Son", market_cap_usd: 120000000000, website: "https://www.softbank.jp", description: "Japanese multinational conglomerate holding company." },
  
  { ticker: "066570.KS", exchange: "KRX", name: "LG Electronics", aliases: ["LG", "LG Electronics"], sector: "Technology", industry: "Consumer Electronics", country: "South Korea", headquarters_city: "Seoul", employees: 75000, founded_year: 1958, ceo: "Cho Joo-wan", market_cap_usd: 15000000000, website: "https://www.lg.com", description: "South Korean multinational. TVs, appliances, mobile." },
  
  // ===== INDIAN BANKING ADDITIONAL =====
  { ticker: "INDUSINDBK", exchange: "NSE", name: "IndusInd Bank", aliases: ["IndusInd"], sector: "Financials", industry: "Banking", country: "India", headquarters_city: "Mumbai", employees: 39000, founded_year: 1994, ceo: "Sumant Kathpalia", market_cap_usd: 12000000000, website: "https://www.indusind.com", description: "Indian private sector bank. Strong NBFC and digital banking." },
  
  { ticker: "PNB", exchange: "NSE", name: "Punjab National Bank", aliases: ["PNB", "Punjab National"], sector: "Financials", industry: "Banking", country: "India", headquarters_city: "New Delhi", employees: 102000, founded_year: 1894, ceo: "Atul Kumar Goel", market_cap_usd: 12000000000, website: "https://www.pnbindia.in", description: "Indian state-owned bank. Second largest public sector bank." },
  
  { ticker: "BANKBARODA", exchange: "NSE", name: "Bank of Baroda", aliases: ["Bank of Baroda", "BoB"], sector: "Financials", industry: "Banking", country: "India", headquarters_city: "Vadodara", employees: 79000, founded_year: 1908, ceo: "Debadatta Chand", market_cap_usd: 14000000000, website: "https://www.bankofbaroda.in", description: "Indian state-owned international banking and financial services." },
  
  // ===== INDIAN OTHERS =====
  { ticker: "VBL", exchange: "NSE", name: "Varun Beverages", aliases: ["Varun Beverages", "VBL"], sector: "Consumer Staples", industry: "Beverages", country: "India", headquarters_city: "Gurugram", employees: 23000, founded_year: 1995, ceo: "Ravi Jaipuria", market_cap_usd: 26000000000, website: "https://www.varunbeverages.com", description: "Major bottler of PepsiCo products in India and globally." },
  
  { ticker: "JUBLFOOD", exchange: "NSE", name: "Jubilant FoodWorks", aliases: ["Jubilant", "Dominos India"], sector: "Consumer Discretionary", industry: "Restaurants", country: "India", headquarters_city: "Noida", employees: 38000, founded_year: 1995, ceo: "Sameer Khetarpal", market_cap_usd: 5000000000, website: "https://www.jubilantfoodworks.com", description: "Master franchisee for Dominos Pizza in India, Sri Lanka." },
  
  { ticker: "TRENT", exchange: "NSE", name: "Trent Limited", aliases: ["Trent", "Westside", "Tata Trent"], sector: "Consumer Discretionary", industry: "Retail", country: "India", headquarters_city: "Mumbai", employees: 5500, founded_year: 1998, ceo: "P Venkatesalu", market_cap_usd: 26000000000, website: "https://www.trent-tata.com", description: "Tata Group retail company. Westside, Zudio, Star Bazaar." },
];

async function seedWave2() {
  console.log(`\nSeeding wave 2: ${COMPANIES.length} additional companies...\n`);

  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < COMPANIES.length; i += 20) {
    const batch = COMPANIES.slice(i, i + 20);
    
    const cleanBatch = batch.map(c => ({
      ticker: c.ticker,
      exchange: c.exchange,
      isin: c.isin || null,
      name: c.name,
      legal_name: c.legal_name || c.name,
      aliases: c.aliases || [],
      sector: c.sector,
      industry: c.industry,
      country: c.country,
      headquarters_city: c.headquarters_city,
      employees: c.employees,
      founded_year: c.founded_year,
      ceo: c.ceo,
      market_cap_usd: c.market_cap_usd,
      currency: c.exchange === "NSE" || c.exchange === "BSE" ? "INR" : "USD",
      website: c.website,
      description: c.description,
      is_active: true,
      data_source: "manual_seed_wave2",
    }));

    try {
      const { data, error } = await supabase
        .from("wae_companies")
        .upsert(cleanBatch, {
          onConflict: "ticker",
          ignoreDuplicates: false,
        })
        .select();

      if (error) {
        console.error(`Batch ${Math.floor(i / 20) + 1} error:`, error.message);
        failed += batch.length;
      } else {
        inserted += data?.length || 0;
        console.log(`Batch ${Math.floor(i / 20) + 1}: ${data?.length || 0} companies upserted`);
      }
    } catch (err) {
      console.error(`Batch exception:`, err.message);
      failed += batch.length;
    }
  }

  console.log("\n========================================");
  console.log(`WAVE 2 SEEDING COMPLETE`);
  console.log(`========================================`);
  console.log(`Attempted: ${COMPANIES.length}`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Failed: ${failed}`);

  const { count } = await supabase
    .from("wae_companies")
    .select("*", { count: "exact", head: true });

  console.log(`\nTotal companies in DB: ${count}`);
}

seedWave2().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
