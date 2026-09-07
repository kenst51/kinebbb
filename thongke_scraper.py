import requests
import json
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

base_dir = os.path.dirname(os.path.abspath(__file__))
static_dir = os.path.join(base_dir, 'static')
thongke_file = os.path.join(static_dir, 'thongke_giaodich.json')

def load_symbols():
    with open(os.path.join(static_dir, 'symbols.json'), 'r', encoding='utf-8') as f:
        return [s['code'] for s in json.load(f)['data']]

def fetch_details(symbol):
    url = f"https://iq.vietcap.com.vn/api/iq-insight-service/v1/company/details?ticker={symbol}"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    try:
        res = requests.get(url, headers=headers, timeout=5)
        if res.status_code == 200:
            data = res.json().get('data', {})
            return symbol, data
    except Exception as e:
        pass
    return symbol, None

def run():
    print("[ThongKe Scraper] Starting...")
    symbols = load_symbols()
    
    result = {}
    if os.path.exists(thongke_file):
        try:
            with open(thongke_file, 'r', encoding='utf-8') as f:
                result = json.load(f)
        except:
            pass

    # Batch process
    print(f"Total symbols to fetch: {len(symbols)}")
    fetched_count = 0
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(fetch_details, sym): sym for sym in symbols}
        
        for future in as_completed(futures):
            sym, data = future.result()
            fetched_count += 1
            if data:
                result[sym] = {
                    "foreign": data.get("foreignerPercentage"),
                    "freefloat": data.get("freeFloat"),
                    "v20": data.get("averageMatchVolume1Month"),
                    "hi52": data.get("highestPrice1Year"),
                    "lo52": data.get("lowestPrice1Year")
                }
            if fetched_count % 100 == 0:
                print(f"[ThongKe Scraper] Progress: {fetched_count}/{len(symbols)}")
                # save intermediate
                with open(thongke_file, 'w', encoding='utf-8') as f:
                    json.dump(result, f)

    # final save
    with open(thongke_file, 'w', encoding='utf-8') as f:
        json.dump(result, f)
    print(f"[ThongKe Scraper] Done! Saved {len(result)} records to {thongke_file}")

if __name__ == '__main__':
    run()
