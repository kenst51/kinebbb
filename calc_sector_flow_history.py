import json, os, asyncio, aiohttp, time
from datetime import datetime


import json
import os

ff_cache = {}
try:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(base_dir, 'static', 'thongke_giaodich.json'), 'r', encoding='utf-8') as f:
        ff_cache = json.load(f)
except:
    pass

def get_free_float(sym, total_shares):
    raw_ff = 1.0
    if sym in ff_cache and 'freefloat' in ff_cache[sym]:
        ff_shares = ff_cache[sym]['freefloat']
        if total_shares > 0 and ff_shares > 0:
            raw_ff = ff_shares / total_shares
            # Cap at 1.0 just in case
            raw_ff = min(1.0, raw_ff)
    
    # Round to 5% steps (0.05)
    return round(raw_ff / 0.05) * 0.05

def calculate_capping_factors(p_s_f_dict, max_weight=0.15):
    c_factors = {sym: 1.0 for sym in p_s_f_dict}
    if not p_s_f_dict: return c_factors
    actual_max_weight = max(max_weight, 1.0 / len(p_s_f_dict))
    
    for _ in range(8):
        cmv = {sym: val * c_factors[sym] for sym, val in p_s_f_dict.items()}
        total_cmv = sum(cmv.values())
        if total_cmv == 0: break
        weights = {sym: val / total_cmv for sym, val in cmv.items()}
        exceeding = {sym: w for sym, w in weights.items() if w > actual_max_weight + 1e-4}
        if not exceeding: break
        largest_sym = max(exceeding, key=exceeding.get)
        sum_others = total_cmv - cmv[largest_sym]
        if sum_others == 0: break
        new_c = (actual_max_weight * sum_others) / ((1.0 - actual_max_weight) * p_s_f_dict[largest_sym])
        c_factors[largest_sym] = new_c
    return c_factors

async def fetch_history(session, symbol, from_time, to_time):
    url = f"https://dchart-api.vndirect.com.vn/dchart/history?resolution=D&symbol={symbol}&from={from_time}&to={to_time}"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://dchart.vndirect.com.vn/'
    }
    try:
        timeout = aiohttp.ClientTimeout(total=4)
        async with session.get(url, headers=headers, timeout=timeout) as resp:
            if resp.status == 200:
                data = await resp.json(content_type=None)
                if data and data.get('s') == 'ok' and data.get('t'):
                    return symbol, data
    except Exception:
        pass
    return symbol, None

