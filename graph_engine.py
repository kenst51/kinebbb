import os
import json
import unicodedata
import re

# PRE-DEFINED MAJOR VIETNAMESE BUSINESS ECOSYSTEMS
ECOSYSTEM_PRESETS = {
    "vingroup": {
        "id": "vingroup",
        "name": "Hệ Vingroup",
        "icon": "👑",
        "color": "#e11d48", # Rose neon
        "seed_symbols": ["VIC", "VHM", "VRE"],
        "seed_names": ["phạm nhật vượng", "phạm thu hương", "phạm thúy hằng", "ctcp tập đoàn đầu tư việt nam", "ctcp đầu tư và phát triển đường sắt cao tốc vinspeed", "ctcp vinpearl", "ctcp di chuyển xanh và thông minh gsm"]
    },
    "gelex": {
        "id": "gelex",
        "name": "Hệ Gelex (Tuấn Mượt)",
        "icon": "⚡",
        "color": "#00f2fe", # Cyan neon
        "seed_symbols": ["GEX", "VGC", "VIX", "MHC", "CAV", "THI", "S99", "SCI"],
        "seed_names": ["nguyễn văn tuấn", "ctcp tập đoàn gelex", "đào thị lơ", "nguyễn thị bích ngọc", "nguyễn thị hà"]
    },
    "masan": {
        "id": "masan",
        "name": "Hệ Masan",
        "icon": "🍲",
        "color": "#f59e0b", # Amber
        "seed_symbols": ["MSN", "MCH", "MSR", "TCB"],
        "seed_names": ["nguyễn đăng quang", "hồ hùng anh", "ctcp tập đoàn masan", "ctcp masan", "sk group"]
    },
    "sovico": {
        "id": "sovico",
        "name": "Hệ Sovico (Vietjet)",
        "icon": "✈️",
        "color": "#ec4899", # Pink
        "seed_symbols": ["VJC", "HDB"],
        "seed_names": ["nguyễn thị phương thảo", "nguyễn thanh hùng", "ctcp tập đoàn sovico", "sovico holdings"]
    },
    "hoaphat": {
        "id": "hoaphat",
        "name": "Hệ Hòa Phát",
        "icon": "🛡️",
        "color": "#3b82f6", # Blue
        "seed_symbols": ["HPG"],
        "seed_names": ["trần đình long", "vũ thị hiền", "trần vũ minh", "doãn gia cường", "nguyễn mạnh tuấn"]
    },
    "sunshine": {
        "id": "sunshine",
        "name": "Hệ Sunshine",
        "icon": "🏗️",
        "color": "#8b5cf6", # Purple
        "seed_symbols": ["KSF", "SCG", "SSH", "KLB"],
        "seed_names": ["đỗ anh tuấn", "đỗ văn trường", "ctcp tập đoàn sunshine"]
    },
    "techcombank": {
        "id": "techcombank",
        "name": "Hệ Techcombank",
        "icon": "🏦",
        "color": "#10b981", # Emerald
        "seed_symbols": ["TCB", "MSN"],
        "seed_names": ["hồ hùng anh", "nguyễn thị thanh thủy", "hồ anh minh", "hồ thủy anh", "nguyễn đăng quang"]
    },
    "ssi": {
        "id": "ssi",
        "name": "Hệ SSI & PAN",
        "icon": "📈",
        "color": "#06b6d4", # Teal
        "seed_symbols": ["SSI", "PAN", "TTA", "SZE", "BTD", "GVT", "SBL"],
        "seed_names": ["nguyễn duy hưng", "nguyễn mạnh hùng", "ctcp tập đoàn pan", "ctcp chứng khoán ssi"]
    },
    "state": {
        "id": "state",
        "name": "Khối Doanh Nghiệp Nhà Nước",
        "icon": "🏛️",
        "color": "#ffd700", # Gold
        "seed_symbols": ["VCB", "BID", "CTG", "GAS", "VGI", "ACV", "BSR", "GVR", "PLX", "POW", "HVN", "BVH", "VNM"],
        "seed_names": ["ngân hàng nhà nước việt nam", "ủy ban quản lý vốn nhà nước tại doanh nghiệp", "tổng công ty đầu tư và kinh doanh vốn nhà nước - công ty tnhh", "tập đoàn công nghiệp - năng lượng quốc gia việt nam", "tập đoàn công nghiệp - viễn thông quân đội", "bộ quốc phòng", "bộ tài chính"]
    },
    "dragon": {
        "id": "dragon",
        "name": "Hệ Quỹ Ngoại Dragon Capital",
        "icon": "🐉",
        "color": "#14b8a6", # Mint
        "seed_symbols": ["FPT", "MWG", "ACB", "MBB", "VHM", "KDH", "DGC", "STB", "HSG", "PVD"],
        "seed_names": ["dragon capital", "norges bank", "vietnam enterprise investments limited", "ambiluv limited", "hanoi investments holdings limited", "grDC"]
    }
}

