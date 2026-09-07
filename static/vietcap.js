let vietcapSymbol = '';
let vietcapMode = 'quarterly'; // 'quarterly' or 'yearly'
let vietcapMetrics = null;
let vietcapDataCache = {};
let vietcapRatios = null;
let currentTab = 'BALANCE_SHEET';

let vietcapPage = 0; // 0 for latest
const pageSizeQuarter = 8;
const pageSizeYear = 5;

function openVietCapModal() {
    const displayEl = document.getElementById('currentSymbolDisplay');
    vietcapSymbol = (displayEl ? displayEl.innerText.trim().toUpperCase() : '') || 'HPG';
    document.getElementById('vietcapModalSymbol').innerText = vietcapSymbol;
    document.getElementById('vietcapModalOverlay').style.display = 'flex';
    
    // reset state
    vietcapPage = 0;
    const btnPrev = document.getElementById('btnVietcapPrev');
    if (btnPrev) btnPrev.disabled = true;
    const btnNext = document.getElementById('btnVietcapNext');
    if (btnNext) btnNext.disabled = false;
    
    vietcapDataCache = {};
    vietcapRatios = null;
    vietcapMetrics = null;
    
    switchVietcapSubtab('BALANCE_SHEET');
}

function closeVietcapModal(event) {
    if (event.target === document.getElementById('vietcapModalOverlay') || event.target.classList.contains('close-btn')) {
        document.getElementById('vietcapModalOverlay').style.display = 'none';
    }
}

function switchVietcapMode(mode) {
    vietcapMode = mode;
    vietcapPage = 0;
    const btnPrev = document.getElementById('btnVietcapPrev');
    if (btnPrev) btnPrev.disabled = true;
    const btnNext = document.getElementById('btnVietcapNext');
    if (btnNext) btnNext.disabled = false;
    
    if (mode === 'quarterly') {
        document.getElementById('vietcapTabQuarter').style.color = '#fff';
        document.getElementById('vietcapTabQuarter').style.borderBottom = '2px solid #9c27b0';
        document.getElementById('vietcapTabYear').style.color = '#aaa';
        document.getElementById('vietcapTabYear').style.borderBottom = '2px solid transparent';
    } else {
        document.getElementById('vietcapTabYear').style.color = '#fff';
        document.getElementById('vietcapTabYear').style.borderBottom = '2px solid #9c27b0';
        document.getElementById('vietcapTabQuarter').style.color = '#aaa';
        document.getElementById('vietcapTabQuarter').style.borderBottom = '2px solid transparent';
    }
    
    loadVietcapData();
}

function switchVietcapSubtab(tab) {
    document.querySelectorAll('[id^="vietcapSubtab"]').forEach(el => {
        el.style.color = '#aaa';
        el.style.borderBottom = '2px solid transparent';
    });
    
    let activeId = '';
    if (tab === 'BALANCE_SHEET') activeId = 'vietcapSubtabBalance';
    if (tab === 'INCOME_STATEMENT') activeId = 'vietcapSubtabIncome';
    if (tab === 'CASH_FLOW') activeId = 'vietcapSubtabCash';
    if (tab === 'RATIOS') activeId = 'vietcapSubtabRatios';
    
    document.getElementById(activeId).style.color = '#fff';
    document.getElementById(activeId).style.borderBottom = '2px solid #2962FF';
    
    currentTab = tab;
    
    if (tab === 'RATIOS') {
        document.getElementById('vietcapTableContainer').style.display = 'none';
        document.getElementById('vietcapRatiosContainer').style.display = 'block';
    } else {
        document.getElementById('vietcapTableContainer').style.display = 'block';
        document.getElementById('vietcapRatiosContainer').style.display = 'none';
    }
    
    loadVietcapData();
}

function vietcapGoPrev() {
    if (vietcapPage > 0) {
        vietcapPage--;
        const btnPrev = document.getElementById('btnVietcapPrev');
        if (btnPrev && vietcapPage === 0) btnPrev.disabled = true;
        const btnNext = document.getElementById('btnVietcapNext');
        if (btnNext) btnNext.disabled = false;
        loadVietcapData();
    }
}

function vietcapGoNext() {
    vietcapPage++;
    const btnPrev = document.getElementById('btnVietcapPrev');
    if (btnPrev) btnPrev.disabled = false;
    loadVietcapData();
}

