/**
 * sector_detail_modal.js
 * Comprehensive Sector Analytics Modal logic (Dual-pane ECharts, Intraday Donut & Value Bars, Stock Tables, Subsectors)
 */

(function() {
    let currentSecIcb = '9000';
    let currentSecDetailData = null;
    let currentSecHistoryData = null;
    let currentSecMode = 'flow'; // 'flow' | 'kl_mb' | 'gt_mb'
    let currentSecTf = '1W'; // '1W', '1M', '3M', '6M', '1Y', 'YTD'
    let currentSecStockSubTab = 'biendong'; // 'biendong' | 'foreign' | 'finance'
    let secStockSort = { key: 'volume', asc: false };

    let secDualChartInstance = null;
    let secDonutChartInstance = null;

    window.openSectorDetailModal = async function(icbCode) {
        if (!icbCode) return;
        currentSecIcb = String(icbCode);
        
        const modal = document.getElementById('sectorDetailModal');
        if (!modal) {
            console.error("Modal #sectorDetailModal not found in DOM");
            return;
        }
        modal.style.display = 'flex';
        modal.classList.add('show');
        
        // Reset tabs safely
        if (typeof window.switchSecMainTab === 'function') {
            window.switchSecMainTab('overview');
        }
        
        try {
            await Promise.all([
                fetchSectorDetailData(),
                fetchSectorHistoryData()
            ]);
        } catch (err) {
            console.error("Error fetching sector modal data:", err);
        }
        
        // Update header & breadths
        updateModalHeader();
        
        // Render current view
        if (typeof window.renderSecDualChart === 'function') window.renderSecDualChart();
        if (typeof window.renderSecDonutAndBars === 'function') window.renderSecDonutAndBars();
        if (typeof window.renderSecStocksTable === 'function') window.renderSecStocksTable();
        if (typeof window.renderSecChildrenTable === 'function') window.renderSecChildrenTable();
    };

    window.closeSectorDetailModal = function() {
        const modal = document.getElementById('sectorDetailModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
    };

    // Close on ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            window.closeSectorDetailModal();
        }
    });

    async function fetchSectorDetailData() {
        try {
            const res = await fetch(`/api/market/sector-detail?icbCode=${currentSecIcb}`);
            if (!res.ok) return;
            currentSecDetailData = await res.json();
        } catch (e) {
            console.error("fetchSectorDetailData error:", e);
        }
    }

    async function fetchSectorHistoryData() {
        try {
            const res = await fetch(`/api/market/sector-history-flow?icbCode=${currentSecIcb}&timeframe=${currentSecTf}&mode=${currentSecMode}`);
            if (!res.ok) return;
            currentSecHistoryData = await res.json();
        } catch (e) {
            console.error("fetchSectorHistoryData error:", e);
        }
    }

    function updateModalHeader() {
        if (!currentSecDetailData) return;
        
        const titleEl = document.getElementById('secModalTitle');
        if (titleEl) titleEl.innerText = currentSecDetailData.name || `NGÀNH (${currentSecIcb})`;
        
        const c = currentSecDetailData.counts || { green: 0, red: 0, yellow: 0 };
        const gEl = document.getElementById('secStatGreen');
        const rEl = document.getElementById('secStatRed');
        const yEl = document.getElementById('secStatYellow');
        const chEl = document.getElementById('secStatChange');
        
        if (gEl) gEl.innerText = c.green || 0;
        if (rEl) rEl.innerText = c.red || 0;
        if (yEl) yEl.innerText = c.yellow || 0;
        
        const ch = typeof currentSecDetailData.change1d === 'number' ? currentSecDetailData.change1d : 0;
        if (chEl) {
            chEl.style.color = ch > 0 ? '#00c073' : (ch < 0 ? '#ef4444' : '#eab308');
            chEl.innerText = (ch > 0 ? '+' : '') + ch.toFixed(2) + '%';
        }
    }

    window.switchSecMainTab = function(tabId) {
        document.querySelectorAll('.sec-main-tab-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById('secMainTab_' + tabId);
        if (activeBtn) activeBtn.classList.add('active');
        
        const viewOverview = document.getElementById('secView_overview');
        const viewStocks = document.getElementById('secView_stocks');
        const viewChildren = document.getElementById('secView_children');
        
        if (viewOverview) viewOverview.style.display = (tabId === 'overview' ? 'flex' : 'none');
        if (viewStocks) viewStocks.style.display = (tabId === 'stocks' ? 'flex' : 'none');
        if (viewChildren) viewChildren.style.display = (tabId === 'children' ? 'flex' : 'none');
        
        if (tabId === 'overview') {
            setTimeout(() => {
                if (secDualChartInstance) secDualChartInstance.resize();
                if (secDonutChartInstance) secDonutChartInstance.resize();
            }, 50);
        } else if (tabId === 'stocks') {
            renderSecStocksTable();
        } else if (tabId === 'children') {
            renderSecChildrenTable();
        }
    };

    window.switchSecMode = async function(mode) {
        currentSecMode = mode;
        document.querySelectorAll('.sec-mode-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById('secMode_' + mode);
        if (activeBtn) activeBtn.classList.add('active');
        
        await fetchSectorHistoryData();
        renderSecDualChart();
        renderSecDonutAndBars();
    };

    window.switchSecTf = async function(tf, btn) {
        currentSecTf = tf;
        document.querySelectorAll('.sec-tf-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        
        await fetchSectorHistoryData();
        renderSecDualChart();
    };

    window.switchSecStockSubTab = function(subtab) {
        currentSecStockSubTab = subtab;
        document.querySelectorAll('.sec-subtab-btn').forEach(b => b.classList.remove('active'));
        const activeBtn = document.getElementById('secStockSubTab_' + subtab);
        if (activeBtn) activeBtn.classList.add('active');
        
        renderSecStocksTable();
    };

    // ----------------------------------------------------
    // CHARTS RENDERING (ECharts)
    // ----------------------------------------------------
    window.renderSecDualChart = function() {
        const dom = document.getElementById('secEchartDualHistory');
        if (!dom || typeof echarts === 'undefined') return;
        
        if (!secDualChartInstance) {
            secDualChartInstance = echarts.init(dom);
            window.addEventListener('resize', () => secDualChartInstance && secDualChartInstance.resize());
        }
        
        if (!currentSecHistoryData || !currentSecHistoryData.dates) return;
        
        const d = currentSecHistoryData;
        const labels = d.labels || ["Tăng", "Không đổi", "Giảm"];
        const unit = d.unit || "tỷ";
        
        const option = {
            backgroundColor: 'transparent',
            animation: false,
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(20, 23, 33, 0.95)',
                borderColor: '#2a2e39',
                borderWidth: 1,
                textStyle: { color: '#fff', fontSize: 12 },
                formatter: function(params) {
                    if (!params || !params.length) return '';
                    const date = params[0].axisValue;
                    let html = `<div style="font-weight:700; margin-bottom:4px; border-bottom:1px solid #363c4e; padding-bottom:3px;">${date}</div>`;
                    params.forEach(p => {
                        let colorDot = `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:9px;height:9px;background-color:${p.color};"></span>`;
                        let valStr = (p.seriesType === 'line') ? p.value : `${p.value} ${unit}`;
                        html += `<div style="display:flex; justify-content:space-between; gap:12px; margin: 2px 0;">
                            <span>${colorDot} ${p.seriesName}:</span>
                            <span style="font-weight:700; font-family:monospace;">${valStr}</span>
                        </div>`;
                    });
                    return html;
                }
            },
            legend: {
                bottom: 0,
                textStyle: { color: '#787b86', fontSize: 11.5 },
                icon: 'circle',
                itemWidth: 8,
                itemHeight: 8,
                data: [d.sectorTitle || 'Chỉ số ngành', labels[0], labels[1], labels[2]]
            },
            grid: [
                { left: '45px', right: '20px', top: '15px', height: '42%' },
                { left: '45px', right: '20px', top: '62%', height: '26%' }
            ],
            xAxis: [
                {
                    type: 'category',
                    gridIndex: 0,
                    data: d.dates,
                    axisLine: { lineStyle: { color: '#2a2e39' } },
                    axisLabel: { show: false },
                    axisTick: { show: false }
                },
                {
                    type: 'category',
                    gridIndex: 1,
                    data: d.dates,
                    axisLine: { lineStyle: { color: '#2a2e39' } },
                    axisLabel: { color: '#787b86', fontSize: 10.5 },
                    axisTick: { show: false }
                }
            ],
            yAxis: [
                {
                    type: 'value',
                    gridIndex: 0,
                    scale: true,
                    axisLine: { show: false },
                    splitLine: { lineStyle: { color: '#1e222d' } },
                    axisLabel: { color: '#787b86', fontSize: 10.5 }
                },
                {
                    type: 'value',
                    gridIndex: 1,
                    axisLine: { show: false },
                    splitLine: { lineStyle: { color: '#1e222d' } },
                    axisLabel: { color: '#787b86', fontSize: 10 }
                }
            ],
            series: [
                {
                    name: d.sectorTitle || 'Chỉ số ngành',
                    type: 'line',
                    xAxisIndex: 0,
                    yAxisIndex: 0,
                    data: d.indexPoints,
                    showSymbol: true,
                    symbolSize: 6,
                    itemStyle: { color: '#00b0ff' },
                    lineStyle: { width: 2, color: '#00b0ff' },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(0, 176, 255, 0.25)' },
                            { offset: 1, color: 'rgba(0, 176, 255, 0.00)' }
                        ])
                    }
                },
                {
                    name: labels[0],
                    type: 'bar',
                    stack: 'total',
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    data: d.seriesGreen,
                    itemStyle: { color: '#00c073', borderRadius: [0, 0, 2, 2] },
                    barWidth: '40%'
                },
                {
                    name: labels[1],
                    type: 'bar',
                    stack: 'total',
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    data: d.seriesYellow,
                    itemStyle: { color: '#eab308' },
                    barWidth: '40%'
                },
                {
                    name: labels[2],
                    type: 'bar',
                    stack: 'total',
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    data: d.seriesRed,
                    itemStyle: { color: '#ef4444', borderRadius: [2, 2, 0, 0] },
                    barWidth: '40%'
                }
            ]
        };
        
        secDualChartInstance.setOption(option, true);
    };

    window.renderSecDonutAndBars = function() {
        const dom = document.getElementById('secEchartDonut');
        if (!dom || typeof echarts === 'undefined') return;
        
        if (!secDonutChartInstance) {
            secDonutChartInstance = echarts.init(dom);
            window.addEventListener('resize', () => secDonutChartInstance && secDonutChartInstance.resize());
        }
        
        if (!currentSecDetailData) return;
        
        let pGreen = 0, pYellow = 0, pRed = 0;
        let vGreen = 0, vYellow = 0, vRed = 0;
        let lGreen = "Tăng", lYellow = "Không đổi", lRed = "Giảm";
        let unitStr = "tỷ";
        
        if (currentSecMode === 'flow') {
            const f = currentSecDetailData.flow || {};
            pGreen = f.greenPct || 0;
            pYellow = f.yellowPct || 0;
            pRed = f.redPct || 0;
            vGreen = f.greenVal || 0;
            vYellow = f.yellowVal || 0;
            vRed = f.redVal || 0;
            lGreen = "Tăng"; lYellow = "Không đổi"; lRed = "Giảm";
            unitStr = "tỷ";
        } else if (currentSecMode === 'kl_mb') {
            const act = currentSecDetailData.activeMB || {};
            pGreen = act.buyVolPct || 0;
            pYellow = act.mbVolPct || 0;
            pRed = act.sellVolPct || 0;
            vGreen = act.buyVol || 0;
            vYellow = act.mbVol || 0;
            vRed = act.sellVol || 0;
            lGreen = "Mua chủ động"; lYellow = "M/B"; lRed = "Bán chủ động";
            unitStr = "triệu";
        } else { // gt_mb
            const act = currentSecDetailData.activeMB || {};
            pGreen = act.buyValPct || 0;
            pYellow = act.mbValPct || 0;
            pRed = act.sellValPct || 0;
            vGreen = act.buyVal || 0;
            vYellow = act.mbVal || 0;
            vRed = act.sellVal || 0;
            lGreen = "Mua chủ động"; lYellow = "M/B"; lRed = "Bán chủ động";
            unitStr = "tỷ";
        }
        
        // Donut Chart
        const option = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(20, 23, 33, 0.95)',
                borderColor: '#2a2e39',
                borderWidth: 1,
                textStyle: { color: '#fff', fontSize: 12 },
                formatter: '{b}: {d}%'
            },
            series: [
                {
                    type: 'pie',
                    radius: ['45%', '72%'],
                    center: ['50%', '50%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 3,
                        borderColor: '#181b24',
                        borderWidth: 2
                    },
                    label: {
                        show: true,
                        position: 'inside',
                        formatter: '{d}%',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: 11
                    },
                    data: [
                        { value: pGreen, name: lGreen, itemStyle: { color: '#00c073' } },
                        { value: pYellow, name: lYellow, itemStyle: { color: '#eab308' } },
                        { value: pRed, name: lRed, itemStyle: { color: '#ef4444' } }
                    ]
                }
            ]
        };
        secDonutChartInstance.setOption(option, true);
        
        // Value Bars
        const maxV = Math.max(vGreen, vYellow, vRed, 0.01);
        const hG = Math.max(8, (vGreen / maxV) * 80);
        const hR = Math.max(8, (vRed / maxV) * 80);
        const hY = Math.max(8, (vYellow / maxV) * 80);
        
        const barsDom = document.getElementById('secIntradayBars');
        if (barsDom) {
            barsDom.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; width:30%;">
                    <span style="font-size:11px; font-weight:700; color:#00c073; margin-bottom:4px; font-family:monospace;">${vGreen.toFixed(2)} ${unitStr}</span>
                    <div style="width:40px; height:${hG}px; background:#00c073; border-radius:4px 4px 0 0; transition:height 0.3s;"></div>
                </div>
                <div style="display:flex; flex-direction:column; align-items:center; width:30%;">
                    <span style="font-size:11px; font-weight:700; color:#ef4444; margin-bottom:4px; font-family:monospace;">${vRed.toFixed(2)} ${unitStr}</span>
                    <div style="width:40px; height:${hR}px; background:#ef4444; border-radius:4px 4px 0 0; transition:height 0.3s;"></div>
                </div>
                <div style="display:flex; flex-direction:column; align-items:center; width:30%;">
                    <span style="font-size:11px; font-weight:700; color:#eab308; margin-bottom:4px; font-family:monospace;">${vYellow.toFixed(2)} ${unitStr}</span>
                    <div style="width:40px; height:${hY}px; background:#eab308; border-radius:4px 4px 0 0; transition:height 0.3s;"></div>
                </div>
            `;
        }
        
        const legendDom = document.getElementById('secIntradayLegend');
        if (legendDom) {
            legendDom.innerHTML = `
                <span style="display:flex; align-items:center; gap:4px;"><span style="width:8px; height:8px; border-radius:50%; background:#00c073;"></span> ${lGreen}</span>
                <span style="display:flex; align-items:center; gap:4px;"><span style="width:8px; height:8px; border-radius:50%; background:#ef4444;"></span> ${lRed}</span>
                <span style="display:flex; align-items:center; gap:4px;"><span style="width:8px; height:8px; border-radius:50%; background:#eab308;"></span> ${lYellow}</span>
            `;
        }
    };

    // ----------------------------------------------------
    // POPOVER HELPERS FOR MODAL TABLES
    // ----------------------------------------------------
    window.showSecMBPopover = function(e, totalVol, buyPct, mbPct, sellPct) {
        const pop = document.getElementById('sec_custom_popover');
        if (!pop) return;
        
        let volStr = '';
        if (totalVol >= 1e6) {
            volStr = (totalVol / 1e6).toFixed(2) + ' triệu';
        } else if (totalVol >= 1e3) {
            volStr = (totalVol / 1e3).toFixed(1) + ' nghìn';
        } else {
            volStr = Number(totalVol).toLocaleString('vi-VN');
        }
        
        const titleEl = document.getElementById('sec_pop_title');
        const l1 = document.getElementById('sec_pop_line1');
        const l2 = document.getElementById('sec_pop_line2');
        const l3 = document.getElementById('sec_pop_line3');
        
        if (titleEl) titleEl.innerText = `Tổng giá trị: ${volStr}`;
        if (l1) { l1.innerText = `Mua: ${Number(buyPct).toFixed(2)}%`; l1.style.color = '#00c073'; }
        if (l2) { l2.innerText = `MB: ${Number(mbPct).toFixed(2)}%`; l2.style.color = '#eab308'; }
        if (l3) { l3.innerText = `Bán: ${Number(sellPct).toFixed(2)}%`; l3.style.color = '#ef4444'; }
        
        positionSecPopover(pop, e.currentTarget);
    };

    window.showSecFlowPopover = function(e, totalVal, greenPct, yellowPct, redPct) {
        const pop = document.getElementById('sec_custom_popover');
        if (!pop) return;
        
        let valStr = Number(totalVal).toLocaleString('vi-VN', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' tỷ';
        if (totalVal > 0 && totalVal < 1.0) {
            valStr = (totalVal * 1000).toFixed(2) + ' triệu';
        }
        
        const titleEl = document.getElementById('sec_pop_title');
        const l1 = document.getElementById('sec_pop_line1');
        const l2 = document.getElementById('sec_pop_line2');
        const l3 = document.getElementById('sec_pop_line3');
        
        if (titleEl) titleEl.innerText = `Tổng giá trị: ${valStr}`;
        if (l1) { l1.innerText = `Tăng: ${Number(greenPct).toFixed(2)}%`; l1.style.color = '#00c073'; }
        if (l2) { l2.innerText = `Tham chiếu: ${Number(yellowPct).toFixed(2)}%`; l2.style.color = '#eab308'; }
        if (l3) { l3.innerText = `Giảm: ${Number(redPct).toFixed(2)}%`; l3.style.color = '#ef4444'; }
        
        positionSecPopover(pop, e.currentTarget);
    };

    window.hideSecPopover = function() {
        const pop = document.getElementById('sec_custom_popover');
        if (pop) pop.style.display = 'none';
    };

    function positionSecPopover(pop, targetEl) {
        const rect = targetEl.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top;
        
        pop.style.left = `${x}px`;
        const arrow = pop.querySelector('.pop-arrow');
        
        if (y < 160) {
            pop.style.top = `${rect.bottom + 8}px`;
            pop.style.transform = 'translate(-50%, 0)';
            if (arrow) {
                arrow.style.top = '-6px';
                arrow.style.bottom = 'auto';
                arrow.style.borderTop = 'none';
                arrow.style.borderBottom = '6px solid #ffffff';
            }
        } else {
            pop.style.top = `${y - 8}px`;
            pop.style.transform = 'translate(-50%, -100%)';
            if (arrow) {
                arrow.style.top = 'auto';
                arrow.style.bottom = '-6px';
                arrow.style.borderBottom = 'none';
                arrow.style.borderTop = '6px solid #ffffff';
            }
        }
        pop.style.display = 'block';
        pop.style.opacity = '1';
    }

    // ----------------------------------------------------
    // TAB 2: STOCKS TABLE RENDERING
    // ----------------------------------------------------
    window.sortSecStockData = function(key) {
        if (secStockSort.key === key) {
            secStockSort.asc = !secStockSort.asc;
        } else {
            secStockSort.key = key;
            secStockSort.asc = (key === 'symbol') ? true : false;
        }
        renderSecStocksTable();
    };

    window.renderSecStocksTable = function() {
        const thead = document.getElementById('secStocksTableHead');
        const tbody = document.getElementById('secStocksTableBody');
        if (!thead || !tbody || !currentSecDetailData) return;
        
        let stocks = [...(currentSecDetailData.stocks || [])];
        const { key, asc } = secStockSort;
        
        stocks.sort((a, b) => {
            let valA, valB;
            if (key === 'symbol') {
                valA = a.symbol; valB = b.symbol;
                return asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
            } else if (key === 'price' || key === 'change' || key === 'changePct' || key === 'volume' || key === 'value') {
                valA = a[key]; valB = b[key];
            } else if (key === 'foreignNetVol') {
                valA = a.foreign ? a.foreign.netVol : 0;
                valB = b.foreign ? b.foreign.netVol : 0;
            } else if (key === 'foreignNetVal') {
                valA = a.foreign ? a.foreign.netVal : 0;
                valB = b.foreign ? b.foreign.netVal : 0;
            } else if (key === 'pe' || key === 'pb' || key === 'eps' || key === 'marketCap' || key === 'roa' || key === 'roe') {
                valA = a.financial ? a.financial[key] : null;
                valB = b.financial ? b.financial[key] : null;
            }
            if (valA == null) valA = asc ? 99999999 : -99999999;
            if (valB == null) valB = asc ? 99999999 : -99999999;
            return asc ? (valA - valB) : (valB - valA);
        });

        // 1. Render Thead
        let thHtml = '<tr style="color: #787b86; font-weight: 600; user-select: none;">';
        thHtml += '<th style="padding: 9px 10px; width: 40px;">#</th>';
        thHtml += `<th style="padding: 9px 10px; cursor: pointer;" onclick="sortSecStockData('symbol')">MÃ ${key==='symbol'?(asc?'↑':'↓'):''}</th>`;
        
        if (currentSecStockSubTab === 'biendong') {
            thHtml += '<th style="padding: 9px 10px; width: 140px; text-align: center;">KL MUA-BÁN CHỦ ĐỘNG</th>';
            thHtml += '<th style="padding: 9px 10px; width: 140px; text-align: center;">PHÂN BỔ DÒNG TIỀN</th>';
            thHtml += `<th style="padding: 9px 10px; text-align: right; cursor: pointer;" onclick="sortSecStockData('price')">GIÁ ${key==='price'?(asc?'▲':'▼'):''}</th>`;
            thHtml += `<th style="padding: 9px 10px; text-align: right; cursor: pointer;" onclick="sortSecStockData('changePct')">% TĂNG / GIẢM ${key==='changePct'?(asc?'▲':'▼'):''}</th>`;
            thHtml += `<th style="padding: 9px 10px; text-align: right; cursor: pointer;" onclick="sortSecStockData('volume')">KHỐI LƯỢNG ${key==='volume'?(asc?'▲':'▼'):''}</th>`;
        } else if (currentSecStockSubTab === 'foreign') {
            thHtml += '<th style="padding: 9px 10px; text-align: right;">KL MUA</th>';
            thHtml += '<th style="padding: 9px 10px; text-align: right;">KL BÁN</th>';
            thHtml += `<th style="padding: 9px 10px; text-align: right; cursor: pointer;" onclick="sortSecStockData('foreignNetVol')">KL MUA - BÁN ${key==='foreignNetVol'?(asc?'▲':'▼'):''}</th>`;
            thHtml += '<th style="padding: 9px 10px; text-align: right;">GT MUA (TR)</th>';
            thHtml += '<th style="padding: 9px 10px; text-align: right;">GT BÁN (TR)</th>';
            thHtml += `<th style="padding: 9px 10px; text-align: right; cursor: pointer;" onclick="sortSecStockData('foreignNetVal')">GT MUA - BÁN (TR) ${key==='foreignNetVal'?(asc?'▲':'▼'):''}</th>`;
        } else { // finance
            thHtml += `<th style="padding: 9px 10px; text-align: right; cursor: pointer;" onclick="sortSecStockData('eps')">EPS ${key==='eps'?(asc?'▲':'▼'):''}</th>`;
            thHtml += `<th style="padding: 9px 10px; text-align: right; cursor: pointer;" onclick="sortSecStockData('pe')">P/E ${key==='pe'?(asc?'▲':'▼'):''}</th>`;
            thHtml += `<th style="padding: 9px 10px; text-align: right; cursor: pointer;" onclick="sortSecStockData('pb')">P/B ${key==='pb'?(asc?'▲':'▼'):''}</th>`;
            thHtml += `<th style="padding: 9px 10px; text-align: right; cursor: pointer;" onclick="sortSecStockData('roa')">ROA ${key==='roa'?(asc?'▲':'▼'):''}</th>`;
            thHtml += `<th style="padding: 9px 10px; text-align: right; cursor: pointer;" onclick="sortSecStockData('roe')">ROE ${key==='roe'?(asc?'▲':'▼'):''}</th>`;
            thHtml += `<th style="padding: 9px 10px; text-align: right; cursor: pointer;" onclick="sortSecStockData('marketCap')">VỐN HÓA (TỶ) ${key==='marketCap'?(asc?'▲':'▼'):''}</th>`;
        }
        thHtml += '</tr>';
        thead.innerHTML = thHtml;

        // 2. Render Tbody
        let tbHtml = '';
        stocks.forEach((stk, idx) => {
            const col = stk.changePct > 0 ? '#00e676' : (stk.changePct < 0 ? '#ff5252' : '#ffeb3b');
            const sign = stk.changePct > 0 ? '+' : '';
            
            tbHtml += `<tr style="border-bottom: 1px solid #242832; cursor: pointer; transition: background 0.15s;" onmouseover="this.style.background='rgba(41,98,255,0.08)'" onmouseout="this.style.background='transparent'" onclick="selectStockAndSwitch('${stk.symbol}')">`;
            tbHtml += `<td style="padding: 8px 10px; color: #787b86;">${idx + 1}</td>`;
            tbHtml += `<td style="padding: 8px 10px; font-weight: 700; color: ${col};">${stk.symbol}</td>`;
            
            if (currentSecStockSubTab === 'biendong') {
                const bPct = stk.activeMB ? (stk.activeMB.buyPct || 50) : 50;
                const mbPct = stk.activeMB ? (stk.activeMB.mbPct || 0) : 0;
                const sPct = stk.activeMB ? (stk.activeMB.sellPct || 50) : 50;
                
                let gP = (stk.price > stk.ref) ? 95 : 0;
                let rP = (stk.price < stk.ref && stk.price > 0) ? 95 : 0;
                let yP = (stk.price === stk.ref || stk.price === 0) ? 95 : 5;
                
                if (stk.flow) {
                    if (stk.flow.greenPct != null) gP = stk.flow.greenPct;
                    if (stk.flow.yellowPct != null) yP = stk.flow.yellowPct;
                    if (stk.flow.redPct != null) rP = stk.flow.redPct;
                }
                
                tbHtml += `
                    <td style="padding: 8px 10px;">
                        <div style="display: flex; height: 10px; border-radius: 3px; overflow: hidden; background: #242832; cursor: pointer;"
                             onmouseenter="showSecMBPopover(event, ${stk.volume}, ${bPct}, ${mbPct}, ${sPct})"
                             onmouseleave="hideSecPopover()">
                            <div style="width: ${bPct}%; background: #00c073; height: 100%;"></div>
                            ${mbPct > 0 ? `<div style="width: ${mbPct}%; background: #eab308; height: 100%;"></div>` : ''}
                            <div style="width: ${sPct}%; background: #ef4444; height: 100%;"></div>
                        </div>
                    </td>
                    <td style="padding: 8px 10px;">
                        <div style="display: flex; height: 10px; border-radius: 3px; overflow: hidden; background: #242832; cursor: pointer;"
                             onmouseenter="showSecFlowPopover(event, ${stk.value || 0}, ${gP}, ${yP}, ${rP})"
                             onmouseleave="hideSecPopover()">
                            ${gP > 0 ? `<div style="width: ${gP}%; background: #00c073; height: 100%;"></div>` : ''}
                            ${yP > 0 ? `<div style="width: ${yP}%; background: #eab308; height: 100%;"></div>` : ''}
                            ${rP > 0 ? `<div style="width: ${rP}%; background: #ef4444; height: 100%;"></div>` : ''}
                        </div>
                    </td>
                    <td style="padding: 8px 10px; text-align: right; font-weight: 700; font-family: monospace; color: ${col};">
                        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px;">
                            <svg width="24" height="12" style="overflow: visible;">
                                <polyline fill="none" stroke="${col}" stroke-width="1.5" points="0,${stk.changePct>=0?10:2} 12,${stk.changePct>=0?4:8} 24,${stk.changePct>=0?2:10}" />
                            </svg>
                            <span>${stk.price.toFixed(2)}</span>
                        </div>
                    </td>
                    <td style="padding: 8px 10px; text-align: right; font-family: monospace; color: ${col}; font-weight: 700;">
                        ${sign}${stk.change.toFixed(2)} / ${sign}${stk.changePct.toFixed(1)}%
                    </td>
                    <td style="padding: 8px 10px; text-align: right; font-family: monospace; color: #d1d4dc;">
                        ${stk.volume.toLocaleString('vi-VN')}
                    </td>
                `;
            } else if (currentSecStockSubTab === 'foreign') {
                const f = stk.foreign || {};
                const netVolCol = f.netVol > 0 ? '#00e676' : (f.netVol < 0 ? '#ff5252' : '#d1d4dc');
                const netValCol = f.netVal > 0 ? '#00e676' : (f.netVal < 0 ? '#ff5252' : '#d1d4dc');
                
                tbHtml += `
                    <td style="padding: 8px 10px; text-align: right; font-family: monospace; color: #d1d4dc;">${(f.buyVol||0).toLocaleString('vi-VN')}</td>
                    <td style="padding: 8px 10px; text-align: right; font-family: monospace; color: #d1d4dc;">${(f.sellVol||0).toLocaleString('vi-VN')}</td>
                    <td style="padding: 8px 10px; text-align: right; font-family: monospace; font-weight: 700; color: ${netVolCol};">${(f.netVol||0).toLocaleString('vi-VN')}</td>
                    <td style="padding: 8px 10px; text-align: right; font-family: monospace; color: #d1d4dc;">${(f.buyVal||0).toFixed(2)}</td>
                    <td style="padding: 8px 10px; text-align: right; font-family: monospace; color: #d1d4dc;">${(f.sellVal||0).toFixed(2)}</td>
                    <td style="padding: 8px 10px; text-align: right; font-family: monospace; font-weight: 700; color: ${netValCol};">${(f.netVal||0).toFixed(2)}</td>
                `;
            } else { // finance
                const fin = stk.financial || {};
                tbHtml += `
                    <td style="padding: 8px 10px; text-align: right; font-family: monospace; color: #d1d4dc;">${fin.eps ? fin.eps.toLocaleString('vi-VN') : 'N/A'}</td>
                    <td style="padding: 8px 10px; text-align: right; font-family: monospace; color: #d1d4dc;">${fin.pe ? fin.pe.toFixed(2) : 'N/A'}</td>
                    <td style="padding: 8px 10px; text-align: right; font-family: monospace; color: #d1d4dc;">${fin.pb ? fin.pb.toFixed(2) : 'N/A'}</td>
                    <td style="padding: 8px 10px; text-align: right; font-family: monospace; color: #d1d4dc;">${fin.roa ? fin.roa + '%' : 'N/A'}</td>
                    <td style="padding: 8px 10px; text-align: right; font-family: monospace; color: #d1d4dc;">${fin.roe ? fin.roe + '%' : 'N/A'}</td>
                    <td style="padding: 8px 10px; text-align: right; font-family: monospace; font-weight: 700; color: #fff;">${fin.marketCap ? fin.marketCap.toLocaleString('vi-VN', {maximumFractionDigits: 2}) : 'N/A'}</td>
                `;
            }
            tbHtml += '</tr>';
        });
        
        tbody.innerHTML = tbHtml;
    };

    // ----------------------------------------------------
    // TAB 3: SUBSECTORS RENDERING
    // ----------------------------------------------------
    window.renderSecChildrenTable = function() {
        const tbody = document.getElementById('secChildrenTableBody');
        if (!tbody || !currentSecDetailData) return;
        
        const children = currentSecDetailData.subSectors || [];
        if (children.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #787b86;">Không có phân ngành cấp con trực thuộc.</td></tr>';
            return;
        }
        
        let html = '';
        children.forEach((sub, idx) => {
            const col = sub.change1d > 0 ? '#00e676' : (sub.change1d < 0 ? '#ff5252' : '#ffeb3b');
            const sign = sub.change1d > 0 ? '+' : '';
            const gP = sub.flow ? sub.flow.greenPct : 0;
            const yP = sub.flow ? sub.flow.yellowPct : 0;
            const rP = sub.flow ? sub.flow.redPct : 0;
            
            html += `
                <tr style="border-bottom: 1px solid #242832; cursor: pointer; transition: background 0.15s;" onmouseover="this.style.background='rgba(41,98,255,0.08)'" onmouseout="this.style.background='transparent'" onclick="openSectorDetailModal('${sub.icbCode}')">
                    <td style="padding: 8px 10px; color: #787b86;">${idx + 1}</td>
                    <td style="padding: 8px 10px; font-weight: 700; color: #fff;">${sub.name} <span style="font-size: 10px; color: #787b86;">(${sub.icbCode})</span></td>
                    <td style="padding: 8px 10px; text-align: center; color: #787b86;">${sub.stockCount}</td>
                    <td style="padding: 8px 10px;">
                        <div style="display: flex; height: 10px; border-radius: 3px; overflow: hidden; background: #242832; cursor: pointer;"
                             onmouseenter="showSecFlowPopover(event, ${sub.totalValue}, ${gP}, ${yP}, ${rP})"
                             onmouseleave="hideSecPopover()">
                            ${gP > 0 ? `<div style="width: ${gP}%; background: #00c073; height: 100%;"></div>` : ''}
                            ${yP > 0 ? `<div style="width: ${yP}%; background: #eab308; height: 100%;"></div>` : ''}
                            ${rP > 0 ? `<div style="width: ${rP}%; background: #ef4444; height: 100%;"></div>` : ''}
                        </div>
                    </td>
                    <td style="padding: 8px 10px; text-align: right; font-weight: 700; font-family: monospace; color: ${col};">${sign}${sub.change1d.toFixed(2)}%</td>
                    <td style="padding: 8px 10px; text-align: right; font-family: monospace; color: #d1d4dc;">${sub.pe ? sub.pe.toFixed(2) : 'N/A'}</td>
                    <td style="padding: 8px 10px; text-align: right; font-family: monospace; color: #d1d4dc;">${(sub.totalValue || 0).toLocaleString('vi-VN', {maximumFractionDigits: 2})} tỷ</td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    };

    // ĐỒNG BỘ THỦ CÔNG & TRẠNG THÁI EOD
    window.syncSectorDataManually = async function() {
        const btn = document.getElementById('secSyncBtn');
        const icon = document.getElementById('secSyncIcon');
        const text = document.getElementById('secSyncText');
        if (btn) btn.disabled = true;
        if (icon) {
            icon.style.display = 'inline-block';
            icon.style.animation = 'spinSync 1s linear infinite';
        }
        if (text) text.innerText = 'Đang đồng bộ...';
        
        try {
            const res = await fetch('/api/market/sync-sector-history', { method: 'POST' });
            setTimeout(async () => {
                await Promise.all([
                    fetchSectorDetailData(),
                    fetchSectorHistoryData()
                ]);
                updateModalHeader();
                if (typeof window.renderSecDualChart === 'function') window.renderSecDualChart();
                if (typeof window.renderSecDonutAndBars === 'function') window.renderSecDonutAndBars();
                if (text) text.innerText = 'Đã chốt EOD';
                if (icon) icon.style.animation = '';
                setTimeout(() => {
                    if (btn) btn.disabled = false;
                    if (text) text.innerText = 'Đồng bộ EOD';
                }, 2000);
            }, 1200);
        } catch (e) {
            console.error("Manual sync error:", e);
            if (btn) btn.disabled = false;
            if (icon) icon.style.animation = '';
            if (text) text.innerText = 'Đồng bộ EOD';
        }
    };
})();
