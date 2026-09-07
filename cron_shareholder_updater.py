import os
import sys
import json
import time
import re
import unicodedata
from datetime import datetime
import threading

def get_hash(name):
    norm = unicodedata.normalize('NFC', name.strip().lower())
    h = 5381
    for char in norm:
        h = (((h << 5) + h) + ord(char)) & 0xFFFFFFFF
    return f"{h:08x}"

def py_slug(name):
    if not name: return 'unknown'
    norm = unicodedata.normalize('NFC', name.strip().lower())
    s = norm
    s = s.replace('à','a').replace('á','a').replace('ạ','a').replace('ả','a').replace('ã','a')
    s = s.replace('â','a').replace('ầ','a').replace('ấ','a').replace('ậ','a').replace('ẩ','a').replace('ẫ','a')
    s = s.replace('ă','a').replace('ằ','a').replace('ắ','a').replace('ặ','a').replace('ẳ','a').replace('ẵ','a')
    s = s.replace('è','e').replace('é','e').replace('ẹ','e').replace('ẻ','e').replace('ẽ','e')
    s = s.replace('ê','e').replace('ề','e').replace('ế','e').replace('ệ','e').replace('ể','e').replace('ễ','e')
    s = s.replace('ì','i').replace('í','i').replace('ị','i').replace('ỉ','i').replace('ĩ','i')
    s = s.replace('ò','o').replace('ó','o').replace('ọ','o').replace('ỏ','o').replace('õ','o')
    s = s.replace('ô','o').replace('ồ','o').replace('ố','o').replace('ộ','o').replace('ổ','o').replace('ỗ','o')
    s = s.replace('ơ','o').replace('ờ','o').replace('ớ','o').replace('ợ','o').replace('ở','o').replace('ỡ','o')
    s = s.replace('ù','u').replace('ú','u').replace('ụ','u').replace('ủ','u').replace('ũ','u')
    s = s.replace('ư','u').replace('ừ','u').replace('ứ','u').replace('ự','u').replace('ử','u').replace('ữ','u')
    s = s.replace('ỳ','y').replace('ý','y').replace('ỵ','y').replace('ỷ','y').replace('ỹ','y')
    s = s.replace('đ','d')
    clean = re.sub(r'[^a-z0-9_]+', '_', s).strip('_')[:40]
    return f"{clean}_{get_hash(name)}"

