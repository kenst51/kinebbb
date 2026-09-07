import json
import requests
import os
import time

def run():
    print("[update_symbols] Fetching latest symbols from Fialda API (https://fwt.fialda.com/co-phieu-a-z/tong-quan/)...")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://fwt.fialda.com/"
    }
    
    url = "https://fwtapi2.fialda.com/api/services/app/Configuration/GetInitialData"
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    symbols_path = os.path.join(base_dir, 'static', 'symbols.json')
    floor_map_path = os.path.join(base_dir, 'static', 'floor_map.json')
    root_floor_map_path = os.path.join(base_dir, 'floor_map.json')
    
    symbols_data = []
    floor_map = {}

    try:
        res = requests.get(url, headers=headers, timeout=15)
        res.raise_for_status()
        raw_data = res.json()
        
        all_symbols = raw_data.get('result', {}).get('symbols', [])
        if not all_symbols:
            print("[update_symbols] Error: No symbols returned from Fialda API")
            return

        for item in all_symbols:
            sym = item.get('symbol')
            if not sym:
                continue
                
            sym = sym.strip().upper()
            full_name = item.get('full_name') or item.get('description') or sym
            sec_type = item.get('type', 'Stock')
            exchange = item.get('exchange', 'HSX')
            
            floor = 'HOSE' if exchange in ['HSX', 'HOSE'] else exchange
            
            # Save all Stocks, ETFs, and Warrants
            symbols_data.append({
                "code": sym,
                "companyName": full_name,
                "type": "STOCK" if sec_type == 'Stock' else sec_type.upper(),
                "floor": floor,
                "icbCode": item.get('icbCode'),
                "icbCodeLvl4": item.get('icbCode_Lvl4')
            })
            floor_map[sym] = floor

        # Write to static/symbols.json
        with open(symbols_path, 'w', encoding='utf-8') as f:
            json.dump({"data": symbols_data}, f, ensure_ascii=False, indent=2)
            
        # Write to static/floor_map.json and root floor_map.json
        with open(floor_map_path, 'w', encoding='utf-8') as f:
            json.dump(floor_map, f, ensure_ascii=False, indent=2)
            
        with open(root_floor_map_path, 'w', encoding='utf-8') as f:
            json.dump(floor_map, f, ensure_ascii=False, indent=2)

        # Also save the raw initial data to fialda_initial.json for other modules
        fialda_initial_path = os.path.join(base_dir, 'fialda_initial.json')
        with open(fialda_initial_path, 'w', encoding='utf-8') as f:
            json.dump(raw_data, f, ensure_ascii=False)

        print(f"[update_symbols] Successfully updated {len(symbols_data)} symbols from Fialda!")

    except Exception as e:
        print(f"[update_symbols] Failed to fetch symbols from Fialda: {e}")

if __name__ == '__main__':
    run()
