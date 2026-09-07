
window.indexData = {};
window.indexHistories = {};

async function pollIndices() {
    try {
        const res = await fetch('/api/market_indices');
        const data = await res.json();
        
        Object.keys(data).forEach(key => {
            const item = data[key];
            window.indexData[key] = item;
            
            const elVal = document.getElementById(`idx_${key}_val`);
            const elScore = document.getElementById(`idx_${key}_score`);
            const elChange = document.getElementById(`idx_${key}_change`);
            const elKl = document.getElementById(`idx_${key}_kl`);
            const elGt = document.getElementById(`idx_${key}_gt`);
            const elAdv = document.getElementById(`idx_${key}_adv`);
            const elUnc = document.getElementById(`idx_${key}_unc`);
            const elDec = document.getElementById(`idx_${key}_dec`);
            
            if (elVal) elVal.innerText = item.val.toLocaleString('en-US', {maximumFractionDigits: 0});
            if (elScore) elScore.innerText = item.index.toFixed(2);
            
            let changeColor = item.change > 0 ? '#00e676' : (item.change < 0 ? '#ff5252' : '#ffeb3b');
            if (elChange) {
                elChange.innerText = (item.change > 0 ? '+' : '') + item.change.toFixed(2) + ' (' + (item.pct > 0 ? '+' : '') + item.pct.toFixed(2) + '%)';
                elChange.style.color = changeColor;
                elScore.style.color = changeColor;
                if (elGt) elGt.style.color = changeColor;
            }
            if (elKl) elKl.innerText = item.vol.toFixed(1) + ' tr';
            if (elGt) elGt.innerText = item.val.toLocaleString('en-US', {maximumFractionDigits: 0}) + ' tỷ';
            if (elAdv) elAdv.innerText = item.adv;
            if (elUnc) elUnc.innerText = item.unc;
            if (elDec) elDec.innerText = item.dec;
        });
        
        // draw charts
        drawIndexCharts();
    } catch (e) { }
}

async function pollIndexHistory() {
    try {
        const res = await fetch('/api/index_history');
        const data = await res.json();
        window.indexHistories = data;
        drawIndexCharts();
    } catch(e) {}
}

function drawIndexCharts() {
    ['VNINDEX', 'VN30', 'HNX', 'UPCOM'].forEach(key => {
        if (!window.indexHistories[key] || !window.indexData[key]) return;
        const hist = window.indexHistories[key];
        const data = window.indexData[key];
        
        const pathEl = document.getElementById(`path_${key}`);
        if (!pathEl) return;
        
        const oIndex = data.index - data.change;
        let cArr = [...(hist.c || [])];
        if (cArr.length === 0) return;
        
        // Append current price if missing
        cArr.push(data.index);
        let maxVal = Math.max(...cArr, oIndex);
        let minVal = Math.min(...cArr, oIndex);
        if (maxVal === minVal) { maxVal += 1; minVal -= 1; }
        
        // padding
        const range = maxVal - minVal;
        maxVal += range * 0.1;
        minVal -= range * 0.1;
        
        const svgW = 100;
        const svgH = 35;
        
        const pts = cArr.map((val, i) => {
            const x = (i / (cArr.length - 1)) * svgW;
            const y = svgH - ((val - minVal) / (maxVal - minVal)) * svgH;
            return `${x},${y}`;
        });
        
        const d = `M${pts.join(' L')}`;
        pathEl.setAttribute('d', d);
        
        const refY = svgH - ((oIndex - minVal) / (maxVal - minVal)) * svgH;
        const refLine = pathEl.previousElementSibling; // The yellow dotted line
        if (refLine && refLine.tagName === 'line') {
            refLine.setAttribute('y1', refY);
            refLine.setAttribute('y2', refY);
        }
        
        const grad = document.getElementById(`grad_${key}`);
        if (grad) {
            const offset = (refY / svgH) * 100;
            const stops = grad.querySelectorAll('stop');
            if (stops.length >= 2) {
                stops[0].setAttribute('offset', `${offset}%`);
                stops[1].setAttribute('offset', `${offset}%`);
            }
        }
        
        // Setup tooltip events on SVG wrapper
        
        const svgWrapper = pathEl.closest('div');
        const cardEl = svgWrapper.parentElement;
        if (cardEl && !cardEl.dataset.hasEvents) {
            cardEl.dataset.hasEvents = "true";
            cardEl.addEventListener('mousemove', (e) => showTooltip(e, key, svgWrapper));
            cardEl.addEventListener('mouseleave', hideTooltip);
        }
    });
}


function showTooltip(e, key, svgWrapper) {
    try {
        const hist = window.indexHistories[key];
        const data = window.indexData[key];
        if (!hist || !data) return;
        
        const rect = svgWrapper.getBoundingClientRect();
        let x = e.clientX - rect.left;
        
        // if hovering outside SVG, clamp x
        if (x < 0) x = 0;
        if (x > rect.width) x = rect.width;
        
        const cArr = hist.c || [];
        const tArr = hist.t || [];
        const vArr = hist.v || [];
        if (cArr.length === 0) return;
        
        let index = Math.floor((x / rect.width) * cArr.length);
        if (index < 0) index = 0;
        if (index >= cArr.length) index = cArr.length - 1;
        
        const val = cArr[index];
        const time = tArr[index] || 0;
        const vol = vArr[index] || 0;
        
        const d = new Date(time * 1000);
        const timeStr = time > 0 ? d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0') + ':00' : 'Now';
        
        
        const bottomDefault = document.getElementById(`idx_${key}_bottom_default`);
        const bottomHover = document.getElementById(`idx_${key}_bottom_hover`);
        if (bottomDefault && bottomHover) {
            bottomDefault.style.opacity = '0';
            bottomHover.style.opacity = '1';
        }
        
        const tt = document.getElementById('idx_tooltip');

        const tTime = document.getElementById('idx_tt_time');
        const tVal = document.getElementById('idx_tt_val');
        const tVol = document.getElementById('idx_tt_vol');
        
        tTime.innerText = timeStr;
        tVal.innerText = val.toFixed(2);
        tVol.innerText = Math.round(vol).toLocaleString('en-US');
        
        const oIndex = data.index - data.change;
        let changeColor = val > oIndex ? '#00e676' : (val < oIndex ? '#ff5252' : '#ffeb3b');
        tVal.style.color = changeColor;
        
        tt.style.display = 'flex';
        tt.style.left = (e.clientX + 15) + 'px';
        tt.style.top = (e.clientY + 15) + 'px';
        
        const vLine = document.getElementById('idx_crosshair_v');
        const hLine = document.getElementById('idx_crosshair_h');
        const dot = document.getElementById('idx_crosshair_dot');
        
        let maxVal = Math.max(...cArr, oIndex);
        let minVal = Math.min(...cArr, oIndex);
        if (maxVal === minVal) { maxVal += 1; minVal -= 1; }
        const range = maxVal - minVal;
        maxVal += range * 0.1;
        minVal -= range * 0.1;
        
        const svgH = rect.height;
        const svgW = rect.width;
        const dotY = svgH - ((val - minVal) / (maxVal - minVal)) * svgH;
        const dotX = (index / (cArr.length - 1)) * svgW;
        
        const absX = rect.left + dotX;
        const absY = rect.top + dotY;
        
        vLine.style.display = 'block';
        vLine.style.left = absX + 'px';
        vLine.style.top = rect.top + 'px';
        vLine.style.height = rect.height + 'px';
        
        hLine.style.display = 'block';
        hLine.style.left = rect.left + 'px';
        hLine.style.top = absY + 'px';
        hLine.style.width = rect.width + 'px';
        
        dot.style.display = 'block';
        dot.style.left = absX + 'px';
        dot.style.top = absY + 'px';
        dot.style.background = changeColor;
    } catch (err) {
        console.error(err);
        // show a red border on the container to indicate error
        e.currentTarget.style.border = '2px solid red';
    }
}
function hideTooltip(e) {
    document.getElementById('idx_tooltip').style.display = 'none';
    document.getElementById('idx_crosshair_v').style.display = 'none';
    document.getElementById('idx_crosshair_h').style.display = 'none';
    document.getElementById('idx_crosshair_dot').style.display = 'none';
    
    // Restore all bottom blocks
    ['VNINDEX', 'VN30', 'HNX', 'UPCOM'].forEach(key => {
        const d = document.getElementById(`idx_${key}_bottom_default`);
        const h = document.getElementById(`idx_${key}_bottom_hover`);
        if (d && h) {
            d.style.opacity = '1';
            h.style.opacity = '0';
        }
    });
}

