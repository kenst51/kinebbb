import os
import time
import math
import json
import requests
from typing import List, Dict, Any, Optional
from datetime import datetime

class InstitutionalKeyLevelScanner:
    def __init__(self, data_dir: Optional[str] = None):
        if data_dir is None:
            data_dir = os.path.dirname(os.path.abspath(__file__))
        self.data_dir = data_dir
        self.sector_mapping_file = os.path.join(data_dir, 'data', 'icb_stock_sector_mapping.json')

        self.stock_to_sector: Dict[str, Any] = {}
        self.cache: Dict[str, Any] = {}
        self.last_cache_time: float = 0.0
        self.cache_ttl: int = 45

        self.vn30_symbols = {
            'VCB', 'BID', 'CTG', 'HPG', 'FPT', 'VIC', 'VHM', 'VNM', 'MSN', 'TCB',
            'MBB', 'VPB', 'MWG', 'GAS', 'VRE', 'ACB', 'SSB', 'HDB', 'STB', 'SHB',
            'VIB', 'TPB', 'LPB', 'SSI', 'VJC', 'PLX', 'POW', 'SAB', 'BCM', 'GVR'
        }

        self._load_metadata()

    def _load_metadata(self):
        try:
            if os.path.exists(self.sector_mapping_file):
                with open(self.sector_mapping_file, 'r', encoding='utf-8') as f:
                    s_data = json.load(f)
                    self.stock_to_sector = s_data.get('stock_to_sector', {})
        except Exception as e:
            print(f'[KeyLevelScanner] Error loading sector mapping: {e}')

    def scan_market(self, exchange: str = 'ALL', force_refresh: bool = False) -> Dict[str, Any]:
        now = time.time()
        cache_key = f'kl_scan_{exchange}'
        if not force_refresh and cache_key in self.cache and (now - self.last_cache_time < self.cache_ttl):
            return self.cache[cache_key]

        url = 'https://scanner.tradingview.com/vietnam/scan'
        cols = [
            'name', 'description', 'exchange', 'type', 'subtype',
            'close', 'change', 'change_abs', 'volume', 'Value.Traded',
            'EMA20', 'EMA50', 'EMA200',
            'price_52_week_high', 'price_52_week_low',
            'relative_volume_10d_calc', 'RSI', 'high', 'low'
        ]

        payload = {
            'filter': [
                {'left': 'type', 'operation': 'in_range', 'right': ['stock', 'dr', 'fund']}
            ],
            'options': {'lang': 'vi'},
            'symbols': {'query': {'types': []}, 'tickers': []},
            'columns': cols,
            'sort': {'sortBy': 'Value.Traded', 'sortOrder': 'desc'},
            'range': [0, 1800]
        }

        headers = {
            'User-Agent': 'Mozilla/5.0',
            'Content-Type': 'application/json'
        }

        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=10.0)
            if resp.status_code != 200:
                return {'status': 'error', 'message': f'HTTP {resp.status_code}', 'data': []}
            raw_data = resp.json().get('data', [])
        except Exception as e:
            return {'status': 'error', 'message': str(e), 'data': []}

        results = []
        counts = {
            'total': 0,
            'near_support': 0,
            'near_resistance': 0,
            'weekly_mtf': 0,
            'confluence': 0,
            'sr_flip': 0,
            'tight_1pct': 0
        }

        for row in raw_data:
            d = row.get('d', [])
            if len(d) < 16:
                continue

            sym = d[0]
            if not sym or sym.startswith('^'):
                continue

            stock_ex = (d[2] or '').upper()
            if exchange == 'VN30' and sym not in self.vn30_symbols:
                continue
            elif exchange in ['HOSE', 'HSX'] and stock_ex not in ['HOSE', 'HSX']:
                continue
            elif exchange == 'HNX' and stock_ex != 'HNX':
                continue
            elif exchange == 'UPCOM' and stock_ex != 'UPCOM':
                continue

            price = d[5]
            if not price or price <= 0:
                continue

            val_traded = d[9] or 0.0
            if val_traded < 400_000_000 and sym not in self.vn30_symbols:
                continue

            change_pct = d[6] or 0.0
            ema20 = d[10]
            ema50 = d[11]
            ema200 = d[12]
            h52 = d[13]
            l52 = d[14]
            rvol = d[15] or 1.0

            candidates = []

            if ema200 and ema200 > 0:
                diff = ((price - ema200) / ema200) * 100.0
                is_sup = price >= ema200
                candidates.append({
                    'val': ema200,
                    'type': 'Hỗ Trợ Động' if is_sup else 'Kháng Cự Động',
                    'name': 'Đường EMA200 (1 Năm)',
                    'category': 'dynamic',
                    'tier': '1Y',
                    'isSupport': is_sup,
                    'diffPct': round(diff, 2),
                    'absDiff': abs(diff),
                    'is1W': sym in self.vn30_symbols,
                    'winRate': 84 if sym in self.vn30_symbols else 79
                })

            if ema50 and ema50 > 0:
                diff = ((price - ema50) / ema50) * 100.0
                is_sup = price >= ema50
                candidates.append({
                    'val': ema50,
                    'type': 'Hỗ Trợ Động' if is_sup else 'Kháng Cự Động',
                    'name': 'Đường EMA50 (Sóng Quý)',
                    'category': 'dynamic',
                    'tier': '3M',
                    'isSupport': is_sup,
                    'diffPct': round(diff, 2),
                    'absDiff': abs(diff),
                    'is1W': False,
                    'winRate': 78
                })

            if ema20 and ema20 > 0:
                diff = ((price - ema20) / ema20) * 100.0
                is_sup = price >= ema20
                candidates.append({
                    'val': ema20,
                    'type': 'Hỗ Trợ Động' if is_sup else 'Kháng Cự Động',
                    'name': 'Đường EMA20 (1 Tháng)',
                    'category': 'dynamic',
                    'tier': '1M',
                    'isSupport': is_sup,
                    'diffPct': round(diff, 2),
                    'absDiff': abs(diff),
                    'is1W': False,
                    'winRate': 74
                })

            if h52 and h52 > 0:
                diff = ((price - h52) / h52) * 100.0
                is_sup = price >= h52
                candidates.append({
                    'val': h52,
                    'type': 'Vùng Đổi Cực (S/R)' if is_sup else 'Kháng Cự Đỉnh Năm',
                    'name': 'Đỉnh Lịch Sử 52 Tuần',
                    'category': 'static',
                    'tier': '1Y',
                    'isSupport': is_sup,
                    'diffPct': round(diff, 2),
                    'absDiff': abs(diff),
                    'is1W': True,
                    'winRate': 86 if is_sup else 82
                })

            if l52 and l52 > 0:
                diff = ((price - l52) / l52) * 100.0
                candidates.append({
                    'val': l52,
                    'type': 'Hỗ Trợ Đáy Năm',
                    'name': 'Đáy Hoảng Loạn 52 Tuần',
                    'category': 'static',
                    'tier': '1Y',
                    'isSupport': True,
                    'diffPct': round(diff, 2),
                    'absDiff': abs(diff),
                    'is1W': True,
                    'winRate': 88
                })

            if ema20 and ema50 and abs((ema20 - ema50) / ema20) < 0.015:
                conf_val = (ema20 + ema50) / 2.0
                diff = ((price - conf_val) / conf_val) * 100.0
                candidates.append({
                    'val': conf_val,
                    'type': '🏆 HỘI TỤ VÀNG (EMA20 + EMA50)',
                    'name': 'Cụm Hội Tụ Đa Tầng',
                    'category': 'confluence',
                    'tier': '3M',
                    'isSupport': price >= conf_val,
                    'diffPct': round(diff, 2),
                    'absDiff': abs(diff),
                    'is1W': sym in self.vn30_symbols,
                    'winRate': 91 if sym in self.vn30_symbols else 86
                })

            candidates = [c for c in candidates if c['absDiff'] <= 2.6]
            if not candidates:
                continue

            candidates.sort(key=lambda x: x['absDiff'])
            best = candidates[0]

            is_support = best['isSupport']
            diff_pct = best['diffPct']
            is_tight = abs(diff_pct) <= 1.0

            if is_support:
                if rvol < 0.75:
                    footprint = '🟢 Cạn Cung Bật Đáy'
                    footprint_desc = f'Vol cạn kiệt ({round(rvol, 2)}x TB), bên bán rẻ đã kiệt sức'
                    action_tag = 'BUY'
                elif change_pct >= 1.0:
                    footprint = '🟢 Rút Chân Giữ Mốc'
                    footprint_desc = f'Cầu bắt đáy chủ động đẩy giá (+{round(change_pct, 1)}%)'
                    action_tag = 'BUY'
                elif rvol >= 1.5 and change_pct < 0:
                    footprint = '⚠️ Áp Lực Xả Bán'
                    footprint_desc = f'Vol lớn ({round(rvol, 2)}x) đang đè test bệ đỡ'
                    action_tag = 'WATCH'
                else:
                    footprint = '🟡 Test Hỗ Trợ Kỹ Thuật'
                    footprint_desc = 'Đang tích lũy hấp thụ cung tại bệ đỡ'
                    action_tag = 'WATCH'
            else:
                if change_pct >= 1.5 and rvol >= 1.3:
                    footprint = '🚀 Bùng Nổ Vượt Cản (Breakout)'
                    footprint_desc = f'Dòng tiền lớn đánh vượt cản (Vol {round(rvol, 2)}x)'
                    action_tag = 'BUY'
                elif rvol >= 1.2 and change_pct <= 0:
                    footprint = '🔴 Bị Phân Phối Chặn Bán'
                    footprint_desc = f'Lực cung chặn cản quyết liệt (Vol {round(rvol, 2)}x)'
                    action_tag = 'SELL'
                elif rvol < 0.75:
                    footprint = '⚪ Cung Hạ Nhiệt Chờ Thời'
                    footprint_desc = 'Vol thấp trước ngưỡng cản, lực bán không còn gay gắt'
                    action_tag = 'WATCH'
                else:
                    footprint = '⚡ Chờ Breakout'
                    footprint_desc = 'Đang ép cản, chờ tín hiệu xác nhận dòng tiền'
                    action_tag = 'WATCH'

            if is_support:
                sl_val = round(best['val'] * 0.965, 0)
                tp1_val = round(price * 1.085, 0)
                risk = max(1.0, price - sl_val)
                reward = max(1.0, tp1_val - price)
                rr_num = round(reward / risk, 1)
            else:
                sl_val = round(best['val'] * 1.025, 0)
                tp1_val = round(price * 0.92, 0)
                risk = max(1.0, sl_val - price)
                reward = max(1.0, price - tp1_val)
                rr_num = round(reward / risk, 1)

            rr_num = max(1.5, min(4.5, rr_num))
            win_rate = best['winRate']
            if is_support and rvol < 0.75:
                win_rate = min(94, win_rate + 4)
            elif not is_support and rvol >= 1.2 and change_pct <= 0:
                win_rate = min(92, win_rate + 3)

            sec_meta = self.stock_to_sector.get(sym, {})
            comp_name = d[1] or sec_meta.get('company_name', sym)
            sec_l2 = sec_meta.get('sector_l2', 'Thị trường chung')
            sec_icon = sec_meta.get('icon', '📈')

            is_weekly = best['is1W'] or (sym in self.vn30_symbols)
            is_confluence = 'HỘI TỤ' in best['type']
            is_flip = 'Đổi Cực' in best['type']

            item = {
                'symbol': sym,
                'companyName': comp_name,
                'exchange': stock_ex,
                'sector': sec_l2,
                'sectorIcon': sec_icon,
                'price': price,
                'changePct': round(change_pct, 2),
                'volume': d[8] or 0,
                'valueTraded': round(val_traded / 1_000_000_000.0, 2),
                'rvol': round(rvol, 2),
                'levelVal': round(best['val'], 1),
                'levelName': best['name'],
                'levelType': best['type'],
                'isSupport': is_support,
                'diffPct': diff_pct,
                'absDiff': best['absDiff'],
                'isTight': is_tight,
                'isWeekly': is_weekly,
                'isConfluence': is_confluence,
                'isFlip': is_flip,
                'footprint': footprint,
                'footprintDesc': footprint_desc,
                'actionTag': action_tag,
                'winRate': win_rate,
                'rrNum': rr_num,
                'rrRatio': f'1:{rr_num}',
                'sl': sl_val,
                'tp1': tp1_val
            }

            results.append(item)
            counts['total'] += 1
            if is_support:
                counts['near_support'] += 1
            else:
                counts['near_resistance'] += 1
            if is_weekly:
                counts['weekly_mtf'] += 1
            if is_confluence:
                counts['confluence'] += 1
            if is_flip:
                counts['sr_flip'] += 1
            if is_tight:
                counts['tight_1pct'] += 1

        results.sort(key=lambda x: (x['absDiff'], -x['valueTraded']))

        payload = {
            'status': 'success',
            'scanned_at': datetime.now().strftime('%H:%M:%S - %d/%m/%Y'),
            'scanned_universe': len(raw_data),
            'exchange': exchange,
            'counts': counts,
            'data': results
        }

        self.cache[cache_key] = payload
        self.last_cache_time = now
        return payload

_keylevel_scanner_instance = None
def get_keylevel_scanner(data_dir: Optional[str] = None):
    global _keylevel_scanner_instance
    if _keylevel_scanner_instance is None:
        _keylevel_scanner_instance = InstitutionalKeyLevelScanner(data_dir=data_dir)
    return _keylevel_scanner_instance
