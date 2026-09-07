// ==========================================================
// RRG 2.0 - RELATIVE ROTATION GRAPH (DATA DASHBOARD ENGINE)
// ==========================================================

let rrgCurrentExchange = 'ALL';
let rrgCurrentIcb = 'ALL';
let rrgTreeData = [];

window.rrgCurrentType = 'stock';
window.rrgCurrentBasket = 'ALL';
window.rrgBreadthMode = 'value'; // 'value' (GTGD) | 'count' (Số mã)
window.rrgValueSummary = null;
window.rrgCurrentLevel = 1;
window.rrgViewMode = 'dashboard'; // 'dashboard' | 'grid' | 'tabs' | 'table'
window.rrgCurrentSingleTab = 'dandat'; // 'dandat' | 'caithien' | 'suyyeu' | 'tuthao'
window.rrgSortKey = 'mom_desc';
window.rrgSearchQuery = '';
window.rrgDashboardScope = 'all'; // 'all' | 'strong' | 'top'
window.rrgDashboardChartInstance = null;

window.rrgDataCache = null;
window.rrgAllItems = [];

window.setRrgBasket = function(basket) {
    window.rrgCurrentBasket = basket;
    const btns = document.querySelectorAll('#rrg_basket_btns .rrg-btn');
    btns.forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-basket') === basket);
    });
    loadRrgStats(false);
};

window.toggleRrgBreadthMode = function(mode) {
    window.rrgBreadthMode = mode;
    const btnVal = document.getElementById('btn_rrg_breadth_val');
    const btnCnt = document.getElementById('btn_rrg_breadth_cnt');
    if (btnVal) {
        btnVal.classList.toggle('active', mode === 'value');
        btnVal.style.background = (mode === 'value') ? 'rgba(41,98,255,0.3)' : 'transparent';
        btnVal.style.color = (mode === 'value') ? '#ffffff' : '#787b86';
    }
    if (btnCnt) {
        btnCnt.classList.toggle('active', mode === 'count');
        btnCnt.style.background = (mode === 'count') ? 'rgba(41,98,255,0.3)' : 'transparent';
        btnCnt.style.color = (mode === 'count') ? '#ffffff' : '#787b86';
    }
    if (window.rrgDataCache) {
        renderRrgKpis(window.rrgDataCache);
    }
};

// ----------------------------------------------------------
// View Mode & Tab Switching
// ----------------------------------------------------------

window.switchRrgViewMode = function(mode) {
    window.rrgViewMode = mode;
    
    const btnDash = document.getElementById('btn_rrg_mode_dashboard');
    const btnGrid = document.getElementById('btn_rrg_mode_grid');
    const btnTabs = document.getElementById('btn_rrg_mode_tabs');
    const btnTable = document.getElementById('btn_rrg_mode_table');
    
    if (btnDash) btnDash.classList.toggle('active', mode === 'dashboard');
    if (btnGrid) btnGrid.classList.toggle('active', mode === 'grid');
    if (btnTabs) btnTabs.classList.toggle('active', mode === 'tabs');
    if (btnTable) btnTable.classList.toggle('active', mode === 'table');
    
    const viewDash = document.getElementById('rrg_view_dashboard');
    const viewGrid = document.getElementById('rrg_view_grid');
    const viewTabs = document.getElementById('rrg_view_tabs');
    const viewTable = document.getElementById('rrg_view_table');
    
    if (viewDash) viewDash.style.display = (mode === 'dashboard') ? 'flex' : 'none';
    if (viewGrid) viewGrid.style.display = (mode === 'grid') ? 'grid' : 'none';
    if (viewTabs) viewTabs.style.display = (mode === 'tabs') ? 'flex' : 'none';
    if (viewTable) viewTable.style.display = (mode === 'table') ? 'flex' : 'none';
    
    window.renderRrgAllViews();
    if (mode === 'dashboard' && window.rrgDashboardChartInstance) {
        setTimeout(() => { window.rrgDashboardChartInstance.resize(); }, 50);
    }
};

window.setDashboardChartScope = function(scope) {
    window.rrgDashboardScope = scope;
    ['all', 'strong', 'top'].forEach(s => {
        const btn = document.getElementById(`btn_dash_scope_${s}`);
        if (btn) btn.classList.toggle('active', s === scope);
    });
    if (window.rrgViewMode === 'dashboard') {
        renderRrgDashboardView();
    }
};

window.resetDashboardChartZoom = function() {
    if (window.rrgDashboardChartInstance) {
        window.rrgDashboardChartInstance.dispatchAction({ type: 'restore' });
    }
};

window.switchRrgSingleTab = function(tabKey) {
    window.rrgCurrentSingleTab = tabKey;
    
    const keys = ['dandat', 'caithien', 'suyyeu', 'tuthao'];
    keys.forEach(k => {
        const btn = document.getElementById(`btn_rrg_filter_${k}`);
        if (btn) {
            if (k === tabKey) {
                btn.classList.add('active');
                if (k === 'dandat') btn.style.color = '#00e676';
                else if (k === 'caithien') btn.style.color = '#448aff';
                else if (k === 'suyyeu') btn.style.color = '#ff9800';
                else if (k === 'tuthao') btn.style.color = '#ff5252';
            } else {
                btn.classList.remove('active');
                btn.style.color = '#787b86';
            }
        }
    });
    
    window.renderRrgTabsView();
};

window.switchRrgType = function(type) {
    window.rrgCurrentType = type;
    const tabStock = document.getElementById('rrg_tab_stock');
    const tabInd = document.getElementById('rrg_tab_industry');
    const basketWrap = document.getElementById('rrg_basket_filter_wrap');
    const floorWrap = document.getElementById('rrg_floor_filter_wrap');
    const indContainer = document.getElementById('rrg_industry_container');
    const searchWrap = document.getElementById('rrg_search_wrap');
    const levels = document.getElementById('rrg_industry_levels');
    
    if (type === 'stock') {
        if (tabStock) tabStock.classList.add('active');
        if (tabInd) tabInd.classList.remove('active');
        if (basketWrap) basketWrap.style.display = 'flex';
        if (floorWrap) floorWrap.style.display = 'flex';
        if (indContainer) indContainer.style.display = 'flex';
        if (searchWrap) searchWrap.style.display = 'flex';
        if (levels) levels.style.display = 'none';
        document.querySelectorAll('.rrg_col_ma').forEach(e => { e.style.display = 'table-cell'; e.innerHTML = 'Mã'; });
        document.querySelectorAll('.rrg_col_ten').forEach(e => e.innerHTML = 'Doanh nghiệp');
    } else {
        if (tabInd) tabInd.classList.add('active');
        if (tabStock) tabStock.classList.remove('active');
        if (basketWrap) basketWrap.style.display = 'none';
        if (floorWrap) floorWrap.style.display = 'none';
        if (indContainer) indContainer.style.display = 'none';
        if (searchWrap) searchWrap.style.display = 'none';
        if (levels) levels.style.display = 'flex';
        document.querySelectorAll('.rrg_col_ma').forEach(e => { e.style.display = 'none'; });
        document.querySelectorAll('.rrg_col_ten').forEach(e => e.innerHTML = 'Tên Ngành');
        
        // Luôn đồng bộ nút cấp độ active với level đang chọn
        document.querySelectorAll('.rrg-level-btn').forEach(btn => {
            const btnLvl = parseInt(btn.getAttribute('data-level'));
            btn.classList.toggle('active', btnLvl === (window.rrgCurrentLevel || 1));
        });
    }
    loadRrgStats();
};

