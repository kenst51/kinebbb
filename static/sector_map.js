// ========================================================
// ICB INDUSTRY EXPLORER & HEATMAP 3.0 (MULTI-LEVEL SUPPORT)
// ========================================================

window.icbData = [];
window.icbStockQuotes = {};
window.icbCurrentSector = null;
window.icbSearchKeyword = '';
window.icbViewMode = 'overview'; // 'overview' or 'detail'
window.icbOverviewLevel = 1; // 1, 2, 3, or 4

const ICB_LEVEL1_ICONS = {
    '0001': '⚡', // Dầu khí
    '1000': '🏗️', // Nguyên vật liệu
    '2000': '🏭', // Công nghiệp
    '3000': '🛒', // Hàng Tiêu dùng
    '4000': '💊', // Dược phẩm và Y tế
    '5000': '🛍️', // Dịch vụ Tiêu dùng
    '6000': '📡', // Viễn thông
    '7000': '💡', // Tiện ích Cộng đồng
    '8000': '🏦', // Tài chính
    '9000': '💻'  // Công nghệ Thông tin
};

function getIcbIcon(code) {
    if (!code) return '📊';
    const prefix = code.substring(0, 1) + '000';
    if (code === '0001' || code.startsWith('05')) return '⚡';
    if (code.startsWith('83')) return '🏦'; // Ngân hàng
    if (code.startsWith('86')) return '🏢'; // Bất động sản
    if (code.startsWith('87')) return '📈'; // Dịch vụ tài chính / CK
    if (code.startsWith('85')) return '🛡️'; // Bảo hiểm
    if (code.startsWith('175')) return '🔩'; // Thép / Kim loại
    if (code.startsWith('13')) return '🧪'; // Hóa chất
    if (code.startsWith('23')) return '🧱'; // Xây dựng & VLXD
    if (code.startsWith('27')) return '🚢'; // Vận tải & Công nghiệp
    if (code.startsWith('35')) return '🥩'; // Thực phẩm & Đồ uống
    if (code.startsWith('53')) return '🚗'; // Bán lẻ
    if (code.startsWith('55')) return '📺'; // Truyền thông
    if (code.startsWith('57')) return '✈️'; // Du lịch & Giải trí
    return ICB_LEVEL1_ICONS[prefix] || ICB_LEVEL1_ICONS[code] || '📊';
}

function getIcbHeatmapStyle(pct) {
    if (pct === null || pct === undefined || isNaN(pct)) return { bg: 'rgba(255,255,255,0.03)', text: '#787b86' };
    if (pct === 0) return { bg: 'rgba(255, 235, 59, 0.08)', text: '#ffeb3b' };
    if (pct > 0) {
        let intensity = Math.min(Math.abs(pct) / 7, 1) * 0.20 + 0.06;
        return { bg: `rgba(0, 230, 118, ${intensity})`, text: '#00e676' };
    } else {
        let intensity = Math.min(Math.abs(pct) / 7, 1) * 0.20 + 0.06;
        return { bg: `rgba(255, 82, 82, ${intensity})`, text: '#ff5252' };
    }
}

// Parent-child matching helper across all 4 ICB levels
function getIcbChildren(parent) {
    const pCode = parent.icbCode || parent.name || '';
    const pLvl = parent.icbLevel || parent.level || 1;
    
    return window.icbData.filter(d => {
        const cCode = d.icbCode || d.name || '';
        const cLvl = d.icbLevel || d.level || 1;
        if (cLvl !== pLvl + 1) return false;
        
        if (pLvl === 1) {
            if (pCode === '0001' && cCode.startsWith('05')) return true;
            if (pCode !== '0001' && cCode[0] === pCode[0]) return true;
            return false;
        } else if (pLvl === 2) {
            return cCode.substring(0, 2) === pCode.substring(0, 2);
        } else if (pLvl === 3) {
            return cCode.substring(0, 3) === pCode.substring(0, 3);
        }
        return false;
    });
}

async function initSectorMap() {
    try {
        await fetchIcbTree();
        await pollIcbRealtimeQuotes();
        setInterval(pollIcbRealtimeQuotes, 5000);
    } catch (e) {
        console.error("Lỗi initSectorMap:", e);
    }
}
window.initSectorMap = initSectorMap;

