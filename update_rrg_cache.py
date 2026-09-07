import asyncio
import json
import time
import os
import sys
from datetime import datetime
import httpx

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

_is_rebuilding_full_market = False

async def rebuild_full_market_cache(client=None, silent=False):
    global _is_rebuilding_full_market
    if _is_rebuilding_full_market:
        if not silent:
            print("⏳ Đang có tiến trình cập nhật RRG toàn thị trường chạy ngầm, bỏ qua yêu cầu trùng lặp.")
        return False
        
    _is_rebuilding_full_market = True
    if not silent:
        print("🚀 Bắt đầu tính toán lại dữ liệu RRG Toàn Thị Trường...")
    t0 = time.time()
    
    close_client_at_end = False
    if client is None:
        client = httpx.AsyncClient(
            limits=httpx.Limits(max_keepalive_connections=15, max_connections=30),
            timeout=httpx.Timeout(40.0, connect=15.0)
        )
        close_client_at_end = True
        
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        mapping_path = os.path.join(base_dir, 'fialda_stock_mapping.json')
        
        all_symbols = []
        if os.path.exists(mapping_path):
            with open(mapping_path, 'r', encoding='utf-8') as f:
                mapping = json.load(f).get('sector_to_stocks', {})
            all_set = set()
            for s in mapping.values():
                all_set.update(s)
            all_symbols = sorted(list(all_set))
            
        if not all_symbols:
            if not silent:
                print("❌ Không tìm thấy danh sách mã cổ phiếu trong mapping.")
            return False
            
        batch_size = 200
        chunks = [all_symbols[i:i + batch_size] for i in range(0, len(all_symbols), batch_size)]
        if not silent:
            print(f"📦 Tổng cộng: {len(all_symbols)} mã, chia thành {len(chunks)} lô.")
            
        to_time = time.time()
        from_time = to_time - 90 * 24 * 3600
        from_date = datetime.fromtimestamp(from_time).strftime('%Y-%m-%d')
        to_date = datetime.fromtimestamp(to_time).strftime('%Y-%m-%d')
        
        url = 'https://fwtapi1.fialda.com/api/services/app/RRG/RRGData'
        headers = {
            'appid': 'F7335346-0CB8-49A1-B9CB-A59504CBEF14',
            'sa': '184017395232524600427',
            'abp.tenantid': '6',
            'Content-Type': 'application/json;charset=UTF-8',
            'User-Agent': 'Mozilla/5.0'
        }
        
        # Giới hạn 3 concurrent requests để Fialda không quá tải
        sem = asyncio.Semaphore(3)
        
        async def fetch_chunk_with_retry(chunk, batch_idx):
            async with sem:
                payload = {
                    'fromDate': from_date,
                    'toDate': to_date,
                    'parent': 'VNINDEX',
                    'symbols': chunk,
                    'icbs': [],
                    'parentType': 0
                }
                for attempt in range(2):
                    try:
                        r = await client.post(url, json=payload, headers=headers)
                        if r.status_code == 200:
                            res = r.json().get('result', [])
                            return res
                    except Exception as err:
                        if attempt == 0:
                            await asyncio.sleep(1.0)
                        else:
                            if not silent:
                                print(f"⚠️ Cảnh báo lô {batch_idx + 1} lỗi: {err}")
                return []
                
        tasks = [fetch_chunk_with_retry(chunk, idx) for idx, chunk in enumerate(chunks)]
        results = await asyncio.gather(*tasks)
        
        merged_by_date = {}
        for res_list in results:
            for item in res_list:
                d = str(item.get('date', ''))
                if not d: continue
                if d not in merged_by_date:
                    merged_by_date[d] = {}
                rrg = item.get('rrgdata', {})
                if rrg:
                    merged_by_date[d].update(rrg)
                    
        dates_sorted = sorted(merged_by_date.keys())
        if len(dates_sorted) < 2:
            if not silent:
                print("❌ Dữ liệu không đủ 2 phiên nến.")
            return False
            
        latest_date = dates_sorted[-1]
        prev_date = dates_sorted[-2]
        rrg_T = merged_by_date[latest_date]
        rrg_T1 = merged_by_date[prev_date]
        
        # Symbol names
        symbols_file = os.path.join(base_dir, 'static', 'symbols.json')
        name_map = {}
        if os.path.exists(symbols_file):
            try:
                with open(symbols_file, 'r', encoding='utf-8') as f:
                    s_data = json.load(f)
                    s_list = s_data.get('data', []) if isinstance(s_data, dict) else s_data
                    name_map = {s.get('code'): s.get('companyName', s.get('code')) for s in s_list if s.get('code')}
            except:
                pass
                
        # Trading volume / value mapping
        thongke_file = os.path.join(base_dir, 'static', 'thongke_giaodich.json')
        tk_map = {}
        if os.path.exists(thongke_file):
            try:
                with open(thongke_file, 'r', encoding='utf-8') as f:
                    tk_map = json.load(f)
            except:
                pass

        out = {'dandat': [], 'caithien': [], 'tuthao': [], 'suyyeu': []}
        
        for sym, d in rrg_T.items():
            if not d: continue
            r = float(d.get('ratio') if d.get('ratio') is not None else d.get('rs_ratio', 100))
            m = float(d.get('mom') if d.get('mom') is not None else d.get('momentum', 100))
            p = float(d.get('price', 0))
            
            d1 = rrg_T1.get(sym, {})
            r1 = float(d1.get('ratio') if d1.get('ratio') is not None else d1.get('rs_ratio', r))
            m1 = float(d1.get('mom') if d1.get('mom') is not None else d1.get('momentum', m))
            
            r_diff = r - r1
            m_diff = m - m1
            r_pct = (r_diff / r1 * 100) if r1 != 0 else 0
            m_pct = (m_diff / m1 * 100) if m1 != 0 else 0
            
            # 15 sessions history
            sym_hist = []
            for d_key in dates_sorted[-15:]:
                s_d = merged_by_date[d_key].get(sym)
                if s_d:
                    sym_hist.append({
                        'date': d_key,
                        'ratio': round(float(s_d.get('ratio') if s_d.get('ratio') is not None else s_d.get('rs_ratio', 100)), 2),
                        'mom': round(float(s_d.get('mom') if s_d.get('mom') is not None else s_d.get('momentum', 100)), 2),
                        'price': round(float(s_d.get('price', 0)), 2)
                    })
                    
            v20 = float(tk_map.get(sym, {}).get('v20', 0) or 0)
            trading_val = round((v20 * (p * 1000.0)) / 1_000_000_000.0, 2)

            item = {
                'symbol': sym,
                'icbId': None,
                'icbCode': None,
                'name': name_map.get(sym, sym),
                'ratio': round(r, 2),
                'mom': round(m, 2),
                'r_diff': round(r_diff, 2),
                'm_diff': round(m_diff, 2),
                'r_pct': round(r_pct, 2),
                'm_pct': round(m_pct, 2),
                'price': p,
                'v20': v20,
                'trading_val': trading_val,
                'history': sym_hist
            }
            
            if r >= 100 and m >= 100: out['dandat'].append(item)
            elif r < 100 and m >= 100: out['caithien'].append(item)
            elif r < 100 and m < 100: out['tuthao'].append(item)
            else: out['suyyeu'].append(item)
            
        for k in out:
            out[k].sort(key=lambda x: (x['mom'], x['ratio']), reverse=True)
            
        now_ts = time.time()
        updated_at_str = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        
        cache_dir = os.path.join(base_dir, "cache")
        os.makedirs(cache_dir, exist_ok=True)
        cache_file = os.path.join(cache_dir, "rrg_full_market_cache.json")
        
        cache_payload = {
            "timestamp": now_ts,
            "updated_at": updated_at_str,
            "date": latest_date,
            "data": out
        }
        
        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump(cache_payload, f, ensure_ascii=False)
            
        dt = time.time() - t0
        if not silent:
            print(f"✅ HOÀN TẤT CẬP NHẬT RRG TOÀN THỊ TRƯỜNG TRONG {dt:.2f} GIÂY!")
            print(f"   Phiên giao dịch: {latest_date}")
            print(f"   Thời điểm lưu: {updated_at_str}")
            print(f"   Tăng giá: {len(out['dandat'])} mã | Tích lũy: {len(out['caithien'])} mã | Suy yếu: {len(out['suyyeu'])} mã | Giảm giá: {len(out['tuthao'])} mã")
            
        return cache_payload
        
    except Exception as e:
        if not silent:
            print(f"❌ Lỗi khi xây dựng cache RRG toàn thị trường: {e}")
        return False
    finally:
        _is_rebuilding_full_market = False
        if close_client_at_end and client:
            await client.aclose()

if __name__ == '__main__':
    import sys
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
    asyncio.run(rebuild_full_market_cache())