window.setRrgLevel = function(lvl) {
    window.rrgCurrentLevel = lvl;
    document.querySelectorAll('.rrg-level-btn').forEach(btn => {
        if (parseInt(btn.getAttribute('data-level')) === lvl) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    loadRrgStats();
};

window.onRrgSortSelectChange = function(val) {
    window.rrgSortKey = val;
    window.renderRrgAllViews();
};

window.clearRrgIndustry = function() {
    rrgCurrentIcb = 'ALL';
    const label = document.getElementById('rrg_industry_label');
    if (label) label.innerText = 'Ngành: Tất cả';
    const popover = document.getElementById('rrg_industry_popover');
    if (popover) popover.style.display = 'none';
    loadRrgStats();
};

// ----------------------------------------------------------
// Sparkline SVG Generator (10 Sessions)
// ----------------------------------------------------------

function generateSparklineSvg(history, color) {
    if (!history || history.length < 2) {
        return `<span style="color:#555; font-size: 11px;">--</span>`;
    }
    const pts = history.slice(-10);
    const values = pts.map(p => (p.mom !== undefined ? p.mom : p.ratio));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = (max - min) || 0.01;
    const w = 70;
    const h = 20;
    
    const coords = values.map((v, i) => {
        const x = (i / (values.length - 1)) * (w - 6) + 3;
        const y = h - 3 - ((v - min) / range) * (h - 7);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    
    const lastCoord = coords.split(' ').pop().split(',');
    
    return `<svg width="${w}" height="${h}" style="vertical-align: middle; overflow: visible;">
        <polyline fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" points="${coords}" />
        <circle cx="${lastCoord[0]}" cy="${lastCoord[1]}" r="2.5" fill="${color}" />
    </svg>`;
}

// ----------------------------------------------------------
// Sorting & Filtering Utility
// ----------------------------------------------------------

function getSortedAndFilteredList(list) {
    if (!list) return [];
    let res = [...list];
    
    // Search Query Filter
    if (window.rrgSearchQuery && window.rrgSearchQuery.trim()) {
        const q = window.rrgSearchQuery.trim().toLowerCase();
        res = res.filter(item => 
            (item.symbol && item.symbol.toLowerCase().includes(q)) || 
            (item.name && item.name.toLowerCase().includes(q))
        );
    }
    
    // Sort logic
    const sortKey = window.rrgSortKey || 'mom_desc';
    res.sort((a, b) => {
        if (sortKey === 'mom_desc') return (b.mom || 0) - (a.mom || 0);
        if (sortKey === 'mom_asc') return (a.mom || 0) - (b.mom || 0);
        if (sortKey === 'ratio_desc') return (b.ratio || 0) - (a.ratio || 0);
        if (sortKey === 'ratio_asc') return (a.ratio || 0) - (b.ratio || 0);
        if (sortKey === 'diff_desc') return (b.m_diff || 0) - (a.m_diff || 0);
        if (sortKey === 'name_asc') return (a.symbol || a.name || '').localeCompare(b.symbol || b.name || '');
        return 0;
    });
    
    return res;
}

// ----------------------------------------------------------
// Rendering Logic
// ----------------------------------------------------------

window.renderRrgAllViews = function() {
    if (!window.rrgDataCache) return;
    renderRrgKpis(window.rrgDataCache);
    if (window.rrgViewMode === 'dashboard') {
        renderRrgDashboardView();
    } else if (window.rrgViewMode === 'grid') {
        renderRrgGridView();
    } else if (window.rrgViewMode === 'tabs') {
        renderRrgTabsView();
    } else if (window.rrgViewMode === 'table') {
        renderRrgTableView();
    }
};

function renderRrgDashboardView() {
    if (!window.rrgDataCache) return;
    const dandat = window.rrgDataCache.dandat || [];
    const caithien = window.rrgDataCache.caithien || [];
    const suyyeu = window.rrgDataCache.suyyeu || [];
    const tuthao = window.rrgDataCache.tuthao || [];
    const total = (dandat.length + caithien.length + suyyeu.length + tuthao.length) || 1;

    // 1. Update Market Cycle & Sentiment Card
    const leadingPct = ((dandat.length / total) * 100).toFixed(1);
    const momPct = (((dandat.length + caithien.length) / total) * 100).toFixed(1);

    const leadVal = document.getElementById('rrg_dash_leading_power_val');
    if (leadVal) leadVal.innerText = `${leadingPct}% (${dandat.length} mã)`;
    const leadBar = document.getElementById('rrg_dash_leading_power_bar');
    if (leadBar) leadBar.style.width = `${Math.min(100, Math.max(5, leadingPct))}%`;

    const momVal = document.getElementById('rrg_dash_mom_index_val');
    if (momVal) momVal.innerText = `${momPct}% (${dandat.length + caithien.length} mã)`;
    const momBar = document.getElementById('rrg_dash_mom_index_bar');
    if (momBar) momBar.style.width = `${Math.min(100, Math.max(5, momPct))}%`;

    const stateEl = document.getElementById('rrg_dash_market_state');
    const flowIcon = document.getElementById('rrg_dash_flow_icon');
    const flowTitle = document.getElementById('rrg_dash_flow_title');
    const flowDesc = document.getElementById('rrg_dash_flow_desc');

    const isBullFlow = (dandat.length + caithien.length) >= (suyyeu.length + tuthao.length);
    if (isBullFlow) {
        if (stateEl) {
            stateEl.innerText = '🟢 DÒNG TIỀN LAN TỎA';
            stateEl.style.color = '#00e676';
            stateEl.style.background = 'rgba(0, 230, 118, 0.15)';
            stateEl.style.border = '1px solid rgba(0, 230, 118, 0.3)';
        }
        if (flowIcon) flowIcon.innerText = '⚡';
        if (flowTitle) flowTitle.innerText = 'Luân chuyển tích cực: Tích lũy ➔ Tăng giá';
        if (flowDesc) flowDesc.innerText = `Có ${dandat.length + caithien.length} mã giữ nhịp đà tăng và tích lũy mạnh mẽ.`;
    } else {
        if (stateEl) {
            stateEl.innerText = '🟡 THỊ TRƯỜNG PHÂN HÓA';
            stateEl.style.color = '#ffab00';
            stateEl.style.background = 'rgba(255, 171, 0, 0.15)';
            stateEl.style.border = '1px solid rgba(255, 171, 0, 0.3)';
        }
        if (flowIcon) flowIcon.innerText = '🔄';
        if (flowTitle) flowTitle.innerText = 'Dòng tiền phòng thủ: Suy yếu ➔ Giảm giá';
        if (flowDesc) flowDesc.innerText = `Áp lực điều chỉnh còn cao, ưu tiên mã bứt phá độc lập.`;
    }

    // 2. Render Top Movers Table
    const topMoversTbody = document.getElementById('rrg_dash_top_movers_tbody');
    if (topMoversTbody) {
        let mergedLeaders = [];
        [
            { list: dandat, phaseName: 'Tăng giá', color: '#00e676' },
            { list: caithien, phaseName: 'Tích lũy', color: '#448aff' },
            { list: suyyeu, phaseName: 'Suy yếu', color: '#ff9800' }
        ].forEach(group => {
            group.list.forEach(item => {
                mergedLeaders.push({ ...item, phaseName: group.phaseName, color: group.color });
            });
        });

        mergedLeaders = getSortedAndFilteredList(mergedLeaders);
        const topSlice = mergedLeaders.slice(0, 6);

        let moversHtml = '';
        topSlice.forEach(item => {
            const mDiffStr = (item.m_diff !== undefined) ? (item.m_diff > 0 ? `+${item.m_diff.toFixed(2)}` : item.m_diff.toFixed(2)) : '';
            const mColor = (item.m_diff >= 0) ? '#00e676' : '#ff5252';
            const sparkline = generateSparklineSvg(item.history, item.color);

            moversHtml += `
                <tr style="cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.15s;"
                    onmouseenter="this.style.background='rgba(255,255,255,0.05)'"
                    onmouseleave="this.style.background='transparent'"
                    onclick="handleRrgItemClick('${item.symbol}')">
                    <td style="font-weight: 800; color: ${item.color}; font-size: 13px;">${item.symbol}</td>
                    <td style="font-weight: 500; color: #ffffff; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${item.name || item.symbol}">${item.name || item.symbol}</td>
                    <td style="text-align: center;">
                        <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: ${item.color}18; color: ${item.color}; border: 1px solid ${item.color}33;">
                            ${item.phaseName}
                        </span>
                    </td>
                    <td style="color: ${mColor}; text-align: right; font-family: var(--font-mono, monospace);">
                        <b>${item.mom ? item.mom.toFixed(1) : '--'}</b>
                        ${mDiffStr ? `<span style="font-size: 10px; opacity: 0.85; margin-left: 2px;">(${mDiffStr})</span>` : ''}
                    </td>
                    <td style="text-align: center;">${sparkline}</td>
                </tr>
            `;
        });

        if (topSlice.length === 0) {
            moversHtml = `<tr><td colspan="5" style="text-align: center; padding: 30px; color: #787b86;">Không có mã phù hợp</td></tr>`;
        }
        topMoversTbody.innerHTML = moversHtml;
    }

    // 3. Render Sector Matrix & Heatmap Bento
    renderRrgDashboardMatrix();
}

window.matrixSubView = 'heatmap'; // 'heatmap' | 'spectrum' | 'clusters'
window.rrgSectorDataCache = null;

window.switchMatrixSubView = function(view) {
    window.matrixSubView = view;
    ['heatmap', 'spectrum', 'clusters'].forEach(v => {
        const btn = document.getElementById(`btn_matrix_mode_${v}`);
        if (btn) btn.classList.toggle('active', v === view);
    });

    const subHeat = document.getElementById('rrg_matrix_sub_heatmap');
    const subSpec = document.getElementById('rrg_matrix_sub_spectrum');
    const subClust = document.getElementById('rrg_matrix_sub_clusters');

    if (subHeat) subHeat.style.display = (view === 'heatmap') ? 'grid' : 'none';
    if (subSpec) subSpec.style.display = (view === 'spectrum') ? 'flex' : 'none';
    if (subClust) subClust.style.display = (view === 'clusters') ? 'grid' : 'none';

    renderRrgDashboardMatrix();
};

window.selectRrgSectorFromMatrix = function(icbCode, icbName) {
    if (!icbCode) return;
    // Bỏ chức năng lọc: Chỉ mở Modal Radar RRG của ngành đó
    if (typeof openRrgModal === 'function') {
        openRrgModal('sector', icbCode, 'industry');
    }
};

window.rrgSectorLevel2DefaultCache = null;

async function loadSectorMatrixData(forceRefresh = false) {
    if (window.rrgSectorLevel2DefaultCache && !forceRefresh) {
        return window.rrgSectorLevel2DefaultCache;
    }
    try {
        const res = await fetch('/api/rrg-stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ exchange: 'ALL', icbCode: '', type: 'industry', level: 2 })
        });
        const data = await res.json();
        if (data && data.data) {
            window.rrgSectorLevel2DefaultCache = data.data;
            return window.rrgSectorLevel2DefaultCache;
        }
    } catch(err) {
        console.error('Error fetching sector level 2 data for stock matrix:', err);
    }
    return null;
}

async function renderRrgDashboardMatrix() {
    let sectorData = null;
    if (window.rrgCurrentType === 'stock') {
        // Tab CỔ PHIẾU: LUÔN DÙNG 20 NGÀNH CẤP 2 (MẶC ĐỊNH BẤT BIẾN)
        if (!window.rrgSectorLevel2DefaultCache) {
            // Hiển thị khung chờ nhanh nếu chưa có
            const subHeat = document.getElementById('rrg_matrix_sub_heatmap');
            if (subHeat && (!subHeat.children || subHeat.children.length === 0)) {
                subHeat.innerHTML = Array(8).fill(0).map(() => `
                    <div class="rrg-bento-sector-card" style="background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.08); min-height: 80px; display: flex; flex-direction: column; justify-content: space-between; padding: 10px;">
                        <div style="height: 14px; width: 65%; background: rgba(255,255,255,0.08); border-radius: 4px;"></div>
                        <div style="height: 10px; width: 85%; background: rgba(255,255,255,0.04); border-radius: 4px;"></div>
                    </div>
                `).join('');
            }
            sectorData = await loadSectorMatrixData();
        } else {
            sectorData = window.rrgSectorLevel2DefaultCache;
        }
        // Luôn cập nhật badge ở tab Cổ phiếu là 20 Nhóm Ngành
        const badge = document.getElementById('rrg_matrix_badge');
        if (badge) badge.innerText = `20 Nhóm Ngành`;
    } else {
        // Tab NGÀNH: DÙNG TRỰC TIẾP DỮ LIỆU CẤP ĐỘ ĐANG CHỌN (C1, C2, C3, C4)
        sectorData = window.rrgDataCache;
        if (sectorData) {
            const total = ((sectorData.dandat || []).length + (sectorData.caithien || []).length + (sectorData.suyyeu || []).length + (sectorData.tuthao || []).length);
            const badge = document.getElementById('rrg_matrix_badge');
            if (badge && total > 0) badge.innerText = `${total} Nhóm Ngành`;
        }
    }
    
    if (!sectorData) return;

    if (!window.matrixSubView) window.matrixSubView = 'heatmap';

    const subHeat = document.getElementById('rrg_matrix_sub_heatmap');
    const subSpec = document.getElementById('rrg_matrix_sub_spectrum');
    const subClust = document.getElementById('rrg_matrix_sub_clusters');

    if (subHeat) subHeat.style.display = (window.matrixSubView === 'heatmap') ? 'grid' : 'none';
    if (subSpec) subSpec.style.display = (window.matrixSubView === 'spectrum') ? 'flex' : 'none';
    if (subClust) subClust.style.display = (window.matrixSubView === 'clusters') ? 'grid' : 'none';

    if (window.matrixSubView === 'heatmap') {
        renderSectorHeatmapBento(sectorData);
    } else if (window.matrixSubView === 'spectrum') {
        renderSectorSpectrumTable(sectorData);
    } else if (window.matrixSubView === 'clusters') {
        renderSectorClusters(sectorData);
    }

    // TUYỆT ĐỐI KHÔNG GỌI renderRrgKpis KHI Ở TAB CỔ PHIẾU ĐỂ KHÔNG BỊ ĐÈ KPI DÒNG TIỀN VÀ CỔ PHIẾU!
    if (window.rrgCurrentType === 'industry') {
        renderRrgKpis(sectorData);
    }
}

function renderSectorHeatmapBento(data) {
    const container = document.getElementById('rrg_matrix_sub_heatmap') || document.getElementById('rrg_matrix_bento_grid');
    if (!container) return;

    const configs = [
        { key: 'dandat', name: 'TĂNG GIÁ', tag: 'Dẫn dắt', color: '#00e676', bg: 'rgba(0, 230, 118, 0.06)', border: 'rgba(0, 230, 118, 0.22)', list: data.dandat || [] },
        { key: 'caithien', name: 'TÍCH LŨY', tag: 'Tăng tốc', color: '#448aff', bg: 'rgba(68, 138, 255, 0.06)', border: 'rgba(68, 138, 255, 0.22)', list: data.caithien || [] },
        { key: 'suyyeu', name: 'SUY YẾU', tag: 'Giảm đà', color: '#ff9800', bg: 'rgba(255, 152, 0, 0.06)', border: 'rgba(255, 152, 0, 0.22)', list: data.suyyeu || [] },
        { key: 'tuthao', name: 'GIẢM GIÁ', tag: 'Điều chỉnh', color: '#ff5252', bg: 'rgba(255, 82, 82, 0.06)', border: 'rgba(255, 82, 82, 0.22)', list: data.tuthao || [] }
    ];

    let allItems = [];
    configs.forEach(cfg => {
        cfg.list.forEach(item => {
            allItems.push({ ...item, cfg });
        });
    });

    allItems.sort((a, b) => (b.mom || 0) - (a.mom || 0));

    if (window.rrgSearchQuery && window.rrgSearchQuery.trim()) {
        const q = window.rrgSearchQuery.trim().toLowerCase();
        allItems = allItems.filter(i => (i.name && i.name.toLowerCase().includes(q)) || (i.symbol && i.symbol.toLowerCase().includes(q)));
    }

    const badge = document.getElementById('rrg_matrix_badge');
    if (badge) badge.innerText = `${allItems.length} Nhóm Ngành`;

    let html = '';
    allItems.forEach(item => {
        const cfg = item.cfg;
        const cleanName = (item.name || '').replace(/\s*\(\d+\s*-\s*Cấp\s*\d+\)/gi, '').trim() || item.symbol || 'Ngành';
        const code = item.symbol || item.icbCode || '';
        const sparkline = generateSparklineSvg(item.history, cfg.color);
        const isCurrentActive = (rrgCurrentIcb && rrgCurrentIcb === code);

        html += `
            <div class="rrg-bento-sector-card" 
                 style="background: ${cfg.bg}; border: 1px solid ${isCurrentActive ? '#ffffff' : cfg.border}; box-shadow: ${isCurrentActive ? '0 0 12px ' + cfg.color : 'none'}; cursor: pointer; position: relative;" 
                 onclick="selectRrgSectorFromMatrix('${code}', '${cleanName}')"
                 title="Bấm để mở biểu đồ Radar RRG ngành ${cleanName}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                    <div style="font-weight: 700; font-size: 12.5px; color: #ffffff; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${cleanName}
                    </div>
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: ${cfg.color}22; color: ${cfg.color}; border: 1px solid ${cfg.color}44; white-space: nowrap;">
                            ${cfg.name}
                        </span>
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; margin-top: 2px;">
                    <span style="color: #8b949e;">RS-Ratio: <b style="color: #40c4ff;">${item.ratio ? item.ratio.toFixed(1) : '--'}</b></span>
                    <span style="color: #8b949e;">Đà (Mom): <b style="color: ${cfg.color};">${item.mom ? item.mom.toFixed(1) : '--'}</b></span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10.5px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 5px; margin-top: 3px;">
                    <span style="color: ${cfg.color}; font-weight: 600;">${cfg.tag}</span>
                    <div style="transform: scale(0.85); transform-origin: right center;">${sparkline}</div>
                </div>
            </div>
        `;
    });

    if (allItems.length === 0) {
        html = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #787b86;">Không có ngành nào phù hợp</div>`;
    }

    container.innerHTML = html;
}

function renderSectorSpectrumTable(data) {
    const tbody = document.getElementById('rrg_matrix_spectrum_tbody');
    if (!tbody) return;

    const dandat = data.dandat || [];
    const caithien = data.caithien || [];
    const suyyeu = data.suyyeu || [];
    const tuthao = data.tuthao || [];

    let allItems = [
        ...dandat.map(i => ({ ...i, phaseName: 'Tăng giá', color: '#00e676' })),
        ...caithien.map(i => ({ ...i, phaseName: 'Tích lũy', color: '#448aff' })),
        ...suyyeu.map(i => ({ ...i, phaseName: 'Suy yếu', color: '#ff9800' })),
        ...tuthao.map(i => ({ ...i, phaseName: 'Giảm giá', color: '#ff5252' }))
    ];

    allItems = getSortedAndFilteredList(allItems);

    let html = '';
    allItems.forEach((item, idx) => {
        const cleanName = (item.name || '').replace(/\s*\(\d+\s*-\s*Cấp\s*\d+\)/gi, '').trim() || item.symbol || 'Ngành';
        const code = item.symbol || item.icbCode || '';
        const rDiff = (item.ratio || 100) - 100;
        const mDiff = (item.mom || 100) - 100;
        const sparkline = generateSparklineSvg(item.history, item.color);

        const rPct = Math.min(50, Math.abs(rDiff) * 5);
        const rBarStyle = rDiff >= 0
            ? `left: 50%; width: ${rPct}%; background: linear-gradient(90deg, #008a38, #00e676);`
            : `right: 50%; width: ${rPct}%; background: linear-gradient(90deg, #ff5252, #c62828);`;

        const mPct = Math.min(50, Math.abs(mDiff) * 5);
        const mBarStyle = mDiff >= 0
            ? `left: 50%; width: ${mPct}%; background: linear-gradient(90deg, #1565c0, #448aff);`
            : `right: 50%; width: ${mPct}%; background: linear-gradient(90deg, #ff9800, #e65100);`;

        html += `
            <tr style="cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.15s;"
                onmouseenter="this.style.background='rgba(255,255,255,0.04)'"
                onmouseleave="this.style.background='transparent'"
                onclick="selectRrgSectorFromMatrix('${code}', '${cleanName}')">
                <td style="text-align: center; color: #787b86; font-size: 11px;">${idx + 1}</td>
                <td style="font-weight: 700; color: #ffffff; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${cleanName}</td>
                <td style="text-align: center;">
                    <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: ${item.color}1f; color: ${item.color}; border: 1px solid ${item.color}33;">
                        ${item.phaseName}
                    </span>
                </td>
                <td style="padding: 6px 10px;">
                    <div class="rrg-spectrum-bar-wrap">
                        <div class="rrg-spectrum-center-line"></div>
                        <div style="position: absolute; height: 100%; border-radius: 2px; ${rBarStyle}"></div>
                        <span style="position: absolute; left: 6px; font-size: 10px; color: ${rDiff >= 0 ? '#00e676' : '#ff5252'}; font-family: monospace; font-weight: 700; z-index: 3;">
                            ${item.ratio ? item.ratio.toFixed(2) : '100.0'} (${rDiff >= 0 ? '+' : ''}${rDiff.toFixed(2)})
                        </span>
                    </div>
                </td>
                <td style="padding: 6px 10px;">
                    <div class="rrg-spectrum-bar-wrap">
                        <div class="rrg-spectrum-center-line"></div>
                        <div style="position: absolute; height: 100%; border-radius: 2px; ${mBarStyle}"></div>
                        <span style="position: absolute; left: 6px; font-size: 10px; color: ${mDiff >= 0 ? '#448aff' : '#ff9800'}; font-family: monospace; font-weight: 700; z-index: 3;">
                            ${item.mom ? item.mom.toFixed(2) : '100.0'} (${mDiff >= 0 ? '+' : ''}${mDiff.toFixed(2)})
                        </span>
                    </div>
                </td>
                <td style="text-align: center;">${sparkline}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html || `<tr><td colspan="6" style="text-align: center; padding: 30px; color: #787b86;">Không có dữ liệu</td></tr>`;
}

function renderSectorClusters(data) {
    const renderClusterList = (list, color, listId, countId) => {
        const cntEl = document.getElementById(countId);
        if (cntEl) cntEl.innerText = `${list.length} ngành`;
        const listEl = document.getElementById(listId);
        if (!listEl) return;
        if (list.length === 0) {
            listEl.innerHTML = `<span style="color: #666; font-size: 11px; padding: 10px 0;">Không có ngành</span>`;
            return;
        }
        listEl.innerHTML = list.map(item => {
            const cleanName = (item.name || '').replace(/\s*\(\d+\s*-\s*Cấp\s*\d+\)/gi, '').trim() || item.symbol;
            const code = item.symbol || item.icbCode || '';
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; border-radius: 4px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); cursor: pointer; transition: background 0.15s;"
                     onmouseenter="this.style.background='rgba(255,255,255,0.08)'"
                     onmouseleave="this.style.background='rgba(255,255,255,0.03)'"
                     onclick="selectRrgSectorFromMatrix('${code}', '${cleanName}')">
                    <span style="font-size: 12px; font-weight: 600; color: #ffffff;">${cleanName}</span>
                    <span style="font-size: 11px; font-weight: 700; color: ${color}; font-family: monospace;">${item.mom ? item.mom.toFixed(1) : '--'}</span>
                </div>
            `;
        }).join('');
    };

    renderClusterList(data.caithien || [], '#448aff', 'rrg_clust_list_caithien', 'rrg_clust_cnt_caithien');
    renderClusterList(data.dandat || [], '#00e676', 'rrg_clust_list_dandat', 'rrg_clust_cnt_dandat');
    renderClusterList(data.tuthao || [], '#ff5252', 'rrg_clust_list_tuthao', 'rrg_clust_cnt_tuthao');
    renderClusterList(data.suyyeu || [], '#ff9800', 'rrg_clust_list_suyyeu', 'rrg_clust_cnt_suyyeu');
}

function renderRrgKpis(data) {
    const dandat = data.dandat || [];
    const caithien = data.caithien || [];
    const suyyeu = data.suyyeu || [];
    const tuthao = data.tuthao || [];
    
    const total = dandat.length + caithien.length + suyyeu.length + tuthao.length || 1;
    
    const pDandat = ((dandat.length / total) * 100).toFixed(1);
    const pCaithien = ((caithien.length / total) * 100).toFixed(1);
    const pSuyyeu = ((suyyeu.length / total) * 100).toFixed(1);
    const pTuthao = ((tuthao.length / total) * 100).toFixed(1);
    
    // Counts
    const unitLabel = window.rrgCurrentType === 'industry' ? 'ngành' : 'mã';
    const cntD = document.getElementById('rrg_kpi_count_dandat'); if (cntD) cntD.innerHTML = `${dandat.length} <small style="font-size: 12px; color: #787b86; font-weight: 500;">${unitLabel}</small>`;
    const cntC = document.getElementById('rrg_kpi_count_caithien'); if (cntC) cntC.innerHTML = `${caithien.length} <small style="font-size: 12px; color: #787b86; font-weight: 500;">${unitLabel}</small>`;
    const cntS = document.getElementById('rrg_kpi_count_suyyeu'); if (cntS) cntS.innerHTML = `${suyyeu.length} <small style="font-size: 12px; color: #787b86; font-weight: 500;">${unitLabel}</small>`;
    const cntT = document.getElementById('rrg_kpi_count_tuthao'); if (cntT) cntT.innerHTML = `${tuthao.length} <small style="font-size: 12px; color: #787b86; font-weight: 500;">${unitLabel}</small>`;
    
    // Percentages
    const pctD = document.getElementById('rrg_kpi_pct_dandat'); if (pctD) pctD.innerText = `${pDandat}%`;
    const pctC = document.getElementById('rrg_kpi_pct_caithien'); if (pctC) pctC.innerText = `${pCaithien}%`;
    const pctS = document.getElementById('rrg_kpi_pct_suyyeu'); if (pctS) pctS.innerText = `${pSuyyeu}%`;
    const pctT = document.getElementById('rrg_kpi_pct_tuthao'); if (pctT) pctT.innerText = `${pTuthao}%`;
    
    // Cash Flow Trading Value (GTGD)
    const vs = window.rrgValueSummary;
    const formatBillion = (val) => {
        if (val === undefined || val === null) return '--';
        return Number(val).toLocaleString('vi-VN', { maximumFractionDigits: 1 });
    };

    if (vs && window.rrgCurrentType === 'stock') {
        const vC = vs.val_caithien !== undefined ? vs.val_caithien : (vs.caithien ? vs.caithien.value : 0);
        const pC = vs.pct_val_caithien !== undefined ? vs.pct_val_caithien : (vs.caithien ? vs.caithien.pct : 0);

        const vD = vs.val_dandat !== undefined ? vs.val_dandat : (vs.dandat ? vs.dandat.value : 0);
        const pD = vs.pct_val_dandat !== undefined ? vs.pct_val_dandat : (vs.dandat ? vs.dandat.pct : 0);

        const vS = vs.val_suyyeu !== undefined ? vs.val_suyyeu : (vs.suyyeu ? vs.suyyeu.value : 0);
        const pS = vs.pct_val_suyyeu !== undefined ? vs.pct_val_suyyeu : (vs.suyyeu ? vs.suyyeu.pct : 0);

        const vT = vs.val_tuthao !== undefined ? vs.val_tuthao : (vs.tuthao ? vs.tuthao.value : 0);
        const pT = vs.pct_val_tuthao !== undefined ? vs.pct_val_tuthao : (vs.tuthao ? vs.tuthao.pct : 0);

        const valC = document.getElementById('rrg_kpi_val_caithien');
        const valPctC = document.getElementById('rrg_kpi_val_pct_caithien');
        if (valC) valC.innerText = `${formatBillion(vC)} tỷ`;
        if (valPctC) valPctC.innerText = `(${pC}%)`;

        const valD = document.getElementById('rrg_kpi_val_dandat');
        const valPctD = document.getElementById('rrg_kpi_val_pct_dandat');
        if (valD) valD.innerText = `${formatBillion(vD)} tỷ`;
        if (valPctD) valPctD.innerText = `(${pD}%)`;

        const valS = document.getElementById('rrg_kpi_val_suyyeu');
        const valPctS = document.getElementById('rrg_kpi_val_pct_suyyeu');
        if (valS) valS.innerText = `${formatBillion(vS)} tỷ`;
        if (valPctS) valPctS.innerText = `(${pS}%)`;

        const valT = document.getElementById('rrg_kpi_val_tuthao');
        const valPctT = document.getElementById('rrg_kpi_val_pct_tuthao');
        if (valT) valT.innerText = `${formatBillion(vT)} tỷ`;
        if (valPctT) valPctT.innerText = `(${pT}%)`;
    } else {
        ['caithien', 'dandat', 'suyyeu', 'tuthao'].forEach(k => {
            const valEl = document.getElementById(`rrg_kpi_val_${k}`);
            const valPctEl = document.getElementById(`rrg_kpi_val_pct_${k}`);
            if (valEl) valEl.innerText = '-- tỷ';
            if (valPctEl) valPctEl.innerText = '(--%)';
        });
    }

    // Top 3 Chips
    const renderTopChips = (list, color, containerId) => {
        const cont = document.getElementById(containerId);
        if (!cont) return;
        const sorted = [...list].sort((a, b) => (b.mom || 0) - (a.mom || 0)).slice(0, 3);
        if (sorted.length === 0) { 
            const noDataLabel = window.rrgCurrentType === 'industry' ? 'Không có ngành nào' : 'Không có mã nào';
            cont.innerHTML = `<span style="color:#555;">${noDataLabel}</span>`; 
            return; 
        }
        cont.innerHTML = '<span style="flex-shrink: 0; color: #9da2b4;">Top: </span>' + sorted.map(item => {
            const sym = item.symbol || item.icbCode || '';
            const name = (item.name || '').replace(/\s*\(\d+\s*-\s*Cấp\s*\d+\)/gi, '').trim();
            const displayLabel = (window.rrgCurrentType === 'industry' && name) ? name : sym;
            const fullTitle = `${name || sym} (${item.mom ? item.mom.toFixed(1) : (item.ratio ? item.ratio.toFixed(1) : '--')})`;
            return `
                <span class="rrg-kpi-badge-chip" 
                      style="background: ${color}22; color: ${color}; border: 1px solid ${color}44; cursor: pointer; max-width: 95px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block; vertical-align: middle; flex-shrink: 1;" 
                      onclick="handleRrgItemClick('${sym}')" 
                      title="${fullTitle}">
                    ${displayLabel} (${item.mom ? item.mom.toFixed(1) : (item.ratio ? item.ratio.toFixed(1) : '--')})
                </span>
            `;
        }).join('');
    };
    
    renderTopChips(dandat, '#00e676', 'rrg_kpi_top_dandat');
    renderTopChips(caithien, '#448aff', 'rrg_kpi_top_caithien');
    renderTopChips(suyyeu, '#ff9800', 'rrg_kpi_top_suyyeu');
    renderTopChips(tuthao, '#ff5252', 'rrg_kpi_top_tuthao');
    
    // Breadth Bar & Legend
    const bBar = document.getElementById('rrg_breadth_bar');
    const bLegend = document.getElementById('rrg_breadth_legend');
    const isValMode = (window.rrgBreadthMode === 'value' && vs && window.rrgCurrentType === 'stock');

    if (isValMode) {
        const bC = vs.pct_val_caithien !== undefined ? vs.pct_val_caithien : (vs.caithien ? vs.caithien.pct : 0);
        const valC = vs.val_caithien !== undefined ? vs.val_caithien : (vs.caithien ? vs.caithien.value : 0);

        const bD = vs.pct_val_dandat !== undefined ? vs.pct_val_dandat : (vs.dandat ? vs.dandat.pct : 0);
        const valD = vs.val_dandat !== undefined ? vs.val_dandat : (vs.dandat ? vs.dandat.value : 0);

        const bS = vs.pct_val_suyyeu !== undefined ? vs.pct_val_suyyeu : (vs.suyyeu ? vs.suyyeu.pct : 0);
        const valS = vs.val_suyyeu !== undefined ? vs.val_suyyeu : (vs.suyyeu ? vs.suyyeu.value : 0);

        const bT = vs.pct_val_tuthao !== undefined ? vs.pct_val_tuthao : (vs.tuthao ? vs.tuthao.pct : 0);
        const valT = vs.val_tuthao !== undefined ? vs.val_tuthao : (vs.tuthao ? vs.tuthao.value : 0);
        
        if (bBar) {
            bBar.innerHTML = `
                <div style="width: ${bC}%; background: #2962ff;" title="Tích lũy: ${bC}% (${formatBillion(valC)} tỷ)"></div>
                <div style="width: ${bD}%; background: #00e676;" title="Tăng giá: ${bD}% (${formatBillion(valD)} tỷ)"></div>
                <div style="width: ${bS}%; background: #ff9800;" title="Suy yếu: ${bS}% (${formatBillion(valS)} tỷ)"></div>
                <div style="width: ${bT}%; background: #ff5252;" title="Giảm giá: ${bT}% (${formatBillion(valT)} tỷ)"></div>
            `;
        }
        if (bLegend) {
            bLegend.innerHTML = `
                <span style="color: #448aff;">🟦 Tích lũy: <b>${bC}%</b> <small style="opacity:0.85;">(${formatBillion(valC)} tỷ)</small></span>
                <span style="color: #00e676;">🟩 Tăng giá: <b>${bD}%</b> <small style="opacity:0.85;">(${formatBillion(valD)} tỷ)</small></span>
                <span style="color: #ff9800;">🟧 Suy yếu: <b>${bS}%</b> <small style="opacity:0.85;">(${formatBillion(valS)} tỷ)</small></span>
                <span style="color: #ff5252;">🟥 Giảm giá: <b>${bT}%</b> <small style="opacity:0.85;">(${formatBillion(valT)} tỷ)</small></span>
            `;
        }
    } else {
        if (bBar) {
            bBar.innerHTML = `
                <div style="width: ${pCaithien}%; background: #2962ff;" title="Tích lũy: ${pCaithien}% (${caithien.length} mã)"></div>
                <div style="width: ${pDandat}%; background: #00e676;" title="Tăng giá: ${pDandat}% (${dandat.length} mã)"></div>
                <div style="width: ${pSuyyeu}%; background: #ff9800;" title="Suy yếu: ${pSuyyeu}% (${suyyeu.length} mã)"></div>
                <div style="width: ${pTuthao}%; background: #ff5252;" title="Giảm giá: ${pTuthao}% (${tuthao.length} mã)"></div>
            `;
        }
        if (bLegend) {
            bLegend.innerHTML = `
                <span style="color: #448aff;">🟦 Tích lũy: <b>${pCaithien}%</b> <small style="opacity:0.85;">(${caithien.length} mã)</small></span>
                <span style="color: #00e676;">🟩 Tăng giá: <b>${pDandat}%</b> <small style="opacity:0.85;">(${dandat.length} mã)</small></span>
                <span style="color: #ff9800;">🟧 Suy yếu: <b>${pSuyyeu}%</b> <small style="opacity:0.85;">(${suyyeu.length} mã)</small></span>
                <span style="color: #ff5252;">🟥 Giảm giá: <b>${pTuthao}%</b> <small style="opacity:0.85;">(${tuthao.length} mã)</small></span>
            `;
        }
    }
}

function renderRrgGridView() {
    if (!window.rrgDataCache) return;
    const accs = [
        { key: 'dandat', color: '#00e676', name: 'Tăng giá' },
        { key: 'caithien', color: '#448aff', name: 'Tích lũy' },
        { key: 'suyyeu', color: '#ff9800', name: 'Suy yếu' },
        { key: 'tuthao', color: '#ff5252', name: 'Giảm giá' }
    ];
    
    accs.forEach(acc => {
        const rawList = window.rrgDataCache[acc.key] || [];
        const list = getSortedAndFilteredList(rawList);
        
        const countElem = document.getElementById(`rrg_count_${acc.key}`);
        if (countElem) countElem.innerText = `${list.length} mã`;
        
        let html = '';
        list.forEach(item => {
            const rDiffStr = (item.r_diff !== undefined) ? (item.r_diff > 0 ? `+${item.r_diff.toFixed(2)}` : item.r_diff.toFixed(2)) : '';
            const mDiffStr = (item.m_diff !== undefined) ? (item.m_diff > 0 ? `+${item.m_diff.toFixed(2)}` : item.m_diff.toFixed(2)) : '';
            const rColor = (item.r_diff >= 0) ? '#00e676' : '#ff5252';
            const mColor = (item.m_diff >= 0) ? '#00e676' : '#ff5252';
            const sparkline = generateSparklineSvg(item.history, acc.color);
            
            let maHtml = '';
            let nameColor = '#ffffff';
            if (window.rrgCurrentType === 'stock') {
                maHtml = `<td class="rrg_col_ma" style="font-weight: 800; color: ${acc.color}; font-size: 13px;">${item.symbol}</td>`;
            } else {
                nameColor = acc.color;
            }
            
            html += `<tr style="cursor: pointer; transition: background 0.15s; border-bottom: 1px solid rgba(255,255,255,0.03);" 
                         onmouseenter="this.style.background='rgba(255,255,255,0.04)'" 
                         onmouseleave="this.style.background='transparent'" 
                         onclick="handleRrgItemClick('${item.symbol}')">
                ${maHtml}
                <td class="rrg_col_ten" style="font-weight: 500; color: ${nameColor};" title="${item.name}">${item.name}</td>
                <td class="rrg_col_ratio" style="color: ${rColor}; font-family: var(--font-mono, monospace);">
                    <b>${item.ratio ? item.ratio.toFixed(2) : '--'}</b>
                    ${rDiffStr ? `<span style="font-size: 10px; opacity: 0.85; margin-left: 3px;">(${rDiffStr})</span>` : ''}
                </td>
                <td class="rrg_col_mom" style="color: ${mColor}; font-family: var(--font-mono, monospace);">
                    <b>${item.mom ? item.mom.toFixed(2) : '--'}</b>
                    ${mDiffStr ? `<span style="font-size: 10px; opacity: 0.85; margin-left: 3px;">(${mDiffStr})</span>` : ''}
                </td>
                <td class="rrg_col_trend">${sparkline}</td>
            </tr>`;
        });
        
        if (list.length === 0) {
            html = `<tr><td colspan="5" style="text-align: center; padding: 24px; color: #787b86;">Không có mã phù hợp</td></tr>`;
        }
        
        const tbody = document.getElementById(`rrg_tbody_${acc.key}`);
        if (tbody) tbody.innerHTML = html;
    });
}

function renderRrgTabsView() {
    if (!window.rrgDataCache) return;
    const tabKey = window.rrgCurrentSingleTab || 'dandat';
    const accConfig = {
        'dandat': { color: '#00e676', name: 'TĂNG GIÁ (LEADING)' },
        'caithien': { color: '#448aff', name: 'TÍCH LŨY (IMPROVING)' },
        'suyyeu': { color: '#ff9800', name: 'SUY YẾU (WEAKENING)' },
        'tuthao': { color: '#ff5252', name: 'GIẢM GIÁ (LAGGING)' }
    };
    
    // Update badge counts on tab buttons
    ['dandat', 'caithien', 'suyyeu', 'tuthao'].forEach(k => {
        const c = document.getElementById(`rrg_single_count_${k}`);
        if (c) c.innerText = (window.rrgDataCache[k] || []).length;
    });
    
    const cfg = accConfig[tabKey];
    const rawList = window.rrgDataCache[tabKey] || [];
    const list = getSortedAndFilteredList(rawList);
    
    let html = '';
    list.forEach((item, idx) => {
        const rDiffStr = (item.r_diff !== undefined) ? (item.r_diff > 0 ? `+${item.r_diff.toFixed(2)}` : item.r_diff.toFixed(2)) : '';
        const mDiffStr = (item.m_diff !== undefined) ? (item.m_diff > 0 ? `+${item.m_diff.toFixed(2)}` : item.m_diff.toFixed(2)) : '';
        const rColor = (item.r_diff >= 0) ? '#00e676' : '#ff5252';
        const mColor = (item.m_diff >= 0) ? '#00e676' : '#ff5252';
        const sparkline = generateSparklineSvg(item.history, cfg.color);
        const p = item.price || 0;
        const priceStr = p > 0 ? (p >= 1000 ? p.toLocaleString() : (p * 1000).toLocaleString()) : '--';
        
        let maHtml = '';
        if (window.rrgCurrentType === 'stock') {
            maHtml = `<td style="padding: 10px 14px; font-weight: 800; color: ${cfg.color}; font-size: 14px;">${item.symbol}</td>`;
        }
        
        html += `<tr style="cursor: pointer; transition: background 0.15s; border-bottom: 1px solid rgba(255,255,255,0.04);" 
                     onmouseenter="this.style.background='rgba(255,255,255,0.04)'" 
                     onmouseleave="this.style.background='transparent'" 
                     onclick="handleRrgItemClick('${item.symbol}')">
            <td style="padding: 10px 14px; color: #787b86; font-size: 12px;">${idx + 1}</td>
            ${maHtml}
            <td style="padding: 10px 14px; font-weight: 600; color: #ffffff;">${item.name}</td>
            <td style="padding: 10px 14px; color: #d1d4dc; text-align: right; font-family: var(--font-mono, monospace); font-weight: 600;">${priceStr}</td>
            <td style="padding: 10px 14px; color: ${rColor}; text-align: right; font-family: var(--font-mono, monospace);">
                <b style="font-size: 13px;">${item.ratio ? item.ratio.toFixed(2) : '--'}</b>
                ${rDiffStr ? `<span style="font-size: 11px; opacity: 0.8; margin-left: 4px;">(${rDiffStr})</span>` : ''}
            </td>
            <td style="padding: 10px 14px; color: ${mColor}; text-align: right; font-family: var(--font-mono, monospace);">
                <b style="font-size: 13px;">${item.mom ? item.mom.toFixed(2) : '--'}</b>
                ${mDiffStr ? `<span style="font-size: 11px; opacity: 0.8; margin-left: 4px;">(${mDiffStr})</span>` : ''}
            </td>
            <td style="padding: 10px 14px; text-align: center;">${sparkline}</td>
        </tr>`;
    });
    
    if (list.length === 0) {
        html = `<tr><td colspan="7" style="text-align: center; padding: 40px; color: #787b86;">Không có mã nào thỏa mãn bộ lọc</td></tr>`;
    }
    
    const tbody = document.getElementById('rrg_single_tab_tbody');
    if (tbody) tbody.innerHTML = html;
}

function renderRrgTableView() {
    if (!window.rrgDataCache) return;
    
    // Merge all 4 quadrants into one unified list
    let allMerged = [];
    const configs = [
        { key: 'dandat', name: 'Tăng giá', color: '#00e676', bg: 'rgba(0, 230, 118, 0.15)' },
        { key: 'caithien', name: 'Tích lũy', color: '#448aff', bg: 'rgba(41, 98, 255, 0.15)' },
        { key: 'suyyeu', name: 'Suy yếu', color: '#ff9800', bg: 'rgba(255, 152, 0, 0.15)' },
        { key: 'tuthao', name: 'Giảm giá', color: '#ff5252', bg: 'rgba(255, 82, 82, 0.15)' }
    ];
    
    configs.forEach(cfg => {
        (window.rrgDataCache[cfg.key] || []).forEach(item => {
            allMerged.push({ ...item, phaseName: cfg.name, phaseColor: cfg.color, phaseBg: cfg.bg });
        });
    });
    
    const list = getSortedAndFilteredList(allMerged);
    
    let html = '';
    list.forEach((item, idx) => {
        const rDiffStr = (item.r_diff !== undefined) ? (item.r_diff > 0 ? `+${item.r_diff.toFixed(2)}` : item.r_diff.toFixed(2)) : '';
        const mDiffStr = (item.m_diff !== undefined) ? (item.m_diff > 0 ? `+${item.m_diff.toFixed(2)}` : item.m_diff.toFixed(2)) : '';
        const rColor = (item.r_diff >= 0) ? '#00e676' : '#ff5252';
        const mColor = (item.m_diff >= 0) ? '#00e676' : '#ff5252';
        const sparkline = generateSparklineSvg(item.history, item.phaseColor);
        const p = item.price || 0;
        const priceStr = p > 0 ? (p >= 1000 ? p.toLocaleString() : (p * 1000).toLocaleString()) : '--';
        
        let maHtml = '';
        if (window.rrgCurrentType === 'stock') {
            maHtml = `<td style="padding: 10px 14px; font-weight: 800; color: ${item.phaseColor}; font-size: 14px;">${item.symbol}</td>`;
        }
        
        html += `<tr style="cursor: pointer; transition: background 0.15s; border-bottom: 1px solid rgba(255,255,255,0.04);" 
                     onmouseenter="this.style.background='rgba(255,255,255,0.04)'" 
                     onmouseleave="this.style.background='transparent'" 
                     onclick="handleRrgItemClick('${item.symbol}')">
            <td style="padding: 10px 14px; color: #787b86; font-size: 12px;">${idx + 1}</td>
            ${maHtml}
            <td style="padding: 10px 14px; font-weight: 600; color: #ffffff;">${item.name}</td>
            <td style="padding: 10px 14px; text-align: center;">
                <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; background: ${item.phaseBg}; color: ${item.phaseColor}; border: 1px solid ${item.phaseColor}33;">
                    ${item.phaseName}
                </span>
            </td>
            <td style="padding: 10px 14px; color: #d1d4dc; text-align: right; font-family: var(--font-mono, monospace); font-weight: 600;">${priceStr}</td>
            <td style="padding: 10px 14px; color: ${rColor}; text-align: right; font-family: var(--font-mono, monospace);">
                <b style="font-size: 13px;">${item.ratio ? item.ratio.toFixed(2) : '--'}</b>
                ${rDiffStr ? `<span style="font-size: 11px; opacity: 0.8; margin-left: 4px;">(${rDiffStr})</span>` : ''}
            </td>
            <td style="padding: 10px 14px; color: ${mColor}; text-align: right; font-family: var(--font-mono, monospace);">
                <b style="font-size: 13px;">${item.mom ? item.mom.toFixed(2) : '--'}</b>
                ${mDiffStr ? `<span style="font-size: 11px; opacity: 0.8; margin-left: 4px;">(${mDiffStr})</span>` : ''}
            </td>
            <td style="padding: 10px 14px; text-align: center;">${sparkline}</td>
        </tr>`;
    });
    
    if (list.length === 0) {
        html = `<tr><td colspan="8" style="text-align: center; padding: 40px; color: #787b86;">Không có dữ liệu phù hợp</td></tr>`;
    }
    
    const tbody = document.getElementById('rrg_master_tbody');
    if (tbody) tbody.innerHTML = html;
}

function handleRrgItemClick(sym) {
    if (!sym) return;
    if (typeof openRrgModal === 'function') {
        const isInd = (window.rrgCurrentType === 'industry') || (/^\d{4}$/.test(String(sym).trim()));
        if (isInd) {
            openRrgModal('sector', sym, 'industry');
        } else {
            openRrgModal('single', sym, 'stock');
        }
    }
}

// ----------------------------------------------------------
// Data Fetching
// ----------------------------------------------------------

window.updateRrgTimestampUI = function(updatedAt, dateStr, isStale) {
    const topText = document.getElementById('rrg_top_time_text');
    const topDot = document.getElementById('rrg_top_dot');
    const pill = document.getElementById('rrg_kpi_updated_pill');
    
    let displayTime = updatedAt || '';
    if (!displayTime && dateStr) {
        displayTime = `Phiên ${dateStr}`;
    }
    
    if (topText) {
        topText.innerText = displayTime ? `Cập nhật: ${displayTime}` : 'Cập nhật: Mới nhất';
    }
    if (pill) {
        pill.innerText = displayTime ? `(🕒 Cập nhật: ${displayTime})` : '';
    }
    if (topDot) {
        if (isStale) {
            topDot.style.backgroundColor = '#ffab00';
            topDot.style.boxShadow = '0 0 6px #ffab00';
        } else {
            topDot.style.backgroundColor = '#00e676';
            topDot.style.boxShadow = '0 0 6px #00e676';
        }
    }
};

window.refreshRrgStatsManually = async function() {
    const btn = document.getElementById('btn_rrg_manual_refresh');
    const spinner = document.getElementById('btn_rrg_refresh_spinner');
    const label = document.getElementById('btn_rrg_refresh_text');
    
    if (window._isRefreshingRrgStats) return;
    window._isRefreshingRrgStats = true;
    
    // Xóa sạch cache client để buộc lấy mới hoàn toàn
    window.rrgIndustryLevelCache = {};
    window.rrgStockBasketCache = {};
    window.rrgSectorLevel2DefaultCache = null;

    if (spinner) {
        spinner.style.animation = 'spin 0.8s linear infinite';
    }
    if (label) {
        label.innerText = 'Đang tính...';
    }
    if (btn) {
        btn.style.opacity = '0.75';
        btn.style.pointerEvents = 'none';
    }
    
    try {
        await loadRrgStats(true);
        if (label) {
            label.innerText = 'Đã xong!';
        }
        setTimeout(() => {
            if (label) label.innerText = 'Làm mới';
        }, 1500);
    } catch(e) {
        console.error('Lỗi khi làm mới RRG:', e);
        if (label) label.innerText = 'Thử lại';
    } finally {
        window._isRefreshingRrgStats = false;
        if (spinner) {
            spinner.style.animation = 'none';
        }
        if (btn) {
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
        }
    }
};

window.rrgIndustryLevelCache = {};
window.rrgStockBasketCache = {};

async function loadRrgStats(forceRefresh = false) {
    const isStock = (window.rrgCurrentType === 'stock');
    const isInd = (window.rrgCurrentType === 'industry');
    const cacheKey = isStock 
        ? `${rrgCurrentExchange}_${rrgCurrentIcb}_${window.rrgCurrentBasket || 'ALL'}`
        : `ind_lvl_${window.rrgCurrentLevel || 1}`;

    // Tốc độ phản hồi tức thì 0ms nhờ Cache RAM Client khi chuyển đổi qua lại
    if (!forceRefresh) {
        const cached = isStock ? window.rrgStockBasketCache[cacheKey] : window.rrgIndustryLevelCache[cacheKey];
        if (cached && cached.data) {
            window.rrgDataCache = cached.data;
            window.rrgValueSummary = cached.value_summary || null;
            window.updateRrgTimestampUI(cached.updated_at, cached.date, cached.is_stale);
            window.renderRrgAllViews();
            return;
        }
    }

    const loading = document.getElementById('rrg_loading');
    // Chỉ hiển thị loading overlay nếu chưa có dữ liệu và không phải thao tác làm mới nền
    if (loading && !forceRefresh && !window.rrgDataCache) loading.style.display = 'block';
    
    try {
        const response = await fetch('/api/rrg-stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                exchange: rrgCurrentExchange,
                icbCode: rrgCurrentIcb,
                type: window.rrgCurrentType,
                level: window.rrgCurrentLevel,
                basket: window.rrgCurrentBasket || 'ALL',
                force_refresh: !!forceRefresh
            })
        });
        
        const data = await response.json();
        
        if (data && data.data) {
            window.rrgDataCache = data.data;
            window.rrgValueSummary = data.value_summary || null;
            window._rrgLastFetchedTime = Date.now();

            // Lưu vào RAM cache client để chuyển tab / đổi level tức thì
            const payloadToCache = {
                data: data.data,
                value_summary: data.value_summary,
                updated_at: data.updated_at,
                date: data.date,
                is_stale: data.is_stale
            };
            if (isStock) {
                window.rrgStockBasketCache[cacheKey] = payloadToCache;
            } else if (isInd) {
                window.rrgIndustryLevelCache[cacheKey] = payloadToCache;
            }

            window.updateRrgTimestampUI(data.updated_at, data.date, data.is_stale);
            window.renderRrgAllViews();
        }
    } catch(e) {
        console.error('Lỗi khi load RRG:', e);
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

// Smart Auto-refresh (Auto-polling & Visibility Change)
function initRrgAutoRefresh() {
    if (window._rrgAutoRefreshInitialized) return;
    window._rrgAutoRefreshInitialized = true;

    // Tự động kiểm tra làm mới nền mỗi 5 phút khi tab đang mở và đang ở chế độ RRG
    setInterval(() => {
        if (window.currentAppMode === 'rrg' && !document.hidden) {
            loadRrgStats(false);
        }
    }, 5 * 60 * 1000);

    // Khi người dùng quay lại tab sau hơn 5 phút không tương tác, tự động cập nhật ngầm
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && window.currentAppMode === 'rrg') {
            const elapsed = Date.now() - (window._rrgLastFetchedTime || 0);
            if (elapsed > 5 * 60 * 1000) {
                loadRrgStats(false);
            }
        }
    });
}
window.initRrgAutoRefresh = initRrgAutoRefresh;