class GraphEngine:
    def __init__(self, base_dir=None):
        if base_dir is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
        self.base_dir = base_dir
        self.master_index = {}
        self.company_names = {}
        self.prices = {}
        self.fialda_profiles = {}
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
                    c = (item.get("code") or item.get("symbol") or "").upper()
                    n = item.get("companyName") or item.get("name")
                    if c and n:
                        self.company_names[c] = n
            except Exception as e:
                print(f"[GraphEngine] Error loading symbols: {e}")

        # 2. Load prices
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
                print(f"[GraphEngine] Error loading prices: {e}")

        # 3. Load master shareholder index
        idx_path = os.path.join(self.base_dir, "data", "shareholder_holdings_index.json")
        if os.path.exists(idx_path):
            try:
                with open(idx_path, "r", encoding="utf-8") as f:
                    self.master_index = json.load(f)
            except Exception as e:
                print(f"[GraphEngine] Error loading master index: {e}")

                # 1.1 Load profiles from data/fialda_profiles for company names
        profiles_dir = os.path.join(self.base_dir, "data", "fialda_profiles")
        if os.path.exists(profiles_dir):
            for f_name in os.listdir(profiles_dir):
                if f_name.endswith(".json"):
                    c_sym = f_name[:-5].upper()
                    if c_sym not in self.company_names:
                        try:
                            with open(os.path.join(profiles_dir, f_name), "r", encoding="utf-8") as pfp:
                                p_data = json.load(pfp)
                            c_name = p_data.get("companyName") or p_data.get("profile", {}).get("companyName", c_sym)
                            if c_name:
                                self.company_names[c_sym] = c_name
                        except:
                            pass

        self.loaded = True
        print(f"[GraphEngine] Data loaded: {len(self.master_index)} shareholders, {len(self.prices)} prices.")

    def get_ecosystem_presets(self):
        return self.get_ecosystem_presets_list()

    def get_ecosystem_presets_list(self):
        self.load_data()
        presets = []
        for key, p in ECOSYSTEM_PRESETS.items():
            presets.append({
                "id": p["id"],
                "name": p["name"],
                "icon": p["icon"],
                "color": p["color"],
                "seedCount": len(p["seed_symbols"]) + len(p["seed_names"])
            })
        return presets

    def build_subgraph_for_preset(self, preset_key="vingroup", center_symbol=None, depth=2):
        return self.build_graph_data(preset=preset_key, depth=depth, target=center_symbol or "")

    def build_graph_data(self, preset="vingroup", depth=2, target=""):
        self.load_data()

        nodes_dict = {}
        links_list = []
        visited_nodes = set()

        # Seed discovery
        seed_symbols = set()
        seed_names = set()

        if target:
            t = target.strip()
            if len(t) <= 4 and t.upper() in self.prices:
                seed_symbols.add(t.upper())
            else:
                seed_names.add(unicodedata.normalize('NFC', t.lower()))
        elif preset and preset in ECOSYSTEM_PRESETS:
            p = ECOSYSTEM_PRESETS[preset]
            seed_symbols.update([s.upper() for s in p["seed_symbols"]])
            seed_names.update([unicodedata.normalize('NFC', n.lower()) for n in p["seed_names"]])
        elif preset == "all":
            # Top 12 largest ecosystems combined
            for p in ECOSYSTEM_PRESETS.values():
                seed_symbols.update([s.upper() for s in p["seed_symbols"]])
                seed_names.update([unicodedata.normalize('NFC', n.lower()) for n in p["seed_names"]])

        # Invert index for quick parent lookup: symbol -> list of shareholders
        symbol_to_parents = {}
        for sh_key, sh_obj in self.master_index.items():
            for h in sh_obj.get("holdings", []):
                sym = h["symbol"].upper()
                if sym not in symbol_to_parents:
                    symbol_to_parents[sym] = []
                symbol_to_parents[sym].append({
                    "sh_key": sh_key,
                    "sh_name": sh_obj["name"],
                    "isIndividual": sh_obj.get("isIndividual", False),
                    "holding": h
                })

        # Helper to ensure a Company Node exists
        def ensure_company_node(sym):
            node_id = f"COM_{sym}"
            if node_id not in nodes_dict:
                c_name = self.company_names.get(sym) or (f'Tập đoàn {sym}' if sym in ['VIC', 'MSN', 'HPG', 'GEX', 'SSH'] else f'CTCP {sym}')
                price = self.prices.get(sym, 20000.0)
                nodes_dict[node_id] = {
                    "id": node_id,
                    "symbol": sym,
                    "name": c_name,
                    "type": "company",
                    "group": preset if preset != "all" else "market",
                    "price": price,
                    "marketValueTy": 0,
                    "depth": 0
                }
            return node_id

        # Helper to ensure a Shareholder Node exists
        def ensure_sh_node(sh_name, is_ind=False, tot_val=0):
            norm_key = unicodedata.normalize('NFC', sh_name.lower())
            node_id = f"SH_{norm_key}"
            if node_id not in nodes_dict:
                nodes_dict[node_id] = {
                    "id": node_id,
                    "name": sh_name,
                    "type": "individual" if is_ind else "institution",
                    "group": preset if preset != "all" else "market",
                    "marketValueTy": tot_val,
                    "depth": 0
                }
            return node_id

        # Multi-layer traversal
        current_layer_symbols = set(seed_symbols)
        current_layer_shs = set(seed_names)

        # Map matching seed names to actual keys in master_index
        matched_sh_keys = set()
        for seed_n in seed_names:
            for sh_k in self.master_index.keys():
                if seed_n in sh_k or sh_k in seed_n:
                    matched_sh_keys.add(sh_k)

        current_layer_shs.update(matched_sh_keys)

        for d in range(1, int(depth) + 1):
            next_layer_symbols = set()
            next_layer_shs = set()

            # 1. Expand from Shareholders -> their Holdings
            for sh_k in current_layer_shs:
                if sh_k in self.master_index:
                    sh_obj = self.master_index[sh_k]
                    src_id = ensure_sh_node(sh_obj["name"], sh_obj.get("isIndividual", False), sh_obj.get("totalMarketValueTy", 0))
                    nodes_dict[src_id]["depth"] = min(nodes_dict[src_id].get("depth", 99), d)

                    for h in sh_obj.get("holdings", []):
                        sym = h["symbol"].upper()
                        # Only follow substantial holdings in deep expansion (>0.5% or >10 Ty)
                        if d > 1 and h.get("ownership", 0) < 0.005 and h.get("marketValueTy", 0) < 10:
                            continue

                        tgt_id = ensure_company_node(sym)
                        nodes_dict[tgt_id]["depth"] = min(nodes_dict[tgt_id].get("depth", 99), d)

                        link_key = f"{src_id}->{tgt_id}"
                        if link_key not in visited_nodes:
                            visited_nodes.add(link_key)
                            links_list.append({
                                "source": src_id,
                                "target": tgt_id,
                                "shares": h.get("shares", 0),
                                "ownership": h.get("ownership", 0),
                                "marketValueTy": h.get("marketValueTy", 0),
                                "ownershipPct": round(h.get("ownership", 0) * 100, 2),
                                "type": "ownership"
                            })
                        next_layer_symbols.add(sym)

            # 2. Expand from Companies -> their Parent Shareholders
            for sym in current_layer_symbols:
                tgt_id = ensure_company_node(sym)
                nodes_dict[tgt_id]["depth"] = min(nodes_dict[tgt_id].get("depth", 99), d)

                parents = symbol_to_parents.get(sym, [])
                for p in parents:
                    h = p["holding"]
                    # Only include significant parents (>1% or >20 Ty)
                    if h.get("ownership", 0) < 0.01 and h.get("marketValueTy", 0) < 20:
                        continue

                    src_id = ensure_sh_node(p["sh_name"], p["isIndividual"], p["holding"].get("marketValueTy", 0))
                    nodes_dict[src_id]["depth"] = min(nodes_dict[src_id].get("depth", 99), d)

                    link_key = f"{src_id}->{tgt_id}"
                    if link_key not in visited_nodes:
                        visited_nodes.add(link_key)
                        links_list.append({
                            "source": src_id,
                            "target": tgt_id,
                            "shares": h.get("shares", 0),
                            "ownership": h.get("ownership", 0),
                            "marketValueTy": h.get("marketValueTy", 0),
                            "ownershipPct": round(h.get("ownership", 0) * 100, 2),
                            "type": "ownership"
                        })
                    next_layer_shs.add(p["sh_key"])

            current_layer_symbols = next_layer_symbols
            current_layer_shs = next_layer_shs

        # Compute in-degree / out-degree and total linked value for node sizing
        nodes_list = list(nodes_dict.values())
        for n in nodes_list:
            if n["type"] == "company":
                # Find sum of major holdings
                related_links = [l for l in links_list if l["target"] == n["id"]]
                n["totalTrackedValueTy"] = round(sum(l["marketValueTy"] for l in related_links), 1)
                n["inDegree"] = len(related_links)
            else:
                related_links = [l for l in links_list if l["source"] == n["id"]]
                n["totalTrackedValueTy"] = round(sum(l["marketValueTy"] for l in related_links), 1)
                n["outDegree"] = len(related_links)

        return {
            "preset": preset,
            "target": target,
            "depth": depth,
            "stats": {
                "totalNodes": len(nodes_list),
                "totalLinks": len(links_list),
                "companiesCount": sum(1 for n in nodes_list if n["type"] == "company"),
                "shareholdersCount": sum(1 for n in nodes_list if n["type"] != "company")
            },
            "nodes": nodes_list,
            "links": links_list
        }

    def simulate_shock(self, target_symbol="VIC", drop_pct=7.0, shock_pct=None, **kwargs):
        if shock_pct is not None:
            drop_pct = shock_pct
        self.load_data()
        sym = target_symbol.upper().strip()
        drop = abs(float(drop_pct)) / 100.0

        price = self.prices.get(sym, 20000.0)
        impacted_shareholders = []
        total_loss_ty = 0.0

        for sh_key, sh_obj in self.master_index.items():
            for h in sh_obj.get("holdings", []):
                if h["symbol"].upper() == sym:
                    val_before = h.get("marketValueTy", 0)
                    loss = round(val_before * drop, 2)
                    if loss > 0:
                        total_loss_ty += loss
                        impacted_shareholders.append({
                            "name": sh_obj["name"],
                            "isIndividual": sh_obj.get("isIndividual", False),
                            "shares": h.get("shares", 0),
                            "ownership": h.get("ownership", 0),
                            "ownershipPct": round(h.get("ownership", 0) * 100, 2),
                            "valueBeforeTy": val_before,
                            "lossTy": loss,
                            "valueAfterTy": round(val_before - loss, 2)
                        })

        impacted_shareholders.sort(key=lambda x: x["lossTy"], reverse=True)

        return {
            "symbol": sym,
            "companyName": self.company_names.get(sym) or (f'Tập đoàn {sym}' if sym in ['VIC', 'MSN', 'HPG', 'GEX', 'SSH'] else f'CTCP {sym}'),
            "price": price,
            "dropPct": round(drop * 100, 1),
            "totalDirectLossTy": round(total_loss_ty, 2),
            "impactedCount": len(impacted_shareholders),
            "topImpacted": impacted_shareholders[:50]
        }

_graph_engine_singleton = None

def get_graph_engine(base_dir=None):
    global _graph_engine_singleton
    if _graph_engine_singleton is None:
        _graph_engine_singleton = GraphEngine(base_dir)
    return _graph_engine_singleton