async function fetchVietcapMetrics() {
    if (!vietcapMetrics) {
        const res = await fetch(`/api/vietcap/metrics?symbol=${vietcapSymbol}`);
        const data = await res.json();
        if (data.data) {
            vietcapMetrics = data.data;
        }
    }
}

async function fetchVietcapSection(section) {
    if (!vietcapDataCache[section]) {
        const res = await fetch(`/api/vietcap/financial-statement?symbol=${vietcapSymbol}&section=${section}`);
        const data = await res.json();
        if (data.data) {
            let years = data.data.years || [];
            let quarters = data.data.quarters || [];
            
            // Map yearReport to year, lengthReport to quarter, and reverse (newest first)
            years = years.map(x => ({...x, year: x.yearReport, quarter: x.lengthReport})).reverse();
            quarters = quarters.map(x => ({...x, year: x.yearReport, quarter: x.lengthReport})).reverse();
            
            vietcapDataCache[section] = { years, quarters };
        }
    }
    return vietcapDataCache[section];
}

async function fetchVietcapRatios() {
    if (!vietcapRatios) {
        const res = await fetch(`/api/vietcap/statistics-financial?symbol=${vietcapSymbol}`);
        const data = await res.json();
        if (data.data) {
            // Reverse to newest first
            vietcapRatios = data.data.reverse();
        }
    }
    return vietcapRatios;
}

async function loadVietcapData() {
    document.getElementById('vietcapLoading').style.display = 'block';
    document.getElementById('vietcapTableBody').innerHTML = '';
    document.getElementById('vietcapTableHead').innerHTML = '';
    const ratiosHead = document.getElementById('vietcapRatiosHead');
    if (ratiosHead) ratiosHead.innerHTML = '';
    const ratiosBody = document.getElementById('vietcapRatiosBody');
    if (ratiosBody) ratiosBody.innerHTML = '';
    
    try {
        await fetchVietcapMetrics();
        
        let displayData = [];
        let label = 'Không có dữ liệu';
        
        if (currentTab === 'RATIOS') {
            const allRatios = await fetchVietcapRatios();
            if (allRatios && allRatios.length > 0) {
                // Filter by mode
                const ratioType = vietcapMode === 'quarterly' ? 'RATIO_TTM' : 'RATIO_YEAR';
                const filtered = allRatios.filter(x => x.ratioType === ratioType);
                
                // Pagination slice
                const size = vietcapMode === 'quarterly' ? pageSizeQuarter : pageSizeYear;
                const startIdx = vietcapPage * size;
                const endIdx = startIdx + size;
                displayData = filtered.slice(startIdx, endIdx);
                
                // Render
                renderVietcapRatios(displayData);
                
                if (displayData.length > 0) {
                    const first = displayData[displayData.length - 1]; // oldest in current page
                    const last = displayData[0]; // newest in current page
                    if (vietcapMode === 'quarterly') {
                        label = `Q${last.quarter}/${last.year} - Q${first.quarter}/${first.year}`;
                    } else {
                        label = `${last.year} - ${first.year}`;
                    }
                }
            }
        } else {
            const fullData = await fetchVietcapSection(currentTab);
            if (fullData) {
                const targetList = vietcapMode === 'quarterly' ? fullData.quarters : fullData.years;
                if (targetList && targetList.length > 0) {
                    // Pagination slice
                    const size = vietcapMode === 'quarterly' ? pageSizeQuarter : pageSizeYear;
                    const startIdx = vietcapPage * size;
                    const endIdx = startIdx + size;
                    displayData = targetList.slice(startIdx, endIdx);
                    
                    // Render
                    renderVietcapTable(currentTab, displayData);
                    
                    if (displayData.length > 0) {
                        const first = displayData[displayData.length - 1]; // oldest in current page
                        const last = displayData[0]; // newest in current page
                        if (vietcapMode === 'quarterly') {
                            label = `Q${last.quarter}/${last.year} - Q${first.quarter}/${first.year}`;
                        } else {
                            label = `${last.year} - ${first.year}`;
                        }
                    }
                }
            }
        }
        
        document.getElementById('vietcapPeriodLabel').innerText = label;
        
    } catch (err) {
        console.error(err);
    }
    
    document.getElementById('vietcapLoading').style.display = 'none';
}