// ----------------------------------------------------------
// Industry Tree & Search
// ----------------------------------------------------------

async function loadRrgTree() {
    try {
        const res = await fetch('/api/fialda-icbtree').then(r => r.json()).catch(() => null);
        if (res && res.result) {
            rrgTreeData = res.result;
        } else {
            const res2 = await fetch('/fialda_icbtree.json').then(r => r.json());
            rrgTreeData = res2.result || [];
        }
        renderRrgTree(rrgTreeData, document.getElementById('rrg_industry_tree'));
    } catch(e) {
        console.error('Failed to load RRG Tree', e);
    }
}

function renderRrgTree(nodes, container) {
    if (!container) return;
    container.innerHTML = '';
    const ul = document.createElement('ul');
    ul.className = 'rrg-tree-ul';
    
    nodes.forEach(node => {
        ul.appendChild(createRrgTreeNode(node));
    });
    
    container.appendChild(ul);
}

function createRrgTreeNode(node) {
    const li = document.createElement('li');
    li.className = 'rrg-tree-li';
    li.dataset.name = (node.icbName || '').toLowerCase();
    
    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'rrg-tree-node';
    
    const hasChild = node.childs && node.childs.length > 0;
    
    if (hasChild) {
        const toggle = document.createElement('span');
        toggle.className = 'rrg-tree-toggle';
        toggle.innerText = '+';
        
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const childUl = li.querySelector('.rrg-tree-ul');
            if (childUl.style.display === 'none') {
                childUl.style.display = 'block';
                toggle.innerText = '-';
            } else {
                childUl.style.display = 'none';
                toggle.innerText = '+';
            }
        });
        nodeDiv.appendChild(toggle);
    } else {
        const leafIcon = document.createElement('span');
        leafIcon.className = 'rrg-tree-leaf-icon';
        leafIcon.innerText = '📄';
        nodeDiv.appendChild(leafIcon);
    }
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'rrg-tree-name';
    nameSpan.innerText = node.icbName;
    nodeDiv.appendChild(nameSpan);
    
    nodeDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        rrgCurrentIcb = node.icbCode;
        document.getElementById('rrg_industry_label').innerText = `Ngành: ${node.icbName}`;
        document.getElementById('rrg_industry_popover').style.display = 'none';
        loadRrgStats();
    });
    
    li.appendChild(nodeDiv);
    
    if (hasChild) {
        const childUl = document.createElement('ul');
        childUl.className = 'rrg-tree-ul';
        childUl.style.display = 'none';
        node.childs.forEach(child => {
            childUl.appendChild(createRrgTreeNode(child));
        });
        li.appendChild(childUl);
    }
    
    return li;
}