// Ensure polling starts
setTimeout(pollIndexHistory, 1000);
setInterval(pollIndexHistory, 60000);


function getHeatmapStyle(item) {
    const p = item.price;
    const r = item.ref;
    const c = item.ceil;
    const f = item.floor;
    const pct = item.pct_change;
    
    let base = {r: 255, g: 235, b: 59}; // Yellow
    if (p === 0 || r === 0) {
        base = {r: 209, g: 212, b: 220}; // Gray #d1d4dc
    } else if (p >= c && c > 0) {
        base = {r: 224, g: 64, b: 251}; // Purple
    } else if (p <= f && f > 0) {
        base = {r: 0, g: 229, b: 255}; // Cyan
    } else if (p > r) {
        base = {r: 0, g: 230, b: 118}; // Green
    } else if (p < r) {
        base = {r: 255, g: 82, b: 82}; // Red
    }
    
    let intensity = 0.2;
    if (p !== r && p !== 0) {
        intensity = 0.3 + (Math.min(Math.abs(pct) / 7, 1) * 0.7);
    }
    
    const bgR = Math.round(255 - (255 - base.r) * intensity);
    const bgG = Math.round(255 - (255 - base.g) * intensity);
    const bgB = Math.round(255 - (255 - base.b) * intensity);
    const bg = `rgb(${bgR}, ${bgG}, ${bgB})`;
    
    // For text color, if it's cyan or yellow, we need it darker to read against pastel
    let tf = 0.4;
    if (p === r || (p <= f && f > 0)) tf = 0.3;
    
    const txtR = Math.round(base.r * tf);
    const txtG = Math.round(base.g * tf);
const txtB = Math.round(base.b * tf);
    const text = `rgb(${txtR}, ${txtG}, ${txtB})`;
    
    return { bg, text };
}

// Smart Board JS Logic

let allSymbols = new Set();
let columnsConfig = [];
let watchlist = JSON.parse(localStorage.getItem('smart_board_watchlist') || '[]');

async function initSmartBoard() {
    try {
        const res = await fetch('board_config.json');
        columnsConfig = await res.json();
        
        renderColumns();
        renderWatchlist();
        
        pollData();
        setInterval(pollData, 3000);
        
        pollSentiment();
        setInterval(pollSentiment, 60000);
        
        pollIndices();
        setInterval(pollIndices, 3000);
        
    } catch (e) {
        console.error("Lỗi:", e);
    }
}


function toggleSort(idx, by) {
    const currentState = colSortStates[idx] || { by: '', dir: 0 };
    if (currentState.by === by) {
        if (currentState.dir === -1) currentState.dir = 1;
        else if (currentState.dir === 1) currentState.dir = 0;
        else currentState.dir = -1;
    } else {
        currentState.by = by;
        currentState.dir = -1;
    }
    colSortStates[idx] = currentState;
    
    ['sym', 'price', 'change', 'vol'].forEach(k => {
        const el = document.getElementById(`sort_i_${idx}_${k}`);
        if (el) el.innerText = '';
    });
    
    const activeEl = document.getElementById(`sort_i_${idx}_${by}`);
    if (activeEl && currentState.dir !== 0) {
        activeEl.innerText = currentState.dir === -1 ? ' ⌄' : ' ⌃';
    }
    
    applySort(idx);
}

function applySort(idx) {
    const state = colSortStates[idx];
    const tbody = document.getElementById(`col_body_${idx}`);
    if (!tbody) return;
    
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    if (!state || state.dir === 0) {
        const originalOrder = columnsConfig[idx].symbols;
        rows.sort((a, b) => {
            const symA = a.querySelector('td').innerText;
            const symB = b.querySelector('td').innerText;
            return originalOrder.indexOf(symA) - originalOrder.indexOf(symB);
        });
    } else {
        rows.sort((a, b) => {
            const symA = a.querySelector('td').innerText;
            const symB = b.querySelector('td').innerText;
            
            const dataA = stockData[symA] || { price: 0, pct_change: 0, volume: 0 };
            const dataB = stockData[symB] || { price: 0, pct_change: 0, volume: 0 };
            
            let valA, valB;
            if (state.by === 'sym') {
                return state.dir * (symA > symB ? -1 : (symA < symB ? 1 : 0));
            } else if (state.by === 'price') {
                valA = dataA.price; valB = dataB.price;
            } else if (state.by === 'change') {
                valA = dataA.pct_change; valB = dataB.pct_change;
            } else if (state.by === 'vol') {
                valA = dataA.volume; valB = dataB.volume;
            }
            
            if (valA > valB) return state.dir * -1;
            if (valA < valB) return state.dir * 1;
            return 0;
        });
    }
    
    rows.forEach(r => tbody.appendChild(r));
}