async def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    with open(os.path.join(base_dir, 'fialda_icb.json'), 'r', encoding='utf-8') as f:
        icbs = json.load(f)
        
    with open(os.path.join(base_dir, 'fialda_stock_mapping.json'), 'r', encoding='utf-8') as f:
        mapping = json.load(f).get('sector_to_stocks', {})
        
    fund_cache = {}
    fund_path = os.path.join(base_dir, 'cache', 'stock_financial_data.json')
    if os.path.exists(fund_path):
        with open(fund_path, 'r', encoding='utf-8') as f:
            fund_cache = json.load(f)
            
    # Collect all unique stocks
    all_stocks = set()
    for stocks in mapping.values():
        all_stocks.update(stocks)
    all_stocks = sorted(list(all_stocks))
    
    cache_dir = os.path.join(base_dir, 'cache')
    out_file = os.path.join(cache_dir, 'sector_flow_history.json')
    div_file = os.path.join(cache_dir, 'sector_divisors.json')
    
    existing_flow_data = {}
    existing_divisors = {}
    last_date_str = None
    
    if os.path.exists(out_file) and os.path.exists(div_file):
        try:
            with open(out_file, 'r', encoding='utf-8') as f:
                existing_flow_data = json.load(f)
            with open(div_file, 'r', encoding='utf-8') as f:
                existing_divisors = json.load(f)
            last_dt_obj = None
            for s_data in existing_flow_data.values():
                d_list = s_data.get('dates', [])
                if d_list:
                    try:
                        cand_dt = datetime.strptime(d_list[-1], '%d-%m-%Y')
                        if last_dt_obj is None or cand_dt > last_dt_obj:
                            last_dt_obj = cand_dt
                            last_date_str = d_list[-1]
                    except Exception:
                        pass
        except Exception as e:
            print(f"Warning reading existing cache: {e}")
            existing_flow_data = {}
            
    to_time = int(time.time())
    
    if existing_flow_data and last_date_str:
        try:
            last_dt = datetime.strptime(last_date_str, '%d-%m-%Y')
            from_time = int(last_dt.timestamp()) - 4 * 86400
            print(f"[Incremental Sync] Last cached date: {last_date_str}. Fetching recent data from {datetime.fromtimestamp(from_time).strftime('%d-%m-%Y')} to now...")
        except Exception:
            from_time = to_time - 15 * 86400
    else:
        from_time = 1356998400 # Full 14-year sync back to 2013
        print("[Full Sync] Fetching full 14-year historical K-line for all stocks...")

    results = {}
    connector = aiohttp.TCPConnector(limit=60, ssl=False)
    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = []
        for sym in all_stocks:
            tasks.append(fetch_history(session, sym, from_time, to_time))
            if len(tasks) >= 60:
                batch = await asyncio.gather(*tasks)
                for sym, data in batch:
                    if data:
                        results[sym] = data
                tasks = []
                await asyncio.sleep(0.03)
        if tasks:
            batch = await asyncio.gather(*tasks)
            for sym, data in batch:
                if data:
                    results[sym] = data

    print(f"Successfully loaded {len(results)} valid histories. Calculating sector flows & BMV market caps...")
    
    # Pre-structure stock daily data
    stock_daily = {}
    for sym, data in results.items():
        times = data.get('t', [])
        opens = data.get('o', [])
        closes = data.get('c', [])
        volumes = data.get('v', [])
        
        days_map = {}
        for i in range(len(times)):
            d_str = datetime.fromtimestamp(times[i]).strftime('%Y-%m-%d')
            c_val = float(closes[i])
            o_val = float(opens[i]) if i < len(opens) else c_val
            v_val = float(volumes[i])
            prev_c = float(closes[i-1]) if i > 0 else o_val
            
            # Value in Billion VND
            val_bil = (c_val * 1000.0 * v_val) / 1e9
            
            # Change pct
            ch_pct = ((c_val - prev_c) / prev_c * 100.0) if prev_c > 0 else 0.0
            
            # Active MB approximation
            if v_val > 0:
                if c_val > prev_c:
                    buy_pct = min(92.0, 50.0 + (ch_pct * 4.0))
                    sell_pct = 100.0 - buy_pct
                elif c_val < prev_c:
                    sell_pct = min(92.0, 50.0 + (abs(ch_pct) * 4.0))
                    buy_pct = 100.0 - sell_pct
                else:
                    buy_pct = 48.0
                    sell_pct = 48.0
                mb_pct = max(0.0, 100.0 - buy_pct - sell_pct)
            else:
                buy_pct, sell_pct, mb_pct = 50.0, 50.0, 0.0
                
            days_map[d_str] = {
                'close': c_val,
                'prev_close': prev_c,
                'volume': v_val,
                'val_bil': val_bil,
                'buy_vol': (v_val * buy_pct / 100.0) / 1e6, # in millions
                'sell_vol': (v_val * sell_pct / 100.0) / 1e6,
                'mb_vol': (v_val * mb_pct / 100.0) / 1e6,
                'buy_val': (val_bil * buy_pct / 100.0),
                'sell_val': (val_bil * sell_pct / 100.0),
                'mb_val': (val_bil * mb_pct / 100.0)
            }
        stock_daily[sym] = days_map
        
    sector_flow_data = existing_flow_data if existing_flow_data else {}
    sector_divisors = existing_divisors if existing_divisors else {}
    new_dates_added = set()
    
    for sector in icbs:
        icb_code = str(sector['name'])
        sector_name = sector['viSector'].split('(')[0].strip()
        icb_level = sector['icbLevel']
        
        stocks_in_sector = mapping.get(icb_code, [])
        if not stocks_in_sector:
            continue
            
        all_dates_set = set()
        for sym in stocks_in_sector:
            if sym in stock_daily:
                all_dates_set.update(stock_daily[sym].keys())
                
        sorted_dates = sorted(list(all_dates_set))
        if len(sorted_dates) < 2 and icb_code not in sector_flow_data:
            continue
            
        is_new_sector = icb_code not in sector_flow_data
        if is_new_sector:
            sec_rec = {
                "icbCode": icb_code,
                "sectorName": sector_name,
                "icbLevel": icb_level,
                "dates": [],
                "indexPoints": [],
                "marketCaps": [],
                "flow": {"green": [], "yellow": [], "red": []},
                "kl_mb": {"buyVol": [], "mbVol": [], "sellVol": []},
                "gt_mb": {"buyVal": [], "mbVal": [], "sellVal": []}
            }
            sector_flow_data[icb_code] = sec_rec
            existing_dates = set()
        else:
            sec_rec = sector_flow_data[icb_code]
            existing_dates = set(sec_rec.get('dates', []))
            
        divisor = sector_divisors.get(icb_code)
        
        # Track last known price of each stock
        last_known_price = {}
        for sym in stocks_in_sector:
            if sym in stock_daily and stock_daily[sym]:
                first_date = min(stock_daily[sym].keys())
                last_known_price[sym] = stock_daily[sym][first_date]['close']
                
        for d_str in sorted_dates:
            dt_obj = datetime.strptime(d_str, '%Y-%m-%d')
            d_formatted = dt_obj.strftime('%d-%m-%Y')
            
            # Cập nhật giá gần nhất của các mã trong phiên này
            for sym in stocks_in_sector:
                s_data = stock_daily.get(sym, {}).get(d_str)
                if s_data:
                    last_known_price[sym] = s_data['close']
                    
            if d_formatted in existing_dates:
                continue
                
            g_val = y_val = r_val = 0.0
            b_vol = m_vol = s_vol = 0.0
            b_val = m_val = s_val = 0.0
            
            for sym in stocks_in_sector:
                s_data = stock_daily.get(sym, {}).get(d_str)
                if s_data:
                    c = s_data['close']
                    p_c = s_data['prev_close']
                    v_b = s_data['val_bil']
                    
                    if c > p_c:
                        g_val += v_b
                    elif c < p_c:
                        r_val += v_b
                    else:
                        y_val += v_b
                        
                    b_vol += s_data['buy_vol']
                    m_vol += s_data['mb_vol']
                    s_vol += s_data['sell_vol']
                    
                    b_val += s_data['buy_val']
                    m_val += s_data['mb_val']
                    s_val += s_data['sell_val']
                    
            p_s_f_dict = {}
            for sym in stocks_in_sector:
                c_p = last_known_price.get(sym, 0.0)
                fund = fund_cache.get(sym, {})
                shares = fund.get('shares', 0.0)
                if c_p > 0 and shares > 0:
                    p_s_f_dict[sym] = (c_p * 1000.0) * shares
                    
            current_market_val = sum(p_s_f_dict.values())
            
            if not divisor or divisor <= 0:
                base_cap = current_market_val if current_market_val > 0 else 1e9
                divisor = base_cap / 100.0
                sector_divisors[icb_code] = divisor
                
            index_pt = round(current_market_val / divisor, 2)
            
            sec_rec['dates'].append(d_formatted)
            sec_rec['indexPoints'].append(index_pt)
            sec_rec['marketCaps'].append(current_market_val)
            
            sec_rec['flow']['green'].append(round(g_val, 2))
            sec_rec['flow']['yellow'].append(round(y_val, 2))
            sec_rec['flow']['red'].append(round(r_val, 2))
            
            sec_rec['kl_mb']['buyVol'].append(round(b_vol, 2))
            sec_rec['kl_mb']['mbVol'].append(round(m_vol, 2))
            sec_rec['kl_mb']['sellVol'].append(round(s_vol, 2))
            
            sec_rec['gt_mb']['buyVal'].append(round(b_val, 2))
            sec_rec['gt_mb']['mbVal'].append(round(m_val, 2))
            sec_rec['gt_mb']['sellVal'].append(round(s_val, 2))
            
            existing_dates.add(d_formatted)
            new_dates_added.add(d_formatted)
            
    os.makedirs(cache_dir, exist_ok=True)
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(sector_flow_data, f, ensure_ascii=False)
        
    with open(div_file, 'w', encoding='utf-8') as f:
        json.dump(sector_divisors, f, ensure_ascii=False)
        
    print(f"[Done] Synchronized {len(sector_flow_data)} sectors. Added {len(new_dates_added)} new trading sessions: {sorted(list(new_dates_added))}")

if __name__ == "__main__":
    t_start = time.time()
    asyncio.run(main())
    print(f"Total execution time: {round(time.time() - t_start, 2)}s")