function buildTree(metricsList) {
    if (!metricsList) return [];
    const map = {};
    const roots = [];
    const lastAtLevel = {};
    
    metricsList.forEach(item => {
        const node = { ...item, children: [] };
        map[item.field] = node;
        
        let parentNode = null;
        if (item.parent && map[item.parent]) {
            parentNode = map[item.parent];
        } else if (item.level > 1 && lastAtLevel[item.level - 1]) {
            parentNode = lastAtLevel[item.level - 1];
            node.parent = parentNode.field; // ensure parent is set for toggle functionality
        }
        
        if (parentNode) {
            parentNode.children.push(node);
        } else {
            roots.push(node);
        }
        
        lastAtLevel[item.level] = node;
    });
    
    return roots;
}

function renderVietcapTable(tab, pageData) {
    if (!vietcapMetrics || !vietcapMetrics[tab] || !pageData) return;
    
    const tree = buildTree(vietcapMetrics[tab]);
    
    let theadHtml = '<tr><th class="vc-sticky-col" style="min-width: 250px; text-align: left; position: sticky; left: 0; background: #1e222d; z-index: 4; padding: 8px 12px; border-bottom: 1px solid #2a2e39; color: #787B86; top: 0; font-weight: normal; font-size: 13px;">Khoản mục</th>';
    pageData.forEach(col => {
        const title = vietcapMode === 'quarterly' ? `Q${col.quarter}/${col.year}` : `${col.year}`;
        theadHtml += `<th style="padding: 8px 12px; border-bottom: 1px solid #2a2e39; background-color: #1e222d; color: #d1d4dc; position: sticky; top: 0; z-index: 2; text-align: right; font-weight: normal; font-size: 13px;">${title}</th>`;
    });
    theadHtml += '</tr>';
    document.getElementById('vietcapTableHead').innerHTML = theadHtml;
    
    let tbodyHtml = '';
    
    function renderRow(node, depth) {
        const hasChildren = node.children && node.children.length > 0;
        const padding = 10 + depth * 20;
        const iconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; transition: 0.2s;"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
        const icon = hasChildren ? `<span style="display:inline-block; width:18px; cursor:pointer; color:#787B86;" onclick="toggleVietcapRow(this, '${node.field}')">${iconSvg}</span>` : `<span style="display:inline-block; width:18px;"></span>`;
        
        const fontWeight = depth === 0 ? 'bold' : 'normal';
        const color = depth === 0 ? '#F0B90B' : '#d1d4dc'; // Premium Gold
        const textTransform = depth === 0 ? 'uppercase' : 'none';
        
        tbodyHtml += `<tr class="vc-row vc-depth-${depth}" data-field="${node.field}" data-parent="${node.parent || ''}">`;
        tbodyHtml += `<td class="vc-sticky-col" style="padding: 8px 12px; border-bottom: 1px solid #2a2e39; padding-left: ${padding}px; position: sticky; left: 0; background: #131722; z-index: 3; font-weight: ${fontWeight}; color: ${color}; text-transform: ${textTransform}; white-space: nowrap; font-size: 13px;">${icon} ${node.titleVi}</td>`;
        
        pageData.forEach(col => {
            let val = col[node.field];
            let valClass = '';
            if (val === null || val === undefined) val = '-';
            else {
                if (val < 0) valClass = 'vc-val-neg';
                val = (val / 1e9).toLocaleString('en-US', {minimumFractionDigits: 1, maximumFractionDigits: 1});
            }
            tbodyHtml += `<td class="${valClass}" style="padding: 8px 12px; border-bottom: 1px solid #2a2e39; text-align: right; font-size: 13px;">${val}</td>`;
        });
        tbodyHtml += `</tr>`;
        
        if (hasChildren) {
            node.children.forEach(child => renderRow(child, depth + 1));
        }
    }
    
    tree.forEach(root => renderRow(root, 0));
    document.getElementById('vietcapTableBody').innerHTML = tbodyHtml;
}

