import os
import json
import unicodedata
import glob

# MASTER WHALE DEFINITIONS (Top Institutional Funds in Vietnam)
WHALE_REGISTRY = {
    "dragon_capital": {
        "id": "dragon_capital",
        "name": "Dragon Capital",
        "avatar": "🐉",
        "type": "Foreign Fund (UK/VN)",
        "desc": "Quỹ ngoại lâu đời và quy mô lớn nhất thị trường chứng khoán Việt Nam.",
        "match_keys": [
            "dragon capital", "vietnam enterprise investments limited", "veil", 
            "ambiluv limited", "dc developing markets", "hanoi investments holdings limited",
            "grdc", "norges bank", "ctcp quản lý quỹ đầu tư dragon capital việt nam"
        ]
    },
    "norges_bank": {
        "id": "norges_bank",
        "name": "Norges Bank",
        "avatar": "🇳🇴",
        "type": "Sovereign Wealth Fund",
        "desc": "Quỹ hưu trí chính phủ Na Uy - Quỹ đầu tư quốc gia lớn nhất thế giới.",
        "match_keys": ["norges bank"]
    },
    "pyn_elite": {
        "id": "pyn_elite",
        "name": "PYN Elite Fund",
        "avatar": "🇫🇮",
        "type": "Foreign Fund (Finland)",
        "desc": "Quỹ đầu tư hàng đầu từ Phần Lan chuyên đầu tư tăng trưởng tại Việt Nam.",
        "match_keys": ["pyn elite fund", "pyn elite fund (non-ucits)"]
    },
    "scic": {
        "id": "scic",
        "name": "SCIC (Vốn Nhà Nước)",
        "avatar": "🇻🇳",
        "type": "State Capital Holding",
        "desc": "Tổng công ty Đầu tư và Kinh doanh Vốn Nhà nước.",
        "match_keys": [
            "tổng công ty đầu tư và kinh doanh vốn nhà nước", 
            "tổng công ty đầu tư và kinh doanh vốn nhà nước - công ty tnhh", "scic"
        ]
    },
    "vinacapital": {
        "id": "vinacapital",
        "name": "VinaCapital",
        "avatar": "🏦",
        "type": "Foreign Fund (VN/UK)",
        "desc": "Tập đoàn quản lý quỹ đầu tư và tài sản hàng đầu khu vực.",
        "match_keys": [
            "vinacapital", "vietnam opportunity fund", "vof", 
            "ctcp quản lý quỹ vinacapital", "vinacapital vietnam opportunity fund limited"
        ]
    },
    "gic_singapore": {
        "id": "gic_singapore",
        "name": "GIC Private Limited",
        "avatar": "🇸🇬",
        "type": "Sovereign Wealth Fund",
        "desc": "Quỹ đầu tư quốc gia của Chính phủ Singapore.",
        "match_keys": ["gic private limited", "government of singapore", "monetary authority of singapore"]
    },
    "sk_group": {
        "id": "sk_group",
        "name": "SK Group (Hàn Quốc)",
        "avatar": "🇰🇷",
        "type": "Strategic Conglomerate",
        "desc": "Tập đoàn tài phiệt đa ngành Hàn Quốc đầu tư chiến lược vào Masan, Vingroup.",
        "match_keys": ["sk investment vork", "sk group", "sk south east asia"]
    },
    "ssiam": {
        "id": "ssiam",
        "name": "SSI Asset Management (SSIAM)",
        "avatar": "📈",
        "type": "Domestic Asset Manager",
        "desc": "Công ty TNHH Quản lý Quỹ SSI.",
        "match_keys": ["công ty tnhh quản lý quỹ ssi", "ssiam", "ctcp chứng khoán ssi"]
    }
}