def build_and_update_shareholders(base_dir=None):
    if base_dir is None:
        base_dir = os.path.dirname(os.path.abspath(__file__))
    
    profiles_dir = os.path.join(base_dir, "data", "fialda_profiles")
    master_index_path = os.path.join(base_dir, "data", "shareholder_holdings_index.json")
    summary_output_path = os.path.join(base_dir, "static", "shareholder_summary.json")
    static_sh_dir = os.path.join(base_dir, "static", "shareholder_data")
    os.makedirs(static_sh_dir, exist_ok=True)

    if not os.path.exists(profiles_dir):
        return {"status": "error", "message": f"Profiles directory not found: {profiles_dir}"}

    # 1. Load FULL Company Names from symbols.json
    company_names = {}
    sym_file = os.path.join(base_dir, "symbols.json")
    if os.path.exists(sym_file):
        try:
            with open(sym_file, "r", encoding="utf-8") as f:
                d = json.load(f)
            for item in d.get("data", []):
                c = item.get("code") or item.get("symbol")
                n = item.get("companyName") or item.get("name")
                if c and n:
                    company_names[c.upper()] = n
        except Exception as e:
            print(f"[Shareholder Updater] Warning loading symbols.json: {e}")

    # 2. Load REAL stock prices from cache/stock_financial_data.json
    prices = {}
    fin_path = os.path.join(base_dir, "cache", "stock_financial_data.json")
    if os.path.exists(fin_path):
        try:
            with open(fin_path, "r", encoding="utf-8") as f:
                fin_data = json.load(f)
            for sym, obj in fin_data.items():
                shs = obj.get("shares") or 0
                mcap = obj.get("mcap_ref") or 0
                if shs > 0 and mcap > 0:
                    prices[sym.upper()] = float(mcap) / float(shs)
        except Exception as e:
            print(f"[Shareholder Updater] Warning loading fin prices: {e}")

    # Fallback to thongke_giaodich if any
    tk_path = os.path.join(base_dir, "thongke_giaodich.json")
    if os.path.exists(tk_path):
        try:
            with open(tk_path, "r", encoding="utf-8") as f:
                tk_data = json.load(f)
            if isinstance(tk_data, dict):
                for sym, obj in tk_data.items():
                    p = obj.get("close") or obj.get("matchPrice")
                    if sym and p and p > 0 and sym.upper() not in prices:
                        prices[sym.upper()] = float(p) * (1000 if p < 1000 else 1)
        except Exception as e:
            print(f"[Shareholder Updater] Warning loading thongke prices: {e}")

    print(f"[Shareholder Updater] Loaded real prices for {len(prices)} stocks, names for {len(company_names)} stocks.")

    # 3. Scan all profiles with symbol-level de-duplication
    profile_files = [f for f in os.listdir(profiles_dir) if f.endswith(".json")]
    shareholders = {}

    for fname in profile_files:
        symbol = fname.replace(".json", "").upper()
        fpath = os.path.join(profiles_dir, fname)
        try:
            with open(fpath, "r", encoding="utf-8") as pf:
                data = json.load(pf)
                profile = data.get("profile", {})
                
                # Get best company name
                c_name = company_names.get(symbol) or data.get("companyName") or profile.get("companyName") or profile.get("shortName") or symbol
                exchange = profile.get("initialExchange") or data.get("exchange") or "HOSE"
                majors = data.get("majorShareholders", [])

                price = prices.get(symbol, 20000.0)

                for m in majors:
                    sh_name = (m.get("name") or "").strip()
                    if not sh_name or len(sh_name) < 2:
                        continue
                    
                    key = unicodedata.normalize('NFC', sh_name.lower())
                    shares = float(m.get("shares") or m.get("quantity") or 0)
                    ownership = float(m.get("ownership") or m.get("ratio") or m.get("percentage") or 0)
                    if ownership > 1:
                        ownership = ownership / 100.0
                    
                    up_date = m.get("updatedDate") or m.get("publicDate") or ""
                    market_val_ty = round((shares * price) / 1e9, 1)

                    if key not in shareholders:
                        shareholders[key] = {
                            "name": sh_name,
                            "isIndividual": m.get("isIndividual", False),
                            "holdings_map": {},
                            "totalShares": 0,
                            "totalMarketValueTy": 0,
                            "totalHoldings": 0
                        }

                    # De-duplicate by symbol: keep latest disclosure
                    curr_map = shareholders[key]["holdings_map"]
                    if symbol not in curr_map or up_date > curr_map[symbol]["updatedDate"]:
                        curr_map[symbol] = {
                            "symbol": symbol,
                            "companyName": c_name,
                            "exchange": exchange,
                            "shares": shares,
                            "ownership": ownership,
                            "marketValueTy": market_val_ty,
                            "updatedDate": up_date
                        }
        except Exception:
            continue

    # 4. Sort holdings and calculate weights
    count_files = 0
    individuals = []
    organizations = []

    for key, sh in shareholders.items():
        holdings_list = list(sh["holdings_map"].values())
        holdings_list.sort(key=lambda h: h["marketValueTy"], reverse=True)
        
        tot_val = round(sum(h["marketValueTy"] for h in holdings_list), 1)
        tot_shares = sum(h["shares"] for h in holdings_list)

        for h in holdings_list:
            if tot_val > 0:
                h["weight"] = round((h["marketValueTy"] / tot_val) * 100, 1)
            else:
                h["weight"] = round(100.0 / len(holdings_list), 1)

        payload = {
            "name": sh["name"],
            "isIndividual": sh["isIndividual"],
            "holdings": holdings_list,
            "totalShares": tot_shares,
            "totalMarketValueTy": tot_val,
            "totalHoldings": len(holdings_list)
        }

        # Write static shard file
        slug = py_slug(sh["name"])
        target_path = os.path.join(static_sh_dir, f"{slug}.json")
        with open(target_path, "w", encoding="utf-8") as out:
            json.dump(payload, out, ensure_ascii=False)
        count_files += 1

        top_sym = holdings_list[0]["symbol"] if holdings_list else ""
        top_sym_val = holdings_list[0]["marketValueTy"] if holdings_list else 0
        top_sym_weight = holdings_list[0].get("weight", 0) if holdings_list else 0

        summary_item = {
            "name": sh["name"],
            "slug": slug,
            "isIndividual": sh["isIndividual"],
            "totalHoldings": len(holdings_list),
            "totalMarketValueTy": tot_val,
            "totalShares": tot_shares,
            "topSymbol": top_sym,
            "topSymbolVal": top_sym_val,
            "topSymbolWeight": top_sym_weight,
            "symbols": [h["symbol"] for h in holdings_list]
        }

        if sh["isIndividual"]:
            individuals.append(summary_item)
        else:
            organizations.append(summary_item)

        # Replace map with list in master index
        shareholders[key] = payload

    # Sort rankings
    individuals.sort(key=lambda x: x["totalMarketValueTy"], reverse=True)
    organizations.sort(key=lambda x: x["totalMarketValueTy"], reverse=True)

    # 5. Write master index
    with open(master_index_path, "w", encoding="utf-8") as mf:
        json.dump(shareholders, mf, ensure_ascii=False)

    # 6. Write fast summary
    tot_mkt_val = round(sum(i["totalMarketValueTy"] for i in individuals) + sum(o["totalMarketValueTy"] for o in organizations), 1)
    summary_data = {
        "stats": {
            "totalShareholders": len(shareholders),
            "totalIndividuals": len(individuals),
            "totalOrganizations": len(organizations),
            "totalMarketValueTy": tot_mkt_val,
            "totalHoldingsRelations": sum(len(sh["holdings"]) for sh in shareholders.values())
        },
        "topIndividuals": individuals[:100],
        "topOrganizations": organizations[:100],
        "allRankedTop500": (individuals[:250] + organizations[:250])
    }
    summary_data["allRankedTop500"].sort(key=lambda x: x["totalMarketValueTy"], reverse=True)

    with open(summary_output_path, "w", encoding="utf-8") as out:
        json.dump(summary_data, out, ensure_ascii=False)

    res = {
        "status": "success",
        "total_shareholders": len(shareholders),
        "total_files_generated": count_files,
        "scanned_profiles": len(profile_files),
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    print(f"[Shareholder Updater] Complete: {res}")
    return res

# 7. Background Weekly Scheduler (Every Friday after 17:00)
_last_run_week = None

def run_weekly_scheduler(base_dir=None):
    global _last_run_week
    print("[Cron Shareholder] Scheduler initialized. Weekly update scheduled for Friday 17:00 (after market close).")
    while True:
        try:
            now = datetime.now()
            current_week = now.strftime("%Y-W%W")
            if now.weekday() == 4 and now.hour >= 17:
                if _last_run_week != current_week:
                    print(f"[Cron Shareholder] Triggering weekly update for {current_week} at {now}...")
                    build_and_update_shareholders(base_dir)
                    _last_run_week = current_week
                    print(f"[Cron Shareholder] Weekly update completed for {current_week}!")
            time.sleep(1800)
        except Exception as e:
            print(f"[Cron Shareholder] Scheduler error: {e}")
            time.sleep(300)

def start_cron_in_background(base_dir=None):
    t = threading.Thread(target=run_weekly_scheduler, args=(base_dir,), daemon=True)
    t.start()
    return t

if __name__ == "__main__":
    build_and_update_shareholders()
