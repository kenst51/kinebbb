import sys, json, requests, os, time
from concurrent.futures import ThreadPoolExecutor, as_completed
sys.stdout.reconfigure(encoding='utf-8')

base_dir = "d:/code antigravity/5"
cache_dir = os.path.join(base_dir, 'cache')
os.makedirs(cache_dir, exist_ok=True)
fund_cache_file = os.path.join(cache_dir, 'stock_financial_data.json')

with open(os.path.join(base_dir, 'fialda_icb.json'), 'r', encoding='utf-8') as f:
    icb_list = json.load(f)

with open(os.path.join(base_dir, 'fialda_stock_mapping.json'), 'r', encoding='utf-8') as f:
    mapping = json.load(f).get('sector_to_stocks', {})

all_symbols = set()
for stocks in mapping.values():
    for s in stocks:
        all_symbols.add(s)

symbols_list = sorted(list(all_symbols))
print(f"Total symbols to fetch: {len(symbols_list)}")

fund_cache = {}
if os.path.exists(fund_cache_file):
    try:
        with open(fund_cache_file, 'r', encoding='utf-8') as f:
            fund_cache = json.load(f)
    except:
        pass

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

def fetch_single(sym):
    url = f"https://iq.vietcap.com.vn/api/iq-insight-service/v1/company/{sym}/statistics-financial"
    try:
        res = requests.get(url, headers=headers, timeout=5)
        if res.status_code == 200:
            items = res.json().get('data', [])
            if items:
                latest = items[-1]
                pe = latest.get('pe')
                mcap = latest.get('marketCap')
                shares = latest.get('numberOfSharesMktCap')
                lnst_ttm = (mcap / pe) if (pe and pe > 0 and mcap) else (mcap * -0.05 if pe and pe < 0 else 0)
                return sym, {
                    'shares': float(shares or 0),
                    'mcap_ref': float(mcap or 0),
                    'pe_ref': float(pe) if pe is not None else None,
                    'lnst_ttm': float(lnst_ttm or 0),
                    'pb_ref': float(latest.get('pb')) if latest.get('pb') is not None else None,
                    'roa': round(float(latest.get('roa')) * 100, 2) if latest.get('roa') is not None else None,
                    'roe': round(float(latest.get('roe')) * 100, 2) if latest.get('roe') is not None else None
                }
    except Exception:
        pass
    return sym, None

# Fetch all
print(f"Starting parallel fetch with 30 workers...")
t0 = time.time()
with ThreadPoolExecutor(max_workers=30) as executor:
    futures = {executor.submit(fetch_single, sym): sym for sym in symbols_list}
    count = 0
    for fut in as_completed(futures):
        sym, res = fut.result()
        count += 1
        if res:
            fund_cache[sym] = res
        if count % 300 == 0:
            print(f"Progress: {count}/{len(symbols_list)} in {time.time()-t0:.1f}s")

with open(fund_cache_file, 'w', encoding='utf-8') as f:
    json.dump(fund_cache, f, ensure_ascii=False)

print(f"Completed in {time.time()-t0:.2f}s. Saved {len(fund_cache)} records to {fund_cache_file}")