window.toggleVietcapRow = function(el, field) {
    const svg = el.querySelector('svg');
    const isExpanded = svg && svg.style.transform !== 'rotate(-90deg)';
    if (svg) svg.style.transform = isExpanded ? 'rotate(-90deg)' : 'rotate(0deg)';
    
    const rows = document.querySelectorAll('#vietcapTableBody tr');
    let inside = false;
    let parentDepth = -1;
    
    for(let i=0; i<rows.length; i++) {
        const row = rows[i];
        if (row.getAttribute('data-field') === field) {
            inside = true;
            const match = row.className.match(/vc-depth-(\d+)/);
            if (match) parentDepth = parseInt(match[1]);
            continue;
        }
        
        if (inside) {
            const match = row.className.match(/vc-depth-(\d+)/);
            if (!match) continue;
            const depth = parseInt(match[1]);
            if (depth <= parentDepth) {
                break; // end of children
            }
            if (isExpanded) {
                row.style.display = 'none';
                const childSvg = row.querySelector('td span svg');
                if (childSvg && childSvg.style.transform !== 'rotate(-90deg)') {
                    childSvg.style.transform = 'rotate(-90deg)';
                }
            } else {
                if (depth === parentDepth + 1) {
                    row.style.display = '';
                }
            }
        }
    }
}

function renderVietcapRatios(pageData) {
    if (!pageData || pageData.length === 0) return;
    
    let theadHtml = '<tr><th class="vc-sticky-col" style="min-width: 250px; text-align: left; position: sticky; left: 0; background: #1e222d; z-index: 4; padding: 8px 12px; border-bottom: 1px solid #2a2e39; color: #787B86; top: 0; font-weight: normal; font-size: 13px;">Chỉ số tài chính</th>';
    pageData.forEach(col => {
        const title = vietcapMode === 'quarterly' ? `Q${col.quarter}/${col.year}` : `${col.year}`;
        theadHtml += `<th style="padding: 8px 12px; border-bottom: 1px solid #2a2e39; background-color: #1e222d; color: #d1d4dc; position: sticky; top: 0; z-index: 2; text-align: right; font-weight: normal; font-size: 13px;">${title}</th>`;
    });
    theadHtml += '</tr>';
    document.getElementById('vietcapRatiosHead').innerHTML = theadHtml;
    
    const latest = pageData[0]; // pageData[0] is newest because array is reversed
    
    const groups = [
        {
            title: 'Định giá (Valuation)',
            keys: [
                { k: 'pe', n: 'P/E' },
                { k: 'pb', n: 'P/B' },
                { k: 'ps', n: 'P/S' },
                { k: 'evToEbitda', n: 'EV/EBITDA' },
                { k: 'priceToCashFlow', n: 'P/CF' },
                { k: 'marketCap', n: 'Vốn hóa TT (tỷ)' },
                { k: 'dividendYield', n: 'Tỷ suất cổ tức (%)', pct: true }
            ]
        },
        {
            title: 'Sinh lời (Profitability)',
            keys: [
                { k: 'roe', n: 'ROE (%)', pct: true },
                { k: 'roa', n: 'ROA (%)', pct: true },
                { k: 'roic', n: 'ROIC (%)', pct: true },
                { k: 'grossMargin', n: 'Biên LN Gộp (%)', pct: true },
                { k: 'ebitMargin', n: 'Biên EBIT (%)', pct: true },
                { k: 'afterTaxProfitMargin', n: 'Biên LN Ròng (%)', pct: true }
            ]
        },
        {
            title: 'Thanh khoản & Đòn bẩy (Liquidity & Solvency)',
            keys: [
                { k: 'currentRatio', n: 'Thanh toán Hiện hành' },
                { k: 'quickRatio', n: 'Thanh toán Nhanh' },
                { k: 'cashRatio', n: 'Thanh toán Bằng tiền' },
                { k: 'debtToEquity', n: 'Nợ vay / Vốn CSH' },
                { k: 'financialLeverage', n: 'Đòn bẩy Tài chính' }
            ]
        },
        {
            title: 'Hiệu quả hoạt động (Efficiency)',
            keys: [
                { k: 'daySaleOutstanding', n: 'Số ngày Thu tiền BQ' },
                { k: 'daysInventoryOutstanding', n: 'Số ngày Tồn kho BQ' },
                { k: 'daysPayableOutstanding', n: 'Số ngày Trả nợ' },
                { k: 'cashCycle', n: 'Chu kỳ Tiền mặt' },
                { k: 'assetTurnover', n: 'Vòng quay Tổng tài sản' }
            ]
        }
    ];
    
    if (latest.netInterestMargin !== undefined || latest.npl !== undefined) {
        groups.push({
            title: 'Ngân hàng (Banking)',
            keys: [
                { k: 'netInterestMargin', n: 'NIM (%)', pct: true },
                { k: 'npl', n: 'Tỷ lệ Nợ xấu (%)', pct: true },
                { k: 'casaRatio', n: 'Tỷ lệ CASA (%)', pct: true },
                { k: 'costToIncome', n: 'CIR (%)', pct: true }
            ]
        });
    }
    
    let tbodyHtml = '';
    
    groups.forEach((g, gIdx) => {
        tbodyHtml += `<tr class="vc-row vc-depth-0" data-field="group_${gIdx}">`;
        const iconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; transition: 0.2s;"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
        tbodyHtml += `<td class="vc-sticky-col" style="padding: 8px 12px; border-bottom: 1px solid #2a2e39; padding-left: 10px; position: sticky; left: 0; background: #131722; z-index: 3; font-weight: bold; color: #F0B90B; text-transform: uppercase; white-space: nowrap; font-size: 13px;"><span style="display:inline-block; width:18px; cursor:pointer; color:#787B86;" onclick="toggleVietcapRatioRow(this, 'group_${gIdx}')">${iconSvg}</span> ${g.title}</td>`;
        
        pageData.forEach(() => {
            tbodyHtml += `<td style="padding: 8px 12px; border-bottom: 1px solid #2a2e39; background: #131722;"></td>`;
        });
        tbodyHtml += `</tr>`;
        
        g.keys.forEach(item => {
            tbodyHtml += `<tr class="vc-row vc-depth-1 group_${gIdx}">`;
            tbodyHtml += `<td class="vc-sticky-col" style="padding: 8px 12px; border-bottom: 1px solid #2a2e39; padding-left: 28px; position: sticky; left: 0; background: #131722; z-index: 3; font-weight: normal; color: #d1d4dc; white-space: nowrap; font-size: 13px;"><span style="display:inline-block; width:18px;"></span> ${item.n}</td>`;
            
            pageData.forEach(col => {
                let val = col[item.k];
                let valClass = '';
                if (val === null || val === undefined) val = '-';
                else {
                    if (val < 0) valClass = 'vc-val-neg';
                    if (item.k === 'marketCap') val = (val / 1e9).toLocaleString('en-US', {minimumFractionDigits: 1, maximumFractionDigits: 1});
                    else if (item.pct && val < 1 && val > -1) val = (val * 100).toFixed(2);
                    else val = val.toFixed(2);
                }
                tbodyHtml += `<td class="${valClass}" style="padding: 8px 12px; border-bottom: 1px solid #2a2e39; text-align: right; font-size: 13px;">${val}</td>`;
            });
            tbodyHtml += `</tr>`;
        });
    });
    
    document.getElementById('vietcapRatiosBody').innerHTML = tbodyHtml;
}