async function fetchIcbTree() {
    try {
        const res = await fetch('/api/sectors/level2');
        const data = await res.json();
        
        if (Array.isArray(data) && data.length > 0) {
            window.icbData = data;
        } else {
            const res2 = await fetch('/api/vietcap/sectors/icb-codes');
            const json2 = await res2.json();
            window.icbData = json2.data || json2;
        }
        
        renderIcbSidebarTree();
        renderIcbOverviewGrid();
    } catch(e) {
        console.error('Lỗi tải ICB Tree:', e);
        const cont = document.getElementById('icbTreeContainer');
        if (cont) cont.innerHTML = '<div style="color: #ff5252; padding: 20px; text-align: center;">Lỗi nạp cây phân ngành ICB.</div>';
    }
}

// ----------------------------------------------------
// 1. Render Left Sidebar Navigation Tree
// ----------------------------------------------------
function renderIcbSidebarTree() {
    const container = document.getElementById('icbTreeContainer');
    if (!container) return;
    container.innerHTML = '';
    
    // Count sectors for each level
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    window.icbData.forEach(d => {
        const lvl = d.icbLevel || d.level || 1;
        if (counts[lvl] !== undefined) counts[lvl]++;
    });
    
    // Single clean "Tổng quan" item
    const overviewNode = document.createElement('div');
    overviewNode.className = `icb-tree-item ${window.icbViewMode === 'overview' ? 'active' : ''}`;
    overviewNode.id = 'icb_node_overview';
    overviewNode.onclick = () => {
        document.querySelectorAll('.icb-tree-item').forEach(el => el.classList.remove('active'));
        overviewNode.classList.add('active');
        showIcbOverview();
    };
    overviewNode.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
            <span style="font-size: 15px;">🌐</span>
            <span style="font-weight: 700; font-size: 13px; color: #ffffff;">Tổng quan</span>
        </div>
        <span class="icb-tree-badge">182</span>
    `;
    container.appendChild(overviewNode);
    
    // Tree Divider
    const divider = document.createElement('div');
    divider.style.cssText = 'padding: 8px 6px 4px; font-size: 10px; font-weight: 800; color: #787b86; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid rgba(255,255,255,0.06); margin-top: 4px; display: flex; justify-content: space-between; align-items: center;';
    divider.innerHTML = `<span>Cây phân cấp (182 ngành)</span><span>▶ Thu gọn</span>`;
    divider.style.cursor = 'pointer';
    divider.onclick = () => {
        document.querySelectorAll('.icb-tree-children').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.icb-tree-toggle').forEach(el => el.innerText = '▶');
    };
    container.appendChild(divider);
    
    // Level 1 Tree root items
    const level1 = window.icbData.filter(d => (d.icbLevel === 1 || d.level === 1) && d.name !== '8301');
    level1.sort((a,b) => (a.icbCode || a.name || '').localeCompare(b.icbCode || b.name || ''));
    
    level1.forEach(l1 => {
        const node = createIcbTreeNode(l1);
        container.appendChild(node);
    });
}

function createIcbTreeNode(data) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display: flex; flex-direction: column; width: 100%;';
    
    const code = data.icbCode || data.name || '';
    const name = (data.sectorName || data.viSector || data.enSector || '').replace(/\(\d+.*?\)/g, '').trim();
    const level = data.icbLevel || data.level || 1;
    const stocks = data.stocks || [];
    
    // Find children using accurate matching
    const children = getIcbChildren(data);
    const hasChildren = children.length > 0;
    
    const item = document.createElement('div');
    item.className = 'icb-tree-item';
    item.id = `icb_node_${code}`;
    item.dataset.code = code;
    
    const icon = getIcbIcon(code);
    
    item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
            <span style="font-size: 14px;">${icon}</span>
            <div style="min-width: 0; flex: 1;">
                <div style="font-size: 12px; font-weight: 600; color: #d1d4dc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${name}</div>
                <div style="font-size: 10px; color: #787b86;">${code} • Cấp ${level} ${stocks.length > 0 ? '• ' + stocks.length + ' mã' : ''}</div>
            </div>
        </div>
        <div style="display: flex; align-items: center; gap: 4px;">
            ${hasChildren ? `<span class="icb-tree-toggle" style="font-size: 9px; color: #787b86; padding: 2px 6px; border-radius: 3px; background: rgba(255,255,255,0.05);">▶</span>` : ''}
        </div>
    `;
    
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'icb-tree-children';
    childrenContainer.style.cssText = 'padding-left: 10px; border-left: 1px dashed rgba(255,255,255,0.15); margin-left: 14px; display: none; margin-top: 2px; margin-bottom: 2px;';
    
    if (hasChildren) {
        children.sort((a,b) => (a.icbCode || a.name || '').localeCompare(b.icbCode || b.name || '')).forEach(childData => {
            childrenContainer.appendChild(createIcbTreeNode(childData));
        });
    }
    
    item.onclick = (e) => {
        e.stopPropagation();
        document.querySelectorAll('.icb-tree-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        
        if (hasChildren) {
            const isShown = childrenContainer.style.display === 'flex';
            childrenContainer.style.display = isShown ? 'none' : 'flex';
            childrenContainer.style.flexDirection = 'column';
            const toggle = item.querySelector('.icb-tree-toggle');
            if (toggle) toggle.innerText = isShown ? '▶' : '▼';
        }
        
        loadSectorDetail(code, name, stocks, level, children);
    };
    
    wrapper.appendChild(item);
    wrapper.appendChild(childrenContainer);
    return wrapper;
}

// ----------------------------------------------------
// 2. Realtime Quotes Polling
// ----------------------------------------------------
async function pollIcbRealtimeQuotes() {
    try {
        let allSyms = new Set();
        window.icbData.forEach(d => {
            if (d.stocks && Array.isArray(d.stocks)) {
                d.stocks.forEach(s => allSyms.add(s));
            }
        });
        
        const symList = Array.from(allSyms).join(',');
        if (!symList) return;
        
        const res = await fetch(`/api/live_board?symbols=${symList}`);
        const data = await res.json();
        
        data.forEach(item => {
            if (!item.value && item.price && item.volume) {
                item.value = item.price * item.volume * 1000;
            }
            window.icbStockQuotes[item.symbol] = item;
        });
        
        if (window.icbViewMode === 'overview') {
            renderIcbOverviewGrid();
        } else if (window.icbCurrentSector) {
            renderSectorStocksTable(window.icbCurrentSector.stocks);
        }
    } catch(e) {}
}

// ----------------------------------------------------
// 3. Overview Grid Rendering (Configurable Levels 1, 2, 3, 4)
// ----------------------------------------------------
function setIcbOverviewLevel(lvl) {
    window.icbOverviewLevel = lvl;
    showIcbOverview();
}
window.setIcbOverviewLevel = setIcbOverviewLevel;

function showIcbOverview() {
    window.icbViewMode = 'overview';
    window.icbCurrentSector = null;
    
    const headerEl = document.getElementById('icbDetailHeader');
    if (headerEl) headerEl.style.display = 'none';
    
    const subGridEl = document.getElementById('icbSubSectorsWrapper');
    if (subGridEl) subGridEl.style.display = 'none';
    
    const gridEl = document.getElementById('icbOverviewGrid');
    if (gridEl) gridEl.style.display = 'flex';
    
    const tableEl = document.getElementById('icbStockTableWrapper');
    if (tableEl) tableEl.style.display = 'none';
    
    // Update active node in sidebar
    document.querySelectorAll('.icb-tree-item').forEach(el => el.classList.remove('active'));
    const overviewNode = document.getElementById('icb_node_overview');
    if (overviewNode) overviewNode.classList.add('active');
    
    renderIcbOverviewGrid();
}
window.showIcbOverview = showIcbOverview;

function renderIcbOverviewGrid() {
    const grid = document.getElementById('icbOverviewGrid');
    if (!grid) return;
    
    const lvl = window.icbOverviewLevel || 1;
    let sectors = window.icbData.filter(d => (d.icbLevel === lvl || d.level === lvl) && d.name !== '8301');
    if (window.icbSearchKeyword) {
        const kw = window.icbSearchKeyword.toLowerCase();
        sectors = sectors.filter(s => {
            const sName = (s.sectorName || s.viSector || s.enSector || '').toLowerCase();
            const sCode = (s.icbCode || s.name || '').toLowerCase();
            const hasStock = s.stocks && s.stocks.some(stk => stk.toLowerCase().includes(kw));
            return sName.includes(kw) || sCode.includes(kw) || hasStock;
        });
    }
    sectors.sort((a,b) => (a.icbCode || a.name || '').localeCompare(b.icbCode || b.name || ''));
    
    // Level Switcher Banner inside Overview
    const levelCounts = { 1: 10, 2: 20, 3: 43, 4: 109 };
    window.icbData.forEach(d => {
        const l = d.icbLevel || d.level || 1;
        if (levelCounts[l] !== undefined) levelCounts[l]++;
    });
    
    grid.innerHTML = `
        <!-- Top Overview Level Bar -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #131722; border: 1px solid #2a2e39; border-radius: 8px; margin-bottom: 12px; flex-shrink: 0; flex-wrap: wrap; gap: 10px; width: 100%; box-sizing: border-box;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 11px; font-weight: 700; color: #787b86; text-transform: uppercase;">Phân cấp hiển thị:</span>
                <div style="display: flex; background: #0e1118; padding: 2px; border-radius: 6px; border: 1px solid #2a2e39;">
                    <button class="rrg-level-btn rrg-tail-btn ${lvl === 1 ? 'active' : ''}" onclick="setIcbOverviewLevel(1)">🌐 Cấp 1 (10)</button>
                    <button class="rrg-level-btn rrg-tail-btn ${lvl === 2 ? 'active' : ''}" onclick="setIcbOverviewLevel(2)">🏢 Cấp 2 (20)</button>
                    <button class="rrg-level-btn rrg-tail-btn ${lvl === 3 ? 'active' : ''}" onclick="setIcbOverviewLevel(3)">🏭 Cấp 3 (43)</button>
                    <button class="rrg-level-btn rrg-tail-btn ${lvl === 4 ? 'active' : ''}" onclick="setIcbOverviewLevel(4)">🌿 Cấp 4 (109)</button>
                </div>
            </div>
        </div>

        <!-- Cards Grid Container -->
        <div id="icbCardsContainer" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 12px; width: 100%; box-sizing: border-box;"></div>
    `;
    
    const cardsContainer = document.getElementById('icbCardsContainer');
    
    sectors.forEach(sec => {
        const code = sec.icbCode || sec.name || '';
        const name = (sec.sectorName || sec.viSector || sec.enSector || '').replace(/\(\d+.*?\)/g, '').trim();
        const stocks = sec.stocks || [];
        const icon = getIcbIcon(code);
        const children = getIcbChildren(sec);
        
        const stats = calculateSectorStats(stocks);
        const style = getIcbHeatmapStyle(stats.avgChange);
        const sign = stats.avgChange > 0 ? '+' : '';
        
        const card = document.createElement('div');
        card.className = 'icb-overview-card';
        card.onclick = () => {
            loadSectorDetailByCode(code);
        };
        
        // Render subsector pills if any
        let subSectorPillsHtml = '';
        if (children.length > 0) {
            subSectorPillsHtml = `
                <div style="padding: 8px 14px; background: rgba(0,0,0,0.25); border-top: 1px solid rgba(255,255,255,0.04); display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
                    <span style="font-size: 10px; color: #787b86; font-weight: 700; text-transform: uppercase;">Ngành con (${children.length}):</span>
                    ${children.map(c => {
                        const cName = (c.sectorName || c.viSector || '').replace(/\(\d+.*?\)/g, '').trim();
                        const cCode = c.icbCode || c.name || '';
                        const cIcon = getIcbIcon(cCode);
                        return `<span class="icb-subsector-pill" onclick="event.stopPropagation(); loadSectorDetailByCode('${cCode}');">${cIcon} ${cName}</span>`;
                    }).join('')}
                </div>
            `;
        }
        
        card.innerHTML = `
            <div class="icb-card-top" style="border-left: 4px solid ${style.text};">
                <div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">
                    <div class="icb-card-icon">${icon}</div>
                    <div style="min-width: 0; flex: 1;">
                        <div style="font-weight: 800; font-size: 14px; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${name}">${name}</div>
                        <div style="font-size: 11px; color: #787b86;">Mã: <b>${code}</b> • Cấp ${lvl} • ${stocks.length} mã CP ${children.length > 0 ? '• ' + children.length + ' ngành con' : ''}</div>
                    </div>
                </div>
                <div style="text-align: right; flex-shrink: 0;">
                    <div style="font-size: 15px; font-weight: 900; font-family: var(--font-mono, monospace); color: ${style.text};">${sign}${stats.avgChange.toFixed(2)}%</div>
                    <div style="font-size: 11px; color: #787b86;">GTGD: <b style="color: #d1d4dc;">${stats.totalValStr}</b></div>
                </div>
            </div>
            
            <!-- Breadth bar -->
            <div style="padding: 8px 14px; background: rgba(0,0,0,0.15);">
                <div style="display: flex; width: 100%; height: 5px; border-radius: 3px; overflow: hidden; background: #2a2e39;">
                    <div style="width: ${stats.advPct}%; background: #00e676;" title="Tăng: ${stats.advCount} mã"></div>
                    <div style="width: ${stats.uncPct}%; background: #ffeb3b;" title="Đứng giá: ${stats.uncCount} mã"></div>
                    <div style="width: ${stats.decPct}%; background: #ff5252;" title="Giảm: ${stats.decCount} mã"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 4px;">
                    <span style="color: #00e676; font-weight: 700;">▲ ${stats.advCount} Tăng</span>
                    <span style="color: #ffeb3b; font-weight: 700;">■ ${stats.uncCount} Đứng</span>
                    <span style="color: #ff5252; font-weight: 700;">▼ ${stats.decCount} Giảm</span>
                </div>
            </div>
            
            <!-- Subsectors Pills List -->
            ${subSectorPillsHtml}
            
            <!-- Top Leaders -->
            <div class="icb-card-leaders">
                <span style="font-size: 10px; color: #787b86; font-weight: 700; text-transform: uppercase;">Dẫn đầu:</span>
                ${renderMiniLeaderChips(stocks)}
            </div>
        `;
        cardsContainer.appendChild(card);
    });
    
    updateTopKpis(sectors);
}

function updateTopKpis(sectors) {
    let topGainSector = null, topGainPct = -999;
    let topLoseSector = null, topLosePct = 999;
    let topValSector = null, maxVal = -1;
    
    sectors.forEach(sec => {
        const stocks = sec.stocks || [];
        const stats = calculateSectorStats(stocks);
        const name = (sec.sectorName || sec.viSector || sec.enSector || '').replace(/\(\d+.*?\)/g, '').trim();
        
        if (stats.avgChange > topGainPct && stats.totalVal > 0) {
            topGainPct = stats.avgChange;
            topGainSector = name;
        }
        if (stats.avgChange < topLosePct && stats.totalVal > 0) {
            topLosePct = stats.avgChange;
            topLoseSector = name;
        }
        if (stats.totalVal > maxVal) {
            maxVal = stats.totalVal;
            topValSector = name;
        }
    });
    
    const elGain = document.getElementById('icb_kpi_gain');
    const elLose = document.getElementById('icb_kpi_lose');
    const elVal = document.getElementById('icb_kpi_val');
    
    if (elGain && topGainSector) elGain.innerHTML = `${topGainSector} <b style="color: #00e676;">+${topGainPct.toFixed(2)}%</b>`;
    if (elLose && topLoseSector) elLose.innerHTML = `${topLoseSector} <b style="color: #ff5252;">${topLosePct.toFixed(2)}%</b>`;
    if (elVal && topValSector) {
        let valStr = maxVal >= 1000000000 ? (maxVal / 1000000000).toFixed(0) + ' tỷ' : maxVal >= 1000000 ? (maxVal / 1000000).toFixed(0) + ' tr' : '--';
        elVal.innerHTML = `${topValSector} <b style="color: #29b6f6;">${valStr}</b>`;
    }
}

function renderMiniLeaderChips(stocks) {
    let list = stocks.map(s => window.icbStockQuotes[s] || { symbol: s, price: 0, pct_change: 0 }).filter(s => s.price > 0);
    list.sort((a,b) => (b.pct_change || 0) - (a.pct_change || 0));
    let top = list.slice(0, 3);
    if (top.length === 0) return '<span style="font-size: 11px; color: #787b86;">--</span>';
    
    return top.map(item => {
        const c = item.pct_change > 0 ? '#00e676' : (item.pct_change < 0 ? '#ff5252' : '#ffeb3b');
        const sign = item.pct_change > 0 ? '+' : '';
        return `<span class="icb-leader-tag" onclick="event.stopPropagation(); handleIcbStockClick('${item.symbol}')"><b>${item.symbol}</b> <span style="color:${c}">${sign}${item.pct_change.toFixed(1)}%</span></span>`;
    }).join('');
}

function calculateSectorStats(stocks) {
    let advCount = 0, uncCount = 0, decCount = 0;
    let sumChange = 0, validCount = 0, totalVal = 0;
    
    stocks.forEach(sym => {
        const item = window.icbStockQuotes[sym];
        if (item && item.ref > 0) {
            validCount++;
            sumChange += (item.pct_change || 0);
            const sVal = item.value || (item.price && item.volume ? item.price * item.volume * 1000 : 0); totalVal += sVal;
            if (item.price > item.ref) advCount++;
            else if (item.price < item.ref) decCount++;
            else uncCount++;
        } else {
            uncCount++;
        }
    });
    
    let total = stocks.length || 1;
    let advPct = Math.round((advCount / total) * 100);
    let decPct = Math.round((decCount / total) * 100);
    let uncPct = Math.max(0, 100 - advPct - decPct);
    let avgChange = validCount > 0 ? (sumChange / validCount) : 0;
    
    let totalValStr = totalVal >= 1000000000 ? (totalVal / 1000000000).toFixed(0) + ' tỷ' : totalVal >= 1000000 ? (totalVal / 1000000).toFixed(0) + ' tr' : '--';
    
    return { advCount, uncCount, decCount, advPct, uncPct, decPct, avgChange, totalVal, totalValStr };
}

// ----------------------------------------------------
// 4. Sector Detail & Sub-Sectors Grid + Stock Table
// ----------------------------------------------------
window.loadSectorDetailByCode = function(code) {
    if (!code) return;
    const treeItem = document.getElementById(`icb_node_${code}`);
    if (treeItem) {
        document.querySelectorAll('.icb-tree-item').forEach(el => el.classList.remove('active'));
        treeItem.classList.add('active');
    }
    
    const item = window.icbData.find(d => (d.icbCode || d.name) === code);
    if (item) {
        const name = (item.sectorName || item.viSector || item.enSector || '').replace(/\(\d+.*?\)/g, '').trim();
        const stocks = item.stocks || [];
        const level = item.icbLevel || item.level || 1;
        const children = getIcbChildren(item);
        loadSectorDetail(code, name, stocks, level, children);
    }
};

async function loadSectorDetail(icbCode, sectorName, stocks, level, children) {
    window.icbViewMode = 'detail';
    window.icbCurrentSector = { icbCode, sectorName, stocks, level };
    
    const gridEl = document.getElementById('icbOverviewGrid');
    if (gridEl) gridEl.style.display = 'none';
    
    const headerEl = document.getElementById('icbDetailHeader');
    if (headerEl) headerEl.style.display = 'flex';
    
    const subGridEl = document.getElementById('icbSubSectorsWrapper');
    const tableEl = document.getElementById('icbStockTableWrapper');
    if (tableEl) {
        tableEl.style.display = 'flex';
        tableEl.style.flexDirection = 'column';
    }
    
    // Find children if not passed
    if (!children) {
        const parentObj = window.icbData.find(d => (d.icbCode || d.name) === icbCode);
        children = parentObj ? getIcbChildren(parentObj) : [];
    }
    
    // Render Sub-sectors horizontal card list if available
    if (subGridEl) {
        if (children && children.length > 0) {
            subGridEl.style.display = 'flex';
            renderSubSectorsGrid(children, subGridEl);
        } else {
            subGridEl.style.display = 'none';
        }
    }
    
    // If stocks array is empty, fetch from API
    if (!stocks || stocks.length === 0) {
        try {
            const res = await fetch(`/api/fialda/sector-stocks/${icbCode}`);
            const data = await res.json();
            stocks = data.symbols || [];
            window.icbCurrentSector.stocks = stocks;
        } catch(e) {
            stocks = [];
        }
    }
    
    // Update Header
    const icon = getIcbIcon(icbCode);
    const titleEl = document.getElementById('icbDetailTitle');
    const badgeEl = document.getElementById('icbDetailBadge');
    if (titleEl) titleEl.innerHTML = `<span style="font-size: 20px; margin-right: 6px;">${icon}</span> ${sectorName}`;
    if (badgeEl) badgeEl.innerText = `ICB ${icbCode} • Cấp ${level} • ${stocks.length} mã CP ${children && children.length > 0 ? '• ' + children.length + ' ngành con' : ''}`;
    
    if (stocks.length > 0) {
        try {
            const res = await fetch(`/api/live_board?symbols=${stocks.join(',')}`);
            const data = await res.json();
            data.forEach(item => {
                if (!item.value && item.price && item.volume) {
                    item.value = item.price * item.volume * 1000;
                }
                window.icbStockQuotes[item.symbol] = item;
            });
        } catch(e) {}
    }
    
    renderSectorStocksTable(stocks);
}
window.loadSectorDetail = loadSectorDetail;

function renderSubSectorsGrid(children, container) {
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 8px; width: 100%; padding: 12px 16px; background: #131722; border-bottom: 1px solid #2a2e39;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 12px; font-weight: 800; color: #9da2b4; text-transform: uppercase; letter-spacing: 0.5px;">🌿 CÁC PHÂN NGÀNH CON (${children.length})</span>
                <span style="font-size: 11px; color: #787b86;">Bấm vào ngành con để lọc cổ phiếu</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px;">
                ${children.map(c => {
                    const cCode = c.icbCode || c.name || '';
                    const cName = (c.sectorName || c.viSector || '').replace(/\(\d+.*?\)/g, '').trim();
                    const cStocks = c.stocks || [];
                    const cStats = calculateSectorStats(cStocks);
                    const cStyle = getIcbHeatmapStyle(cStats.avgChange);
                    const cSign = cStats.avgChange > 0 ? '+' : '';
                    const cIcon = getIcbIcon(cCode);
                    
                    return `
                        <div class="icb-subcard-item" onclick="loadSectorDetailByCode('${cCode}');">
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <div style="display: flex; align-items: center; gap: 6px; min-width: 0;">
                                    <span>${cIcon}</span>
                                    <span style="font-weight: 700; font-size: 12px; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${cName}">${cName}</span>
                                </div>
                                <span style="font-size: 12px; font-weight: 800; font-family: var(--font-mono, monospace); color: ${cStyle.text};">${cSign}${cStats.avgChange.toFixed(1)}%</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 10px; color: #787b86; margin-top: 4px;">
                                <span>${cCode} • ${cStocks.length} mã</span>
                                <span>GT: <b style="color: #d1d4dc;">${cStats.totalValStr}</b></span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function renderSectorStocksTable(stocks) {
    const tbody = document.getElementById('icbStockTbody');
    if (!tbody) return;
    
    let filteredStocks = stocks;
    if (window.icbSearchKeyword) {
        filteredStocks = filteredStocks.filter(s => s.toLowerCase().includes(window.icbSearchKeyword.toLowerCase()));
    }
    
    if (filteredStocks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px; color: #787b86;">Không có cổ phiếu nào phù hợp trong ngành này.</td></tr>`;
        return;
    }
    
    let stats = calculateSectorStats(stocks);
    const statChangeEl = document.getElementById('icbDetailStatChange');
    const statValEl = document.getElementById('icbDetailStatVal');
    const statBreadthEl = document.getElementById('icbDetailStatBreadth');
    
    if (statChangeEl) {
        const sign = stats.avgChange > 0 ? '+' : '';
        const c = stats.avgChange > 0 ? '#00e676' : (stats.avgChange < 0 ? '#ff5252' : '#ffeb3b');
        statChangeEl.innerHTML = `<span style="color:${c}">${sign}${stats.avgChange.toFixed(2)}%</span>`;
    }
    if (statValEl) statValEl.innerText = stats.totalValStr;
    if (statBreadthEl) {
        statBreadthEl.innerHTML = `<span style="color:#00e676">▲ ${stats.advCount}</span> <span style="color:#ffeb3b">■ ${stats.uncCount}</span> <span style="color:#ff5252">▼ ${stats.decCount}</span>`;
    }
    
    let stt = 1;
    tbody.innerHTML = filteredStocks.map(sym => {
        const item = window.icbStockQuotes[sym] || { symbol: sym, price: 0, ref: 0, ceil: 0, floor: 0, pct_change: 0, volume: 0, value: 0 };
        const style = getIcbHeatmapStyle(item.pct_change);
        const priceStr = item.price > 0 ? item.price.toFixed(2) : '--';
        const pctStr = item.price > 0 ? (item.pct_change > 0 ? `+${item.pct_change.toFixed(2)}%` : `${item.pct_change.toFixed(2)}%`) : '--';
        let v = item.volume || 0;
        let vStr = v >= 1000000 ? (v / 1000000).toFixed(2) + 'M' : v >= 1000 ? (v / 1000).toFixed(1) + 'K' : (v > 0 ? v.toString() : '--');
        let valRaw = item.value || (item.price && item.volume ? item.price * item.volume * 1000 : 0);
        let valStr = valRaw >= 1000000000 ? (valRaw / 1000000000).toFixed(1) + ' tỷ' : valRaw >= 1000000 ? (valRaw / 1000000).toFixed(0) + ' tr' : (valRaw > 0 ? (valRaw / 1000).toFixed(0) + ' K' : '--');
        
        return `
            <tr class="icb-stock-row" style="cursor: pointer; background: ${style.bg}; border-bottom: 1px solid rgba(255,255,255,0.03);" onclick="handleIcbStockClick('${sym}')" title="Nhấp để xem biểu đồ nến kỹ thuật ${sym}">
                <td style="padding: 10px 14px; color: #787b86; font-size: 11px; width: 40px;">${stt++}</td>
                <td style="padding: 10px 14px; font-weight: 800; font-size: 13px;">
                    <span class="icb-stock-ticker" style="color: ${style.text};">${sym}</span>
                </td>
                <td style="padding: 10px 14px; text-align: right; font-weight: 700; color: ${style.text}; font-family: var(--font-mono, monospace); font-size: 13px;">${priceStr}</td>
                <td style="padding: 10px 14px; text-align: right; font-weight: 700; color: ${style.text}; font-family: var(--font-mono, monospace);">${pctStr}</td>
                <td style="padding: 10px 14px; text-align: right; font-family: var(--font-mono, monospace); color: #d1d4dc;">${vStr}</td>
                <td style="padding: 10px 14px; text-align: right; font-family: var(--font-mono, monospace); color: #d1d4dc;">${valStr}</td>
            </tr>
        `;
    }).join('');
}

window.handleIcbStockClick = function(sym) {
    if (!sym) return;
    if (typeof switchAppMode === 'function' && typeof window.loadSymbol === 'function') {
        switchAppMode('cophieu');
        window.loadSymbol(sym);
    }
};

window.clearIcbSearch = function() {
    const input = document.getElementById('icbSearchBox');
    if (input) {
        input.value = '';
        input.focus();
        onIcbSearchInput('');
    }
};

window.onIcbSearchInput = function(val) {
    window.icbSearchKeyword = val.trim();
    const clearBtn = document.getElementById('icbSearchClearBtn');
    if (clearBtn) {
        clearBtn.style.display = window.icbSearchKeyword ? 'flex' : 'none';
    }
    if (window.icbViewMode === 'detail' && window.icbCurrentSector) {
        renderSectorStocksTable(window.icbCurrentSector.stocks);
    } else if (window.icbViewMode === 'overview') {
        renderIcbOverviewGrid();
    }
};

window.openCurrentSectorRrg = function() {
    if (typeof openRrgModal === 'function') {
        if (window.icbViewMode === 'detail' && window.icbCurrentSector && window.icbCurrentSector.stocks && window.icbCurrentSector.stocks.length > 0) {
            openRrgModal('sector');
        } else {
            const currentLevel = window.icbOverviewLevel || 1;
            openRrgModal('all_sectors', null, 'industry', currentLevel);
        }
    }
};