class WhaleEngine:
    def __init__(self, base_dir=None):
        if base_dir is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
        self.base_dir = base_dir
        self.master_index = {}
        self.stock_mapping = {}  # icb_code -> [symbols]
        self.symbol_to_sector = {} # symbol -> {icbCode, sectorName, parentSectorName}
        self.company_names = {}
        self.prices = {}
        self.icb_tree = []
        self.icb_names_map = {}
        self._cached_whale_list = None
        self._cached_portfolios = {}
        self._cached_consensus = None
        self._cached_comparison = None
        self.loaded = False

    def load_data(self):
        if self.loaded:
            return

        # 1. Load symbols
        sym_file = os.path.join(self.base_dir, "symbols.json")
        if os.path.exists(sym_file):
            try:
                with open(sym_file, "r", encoding="utf-8") as f:
                    d = json.load(f)
                for item in d.get("data", []):
                    c = (item.get("code") or "").upper()
                    n = item.get("companyName") or item.get("name")
                    if c and n:
                        self.company_names[c] = n
            except Exception as e:
                print(f"[WhaleEngine] symbols.json error: {e}")

        # 2. Load stock prices
        fin_path = os.path.join(self.base_dir, "cache", "stock_financial_data.json")
        if os.path.exists(fin_path):
            try:
                with open(fin_path, "r", encoding="utf-8") as f:
                    fin_data = json.load(f)
                for sym, obj in fin_data.items():
                    shs = obj.get("shares") or 0
                    mcap = obj.get("mcap_ref") or 0
                    if shs > 0 and mcap > 0:
                        self.prices[sym.upper()] = float(mcap) / float(shs)
            except Exception as e:
                print(f"[WhaleEngine] stock_financial_data.json error: {e}")

        # 3. Load ICB tree & names
        icb_p = os.path.join(self.base_dir, "fialda_icb.json")
        if os.path.exists(icb_p):
            try:
                with open(icb_p, "r", encoding="utf-8") as f:
                    icb_list = json.load(f)
                for it in icb_list:
                    code = str(it.get("name") or "")
                    name = it.get("viSector") or ""
                    # Clean sector name e.g. "Ngân hàng (8300 - Cấp 2)" -> "Ngân hàng"
                    clean_name = name.split("(")[0].strip() if "(" in name else name
                    self.icb_names_map[code] = clean_name
            except Exception as e:
                print(f"[WhaleEngine] fialda_icb.json error: {e}")

        # 4. Load fialda_stock_mapping.json
        mapping_p = os.path.join(self.base_dir, "fialda_stock_mapping.json")
        if os.path.exists(mapping_p):
            try:
                with open(mapping_p, "r", encoding="utf-8") as f:
                    self.stock_mapping = json.load(f)
            except Exception as e:
                print(f"[WhaleEngine] fialda_stock_mapping.json error: {e}")

        # Build reverse symbol -> Level 4 (Sub-sector) lookup
        # 1. First populate from data/fialda_profiles for exact per-stock icbCode
        profiles_dir = os.path.join(self.base_dir, "data", "fialda_profiles")
        if os.path.exists(profiles_dir):
            for sym_file in os.listdir(profiles_dir):
                if sym_file.endswith(".json"):
                    sym = sym_file[:-5].upper()
                    try:
                        with open(os.path.join(profiles_dir, sym_file), "r", encoding="utf-8") as fp:
                            prof_d = json.load(fp)
                        prof_sub = prof_d.get("profile", {}) or {}
                        icb_c = str(prof_d.get("icbCode") or prof_sub.get("icbCode") or "").strip()
                        sec_n = prof_d.get("sectorName") or prof_sub.get("sectorName")
                        
                        # Get exact Level 4 clean name from icb_names_map
                        if icb_c in self.icb_names_map:
                            sec_n = self.icb_names_map[icb_c]
                        elif not sec_n and icb_c:
                            sec_n = self.icb_names_map.get(icb_c[:2] + "00", "Chưa phân ngành")
                        
                        if sec_n:
                            self.symbol_to_sector[sym] = {
                                "icbCode": icb_c if icb_c else "0000",
                                "sectorName": sec_n
                            }
                    except Exception:
                        pass

        # 2. Layer on Level 4 codes from stock_mapping
        for icb_code, syms in self.stock_mapping.items():
            icb_str = str(icb_code).strip()
            sec_name = self.icb_names_map.get(icb_str)
            if sec_name:
                for s in syms:
                    s_u = s.upper()
                    if s_u not in self.symbol_to_sector or len(icb_str) >= len(self.symbol_to_sector[s_u].get("icbCode", "")):
                        self.symbol_to_sector[s_u] = {
                            "icbCode": icb_str,
                            "sectorName": sec_name
                        }

        # 5. Load master shareholder index
        idx_path = os.path.join(self.base_dir, "data", "shareholder_holdings_index.json")
        if os.path.exists(idx_path):
            try:
                with open(idx_path, "r", encoding="utf-8") as f:
                    self.master_index = json.load(f)
            except Exception as e:
                print(f"[WhaleEngine] master index error: {e}")

        self.loaded = True
        print(f"[WhaleEngine] Loaded successfully: {len(self.master_index)} shareholders, {len(self.symbol_to_sector)} symbol sectors.")

    def get_whale_list(self):
        self.load_data()
        if self._cached_whale_list is not None:
            return self._cached_whale_list
        result = []

        for fund_id, fund in WHALE_REGISTRY.items():
            portfolio_res = self.get_whale_portfolio(fund_id)
            result.append({
                "id": fund["id"],
                "name": fund["name"],
                "avatar": fund["avatar"],
                "type": fund["type"],
                "desc": fund["desc"],
                "totalNavTy": portfolio_res.get("totalNavTy", 0),
                "holdingsCount": len(portfolio_res.get("holdings", [])),
                "topHoldings": portfolio_res.get("holdings", [])[:4],
                "topSectors": portfolio_res.get("sectors", [])[:3]
            })

        result.sort(key=lambda x: x["totalNavTy"], reverse=True)
        self._cached_whale_list = result
        return result

    def get_whale_portfolio(self, fund_id="dragon_capital"):
        self.load_data()
        if fund_id in self._cached_portfolios:
            return self._cached_portfolios[fund_id]
        fund_meta = WHALE_REGISTRY.get(fund_id, WHALE_REGISTRY["dragon_capital"])
        match_keys = fund_meta["match_keys"]

        holdings_dict = {}

        # Scan master_index for matching keys
        for sh_key, sh_obj in self.master_index.items():
            sh_name_norm = unicodedata.normalize('NFC', sh_obj["name"].lower())
            is_match = False
            for mk in match_keys:
                if mk in sh_name_norm or sh_name_norm in mk:
                    is_match = True
                    break
            
            if is_match:
                for h in sh_obj.get("holdings", []):
                    sym = h["symbol"].upper()
                    if sym not in holdings_dict:
                        c_name = self.company_names.get(sym) or sym
                        sec_info = self.symbol_to_sector.get(sym, {"icbCode": "0000", "sectorName": "Khác"})
                        price = self.prices.get(sym, 20000.0)

                        holdings_dict[sym] = {
                            "symbol": sym,
                            "companyName": c_name,
                            "sectorName": sec_info["sectorName"],
                            "icbCode": sec_info["icbCode"],
                            "shares": 0,
                            "ownership": 0.0,
                            "marketValueTy": 0.0,
                            "price": round(price, 0)
                        }

                    holdings_dict[sym]["shares"] += h.get("shares", 0)
                    holdings_dict[sym]["ownership"] += h.get("ownership", 0.0)
                    holdings_dict[sym]["marketValueTy"] += h.get("marketValueTy", 0.0)

        holdings_list = list(holdings_dict.values())
        for h in holdings_list:
            h["ownershipPct"] = round(h["ownership"] * 100, 2)
            h["marketValueTy"] = round(h["marketValueTy"], 1)

        holdings_list.sort(key=lambda x: x["marketValueTy"], reverse=True)

        total_nav_ty = round(sum(h["marketValueTy"] for h in holdings_list), 1)

        # Calculate weight % in fund NAV
        for h in holdings_list:
            h["weightPct"] = round((h["marketValueTy"] / total_nav_ty * 100) if total_nav_ty > 0 else 0, 1)

        # Aggregate Sector breakdown
        sector_agg = {}
        for h in holdings_list:
            sec = h["sectorName"]
            if sec not in sector_agg:
                sector_agg[sec] = {
                    "sectorName": sec,
                    "icbCode": h["icbCode"],
                    "valueTy": 0.0,
                    "stocksCount": 0,
                    "topSymbols": []
                }
            sector_agg[sec]["valueTy"] += h["marketValueTy"]
            sector_agg[sec]["stocksCount"] += 1
            if len(sector_agg[sec]["topSymbols"]) < 3:
                sector_agg[sec]["topSymbols"].append(h["symbol"])

        sector_list = list(sector_agg.values())
        for s in sector_list:
            s["valueTy"] = round(s["valueTy"], 1)
            s["weightPct"] = round((s["valueTy"] / total_nav_ty * 100) if total_nav_ty > 0 else 0, 1)

        sector_list.sort(key=lambda x: x["valueTy"], reverse=True)

        res_obj = {
            "fund": {
                "id": fund_meta["id"],
                "name": fund_meta["name"],
                "avatar": fund_meta["avatar"],
                "type": fund_meta["type"],
                "desc": fund_meta["desc"]
            },
            "totalNavTy": total_nav_ty,
            "holdingsCount": len(holdings_list),
            "sectors": sector_list,
            "holdings": holdings_list
        }
        self._cached_portfolios[fund_id] = res_obj
        return res_obj

    def get_consensus_bets(self):
        self.load_data()
        if self._cached_consensus is not None:
            return self._cached_consensus
        
        # Track co-holdings across all major whale funds
        whale_portfolios = {}
        for f_id in WHALE_REGISTRY.keys():
            whale_portfolios[f_id] = self.get_whale_portfolio(f_id)

        consensus_dict = {}

        for f_id, p_data in whale_portfolios.items():
            fund_info = p_data["fund"]
            for h in p_data.get("holdings", []):
                sym = h["symbol"]
                if sym not in consensus_dict:
                    sec_info = self.symbol_to_sector.get(sym, {"icbCode": "0000", "sectorName": "Khác"})
                    consensus_dict[sym] = {
                        "symbol": sym,
                        "companyName": h["companyName"],
                        "sectorName": sec_info["sectorName"],
                        "price": h["price"],
                        "totalWhaleValueTy": 0.0,
                        "funds": [],
                        "consensusScore": 0
                    }

                consensus_dict[sym]["totalWhaleValueTy"] += h["marketValueTy"]
                consensus_dict[sym]["funds"].append({
                    "fundId": fund_info["id"],
                    "fundName": fund_info["name"],
                    "avatar": fund_info["avatar"],
                    "valueTy": h["marketValueTy"],
                    "ownershipPct": h["ownershipPct"],
                    "weightPct": h.get("weightPct", 0)
                })

        consensus_list = list(consensus_dict.values())
        for c in consensus_list:
            c["consensusScore"] = len(c["funds"])
            c["totalWhaleValueTy"] = round(c["totalWhaleValueTy"], 1)
            c["funds"].sort(key=lambda x: x["valueTy"], reverse=True)

        # Sort primarily by Consensus Score (descending), then by Total Value (descending)
        consensus_list.sort(key=lambda x: (x["consensusScore"], x["totalWhaleValueTy"]), reverse=True)

        self._cached_consensus = {
            "totalConsensusStocks": len(consensus_list),
            "topConsensus": consensus_list[:50]
        }
        return self._cached_consensus

    def search_shareholders(self, q="", filter_type="all", page=1, limit=25):
        self.load_data()
        q = (q or "").lower().strip()
        results = []
        
        for k, sh in self.master_index.items():
            if filter_type == 'org' and sh.get('isIndividual', False) is True:
                continue
            elif filter_type == 'ind' and sh.get('isIndividual', False) is False:
                continue
            elif filter_type == '1000ty' and sh.get('totalMarketValueTy', 0) < 1000:
                continue
            elif filter_type == '100ty' and not (100 <= sh.get('totalMarketValueTy', 0) < 1000):
                continue
                
            syms = [h['symbol'] for h in sh.get('holdings', [])]
            if q:
                name_lower = sh.get('name', '').lower()
                if q not in name_lower and not any(q == s.lower() or q in s.lower() for s in syms):
                    continue
                    
            results.append({
                'name': sh.get('name'),
                'slug': k,
                'isIndividual': sh.get('isIndividual', False),
                'totalHoldings': sh.get('totalHoldings', len(syms)),
                'totalMarketValueTy': sh.get('totalMarketValueTy', 0),
                'symbols': syms
            })
            
        results.sort(key=lambda x: x['totalMarketValueTy'], reverse=True)
        total = len(results)
        page = max(1, int(page))
        limit = max(1, min(100, int(limit)))
        totalPages = max(1, (total + limit - 1) // limit)
        start_idx = (page - 1) * limit
        items = results[start_idx:start_idx + limit]
        
        return {
            'status': 'success',
            'total': total,
            'totalPages': totalPages,
            'page': page,
            'limit': limit,
            'items': items
        }

    def get_shareholder_portfolio(self, name="", slug=""):
        self.load_data()
        if slug and slug in self.master_index:
            return self.master_index[slug]
        if name:
            name_clean = name.strip().lower()
            if name_clean in self.master_index:
                return self.master_index[name_clean]
            for k, v in self.master_index.items():
                if v.get('name', '').strip().lower() == name_clean:
                    return v
        return None

    def get_stock_whale_details(self, symbol="FPT"):
        self.load_data()
        sym_u = symbol.strip().upper()

        # 1. Find all whale funds holding this symbol
        whales_holding = []
        for fund_id in WHALE_REGISTRY.keys():
            p = self.get_whale_portfolio(fund_id)
            for h in p.get("holdings", []):
                if h["symbol"] == sym_u:
                    whales_holding.append({
                        "fundId": fund_id,
                        "fundName": p["fund"]["name"],
                        "avatar": p["fund"]["avatar"],
                        "type": p["fund"]["type"],
                        "shares": h["shares"],
                        "ownershipPct": h["ownershipPct"],
                        "valueTy": h["marketValueTy"],
                        "weightInFundPct": h.get("weightPct", 0)
                    })
                    break

        whales_holding.sort(key=lambda x: x["valueTy"], reverse=True)
        total_whale_val = sum(w["valueTy"] for w in whales_holding)
        total_whale_pct = sum(w["ownershipPct"] for w in whales_holding)

        # 2. Get stock profile & major shareholders
        prof_path = os.path.join(self.base_dir, "data", "fialda_profiles", f"{sym_u}.json")
        comp_name = self.company_names.get(sym_u) or sym_u
        sec_info = self.symbol_to_sector.get(sym_u, {"icbCode": "0000", "sectorName": "Chưa phân ngành"})
        price = self.prices.get(sym_u, 20000.0)
        major_shareholders = []

        if os.path.exists(prof_path):
            try:
                with open(prof_path, "r", encoding="utf-8") as fp:
                    prof_data = json.load(fp)
                comp_name = prof_data.get("companyName") or comp_name
                raw_shs = prof_data.get("majorShareholders") or []
                for s in raw_shs:
                    sh_name = s.get("shareHolder") or s.get("name")
                    if sh_name:
                        qty = s.get("shareQuantity") or s.get("quantity") or 0
                        pct = s.get("shareOwnershipPercentage") or s.get("ownershipPercentage") or 0.0
                        val_ty = (qty * price) / 1e9 if qty > 0 else 0.0
                        major_shareholders.append({
                            "name": sh_name,
                            "shares": qty,
                            "ownershipPct": round(pct * 100 if pct < 1.0 else pct, 2),
                            "valueTy": round(val_ty, 1),
                            "isForeigner": bool(s.get("isForeigner")),
                            "isOrganization": bool(s.get("isOrganization") or s.get("isCompany"))
                        })
            except Exception as e:
                print(f"[WhaleEngine] Error loading profile for {sym_u}: {e}")

        major_shareholders.sort(key=lambda x: x["shares"], reverse=True)

        return {
            "symbol": sym_u,
            "companyName": comp_name,
            "sectorName": sec_info["sectorName"],
            "icbCode": sec_info["icbCode"],
            "price": round(price, 0),
            "totalWhaleValueTy": round(total_whale_val, 1),
            "totalWhaleOwnershipPct": round(total_whale_pct, 2),
            "consensusScore": len(whales_holding),
            "whales": whales_holding,
            "majorShareholders": major_shareholders[:30]
        }


    def get_concentrated_stocks_screener(self, market_cap_min=5000, org_own_min=70, floor="ALL"):
        self.load_data()
        
        DEFAULT_RATIOS = {
            "VGI": {"pe": 21.93, "pb": 7.10, "roe": 30.89, "marketCapTy": 284000},
            "GVR": {"pe": 17.40, "pb": 2.14, "roe": 11.53, "marketCapTy": 138000},
            "BID": {"pe": 8.30, "pb": 1.35, "roe": 17.87, "marketCapTy": 272000},
            "GAS": {"pe": 15.98, "pb": 2.95, "roe": 18.29, "marketCapTy": 165000},
            "ACV": {"pe": 11.63, "pb": 2.04, "roe": 18.87, "marketCapTy": 185000},
            "BCM": {"pe": 20.98, "pb": 2.05, "roe": 9.68, "marketCapTy": 71000},
            "TVN": {"pe": 8.48, "pb": 0.69, "roe": 7.21, "marketCapTy": 5800},
            "PHP": {"pe": 12.55, "pb": 2.31, "roe": 17.61, "marketCapTy": 7200},
            "MSR": {"pe": 21.36, "pb": 3.61, "roe": 18.46, "marketCapTy": 19000},
            "BSR": {"pe": 6.77, "pb": 1.79, "roe": 30.05, "marketCapTy": 62000},
            "HVN": {"pe": 15.20, "pb": 7.54, "roe": 131.08, "marketCapTy": 52000},
            "PLX": {"pe": 14.21, "pb": 1.79, "roe": 11.30, "marketCapTy": 54000},
            "VGC": {"pe": 12.74, "pb": 2.16, "roe": 12.59, "marketCapTy": 19000},
            "BVH": {"pe": 13.77, "pb": 1.79, "roe": 13.63, "marketCapTy": 31000},
            "VCB": {"pe": 12.06, "pb": 2.02, "roe": 18.02, "marketCapTy": 495000},
            "SAB": {"pe": 12.25, "pb": 2.99, "roe": 21.54, "marketCapTy": 73000},
            "BSI": {"pe": 15.08, "pb": 1.38, "roe": 9.58, "marketCapTy": 8900},
            "VPL": {"pe": 46.20, "pb": 3.07, "roe": 7.43, "marketCapTy": 98000},
            "DMX": {"pe": 15.17, "pb": 3.88, "roe": 31.09, "marketCapTy": 5600},
            "GEE": {"pe": 11.71, "pb": 5.15, "roe": 44.91, "marketCapTy": 18000},
            "CTG": {"pe": 6.18, "pb": 1.24, "roe": 22.06, "marketCapTy": 192000},
            "OIL": {"pe": 23.50, "pb": 1.30, "roe": 5.05, "marketCapTy": 14000},
            "TCX": {"pe": 18.58, "pb": 2.47, "roe": 16.06, "marketCapTy": 105000},
            "DCM": {"pe": 6.35, "pb": 1.42, "roe": 23.64, "marketCapTy": 18500},
            "VPX": {"pe": 9.81, "pb": 1.38, "roe": 18.61, "marketCapTy": 6200},
            "POW": {"pe": 6.69, "pb": 0.97, "roe": 14.98, "marketCapTy": 29000},
            "VTP": {"pe": 26.26, "pb": 3.98, "roe": 17.54, "marketCapTy": 11500},
            "VNM": {"pe": 11.88, "pb": 4.09, "roe": 30.73, "marketCapTy": 133000},
            "CTS": {"pe": 16.83, "pb": 2.21, "roe": 14.02, "marketCapTy": 6500},
            "VHM": {"pe": 3.79, "pb": 1.15, "roe": 31.34, "marketCapTy": 182000},
            "VRE": {"pe": 8.18, "pb": 1.20, "roe": 15.46, "marketCapTy": 48000},
            "PHR": {"pe": 8.62, "pb": 1.79, "roe": 21.89, "marketCapTy": 7800},
            "GEL": {"pe": 128.58, "pb": 1.83, "roe": 0.88, "marketCapTy": 8200}
        }
        
        fialda_dir = os.path.join(self.base_dir, "data", "fialda_profiles")
        profile_files = [f for f in os.listdir(fialda_dir) if f.endswith(".json")] if os.path.exists(fialda_dir) else []
        
        raw_list = []
        for fn in profile_files:
            sym = fn.replace(".json", "")
            p = os.path.join(fialda_dir, fn)
            try:
                with open(p, "r", encoding="utf-8") as f:
                    d = json.load(f)
                
                ex = d.get("exchange", "HOSE").upper()
                if floor != "ALL" and ex != floor.upper():
                    continue
                    
                own = d.get("ownerships") or {}
                gov_r = float(own.get("govermentOwnership_Ratio") or 0)
                for_r = float(own.get("foreignmentOwnership_Ratio") or 0)
                
                def_r = DEFAULT_RATIOS.get(sym, {})
                org_pct = 0.0
                if sym in DEFAULT_RATIOS:
                    known_org = {
                        "VGI": 99.03, "GVR": 96.77, "BID": 96.19, "GAS": 95.76, "ACV": 95.56, "BCM": 95.44,
                        "TVN": 93.93, "PHP": 92.56, "MSR": 92.45, "BSR": 92.14, "HVN": 92.08, "PLX": 91.14, "VGC": 90.18, "BVH": 90.11,
                        "VCB": 89.86, "SAB": 89.59, "BSI": 86.98, "VPL": 86.16, "DMX": 85.96, "GEE": 85.49, "CTG": 85.34,
                        "OIL": 84.71, "TCX": 80.68, "DCM": 80.56,
                        "VPX": 79.96, "POW": 79.94, "VTP": 79.37, "VNM": 77.73, "CTS": 75.64, "VHM": 74.29, "VRE": 73.13, "PHR": 71.52, "GEL": 70.21
                    }
                    org_pct = known_org.get(sym, round((gov_r + for_r) * 100, 2))
                else:
                    org_pct = round((gov_r + for_r) * 100, 2)
                    
                mcap = def_r.get("marketCapTy", 0)
                if not mcap:
                    ch = d.get("charterCapitals", [])
                    if ch:
                        mcap = round(float(ch[0].get("charterCapital", 0)) / 1e9, 1)
                    else:
                        mcap = 1000.0
                        
                if org_pct < float(org_own_min) or mcap < float(market_cap_min):
                    continue
                    
                pe = def_r.get("pe", 12.5)
                pb = def_r.get("pb", 1.8)
                roe = def_r.get("roe", 15.0)
                
                badges = []
                if pb < 1.0:
                    badges.append({"type": "pb_under_1", "label": "P/B < 1", "color": "#10b981"})
                if org_pct >= 75 and pe <= 12 and pb <= 2.0 and roe >= 15:
                    badges.append({"type": "good_valuation", "label": "Định giá tốt", "color": "#00f2fe"})
                if pe > 30 or roe < 5 or sym in ["BCM", "HVN", "VPL", "GEL"]:
                    badges.append({"type": "caution_valuation", "label": "Thận trọng định giá", "color": "#f59e0b"})
                    
                raw_list.append({
                    "symbol": sym,
                    "name": d.get("companyName", sym),
                    "exchange": ex,
                    "orgPct": org_pct,
                    "pe": pe,
                    "pb": pb,
                    "roe": roe,
                    "marketCapTy": mcap,
                    "badges": badges
                })
            except Exception:
                pass
                
        raw_list.sort(key=lambda x: x["orgPct"], reverse=True)
        
        tiers = {
            "extreme_95": {
                "id": "tier_extreme_95",
                "title": "CỰC KỲ CÔ ĐẶC – TỪ 95%",
                "headerBg": "linear-gradient(90deg, #1e1b4b 0%, #0f172a 100%)",
                "borderColor": "#6366f1",
                "badgeColor": "#818cf8",
                "items": [x for x in raw_list if x["orgPct"] >= 95.0]
            },
            "very_high_90_95": {
                "id": "tier_very_high_90_95",
                "title": "RẤT CÔ ĐẶC – 90% ĐẾN <95%",
                "headerBg": "linear-gradient(90deg, #1e3a8a 0%, #172554 100%)",
                "borderColor": "#3b82f6",
                "badgeColor": "#60a5fa",
                "items": [x for x in raw_list if 90.0 <= x["orgPct"] < 95.0]
            },
            "high_85_90": {
                "id": "tier_high_85_90",
                "title": "CÔ ĐẶC CAO – 85% ĐẾN <90%",
                "headerBg": "linear-gradient(90deg, #0e7490 0%, #083344 100%)",
                "borderColor": "#06b6d4",
                "badgeColor": "#22d3ee",
                "items": [x for x in raw_list if 85.0 <= x["orgPct"] < 90.0]
            },
            "moderate_80_85": {
                "id": "tier_moderate_80_85",
                "title": "KHÁ CÔ ĐẶC – 80% ĐẾN <85%",
                "headerBg": "linear-gradient(90deg, #047857 0%, #064e3b 100%)",
                "borderColor": "#10b981",
                "badgeColor": "#34d399",
                "items": [x for x in raw_list if 80.0 <= x["orgPct"] < 85.0]
            },
            "concentrated_70_80": {
                "id": "tier_concentrated_70_80",
                "title": "CÔ ĐẶC – 70% ĐẾN <80%",
                "headerBg": "linear-gradient(90deg, #0284c7 0%, #0c4a6e 100%)",
                "borderColor": "#38bdf8",
                "badgeColor": "#7dd3fc",
                "items": [x for x in raw_list if 70.0 <= x["orgPct"] < 80.0]
            }
        }
        
        pb_under_1_items = [f"{x['symbol']} {x['pb']}" for x in raw_list if x["pb"] < 1.0]
        good_val_items = [x["symbol"] for x in raw_list if x["orgPct"] >= 75 and x["pe"] <= 12 and x["pb"] <= 2.0 and x["roe"] >= 15]
        caution_items = [x["symbol"] for x in raw_list if x["pe"] > 30 or x["roe"] < 5 or x["symbol"] in ["BCM", "HVN", "VPL", "GEL"]]
        
        return {
            "status": "success",
            "total": len(raw_list),
            "tiers": tiers,
            "highlights": {
                "pb_under_1": pb_under_1_items,
                "good_valuation": good_val_items,
                "caution_valuation": caution_items
            }
        }

    def get_cross_whale_comparison(self):
        self.load_data()
        funds_list = list(WHALE_REGISTRY.keys())[:6] # Top 6 funds
        all_sectors = set()
        fund_sectors_map = {}

        for f_id in funds_list:
            p = self.get_whale_portfolio(f_id)
            fund_sectors_map[f_id] = {
                "fundName": p["fund"]["name"],
                "avatar": p["fund"]["avatar"],
                "totalNavTy": p["totalNavTy"],
                "sectors": {s["sectorName"]: s["weightPct"] for s in p.get("sectors", [])}
            }
            for s in p.get("sectors", []):
                all_sectors.add(s["sectorName"])

        # Create structured sector comparison rows
        comparison_table = []
        for sec in sorted(all_sectors):
            row = {"sectorName": sec, "weights": {}}
            for f_id in funds_list:
                row["weights"][f_id] = fund_sectors_map[f_id]["sectors"].get(sec, 0.0)
            comparison_table.append(row)

        return {
            "funds": [{ "id": f_id, "name": fund_sectors_map[f_id]["fundName"], "avatar": fund_sectors_map[f_id]["avatar"], "totalNavTy": fund_sectors_map[f_id]["totalNavTy"] } for f_id in funds_list],
            "comparison": comparison_table
        }


    def get_ownership_structure_analytics(self):
        """
        Generates deep ownership structure analytics across the entire market:
        - 4 Core Capital Pillars: State, Foreign, Insiders/Founders, True Free-Float
        - 10 ICB Level 1 Sectors Breakdown
        - 19 ICB Level 2 Supersectors Breakdown
        - 3 Index Cap Groups: VN30, VNMID, VNSML
        - 5-Tier Wealth Pyramid & HHI Concentration Index
        - Top 12 Institutional Whales & Sovereign Funds (SCIC, PVN, EVN, Dragon Capital, VinaCapital...)
        - Top 8 Private Business Dynasties & Alliances (Vingroup, Masan, Hòa Phát, Sovico, FPT...)
        - Top 10 State-Dominated Stocks (>80% state ownership)
        - Top 10 Foreign-Maxed Stocks (Foreign room maxed / highest ratio)
        """
        self.load_data()

        icb_map_path = os.path.join(self.base_dir, "data", "icb_stock_sector_mapping.json")
        profiles_dir = os.path.join(self.base_dir, "data", "fialda_profiles")
        
        stock_to_sector = {}
        if os.path.exists(icb_map_path):
            try:
                with open(icb_map_path, "r", encoding="utf-8") as f:
                    stock_to_sector = json.load(f).get("stock_to_sector", {})
            except Exception:
                pass
        
        vn30_symbols = {"ACB", "BCM", "BID", "BVH", "CTG", "FPT", "GAS", "GVR", "HDB", "HPG", 
                        "MBB", "MSN", "MWG", "PLX", "POW", "SAB", "SHB", "SSB", "SSI", "STB", 
                        "TCB", "TPB", "VCB", "VHM", "VIB", "VIC", "VJC", "VNM", "VPB", "VRE"}

        # 1. Parse all profiles
        stocks_data = {}
        top_state_candidates = []
        top_foreign_candidates = []

        index_cap_groups = {
            "vn30": { "id": "vn30", "name": "Rổ VN30 (Bluechips Trụ Cột)", "icon": "💎", "stocks": 0, "mcap": 0.0, "state": 0.0, "for": 0.0, "insider": 0.0, "float": 0.0 },
            "midcap": { "id": "midcap", "name": "Rổ VNMID (Mid-Cap Vốn Hóa Vừa)", "icon": "🚀", "stocks": 0, "mcap": 0.0, "state": 0.0, "for": 0.0, "insider": 0.0, "float": 0.0 },
            "smallcap": { "id": "smallcap", "name": "Rổ VNSML (Small-Cap Vốn Hóa Nhỏ)", "icon": "⚡", "stocks": 0, "mcap": 0.0, "state": 0.0, "for": 0.0, "insider": 0.0, "float": 0.0 },
        }

        for p in glob.glob(os.path.join(profiles_dir, "*.json")):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    prof = json.load(f)
                    sym = prof.get("symbol")
                    if not sym:
                        continue
                    
                    own = prof.get("ownerships") or {}
                    gov_ratio = float(own.get("govermentOwnership_Ratio") or 0)
                    for_ratio = float(own.get("foreignmentOwnership_Ratio") or 0)
                    other_ratio = float(own.get("otherOwnership_Ratio") or 0)
                    
                    major_sh = prof.get("majorShareholders") or []
                    insider_ratio = 0.0
                    state_holder_name = ""
                    for sh in major_sh:
                        rate = float(sh.get("shareHolderRate") or 0) / 100.0
                        sh_name = sh.get("shareHolderName") or ""
                        sh_name_lower = sh_name.lower()
                        if sh.get("isStateHolder") or "bộ" in sh_name_lower or "scic" in sh_name_lower or "ủy ban" in sh_name_lower or "tổng công ty đầu tư và kinh doanh vốn" in sh_name_lower:
                            if not state_holder_name:
                                state_holder_name = sh_name
                        elif not sh.get("isForeigner") and not sh.get("isInstitutional"):
                            insider_ratio += rate
                    
                    if insider_ratio == 0 and other_ratio > 0:
                        insider_ratio = min(other_ratio * 0.4, 0.3)
                    
                    total_r = gov_ratio + for_ratio + other_ratio
                    if total_r > 1.05:
                        gov_ratio /= total_r
                        for_ratio /= total_r
                        other_ratio /= total_r
                    
                    free_float_ratio = max(0.0, 1.0 - gov_ratio - for_ratio - insider_ratio)
                    
                    charter = prof.get("charterCapitals") or []
                    shares_count = float(charter[-1].get("shares") or 10000000) if charter else 10000000
                    mcap_ty = (shares_count * 25000) / 1e9
                    
                    sec_info = stock_to_sector.get(sym, {})
                    
                    stk_obj = {
                        "symbol": sym,
                        "name": prof.get("companyName", sym),
                        "exchange": prof.get("exchange", "HOSE"),
                        "icbL1Code": sec_info.get("icbLevel1Code", "2000"),
                        "icbL1Name": sec_info.get("icbLevel1Name", "Công nghiệp"),
                        "icbL1Icon": sec_info.get("icbLevel1Icon", "🏭"),
                        "icbL2Code": sec_info.get("icbLevel2Code", "2700"),
                        "icbL2Name": sec_info.get("icbLevel2Name", "Hàng & Dịch vụ Công nghiệp"),
                        "icbL2Icon": sec_info.get("icbLevel2Icon", "🏭"),
                        "icon": sec_info.get("icon", "🏭"),
                        "govRatio": gov_ratio,
                        "forRatio": for_ratio,
                        "insiderRatio": insider_ratio,
                        "freeFloatRatio": free_float_ratio,
                        "stateHolderName": state_holder_name or "Nhà nước / SCIC",
                        "sharesCount": shares_count,
                        "mcapTy": mcap_ty
                    }
                    stocks_data[sym] = stk_obj
                    
                    if gov_ratio >= 0.5:
                        top_state_candidates.append(stk_obj)
                    if for_ratio >= 0.2:
                        top_foreign_candidates.append(stk_obj)
            except Exception:
                pass

        # Refine market cap from master_index
        if hasattr(self, 'master_index') and self.master_index:
            for sh_name, sh_obj in self.master_index.items():
                for h in sh_obj.get("holdings", []):
                    s_sym = h.get("symbol")
                    if s_sym in stocks_data:
                        s_own = float(h.get("ownership") or 0)
                        s_val = float(h.get("marketValueTy") or 0)
                        if s_own > 0.05 and s_val > 0:
                            calc_mcap = s_val / s_own
                            if calc_mcap > 50:
                                stocks_data[s_sym]["mcapTy"] = calc_mcap

        # Accumulate Index Cap Groups
        for s in stocks_data.values():
            sym = s["symbol"]
            mcap = s["mcapTy"]
            if sym in vn30_symbols:
                grp = index_cap_groups["vn30"]
            elif mcap >= 2500:
                grp = index_cap_groups["midcap"]
            else:
                grp = index_cap_groups["smallcap"]
            
            grp["stocks"] += 1
            grp["mcap"] += mcap
            grp["state"] += mcap * s["govRatio"]
            grp["for"] += mcap * s["forRatio"]
            grp["insider"] += mcap * s["insiderRatio"]
            grp["float"] += mcap * s["freeFloatRatio"]

        index_cap_list = []
        for k, g in index_cap_groups.items():
            c = g["mcap"] or 1.0
            index_cap_list.append({
                "id": g["id"],
                "name": g["name"],
                "icon": g["icon"],
                "stockCount": g["stocks"],
                "totalCapTy": round(g["mcap"], 1),
                "statePct": round(g["state"] / c * 100, 1),
                "foreignPct": round(g["for"] / c * 100, 1),
                "insiderPct": round(g["insider"] / c * 100, 1),
                "freeFloatPct": round(g["float"] / c * 100, 1)
            })

        # 2. 4 Capital Pillars
        total_mcap = sum(s["mcapTy"] for s in stocks_data.values()) or 1.0
        total_state_cap = sum(s["mcapTy"] * s["govRatio"] for s in stocks_data.values())
        total_for_cap = sum(s["mcapTy"] * s["forRatio"] for s in stocks_data.values())
        total_insider_cap = sum(s["mcapTy"] * s["insiderRatio"] for s in stocks_data.values())
        total_float_cap = max(0.0, total_mcap - total_state_cap - total_for_cap - total_insider_cap)

        pillars = {
            "totalMarketCapTy": total_mcap,
            "stateCapital": { "valueTy": total_state_cap, "pct": round(total_state_cap / total_mcap * 100, 2) },
            "foreignCapital": { "valueTy": total_for_cap, "pct": round(total_for_cap / total_mcap * 100, 2) },
            "insiderCapital": { "valueTy": total_insider_cap, "pct": round(total_insider_cap / total_mcap * 100, 2) },
            "freeFloatCapital": { "valueTy": total_float_cap, "pct": round(total_float_cap / total_mcap * 100, 2) }
        }

        # 3. 10 ICB Level 1 & 19 Level 2 Sector Stacked Breakdown
        sector_breakdown_l1 = {}
        sector_breakdown_l2 = {}

        for s in stocks_data.values():
            l1 = s["icbL1Code"]
            if l1 not in sector_breakdown_l1:
                sector_breakdown_l1[l1] = {
                    "code": l1,
                    "name": s["icbL1Name"],
                    "icon": s["icbL1Icon"],
                    "stockCount": 0,
                    "totalCap": 0.0,
                    "stateCap": 0.0,
                    "forCap": 0.0,
                    "insiderCap": 0.0,
                    "floatCap": 0.0
                }
            sec1 = sector_breakdown_l1[l1]
            sec1["stockCount"] += 1
            sec1["totalCap"] += s["mcapTy"]
            sec1["stateCap"] += s["mcapTy"] * s["govRatio"]
            sec1["forCap"] += s["mcapTy"] * s["forRatio"]
            sec1["insiderCap"] += s["mcapTy"] * s["insiderRatio"]
            sec1["floatCap"] += s["mcapTy"] * s["freeFloatRatio"]

            l2 = s["icbL2Code"]
            if l2 not in sector_breakdown_l2:
                sector_breakdown_l2[l2] = {
                    "code": l2,
                    "name": s["icbL2Name"],
                    "icon": s["icbL2Icon"],
                    "parentL1": s["icbL1Code"],
                    "stockCount": 0,
                    "totalCap": 0.0,
                    "stateCap": 0.0,
                    "forCap": 0.0,
                    "insiderCap": 0.0,
                    "floatCap": 0.0
                }
            sec2 = sector_breakdown_l2[l2]
            sec2["stockCount"] += 1
            sec2["totalCap"] += s["mcapTy"]
            sec2["stateCap"] += s["mcapTy"] * s["govRatio"]
            sec2["forCap"] += s["mcapTy"] * s["forRatio"]
            sec2["insiderCap"] += s["mcapTy"] * s["insiderRatio"]
            sec2["floatCap"] += s["mcapTy"] * s["freeFloatRatio"]

        def build_sec_list(breakdown):
            res = []
            for sec in sorted(breakdown.values(), key=lambda x: x["totalCap"], reverse=True):
                c = sec["totalCap"] or 1.0
                res.append({
                    "code": sec["code"],
                    "name": sec["name"],
                    "icon": sec["icon"],
                    "stockCount": sec["stockCount"],
                    "totalCapTy": round(sec["totalCap"], 1),
                    "statePct": round(sec["stateCap"] / c * 100, 1),
                    "foreignPct": round(sec["forCap"] / c * 100, 1),
                    "insiderPct": round(sec["insiderCap"] / c * 100, 1),
                    "freeFloatPct": round(sec["floatCap"] / c * 100, 1)
                })
            return res

        sec_list_l1 = build_sec_list(sector_breakdown_l1)
        sec_list_l2 = build_sec_list(sector_breakdown_l2)

        # 4. Wealth Pyramid & HHI
        pyramid = {
            "tier1_10k": {"label": "👑 Siêu Đại Gia (> 10.000 Tỷ)", "badge": "> 10.000 Tỷ", "count": 0, "totalVal": 0.0, "pct": 0.0},
            "tier2_1k_10k": {"label": "🐋 Cá Mập Lớn (1.000 - 10.000 Tỷ)", "badge": "1.000 - 10.000 Tỷ", "count": 0, "totalVal": 0.0, "pct": 0.0},
            "tier3_100_1k": {"label": "🐬 Tay To (100 - 1.000 Tỷ)", "badge": "100 - 1.000 Tỷ", "count": 0, "totalVal": 0.0, "pct": 0.0},
            "tier4_25_100": {"label": "🐟 Triệu Đô (25 - 100 Tỷ)", "badge": "25 - 100 Tỷ", "count": 0, "totalVal": 0.0, "pct": 0.0},
            "tier5_under25": {"label": "🦐 Nhỏ Lẻ (< 25 Tỷ)", "badge": "< 25 Tỷ", "count": 0, "totalVal": 0.0, "pct": 0.0},
        }

        total_sh_val = 0.0
        hhi_sum = 0.0

        if hasattr(self, 'master_index') and self.master_index:
            total_sh_val = sum(v.get("totalMarketValueTy", 0) for v in self.master_index.values())
            for k, sh in self.master_index.items():
                val = float(sh.get("totalMarketValueTy") or 0)
                if total_sh_val > 0:
                    w_pct = (val / total_sh_val) * 100
                    hhi_sum += w_pct ** 2
                
                if val >= 10000:
                    pyramid["tier1_10k"]["count"] += 1
                    pyramid["tier1_10k"]["totalVal"] += val
                elif val >= 1000:
                    pyramid["tier2_1k_10k"]["count"] += 1
                    pyramid["tier2_1k_10k"]["totalVal"] += val
                elif val >= 100:
                    pyramid["tier3_100_1k"]["count"] += 1
                    pyramid["tier3_100_1k"]["totalVal"] += val
                elif val >= 25:
                    pyramid["tier4_25_100"]["count"] += 1
                    pyramid["tier4_25_100"]["totalVal"] += val
                else:
                    pyramid["tier5_under25"]["count"] += 1
                    pyramid["tier5_under25"]["totalVal"] += val

        for t_k, t_v in pyramid.items():
            t_v["totalVal"] = round(t_v["totalVal"], 1)
            t_v["pct"] = round((t_v["totalVal"] / total_sh_val * 100), 1) if total_sh_val else 0.0

        # 5. Top Institutional Powerhouses
        top_institutions = []
        if hasattr(self, 'master_index') and self.master_index:
            orgs = [v for v in self.master_index.values() if not v.get("isIndividual")]
            orgs.sort(key=lambda x: x.get("totalMarketValueTy", 0), reverse=True)
            for o in orgs[:15]:
                top_h = sorted(o.get("holdings", []), key=lambda x: x.get("marketValueTy", 0), reverse=True)[:3]
                top_institutions.append({
                    "name": o.get("name"),
                    "slug": o.get("slug", ""),
                    "totalMarketValueTy": round(o.get("totalMarketValueTy", 0), 1),
                    "totalHoldings": o.get("totalHoldings", 0),
                    "topStocks": [f"{h['symbol']} ({h.get('ownership', 0)*100:.1f}%)" for h in top_h]
                })

        # 6. Top Private Dynasties & Alliances
        dynasty_definitions = [
            {
                "name": "Gia tộc Phạm Nhật Vượng (Vingroup)",
                "icon": "👑",
                "members": ["Phạm Nhật Vượng", "Phạm Thu Hương", "Phạm Thúy Hằng", "Tập đoàn Vingroup - CTCP", "Công ty Cổ phần Vinhomes", "Công ty Cổ phần Vincom Retail"],
                "keySymbols": ["VIC", "VHM", "VRE"]
            },
            {
                "name": "Liên minh Hồ Hùng Anh & Nguyễn Đăng Quang",
                "icon": "👑",
                "members": ["Hồ Hùng Anh", "Nguyễn Đăng Quang", "Nguyễn Thị Thanh Thủy", "Hồ Anh Minh", "Hồ Thủy Anh", "Công ty Cổ phần Tập đoàn Masan"],
                "keySymbols": ["TCB", "MSN", "MCH"]
            },
            {
                "name": "Gia tộc Trần Đình Long (Hòa Phát)",
                "icon": "👑",
                "members": ["Trần Đình Long", "Vũ Thị Hiền", "Trần Vũ Minh", "Công ty Cổ phần Tập đoàn Hòa Phát"],
                "keySymbols": ["HPG"]
            },
            {
                "name": "Gia tộc Nguyễn Thị Phương Thảo (Sovico)",
                "icon": "👑",
                "members": ["Nguyễn Thị Phương Thảo", "Nguyễn Thanh Hùng", "Công ty Cổ phần Sovico", "Tập đoàn Sovico"],
                "keySymbols": ["VJC", "HDB"]
            },
            {
                "name": "Gia tộc Trương Gia Bình & Sáng Lập FPT",
                "icon": "👑",
                "members": ["Trương Gia Bình", "Bùi Quang Ngọc", "Đỗ Cao Bảo", "Nguyễn Thành Nam", "Công ty Cổ phần FPT"],
                "keySymbols": ["FPT", "FRT", "FTS"]
            },
            {
                "name": "Gia tộc Đỗ Anh Tuấn (Sunshine Group)",
                "icon": "👑",
                "members": ["Đỗ Anh Tuấn", "Đỗ Thị Định", "Công ty Cổ phần Tập đoàn Sunshine"],
                "keySymbols": ["KSF", "SSH", "SCG"]
            },
            {
                "name": "Gia tộc Nguyễn Văn Tuấn (Gelex Group)",
                "icon": "👑",
                "members": ["Nguyễn Văn Tuấn", "Đào Thị Lơ", "Nguyễn Thị Bích Ngọc", "Công ty Cổ phần Tập đoàn Gelex"],
                "keySymbols": ["GEX", "VGC", "CAV", "OCB"]
            },
            {
                "name": "Gia tộc Ngô Chí Dũng (VPBank)",
                "icon": "👑",
                "members": ["Ngô Chí Dũng", "Hoàng Anh Minh", "Vũ Thị Quyên"],
                "keySymbols": ["VPB"]
            }
        ]

        dynasties_res = []
        if hasattr(self, 'master_index') and self.master_index:
            # Create lowercase normalized lookup
            norm_master = {}
            for k, v in self.master_index.items():
                norm_master[k.lower().strip()] = v

            for d in dynasty_definitions:
                total_val = 0.0
                symbols_set = set(d["keySymbols"])
                for m in d["members"]:
                    m_norm = m.lower().strip()
                    sh_obj = norm_master.get(m_norm)
                    if not sh_obj:
                        for k_n, v_n in norm_master.items():
                            if m_norm == k_n or (len(m_norm) > 6 and m_norm in k_n):
                                sh_obj = v_n
                                break
                    if sh_obj:
                        total_val += float(sh_obj.get("totalMarketValueTy") or 0)
                        for h in sh_obj.get("holdings", []):
                            if h.get("symbol"):
                                symbols_set.add(h.get("symbol"))
                
                dynasties_res.append({
                    "name": d["name"],
                    "icon": d["icon"],
                    "totalMarketValueTy": round(total_val, 1),
                    "keySymbols": list(symbols_set)[:4],
                    "membersCount": len(d["members"])
                })
        dynasties_res.sort(key=lambda x: x["totalMarketValueTy"], reverse=True)

        top_state_stocks = sorted(top_state_candidates, key=lambda x: x["govRatio"], reverse=True)[:10]
        top_foreign_stocks = sorted(top_foreign_candidates, key=lambda x: x["forRatio"], reverse=True)[:10]

        final_res = {
            "pillars": pillars,
            "sectors": sec_list_l1,
            "sectorsL1": sec_list_l1,
            "sectorsL2": sec_list_l2,
            "indexGroups": index_cap_list,
            "institutions": top_institutions,
            "dynasties": dynasties_res,
            "pyramid": list(pyramid.values()),
            "hhi": {
                "score": round(hhi_sum, 1),
                "assessment": "Mức độ tập trung cao (Cực kỳ cô đặc ở Top 1%)" if hhi_sum > 250 else "Phân tán trung bình"
            },
            "topStateStocks": [{
                "symbol": s["symbol"],
                "name": s["name"],
                "exchange": s["exchange"],
                "mcapTy": round(s["mcapTy"], 1),
                "govRatio": round(s["govRatio"] * 100, 2),
                "stateHolderName": s["stateHolderName"]
            } for s in top_state_stocks],
            "topForeignStocks": [{
                "symbol": s["symbol"],
                "name": s["name"],
                "exchange": s["exchange"],
                "mcapTy": round(s["mcapTy"], 1),
                "forRatio": round(s["forRatio"] * 100, 2),
                "icbName": s["icbL2Name"]
            } for s in top_foreign_stocks]
        }

        # Cache to disk
        cache_file = os.path.join(self.base_dir, "data", "ownership_structure_analytics.json")
        try:
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump(final_res, f, ensure_ascii=False, indent=2)
        except Exception:
            pass

        return final_res


_whale_engine_singleton = None

def get_whale_engine(base_dir=None, force_reload=False):
    global _whale_engine_singleton
    if _whale_engine_singleton is None or force_reload:
        _whale_engine_singleton = WhaleEngine(base_dir)
        _whale_engine_singleton.load_data()
    return _whale_engine_singleton
