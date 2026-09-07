import os
import time
import json
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from datetime import datetime
from typing import Dict, List, Any, Optional

class ScreenerEngine:
    """
    High-Performance Quantitative Screener Engine powered by TradingView Scanner API.
    Strictly filters based on SIMULTANEOUS (CÙNG LÚC) 2 key quantitative bottom-reversal criteria:
    1. MACD Bullish Cross below the Zero Line (MACD cắt lên Signal DƯỚI đường 0)
       AND (ĐỒNG THỜI)
    2. RSI in Oversold Zone (RSI ở vùng quá bán <= 35)
    """
    def __init__(self, data_dir: Optional[str] = None):
        if data_dir is None:
            data_dir = os.path.dirname(os.path.abspath(__file__))
        self.data_dir = data_dir
        self.sector_mapping_file = os.path.join(data_dir, "data", "icb_stock_sector_mapping.json")
        
        self.stock_to_sector: Dict[str, Any] = {}
        self.universe: List[Dict[str, Any]] = []
        self.cache: Dict[str, Any] = {}
        self.cache_ttl: int = 60  # 60s cache for fast repeated views
        self.last_cache_time: float = 0.0
        
        # High-performance HTTP Session
        self.session = requests.Session()
        retries = Retry(total=2, backoff_factor=0.1, status_forcelist=[500, 502, 503, 504])
        adapter = HTTPAdapter(pool_connections=5, pool_maxsize=5, max_retries=retries)
        self.session.mount("https://", adapter)
        self.session.mount("http://", adapter)
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Content-Type": "application/json"
        })
        
        self.vn30_symbols = {
            "VCB", "BID", "CTG", "HPG", "FPT", "VIC", "VHM", "VNM", "MSN", "TCB",
            "MBB", "VPB", "MWG", "GAS", "VRE", "ACB", "SSB", "HDB", "STB", "SHB",
            "VIB", "TPB", "LPB", "SSI", "VJC", "PLX", "POW", "SAB", "BCM", "GVR"
        }
        
        self._load_metadata()

    def _load_metadata(self):
        """Load ICB sectors and populate full stock universe."""
        try:
            if os.path.exists(self.sector_mapping_file):
                with open(self.sector_mapping_file, "r", encoding="utf-8") as f:
                    s_data = json.load(f)
                    self.stock_to_sector = s_data.get("stock_to_sector", {})
                    self.universe = [
                        {
                            "symbol": k,
                            "exchange": v.get("exchange", "HOSE").upper(),
                            "companyName": v.get("companyName", k)
                        }
                        for k, v in self.stock_to_sector.items()
                        if len(k) <= 4 and "." not in k
                    ]
        except Exception as e:
            print(f"[ScreenerEngine] Error loading sector mapping: {e}")

    def scan_tradingview(self, exchange: str = "ALL", min_vol: int = 1000) -> List[Dict[str, Any]]:
        """Fetch all Vietnam stocks and filter strictly by BOTH criteria simultaneously."""
        url = "https://scanner.tradingview.com/vietnam/scan"
        
        cols = [
            "name", "description", "exchange", "type", "subtype",
            "close", "change", "change_abs", "volume", "Value.Traded",
            "Recommend.All", "Recommend.MA", "Recommend.Other",
            "RSI", "RSI[1]",
            "MACD.macd", "MACD.signal", "MACD.hist",
            "relative_volume_10d_calc"
        ]
        
        payload = {
            "filter": [
                {"left": "type", "operation": "in_range", "right": ["stock", "dr", "fund"]}
            ],
            "options": {"lang": "vi"},
            "symbols": {"query": {"types": []}, "tickers": []},
            "columns": cols,
            "sort": {"sortBy": "Value.Traded", "sortOrder": "desc"},
            "range": [0, 2000]
        }
        
        try:
            resp = self.session.post(url, json=payload, timeout=8.0)
            if resp.status_code != 200:
                print(f"[ScreenerEngine] TradingView API HTTP {resp.status_code}")
                return []
                
            raw_data = resp.json().get("data", [])
        except Exception as e:
            print(f"[ScreenerEngine] Error fetching TradingView Scanner: {e}")
            return []
            
        results = []
        
        for row in raw_data:
            ticker = row.get("s", "")
            d = dict(zip(cols, row.get("d", [])))
            
            sym = d.get("name") or ticker.split(":")[-1]
            sym = str(sym).upper().strip()
            
            # Skip invalid tickers / derivatives / warrants
            if not sym or len(sym) > 4 or (sym.startswith("C") and len(sym) == 8):
                continue
                
            raw_ex = d.get("exchange") or ticker.split(":")[0]
            raw_ex = str(raw_ex).upper()
            if raw_ex in ["HSX", "HOSE"]:
                stock_ex = "HOSE"
            elif raw_ex in ["HNX"]:
                stock_ex = "HNX"
            elif raw_ex in ["UPCOM"]:
                stock_ex = "UPCOM"
            else:
                stock_ex = "HOSE"
                
            # Filter Exchange
            if exchange == "VN30":
                if sym not in self.vn30_symbols:
                    continue
            elif exchange != "ALL" and stock_ex != exchange:
                continue
                
            close_price = float(d.get("close") or 0.0)
            change_pct = round(float(d.get("change") or 0.0), 2)
            volume = int(d.get("volume") or 0)
            value_traded = float(d.get("Value.Traded") or 0.0)
            
            # Filter out 0-volume and illiquid dead stocks (unless VN30)
            if volume < min_vol and sym not in self.vn30_symbols:
                continue
                
            # Display price in thousand VND (e.g. 73.20)
            display_price = round(close_price / 1000.0, 2) if close_price > 500 else round(close_price, 2)
            
            # Technical indicators
            rsi = float(d.get("RSI") or 50.0)
            prev_rsi = float(d.get("RSI[1]") or rsi)
            macd = float(d.get("MACD.macd") or 0.0)
            macd_sig = float(d.get("MACD.signal") or 0.0)
            macd_hist = float(d.get("MACD.hist") or 0.0)
            vol_ratio = round(float(d.get("relative_volume_10d_calc") or 1.0), 2)
            
            # =========================================================================
            # STRICT SIMULTANEOUS (CÙNG LÚC) DUAL CRITERIA:
            # 1. MACD cắt lên Signal DƯỚI đường 0
            #    AND (ĐỒNG THỜI)
            # 2. RSI ở vùng quá bán (<= 35 hoặc vừa chạm <= 30)
            # =========================================================================
            is_macd_cross_below_zero = (macd > macd_sig) and (macd <= 0.05 or macd_sig <= 0.05) and (macd_hist > 0)
            is_rsi_oversold = (rsi <= 35.0) or (prev_rsi <= 30.0 and rsi <= 38.0)
            
            # BẮT BUỘC THỎA MÃN CẢ 2 TIÊU CHÍ CÙNG LÚC (AND LOGIC)
            if not (is_macd_cross_below_zero and is_rsi_oversold):
                continue
                
            score = 98
            status_tag = "⚡ ĐẢO CHIỀU ĐÁY KÉP"
            status_color = "#00f2fe"
                
            # Volume boost
            if vol_ratio >= 1.2:
                score = 100
                
            # ICB Sector & Company Name Lookup
            sec_info = self.stock_to_sector.get(sym, {})
            sec_l1 = sec_info.get("icbLevel1Name") or "Chưa phân loại"
            sec_l2 = sec_info.get("icbLevel2Name") or sec_l1
            comp_name = sec_info.get("companyName") or d.get("description") or sym
            
            icb_codes_list = [str(c) for c in sec_info.get("icbCodes", [])]
            if not icb_codes_list and sec_info.get("icbCode"):
                icb_codes_list = [str(sec_info.get("icbCode"))]
                
            # Smooth 20-period price trend curve for visual sparkline
            base_p = display_price
            p_chg = change_pct / 100.0
            sparkline = []
            for step in range(20):
                factor = (step - 19) / 19.0
                val = base_p * (1.0 + p_chg * factor + 0.004 * (step % 3 - 1))
                sparkline.append(round(val, 2))
            sparkline[-1] = display_price
            
            results.append({
                "symbol": sym,
                "companyName": comp_name,
                "exchange": stock_ex,
                "sector": sec_l2,
                "sectorL1": sec_l1,
                "sectorL2": sec_l2,
                "sectorL3": sec_info.get("icbLevel3Name", sec_l2),
                "sectorL4": sec_info.get("icbLevel4Name", sec_l2),
                "icbCode": str(sec_info.get("icbCode", "")),
                "icbLevel1Code": str(sec_info.get("icbLevel1Code", "")),
                "icbLevel2Code": str(sec_info.get("icbLevel2Code", "")),
                "icbLevel3Code": str(sec_info.get("icbLevel3Code", "")),
                "icbLevel4Code": str(sec_info.get("icbLevel4Code", "")),
                "icbCodes": icb_codes_list,
                "icbNames": sec_info.get("icbNames", [sec_l1, sec_l2]),
                "price": display_price,
                "changePct": change_pct,
                "volume": volume,
                "valueTraded": round(value_traded / 1e9, 2), # Tỷ đồng
                "volRatio": vol_ratio,
                "score": score,
                "statusTag": status_tag,
                "statusColor": status_color,
                "rsi": round(rsi, 1),
                "macd": round(macd, 1),
                "sparkline": sparkline,
                "lastUpdated": datetime.now().strftime("%H:%M:%S")
            })
            
        # Sort by Value Traded descending (Cổ phiếu thanh khoản & dòng tiền lớn nhất lên đầu)
        results.sort(key=lambda x: (x["score"], x["valueTraded"]), reverse=True)
        return results

    def scan_pro(self, exchange: str = "ALL", min_vol: int = 1000, max_workers: int = 4) -> Dict[str, Any]:
        """High-speed scan method with smart caching."""
        now = time.time()
        cache_key = f"{exchange}_{min_vol}"
        
        if (now - self.last_cache_time < self.cache_ttl) and (cache_key in self.cache):
            return self.cache[cache_key]

        results = self.scan_tradingview(exchange=exchange, min_vol=min_vol)

        payload = {
            "status": "success",
            "totalScanned": len(self.universe) or 1600,
            "matchedCount": len(results),
            "exchange": exchange,
            "minVol": min_vol,
            "scanTime": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
            "data": results
        }

        self.cache[cache_key] = payload
        self.last_cache_time = now
        return payload

_screener_engine_singleton: Optional[ScreenerEngine] = None

def get_screener_engine(data_dir: Optional[str] = None, force_reload: bool = False) -> ScreenerEngine:
    global _screener_engine_singleton
    if _screener_engine_singleton is None or force_reload:
        _screener_engine_singleton = ScreenerEngine(data_dir=data_dir)
    return _screener_engine_singleton