function renderColumns() {
    const grid = document.getElementById('board_main_grid');
    if (!grid) return;
    grid.innerHTML = '';
    allSymbols.clear();
    
    columnsConfig.forEach((col, idx) => {
        const colDiv = document.createElement('div');
        colDiv.className = 'board-column';
        
        const header = document.createElement('div');
        header.className = 'board-col-header';
        header.innerHTML = `<span>${col.name}</span> <span class="badge">${col.symbols.length} mã</span>`;
        
        const tableCont = document.createElement('div');
        tableCont.style.cssText = 'flex: 1; overflow-y: auto;';
        
        const table = document.createElement('table');
        table.className = 'board-table';
        table.style.cssText = 'width: 100%; border-collapse: separate; border-spacing: 0 3px; font-size: 12px;';
        
        table.innerHTML = `
            <thead style="position: sticky; top: 0; background: #1e222d; z-index: 1;">
                <tr style="color: #787b86; font-size: 11px;">
                    <th style="padding: 6px 8px; text-align: left; cursor: pointer; user-select: none;" onclick="toggleSort(${idx}, 'sym')">MÃ<span id="sort_i_${idx}_sym"></span></th>
                    <th style="padding: 6px 8px; text-align: right; cursor: pointer; user-select: none;" onclick="toggleSort(${idx}, 'price')">GIÁ<span id="sort_i_${idx}_price"></span></th>
                    <th style="padding: 6px 8px; text-align: right; cursor: pointer; user-select: none;" onclick="toggleSort(${idx}, 'change')">+/-<span id="sort_i_${idx}_change"></span></th>
                    <th style="padding: 6px 8px; text-align: right; cursor: pointer; user-select: none;" onclick="toggleSort(${idx}, 'vol')">KL<span id="sort_i_${idx}_vol"></span></th>
                </tr>
            </thead>
            <tbody id="col_body_${idx}">
            </tbody>
        `;
        
        tableCont.appendChild(table);
        colDiv.appendChild(header);
        colDiv.appendChild(tableCont);
        grid.appendChild(colDiv);
        
        const tbody = table.querySelector('tbody');
        col.symbols.forEach(sym => {
            allSymbols.add(sym);
            const tr = document.createElement('tr');
            tr.id = `row_${sym}`;
            tr.style.cssText = 'cursor: pointer; transition: background 0.15s;';
            tr.title = `Xem biểu đồ phân tích kỹ thuật ${sym}`;
            tr.onclick = () => {
                if (typeof loadSymbolFromWatchlist === 'function') {
                    loadSymbolFromWatchlist(sym);
                }
                if (typeof switchAppMode === 'function') {
                    switchAppMode('cophieu');
                }
            };
            tr.innerHTML = `
                <td style="padding: 5px 8px; text-align: left; font-weight: bold; border-top-left-radius: 6px; border-bottom-left-radius: 6px;" class="cell_${sym}_sym">${sym}</td>
                <td style="padding: 5px 8px; text-align: right; font-weight: 600;" class="cell_${sym}_price">-</td>
                <td style="padding: 5px 8px; text-align: right; font-weight: 600;" class="cell_${sym}_change">-</td>
                <td style="padding: 5px 8px; text-align: right; border-top-right-radius: 6px; border-bottom-right-radius: 6px; color: #787b86;" class="cell_${sym}_vol">-</td>
            `;
            tbody.appendChild(tr);
        });
    });
    
    watchlist.forEach(sym => allSymbols.add(sym));
}

function renderWatchlist() {
    const sidebar = document.getElementById('board_sidebar');
    if (!sidebar) return;
    
    let wlHtml = `<div style="padding: 15px; font-weight: bold; border-bottom: 1px solid #2a2e39; display: flex; justify-content: space-between;">
        <span style="color: #2962ff;">Quan tâm</span>
        <span style="color: #4caf50; cursor: pointer;" onclick="addToWatchlist()">+</span>
    </div>`;
    
    if (watchlist.length === 0) {
        wlHtml += `<div style="padding: 15px; font-size: 11px; color: #787b86;">Chưa có mã nào</div>`;
    } else {
        wlHtml += `<table class="board-table" style="width: 100%; font-size: 12px;"><tbody>`;
        watchlist.forEach(sym => {
            wlHtml += `<tr style="cursor: pointer;" onclick="loadSymbolFromWatchlist('${sym}'); switchAppMode('cophieu');">
                <td style="padding: 5px 15px; font-weight: bold;" id="wl_cell_${sym}_sym">${sym}</td>
                <td style="padding: 5px 15px; text-align: right;" id="wl_cell_${sym}_price">-</td>
                <td style="padding: 5px 15px; text-align: right;" id="wl_cell_${sym}_change">-</td>
            </tr>`;
        });
        wlHtml += `</tbody></table>`;
    }
    sidebar.innerHTML = wlHtml;
}

function addToWatchlist() {
    const sym = prompt("Nhập mã cổ phiếu muốn theo dõi:");
    if (sym) {
        const upperSym = sym.toUpperCase().trim();
        if (!watchlist.includes(upperSym)) {
            watchlist.push(upperSym);
            localStorage.setItem('smart_board_watchlist', JSON.stringify(watchlist));
            allSymbols.add(upperSym);
            renderWatchlist();
            pollData();
        }
    }
}

function getActualColor(price, ref, ceil, floor) {
    if (price === 0 || ref === 0) return '#d1d4dc';
    if (price >= ceil && ceil > 0) return '#e040fb';
    if (price <= floor && floor > 0) return '#00e5ff';
    if (price > ref) return '#00e676';
    if (price < ref) return '#ff5252';
    return '#ffeb3b';
}

let isPolling = false;
let stockData = {};
let colSortStates = {};
async function pollData() {
    if (isPolling) return;
    isPolling = true;
    
    try {
        const symList = Array.from(allSymbols).join(',');
        if (!symList) { isPolling = false; return; }
        
        const res = await fetch(`/api/live_board?symbols=${symList}`);
        const data = await res.json();
        
        data.forEach(item => {
            stockData[item.symbol] = item;
            const c = getActualColor(item.price, item.ref, item.ceil, item.floor);
            
            const priceCells = document.querySelectorAll(`.cell_${item.symbol}_price`);
            priceCells.forEach(priceCell => {
                const tr = priceCell.parentElement;
                const styleColors = getHeatmapStyle(item);
                tr.style.backgroundColor = styleColors.bg;
                tr.style.borderRadius = '12px';
                
                tr.querySelector(`.cell_${item.symbol}_sym`).style.color = styleColors.text;
                priceCell.style.color = styleColors.text;
                const changeCell = tr.querySelector(`.cell_${item.symbol}_change`);
                const volCell = tr.querySelector(`.cell_${item.symbol}_vol`);
                
                changeCell.style.color = styleColors.text;
                volCell.style.color = styleColors.text;
                
                priceCell.innerText = item.price.toFixed(2);
                // User screenshot shows % change, not absolute change
                let pctStr = item.pct_change > 0 ? `+${item.pct_change.toFixed(2)}%` : (item.pct_change === 0 ? '0%' : `${item.pct_change.toFixed(2)}%`);
                changeCell.innerText = pctStr;
                
                // Volume formatting
                let v = item.volume;
                let vStr = v >= 1000000 ? (v / 1000000).toFixed(1) + 'm' : v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toString();
                volCell.innerText = vStr;
            });
            
            const wlPrice = document.getElementById(`wl_cell_${item.symbol}_price`);
            if (wlPrice) {
                document.getElementById(`wl_cell_${item.symbol}_sym`).style.color = c;
                wlPrice.style.color = c;
                document.getElementById(`wl_cell_${item.symbol}_change`).style.color = c;
                
                wlPrice.innerText = item.price.toFixed(2);
                document.getElementById(`wl_cell_${item.symbol}_change`).innerText = item.pct_change.toFixed(1) + '%';
            }
        });
        
        // Re-apply sorts to keep columns sorted dynamically
        Object.keys(colSortStates).forEach(idx => {
            if (colSortStates[idx].dir !== 0) applySort(idx);
        });
        
    } catch (e) { }
    isPolling = false;
}