function filterRrgTree(query) {
    const tree = document.getElementById('rrg_industry_tree');
    if (!tree) return;
    const lis = tree.querySelectorAll('li');
    
    if (!query) {
        lis.forEach(li => {
            li.style.display = 'block';
            const nameSpan = li.querySelector('.rrg-tree-name');
            if (nameSpan) nameSpan.innerHTML = nameSpan.textContent;
            const toggle = li.querySelector('.rrg-tree-toggle');
            if (toggle) {
                toggle.innerText = '+';
                const childUl = li.querySelector('.rrg-tree-ul');
                if (childUl) childUl.style.display = 'none';
            }
        });
        return;
    }
    
    lis.forEach(li => {
        li.style.display = 'none';
        const nameSpan = li.querySelector('.rrg-tree-name');
        if (nameSpan) nameSpan.innerHTML = nameSpan.textContent;
    });
    
    lis.forEach(li => {
        const name = li.dataset.name || '';
        if (name.includes(query)) {
            li.style.display = 'block';
            const nameSpan = li.querySelector('.rrg-tree-name');
            const originalText = nameSpan.textContent;
            const regex = new RegExp(`(${query})`, 'gi');
            nameSpan.innerHTML = originalText.replace(regex, `<span class="rrg-tree-match">$1</span>`);
            
            let parent = li.parentElement.closest('.rrg-tree-li');
            while (parent) {
                parent.style.display = 'block';
                const toggle = parent.querySelector('.rrg-tree-toggle');
                if (toggle) toggle.innerText = '-';
                const childUl = parent.querySelector(':scope > .rrg-tree-ul');
                if (childUl) childUl.style.display = 'block';
                parent = parent.parentElement.closest('.rrg-tree-li');
            }
        }
    });
}

