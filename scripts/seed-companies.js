// ============================================
// SEED: 100 Real Companies (Indian + Global)
// One-time script to populate wae_companies
// ============================================

import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: join(__dirname, "..", ".env.local") });

const { default: supabase } = await import("../database/client.js");

const COMPANIES = [
  // ===== INDIAN — NIFTY 50 + LARGE CAPS =====
  { ticker: "RELIANCE", exchange: "NSE", isin: "INE002A01018", name: "Reliance Industries Limited", aliases: ["Reliance", "RIL", "Reliance Industries", "Mukesh Ambani company"], sector: "Energy", industry: "Oil & Gas Refining", country: "India", headquarters_city: "Mumbai", employees: 347000, founded_year: 1973, ceo: "Mukesh Ambani", market_cap_usd: 230000000000, website: "https://www.ril.com", description: "Largest private sector company in India by revenue. Operations in petrochemicals, refining, oil, telecommunications, retail." },
  
  { ticker: "TCS", exchange: "NSE", isin: "INE467B01029", name: "Tata Consultancy Services", aliases: ["TCS", "Tata Consultancy", "Tata Consultancy Services Ltd"], sector: "Technology", industry: "IT Services", country: "India", headquarters_city: "Mumbai", employees: 612000, founded_year: 1968, ceo: "K Krithivasan", market_cap_usd: 165000000000, website: "https://www.tcs.com", description: "Largest IT services company in India. Global presence in 46 countries." },
  
  { ticker: "HDFCBANK", exchange: "NSE", isin: "INE040A01034", name: "HDFC Bank Limited", aliases: ["HDFC Bank", "HDFC"], sector: "Financials", industry: "Banking", country: "India", headquarters_city: "Mumbai", employees: 177000, founded_year: 1994, ceo: "Sashidhar Jagdishan", market_cap_usd: 140000000000, website: "https://www.hdfcbank.com", description: "India largest private bank by assets and market capitalization." },
  
  { ticker: "INFY", exchange: "NSE", isin: "INE009A01021", name: "Infosys Limited", aliases: ["Infosys", "Infy"], sector: "Technology", industry: "IT Services", country: "India", headquarters_city: "Bangalore", employees: 317000, founded_year: 1981, ceo: "Salil Parekh", market_cap_usd: 80000000000, website: "https://www.infosys.com", description: "Indian multinational IT consulting and outsourcing services company." },
  
  { ticker: "ICICIBANK", exchange: "NSE", isin: "INE090A01021", name: "ICICI Bank Limited", aliases: ["ICICI", "ICICI Bank"], sector: "Financials", industry: "Banking", country: "India", headquarters_city: "Mumbai", employees: 130000, founded_year: 1994, ceo: "Sandeep Bakhshi", market_cap_usd: 95000000000, website: "https://www.icicibank.com", description: "Second largest private sector bank in India." },
  
  { ticker: "HINDUNILVR", exchange: "NSE", isin: "INE030A01027", name: "Hindustan Unilever Limited", aliases: ["HUL", "Hindustan Unilever", "Unilever India"], sector: "Consumer Staples", industry: "FMCG", country: "India", headquarters_city: "Mumbai", employees: 21000, founded_year: 1933, ceo: "Rohit Jawa", market_cap_usd: 70000000000, website: "https://www.hul.co.in", description: "India largest FMCG company. Subsidiary of Unilever." },
  
  { ticker: "ITC", exchange: "NSE", isin: "INE154A01025", name: "ITC Limited", aliases: ["ITC", "India Tobacco Company"], sector: "Consumer Staples", industry: "Diversified FMCG", country: "India", headquarters_city: "Kolkata", employees: 38000, founded_year: 1910, ceo: "Sanjiv Puri", market_cap_usd: 65000000000, website: "https://www.itcportal.com", description: "Conglomerate with operations in FMCG, hotels, software, packaging, agribusiness." },
  
  { ticker: "SBIN", exchange: "NSE", isin: "INE062A01020", name: "State Bank of India", aliases: ["SBI", "State Bank", "State Bank of India"], sector: "Financials", industry: "Banking", country: "India", headquarters_city: "Mumbai", employees: 232000, founded_year: 1955, ceo: "Challa Sreenivasulu Setty", market_cap_usd: 80000000000, website: "https://www.onlinesbi.sbi", description: "India largest public sector bank by assets." },
  
  { ticker: "BHARTIARTL", exchange: "NSE", isin: "INE397D01024", name: "Bharti Airtel Limited", aliases: ["Bharti Airtel", "Airtel", "Bharti"], sector: "Communication Services", industry: "Telecom", country: "India", headquarters_city: "New Delhi", employees: 25000, founded_year: 1995, ceo: "Gopal Vittal", market_cap_usd: 95000000000, website: "https://www.airtel.in", description: "Indian multinational telecom company with operations in 18 countries." },
  
  { ticker: "ADANIENT", exchange: "NSE", isin: "INE423A01024", name: "Adani Enterprises Limited", aliases: ["Adani Enterprises", "Adani Group", "Gautam Adani company"], sector: "Industrials", industry: "Conglomerate", country: "India", headquarters_city: "Ahmedabad", employees: 23000, founded_year: 1988, ceo: "Gautam Adani", market_cap_usd: 35000000000, website: "https://www.adanienterprises.com", description: "Flagship company of Adani Group. Mining, logistics, energy, agro." },
  
  { ticker: "ADANIPORTS", exchange: "NSE", isin: "INE742F01042", name: "Adani Ports and SEZ Limited", aliases: ["Adani Ports", "APSEZ"], sector: "Industrials", industry: "Ports & Logistics", country: "India", headquarters_city: "Ahmedabad", employees: 5800, founded_year: 1998, ceo: "Karan Adani", market_cap_usd: 32000000000, website: "https://www.adaniports.com", description: "Largest private port operator in India." },
  
  { ticker: "LT", exchange: "NSE", isin: "INE018A01030", name: "Larsen & Toubro Limited", aliases: ["L&T", "Larsen Toubro", "Larsen and Toubro"], sector: "Industrials", industry: "Engineering & Construction", country: "India", headquarters_city: "Mumbai", employees: 51000, founded_year: 1938, ceo: "S N Subrahmanyan", market_cap_usd: 60000000000, website: "https://www.larsentoubro.com", description: "Indian multinational conglomerate. EPC projects, defense, IT services." },
  
  { ticker: "MARUTI", exchange: "NSE", isin: "INE585B01010", name: "Maruti Suzuki India Limited", aliases: ["Maruti", "Maruti Suzuki", "Suzuki India"], sector: "Consumer Discretionary", industry: "Automobiles", country: "India", headquarters_city: "New Delhi", employees: 41000, founded_year: 1981, ceo: "Hisashi Takeuchi", market_cap_usd: 45000000000, website: "https://www.marutisuzuki.com", description: "India largest car manufacturer. Subsidiary of Suzuki Motor Corporation." },
  
  { ticker: "TATAMOTORS", exchange: "NSE", isin: "INE155A01022", name: "Tata Motors Limited", aliases: ["Tata Motors", "JLR parent"], sector: "Consumer Discretionary", industry: "Automobiles", country: "India", headquarters_city: "Mumbai", employees: 79000, founded_year: 1945, ceo: "N Chandrasekaran", market_cap_usd: 40000000000, website: "https://www.tatamotors.com", description: "Indian multinational automotive company. Owns Jaguar Land Rover." },
  
  { ticker: "TATASTEEL", exchange: "NSE", isin: "INE081A01020", name: "Tata Steel Limited", aliases: ["Tata Steel"], sector: "Materials", industry: "Steel", country: "India", headquarters_city: "Mumbai", employees: 78000, founded_year: 1907, ceo: "T V Narendran", market_cap_usd: 22000000000, website: "https://www.tatasteel.com", description: "One of the largest steel producers in the world." },
  
  { ticker: "WIPRO", exchange: "NSE", isin: "INE075A01022", name: "Wipro Limited", aliases: ["Wipro", "Azim Premji company"], sector: "Technology", industry: "IT Services", country: "India", headquarters_city: "Bangalore", employees: 235000, founded_year: 1945, ceo: "Srinivas Pallia", market_cap_usd: 30000000000, website: "https://www.wipro.com", description: "Indian multinational IT corporation. Major IT services company." },
  
  { ticker: "ONGC", exchange: "NSE", isin: "INE213A01029", name: "Oil and Natural Gas Corporation", aliases: ["ONGC", "Oil and Natural Gas Corp"], sector: "Energy", industry: "Oil & Gas Exploration", country: "India", headquarters_city: "New Delhi", employees: 30000, founded_year: 1956, ceo: "Arun Kumar Singh", market_cap_usd: 38000000000, website: "https://www.ongcindia.com", description: "India largest crude oil and natural gas company." },
  
  { ticker: "NTPC", exchange: "NSE", isin: "INE733E01010", name: "NTPC Limited", aliases: ["NTPC", "National Thermal Power"], sector: "Utilities", industry: "Power Generation", country: "India", headquarters_city: "New Delhi", employees: 18000, founded_year: 1975, ceo: "Gurdeep Singh", market_cap_usd: 42000000000, website: "https://www.ntpc.co.in", description: "India largest power utility. Public sector enterprise." },
  
  { ticker: "AXISBANK", exchange: "NSE", isin: "INE238A01034", name: "Axis Bank Limited", aliases: ["Axis Bank", "Axis"], sector: "Financials", industry: "Banking", country: "India", headquarters_city: "Mumbai", employees: 96000, founded_year: 1993, ceo: "Amitabh Chaudhry", market_cap_usd: 42000000000, website: "https://www.axisbank.com", description: "Third largest private sector bank in India." },
  
  { ticker: "KOTAKBANK", exchange: "NSE", isin: "INE237A01028", name: "Kotak Mahindra Bank", aliases: ["Kotak", "Kotak Mahindra", "Kotak Bank"], sector: "Financials", industry: "Banking", country: "India", headquarters_city: "Mumbai", employees: 75000, founded_year: 1985, ceo: "Ashok Vaswani", market_cap_usd: 42000000000, website: "https://www.kotak.com", description: "Major private sector bank. Founded by Uday Kotak." },
  
  { ticker: "SUNPHARMA", exchange: "NSE", isin: "INE044A01036", name: "Sun Pharmaceutical Industries", aliases: ["Sun Pharma", "Sun Pharmaceutical"], sector: "Healthcare", industry: "Pharmaceuticals", country: "India", headquarters_city: "Mumbai", employees: 41000, founded_year: 1983, ceo: "Dilip Shanghvi", market_cap_usd: 50000000000, website: "https://www.sunpharma.com", description: "India largest pharmaceutical company by revenue." },
  
  { ticker: "BAJFINANCE", exchange: "NSE", isin: "INE296A01024", name: "Bajaj Finance Limited", aliases: ["Bajaj Finance", "BAF"], sector: "Financials", industry: "NBFC", country: "India", headquarters_city: "Pune", employees: 38000, founded_year: 1987, ceo: "Rajeev Jain", market_cap_usd: 55000000000, website: "https://www.bajajfinserv.in", description: "Largest NBFC in India by asset size." },
  
  { ticker: "HCLTECH", exchange: "NSE", isin: "INE860A01027", name: "HCL Technologies Limited", aliases: ["HCL Tech", "HCL Technologies", "HCL"], sector: "Technology", industry: "IT Services", country: "India", headquarters_city: "Noida", employees: 225000, founded_year: 1976, ceo: "C Vijayakumar", market_cap_usd: 50000000000, website: "https://www.hcltech.com", description: "Major Indian IT services company. Founded by Shiv Nadar." },
  
  { ticker: "ASIANPAINT", exchange: "NSE", isin: "INE021A01026", name: "Asian Paints Limited", aliases: ["Asian Paints"], sector: "Materials", industry: "Paints", country: "India", headquarters_city: "Mumbai", employees: 9500, founded_year: 1942, ceo: "Amit Syngle", market_cap_usd: 28000000000, website: "https://www.asianpaints.com", description: "India largest paint company. Operations in 60 countries." },
  
  { ticker: "TITAN", exchange: "NSE", isin: "INE280A01028", name: "Titan Company Limited", aliases: ["Titan", "Titan Company", "Tata Titan"], sector: "Consumer Discretionary", industry: "Jewelry & Watches", country: "India", headquarters_city: "Bangalore", employees: 8500, founded_year: 1984, ceo: "C K Venkataraman", market_cap_usd: 32000000000, website: "https://www.titancompany.in", description: "Joint venture between Tata Group and TIDCO. Watches, jewelry, eyewear." },
  
  { ticker: "ULTRACEMCO", exchange: "NSE", isin: "INE481G01011", name: "UltraTech Cement Limited", aliases: ["UltraTech", "UltraTech Cement"], sector: "Materials", industry: "Cement", country: "India", headquarters_city: "Mumbai", employees: 24000, founded_year: 1983, ceo: "K K Maheshwari", market_cap_usd: 38000000000, website: "https://www.ultratechcement.com", description: "Aditya Birla Group company. India largest cement manufacturer." },
  
  { ticker: "NESTLEIND", exchange: "NSE", isin: "INE239A01024", name: "Nestle India Limited", aliases: ["Nestle India", "Nestle"], sector: "Consumer Staples", industry: "FMCG Food", country: "India", headquarters_city: "Gurugram", employees: 8000, founded_year: 1959, ceo: "Suresh Narayanan", market_cap_usd: 28000000000, website: "https://www.nestle.in", description: "Subsidiary of Nestle SA. Maggi, Nescafe, KitKat brands in India." },
  
  { ticker: "POWERGRID", exchange: "NSE", isin: "INE752E01010", name: "Power Grid Corporation of India", aliases: ["Power Grid", "PGCIL"], sector: "Utilities", industry: "Power Transmission", country: "India", headquarters_city: "Gurugram", employees: 10000, founded_year: 1989, ceo: "R K Tyagi", market_cap_usd: 32000000000, website: "https://www.powergrid.in", description: "India largest electric power transmission utility." },
  
  { ticker: "JSWSTEEL", exchange: "NSE", isin: "INE019A01038", name: "JSW Steel Limited", aliases: ["JSW Steel", "JSW"], sector: "Materials", industry: "Steel", country: "India", headquarters_city: "Mumbai", employees: 15000, founded_year: 1982, ceo: "Sajjan Jindal", market_cap_usd: 25000000000, website: "https://www.jsw.in", description: "Part of JSW Group. India largest private steel producer." },
  
  { ticker: "INDIGO", exchange: "NSE", isin: "INE646L01027", name: "InterGlobe Aviation Limited", aliases: ["IndiGo", "InterGlobe Aviation"], sector: "Industrials", industry: "Airlines", country: "India", headquarters_city: "Gurugram", employees: 36000, founded_year: 2006, ceo: "Pieter Elbers", market_cap_usd: 22000000000, website: "https://www.goindigo.in", description: "India largest airline by passengers and fleet size." },
  
  // ===== US GLOBAL MAJORS =====
  { ticker: "AAPL", exchange: "NASDAQ", isin: "US0378331005", name: "Apple Inc", aliases: ["Apple", "AAPL", "Cupertino"], sector: "Technology", industry: "Consumer Electronics", country: "United States", headquarters_city: "Cupertino", employees: 164000, founded_year: 1976, ceo: "Tim Cook", market_cap_usd: 3500000000000, website: "https://www.apple.com", description: "Designs, manufactures and markets smartphones, computers, tablets, wearables." },
  
  { ticker: "MSFT", exchange: "NASDAQ", isin: "US5949181045", name: "Microsoft Corporation", aliases: ["Microsoft", "MSFT"], sector: "Technology", industry: "Software", country: "United States", headquarters_city: "Redmond", employees: 228000, founded_year: 1975, ceo: "Satya Nadella", market_cap_usd: 3200000000000, website: "https://www.microsoft.com", description: "Develops, licenses and supports software, services, devices and solutions." },
  
  { ticker: "GOOGL", exchange: "NASDAQ", isin: "US02079K3059", name: "Alphabet Inc", aliases: ["Google", "Alphabet", "GOOGL"], sector: "Communication Services", industry: "Internet Services", country: "United States", headquarters_city: "Mountain View", employees: 182000, founded_year: 1998, ceo: "Sundar Pichai", market_cap_usd: 2200000000000, website: "https://www.abc.xyz", description: "Parent company of Google. Search, advertising, cloud, YouTube, Android." },
  
  { ticker: "AMZN", exchange: "NASDAQ", isin: "US0231351067", name: "Amazon.com Inc", aliases: ["Amazon", "AMZN"], sector: "Consumer Discretionary", industry: "E-commerce & Cloud", country: "United States", headquarters_city: "Seattle", employees: 1551000, founded_year: 1994, ceo: "Andy Jassy", market_cap_usd: 2000000000000, website: "https://www.amazon.com", description: "Largest internet retailer and cloud computing services provider in the world." },
  
  { ticker: "META", exchange: "NASDAQ", isin: "US30303M1027", name: "Meta Platforms Inc", aliases: ["Meta", "Facebook", "META"], sector: "Communication Services", industry: "Social Media", country: "United States", headquarters_city: "Menlo Park", employees: 67000, founded_year: 2004, ceo: "Mark Zuckerberg", market_cap_usd: 1500000000000, website: "https://www.meta.com", description: "Operates Facebook, Instagram, WhatsApp, Threads, Quest VR." },
  
  { ticker: "TSLA", exchange: "NASDAQ", isin: "US88160R1014", name: "Tesla Inc", aliases: ["Tesla", "TSLA", "Elon Musk company"], sector: "Consumer Discretionary", industry: "Electric Vehicles", country: "United States", headquarters_city: "Austin", employees: 140000, founded_year: 2003, ceo: "Elon Musk", market_cap_usd: 1100000000000, website: "https://www.tesla.com", description: "Designs and manufactures electric vehicles, battery energy storage, solar panels." },
  
  { ticker: "NVDA", exchange: "NASDAQ", isin: "US67066G1040", name: "NVIDIA Corporation", aliases: ["NVIDIA", "Nvidia", "NVDA"], sector: "Technology", industry: "Semiconductors", country: "United States", headquarters_city: "Santa Clara", employees: 32000, founded_year: 1993, ceo: "Jensen Huang", market_cap_usd: 3500000000000, website: "https://www.nvidia.com", description: "GPU manufacturer. Leader in AI computing chips and data center infrastructure." },
  
  { ticker: "JPM", exchange: "NYSE", isin: "US46625H1005", name: "JPMorgan Chase & Co", aliases: ["JPMorgan", "JPM", "JP Morgan", "Chase"], sector: "Financials", industry: "Banking", country: "United States", headquarters_city: "New York", employees: 309000, founded_year: 1799, ceo: "Jamie Dimon", market_cap_usd: 700000000000, website: "https://www.jpmorganchase.com", description: "Largest bank in the United States by assets. Global financial services firm." },
  
  { ticker: "BRK.B", exchange: "NYSE", isin: "US0846707026", name: "Berkshire Hathaway Inc", aliases: ["Berkshire Hathaway", "Berkshire", "Buffett"], sector: "Financials", industry: "Insurance & Conglomerate", country: "United States", headquarters_city: "Omaha", employees: 396000, founded_year: 1839, ceo: "Warren Buffett", market_cap_usd: 1000000000000, website: "https://www.berkshirehathaway.com", description: "Multinational conglomerate. Insurance, energy, railroads, manufacturing." },
  
  { ticker: "XOM", exchange: "NYSE", isin: "US30231G1022", name: "Exxon Mobil Corporation", aliases: ["ExxonMobil", "Exxon", "XOM"], sector: "Energy", industry: "Oil & Gas Integrated", country: "United States", headquarters_city: "Spring", employees: 62000, founded_year: 1999, ceo: "Darren Woods", market_cap_usd: 480000000000, website: "https://www.exxonmobil.com", description: "Largest direct descendant of Standard Oil. Multinational oil and gas corporation." },
  
  { ticker: "CVX", exchange: "NYSE", isin: "US1667641005", name: "Chevron Corporation", aliases: ["Chevron", "CVX"], sector: "Energy", industry: "Oil & Gas Integrated", country: "United States", headquarters_city: "Houston", employees: 45600, founded_year: 1879, ceo: "Mike Wirth", market_cap_usd: 290000000000, website: "https://www.chevron.com", description: "Second-largest American oil company. Integrated energy operations worldwide." },
  
  { ticker: "BA", exchange: "NYSE", isin: "US0970231058", name: "Boeing Company", aliases: ["Boeing", "BA"], sector: "Industrials", industry: "Aerospace & Defense", country: "United States", headquarters_city: "Arlington", employees: 171000, founded_year: 1916, ceo: "Kelly Ortberg", market_cap_usd: 110000000000, website: "https://www.boeing.com", description: "Largest aerospace company. Commercial aircraft, defense, space systems." },
  
  { ticker: "LMT", exchange: "NYSE", isin: "US5398301094", name: "Lockheed Martin Corporation", aliases: ["Lockheed Martin", "Lockheed", "LMT"], sector: "Industrials", industry: "Defense", country: "United States", headquarters_city: "Bethesda", employees: 122000, founded_year: 1995, ceo: "James Taiclet", market_cap_usd: 130000000000, website: "https://www.lockheedmartin.com", description: "Largest defense contractor in the world. F-35, missiles, space systems." },
  
  // ===== ASIAN MAJORS =====
  { ticker: "TSM", exchange: "NYSE", isin: "US8740391003", name: "Taiwan Semiconductor Manufacturing", aliases: ["TSMC", "Taiwan Semiconductor", "TSM"], sector: "Technology", industry: "Semiconductors", country: "Taiwan", headquarters_city: "Hsinchu", employees: 76000, founded_year: 1987, ceo: "C C Wei", market_cap_usd: 850000000000, website: "https://www.tsmc.com", description: "World largest dedicated independent semiconductor foundry. Critical chip supplier to Apple, Nvidia, AMD." },
  
  { ticker: "BABA", exchange: "NYSE", isin: "US01609W1027", name: "Alibaba Group Holding", aliases: ["Alibaba", "BABA", "Jack Ma"], sector: "Consumer Discretionary", industry: "E-commerce", country: "China", headquarters_city: "Hangzhou", employees: 198000, founded_year: 1999, ceo: "Eddie Wu", market_cap_usd: 200000000000, website: "https://www.alibabagroup.com", description: "Chinese multinational technology company. E-commerce, cloud computing, fintech." },
  
  { ticker: "0700.HK", exchange: "HKEX", isin: "KYG875721634", name: "Tencent Holdings", aliases: ["Tencent", "Tencent Holdings"], sector: "Communication Services", industry: "Internet & Gaming", country: "China", headquarters_city: "Shenzhen", employees: 105000, founded_year: 1998, ceo: "Ma Huateng", market_cap_usd: 500000000000, website: "https://www.tencent.com", description: "Chinese tech conglomerate. WeChat, gaming, fintech, cloud services." },
  
  { ticker: "005930.KS", exchange: "KRX", isin: "KR7005930003", name: "Samsung Electronics", aliases: ["Samsung", "Samsung Electronics"], sector: "Technology", industry: "Consumer Electronics & Semiconductors", country: "South Korea", headquarters_city: "Suwon", employees: 270000, founded_year: 1969, ceo: "Han Jong-hee", market_cap_usd: 400000000000, website: "https://www.samsung.com", description: "South Korean multinational. Phones, semiconductors, displays, appliances." },
  
  { ticker: "7203.T", exchange: "TSE", isin: "JP3633400001", name: "Toyota Motor Corporation", aliases: ["Toyota", "Toyota Motor"], sector: "Consumer Discretionary", industry: "Automobiles", country: "Japan", headquarters_city: "Toyota City", employees: 380000, founded_year: 1937, ceo: "Koji Sato", market_cap_usd: 300000000000, website: "https://www.toyota-global.com", description: "World largest automobile manufacturer by production. Pioneer in hybrid technology." },
  
  // ===== EUROPEAN MAJORS =====
  { ticker: "NOVN.SW", exchange: "SIX", isin: "CH0012005267", name: "Novartis AG", aliases: ["Novartis"], sector: "Healthcare", industry: "Pharmaceuticals", country: "Switzerland", headquarters_city: "Basel", employees: 76000, founded_year: 1996, ceo: "Vas Narasimhan", market_cap_usd: 240000000000, website: "https://www.novartis.com", description: "Swiss multinational pharmaceutical corporation. Innovative medicines globally." },
  
  { ticker: "MC.PA", exchange: "Euronext", isin: "FR0000121014", name: "LVMH Moet Hennessy Louis Vuitton", aliases: ["LVMH", "Louis Vuitton"], sector: "Consumer Discretionary", industry: "Luxury Goods", country: "France", headquarters_city: "Paris", employees: 213000, founded_year: 1987, ceo: "Bernard Arnault", market_cap_usd: 350000000000, website: "https://www.lvmh.com", description: "World largest luxury goods conglomerate. 75+ luxury brands." },
  
  { ticker: "ASML.AS", exchange: "Euronext", isin: "NL0010273215", name: "ASML Holding NV", aliases: ["ASML"], sector: "Technology", industry: "Semiconductor Equipment", country: "Netherlands", headquarters_city: "Veldhoven", employees: 42000, founded_year: 1984, ceo: "Christophe Fouquet", market_cap_usd: 280000000000, website: "https://www.asml.com", description: "World leading supplier of photolithography systems for semiconductor manufacturing." },
  
  { ticker: "SHEL.L", exchange: "LSE", isin: "GB00BP6MXD84", name: "Shell plc", aliases: ["Shell", "Royal Dutch Shell"], sector: "Energy", industry: "Oil & Gas Integrated", country: "United Kingdom", headquarters_city: "London", employees: 103000, founded_year: 1907, ceo: "Wael Sawan", market_cap_usd: 220000000000, website: "https://www.shell.com", description: "British multinational oil and gas company. Major global energy operator." },
  
  // ===== MIDDLE EAST =====
  { ticker: "2222.SR", exchange: "Tadawul", isin: "SA14TG012N13", name: "Saudi Aramco", aliases: ["Aramco", "Saudi Aramco"], sector: "Energy", industry: "Oil & Gas Integrated", country: "Saudi Arabia", headquarters_city: "Dhahran", employees: 73000, founded_year: 1933, ceo: "Amin H Nasser", market_cap_usd: 2000000000000, website: "https://www.aramco.com", description: "Saudi Arabian national petroleum company. Largest oil producer in the world." },
  
  // ===== INDIAN ADANI/AMBANI ECOSYSTEM =====
  { ticker: "ADANIGREEN", exchange: "NSE", isin: "INE364U01010", name: "Adani Green Energy Limited", aliases: ["Adani Green", "Adani Green Energy"], sector: "Utilities", industry: "Renewable Energy", country: "India", headquarters_city: "Ahmedabad", employees: 1200, founded_year: 2015, ceo: "Vneet Jaain", market_cap_usd: 28000000000, website: "https://www.adanigreenenergy.com", description: "India largest renewable energy company by capacity." },
  
  { ticker: "ADANITRANS", exchange: "NSE", isin: "INE931S01010", name: "Adani Energy Solutions", aliases: ["Adani Transmission", "Adani Energy"], sector: "Utilities", industry: "Power Transmission", country: "India", headquarters_city: "Ahmedabad", employees: 3200, founded_year: 2013, ceo: "Anil Sardana", market_cap_usd: 12000000000, website: "https://www.adanienergysolutions.com", description: "Largest private power transmission company in India." },
  
  { ticker: "JIO", exchange: "NSE", isin: "INE758E01017", name: "Jio Financial Services", aliases: ["Jio Financial", "JFS", "Reliance Jio Financial"], sector: "Financials", industry: "NBFC", country: "India", headquarters_city: "Mumbai", employees: 1500, founded_year: 2023, ceo: "K V Kamath", market_cap_usd: 25000000000, website: "https://www.jfs.in", description: "Spun off from Reliance Industries. Financial services arm." },
  
  // ===== INDIAN PHARMA + AUTO =====
  { ticker: "DRREDDY", exchange: "NSE", isin: "INE089A01023", name: "Dr Reddys Laboratories", aliases: ["Dr Reddys", "Dr Reddy", "DRL"], sector: "Healthcare", industry: "Pharmaceuticals", country: "India", headquarters_city: "Hyderabad", employees: 27000, founded_year: 1984, ceo: "Erez Israeli", market_cap_usd: 12000000000, website: "https://www.drreddys.com", description: "Indian multinational pharmaceutical company. Generics, biosimilars, APIs." },
  
  { ticker: "CIPLA", exchange: "NSE", isin: "INE059A01026", name: "Cipla Limited", aliases: ["Cipla"], sector: "Healthcare", industry: "Pharmaceuticals", country: "India", headquarters_city: "Mumbai", employees: 25000, founded_year: 1935, ceo: "Umang Vohra", market_cap_usd: 14000000000, website: "https://www.cipla.com", description: "Indian pharmaceutical company. Strong presence in respiratory, anti-retroviral." },
  
  { ticker: "BAJAJ-AUTO", exchange: "NSE", isin: "INE917I01010", name: "Bajaj Auto Limited", aliases: ["Bajaj Auto", "Bajaj"], sector: "Consumer Discretionary", industry: "Automobiles", country: "India", headquarters_city: "Pune", employees: 9300, founded_year: 1945, ceo: "Rajiv Bajaj", market_cap_usd: 30000000000, website: "https://www.bajajauto.com", description: "Indian multinational two-wheeler and three-wheeler manufacturer." },
  
  { ticker: "MAHINDRA", exchange: "NSE", isin: "INE101A01026", name: "Mahindra & Mahindra Limited", aliases: ["Mahindra", "M&M", "Mahindra and Mahindra"], sector: "Consumer Discretionary", industry: "Automobiles", country: "India", headquarters_city: "Mumbai", employees: 41000, founded_year: 1945, ceo: "Anish Shah", market_cap_usd: 35000000000, website: "https://www.mahindra.com", description: "Indian multinational. SUVs, tractors, IT services, financial services." },
  
  { ticker: "HEROMOTOCO", exchange: "NSE", isin: "INE158A01026", name: "Hero MotoCorp Limited", aliases: ["Hero MotoCorp", "Hero Honda", "Hero"], sector: "Consumer Discretionary", industry: "Two-wheelers", country: "India", headquarters_city: "New Delhi", employees: 9800, founded_year: 1984, ceo: "Niranjan Gupta", market_cap_usd: 11000000000, website: "https://www.heromotocorp.com", description: "World largest two-wheeler manufacturer by volume." },
  
  // ===== INDIAN IT MID =====
  { ticker: "TECHM", exchange: "NSE", isin: "INE669C01036", name: "Tech Mahindra Limited", aliases: ["Tech Mahindra", "TechM"], sector: "Technology", industry: "IT Services", country: "India", headquarters_city: "Pune", employees: 152000, founded_year: 1986, ceo: "Mohit Joshi", market_cap_usd: 15000000000, website: "https://www.techmahindra.com", description: "Indian multinational IT services and consulting company." },
  
  { ticker: "LTIM", exchange: "NSE", isin: "INE214T01019", name: "LTIMindtree Limited", aliases: ["LTIMindtree", "LTI", "Mindtree", "L&T Infotech"], sector: "Technology", industry: "IT Services", country: "India", headquarters_city: "Mumbai", employees: 84000, founded_year: 1997, ceo: "Debashis Chatterjee", market_cap_usd: 17000000000, website: "https://www.ltimindtree.com", description: "Merger of LTI and Mindtree. Major Indian IT services player." },
  
  // ===== INDIAN POWER + INFRA =====
  { ticker: "COALINDIA", exchange: "NSE", isin: "INE522F01014", name: "Coal India Limited", aliases: ["Coal India", "CIL"], sector: "Energy", industry: "Coal Mining", country: "India", headquarters_city: "Kolkata", employees: 250000, founded_year: 1975, ceo: "P M Prasad", market_cap_usd: 35000000000, website: "https://www.coalindia.in", description: "World largest coal producer. Indian state-owned enterprise." },
  
  { ticker: "IOC", exchange: "NSE", isin: "INE242A01010", name: "Indian Oil Corporation", aliases: ["IOC", "Indian Oil", "Indian Oil Corp"], sector: "Energy", industry: "Oil Refining & Marketing", country: "India", headquarters_city: "New Delhi", employees: 32000, founded_year: 1959, ceo: "S M Vaidya", market_cap_usd: 22000000000, website: "https://www.iocl.com", description: "India largest oil refining company by capacity. Public sector enterprise." },
  
  { ticker: "BPCL", exchange: "NSE", isin: "INE029A01011", name: "Bharat Petroleum Corporation", aliases: ["BPCL", "Bharat Petroleum"], sector: "Energy", industry: "Oil Refining & Marketing", country: "India", headquarters_city: "Mumbai", employees: 13000, founded_year: 1976, ceo: "G Krishnakumar", market_cap_usd: 17000000000, website: "https://www.bharatpetroleum.com", description: "Indian government-owned oil and gas company. Refining and marketing." },
  
  { ticker: "HPCL", exchange: "NSE", isin: "INE094A01015", name: "Hindustan Petroleum Corporation", aliases: ["HPCL", "Hindustan Petroleum"], sector: "Energy", industry: "Oil Refining & Marketing", country: "India", headquarters_city: "Mumbai", employees: 10000, founded_year: 1974, ceo: "Pushp Kumar Joshi", market_cap_usd: 9000000000, website: "https://www.hindustanpetroleum.com", description: "Indian state-owned oil and natural gas company." },
  
  { ticker: "GAIL", exchange: "NSE", isin: "INE129A01019", name: "GAIL India Limited", aliases: ["GAIL", "Gas Authority of India"], sector: "Energy", industry: "Natural Gas", country: "India", headquarters_city: "New Delhi", employees: 5000, founded_year: 1984, ceo: "Sandeep Kumar Gupta", market_cap_usd: 14000000000, website: "https://www.gailonline.com", description: "India largest state-owned natural gas processing and distribution company." },
  
  // ===== ADDITIONAL INDIAN =====
  { ticker: "DMART", exchange: "NSE", isin: "INE192R01011", name: "Avenue Supermarts Limited", aliases: ["DMart", "Avenue Supermarts", "D-Mart"], sector: "Consumer Staples", industry: "Retail", country: "India", headquarters_city: "Mumbai", employees: 13000, founded_year: 2002, ceo: "Neville Noronha", market_cap_usd: 32000000000, website: "https://www.dmartindia.com", description: "Indian supermarket chain. Founded by Radhakishan Damani." },
  
  { ticker: "ZOMATO", exchange: "NSE", isin: "INE758T01015", name: "Zomato Limited", aliases: ["Zomato", "Eternal"], sector: "Consumer Discretionary", industry: "Food Delivery", country: "India", headquarters_city: "Gurugram", employees: 6000, founded_year: 2008, ceo: "Deepinder Goyal", market_cap_usd: 28000000000, website: "https://www.zomato.com", description: "Indian multinational food delivery and restaurant aggregator." },
  
  { ticker: "PAYTM", exchange: "NSE", isin: "INE982J01020", name: "One97 Communications Limited", aliases: ["Paytm", "One97"], sector: "Financials", industry: "Fintech", country: "India", headquarters_city: "Noida", employees: 28000, founded_year: 2000, ceo: "Vijay Shekhar Sharma", market_cap_usd: 6500000000, website: "https://paytm.com", description: "Indian multinational fintech company. Mobile payments, financial services." },
  
  { ticker: "NYKAA", exchange: "NSE", isin: "INE388Y01029", name: "FSN E-Commerce Ventures", aliases: ["Nykaa", "FSN E-Commerce"], sector: "Consumer Discretionary", industry: "E-commerce Beauty", country: "India", headquarters_city: "Mumbai", employees: 4000, founded_year: 2012, ceo: "Falguni Nayar", market_cap_usd: 6000000000, website: "https://www.nykaa.com", description: "Indian e-commerce company. Beauty, wellness, fashion products." },
  
  { ticker: "POLICYBZR", exchange: "NSE", isin: "INE417T01026", name: "PB Fintech Limited", aliases: ["PolicyBazaar", "PB Fintech", "Paisabazaar"], sector: "Financials", industry: "Insurance Tech", country: "India", headquarters_city: "Gurugram", employees: 12000, founded_year: 2008, ceo: "Yashish Dahiya", market_cap_usd: 8000000000, website: "https://www.pbfintech.in", description: "Parent of PolicyBazaar and Paisabazaar. Online insurance and loans platform." },
  
  // ===== US ADDITIONAL =====
  { ticker: "WMT", exchange: "NYSE", isin: "US9311421039", name: "Walmart Inc", aliases: ["Walmart"], sector: "Consumer Staples", industry: "Retail", country: "United States", headquarters_city: "Bentonville", employees: 2100000, founded_year: 1962, ceo: "Doug McMillon", market_cap_usd: 720000000000, website: "https://www.walmart.com", description: "World largest retailer by revenue. Hypermarket and grocery store chain." },
  
  { ticker: "PG", exchange: "NYSE", isin: "US7427181091", name: "Procter & Gamble", aliases: ["P&G", "Procter Gamble"], sector: "Consumer Staples", industry: "FMCG", country: "United States", headquarters_city: "Cincinnati", employees: 108000, founded_year: 1837, ceo: "Jon Moeller", market_cap_usd: 400000000000, website: "https://www.pg.com", description: "American multinational consumer goods corporation. Tide, Pampers, Gillette." },
  
  { ticker: "GS", exchange: "NYSE", isin: "US38141G1040", name: "Goldman Sachs Group", aliases: ["Goldman Sachs", "Goldman", "GS"], sector: "Financials", industry: "Investment Banking", country: "United States", headquarters_city: "New York", employees: 46000, founded_year: 1869, ceo: "David Solomon", market_cap_usd: 180000000000, website: "https://www.goldmansachs.com", description: "American multinational investment bank and financial services company." },
  
  { ticker: "MS", exchange: "NYSE", isin: "US6174464486", name: "Morgan Stanley", aliases: ["Morgan Stanley"], sector: "Financials", industry: "Investment Banking", country: "United States", headquarters_city: "New York", employees: 80000, founded_year: 1935, ceo: "Ted Pick", market_cap_usd: 175000000000, website: "https://www.morganstanley.com", description: "American multinational investment bank and financial services company." },
  
  { ticker: "BLK", exchange: "NYSE", isin: "US09247X1019", name: "BlackRock Inc", aliases: ["BlackRock"], sector: "Financials", industry: "Asset Management", country: "United States", headquarters_city: "New York", employees: 19800, founded_year: 1988, ceo: "Larry Fink", market_cap_usd: 150000000000, website: "https://www.blackrock.com", description: "World largest asset manager. Manages over USD 11 trillion in assets." },
  
  // ===== ASIAN ADDITIONAL =====
  { ticker: "PINS", exchange: "NYSE", isin: "US72352L1061", name: "Pinduoduo Inc", aliases: ["Pinduoduo", "Temu"], sector: "Consumer Discretionary", industry: "E-commerce", country: "China", headquarters_city: "Shanghai", employees: 13000, founded_year: 2015, ceo: "Chen Lei", market_cap_usd: 170000000000, website: "https://www.pinduoduo.com", description: "Chinese e-commerce company. Parent of Temu global platform." },
  
  { ticker: "JD", exchange: "NASDAQ", isin: "US47215P1066", name: "JD.com Inc", aliases: ["JD", "JD.com", "Jingdong"], sector: "Consumer Discretionary", industry: "E-commerce", country: "China", headquarters_city: "Beijing", employees: 517000, founded_year: 1998, ceo: "Sandy Xu", market_cap_usd: 60000000000, website: "https://www.jd.com", description: "Chinese e-commerce company. Direct sales model unlike Alibaba marketplace." },
  
  { ticker: "9988.HK", exchange: "HKEX", isin: "KYG017191142", name: "Alibaba Group Holding HK", aliases: ["Alibaba HK"], sector: "Consumer Discretionary", industry: "E-commerce", country: "China", headquarters_city: "Hangzhou", employees: 198000, founded_year: 1999, ceo: "Eddie Wu", market_cap_usd: 200000000000, website: "https://www.alibabagroup.com", description: "Hong Kong listing of Alibaba Group." },
  
  { ticker: "BIDU", exchange: "NASDAQ", isin: "US0567521085", name: "Baidu Inc", aliases: ["Baidu"], sector: "Communication Services", industry: "Internet & AI", country: "China", headquarters_city: "Beijing", employees: 40000, founded_year: 2000, ceo: "Robin Li", market_cap_usd: 32000000000, website: "https://www.baidu.com", description: "Chinese internet search engine. Major AI and autonomous driving player." },
  
  // ===== EUROPEAN ADDITIONAL =====
  { ticker: "NESN.SW", exchange: "SIX", isin: "CH0038863350", name: "Nestle SA", aliases: ["Nestle", "Nestle SA"], sector: "Consumer Staples", industry: "FMCG", country: "Switzerland", headquarters_city: "Vevey", employees: 270000, founded_year: 1866, ceo: "Laurent Freixe", market_cap_usd: 240000000000, website: "https://www.nestle.com", description: "Largest food and beverage company in the world." },
  
  { ticker: "ROG.SW", exchange: "SIX", isin: "CH0012032048", name: "Roche Holding AG", aliases: ["Roche"], sector: "Healthcare", industry: "Pharmaceuticals", country: "Switzerland", headquarters_city: "Basel", employees: 103000, founded_year: 1896, ceo: "Thomas Schinecker", market_cap_usd: 230000000000, website: "https://www.roche.com", description: "Swiss multinational healthcare company. Pharmaceuticals and diagnostics." },
  
  { ticker: "SAP", exchange: "Xetra", isin: "DE0007164600", name: "SAP SE", aliases: ["SAP"], sector: "Technology", industry: "Enterprise Software", country: "Germany", headquarters_city: "Walldorf", employees: 108000, founded_year: 1972, ceo: "Christian Klein", market_cap_usd: 260000000000, website: "https://www.sap.com", description: "German multinational enterprise software company. ERP market leader." },
  
  { ticker: "SIE.DE", exchange: "Xetra", isin: "DE0007236101", name: "Siemens AG", aliases: ["Siemens"], sector: "Industrials", industry: "Conglomerate", country: "Germany", headquarters_city: "Munich", employees: 320000, founded_year: 1847, ceo: "Roland Busch", market_cap_usd: 170000000000, website: "https://www.siemens.com", description: "German multinational conglomerate. Industrial automation, smart infrastructure." },
  
  // ===== EMERGING MARKETS =====
  { ticker: "VALE", exchange: "NYSE", isin: "BRVALEACNOR0", name: "Vale SA", aliases: ["Vale"], sector: "Materials", industry: "Mining", country: "Brazil", headquarters_city: "Rio de Janeiro", employees: 68000, founded_year: 1942, ceo: "Eduardo Bartolomeo", market_cap_usd: 50000000000, website: "https://www.vale.com", description: "Brazilian multinational mining corporation. World largest iron ore producer." },
  
  // ===== CRYPTO/FINTECH =====
  { ticker: "COIN", exchange: "NASDAQ", isin: "US19260Q1076", name: "Coinbase Global Inc", aliases: ["Coinbase"], sector: "Financials", industry: "Cryptocurrency", country: "United States", headquarters_city: "San Francisco", employees: 3500, founded_year: 2012, ceo: "Brian Armstrong", market_cap_usd: 65000000000, website: "https://www.coinbase.com", description: "Largest US-based cryptocurrency exchange platform." },
];