window.toggleVietcapRatioRow = function(el, groupClass) {
    const svg = el.querySelector('svg');
    const isExpanded = svg && svg.style.transform !== 'rotate(-90deg)';
    if (svg) svg.style.transform = isExpanded ? 'rotate(-90deg)' : 'rotate(0deg)';
    const rows = document.querySelectorAll('#vietcapRatiosBody tr.' + groupClass);
    rows.forEach(row => {
        row.style.display = isExpanded ? 'none' : '';
    });
}


async function exportVietcapData(format) {
    if (!vietcapSymbol) return;
    
    try {
        let fullDataList = [];
        let schema = [];
        
        if (currentTab === 'RATIOS') {
            const allRatios = await fetchVietcapRatios();
            const ratioType = vietcapMode === 'quarterly' ? 'RATIO_TTM' : 'RATIO_YEAR';
            fullDataList = allRatios.filter(x => x.ratioType === ratioType);
        } else {
            const fullData = await fetchVietcapSection(currentTab);
            fullDataList = vietcapMode === 'quarterly' ? fullData.quarters : fullData.years;
            await fetchVietcapMetrics();
            schema = vietcapMetrics[currentTab];
        }
        
        if (!fullDataList || fullDataList.length === 0) {
            alert('Không có dữ liệu để xuất');
            return;
        }
        
        const columns = ['Khoan_muc'];
        fullDataList.forEach(col => {
            const title = vietcapMode === 'quarterly' ? `Q${col.quarter}_${col.year}` : `Y${col.year}`;
            columns.push(title);
        });
        
        const rows = [];
        
        if (currentTab === 'RATIOS') {
            const latest = fullDataList[0];
            const groups = [
                { keys: [
                    { k: 'pe', n: 'P/E' }, { k: 'pb', n: 'P/B' }, { k: 'ps', n: 'P/S' },
                    { k: 'evToEbitda', n: 'EV/EBITDA' }, { k: 'priceToCashFlow', n: 'P/CF' },
                    { k: 'marketCap', n: 'Vốn hóa TT (tỷ)' }, { k: 'dividendYield', n: 'Tỷ suất cổ tức (%)', pct: true }
                ]},
                { keys: [
                    { k: 'roe', n: 'ROE (%)', pct: true }, { k: 'roa', n: 'ROA (%)', pct: true },
                    { k: 'roic', n: 'ROIC (%)', pct: true }, { k: 'grossMargin', n: 'Biên LN Gộp (%)', pct: true },
                    { k: 'ebitMargin', n: 'Biên EBIT (%)', pct: true }, { k: 'afterTaxProfitMargin', n: 'Biên LN Ròng (%)', pct: true }
                ]},
                { keys: [
                    { k: 'currentRatio', n: 'Thanh toán Hiện hành' }, { k: 'quickRatio', n: 'Thanh toán Nhanh' },
                    { k: 'cashRatio', n: 'Thanh toán Bằng tiền' }, { k: 'debtToEquity', n: 'Nợ vay / Vốn CSH' },
                    { k: 'financialLeverage', n: 'Đòn bẩy Tài chính' }
                ]},
                { keys: [
                    { k: 'daySaleOutstanding', n: 'Số ngày Thu tiền BQ' }, { k: 'daysInventoryOutstanding', n: 'Số ngày Tồn kho BQ' },
                    { k: 'daysPayableOutstanding', n: 'Số ngày Trả nợ' }, { k: 'cashCycle', n: 'Chu kỳ Tiền mặt' },
                    { k: 'assetTurnover', n: 'Vòng quay Tổng tài sản' }
                ]}
            ];
            
            if (latest && (latest.netInterestMargin !== undefined || latest.npl !== undefined)) {
                groups.push({ keys: [
                    { k: 'netInterestMargin', n: 'NIM (%)', pct: true }, { k: 'npl', n: 'Tỷ lệ Nợ xấu (%)', pct: true },
                    { k: 'casaRatio', n: 'Tỷ lệ CASA (%)', pct: true }, { k: 'costToIncome', n: 'CIR (%)', pct: true }
                ]});
            }
            
            groups.forEach(g => {
                g.keys.forEach(item => {
                    let rowData = { 'Khoan_muc': item.n };
                    fullDataList.forEach((col, idx) => {
                        let val = col[item.k];
                        if (val !== null && val !== undefined) {
                            if (item.k === 'marketCap') val = val / 1e9;
                            else if (item.pct && val < 1 && val > -1) val = val * 100;
                        }
                        rowData[columns[idx + 1]] = val !== null && val !== undefined ? val : null;
                    });
                    rows.push(rowData);
                });
            });
        } else {
            function extractRow(node, depth) {
                let rowData = { 'Khoan_muc': ('-- '.repeat(depth)) + node.titleVi };
                fullDataList.forEach((col, idx) => {
                    let val = col[node.field];
                    if (val !== null && val !== undefined) val = val / 1e9;
                    rowData[columns[idx + 1]] = val !== null && val !== undefined ? val : null;
                });
                rows.push(rowData);
                if (node.children && node.children.length > 0) {
                    node.children.forEach(child => extractRow(child, depth + 1));
                }
            }
            if (schema) {
                schema.forEach(root => extractRow(root, 0));
            }
        }
        
        const payload = {
            symbol: vietcapSymbol,
            tab: currentTab,
            format: format,
            columns: columns,
            data: rows
        };
        
        const res = await fetch('/api/vietcap/export', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        
        if (!res.ok) throw new Error('Export failed');
        
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ext = format === 'excel' ? 'xlsx' : format;
        a.download = `${vietcapSymbol}_${currentTab}_${vietcapMode}.${ext}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
    } catch (err) {
        console.error(err);
        alert('Có lỗi xảy ra khi xuất dữ liệu: ' + err.message);
    }
}
