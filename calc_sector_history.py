import asyncio
import aiohttp
import json
import os
import time
from datetime import datetime

async def fetch_history(session, symbol, from_time, to_time):
    url = f"https://dchart-api.vndirect.com.vn/dchart/history?resolution=D&symbol={symbol}&from={from_time}&to={to_time}"
    try:
        async with session.get(url, timeout=10) as res:
            if res.status == 200:
                data = await res.json(content_type=None)
                if data.get('s') == 'ok':
                    return symbol, data
    except Exception as e:
        pass
    return symbol, None

async def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    with open(os.path.join(base_dir, 'fialda_icb.json'), 'r', encoding='utf-8') as f:
        icbs = json.load(f)
        
    with open(os.path.join(base_dir, 'fialda_stock_mapping.json'), 'r', encoding='utf-8') as f:
        mapping = json.load(f).get('sector_to_stocks', {})
        
    all_stocks = set()
    for stocks in mapping.values():
        for s in stocks:
            all_stocks.add(s)
            
    to_time = int(time.time())
    from_time = to_time - 30 * 86400 # 30 days
    
    results = {}
    print(f"Fetching history for {len(all_stocks)} stocks...")
    async with aiohttp.ClientSession(headers={'User-Agent': 'Mozilla/5.0'}) as session:
        tasks = []
        for sym in all_stocks:
            tasks.append(fetch_history(session, sym, from_time, to_time))
            if len(tasks) >= 50:
                batch = await asyncio.gather(*tasks)
                for sym, data in batch:
                    if data:
                        results[sym] = data
                tasks = []
                await asyncio.sleep(0.1)
        if tasks:
            batch = await asyncio.gather(*tasks)
            for sym, data in batch:
                if data:
                    results[sym] = data

    print(f"Fetched {len(results)} valid histories. Calculating sector values...")
    sector_data_out = []
    
    for sector in icbs:
        icb_code = sector['name']
        sector_name = sector['viSector']
        icb_level = sector['icbLevel']
        
        stocks_in_sector = mapping.get(icb_code, [])
        if not stocks_in_sector:
            continue
            
        daily_values = {}
        for sym in stocks_in_sector:
            if sym in results:
                data = results[sym]
                times = data.get('t', [])
                closes = data.get('c', [])
                volumes = data.get('v', [])
                
                for i in range(len(times)):
                    t = times[i]
                    date_str = datetime.fromtimestamp(t).strftime('%Y-%m-%d')
                    val = closes[i] * volumes[i]
                    if date_str not in daily_values:
                        daily_values[date_str] = 0
                    daily_values[date_str] += val
                    
        sorted_dates = sorted(list(daily_values.keys()))
        if len(sorted_dates) < 2:
            continue
            
        sorted_dates = sorted_dates[-15:]
        
        history = []
        for i in range(1, len(sorted_dates)):
            date_today = sorted_dates[i]
            date_prev = sorted_dates[i-1]
            v_today = daily_values[date_today]
            v_prev = daily_values[date_prev]
            roc = 0
            if v_prev > 0:
                roc = ((v_today - v_prev) / v_prev) * 100
            history.append({
                "date": date_today,
                "roc": roc,
                "val": v_today
            })
            
        if not history:
            continue
            
        sector_data_out.append({
            "icbCode": icb_code,
            "sectorName": sector_name,
            "icbLevel": icb_level,
            "latestROC": history[-1]['roc'] if history else 0,
            "history": history
        })
        
    final_output = {"data": sector_data_out}
    cache_dir = os.path.join(base_dir, 'cache')
    os.makedirs(cache_dir, exist_ok=True)
    with open(os.path.join(cache_dir, 'sector_history.json'), 'w', encoding='utf-8') as f:
        json.dump(final_output, f, ensure_ascii=False)
        
    print(f"Generated sector_history.json for {len(sector_data_out)} sectors.")

if __name__ == "__main__":
    asyncio.run(main())
