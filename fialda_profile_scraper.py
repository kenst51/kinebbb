import os
import json
import time
import requests
import concurrent.futures
from datetime import datetime

class FialdaProfileScraper:
    """
    Scraper chuyên biệt thu thập 100% dữ liệu Hồ Sơ Doanh Nghiệp, Cổ Đông, GDNB, Cổ Tức, Tin Tức & Sự Kiện
    từ Fialda Web Terminal (fwtapi1.fialda.com / fwtapi2.fialda.com).
    """

    BASE_URLS = [
        "https://fwtapi1.fialda.com",
        "https://fwtapi2.fialda.com"
    ]

    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Origin": "https://fwt.fialda.com",
        "Referer": "https://fwt.fialda.com/",
        "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7"
    }

    def __init__(self, data_dir: str = None):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        if data_dir is None:
            self.data_dir = os.path.join(base_dir, "data", "fialda_profiles")
        else:
            self.data_dir = data_dir
        os.makedirs(self.data_dir, exist_ok=True)

        # 1. Load symbols map
        self.symbols_map = {}
        for fname in ["symbols.json", os.path.join("static", "symbols.json"), "fialda_initial.json"]:
            fpath = os.path.join(base_dir, fname)
            if os.path.exists(fpath):
                try:
                    with open(fpath, "r", encoding="utf-8") as f:
                        d = json.load(f)
                    if fname == "fialda_initial.json":
                        for s in d.get("result", {}).get("symbols", []):
                            k = (s.get("symbol") or s.get("s") or "").upper()
                            if k and k not in self.symbols_map:
                                self.symbols_map[k] = s.get("full_name") or s.get("description")
                    else:
                        for item in d.get("data", []):
                            k = (item.get("code") or item.get("symbol") or "").upper()
                            if k:
                                self.symbols_map[k] = item.get("companyName")
                except Exception:
                    pass

        # 2. Load floor map
        self.floor_map = {}
        fl_path = os.path.join(base_dir, "floor_map.json")
        if os.path.exists(fl_path):
            try:
                with open(fl_path, "r", encoding="utf-8") as f:
                    self.floor_map = json.load(f)
            except Exception:
                pass

        # 3. Load ICB map
        self.icb_map = {}
        icb_path = os.path.join(base_dir, "fialda_icb.json")
        if os.path.exists(icb_path):
            try:
                with open(icb_path, "r", encoding="utf-8") as f:
                    for item in json.load(f):
                        c = str(item.get("name", ""))
                        sec = item.get("viSector", "").split("(")[0].strip()
                        self.icb_map[c] = sec
            except Exception:
                pass

    def _fetch_endpoint(self, endpoint: str, params: dict = None) -> dict:
        """Gửi request tới Fialda API với cơ chế failover giữa fwtapi1 và fwtapi2"""
        for base in self.BASE_URLS:
            url = f"{base}/{endpoint.lstrip('/')}"
            try:
                res = requests.get(url, params=params, headers=self.HEADERS, timeout=8)
                if res.status_code == 200:
                    data = res.json()
                    if data.get("success", False) or "result" in data:
                        return data.get("result", {})
            except Exception:
                pass
        return {}

    def fetch_news_detail(self, news_id: int) -> dict:
        """Lấy chi tiết bài viết kèm sourceLink (link trang báo gốc) từ Fialda"""
        res = self._fetch_endpoint("api/services/app/News/GetNewsDetail", {"id": news_id})
        return res if isinstance(res, dict) else {}

    def fetch_full_profile(self, symbol: str, use_cache: bool = True, max_cache_age_hours: int = 24) -> dict:
        symbol = symbol.strip().upper()
        cache_file = os.path.join(self.data_dir, f"{symbol}.json")

        if use_cache and os.path.exists(cache_file):
            try:
                mtime = os.path.getmtime(cache_file)
                if (time.time() - mtime) < (max_cache_age_hours * 3600):
                    with open(cache_file, "r", encoding="utf-8") as f:
                        cached_data = json.load(f)
                    if cached_data.get("status") == "success" and cached_data.get("profile"):
                        # Ensure companyName is valid
                        if not cached_data.get("companyName") or cached_data.get("companyName") == symbol:
                            cached_data["companyName"] = self.symbols_map.get(symbol, symbol)
                            if "profile" in cached_data:
                                cached_data["profile"]["companyName"] = cached_data["companyName"]
                        return cached_data
            except Exception:
                pass

        # 17 endpoints trích xuất 100% dữ liệu Fialda FWT
        endpoints = {
            "profile": ("api/services/app/StockInfo/GetCompanyProfile", {"symbol": symbol}),
            "charterCapitals": ("api/services/app/StockInfo/GetCharterCapitals", {"symbol": symbol}),
            "leaderships": ("api/services/app/StockInfo/GetCompanyLeaderships", {"symbol": symbol}),
            "subCompanies": ("api/services/app/StockInfo/GetSubCompanies", {"symbol": symbol}),
            "majorShareholders": ("api/services/app/StockInfo/GetMajorShareHolders", {"symbol": symbol}),
            "ownerships": ("api/services/app/StockInfo/GetCompanyOwnerships", {"symbol": symbol}),
            "majorShareHolderDeals": ("api/services/app/StockInfo/GetMajorShareHolderDeals", {"symbol": symbol}),
            "insiderDeals": ("api/services/app/Event/GetAll", {"typeId": 2, "symbol": symbol, "pageNumber": 1, "pageSize": 100, "sortColumn": "recordDate", "isDesc": "true"}),
            "relatedPersonDeals": ("api/services/app/Event/GetAll", {"typeId": 3, "symbol": symbol, "pageNumber": 1, "pageSize": 100, "sortColumn": "recordDate", "isDesc": "true"}),
            "majorHolderDealsEvents": ("api/services/app/Event/GetAll", {"typeId": 1, "symbol": symbol, "pageNumber": 1, "pageSize": 100, "sortColumn": "recordDate", "isDesc": "true"}),
            "cashDividends": ("api/services/app/Event/GetAll", {"typeId": 13, "symbol": symbol, "pageNumber": 1, "pageSize": 100, "sortColumn": "recordDate", "isDesc": "true"}),
            "stockDividends": ("api/services/app/Event/GetAll", {"typeId": 15, "symbol": symbol, "pageNumber": 1, "pageSize": 100, "sortColumn": "recordDate", "isDesc": "true"}),
            "agmEvents": ("api/services/app/Event/GetAll", {"typeId": 10, "symbol": symbol, "pageNumber": 1, "pageSize": 100, "sortColumn": "recordDate", "isDesc": "true"}),
            "treasuryEvents": ("api/services/app/Event/GetAll", {"typeId": 17, "symbol": symbol, "pageNumber": 1, "pageSize": 100, "sortColumn": "recordDate", "isDesc": "true"}),
            "bonusEvents": ("api/services/app/Stock/GetBonusEvents", {"symbol": symbol}),
            "briefEvents": ("api/services/app/Event/GetBriefEvents", {"symbol": symbol, "pageNumber": 1, "pageSize": 100}),
            "upcomingEvents": ("api/services/app/Event/GetUpcomingEvents", {"symbol": symbol}),
            "news": ("api/services/app/News/GetNews_BySymbolAndCategory", {"symbol": symbol, "pageNumber": 1, "pageSize": 100})
        }

        results = {}
        with concurrent.futures.ThreadPoolExecutor(max_workers=14) as executor:
            future_to_key = {
                executor.submit(self._fetch_endpoint, ep, params): key
                for key, (ep, params) in endpoints.items()
            }
            for future in concurrent.futures.as_completed(future_to_key):
                key = future_to_key[future]
                try:
                    res = future.result()
                    if isinstance(res, dict) and "items" in res:
                        results[key] = res.get("items", [])
                    elif isinstance(res, list):
                        results[key] = res
                    elif isinstance(res, dict):
                        results[key] = res
                    else:
                        results[key] = []
                except Exception:
                    results[key] = [] if key != "profile" and key != "ownerships" else {}

        # Note: news articles details and direct sourceLink are loaded on-demand when clicked
        news_list = results.get("news", [])

        full_name = self.symbols_map.get(symbol, symbol)
        exchange = self.floor_map.get(symbol) or results.get("profile", {}).get("initialExchange") or "HOSE"
        icb = str(results.get("profile", {}).get("icbCode") or "")
        sec_name = self.icb_map.get(icb)
        if not sec_name and len(icb) == 4:
            sec_name = self.icb_map.get(icb[:2] + "00")
        if not sec_name:
            sec_name = "Chưa phân ngành"

        prof = results.get("profile", {})
        if isinstance(prof, dict):
            prof["companyName"] = full_name
            prof["exchange"] = exchange
            prof["initialExchange"] = exchange
            prof["icbCode"] = icb
            prof["sectorName"] = sec_name

        full_payload = {
            "symbol": symbol,
            "companyName": full_name,
            "exchange": exchange,
            "icbCode": icb,
            "sectorName": sec_name,
            "status": "success",
            "source": "Fialda Web Terminal (FWT)",
            "updated_at": datetime.now().isoformat(),
            "profile": prof,
            "charterCapitals": results.get("charterCapitals", []),
            "leaderships": results.get("leaderships", []),
            "subCompanies": results.get("subCompanies", []),
            "majorShareholders": results.get("majorShareholders", []),
            "ownerships": results.get("ownerships", {}),
            "majorShareHolderDeals": results.get("majorShareHolderDeals", []),
            "insiderDeals": results.get("insiderDeals", []),
            "relatedPersonDeals": results.get("relatedPersonDeals", []),
            "majorHolderDealsEvents": results.get("majorHolderDealsEvents", []),
            "cashDividends": results.get("cashDividends", []),
            "stockDividends": results.get("stockDividends", []),
            "agmEvents": results.get("agmEvents", []),
            "treasuryEvents": results.get("treasuryEvents", []),
            "bonusEvents": results.get("bonusEvents", []),
            "briefEvents": results.get("briefEvents", []),
            "upcomingEvents": results.get("upcomingEvents", []),
            "news": news_list,
            "is_partial": False
        }

        try:
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump(full_payload, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error caching Fialda profile for {symbol}: {e}")

        return full_payload

    def fetch_core_profile(self, symbol: str, use_cache: bool = True, max_cache_age_hours: int = 24) -> dict:
        """
        Giai đoạn 1: Chỉ lấy 4 endpoints cơ bản cần thiết cho Tab 1 (Tổng quan) và Header.
        Trả về kết quả trong ~0.3s để giao diện có thể hiển thị tức thì cho người dùng.
        """
        symbol = symbol.strip().upper()
        cache_file = os.path.join(self.data_dir, f"{symbol}.json")

        # 1. Nếu đã có cache đầy đủ hợp lệ, trả về luôn (tức thì 0.05s)
        if use_cache and os.path.exists(cache_file):
            try:
                mtime = os.path.getmtime(cache_file)
                if (time.time() - mtime) < (max_cache_age_hours * 3600):
                    with open(cache_file, "r", encoding="utf-8") as f:
                        cached_data = json.load(f)
                    if cached_data.get("status") == "success" and cached_data.get("profile"):
                        cached_data["is_partial"] = False
                        return cached_data
            except Exception:
                pass

        # 2. Nếu chưa có cache, chỉ cào 4 endpoints cốt lõi cho Tab 1
        core_endpoints = {
            "profile": ("api/services/app/StockInfo/GetCompanyProfile", {"symbol": symbol}),
            "charterCapitals": ("api/services/app/StockInfo/GetCharterCapitals", {"symbol": symbol}),
            "leaderships": ("api/services/app/StockInfo/GetCompanyLeaderships", {"symbol": symbol}),
            "subCompanies": ("api/services/app/StockInfo/GetSubCompanies", {"symbol": symbol})
        }

        results = {}
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            future_to_key = {
                executor.submit(self._fetch_endpoint, ep, params): key
                for key, (ep, params) in core_endpoints.items()
            }
            for future in concurrent.futures.as_completed(future_to_key):
                key = future_to_key[future]
                try:
                    res = future.result()
                    if isinstance(res, dict) and "items" in res:
                        results[key] = res.get("items", [])
                    elif isinstance(res, list):
                        results[key] = res
                    elif isinstance(res, dict):
                        results[key] = res
                    else:
                        results[key] = []
                except Exception:
                    results[key] = [] if key != "profile" else {}

        full_name = self.symbols_map.get(symbol, symbol)
        exchange = self.floor_map.get(symbol) or results.get("profile", {}).get("initialExchange") or "HOSE"
        icb = str(results.get("profile", {}).get("icbCode") or "")
        sec_name = self.icb_map.get(icb)
        if not sec_name and len(icb) == 4:
            sec_name = self.icb_map.get(icb[:2] + "00")
        if not sec_name:
            sec_name = "Chưa phân ngành"

        prof = results.get("profile", {})
        if isinstance(prof, dict):
            prof["companyName"] = full_name
            prof["exchange"] = exchange
            prof["initialExchange"] = exchange
            prof["icbCode"] = icb
            prof["sectorName"] = sec_name

        return {
            "symbol": symbol,
            "companyName": full_name,
            "exchange": exchange,
            "icbCode": icb,
            "sectorName": sec_name,
            "status": "success",
            "is_partial": True,
            "source": "Fialda Web Terminal (Core Fast)",
            "updated_at": datetime.now().isoformat(),
            "profile": prof,
            "charterCapitals": results.get("charterCapitals", []),
            "leaderships": results.get("leaderships", []),
            "subCompanies": results.get("subCompanies", []),
            "majorShareholders": [],
            "ownerships": {},
            "majorShareHolderDeals": [],
            "insiderDeals": [],
            "relatedPersonDeals": [],
            "majorHolderDealsEvents": [],
            "cashDividends": [],
            "stockDividends": [],
            "agmEvents": [],
            "treasuryEvents": [],
            "bonusEvents": [],
            "briefEvents": [],
            "upcomingEvents": [],
            "news": []
        }

    def get_or_fetch(self, symbol: str, force_refresh: bool = False, stage: str = "full") -> dict:
        if stage == "core":
            return self.fetch_core_profile(symbol, use_cache=not force_refresh)
        return self.fetch_full_profile(symbol, use_cache=not force_refresh)