// ----------------------------------------------------------
// Initialization
// ----------------------------------------------------------

function initRrgGlobalEvents() {
    if (window._rrgEventsInitialized) return;
    window._rrgEventsInitialized = true;

    // Exchange buttons
    const exchangeBtns = document.querySelectorAll('#rrg_exchange_btns .rrg-btn');
    exchangeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            exchangeBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            rrgCurrentExchange = e.target.getAttribute('data-exchange');
            loadRrgStats();
        });
    });

    // Popover toggle
    const industryBtn = document.getElementById('rrg_industry_btn');
    const popover = document.getElementById('rrg_industry_popover');
    if (industryBtn && popover) {
        industryBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (popover.style.display === 'flex') {
                popover.style.display = 'none';
            } else {
                popover.style.display = 'flex';
                if (rrgTreeData.length === 0) {
                    loadRrgTree();
                }
            }
        });

        document.addEventListener('click', (e) => {
            const popup = document.getElementById('rrg_sort_popup');
            if (popup && popup.style.display === 'flex') {
                popup.style.display = 'none';
            }
            if (!popover.contains(e.target) && !industryBtn.contains(e.target)) {
                popover.style.display = 'none';
            }
        });
    }

    // Industry search
    const indSearch = document.getElementById('rrg_industry_search');
    if (indSearch) {
        indSearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            filterRrgTree(query);
        });
    }

    // Stock search
    const stockSearch = document.getElementById('rrg_stock_search');
    if (stockSearch) {
        stockSearch.addEventListener('input', (e) => {
            window.rrgSearchQuery = e.target.value;
            window.renderRrgAllViews();
        });
    }

    // Khởi động cơ chế auto-refresh định kỳ
    if (typeof initRrgAutoRefresh === 'function') {
        initRrgAutoRefresh();
    }
}
window.initRrgGlobalEvents = initRrgGlobalEvents;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRrgGlobalEvents);
} else {
    initRrgGlobalEvents();
}
