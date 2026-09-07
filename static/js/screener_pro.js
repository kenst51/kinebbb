/**
 * ============================================================================
 * SCREENER PRO - HỆ THỐNG LỌC CỔ PHIẾU ĐỊNH LƯỢNG PRO (PROPRIETARY ENGINE)
 * ============================================================================
 */

(function() {
    let g_screenerData = null;
    let g_currentExchange = 'ALL';
    let g_currentIndustryCode = null;
    let g_currentIndustryName = null;
    let g_isScanning = false;
    let g_icbTreeLoaded = false;

    function renderScreenerLayout() {
        const container = document.getElementById('appContent_locpro');
        if (!container) return;

        container.innerHTML = `
            <div class="screener-pro-wrapper">
                <!-- TOP UNIFIED TOOLBAR -->
                <div class="screener-header-card">
                    <div class="screener-header-left">
                        <div class="screener-title-icon">⚡</div>
                        <div class="screener-title-main">
                            <h2>LỌC ĐỊNH LƯỢNG PRO</h2>
                            <span class="screener-status-chip">
                                <span class="screener-pulse-dot"></span>
                                <span>TOÀN THỊ TRƯỜNG</span>
                            </span>
                        </div>
                    </div>

                    <div class="screener-filters-cluster">
                        <div class="screener-filter-group">
                            <span class="screener-filter-label">SÀN:</span>
                            <div class="screener-pills-box">
                                <button type="button" class="screener-pill-btn active" id="btnExALL" onclick="window.setScreenerExchange('ALL')">Tất cả</button>
                                <button type="button" class="screener-pill-btn" id="btnExVN30" onclick="window.setScreenerExchange('VN30')">💎 VN30</button>
                                <button type="button" class="screener-pill-btn" id="btnExHOSE" onclick="window.setScreenerExchange('HOSE')">HOSE</button>
                                <button type="button" class="screener-pill-btn" id="btnExHNX" onclick="window.setScreenerExchange('HNX')">HNX</button>
                                <button type="button" class="screener-pill-btn" id="btnExUPCOM" onclick="window.setScreenerExchange('UPCOM')">UPCOM</button>
                            </div>
                        </div>

                        <div class="screener-divider-vert"></div>

                        <!-- HIERARCHICAL ICB LEVEL 2 TREE FILTER -->
                        <div class="screener-filter-group" style="position: relative;" id="screener_industry_container">
                            <button id="screener_industry_btn" type="button" class="screener-industry-select-btn">
                                <span id="screener_industry_label" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">NGÀNH: Tất cả</span>
                                <span style="font-size: 9px; margin-left: 6px; color: #64748b;">▼</span>
                            </button>
                            
                            <!-- Tree Popover -->
                            <div id="screener_industry_popover" style="display: none; position: absolute; top: calc(100% + 6px); right: 0; width: 330px; max-height: 400px; background: #131722; border: 1px solid #2a2e39; border-radius: 8px; box-shadow: 0 16px 36px rgba(0,0,0,0.85); z-index: 10000; flex-direction: column; overflow: hidden;">
                                <div style="padding: 8px 10px; border-bottom: 1px solid #2a2e39; background: #1a202c;">
                                    <div style="display: flex; gap: 6px;">
                                        <input type="text" id="screener_industry_search" placeholder="Tìm kiếm ngành cấp 2..." style="flex: 1; padding: 6px 10px; background: #0f172a; border: 1px solid #334155; color: #ffffff; border-radius: 4px; outline: none; font-size: 12px;">
                                        <button type="button" id="screener_industry_clear" style="padding: 0 12px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 700;" title="Hủy lọc ngành">Xóa Lọc</button>
                                    </div>
                                </div>
                                <div id="screener_industry_tree" style="flex: 1; overflow-y: auto; padding: 8px 10px; font-size: 12px; color: #e2e8f0; max-height: 320px;">
                                    <!-- Dynamic Tree Nodes -->
                                </div>
                            </div>
                        </div>
                    </div>

                    <button type="button" class="screener-scan-btn" id="btnRunScreenerScan" onclick="window.runScreenerScan()">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path d="M12 7v5l3 3"/></svg>
                        <span>QUÉT TÍN HIỆU PRO</span>
                    </button>
                </div>

                <!-- RESULTS SECTION (CLEAN FULL HEIGHT TABLE) -->
                <div class="screener-results-card">
                    <div class="screener-results-header">
                        <div style="font-size: 12px; font-weight: 800; color: #ffffff; display: flex; align-items: center; gap: 8px;">
                            <span>📊</span> DANH MỤC CƠ HỘI ĐẠT TÍN HIỆU
                            <span id="screenerMatchedBadge" style="font-size: 10px; font-weight: 800; background: rgba(0,242,254,0.12); color: #00f2fe; padding: 2px 7px; border-radius: 4px; border: 1px solid rgba(0,242,254,0.25);">0 cơ hội</span>
                        </div>
                        <div style="font-size: 11px; color: #94a3b8;" id="screenerLastUpdatedText">
                            Lần quét gần nhất: --:--:--
                        </div>
                    </div>

                    <div class="screener-table-wrap" id="screenerTableContainer">
                        <div class="screener-empty-state">
                            <div class="screener-empty-icon">🔍</div>
                            <div style="font-weight: 700; color: #cbd5e1; font-size: 13px;">Đang tải và chuẩn bị dữ liệu quét...</div>
                            <div style="font-size: 11.5px; margin-top: 4px;">Vui lòng chờ trong giây lát</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        setupIndustryTreeEvents();
    }

    async function loadICBTree() {
        if (g_icbTreeLoaded) return;
        try {
            const res = await fetch('/fialda_icbtree.json');
            const data = await res.json();
            const tree = data.result || [];
            
            const container = document.getElementById('screener_industry_tree');
            if (!container) return;
            container.innerHTML = '';
            
            // Only Level 1 and Level 2 (19 Phân Ngành Cấp 2)
            function createTreeNode(node, level = 1) {
                if (level > 2) return null;
                
                const li = document.createElement('li');
                li.className = 'rrg-tree-li';
                li.dataset.name = (node.icbName + ' ' + node.icbCode).toLowerCase();
                
                const nodeDiv = document.createElement('div');
                nodeDiv.className = 'rrg-tree-node';
                
                const hasLevel2Childs = (level === 1) && node.childs && node.childs.length > 0;
                
                if (hasLevel2Childs) {
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
                    leafIcon.innerText = '▪';
                    nodeDiv.appendChild(leafIcon);
                }
                
                const nameSpan = document.createElement('span');
                nameSpan.className = 'rrg-tree-name';
                nameSpan.innerText = node.icbName;
                nodeDiv.appendChild(nameSpan);
                
                nodeDiv.addEventListener('click', (e) => {
                    e.stopPropagation();
                    g_currentIndustryCode = String(node.icbCode);
                    const cleanName = node.icbName.replace(/\s*\(\d+\s*-\s*Cấp\s*\d+\)/i, '').trim();
                    g_currentIndustryName = cleanName;
                    
                    const label = document.getElementById('screener_industry_label');
                    if (label) label.innerText = 'NGÀNH: ' + cleanName;
                    
                    const popover = document.getElementById('screener_industry_popover');
                    if (popover) popover.style.display = 'none';
                    
                    if (g_screenerData) {
                        renderScreenerResults(g_screenerData);
                    }
                });
                
                li.appendChild(nodeDiv);
                
                if (hasLevel2Childs) {
                    const childUl = document.createElement('ul');
                    childUl.className = 'rrg-tree-ul';
                    childUl.style.display = 'none';
                    node.childs.forEach(child => {
                        const childNode = createTreeNode(child, level + 1);
                        if (childNode) childUl.appendChild(childNode);
                    });
                    li.appendChild(childUl);
                }
                
                return li;
            }

            const rootUl = document.createElement('ul');
            rootUl.className = 'rrg-tree-ul';
            rootUl.style.paddingLeft = '0';
            tree.forEach(node => {
                const rootNode = createTreeNode(node, 1);
                if (rootNode) rootUl.appendChild(rootNode);
            });
            container.appendChild(rootUl);
            g_icbTreeLoaded = true;
        } catch(e) {
            console.error("Failed to load ICB tree in Screener Pro", e);
        }
    }

    function setupIndustryTreeEvents() {
        const btn = document.getElementById('screener_industry_btn');
        const popover = document.getElementById('screener_industry_popover');
        const searchInput = document.getElementById('screener_industry_search');
        const clearBtn = document.getElementById('screener_industry_clear');

        if (btn && popover) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isHidden = popover.style.display === 'none' || !popover.style.display;
                popover.style.display = isHidden ? 'flex' : 'none';
                if (isHidden) {
                    loadICBTree();
                    if (searchInput) searchInput.focus();
                }
            });

            document.addEventListener('click', (e) => {
                if (!e.target.closest('#screener_industry_container')) {
                    if (popover) popover.style.display = 'none';
                }
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim().toLowerCase();
                const tree = document.getElementById('screener_industry_tree');
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
                    const name = li.dataset.name;
                    if (name && name.includes(query)) {
                        li.style.display = 'block';
                        
                        const nameSpan = li.querySelector('.rrg-tree-name');
                        if (nameSpan) {
                            const originalText = nameSpan.textContent;
                            const regex = new RegExp(`(${query})`, 'gi');
                            nameSpan.innerHTML = originalText.replace(regex, `<span class="rrg-tree-match">$1</span>`);
                        }
                        
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
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                g_currentIndustryCode = null;
                g_currentIndustryName = null;
                const label = document.getElementById('screener_industry_label');
                if (label) label.innerText = 'NGÀNH: Tất cả';
                if (popover) popover.style.display = 'none';
                if (searchInput) searchInput.value = '';
                
                const tree = document.getElementById('screener_industry_tree');
                if (tree) {
                    const lis = tree.querySelectorAll('li');
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
                }
                
                if (g_screenerData) {
                    renderScreenerResults(g_screenerData);
                }
            });
        }
    }

    async function fetchScreenerData(forceRefresh = false) {
        if (g_isScanning) return;
        g_isScanning = true;

        const scanBtn = document.getElementById('btnRunScreenerScan');
        if (scanBtn) {
            scanBtn.classList.add('loading');
            scanBtn.disabled = true;
            scanBtn.innerHTML = `
                <svg class="screener-spinner" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                <span>ĐANG QUÉT...</span>
            `;
        }

        const wrap = document.getElementById('screenerTableContainer');
        if (wrap && (!g_screenerData || forceRefresh)) {
            wrap.innerHTML = `
                <div class="screener-empty-state">
                    <svg class="screener-spinner" style="width: 28px; height: 28px; color: #00f2fe; margin-bottom: 10px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                    <div style="font-weight: 700; color: #ffffff; font-size: 13px;">Hệ thống đang quét toàn bộ 1.667 cổ phiếu...</div>
                    <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Vui lòng chờ trong giây lát...</div>
                </div>
            `;
        }

        try {
            const url = `/api/screener/scan-pro?exchange=${g_currentExchange}&min_vol=0`;
            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`HTTP Error ${resp.status}`);
            
            const result = await resp.json();
            g_screenerData = result;
            renderScreenerResults(result);
        } catch (err) {
            console.error('[ScreenerPro] Fetch error:', err);
            if (wrap) {
                wrap.innerHTML = `
                    <div class="screener-empty-state">
                        <div style="font-size: 32px; margin-bottom: 8px;">⚠️</div>
                        <div style="font-weight: 700; color: #ef4444; font-size: 13.5px;">Lỗi khi tải dữ liệu quét</div>
                        <div style="font-size: 11.5px; color: #94a3b8; margin-top: 4px;">${err.message || 'Không thể kết nối đến API máy chủ'}</div>
                    </div>
                `;
            }
        } finally {
            g_isScanning = false;
            if (scanBtn) {
                scanBtn.classList.remove('loading');
                scanBtn.disabled = false;
                scanBtn.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path d="M12 7v5l3 3"/></svg>
                    <span>QUÉT TÍN HIỆU PRO</span>
                `;
            }
        }
    }

    function renderScreenerResults(payload) {
        const wrap = document.getElementById('screenerTableContainer');
        const badge = document.getElementById('screenerMatchedBadge');
        const timeText = document.getElementById('screenerLastUpdatedText');
        if (!wrap) return;

        let allItems = (payload && payload.data) ? payload.data : [];
        
        // Filter by ICB Industry Hierarchy (Levels 1, 2, 3, 4)
        let items = allItems;
        if (g_currentIndustryCode) {
            const targetCode = String(g_currentIndustryCode);
            const targetName = (g_currentIndustryName || '').toLowerCase();
            
            items = allItems.filter(it => {
                const codes = Array.isArray(it.icbCodes) ? it.icbCodes.map(String) : [];
                const c = String(it.icbCode || '');
                const c1 = String(it.icbLevel1Code || '');
                const c2 = String(it.icbLevel2Code || '');
                const c3 = String(it.icbLevel3Code || '');
                const c4 = String(it.icbLevel4Code || '');
                
                if (codes.includes(targetCode) || c === targetCode || c1 === targetCode || c2 === targetCode || c3 === targetCode || c4 === targetCode) {
                    return true;
                }
                
                if (c.startsWith(targetCode) || c2.startsWith(targetCode) || c3.startsWith(targetCode) || c4.startsWith(targetCode)) {
                    return true;
                }
                
                const names = Array.isArray(it.icbNames) ? it.icbNames.map(n => String(n).toLowerCase()) : [];
                const sec = (it.sector || '').toLowerCase();
                const secL1 = (it.sectorL1 || '').toLowerCase();
                const secL3 = (it.sectorL3 || '').toLowerCase();
                const secL4 = (it.sectorL4 || '').toLowerCase();
                
                if (targetName && (
                    names.some(n => n.includes(targetName)) || 
                    sec.includes(targetName) || 
                    secL1.includes(targetName) || 
                    secL3.includes(targetName) || 
                    secL4.includes(targetName)
                )) {
                    return true;
                }
                
                return false;
            });
        }

        if (timeText && payload && payload.scanTime) {
            timeText.innerText = `Lần quét gần nhất: ${payload.scanTime}`;
        }

        if (badge) {
            badge.innerText = `${items.length} cơ hội`;
        }

        if (!items || items.length === 0) {
            wrap.innerHTML = `
                <div class="screener-empty-state">
                    <div style="font-size: 30px; margin-bottom: 8px;">🎯</div>
                    <div style="font-weight: 700; color: #cbd5e1; font-size: 13px;">Không có cổ phiếu nào khớp điều kiện trong phân ngành này</div>
                    <div style="font-size: 11.5px; color: #64748b; margin-top: 4px;">Hãy thử chọn sàn khác hoặc bấm "Xóa Lọc" để xem tất cả ngành</div>
                </div>
            `;
            return;
        }

        let rowsHtml = items.map((it, idx) => {
            const chgSign = it.changePct > 0 ? '+' : '';
            const chgColor = it.changePct > 0 ? '#00e676' : (it.changePct < 0 ? '#ff5252' : '#ffea00');
            const chgBg = it.changePct > 0 ? 'rgba(0, 230, 118, 0.12)' : (it.changePct < 0 ? 'rgba(255, 82, 82, 0.12)' : 'rgba(255, 234, 0, 0.12)');
            const priceStr = (it.price || 0).toFixed(2);
            const volStr = Number(it.volume || 0).toLocaleString('vi-VN');
            const sparkSvg = renderSparklineSVG(it.sparkline || [], it.changePct);

            return `
                <tr onclick="window.openScreenerChart('${it.symbol}')" style="cursor: pointer;" title="Bấm vào dòng để xem biểu đồ nến của ${it.symbol}">
                    <td style="text-align: center; color: #64748b; font-weight: 700;">${idx + 1}</td>
                    <td>
                        <div class="screener-sym-box">
                            <span class="screener-sym-ticker">${it.symbol}</span>
                            <span class="screener-sym-ex">${it.exchange}</span>
                        </div>
                        <div style="font-size: 10.5px; color: #94a3b8; max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${it.companyName}</div>
                    </td>
                    <td style="color: #cbd5e1; font-size: 11.5px;">${it.sector}</td>
                    <td style="text-align: right; font-family: var(--font-mono, monospace); font-weight: 800; font-size: 13px; color: #ffffff;">${priceStr}</td>
                    <td style="text-align: right;">
                        <span style="font-family: var(--font-mono, monospace); font-weight: 800; font-size: 12px; color: ${chgColor}; background: ${chgBg}; padding: 2px 6px; border-radius: 4px;">
                            ${chgSign}${it.changePct}%
                        </span>
                    </td>
                    <td style="text-align: right; font-family: var(--font-mono, monospace); font-size: 11.5px; color: #cbd5e1;">
                        <div>${volStr}</div>
                        <div style="font-size: 9.5px; color: ${it.volRatio >= 1.2 ? '#10b981' : '#64748b'}; font-weight: 700;">${it.volRatio}x MA20</div>
                    </td>
                    <td style="text-align: center;">
                        ${sparkSvg}
                    </td>
                </tr>
            `;
        }).join('');

        wrap.innerHTML = `
            <table class="screener-table">
                <thead>
                    <tr>
                        <th style="width: 44px; text-align: center;">#</th>
                        <th>CỔ PHIẾU</th>
                        <th>PHÂN NGÀNH ICB</th>
                        <th style="text-align: right;">GIÁ HIỆN TẠI</th>
                        <th style="text-align: right;">BIẾN ĐỘNG</th>
                        <th style="text-align: right;">KHỐI LƯỢNG</th>
                        <th style="text-align: center;">XU HƯỚNG 20P</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        `;
    }

    function renderSparklineSVG(prices, changePct) {
        if (!prices || prices.length < 2) return '';
        const minP = Math.min(...prices);
        const maxP = Math.max(...prices);
        const range = maxP - minP || 1;
        const w = 80;
        const h = 24;
        const pad = 2;

        const points = prices.map((p, i) => {
            const x = pad + (i / (prices.length - 1)) * (w - 2 * pad);
            const y = (h - pad) - ((p - minP) / range) * (h - 2 * pad);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ');

        const strokeColor = changePct > 0 ? '#00e676' : (changePct < 0 ? '#ff5252' : '#00f2fe');

        return `
            <svg class="sparkline-svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
                <polyline fill="none" stroke="${strokeColor}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" points="${points}" />
            </svg>
        `;
    }

    // Public Window Methods
    window.setScreenerExchange = function(ex) {
        if (g_currentExchange === ex) return;
        g_currentExchange = ex;
        ['ALL', 'VN30', 'HOSE', 'HNX', 'UPCOM'].forEach(e => {
            const b = document.getElementById(`btnEx${e}`);
            if (b) b.classList.toggle('active', e === ex);
        });
        fetchScreenerData(true);
    };

    window.runScreenerScan = function() {
        fetchScreenerData(true);
    };

    window.openScreenerChart = function(symbol) {
        if (!symbol) return;
        const sym = String(symbol).trim().toUpperCase();
        
        // 1. Chuyển sang Tab Biểu đồ nến
        if (typeof window.switchAppMode === 'function') {
            window.switchAppMode('cophieu');
        }
        
        // 2. Cập nhật nhãn hiển thị mã trên thanh công cụ
        const disp = document.getElementById('currentSymbolDisplay');
        if (disp) disp.innerText = sym;
        
        // 3. Nạp dữ liệu nến cho biểu đồ chính
        if (typeof window.fetchStockData === 'function') {
            window.fetchStockData(sym, 1);
        } else if (typeof window.loadSymbol === 'function') {
            window.loadSymbol(sym);
        } else if (typeof fetchStockData === 'function') {
            fetchStockData(sym, 1);
        }
        
        // 4. Lưu lại lịch sử mã vừa mở
        try {
            localStorage.setItem('last_opened_symbol', sym);
        } catch(e) {}
    };

    window.initScreenerProView = function() {
        const container = document.getElementById('appContent_locpro');
        if (container && (!container.innerHTML || container.innerHTML.trim() === '')) {
            renderScreenerLayout();
            fetchScreenerData();
        }
    };
})();