async function pollSentiment() {
    try {
        const res = await fetch('/api/sentiment');
        const data = await res.json();
        
        document.getElementById('sentiment_score').innerText = `${data.score}`;
        
        let label = data.label;
        if (data.score < 33) label = 'Bi quan (Cơ hội tích lũy)';
        else if (data.score <= 66) label = 'Trung tính';
        else label = 'Hưng phấn (Rủi ro)';
        
        document.getElementById('sentiment_label').innerText = label;
        
        const thumb = document.getElementById('sentiment_thumb');
        if (thumb) {
            thumb.style.left = `${data.score}%`;
        }
        
        const buyBar = document.getElementById('buy_bar');
        const sellBar = document.getElementById('sell_bar');
        if (buyBar && sellBar) {
            buyBar.style.width = `${data.buy_percent}%`;
            sellBar.style.width = `${data.sell_percent}%`;
            document.getElementById('buy_label').innerText = `Chờ mua: ${data.buy_percent}%`;
            document.getElementById('sell_label').innerText = `Chờ bán: ${data.sell_percent}%`;
        }
    } catch (e) { }
}

function switchNganhTab(tabName) {
    document.querySelectorAll('.nganh-tab-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.removeAttribute('style');
    });
    
    const activeBtn = document.getElementById(`tab_btn_${tabName}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    const views = {
        'bangdien': document.getElementById('nganh_view_bangdien'),
        'icb': document.getElementById('nganh_view_icb'),
        'thongke': document.getElementById('content_thongke'),
        'rrg': document.getElementById('nganh_view_rrg')
    };
    
    Object.keys(views).forEach(k => {
        if (views[k]) {
            views[k].style.display = (k === tabName) ? 'flex' : 'none';
        }
    });
    
    if (tabName === 'thongke' && typeof loadThongKeNganh === 'function') {
        loadThongKeNganh();
    }
    
    if (tabName === 'bangdien' && columnsConfig.length === 0) {
        initSmartBoard();
    }
    
    if (tabName === 'rrg' && typeof initRrgChart === 'function') {
        initRrgChart();
    }
}

setTimeout(() => {
    if (document.getElementById('nganh_view_bangdien') && document.getElementById('nganh_view_bangdien').style.display !== 'none') {
        initSmartBoard();
    }
}, 500);


// ---- THỐNG KÊ NGÀNH MODULE (MODERN FLOW DASHBOARD) ----
let thongKeDataCache = null;
let thongKeInterval = null;
let thongKeMappingCache = null;

window.currentThongKeLevel = 1;
window.thongKeViewMode = 'matrix'; // 'matrix' | 'cards'
window.thongKeSearchQuery = '';
window.thongKeSortMode = 'roc_desc';

const SECTOR_ICONS = {
    '0001': '🛢️', // Dầu khí
    '1000': '⛏️', // Nguyên vật liệu
    '1300': '🧪', // Hóa chất
    '1700': '🏗️', // Tài nguyên cơ bản / Thép
    '2000': '🏭', // Công nghiệp
    '2300': '🧱', // Xây dựng & Vật liệu
    '2700': '📦', // Hàng & Dịch vụ Công nghiệp
    '3000': '🛍️', // Hàng Tiêu dùng
    '3300': '🍔', // Thực phẩm & Đồ uống
    '3500': '👕', // Hàng cá nhân & Gia dụng
    '3700': '🚗', // Ô tô & Phụ tùng
    '4000': '💊', // Dược phẩm & Y tế
    '5000': '🛒', // Dịch vụ Tiêu dùng
    '5300': '🏬', // Bán lẻ
    '5500': '📺', // Truyền thông
    '5700': '✈️', // Du lịch & Giải trí
    '6000': '📡', // Viễn thông
    '7000': '⚡', // Tiện ích Cộng đồng (Điện nước)
    '8000': '🏦', // Tài chính (Ngân hàng, Chứng khoán)
    '8300': '🏛️', // Ngân hàng
    '8500': '🛡️', // Bảo hiểm
    '8600': '📈', // Dịch vụ tài chính / Chứng khoán
    '8700': '🏢', // Bất động sản
    '9000': '💻'  // Công nghệ Thông tin
};

function getSectorIcon(code, name) {
    if (SECTOR_ICONS[code]) return SECTOR_ICONS[code];
    const n = (name || '').toLowerCase();
    if (n.includes('ngân hàng')) return '🏛️';
    if (n.includes('chứng khoán')) return '📈';
    if (n.includes('bất động sản')) return '🏢';
    if (n.includes('thép') || n.includes('kim loại')) return '🔩';
    if (n.includes('dầu')) return '🛢️';
    if (n.includes('điện') || n.includes('năng lượng')) return '⚡';
    if (n.includes('công nghệ') || n.includes('cntt')) return '💻';
    if (n.includes('xây dựng')) return '🏗️';
    if (n.includes('dược') || n.includes('y tế')) return '💊';
    if (n.includes('bán lẻ')) return '🛒';
    if (n.includes('thực phẩm')) return '🍔';
    return '📊';
}

async function fetchAllLivePrices() {
    if (!thongKeMappingCache) return;
    const allSyms = new Set();
    thongKeMappingCache.forEach(s => {
        if (s.stocks) s.stocks.forEach(sym => allSyms.add(sym));
    });
    const symList = Array.from(allSyms);
    
    const chunkSize = 200;
    for(let i=0; i < symList.length; i += chunkSize) {
        const chunk = symList.slice(i, i+chunkSize);
        try {
            const res = await fetch(`/api/live_board?symbols=${chunk.join(',')}`);
            const data = await res.json();
            if(data) {
                data.forEach(item => {
                    if (typeof stockData !== 'undefined') stockData[item.symbol] = item;
                });
            }
        } catch(e) {}
    }
}

async function loadThongKeNganh() {
    if (!thongKeDataCache) {
        try {
            const res = await fetch('/api/sector_stats/history?t=' + Date.now());
            thongKeDataCache = await res.json();
            
            const res2 = await fetch('/api/sectors/level2?t=' + Date.now());
            thongKeMappingCache = await res2.json();
        } catch(e) {
            console.error(e);
            return;
        }
    }
    renderThongKeNganh();
    
    if (!thongKeInterval) {
        thongKeInterval = setInterval(renderThongKeNganh, 5000);
    }
}

function getHeatChipStyle(val) {
    if (val >= 100) {
        return { bg: 'linear-gradient(135deg, #c471ed 0%, #8e24aa 100%)', color: '#ffffff', border: '1px solid rgba(196,113,237,0.5)', shadow: '0 2px 6px rgba(196,113,237,0.3)' };
    }
    if (val >= 30) {
        return { bg: 'linear-gradient(135deg, #00e676 0%, #00a152 100%)', color: '#000000', border: '1px solid rgba(0,230,118,0.5)', shadow: '0 2px 6px rgba(0,230,118,0.2)' };
    }
    if (val >= 5) {
        return { bg: 'rgba(0, 230, 118, 0.35)', color: '#b9f6ca', border: '1px solid rgba(0,230,118,0.3)', shadow: 'none' };
    }
    if (val > 0) {
        return { bg: 'rgba(0, 230, 118, 0.18)', color: '#69f0ae', border: '1px solid rgba(0,230,118,0.2)', shadow: 'none' };
    }
    if (val === 0) {
        return { bg: '#1e222d', color: '#787b86', border: '1px solid #2a2e39', shadow: 'none' };
    }
    if (val >= -10) {
        return { bg: 'rgba(255, 82, 82, 0.18)', color: '#ff8a80', border: '1px solid rgba(255,82,82,0.2)', shadow: 'none' };
    }
    if (val >= -30) {
        return { bg: 'rgba(255, 82, 82, 0.35)', color: '#ffcdd2', border: '1px solid rgba(255,82,82,0.3)', shadow: 'none' };
    }
    return { bg: 'linear-gradient(135deg, #ff5252 0%, #c62828 100%)', color: '#ffffff', border: '1px solid rgba(255,82,82,0.5)', shadow: '0 2px 6px rgba(255,82,82,0.2)' };
}

function renderThongKeNganh() {
    if (!thongKeDataCache || !thongKeDataCache.data || !thongKeMappingCache) return;
    
    const livePrices = (typeof stockData !== 'undefined') ? stockData : {};
    
    // 1. Calculate live stats per sector
    const sectorLiveStats = {};
    thongKeMappingCache.forEach(sector => {
        const stocks = sector.stocks || [];
        let upCount = 0;
        let downCount = 0;
        let unchangeCount = 0;
        let totalCount = stocks.length;
        let todayVal = 0;
        let pricedCount = 0;
        
        stocks.forEach(sym => {
            const live = livePrices[sym];
            if (live) {
                const chg = live.change || 0;
                if (chg > 0.001) {
                    upCount++;
                } else if (chg < -0.001) {
                    downCount++;
                } else {
                    unchangeCount++;
                }
                
                if (live.ref > 0) {
                    todayVal += (chg / live.ref) * 100;
                    pricedCount++;
                }
            } else {
                unchangeCount++;
            }
        });
        
        let upRatio = totalCount > 0 ? Math.round((upCount / totalCount) * 100 * 10)/10 : 0;
        let downRatio = totalCount > 0 ? Math.round((downCount / totalCount) * 100 * 10)/10 : 0;
        let unchangeRatio = Math.max(0, Math.round((100 - upRatio - downRatio) * 10)/10);
        let avgPriceChange = pricedCount > 0 ? (todayVal / pricedCount) : 0;
        
        sectorLiveStats[sector.icbCode] = { upRatio, downRatio, unchangeRatio, upCount, downCount, unchangeCount, avgPriceChange, totalCount, stocks };
    });
    
    // 2. Filter by Level
    const selectedLevel = window.currentThongKeLevel || 1;
    const validIcbMap = new Map();
    thongKeMappingCache.forEach(s => {
        if (s.icbLevel === selectedLevel) {
            validIcbMap.set(s.icbCode, s);
        }
    });
    
    let filteredData = thongKeDataCache.data.filter(s => validIcbMap.has(s.icbCode));
    
    // 3. Search Filter
    if (window.thongKeSearchQuery) {
        const q = window.thongKeSearchQuery.toLowerCase();
        filteredData = filteredData.filter(s => (s.sectorName || '').toLowerCase().includes(q) || s.icbCode.includes(q));
    }
    
    // 4. Sorting
    const sortMode = window.thongKeSortMode || 'roc_desc';
    filteredData.sort((a, b) => {
        const aRoc = a.latestROC || 0;
        const bRoc = b.latestROC || 0;
        const aPrice = sectorLiveStats[a.icbCode]?.avgPriceChange || 0;
        const bPrice = sectorLiveStats[b.icbCode]?.avgPriceChange || 0;
        const aUp = sectorLiveStats[a.icbCode]?.upRatio || 0;
        const bUp = sectorLiveStats[b.icbCode]?.upRatio || 0;
        
        if (sortMode === 'roc_desc') return bRoc - aRoc;
        if (sortMode === 'roc_asc') return aRoc - bRoc;
        if (sortMode === 'price_desc') return bPrice - aPrice;
        if (sortMode === 'price_asc') return aPrice - bPrice;
        if (sortMode === 'breadth_desc') return bUp - aUp;
        return 0;
    });

    // 5. Update KPI Cards
    updateThongKeKPIs(thongKeDataCache.data.filter(s => validIcbMap.has(s.icbCode)), sectorLiveStats);
    
    // 6. Render based on active view mode
    if (window.thongKeViewMode === 'cards') {
        renderThongKeCards(filteredData, sectorLiveStats);
    } else {
        renderThongKeMatrix(filteredData, sectorLiveStats);
    }
}

function updateThongKeKPIs(allSectors, liveStats) {
    if (!allSectors || allSectors.length === 0) return;
    
    let topInflow = allSectors[0];
    let topOutflow = allSectors[0];
    let topSurge = allSectors[0];
    let maxSurgeDelta = -999999;
    let upSectors = 0;
    let downSectors = 0;
    
    allSectors.forEach(s => {
        const roc = s.latestROC || 0;
        if (roc > (topInflow.latestROC || 0)) topInflow = s;
        if (roc < (topOutflow.latestROC || 0)) topOutflow = s;
        
        // Calculate surge delta (today vs yesterday)
        const hist = s.history || [];
        if (hist.length >= 2) {
            const yesterdayRoc = hist[hist.length - 2]?.roc || 0;
            const delta = roc - yesterdayRoc;
            if (delta > maxSurgeDelta) {
                maxSurgeDelta = delta;
                topSurge = s;
            }
        }
        
        if (roc > 0) upSectors++;
        else if (roc < 0) downSectors++;
    });
    
    // KPI 1: Top Inflow
    const topPrice = liveStats[topInflow.icbCode]?.avgPriceChange || 0;
    const elTopName = document.getElementById('tk_kpi_top_name');
    const elTopRoc = document.getElementById('tk_kpi_top_roc');
    const elTopPrice = document.getElementById('tk_kpi_top_price');
    if (elTopName) elTopName.innerText = topInflow.sectorName;
    if (elTopRoc) elTopRoc.innerText = (topInflow.latestROC > 0 ? '+' : '') + topInflow.latestROC.toFixed(1) + '%';
    if (elTopPrice) {
        elTopPrice.innerText = (topPrice > 0 ? '+' : '') + topPrice.toFixed(2) + '%';
        elTopPrice.style.color = topPrice >= 0 ? '#00e676' : '#ff5252';
    }
    
    // KPI 2: Top Outflow
    const botPrice = liveStats[topOutflow.icbCode]?.avgPriceChange || 0;
    const elBotName = document.getElementById('tk_kpi_bot_name');
    const elBotRoc = document.getElementById('tk_kpi_bot_roc');
    const elBotPrice = document.getElementById('tk_kpi_bot_price');
    if (elBotName) elBotName.innerText = topOutflow.sectorName;
    if (elBotRoc) elBotRoc.innerText = (topOutflow.latestROC > 0 ? '+' : '') + topOutflow.latestROC.toFixed(1) + '%';
    if (elBotPrice) {
        elBotPrice.innerText = (botPrice > 0 ? '+' : '') + botPrice.toFixed(2) + '%';
        elBotPrice.style.color = botPrice >= 0 ? '#00e676' : '#ff5252';
    }
    
    // KPI 3: Top Surge
    const elSurgeName = document.getElementById('tk_kpi_surge_name');
    const elSurgeRoc = document.getElementById('tk_kpi_surge_roc');
    const elSurgeDelta = document.getElementById('tk_kpi_surge_delta');
    if (elSurgeName) elSurgeName.innerText = topSurge.sectorName;
    if (elSurgeRoc) elSurgeRoc.innerText = (topSurge.latestROC > 0 ? '+' : '') + topSurge.latestROC.toFixed(1) + '%';
    if (elSurgeDelta) elSurgeDelta.innerText = (maxSurgeDelta > 0 ? '▲ +' : '▼ ') + maxSurgeDelta.toFixed(1) + '%';
    
    // KPI 4: Market Flow Breadth
    const totalSectors = allSectors.length;
    const upPct = totalSectors > 0 ? Math.round((upSectors / totalSectors) * 100) : 50;
    const downPct = 100 - upPct;
    const elBarUp = document.getElementById('tk_kpi_bar_up');
    const elBarDown = document.getElementById('tk_kpi_bar_down');
    const elCountUp = document.getElementById('tk_kpi_count_up');
    const elCountDown = document.getElementById('tk_kpi_count_down');
    const elSummary = document.getElementById('tk_kpi_breadth_summary');
    
    if (elBarUp) elBarUp.style.width = upPct + '%';
    if (elBarDown) elBarDown.style.width = downPct + '%';
    if (elCountUp) elCountUp.innerText = `${upSectors} ngành (${upPct}%)`;
    if (elCountDown) elCountDown.innerText = `${downSectors} ngành (${downPct}%)`;
    if (elSummary) elSummary.innerText = upPct >= 50 ? '🟢 Dòng tiền lan tỏa tích cực' : '🔴 Dòng tiền phân hóa thu hẹp';
}

function renderThongKeMatrix(sectors, liveStats) {
    const thead = document.querySelector('#thong_ke_table thead');
    const tbody = document.getElementById('thong_ke_body');
    if (!thead || !tbody) return;
    
    const sampleHistory = (thongKeDataCache.data[0] && thongKeDataCache.data[0].history) ? thongKeDataCache.data[0].history : [];
    const datesReversed = [...sampleHistory].reverse();
    
    // Build Table Header
    let theadHTML = `
        <tr>
            <th style="padding: 10px 14px; text-align: left; color: #9da2b4; font-weight: 700; font-size: 11px; text-transform: uppercase; min-width: 170px; background: #1a202c; border-bottom: 2px solid #2a2e39;">Ngành</th>
            <th style="padding: 10px 8px; text-align: center; color: #9da2b4; font-weight: 700; font-size: 11px; text-transform: uppercase; width: 85px; background: #1a202c; border-bottom: 2px solid #2a2e39;">Giá</th>
            <th style="padding: 10px 8px; text-align: center; color: #ffeb3b; font-weight: 700; font-size: 11px; text-transform: uppercase; width: 95px; background: #1a202c; border-bottom: 2px solid #2a2e39;">ROC Hôm nay</th>
    `;
    
    datesReversed.forEach(d => {
        const parts = d.date.split('-');
        const shortDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : d.date;
        theadHTML += `<th style="padding: 10px 4px; text-align: center; color: #787b86; font-weight: 600; font-size: 10px; width: 68px; background: #1a202c; border-bottom: 2px solid #2a2e39;">${shortDate}</th>`;
    });
    
    theadHTML += `
            <th style="padding: 10px 14px; text-align: center; color: #9da2b4; font-weight: 700; font-size: 11px; text-transform: uppercase; min-width: 220px; background: #1a202c; border-bottom: 2px solid #2a2e39;">Đà lan tỏa</th>
        </tr>
    `;
    thead.innerHTML = theadHTML;
    
    // Build Table Rows
    let rowsHTML = '';
    sectors.forEach(s => {
        const stat = liveStats[s.icbCode] || { upRatio: 0, downRatio: 0, unchangeRatio: 0, upCount: 0, downCount: 0, unchangeCount: 0, avgPriceChange: 0, totalCount: 0, stocks: [] };
        const priceVal = stat.avgPriceChange || 0;
        const priceColor = priceVal > 0 ? '#00e676' : (priceVal < 0 ? '#ff5252' : '#ffeb3b');
        const priceBg = priceVal > 0 ? 'rgba(0,230,118,0.12)' : (priceVal < 0 ? 'rgba(255,82,82,0.12)' : 'rgba(255,235,59,0.12)');
        
        const rocToday = s.latestROC || 0;
        const rocTodayStyle = getHeatChipStyle(rocToday);
        const icon = getSectorIcon(s.icbCode, s.sectorName);
        
        const hist = [...(s.history || [])].reverse();
        
        rowsHTML += `<tr class="tk-table-row">`;
        
        // Sector Name Cell
        rowsHTML += `
            <td style="padding: 6px 12px;">
                <div class="tk-sector-cell" onclick="openThongKeModal('${s.icbCode}', '${s.sectorName.replace(/'/g, "\\'")}')">
                    <span style="font-size: 16px; flex-shrink: 0;">${icon}</span>
                    <div style="min-width: 0; flex: 1;">
                        <span class="tk-sector-name" style="font-weight: 700; font-size: 12px; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">${s.sectorName}</span>
                        <span style="font-size: 10px; color: #787b86;">${stat.totalCount} mã</span>
                    </div>
                </div>
            </td>
        `;
        
        // Price Change Cell
        rowsHTML += `
            <td style="padding: 6px 6px; text-align: center;">
                <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; background: ${priceBg}; color: ${priceColor}; border: 1px solid ${priceColor}40;">
                    ${priceVal > 0 ? '▲ +' : (priceVal < 0 ? '▼ ' : '')}${priceVal.toFixed(2)}%
                </span>
            </td>
        `;
        
        // ROC Today Cell
        rowsHTML += `
            <td style="padding: 6px 6px; text-align: center;">
                <div class="tk-heat-chip" style="background: ${rocTodayStyle.bg}; color: ${rocTodayStyle.color}; border: ${rocTodayStyle.border}; box-shadow: ${rocTodayStyle.shadow}; font-size: 11px;">
                    ${rocToday > 0 ? '↑ +' : (rocToday < 0 ? '↓ ' : '')}${rocToday.toFixed(1)}%
                </div>
            </td>
        `;
        
        // Past 14 Sessions Heatmap Chips
        hist.forEach(d => {
            const style = getHeatChipStyle(d.roc);
            rowsHTML += `
                <td style="padding: 6px 3px; text-align: center;">
                    <div class="tk-heat-chip" style="background: ${style.bg}; color: ${style.color}; border: ${style.border}; box-shadow: ${style.shadow};" title="${d.date}: ${d.roc > 0 ? '+' : ''}${d.roc.toFixed(1)}%">
                        ${d.roc > 0 ? '+' : ''}${d.roc.toFixed(1)}%
                    </div>
                </td>
            `;
        });
        
        // Market Breadth Segmented Capsule Bar
        const upW = stat.upRatio || 0;
        const downW = stat.downRatio || 0;
        const uncW = Math.max(0, 100 - upW - downW);
        
        rowsHTML += `
            <td style="padding: 6px 14px; text-align: center;">
                <div style="display: flex; flex-direction: column; gap: 3px;">
                    <div style="display: flex; height: 14px; width: 100%; background: #262b3d; border-radius: 4px; overflow: hidden; gap: 1px;" title="Tăng: ${stat.upCount} (${upW}%) | Đứng giá: ${stat.unchangeCount} (${uncW.toFixed(1)}%) | Giảm: ${stat.downCount} (${downW}%)">
                        <div style="width: ${upW}%; background: #00e676; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #000; font-weight: 800;">${upW >= 15 ? upW + '%' : ''}</div>
                        <div style="width: ${uncW}%; background: #ffeb3b; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #000; font-weight: 800;"></div>
                        <div style="width: ${downW}%; background: #ff5252; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #fff; font-weight: 800;">${downW >= 15 ? downW + '%' : ''}</div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 10px; color: #787b86;">
                        <span style="color: #00e676; font-weight: 600;">▲ ${stat.upCount}</span>
                        <span style="color: #ffeb3b; font-weight: 600;">■ ${stat.unchangeCount}</span>
                        <span style="color: #ff5252; font-weight: 600;">▼ ${stat.downCount}</span>
                    </div>
                </div>
            </td>
        `;
        
        rowsHTML += `</tr>`;
    });
    
    tbody.innerHTML = rowsHTML;
}

function renderThongKeCards(sectors, liveStats) {
    const container = document.getElementById('thongke_view_cards');
    if (!container) return;
    
    let html = '';
    sectors.forEach(s => {
        const stat = liveStats[s.icbCode] || { upRatio: 0, downRatio: 0, unchangeRatio: 0, upCount: 0, downCount: 0, unchangeCount: 0, avgPriceChange: 0, totalCount: 0, stocks: [] };
        const priceVal = stat.avgPriceChange || 0;
        const priceColor = priceVal >= 0 ? '#00e676' : '#ff5252';
        const rocToday = s.latestROC || 0;
        const rocStyle = getHeatChipStyle(rocToday);
        const icon = getSectorIcon(s.icbCode, s.sectorName);
        
        const hist = [...(s.history || [])]; // chronological
        
        // Generate SVG Sparkline for ROC trend
        let sparklinePath = '';
        if (hist.length > 0) {
            const rocs = hist.map(h => h.roc);
            const minR = Math.min(...rocs, -50);
            const maxR = Math.max(...rocs, 50);
            const range = (maxR - minR) || 1;
            const w = 260;
            const h = 40;
            const pts = rocs.map((r, i) => {
                const x = (i / (rocs.length - 1)) * w;
                const y = h - ((r - minR) / range) * (h - 6) - 3;
                return `${x.toFixed(1)},${y.toFixed(1)}`;
            });
            sparklinePath = pts.join(' L ');
        }
        
        html += `
            <div class="tk-sector-card" onclick="openThongKeModal('${s.icbCode}', '${s.sectorName.replace(/'/g, "\\'")}')">
                <!-- Card Header -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 22px;">${icon}</span>
                        <div>
                            <div style="font-size: 14px; font-weight: 700; color: #ffffff;">${s.sectorName}</div>
                            <div style="font-size: 11px; color: #787b86;">${stat.totalCount} mã cổ phiếu</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 16px; font-weight: 800; color: ${rocStyle.color}; background: ${rocStyle.bg}; padding: 3px 8px; border-radius: 4px; display: inline-block;">
                            ${rocToday > 0 ? '+' : ''}${rocToday.toFixed(1)}%
                        </div>
                        <div style="font-size: 11px; color: ${priceColor}; font-weight: 700; margin-top: 3px;">
                            Giá: ${priceVal > 0 ? '+' : ''}${priceVal.toFixed(2)}%
                        </div>
                    </div>
                </div>

                <!-- Sparkline Chart -->
                <div style="background: #0e1118; border-radius: 6px; padding: 6px 10px; border: 1px solid #2a2e39;">
                    <div style="display: flex; justify-content: space-between; font-size: 10px; color: #787b86; margin-bottom: 4px;">
                        <span>Xu hướng dòng tiền (14 phiên)</span>
                        <span style="color: ${rocToday >= 0 ? '#00e676' : '#ff5252'}; font-weight: bold;">${rocToday >= 0 ? 'Đang hút tiền' : 'Đang rút tiền'}</span>
                    </div>
                    <svg viewBox="0 0 260 40" width="100%" height="40" style="overflow: visible;">
                        <defs>
                            <linearGradient id="spark_grad_${s.icbCode}" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="${rocToday >= 0 ? '#00e676' : '#ff5252'}" stop-opacity="0.3"/>
                                <stop offset="100%" stop-color="transparent"/>
                            </linearGradient>
                        </defs>
                        <line x1="0" y1="20" x2="260" y2="20" stroke="#2a2e39" stroke-dasharray="2,2"/>
                        ${sparklinePath ? `<path d="M ${sparklinePath}" fill="none" stroke="${rocToday >= 0 ? '#00e676' : '#ff5252'}" stroke-width="2"/>` : ''}
                    </svg>
                </div>

                <!-- Mini Timeline Heatmap -->
                <div style="display: flex; gap: 2px;">
                    ${[...hist].reverse().slice(0, 10).map(d => {
                        const st = getHeatChipStyle(d.roc);
                        return `<div style="flex: 1; height: 12px; border-radius: 2px; background: ${st.bg};" title="${d.date}: ${d.roc.toFixed(1)}%"></div>`;
                    }).join('')}
                </div>

                <!-- Breadth Capsule -->
                <div style="display: flex; flex-direction: column; gap: 3px; margin-top: 2px;">
                    <div style="display: flex; height: 10px; border-radius: 3px; overflow: hidden; background: #262b3d; gap: 1px;">
                        <div style="width: ${stat.upRatio}%; background: #00e676;"></div>
                        <div style="width: ${stat.unchangeRatio}%; background: #ffeb3b;"></div>
                        <div style="width: ${stat.downRatio}%; background: #ff5252;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 10px; color: #787b86;">
                        <span style="color: #00e676;">Tăng: ${stat.upCount}</span>
                        <span style="color: #ffeb3b;">Đứng: ${stat.unchangeCount}</span>
                        <span style="color: #ff5252;">Giảm: ${stat.downCount}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Controller Handlers
