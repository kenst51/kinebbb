import json

data = json.load(open('static/all_icb_sectors.json', 'r', encoding='utf-8'))

html = []
html.append('                                    <option value="ALL_COMPARE">⚡ So Sánh Tương Quan Các Ngành Đầu Tàu (Base 100)</option>')

html.append('                                    <optgroup label="🏢 ─── NGÀNH CẤP 1 (10 NGÀNH TRỤ CỘT) ───">')
for s in data['level1']:
    sel = ' selected' if s['code'] == '8000' else ''
    html.append(f'                                        <option value="{s["code"]}"{sel}>{s["name"]} ({s["code"]}) - {s["stockCount"]} mã</option>')
html.append('                                    </optgroup>')

html.append('                                    <optgroup label="🏭 ─── NGÀNH CẤP 2 (20 PHÂN NGÀNH LỚN) ───">')
for s in data['level2']:
    html.append(f'                                        <option value="{s["code"]}">{s["name"]} ({s["code"]}) - {s["stockCount"]} mã</option>')
html.append('                                    </optgroup>')

html.append('                                    <optgroup label="📦 ─── NGÀNH CẤP 3 (40 TIỂU NGÀNH CHUYÊN SÂU) ───">')
for s in data['level3']:
    html.append(f'                                        <option value="{s["code"]}">{s["name"]} ({s["code"]}) - {s["stockCount"]} mã</option>')
html.append('                                    </optgroup>')

html.append('                                    <optgroup label="🔬 ─── NGÀNH CẤP 4 (90 NHÓM SẢN PHẨM CHI TIẾT) ───">')
for s in data['level4']:
    html.append(f'                                        <option value="{s["code"]}">{s["name"]} ({s["code"]}) - {s["stockCount"]} mã</option>')
html.append('                                    </optgroup>')

full_html = '\n'.join(html)
with open('static/all_icb_options.html', 'w', encoding='utf-8') as f:
    f.write(full_html)
print('Generated static/all_icb_options.html successfully! Lines:', len(html))