async function seed() {
  console.log(`\nSeeding ${COMPANIES.length} companies...\n`);

  let inserted = 0;
  let failed = 0;
  let errors = [];

  // Batch insert in chunks of 20
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
      data_source: "manual_seed_v2_mod011",
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
        console.error(`Batch ${i / 20 + 1} error:`, error.message);
        failed += batch.length;
        errors.push(error.message);
      } else {
        inserted += data?.length || 0;
        console.log(`Batch ${i / 20 + 1}: ${data?.length || 0} companies upserted`);
      }
    } catch (err) {
      console.error(`Batch ${i / 20 + 1} exception:`, err.message);
      failed += batch.length;
    }
  }

  console.log("\n========================================");
  console.log(`SEEDING COMPLETE`);
  console.log(`========================================`);
  console.log(`Total attempted: ${COMPANIES.length}`);
  console.log(`Successfully inserted/updated: ${inserted}`);
  console.log(`Failed: ${failed}`);

  // Verify
  const { count } = await supabase
    .from("wae_companies")
    .select("*", { count: "exact", head: true });

  console.log(`Total companies in DB now: ${count}`);

  // Show breakdown
  const { data: sectorData } = await supabase
    .from("wae_companies")
    .select("sector");
  
  const breakdown = {};
  sectorData?.forEach(c => {
    breakdown[c.sector] = (breakdown[c.sector] || 0) + 1;
  });
  
  console.log("\nBy sector:");
  Object.entries(breakdown).sort((a,b) => b[1] - a[1]).forEach(([s, n]) => {
    console.log(`  ${s.padEnd(30)} ${n}`);
  });

  const { data: countryData } = await supabase
    .from("wae_companies")
    .select("country");
  
  const cBreakdown = {};
  countryData?.forEach(c => {
    cBreakdown[c.country] = (cBreakdown[c.country] || 0) + 1;
  });
  
  console.log("\nBy country:");
  Object.entries(cBreakdown).sort((a,b) => b[1] - a[1]).forEach(([c, n]) => {
    console.log(`  ${c.padEnd(20)} ${n}`);
  });
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