window.setThongKeLevel = function(lvl) {
    window.currentThongKeLevel = lvl;
    document.querySelectorAll('.tk-level-pill').forEach(btn => {
        if (parseInt(btn.getAttribute('data-lvl')) === lvl) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    renderThongKeNganh();
};

window.switchThongKeView = function(view) {
    window.thongKeViewMode = view;
    const btnMatrix = document.getElementById('btn_tk_view_matrix');
    const btnCards = document.getElementById('btn_tk_view_cards');
    const viewMatrix = document.getElementById('thongke_view_matrix');
    const viewCards = document.getElementById('thongke_view_cards');
    
    if (view === 'cards') {
        if(btnCards) btnCards.classList.add('active');
        if(btnMatrix) btnMatrix.classList.remove('active');
        if(viewCards) viewCards.style.display = 'grid';
        if(viewMatrix) viewMatrix.style.display = 'none';
    } else {
        if(btnMatrix) btnMatrix.classList.add('active');
        if(btnCards) btnCards.classList.remove('active');
        if(viewMatrix) viewMatrix.style.display = 'flex';
        if(viewCards) viewCards.style.display = 'none';
    }
    renderThongKeNganh();
};

window.onThongKeSearch = function(query) {
    window.thongKeSearchQuery = (query || '').trim();
    renderThongKeNganh();
};

window.onThongKeSortChange = function(val) {
    window.thongKeSortMode = val;
    renderThongKeNganh();
};

// Modal for Stocks in Sector
window.openThongKeModal = function(icbCode, sectorName) {
    const modal = document.getElementById('thongke_sector_modal');
    if (!modal) return;
    
    const icon = getSectorIcon(icbCode, sectorName);
    const titleEl = document.getElementById('tk_modal_title');
    const iconEl = document.getElementById('tk_modal_icon');
    const subEl = document.getElementById('tk_modal_sub');
    const contentEl = document.getElementById('tk_modal_content');
    
    if (titleEl) titleEl.innerText = sectorName;
    if (iconEl) iconEl.innerText = icon;
    
    let sectorObj = null;
    if (thongKeMappingCache) {
        sectorObj = thongKeMappingCache.find(s => s.icbCode === icbCode);
    }
    
    const stocks = sectorObj ? (sectorObj.stocks || []) : [];
    if (subEl) subEl.innerText = `Danh sách ${stocks.length} mã cổ phiếu trong ngành`;
    
    const livePrices = (typeof stockData !== 'undefined') ? stockData : {};
    
    let html = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 10px;">
    `;
    
    stocks.forEach(sym => {
        const live = livePrices[sym] || {};
        const rawPrice = live.price !== undefined ? live.price : (live.close !== undefined ? live.close : null);
        const ref = live.ref !== undefined ? live.ref : (live.prev_close !== undefined ? live.prev_close : null);
        const ceil = live.ceil || 0;
        const floor = live.floor || 0;
        
        let p = rawPrice !== null ? (rawPrice > 1000 ? rawPrice / 1000 : rawPrice) : null;
        let r = ref !== null ? (ref > 1000 ? ref / 1000 : ref) : null;
        
        let change = 0;
        let pct = 0;
        if (live.change !== undefined) {
            change = (live.change > 1000 || live.change < -1000) ? live.change / 1000 : live.change;
        } else if (p !== null && r !== null) {
            change = p - r;
        }
        
        if (live.pct_change !== undefined) {
            pct = live.pct_change;
        } else if (live.change_pct !== undefined) {
            pct = live.change_pct;
        } else if (r && r > 0) {
            pct = (change / r) * 100;
        }
        
        const priceStr = p !== null ? p.toFixed(2) : (r !== null ? r.toFixed(2) : '--');
        const changeStr = (change > 0 ? '+' : '') + change.toFixed(2);
        const pctStr = (pct > 0 ? '+' : '') + pct.toFixed(2) + '%';
        
        let color = '#ffeb3b'; // Default reference yellow
        if (p !== null && ceil > 0 && (p >= ceil || (ceil > 1000 && p >= ceil/1000))) {
            color = '#c471ed'; // Ceiling purple
        } else if (p !== null && floor > 0 && (p <= floor || (floor > 1000 && p <= floor/1000))) {
            color = '#00bcd4'; // Floor cyan
        } else if (change > 0.001) {
            color = '#00e676'; // Up green
        } else if (change < -0.001) {
            color = '#ff5252'; // Down red
        }
        
        const v = live.volume || 0;
        const volStr = v >= 1e6 ? (v / 1e6).toFixed(2) + 'M' : (v >= 1e3 ? (v / 1e3).toFixed(0) + 'K' : v.toString());
        
        html += `
            <div style="background: #131722; border: 1px solid #2a2e39; border-radius: 6px; padding: 10px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: border-color 0.2s;" onmouseover="this.style.borderColor='#2962ff'" onmouseout="this.style.borderColor='#2a2e39'" onclick="loadSymbolFromWatchlist('${sym}'); switchAppMode('cophieu'); closeThongKeModal();">
                <div>
                    <div style="font-weight: 800; font-size: 14px; color: ${color};">${sym}</div>
                    <div style="font-size: 11px; color: #787b86;">KL: ${volStr}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 700; font-size: 13px; color: #ffffff;">${priceStr}</div>
                    <div style="font-weight: 600; font-size: 11px; color: ${color};">${changeStr} (${pctStr})</div>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    if (contentEl) contentEl.innerHTML = html;
    
    modal.style.display = 'flex';
};

window.closeThongKeModal = function() {
    const modal = document.getElementById('thongke_sector_modal');
    if (modal) modal.style.display = 'none';
};







