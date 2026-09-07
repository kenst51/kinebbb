/**
 * MODULE: AUTO TRENDLINES & KEY LEVELS (SUPPORT & RESISTANCE) TOOLKIT
 * Fully integrated for KlineCharts
 */

                function toggleAdvancedFeature(btnId, flagName, idsKey, runnerFunc, activeColor) {
            const btn = document.getElementById(btnId);
            const charts = isSplitScreen && chart2 ? [chart1, chart2] : [chart1];
            
            if (window[flagName]) {
                // Turn off
                charts.forEach(c => {
                    if (c[idsKey]) {
                        c[idsKey].forEach(id => { try { c.removeOverlay(id); } catch(e) {} });
                        c[idsKey] = [];
                    }
                    if (idsKey === 'trendIds') {
                        try { c.removeOverlay({ name: 'clickableText' }); } catch(e) {}
                    }
                    if (idsKey === 'keyLevelIds') {
                        try { c.removeOverlay({ name: 'rightAlignedClickableText' }); } catch(e) {}
                    }
                });
                btn.classList.remove('active', 'on');
                btn.style.borderColor = ''; 
                btn.style.color = ''; // reset text color to default
                window[flagName] = false;
            } else {
                // Turn on
                window[flagName] = true;
                charts.forEach(c => {
                    runnerFunc(c);
                });
                btn.classList.add('active', 'on');
                btn.style.borderColor = activeColor;
                btn.style.color = activeColor;
            }
        }



function updateProSidebarItemStates() {
    function setSbItem(btnId, statusId, isOn) {
        const btn = document.getElementById(btnId);
        const st = document.getElementById(statusId);
        if (btn) {
            if (isOn) btn.classList.add('active');
            else btn.classList.remove('active');
        }
        if (st) {
            st.innerHTML = isOn ? '<span style="color:#34d399">🟢 BẬT</span>' : '<span style="color:#64748b">⚪ TẮT</span>';
        }
    }

    setSbItem('sbBtn_trend', 'sbStatus_trend', window.isTrendOn);
    setSbItem('sbBtn_keylevel', 'sbStatus_keylevel', window.isKeyLevelOn);
}





        // ================= AUTO TRENDLINES CONTROLLER (AI PRO & BROKER TOOLKIT) =================
        window.trendSelectedTf = 'all';
        window.trendShowChannels = false;
        
        window.trendShowHud = true;
        window.currentTrendAnalysis = null;

        window.trendSelectedTf = 'all';
        window.trendShowChannels = false;
        
        window.trendShowHud = true;
        window.currentTrendAnalysis = null;

        function clearTrendOverlays(targetChart = chart1) {
            if (targetChart && targetChart.trendIds) {
                targetChart.trendIds.forEach(id => {
                    try { targetChart.removeOverlay(id); } catch(e) {}
                });
                targetChart.trendIds = [];
            }
            try { targetChart.removeOverlay({ name: 'clickableText' }); } catch(e) {}
        }

        function updateKeyLevelToolbarPosition() {
            const keyTb = document.getElementById('keyLevelMiniToolbar');
            const trendTb = document.getElementById('trendMiniToolbar');
            if (!keyTb) return;
            const isTrendVisible = trendTb && trendTb.style.display !== 'none';
            keyTb.style.top = isTrendVisible ? '84px' : '48px';
        }

        function toggleTrend() {
            toggleAdvancedFeature('btnTrend', 'isTrendOn', 'trendIds', runTrend, '#67C23A');
            const tb = document.getElementById('trendMiniToolbar');
            const hud = document.getElementById('trendHudMatrix');
            if (tb) tb.style.display = window.isTrendOn ? 'flex' : 'none';
            if (hud) hud.style.display = (window.isTrendOn && window.trendShowHud) ? 'flex' : 'none';
            updateKeyLevelToolbarPosition();
        }

        function setTrendTfFilter(tfKey) {
            // Cơ chế Toggle: Nếu nhấp vào nút đang hoạt động -> Ẩn toàn bộ đường xu hướng
            if (window.trendSelectedTf === tfKey) {
                window.trendSelectedTf = 'none';
            } else {
                window.trendSelectedTf = tfKey;
            }

            const tfs = ['all', '3y', '2y', '1.5y', '1y', '6m', '3m', '1m', '1w'];
            tfs.forEach(k => {
                const btn = document.getElementById(`btnTrendTf_${k}`);
                if (btn) {
                    if (k === window.trendSelectedTf) {
                        btn.classList.add('active');
                        btn.style.background = '#2563eb';
                        btn.style.borderColor = '#2563eb';
                        btn.style.color = '#fff';
                        btn.style.fontWeight = '700';
                    } else {
                        btn.classList.remove('active');
                        btn.style.background = 'rgba(255,255,255,0.05)';
                        btn.style.borderColor = 'rgba(255,255,255,0.08)';
                        btn.style.color = '#cbd5e1';
                        btn.style.fontWeight = '600';
                    }
                }
            });

            if (window.isTrendOn) {
                clearTrendOverlays(chart1);
                if (window.trendSelectedTf !== 'none') {
                    runTrend(chart1);
                }
            }
        }

        function toggleTrendChannelOption() {
            window.trendShowChannels = !window.trendShowChannels;
            const btn = document.getElementById('btnTrendChannel');
            if (btn) {
                if (window.trendShowChannels) {
                    btn.innerText = '📐 Kênh giá: BẬT';
                    btn.style.background = 'rgba(245, 158, 11, 0.2)';
                    btn.style.borderColor = '#f59e0b';
                    btn.style.color = '#f59e0b';
                } else {
                    btn.innerText = '📐 Kênh giá: TẮT';
                    btn.style.background = 'rgba(255,255,255,0.05)';
                    btn.style.borderColor = 'rgba(255,255,255,0.08)';
                    btn.style.color = '#94a3b8';
                }
            }
            if (window.isTrendOn) {
                clearTrendOverlays(chart1);
                runTrend(chart1);
            }
        }

        function toggleTrendHudMatrix() {
            window.trendShowHud = !window.trendShowHud;
            const btn = document.getElementById('btnTrendHud');
            const hud = document.getElementById('trendHudMatrix');
            if (hud) hud.style.display = (window.isTrendOn && window.trendShowHud) ? 'flex' : 'none';
            if (btn) {
                if (window.trendShowHud) {
                    btn.style.background = 'rgba(56, 189, 248, 0.12)';
                    btn.style.borderColor = 'rgba(56, 189, 248, 0.4)';
                    btn.style.color = '#38bdf8';
                } else {
                    btn.style.background = 'rgba(255,255,255,0.05)';
                    btn.style.borderColor = 'rgba(255,255,255,0.08)';
                    btn.style.color = '#94a3b8';
                }
            }
            if (window.trendShowHud && window.currentTrendAnalysis) {
                renderTrendHudMatrix(window.currentTrendAnalysis);
            }
        }

        // Draggable HUD functionality
        (function initDraggableHud() {
            let isDragging = false, currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;
            document.addEventListener('DOMContentLoaded', () => {
                const hud = document.getElementById('trendHudMatrix');
                const header = document.getElementById('trendHudHeader');
                if (!hud || !header) return;

                header.addEventListener('mousedown', dragStart);
                document.addEventListener('mousemove', drag);
                document.addEventListener('mouseup', dragEnd);

                function dragStart(e) {
                    if (e.target.tagName === 'BUTTON') return;
                    initialX = e.clientX - xOffset;
                    initialY = e.clientY - yOffset;
                    if (e.target === header || header.contains(e.target)) isDragging = true;
                }
                function drag(e) {
                    if (isDragging) {
                        e.preventDefault();
                        xOffset = e.clientX - initialX;
                        yOffset = e.clientY - initialY;
                        hud.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0)`;
                    }
                }
                function dragEnd() {
                    initialX = currentX;
                    initialY = currentY;
                    isDragging = false;
                }
            });
        })();

        function runTrend(targetChart = chart1) {
            const dataList = targetChart.getDataList();
            if (!dataList || dataList.length < 30) {
                alert("Không đủ dữ liệu để phân tích đường xu hướng!");
                return;
            }

            if (!targetChart.trendIds) targetChart.trendIds = [];

            const currentSym = (document.getElementById('currentSymbolDisplay') ? document.getElementById('currentSymbolDisplay').innerText.trim().toUpperCase() : '') || window.currentSymbol || 'FPT';

            // 1. Tính toán ATR(14) và MA20 Volume để chuẩn hóa đo lường biên độ & Breakout
            const atrPeriod = 14;
            let atrs = [];
            for (let i = 1; i < dataList.length; i++) {
                let tr = Math.max(
                    dataList[i].high - dataList[i].low,
                    Math.abs(dataList[i].high - dataList[i-1].close),
                    Math.abs(dataList[i].low - dataList[i-1].close)
                );
                atrs.push(tr);
            }
            let recentAtr = atrs.slice(-atrPeriod).reduce((a, b) => a + b, 0) / atrPeriod || 0.5;

            let recentVols = dataList.slice(-20).map(d => d.volume || 0);
            let ma20Vol = recentVols.reduce((a, b) => a + b, 0) / (recentVols.length || 1);
            let lastBar = dataList[dataList.length - 1];
            let prevBar = dataList.length > 1 ? dataList[dataList.length - 2] : lastBar;
            let lastVol = lastBar.volume || 0;
            let volRatio = ma20Vol > 0 ? (lastVol / ma20Vol).toFixed(1) : '1.0';

            let avgInterval = dataList.length > 1 ? (dataList[dataList.length - 1].timestamp - dataList[0].timestamp) / (dataList.length - 1) : 86400000;
            if (avgInterval <= 0) avgInterval = 86400000;

            const allTimeframes = [
                { key: '3y', name: '3 Năm', max: 1000, min: 500, pWin: 8, tfColor: '#059669', tfRed: '#dc2626', rayBars: 30 },
                { key: '2y', name: '2 Năm', max: 600, min: 260, pWin: 7, tfColor: '#0d9488', tfRed: '#e11d48', rayBars: 25 },
                { key: '1.5y', name: '1.5 Năm', max: 420, min: 180, pWin: 6, tfColor: '#14b8a6', tfRed: '#e11d48', rayBars: 22 },
                { key: '1y', name: '1 Năm', max: 280, min: 120, pWin: 5, tfColor: '#10b981', tfRed: '#ef4444', rayBars: 20 },
                { key: '6m', name: '6 Tháng', max: 160, min: 60, pWin: 4, tfColor: '#06b6d4', tfRed: '#f43f5e', rayBars: 16 },
                { key: '3m', name: '3 Tháng', max: 85, min: 30, pWin: 3, tfColor: '#3b82f6', tfRed: '#fb7185', rayBars: 12 },
                { key: '1m', name: '1 Tháng', max: 50, min: 16, pWin: 3, tfColor: '#8b5cf6', tfRed: '#f97316', rayBars: 8 },
                { key: '1w', name: 'Tuần', max: 18, min: 3, pWin: 2, tfColor: '#10b981', tfRed: '#f59e0b', rayBars: 5 }
            ];

            let timeframes = allTimeframes;
            if (window.trendSelectedTf && window.trendSelectedTf !== 'all') {
                timeframes = allTimeframes.filter(tf => tf.key === window.trendSelectedTf);
            }

            let globalMaxHigh = { val: -Infinity, idx: -1 };
            let globalMinLow = { val: Infinity, idx: -1 };
            for (let i = 0; i < dataList.length; i++) {
                if (dataList[i].high > globalMaxHigh.val) globalMaxHigh = { val: dataList[i].high, idx: i, ts: dataList[i].timestamp };
                if (dataList[i].low < globalMinLow.val) globalMinLow = { val: dataList[i].low, idx: i, ts: dataList[i].timestamp };
            }

            // 2. Thu thập điểm Fractal Pivots toàn cục để gắn nhãn cấu trúc HH, HL, LH, LL
            let globalPivots = [];
            let pWinG = 3;
            for (let i = pWinG; i < dataList.length - pWinG; i++) {
                let isHigh = true, isLow = true;
                for (let j = i - pWinG; j <= i + pWinG; j++) {
                    if (i === j) continue;
                    if (dataList[j].high > dataList[i].high) isHigh = false;
                    if (dataList[j].low < dataList[i].low) isLow = false;
                }
                if (isHigh) globalPivots.push({ type: 'HIGH', val: dataList[i].high, ts: dataList[i].timestamp, idx: i });
                if (isLow) globalPivots.push({ type: 'LOW', val: dataList[i].low, ts: dataList[i].timestamp, idx: i });
            }

            let gHighs = globalPivots.filter(p => p.type === 'HIGH').sort((a, b) => a.idx - b.idx);
            let gLows = globalPivots.filter(p => p.type === 'LOW').sort((a, b) => a.idx - b.idx);

            for (let i = 1; i < gHighs.length; i++) {
                gHighs[i].label = gHighs[i].val >= gHighs[i-1].val ? 'HH' : 'LH';
            }
            for (let i = 1; i < gLows.length; i++) {
                gLows[i].label = gLows[i].val >= gLows[i-1].val ? 'HL' : 'LL';
            }

            // Vẽ các nhãn cấu trúc Swing (3 đỉnh gần nhất và 3 đáy gần nhất)
            let recentSwings = [...gHighs.slice(-3), ...gLows.slice(-3)];
            targetChart.trendRecentSwings = recentSwings;
            recentSwings.forEach(sw => {
                if (!sw.label) return;
                let isH = sw.type === 'HIGH';
                let tagColor = (sw.label === 'HH' || sw.label === 'HL') ? '#10b981' : '#ef4444';
                let tagY = isH ? (sw.val + 0.35 * recentAtr) : (sw.val - 0.35 * recentAtr);

                let pTagId = targetChart.createOverlay({
                    name: 'clickableText',
                    extendData: sw.label,
                    points: [{ timestamp: sw.ts, value: tagY }],
                    styles: {
                        text: {
                            paddingLeft: 4,
                            paddingRight: 4,
                            paddingTop: 2,
                            paddingBottom: 2,
                            backgroundColor: isLightMode ? '#ffffff' : 'rgba(15, 23, 42, 0.88)',
                            borderColor: tagColor,
                            borderSize: 1,
                            color: tagColor,
                            size: 10,
                            weight: 'bold',
                            borderRadius: 3
                        }
                    }
                });
                if (pTagId) targetChart.trendIds.push(pTagId);
            });

            // 3. Phân tích Xu hướng Đa khung thời gian (Hệ thống Đa Chu kỳ Chuyên sâu)
            let detectedTfResults = [];

            allTimeframes.forEach((tf) => {
                let maxLookback = Math.min(dataList.length, tf.max);
                if (maxLookback <= tf.min) return;

                let startIdxMax = dataList.length - maxLookback;
                let startIdxMin = dataList.length - tf.min;
                let pWin = tf.pWin;

                let localPivots = [];
                let searchStart = Math.max(pWin, startIdxMax);

                for (let i = searchStart; i < dataList.length - pWin; i++) {
                    let isHigh = true, isLow = true;
                    for (let j = i - pWin; j <= i + pWin; j++) {
                        if (i === j) continue;
                        if (dataList[j].high > dataList[i].high) isHigh = false;
                        if (dataList[j].low < dataList[i].low) isLow = false;
                    }
                    if (isHigh) localPivots.push({ type: 'HIGH', val: dataList[i].high, ts: dataList[i].timestamp, idx: i });
                    if (isLow) localPivots.push({ type: 'LOW', val: dataList[i].low, ts: dataList[i].timestamp, idx: i });
                }

                let tailStart = Math.max(0, dataList.length - pWin);
                let tailMax = { val: -Infinity, idx: -1, ts: 0 };
                let tailMin = { val: Infinity, idx: -1, ts: 0 };
                for (let i = tailStart; i < dataList.length; i++) {
                    if (dataList[i].high > tailMax.val) tailMax = { val: dataList[i].high, idx: i, ts: dataList[i].timestamp, type: 'HIGH' };
                    if (dataList[i].low < tailMin.val) tailMin = { val: dataList[i].low, idx: i, ts: dataList[i].timestamp, type: 'LOW' };
                }
                if (tailMax.idx !== -1) localPivots.push(tailMax);
                if (tailMin.idx !== -1) localPivots.push(tailMin);

                let highs = localPivots.filter(p => p.type === 'HIGH').sort((a, b) => a.idx - b.idx);
                let lows = localPivots.filter(p => p.type === 'LOW').sort((a, b) => a.idx - b.idx);

                let bestLine = null;
                let maxScore = -Infinity;

                // Uptrend Support
                for (let i = 0; i < lows.length - 1; i++) {
                    let p1 = lows[i];
                    if (p1.idx < startIdxMax || p1.idx >= startIdxMin) continue;

                    let overlapLonger = false;
                    for (let dItem of detectedTfResults) {
                        if (dItem.bestLine && Math.abs(p1.idx - dItem.bestLine.p1.idx) <= 4) {
                            overlapLonger = true;
                            break;
                        }
                    }
                    if (overlapLonger) continue;

                    for (let j = i + 1; j < lows.length; j++) {
                        let p2 = lows[j];
                        let dx = p2.idx - p1.idx;
                        if (dx <= 0) continue;
                        let slope = (p2.val - p1.val) / dx;
                        if (slope <= 0) continue;

                        let priceSpan = (globalMaxHigh.val - globalMinLow.val) || 1;
                        let normSlope = (slope * (dataList.length / priceSpan));
                        let maxNormSlope = (tf.key === '1w' || tf.key === '1m') ? 35 : ((tf.key === '3m' || tf.key === '6m') ? 20 : 15);
                        if (normSlope > maxNormSlope || normSlope < 0.02) continue;

                        let touches = 2;
                        let breachCount = 0;
                        let touchTol = Math.max(0.008 * p1.val, 0.35 * recentAtr);

                        for (let k = p1.idx; k < dataList.length; k++) {
                            let lineVal = p1.val + slope * (k - p1.idx);
                            if (dataList[k].close < lineVal - touchTol) breachCount++;
                        }

                        let maxBreach = (tf.key === '3y' || tf.key === '2y') ? 7 : ((tf.key === '1.5y' || tf.key === '1y') ? 5 : ((tf.key === '6m' || tf.key === '3m') ? 3 : 2));
                        if (breachCount > maxBreach) continue;

                        for (let k = 0; k < lows.length; k++) {
                            if (k === i || k === j) continue;
                            if (lows[k].idx < p1.idx) continue;
                            let lineVal = p1.val + slope * (lows[k].idx - p1.idx);
                            if (Math.abs(lows[k].val - lineVal) <= touchTol * 1.2) touches++;
                        }

                        let recency = (p1.idx / dataList.length) * 50;
                        let score = touches * 25 - breachCount * 30 + recency;
                        if ((tf.key === '3y' || tf.key === '2y' || tf.key === '1y') && Math.abs(p1.idx - globalMinLow.idx) <= 5) score += 80;

                        if (score > maxScore) {
                            maxScore = score;
                            bestLine = { p1, p2, slope, type: 'UPTREND', touches, breachCount, isBroken: breachCount > 0, pWin };
                        }
                    }
                }

                // Downtrend Resistance
                for (let i = 0; i < highs.length - 1; i++) {
                    let p1 = highs[i];
                    if (p1.idx < startIdxMax || p1.idx >= startIdxMin) continue;

                    let overlapLonger = false;
                    for (let dItem of detectedTfResults) {
                        if (dItem.bestLine && Math.abs(p1.idx - dItem.bestLine.p1.idx) <= 4) {
                            overlapLonger = true;
                            break;
                        }
                    }
                    if (overlapLonger) continue;

                    for (let j = i + 1; j < highs.length; j++) {
                        let p2 = highs[j];
                        let dx = p2.idx - p1.idx;
                        if (dx <= 0) continue;
                        let slope = (p2.val - p1.val) / dx;
                        if (slope >= 0) continue;

                        let priceSpan = (globalMaxHigh.val - globalMinLow.val) || 1;
                        let normSlope = Math.abs(slope * (dataList.length / priceSpan));
                        let maxNormSlope = (tf.key === '1w' || tf.key === '1m') ? 35 : ((tf.key === '3m' || tf.key === '6m') ? 20 : 15);
                        if (normSlope > maxNormSlope || normSlope < 0.02) continue;

                        let touches = 2;
                        let breachCount = 0;
                        let touchTol = Math.max(0.008 * p1.val, 0.35 * recentAtr);

                        for (let k = p1.idx; k < dataList.length; k++) {
                            let lineVal = p1.val + slope * (k - p1.idx);
                            if (dataList[k].close > lineVal + touchTol) breachCount++;
                        }

                        let maxBreach = (tf.key === '3y' || tf.key === '2y') ? 7 : ((tf.key === '1.5y' || tf.key === '1y') ? 5 : ((tf.key === '6m' || tf.key === '3m') ? 3 : 2));
                        if (breachCount > maxBreach) continue;

                        for (let k = 0; k < highs.length; k++) {
                            if (k === i || k === j) continue;
                            if (highs[k].idx < p1.idx) continue;
                            let lineVal = p1.val + slope * (highs[k].idx - p1.idx);
                            if (Math.abs(highs[k].val - lineVal) <= touchTol * 1.2) touches++;
                        }

                        let recency = (p1.idx / dataList.length) * 50;
                        let score = touches * 25 - breachCount * 30 + recency;
                        if ((tf.key === '3y' || tf.key === '2y' || tf.key === '1y') && Math.abs(p1.idx - globalMaxHigh.idx) <= 5) score += 80;

                        if (score > maxScore) {
                            maxScore = score;
                            bestLine = { p1, p2, slope, type: 'DOWNTREND', touches, breachCount, isBroken: breachCount > 0, pWin };
                        }
                    }
                }

                if (bestLine) {
                    let lastIdx = dataList.length - 1;
                    let currentLineVal = bestLine.p1.val + bestLine.slope * (lastIdx - bestLine.p1.idx);
                    let futureTs = lastBar.timestamp + tf.rayBars * avgInterval;
                    let futureLineVal = bestLine.p1.val + bestLine.slope * (lastIdx + tf.rayBars - bestLine.p1.idx);

                    let maxDistUpper = 0;
                    let maxDistLower = 0;
                    for (let k = bestLine.p1.idx; k < dataList.length; k++) {
                        let lVal = bestLine.p1.val + bestLine.slope * (k - bestLine.p1.idx);
                        let diffHigh = dataList[k].high - lVal;
                        let diffLow = lVal - dataList[k].low;
                        if (diffHigh > maxDistUpper) maxDistUpper = diffHigh;
                        if (diffLow > maxDistLower) maxDistLower = diffLow;
                    }

                    let chUpperVal = currentLineVal + (bestLine.type === 'UPTREND' ? maxDistUpper : 0);
                    let chLowerVal = currentLineVal - (bestLine.type === 'DOWNTREND' ? maxDistLower : 0);
                    let medianVal = (chUpperVal + chLowerVal) / 2;

                    let angleDeg = Math.round(Math.atan(bestLine.slope * (dataList.length / ((globalMaxHigh.val - globalMinLow.val) || 1))) * (180 / Math.PI));

                    let isBreakout = (bestLine.type === 'DOWNTREND' && lastBar.close > currentLineVal + 0.35 * recentAtr && lastVol > 1.2 * ma20Vol);
                    let isRetest = (Math.abs(lastBar.low - currentLineVal) <= 0.4 * recentAtr && lastBar.close > currentLineVal && prevBar.close < lastBar.close);
                    let isBreakdown = (bestLine.type === 'UPTREND' && lastBar.close < currentLineVal - 0.35 * recentAtr);
                    let isNearLevel = Math.abs(lastBar.close - currentLineVal) <= 0.6 * recentAtr;

                    let strengthScore = Math.min(100, Math.max(30, Math.round(bestLine.touches * 25 + (isBreakout ? 20 : 0) - bestLine.breachCount * 15)));

                    let status = 'UPTREND';
                    if (isBreakout) status = 'BREAKOUT';
                    else if (isRetest) status = 'RETEST';
                    else if (isBreakdown) status = 'BREAKDOWN';
                    else if (isNearLevel) status = bestLine.type === 'UPTREND' ? 'NEAR_SUPPORT' : 'NEAR_RESISTANCE';
                    else if (bestLine.type === 'DOWNTREND') status = 'DOWNTREND';

                    detectedTfResults.push({
                        tf: tf,
                        bestLine: bestLine,
                        currentLineVal: currentLineVal,
                        futureTs: futureTs,
                        futureLineVal: futureLineVal,
                        maxDistUpper: maxDistUpper || (1.5 * recentAtr),
                        maxDistLower: maxDistLower || (1.5 * recentAtr),
                        chUpperVal: chUpperVal,
                        chLowerVal: chLowerVal,
                        medianVal: medianVal,
                        angleDeg: angleDeg,
                        isBreakout: isBreakout,
                        isRetest: isRetest,
                        isBreakdown: isBreakdown,
                        isNearLevel: isNearLevel,
                        strengthScore: strengthScore,
                        status: status
                    });
                }
            });

            // 4. KHỬ TRÙNG LẶP ĐƯỜNG XU HƯỚNG THEO BỘ LỌC ĐƯỢC CHỌN
            let linesToDraw = [];
            let poolToFilter = detectedTfResults;
            if (window.trendSelectedTf && window.trendSelectedTf !== 'all') {
                poolToFilter = detectedTfResults.filter(r => r.tf.key === window.trendSelectedTf);
            }

            poolToFilter.forEach(item => {
                let isDuplicate = false;
                for (let other of linesToDraw) {
                    if (other.bestLine.type === item.bestLine.type) {
                        let slopeDiff = Math.abs(other.bestLine.slope - item.bestLine.slope) / (Math.abs(other.bestLine.slope) || 1);
                        let p1Diff = Math.abs(other.bestLine.p1.idx - item.bestLine.p1.idx);
                        if (p1Diff <= 8 || slopeDiff < 0.25) {
                            isDuplicate = true;
                            if (item.strengthScore > other.strengthScore) {
                                other.bestLine = item.bestLine;
                                // Keep original timeframe reference
                                other.currentLineVal = item.currentLineVal;
                                other.futureTs = item.futureTs;
                                other.futureLineVal = item.futureLineVal;
                                other.chUpperVal = item.chUpperVal;
                                other.chLowerVal = item.chLowerVal;
                                other.medianVal = item.medianVal;
                                other.angleDeg = item.angleDeg;
                                other.isBreakout = item.isBreakout;
                                other.isRetest = item.isRetest;
                                other.isBreakdown = item.isBreakdown;
                                other.isNearLevel = item.isNearLevel;
                                other.strengthScore = item.strengthScore;
                                other.status = item.status;
                            }
                            break;
                        }
                    }
                }
                if (!isDuplicate) linesToDraw.push(item);
            });

            // 5. VẼ CÁC ĐƯỜNG XU HƯỚNG VÀ KÊNH GIÁ
            linesToDraw.forEach(item => {
                let bestLine = item.bestLine;
                let tf = item.tf;
                let isBreakout = item.isBreakout;
                let isBreakdown = item.isBreakdown;

                

                let mainColor, badgeBorder, lineStyle;
                if (isBreakout) {
                    mainColor = '#a855f7';
                    badgeBorder = '#a855f7';
                    lineStyle = 'dashed';
                } else if (isBreakdown || bestLine.isBroken) {
                    mainColor = 'rgba(148, 163, 184, 0.45)';
                    badgeBorder = '#64748b';
                    lineStyle = 'dashed';
                } else if (bestLine.type === 'UPTREND') {
                    mainColor = tf.tfColor;
                    badgeBorder = '#10b981';
                    lineStyle = 'solid';
                } else {
                    mainColor = tf.tfRed;
                    badgeBorder = '#ef4444';
                    lineStyle = 'solid';
                }

                // Vẽ Main Trendline
                let trendId = targetChart.createOverlay({
                    name: 'segment',
                    points: [
                        { timestamp: bestLine.p1.ts, value: bestLine.p1.val },
                        { timestamp: item.futureTs, value: item.futureLineVal }
                    ],
                    styles: {
                        line: {
                            color: mainColor,
                            size: (isBreakdown || bestLine.isBroken) ? 1.2 : 2.2,
                            style: lineStyle
                        }
                    }
                });
                if (trendId) targetChart.trendIds.push(trendId);

                // Vẽ Kênh giá song song và Trục Median (nếu bật tùy chọn)
                if (window.trendShowChannels) {
                    let chShift = bestLine.type === 'UPTREND' ? (item.maxDistUpper || 1.5 * recentAtr) : -(item.maxDistLower || 1.5 * recentAtr);
                    let chColor = bestLine.type === 'UPTREND' ? 'rgba(245, 158, 11, 0.85)' : 'rgba(56, 189, 248, 0.85)';
                    
                    let chId = targetChart.createOverlay({
                        name: 'segment',
                        points: [
                            { timestamp: bestLine.p1.ts, value: bestLine.p1.val + chShift },
                            { timestamp: item.futureTs, value: item.futureLineVal + chShift }
                        ],
                        styles: { line: { color: chColor, size: 1.5, style: 'dashed' } }
                    });
                    if (chId) targetChart.trendIds.push(chId);

                    let medId = targetChart.createOverlay({
                        name: 'segment',
                        points: [
                            { timestamp: bestLine.p1.ts, value: bestLine.p1.val + chShift / 2 },
                            { timestamp: item.futureTs, value: item.futureLineVal + chShift / 2 }
                        ],
                        styles: { line: { color: 'rgba(148, 163, 184, 0.65)', size: 1, style: 'dashed' } }
                    });
                    if (medId) targetChart.trendIds.push(medId);
                }

                // Nhãn Badge tại Điểm Bắt đầu P1
                let statusLabel = '';
                if (isBreakout) statusLabel = `⚡ BREAKOUT (Vol x${volRatio})`;
                else if (item.isRetest) statusLabel = `🎯 RETEST (${bestLine.touches}c)`;
                else if (isBreakdown || bestLine.isBroken) statusLabel = `⚪ Đã gãy`;
                else if (bestLine.type === 'UPTREND') statusLabel = `🟢 Hỗ trợ (${bestLine.touches}c · +${item.angleDeg}°)`;
                else statusLabel = `🔴 Kháng cự (${bestLine.touches}c · ${item.angleDeg}°)`;

                let badgeText = `${tf.name}: ${statusLabel}`;
                let badgeY = bestLine.type === 'DOWNTREND' ? (bestLine.p1.val + 0.4 * recentAtr) : (bestLine.p1.val - 0.4 * recentAtr);

                let tagId = targetChart.createOverlay({
                    name: 'clickableText',
                    extendData: badgeText,
                    points: [{ timestamp: bestLine.p1.ts, value: badgeY }],
                    styles: {
                        text: {
                            paddingLeft: 6,
                            paddingRight: 6,
                            paddingTop: 3,
                            paddingBottom: 3,
                            backgroundColor: isLightMode ? '#ffffff' : 'rgba(15, 23, 42, 0.88)',
                            borderColor: badgeBorder,
                            borderSize: 1,
                            color: (isBreakdown || bestLine.isBroken) ? '#94a3b8' : mainColor,
                            size: 10.5,
                            weight: 'bold',
                            borderRadius: 4
                        }
                    }
                });
                if (tagId) targetChart.trendIds.push(tagId);
            });

            // 6. TÍNH TOÁN THÔNG SỐ KỸ THUẬT & DỰ BÁO HÀNH LANG THEO CHU KỲ ĐANG XEM
            let priTf = null;
            if (window.trendSelectedTf && window.trendSelectedTf !== 'all') {
                priTf = detectedTfResults.find(r => r.tf.key === window.trendSelectedTf);
            }
            if (!priTf) {
                priTf = detectedTfResults.find(r => r.isBreakout || r.isRetest) 
                     || detectedTfResults.find(r => r.tf.key === '1w')
                     || detectedTfResults.find(r => r.tf.key === '1m')
                     || detectedTfResults.find(r => r.tf.key === '3m')
                     || detectedTfResults[detectedTfResults.length - 1]
                     || detectedTfResults[0];
            }
            let activeTechnicalMetrics = null;

            if (priTf && priTf.bestLine) {
                let curPrice = lastBar.close;
                let cLine = priTf.currentLineVal;
                let angleDeg = priTf.angleDeg;
                let upperResistance = priTf.chUpperVal;
                let lowerSupport = priTf.chLowerVal;
                let medianVal = priTf.medianVal;

                let channelWidth = Math.abs(upperResistance - lowerSupport);
                let contractionPct = ((channelWidth / (medianVal || 1)) * 100).toFixed(1);

                let sigTitle = 'THEO DÕI KÊNH';
                if (priTf.isBreakout) sigTitle = `BREAKOUT KÊNH (Vol x${volRatio})`;
                else if (priTf.isRetest) sigTitle = `RETEST CHẠM BẬT`;
                else if (priTf.isBreakdown) sigTitle = `GÃY KÊNH GIÁ`;
                else if (priTf.isNearLevel) sigTitle = priTf.bestLine.type === 'UPTREND' ? `CẬN HỖ TRỢ (${cLine.toFixed(2)})` : `CẬN KHÁNG CỰ (${cLine.toFixed(2)})`;
                else if (priTf.bestLine.type === 'UPTREND') sigTitle = `KÊNH TĂNG (+${angleDeg}°)`;
                else sigTitle = `KÊNH GIẢM (${angleDeg}°)`;

                activeTechnicalMetrics = {
                    symbol: currentSym,
                    currentPrice: curPrice,
                    trendType: priTf.bestLine.type,
                    status: priTf.status,
                    sigTitle: sigTitle,
                    tfName: priTf.tf.name,
                    cLine: cLine,
                    upperResistance: upperResistance,
                    lowerSupport: lowerSupport,
                    medianVal: medianVal,
                    angleDeg: angleDeg,
                    contractionPct: contractionPct,
                    volRatio: volRatio,
                    strengthScore: priTf.strengthScore
                };

                // Nhãn Trạng thái Kỹ thuật Khách quan tại Nến Gần Nhất
                let sigText = '';
                let sigBg = '#2563eb';
                let sigBorder = '#38bdf8';

                if (priTf.isBreakout) {
                    sigText = `⚡ BREAKOUT KÊNH (Vol x${volRatio})`;
                    sigBg = '#7c3aed';
                    sigBorder = '#a855f7';
                } else if (priTf.isRetest) {
                    sigText = `🎯 RETEST CHẠM BẬT (${cLine.toFixed(2)})`;
                    sigBg = '#0284c7';
                    sigBorder = '#38bdf8';
                } else if (priTf.isNearLevel) {
                    sigText = priTf.bestLine.type === 'UPTREND' ? `🟢 CẬN HỖ TRỢ: ${cLine.toFixed(2)}` : `🔴 CẬN CẢN KÊNH: ${cLine.toFixed(2)}`;
                    sigBg = '#d97706';
                    sigBorder = '#fbbf24';
                } else if (priTf.bestLine.type === 'DOWNTREND') {
                    sigText = `🔴 KHÁNG CỰ KÊNH: ${cLine.toFixed(2)} (Góc: ${angleDeg}°)`;
                    sigBg = 'rgba(239, 68, 68, 0.85)';
                    sigBorder = '#ef4444';
                } else {
                    sigText = `🟢 HỖ TRỢ KÊNH: ${cLine.toFixed(2)} (Góc: +${angleDeg}°)`;
                    sigBg = 'rgba(16, 185, 129, 0.85)';
                    sigBorder = '#10b981';
                }

                // (Latest candle floating badge removed for cleaner chart view)

// (Removed redundant isolated projection dashed segments)
            }

            // 7. Cập nhật HUD Bảng Thông Số Kỹ Thuật
            window.currentTrendAnalysis = {
                symbol: currentSym,
                timeframes: detectedTfResults,
                metrics: activeTechnicalMetrics,
                volRatio: volRatio,
                lastBar: lastBar
            };

            const hud = document.getElementById('trendHudMatrix');
            if (hud && window.isTrendOn && window.trendShowHud) {
                hud.style.display = 'flex';
                renderTrendHudMatrix(window.currentTrendAnalysis);
            }
        }

        function showTrendTip(e, text) {
            const tip = document.getElementById('trendCustomTooltip');
            if (!tip || !text) return;
            tip.innerHTML = text;
            tip.style.display = 'block';
            let chartWrap = document.getElementById('chart-wrapper') || document.getElementById('chart-container');
            let rect = chartWrap ? chartWrap.getBoundingClientRect() : { left: 0, top: 0, width: 800 };
            
            let clientX = e.clientX !== undefined ? e.clientX : (e.x !== undefined ? e.x + rect.left : rect.left + 200);
            let clientY = e.clientY !== undefined ? e.clientY : (e.y !== undefined ? e.y + rect.top : rect.top + 150);
            
            let x = clientX - rect.left + 15;
            let y = clientY - rect.top + 10;
            
            // Adjust if overflowing right side
            if (x + 330 > (rect.width || 800)) {
                x = clientX - rect.left - 340;
            }
            tip.style.left = Math.max(10, x) + 'px';
            tip.style.top = Math.max(10, y) + 'px';
        }

        function moveTrendTip(e) {
            const tip = document.getElementById('trendCustomTooltip');
            if (!tip || tip.style.display === 'none') return;
            let chartWrap = document.getElementById('chart-wrapper');
            let rect = chartWrap ? chartWrap.getBoundingClientRect() : { left: 0, top: 0 };
            let x = e.clientX - rect.left + 15;
            let y = e.clientY - rect.top + 10;
            if (chartWrap && (x + 260 > chartWrap.clientWidth)) {
                x = e.clientX - rect.left - 265;
            }
            tip.style.left = Math.max(10, x) + 'px';
            tip.style.top = Math.max(10, y) + 'px';
        }

        function hideTrendTip() {
            const tip = document.getElementById('trendCustomTooltip');
            if (tip) tip.style.display = 'none';
        }

        // Centralized Event Delegation for Hover Tooltips on Trendline HUD
        (function initTrendTooltipDelegation() {
            document.addEventListener('mouseover', (e) => {
                let row = e.target.closest ? e.target.closest('.trend-hud-item') : null;
                if (!row) return;
                let tipRaw = row.getAttribute('data-tip-text');
                if (tipRaw) {
                    showTrendTip(e, decodeURIComponent(tipRaw));
                }
            });

            document.addEventListener('mousemove', (e) => {
                let row = e.target.closest ? e.target.closest('.trend-hud-item') : null;
                if (row && row.getAttribute('data-tip-text')) {
                    moveTrendTip(e);
                }
            });

            document.addEventListener('mouseout', (e) => {
                let fromRow = e.target.closest ? e.target.closest('.trend-hud-item') : null;
                let toRow = (e.relatedTarget && e.relatedTarget.closest) ? e.relatedTarget.closest('.trend-hud-item') : null;
                if (fromRow && fromRow !== toRow) {
                    hideTrendTip();
                }
            });
        })();

        function getSwingInsightHtml(sw) {
            const sym = (document.getElementById('currentSymbolDisplay') ? document.getElementById('currentSymbolDisplay').innerText.trim().toUpperCase() : '') || 'CỔ PHIẾU';
            const price = sw.val ? sw.val.toFixed(2) : '--';
            const label = sw.label;
            
            if (label === 'LH') {
                return `
                    <div style="padding: 5px 3px; max-width: 290px; line-height: 1.45; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                        <div style="font-size: 12px; font-weight: 800; color: #ef4444; margin-bottom: 4px; display: flex; align-items: center; gap: 5px;">
                            <span>🔴</span> <b>[LH] Đỉnh Sau Thấp Hơn (${price})</b>
                        </div>
                        <div style="font-size: 11px; color: #f87171; font-weight: 700; margin-bottom: 4px;">
                            ⚔️ <i>Phe Mua Hụt Hơi · Cung Ép Bán Sớm</i>
                        </div>
                        <div style="font-size: 10.5px; color: #cbd5e1;">
                            Nhịp kéo giá lên vùng <b>${price}</b> nhưng lực cầu nhanh chóng yếu thế trước khi chạm đỉnh cũ. Phe bán chủ động xả hàng từ mức giá thấp hơn, cho thấy tâm lý bên cầm hàng chấp nhận bán sớm và phe bán đang kiểm soát thế trận.
                        </div>
                    </div>
                `;
            } else if (label === 'HL') {
                return `
                    <div style="padding: 5px 3px; max-width: 290px; line-height: 1.45; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                        <div style="font-size: 12px; font-weight: 800; color: #10b981; margin-bottom: 4px; display: flex; align-items: center; gap: 5px;">
                            <span>🟢</span> <b>[HL] Đáy Sau Nâng Dần (${price})</b>
                        </div>
                        <div style="font-size: 11px; color: #34d399; font-weight: 700; margin-bottom: 4px;">
                            🛡️ <i>Cầu Đỡ Chủ Động · Cung Giá Rẻ Cạn Kiệt</i>
                        </div>
                        <div style="font-size: 10.5px; color: #cbd5e1;">
                            Nhịp điều chỉnh giảm về <b>${price}</b> lập tức kích hoạt dòng tiền mua gom đỡ sớm, không cho giá giảm sâu về đáy cũ. Cho thấy lượng cung bán rẻ đã kiệt quệ và phe mua chấp nhận trả giá cao hơn, tạo bệ đỡ vững chắc cho nhịp tăng mới.
                        </div>
                    </div>
                `;
            } else if (label === 'LL') {
                return `
                    <div style="padding: 5px 3px; max-width: 290px; line-height: 1.45; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                        <div style="font-size: 12px; font-weight: 800; color: #f43f5e; margin-bottom: 4px; display: flex; align-items: center; gap: 5px;">
                            <span>🛑</span> <b>[LL] Đáy Sâu Mới (${price})</b>
                        </div>
                        <div style="font-size: 11px; color: #fb7185; font-weight: 700; margin-bottom: 4px;">
                            ⚡ <i>Bán Tháo Hoảng Loạn · Vùng Chiết Khấu Cao</i>
                        </div>
                        <div style="font-size: 10.5px; color: #cbd5e1;">
                            Giá bị ép thủng qua đáy hỗ trợ cũ về mốc <b>${price}</b>, kích hoạt các lệnh cắt lỗ diện rộng. Khi lượng hàng yếu tâm lý bị rũ bỏ hoàn toàn, đây thường là vùng dòng tiền lớn (Smart Money) âm thầm hấp thụ định giá rẻ.
                        </div>
                    </div>
                `;
            } else if (label === 'HH') {
                return `
                    <div style="padding: 5px 3px; max-width: 290px; line-height: 1.45; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                        <div style="font-size: 12px; font-weight: 800; color: #38bdf8; margin-bottom: 4px; display: flex; align-items: center; gap: 5px;">
                            <span>⚡</span> <b>[HH] Đỉnh Cao Kỷ Lục Mới (${price})</b>
                        </div>
                        <div style="font-size: 11px; color: #38bdf8; font-weight: 700; margin-bottom: 4px;">
                            🚀 <i>Xung Lực Cầu Áp Đảo · Mở Rộng Xu Hướng</i>
                        </div>
                        <div style="font-size: 10.5px; color: #cbd5e1;">
                            Lực cầu bùng nổ hấp thụ toàn bộ lượng hàng chốt lời tại đỉnh cũ và đẩy giá bứt phá lên <b>${price}</b>. Xác nhận xu hướng tăng đang có gia tốc mạnh mẽ và phe mua nắm hoàn toàn quyền kiểm soát thế trận.
                        </div>
                    </div>
                `;
            }
            return '';
        }

        // Hover Tooltip cho các điểm Cấu trúc Giá LH, HL, LL, HH trên Biểu đồ
        (function initSwingPointHover() {
            let activeSwingTip = false;
            
            // 1. Lắng nghe sự kiện di chuột trực tiếp trên toàn màn hình biểu đồ
            document.addEventListener('mousemove', (e) => {
                if (!window.isTrendOn || !chart1 || !chart1.trendRecentSwings || chart1.trendRecentSwings.length === 0) {
                    if (activeSwingTip) {
                        hideTrendTip();
                        activeSwingTip = false;
                    }
                    return;
                }
                
                const chartWrap = document.getElementById('chart-wrapper') || document.getElementById('chart-container');
                if (!chartWrap) return;
                const rect = chartWrap.getBoundingClientRect();
                
                if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
                    if (activeSwingTip) {
                        hideTrendTip();
                        activeSwingTip = false;
                    }
                    return;
                }
                
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                let hoveredSwing = null;
                for (let sw of chart1.trendRecentSwings) {
                    try {
                        let pts = null;
                        if (chart1.convertToPixel) {
                            pts = chart1.convertToPixel([{ timestamp: sw.ts, value: sw.val }], { paneId: 'candle_pane' });
                        }
                        let pt = (pts && Array.isArray(pts) && pts.length > 0) ? pts[0] : (pts && pts.x ? pts : null);
                        
                        if (pt && typeof pt.x === 'number' && typeof pt.y === 'number') {
                            let dist = Math.hypot(mouseX - pt.x, mouseY - pt.y);
                            if (dist <= 42) { // Vùng nhận diện 42px quanh nhãn LH, HL
                                hoveredSwing = sw;
                                break;
                            }
                        }
                    } catch(err) {}
                }
                
                if (hoveredSwing) {
                    let tipContent = getSwingInsightHtml(hoveredSwing);
                    showTrendTip(e, tipContent);
                    activeSwingTip = true;
                } else if (activeSwingTip) {
                    hideTrendTip();
                    activeSwingTip = false;
                }
            });

            // 2. Tích hợp thêm kênh Crosshair của KlineCharts để đảm bảo độ nhạy 100%
            if (chart1 && chart1.subscribeAction) {
                try {
                    chart1.subscribeAction('onCrosshairChange', (param) => {
                        if (!window.isTrendOn || !chart1.trendRecentSwings || !param || !param.kLineData) return;
                        const barTs = param.kLineData.timestamp;
                        const matchedSw = chart1.trendRecentSwings.find(s => Math.abs(s.ts - barTs) < 43200000); // Khớp nến
                        
                        if (matchedSw && param.coordinate) {
                            let tipContent = getSwingInsightHtml(matchedSw);
                            showTrendTip({ clientX: param.coordinate.x, clientY: param.coordinate.y }, tipContent);
                            activeSwingTip = true;
                        }
                    });
                } catch(e) {}
            }
        })();

                function focusTrendHudItem(type, tfKey) {
            if (!window.isTrendOn) return;
            
            // 1. Nhấp vào dòng chu kỳ thời gian -> Lọc ngay biểu đồ sang chu kỳ đó
            if (type === 'timeframe' && tfKey) {
                if (typeof setTrendTfFilter === 'function') {
                    setTrendTfFilter(tfKey);
                }
                return;
            }
            
            // 2. Nhấp vào Biên độ kênh -> Bật/Tắt dải kênh giá song song
            if (type === 'channel') {
                if (typeof toggleTrendChannelOption === 'function') {
                    toggleTrendChannelOption();
                }
                return;
            }
            
            if (!window.currentTrendAnalysis || !window.currentTrendAnalysis.metrics) return;
            const m = window.currentTrendAnalysis.metrics;
            const targetChart = chart1;
            if (!targetChart) return;
            
            // Xóa đường chiếu rọi trước đó
            if (targetChart.trendFocusIds && targetChart.trendFocusIds.length) {
                targetChart.trendFocusIds.forEach(id => {
                    try { targetChart.removeOverlay({ id }); } catch(e) {}
                });
                targetChart.trendFocusIds = [];
            }
            
            // Nếu bấm lại chính dòng đang sáng thì tắt chiếu rọi
            if (window.trendActiveFocus === type) {
                window.trendActiveFocus = null;
                if (typeof renderTrendHudMatrix === 'function') renderTrendHudMatrix(window.currentTrendAnalysis);
                return;
            }
            
            window.trendActiveFocus = type;
            const dataList = targetChart.getDataList ? targetChart.getDataList() : [];
            if (!dataList || dataList.length === 0) return;
            
            const firstBar = dataList[0];
            const lastBar = dataList[dataList.length - 1];
            const avgInterval = dataList.length > 1 ? (lastBar.timestamp - firstBar.timestamp) / (dataList.length - 1) : 86400000;
            const futureTs = lastBar.timestamp + 30 * avgInterval;
            const startTs = firstBar.timestamp;
            
            let targetVal = 0;
            let labelText = '';
            let levelColor = '#38bdf8';
            let isDashed = false;
            
            if (type === 'resistance') {
                targetVal = m.upperResistance;
                labelText = `🛑 VÙNG CẢN: ${targetVal.toFixed(2)}`;
                levelColor = '#ef4444';
            } else if (type === 'median') {
                targetVal = m.medianVal;
                labelText = `⚖️ TRỤC CÂN BẰNG: ${targetVal.toFixed(2)}`;
                levelColor = '#38bdf8';
                isDashed = true;
            } else if (type === 'support') {
                targetVal = m.lowerSupport;
                labelText = `🛡️ VÙNG ĐỠ: ${targetVal.toFixed(2)}`;
                levelColor = '#10b981';
            } else if (type === 'status') {
                targetVal = m.cLine;
                labelText = `💡 ${m.sigTitle || 'TRẠNG THÁI'}`;
                levelColor = m.trendType === 'UPTREND' ? '#10b981' : '#ef4444';
            }
            
            if (!targetChart.trendFocusIds) targetChart.trendFocusIds = [];
            
            // Vẽ đường rọi sáng ngang qua toàn bộ biểu đồ
            let lineId = targetChart.createOverlay({
                name: 'segment',
                points: [
                    { timestamp: startTs, value: targetVal },
                    { timestamp: futureTs, value: targetVal }
                ],
                styles: {
                    line: {
                        color: levelColor,
                        size: 2.2,
                        style: isDashed ? 'dashed' : 'solid'
                    }
                }
            });
            if (lineId) targetChart.trendFocusIds.push(lineId);
            
            // Gắn nhãn huy hiệu nổi bật tại vị trí nến cuối
            let tagId = targetChart.createOverlay({
                name: 'clickableText',
                extendData: labelText,
                points: [{ timestamp: lastBar.timestamp, value: targetVal }],
                styles: {
                    text: {
                        backgroundColor: levelColor,
                        color: '#ffffff',
                        size: 11,
                        weight: 'bold',
                        borderRadius: 4,
                        paddingLeft: 7,
                        paddingRight: 7,
                        paddingTop: 3,
                        paddingBottom: 3
                    }
                }
            });
            if (tagId) targetChart.trendFocusIds.push(tagId);
            
            // Cập nhật lại giao diện HUD để viền sáng mục được chọn
            if (typeof renderTrendHudMatrix === 'function') renderTrendHudMatrix(window.currentTrendAnalysis);
        }
        window.focusTrendHudItem = focusTrendHudItem;

        function renderTrendHudMatrix(analysis) {
            const hud = document.getElementById('trendHudMatrix');
            const content = document.getElementById('trendHudContent');
            const symBadge = document.getElementById('trendHudSymbolBadge');
            if (!hud || !content || !analysis) return;

            const sym = analysis.symbol || '--';
            if (symBadge) symBadge.innerText = sym;

            let curPrice = (analysis.lastBar && analysis.lastBar.close) || (analysis.metrics && analysis.metrics.currentPrice) || 0;
            let lastBar = analysis.lastBar || (chart1 && chart1.getDataList ? chart1.getDataList()[chart1.getDataList().length - 1] : { volume: 0 });
            let dayVolM = ((lastBar.volume || 0) / 1000000).toFixed(1);

            let tfHtml = '';
            (analysis.timeframes || []).forEach(item => {
                let color = '#38bdf8';
                let label = '';
                let icon = '📈';
                let structText = '';
                let psychText = '';
                let actionText = '';

                if (item.isBreakout) {
                    color = '#c084fc';
                    icon = '⚡';
                    label = '⚡ Bứt phá cản (Breakout)';
                    structText = `Đóng nến vượt dứt khoát qua đường cản trên tại <b>${item.currentLineVal.toFixed(2)}</b>`;
                    psychText = `Lực cầu áp đảo đã hấp thụ sạch sẽ toàn bộ lượng cung chốt lời tại cản kênh. Phe mua chính thức phá vỡ thế giằng co và mở ra nhịp tăng giá mới.`;
                    actionText = `🎯 <b>MỞ VỊ THẾ MUA BREAKOUT (GIA TĂNG TỶ TRỌNG).</b> Đặt mốc chặn lỗ (Stoploss) ngay dưới mốc cản cũ vừa vượt qua.`;
                } else if (item.isRetest) {
                    color = '#38bdf8';
                    icon = '🎯';
                    label = '🎯 Kiểm định cản (Chạm bật)';
                    structText = `Giá kiểm định lại mốc kỹ thuật <b>${item.currentLineVal.toFixed(2)}</b> và rút chân`;
                    psychText = `Mốc cản cũ sau khi bị bứt phá đã thành công chuyển hóa thành <b>Bệ Đỡ Mới (S/R Flip)</b>. Dòng tiền lớn tiếp tục mua đỡ giá, phe bán giá rẻ đã cạn kiệt.`;
                    actionText = `🛡️ <b>ĐIỂM MUA GIA TĂNG (PULLBACK / RETEST).</b> Vị thế giải ngân an toàn với tỷ lệ R:R tối ưu.`;
                } else if (item.isBreakdown) {
                    color = '#94a3b8';
                    icon = '⚪';
                    label = '⚪ Đã thủng đường nâng đỡ';
                    structText = `Đóng nến gãy qua đường hỗ trợ tại <b>${item.currentLineVal.toFixed(2)}</b>`;
                    psychText = `Lực bán áp đảo đã bẻ gãy cấu trúc nâng đỡ trước đó. Cổ phiếu bước vào pha điều chỉnh sâu hoặc tái tích lũy lại nền giá mới.`;
                    actionText = `🛑 <b>HẠ TỶ TRỌNG / DỪNG LỖ.</b> Không bắt đáy sớm, chờ tín hiệu cân bằng tạo đáy mới.`;
                } else if (item.status === 'NEAR_SUPPORT') {
                    color = '#34d399';
                    icon = '🟢';
                    label = '🟢 Ở vùng Đỡ giá tốt';
                    structText = `Giá hiện tại (${curPrice.toFixed(2)}) đang bám sát đáy kênh hỗ trợ <b>${item.currentLineVal.toFixed(2)}</b>`;
                    psychText = `Phe mua đang chủ động giải ngân gom hàng để bảo vệ vùng giá thấp của kênh. Rủi ro điều chỉnh giảm sâu được thu hẹp đáng kể.`;
                    actionText = `📥 <b>VÙNG GIẢI NGÂN GOM HÀNG TỐT.</b> Mở mua thăm dò quanh vùng hỗ trợ, đặt dừng lỗ nếu gãy đáy kênh.`;
                } else if (item.status === 'NEAR_RESISTANCE') {
                    color = '#f87171';
                    icon = '🔴';
                    label = '🔴 Áp sát Vùng Cản trên';
                    structText = `Giá hiện tại (${curPrice.toFixed(2)}) đang tiến sát trần cản kênh <b>${item.currentLineVal.toFixed(2)}</b>`;
                    psychText = `Áp lực cung từ phe bán chốt lời ngắn hạn đang gia tăng rất mạnh. Dòng tiền mua bắt đầu xuất hiện trạng thái lưỡng lự.`;
                    actionText = `🛑 <b>KHÔNG MUA ĐUỔI.</b> Ưu tiên canh chốt lời từng phần (30-50%) và chờ nhịp rung lắc tích lũy lại.`;
                } else if (item.bestLine && item.bestLine.type === 'UPTREND') {
                    color = '#34d399';
                    icon = '🟢';
                    if (item.angleDeg >= 50) label = `🟢 Tăng dốc đứng (+${item.angleDeg}°)`;
                    else if (item.angleDeg >= 25) label = `🟢 Tăng bền vững (+${item.angleDeg}°)`;
                    else label = `🟡 Tăng tích lũy (+${item.angleDeg}°)`;
                    structText = `Đáy sau cao hơn đáy trước qua <b>${item.bestLine.touches} lần chạm</b> · Biên độ mở rộng`;
                    psychText = `Cổ phiếu đang trong chu kỳ tăng trưởng tích cực. Phe mua chấp nhận trả giá cao hơn ở mỗi nhịp điều chỉnh để gom giữ cổ phiếu.`;
                    actionText = `🏆 <b>ƯU TIÊN NẮM GIỮ (BUY & HOLD).</b> Nâng dần mốc chặn lãi (Trailing Stop) bám theo đường xu hướng tăng.`;
                } else {
                    color = '#f87171';
                    icon = '🔴';
                    if (item.angleDeg <= -50) label = `🔴 Giảm dốc sâu (${item.angleDeg}°)`;
                    else if (item.angleDeg <= -25) label = `🔴 Xu hướng Giảm (${item.angleDeg}°)`;
                    else label = `🟡 Giảm nhẹ (${item.angleDeg}°)`;
                    structText = `Đỉnh sau thấp dần qua <b>${item.bestLine.touches} lần chạm</b> · Đường kháng cự đè giá`;
                    psychText = `Phe bán đang kiểm soát thế trận, các nhịp tăng giá chỉ mang tính chất hồi phục kỹ thuật trong hành lang giảm giá.`;
                    actionText = `⚠️ <b>THẬN TRỌNG.</b> Canh các nhịp hồi phục chạm cản trên để cơ cấu hạ tỷ trọng danh mục.`;
                }

                let richTipHtml = `
                    <div style="padding: 6px 4px; max-width: 320px; line-height: 1.45; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 5px;">
                            <div style="font-size: 12px; font-weight: 800; color: ${color}; display: flex; align-items: center; gap: 5px;">
                                <span>${icon}</span> <b>[KÊNH ${item.tf.name.toUpperCase()}] ${label}</b>
                            </div>
                            <span style="font-size: 10px; font-weight: 700; color: #fbbf24;">Góc: ${item.angleDeg >= 0 ? '+' : ''}${item.angleDeg}°</span>
                        </div>
                        <div style="font-size: 10.5px; color: #94a3b8; margin-bottom: 5px;">
                            📊 <b>Cấu trúc:</b> ${structText} · Điểm chạm: <b>${item.bestLine.touches} lần</b> · Độ tin cậy: <b>${item.strengthScore}đ</b>
                        </div>
                        <div style="font-size: 11px; color: #f1f5f9; font-weight: 600; margin-bottom: 4px;">
                            🧠 <b>Tâm lý Cung Cầu:</b>
                        </div>
                        <div style="font-size: 10.5px; color: #cbd5e1; margin-bottom: 6px;">
                            ${psychText}
                        </div>
                        <div style="font-size: 10.5px; color: #38bdf8; background: rgba(56,189,248,0.1); border-left: 2.5px solid #38bdf8; padding: 4px 6px; border-radius: 2px;">
                            💡 ${actionText}
                        </div>
                        <div style="font-size: 9.5px; color: #64748b; margin-top: 4px; text-align: right;">
                            <i>(Nhấp vào dòng để lọc biểu đồ sang chu kỳ này)</i>
                        </div>
                    </div>
                `;

                let encodedTip = encodeURIComponent(richTipHtml);
                let isTfActive = window.trendSelectedTf === item.tf.key;
                let activeStyle = isTfActive ? 'background: rgba(37, 99, 235, 0.35); border-radius: 4px;' : 'border-radius: 4px;';
                
                tfHtml += `
                    <div class="trend-hud-item" onclick="focusTrendHudItem('timeframe', '${item.tf.key}')" data-tip-text="${encodedTip}" style="display: flex; justify-content: space-between; align-items: center; padding: 2.5px 4px; cursor: pointer; transition: all 0.15s; border: none; ${activeStyle}">
                        <span style="color: ${isTfActive ? '#ffffff' : '#cbd5e1'}; font-weight: ${isTfActive ? '700' : '600'}; font-size: 10.5px; text-shadow: 0 1px 3px rgba(0,0,0,0.95), 0 0 2px #000;">• ${item.tf.name}:</span>
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <span style="color: ${color}; font-weight: 700; font-family: var(--font-mono, monospace); font-size: 10.5px; text-shadow: 0 1px 3px rgba(0,0,0,0.95), 0 0 2px #000;">${label}</span>
                        </div>
                    </div>
                `;
            });

            let m = analysis.metrics;
            let metricsHtml = '';
            if (m) {
                let contractionVal = parseFloat(m.contractionPct) || 0;
                let contractionNote = contractionVal <= 7 ? 'Đang nén chặt' : 'Biên độ rộng';
                let volVal = parseFloat(m.volRatio) || 1.0;
                let volText = volVal >= 1.5 ? 'Bùng nổ' : (volVal >= 1.0 ? 'Bình quân' : 'Thấp hơn TB');
                let volColor = volVal >= 1.5 ? '#c084fc' : (volVal >= 1.0 ? '#38bdf8' : '#cbd5e1');

                // 1. Cản trên
                let resDistPct = curPrice > 0 ? (((m.upperResistance - curPrice) / curPrice) * 100).toFixed(1) : '0.0';
                let resTipHtml = `
                    <div style="padding: 6px 4px; max-width: 320px; line-height: 1.45; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 5px;">
                            <div style="font-size: 12px; font-weight: 800; color: #ef4444; display: flex; align-items: center; gap: 5px;">
                                <span>🛑</span> <b>VÙNG CẢN TRÊN KÊNH: ${m.upperResistance.toFixed(2)}</b>
                            </div>
                            <span style="font-size: 10px; font-weight: 700; color: #ef4444;">KHÁNG CỰ</span>
                        </div>
                        <div style="font-size: 10.5px; color: #94a3b8; margin-bottom: 5px;">
                            📊 <b>Vị trí:</b> Cách giá hiện tại: <b>+${resDistPct}%</b>
                        </div>
                        <div style="font-size: 11px; color: #f1f5f9; font-weight: 600; margin-bottom: 4px;">
                            🧠 <b>Tâm lý Cung Cầu:</b>
                        </div>
                        <div style="font-size: 10.5px; color: #cbd5e1; margin-bottom: 6px;">
                            Trần biên độ của kênh giá. Nơi tập trung lượng lớn lệnh cung bán chốt lời từ các nhà đầu tư mua từ đáy kênh và phe kẹp hàng cũ.
                        </div>
                        <div style="font-size: 10.5px; color: #38bdf8; background: rgba(56,189,248,0.1); border-left: 2.5px solid #38bdf8; padding: 4px 6px; border-radius: 2px;">
                            💡 <b>Khuyến nghị Thực chiến:</b> Mục tiêu chốt lời ngắn hạn (Target 1). Không mua đuổi khi giá tiếp cận sát ${m.upperResistance.toFixed(2)}.
                        </div>
                    </div>
                `;

                // 2. Trục Cân bằng (Median)
                let medDistPct = curPrice > 0 ? (((curPrice - m.medianVal) / m.medianVal) * 100).toFixed(1) : '0.0';
                let medTipHtml = `
                    <div style="padding: 6px 4px; max-width: 320px; line-height: 1.45; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 5px;">
                            <div style="font-size: 12px; font-weight: 800; color: #38bdf8; display: flex; align-items: center; gap: 5px;">
                                <span>⚖️</span> <b>TRỤC CÂN BẰNG MEDIAN: ${m.medianVal.toFixed(2)}</b>
                            </div>
                            <span style="font-size: 10px; font-weight: 700; color: #38bdf8;">TRUNG TUYẾN</span>
                        </div>
                        <div style="font-size: 10.5px; color: #94a3b8; margin-bottom: 5px;">
                            📊 <b>Vị trí:</b> Giá hiện tại đang <b>${parseFloat(medDistPct) >= 0 ? '+' : ''}${medDistPct}%</b> so với trục cân bằng
                        </div>
                        <div style="font-size: 11px; color: #f1f5f9; font-weight: 600; margin-bottom: 4px;">
                            🧠 <b>Tâm lý Cung Cầu:</b>
                        </div>
                        <div style="font-size: 10.5px; color: #cbd5e1; margin-bottom: 6px;">
                            Đường trung tuyến chia kênh thành 2 vùng: Vùng Bullish (nửa trên) và Vùng Bearish (nửa dưới). Là nam châm hút giá trong các pha giằng co tích lũy.
                        </div>
                        <div style="font-size: 10.5px; color: #38bdf8; background: rgba(56,189,248,0.1); border-left: 2.5px solid #38bdf8; padding: 4px 6px; border-radius: 2px;">
                            💡 <b>Khuyến nghị Thực chiến:</b> Nếu giá vượt lên trên trục Median và giữ vững, tiếp tục nắm giữ vị thế.
                        </div>
                    </div>
                `;

                // 3. Đỡ dưới (Hỗ trợ)
                let supDistPct = curPrice > 0 ? (((curPrice - m.lowerSupport) / curPrice) * 100).toFixed(1) : '0.0';
                let supTipHtml = `
                    <div style="padding: 6px 4px; max-width: 320px; line-height: 1.45; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 5px;">
                            <div style="font-size: 12px; font-weight: 800; color: #10b981; display: flex; align-items: center; gap: 5px;">
                                <span>🛡️</span> <b>VÙNG ĐỠ DƯỚI KÊNH: ${m.lowerSupport.toFixed(2)}</b>
                            </div>
                            <span style="font-size: 10px; font-weight: 700; color: #10b981;">HỖ TRỢ</span>
                        </div>
                        <div style="font-size: 10.5px; color: #94a3b8; margin-bottom: 5px;">
                            📊 <b>Vị trí:</b> Đệm an toàn cách giá hiện tại: <b>-${supDistPct}%</b>
                        </div>
                        <div style="font-size: 11px; color: #f1f5f9; font-weight: 600; margin-bottom: 4px;">
                            🧠 <b>Tâm lý Cung Cầu:</b>
                        </div>
                        <div style="font-size: 10.5px; color: #cbd5e1; margin-bottom: 6px;">
                            Sàn biên độ của kênh giá. Nơi dòng tiền mua chủ động trực sẵn để gom hàng với mức giá chiết khấu an toàn.
                        </div>
                        <div style="font-size: 10.5px; color: #38bdf8; background: rgba(56,189,248,0.1); border-left: 2.5px solid #38bdf8; padding: 4px 6px; border-radius: 2px;">
                            💡 <b>Khuyến nghị Thực chiến:</b> Vùng mở mua gom tỷ trọng tốt (Pullback). Đặt dừng lỗ nếu nến ngày đóng cửa gãy mốc ${m.lowerSupport.toFixed(2)}.
                        </div>
                    </div>
                `;

                // 4. Biên độ Kênh dao động
                let contractionTipHtml = `
                    <div style="padding: 6px 4px; max-width: 320px; line-height: 1.45; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 5px;">
                            <div style="font-size: 12px; font-weight: 800; color: #fbbf24; display: flex; align-items: center; gap: 5px;">
                                <span>📐</span> <b>BIÊN ĐỘ KÊNH: ${m.contractionPct}%</b>
                            </div>
                            <span style="font-size: 10px; font-weight: 700; color: #fbbf24;">${contractionNote.toUpperCase()}</span>
                        </div>
                        <div style="font-size: 10.5px; color: #cbd5e1; margin-bottom: 6px;">
                            ${contractionVal <= 7.0 
                                ? `Kênh đang trong pha <b>Co thắt nén chặt năng lượng (${m.contractionPct}%)</b>. Thường là chỉ báo chuẩn bị xuất hiện một đợt bùng nổ biến động giá cực lớn.`
                                : `Kênh đang có độ mở rộng biến động <b>${m.contractionPct}%</b>. Phù hợp cho chiến lược lướt sóng theo các nhịp swing giữa 2 biên cản và hỗ trợ.`}
                        </div>
                        <div style="font-size: 10.5px; color: #38bdf8; background: rgba(56,189,248,0.1); border-left: 2.5px solid #38bdf8; padding: 4px 6px; border-radius: 2px;">
                            💡 <b>Chiến lược:</b> Nhấp vào dòng này để bật/tắt hiển thị dải kênh giá song song trên biểu đồ.
                        </div>
                    </div>
                `;

                // 5. Dòng tiền phiên
                let volTipHtml = `
                    <div style="padding: 6px 4px; max-width: 320px; line-height: 1.45; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 5px;">
                            <div style="font-size: 12px; font-weight: 800; color: ${volColor}; display: flex; align-items: center; gap: 5px;">
                                <span>📊</span> <b>DÒNG TIỀN PHIÊN: ${m.volRatio}x MA20</b>
                            </div>
                            <span style="font-size: 10px; font-weight: 700; color: ${volColor};">${volText.toUpperCase()}</span>
                        </div>
                        <div style="font-size: 10.5px; color: #cbd5e1; margin-bottom: 6px;">
                            Khối lượng khớp lệnh đạt <b>${dayVolM} Triệu CP</b> (${volVal >= 1.2 ? 'bùng nổ cao hơn trung bình 20 phiên' : 'thanh khoản ở mức thăm dò'}). Xác nhận mức độ tham gia thực tế của dòng tiền tạo lập.
                        </div>
                    </div>
                `;

                // 6. Trạng thái Kỹ thuật
                let stateTipHtml = `
                    <div style="padding: 6px 4px; max-width: 320px; line-height: 1.45; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 5px;">
                            <div style="font-size: 12px; font-weight: 800; color: #38bdf8; display: flex; align-items: center; gap: 5px;">
                                <span>💡</span> <b>TRẠNG THÁI: ${m.sigTitle}</b>
                            </div>
                        </div>
                        <div style="font-size: 10.5px; color: #cbd5e1; margin-bottom: 6px;">
                            Đánh giá tổng hợp từ góc dốc kênh (${m.angleDeg}°), quan hệ giá hiện tại so với các mốc cản/đỡ, và thanh khoản phiên.
                        </div>
                    </div>
                `;

                metricsHtml = `
                    <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed rgba(255,255,255,0.18); display: flex; flex-direction: column; gap: 3px; font-size: 10.5px; text-shadow: 0 1px 4px rgba(0,0,0,0.95), 0 0 6px rgba(0,0,0,0.85);">
                        <div class="trend-hud-item" onclick="focusTrendHudItem('resistance')" data-tip-text="${encodeURIComponent(resTipHtml)}" style="display: flex; justify-content: space-between; cursor: pointer; padding: 1.5px 3px; border-radius: 3px;">
                            <span style="color: #94a3b8;">🛑 Vùng Cản trên:</span>
                            <b style="color: #ef4444; font-family: var(--font-mono, monospace);">${m.upperResistance.toFixed(2)}</b>
                        </div>
                        <div class="trend-hud-item" onclick="focusTrendHudItem('median')" data-tip-text="${encodeURIComponent(medTipHtml)}" style="display: flex; justify-content: space-between; cursor: pointer; padding: 1.5px 3px; border-radius: 3px;">
                            <span style="color: #94a3b8;">⚖️ Vùng Cân bằng:</span>
                            <b style="color: #38bdf8; font-family: var(--font-mono, monospace);">${m.medianVal.toFixed(2)}</b>
                        </div>
                        <div class="trend-hud-item" onclick="focusTrendHudItem('support')" data-tip-text="${encodeURIComponent(supTipHtml)}" style="display: flex; justify-content: space-between; cursor: pointer; padding: 1.5px 3px; border-radius: 3px;">
                            <span style="color: #94a3b8;">🛡️ Vùng Đỡ dưới:</span>
                            <b style="color: #10b981; font-family: var(--font-mono, monospace);">${m.lowerSupport.toFixed(2)}</b>
                        </div>
                        <div class="trend-hud-item" onclick="focusTrendHudItem('channel')" data-tip-text="${encodeURIComponent(contractionTipHtml)}" style="display: flex; justify-content: space-between; cursor: pointer; padding: 1.5px 3px; border-radius: 3px;">
                            <span style="color: #94a3b8;">📐 Biên độ Kênh:</span>
                            <b style="color: #fbbf24; font-family: var(--font-mono, monospace);">${m.contractionPct}% <span style="font-size: 9px; font-weight: normal; color: #e2e8f0;">(${contractionNote})</span></b>
                        </div>
                        <div class="trend-hud-item" data-tip-text="${encodeURIComponent(volTipHtml)}" style="display: flex; justify-content: space-between; cursor: help; padding: 1.5px 3px; border-radius: 3px;">
                            <span style="color: #94a3b8;">📊 Dòng tiền:</span>
                            <b style="color: ${volColor}; font-family: var(--font-mono, monospace);">${volText} (${m.volRatio}x MA20)</b>
                        </div>
                        <div class="trend-hud-item" onclick="focusTrendHudItem('status')" data-tip-text="${encodeURIComponent(stateTipHtml)}" style="display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.12); padding-top: 3px; margin-top: 2px; cursor: pointer; padding: 1.5px 3px; border-radius: 3px;">
                            <span style="color: #94a3b8;">💡 Trạng thái:</span>
                            <b style="color: #38bdf8; font-size: 10.5px;">${m.sigTitle}</b>
                        </div>
                    </div>
                `;
            }

            content.innerHTML = tfHtml + metricsHtml;
        }

        window.keyLevelCount = parseInt(localStorage.getItem('keylevel_count') || '3') || 3;
        window.keyLevelShowStatic = localStorage.getItem('keylevel_show_static') !== 'false';
        window.keyLevelShowDynamic = localStorage.getItem('keylevel_show_dynamic') !== 'false';
        window.keyLevelGroup_flow = localStorage.getItem('keylevel_group_flow') !== 'false';
        window.keyLevelGroup_trend = localStorage.getItem('keylevel_group_trend') !== 'false';
        window.keyLevelGroup_volatility = localStorage.getItem('keylevel_group_volatility') !== 'false';
        window.keyLevelHudVisible = localStorage.getItem('keylevel_hud_visible') !== 'false';
        window.keyLevelHudCollapsed = localStorage.getItem('keylevel_hud_collapsed') === 'true';
        window.isKeyLevelOn = false;

        function updateKeyLevelButtons() {
            let curCount = String(window.keyLevelCount);
            ['3', '4', '5', 'all'].forEach(k => {
                const btn = document.getElementById(`btnKeyLevelCount_${k}`);
                if (btn) {
                    if (k === curCount) {
                        btn.classList.add('active');
                        btn.style.background = '#2563eb';
                        btn.style.borderColor = '#2563eb';
                        btn.style.color = '#fff';
                        btn.style.fontWeight = '700';
                    } else {
                        btn.classList.remove('active');
                        btn.style.background = 'rgba(255,255,255,0.04)';
                        btn.style.borderColor = 'rgba(255,255,255,0.08)';
                        btn.style.color = '#cbd5e1';
                        btn.style.fontWeight = '600';
                    }
                }
            });

            const btnStatic = document.getElementById('btnKeyLevel_static');
            if (btnStatic) {
                if (window.keyLevelShowStatic) {
                    btnStatic.classList.add('active');
                    btnStatic.style.background = '#2563eb';
                    btnStatic.style.borderColor = '#2563eb';
                    btnStatic.style.color = '#fff';
                    btnStatic.style.fontWeight = '700';
                } else {
                    btnStatic.classList.remove('active');
                    btnStatic.style.background = 'rgba(255,255,255,0.04)';
                    btnStatic.style.borderColor = 'rgba(255,255,255,0.08)';
                    btnStatic.style.color = '#cbd5e1';
                    btnStatic.style.fontWeight = '600';
                }
            }

            const btnDynamic = document.getElementById('btnKeyLevel_dynamic');
            if (btnDynamic) {
                if (window.keyLevelShowDynamic) {
                    btnDynamic.classList.add('active');
                    btnDynamic.style.background = '#2563eb';
                    btnDynamic.style.borderColor = '#2563eb';
                    btnDynamic.style.color = '#fff';
                    btnDynamic.style.fontWeight = '700';
                } else {
                    btnDynamic.classList.remove('active');
                    btnDynamic.style.background = 'rgba(255,255,255,0.04)';
                    btnDynamic.style.borderColor = 'rgba(255,255,255,0.08)';
                    btnDynamic.style.color = '#cbd5e1';
                    btnDynamic.style.fontWeight = '600';
                }
            }

            const btnHud = document.getElementById('btnKeyLevelHud');
            if (btnHud) {
                if (window.keyLevelHudVisible) {
                    btnHud.classList.add('active');
                    btnHud.style.background = 'rgba(168, 85, 247, 0.35)';
                    btnHud.style.borderColor = '#a855f7';
                    btnHud.style.color = '#fff';
                } else {
                    btnHud.classList.remove('active');
                    btnHud.style.background = 'rgba(255,255,255,0.04)';
                    btnHud.style.borderColor = 'rgba(255,255,255,0.08)';
                    btnHud.style.color = '#cbd5e1';
                }
            }

            const chkStatic = document.getElementById('chkGroup_static');
            if (chkStatic) chkStatic.checked = !!window.keyLevelShowStatic;
            const chkFlow = document.getElementById('chkGroup_flow');
            if (chkFlow) chkFlow.checked = !!window.keyLevelGroup_flow;
            const chkTrend = document.getElementById('chkGroup_trend');
            if (chkTrend) chkTrend.checked = !!window.keyLevelGroup_trend;
            const chkVol = document.getElementById('chkGroup_volatility');
            if (chkVol) chkVol.checked = !!window.keyLevelGroup_volatility;
        }

        function toggleKeyLevel() {
            toggleAdvancedFeature('btnKeyLevel', 'isKeyLevelOn', 'keyLevelIds', runKeyLevel, '#03a9f4');
            const tb = document.getElementById('keyLevelMiniToolbar');
            const hud = document.getElementById('keyLevelHudPanel');
            if (tb) {
                tb.style.display = window.isKeyLevelOn ? 'flex' : 'none';
                if (window.isKeyLevelOn && window.keyLevelCount === 'none') {
                    window.keyLevelCount = parseInt(localStorage.getItem('keylevel_count') || '3') || 3;
                }
                if (window.isKeyLevelOn && !window.keyLevelShowStatic && !window.keyLevelShowDynamic) {
                    window.keyLevelShowStatic = true;
                    window.keyLevelShowDynamic = true;
                }
                clearKeyLevelOverlays(chart1);
                if (window.isKeyLevelOn) {
                    runKeyLevel(chart1);
                    if (hud && window.keyLevelHudVisible) hud.style.display = 'block';
                } else {
                    if (hud) hud.style.display = 'none';
                }
                updateKeyLevelButtons();
            }
            updateKeyLevelToolbarPosition();
        }
        window.toggleKeyLevel = toggleKeyLevel;

        

        document.addEventListener('DOMContentLoaded', () => {
            const hud = document.getElementById('keyLevelHudPanel');
            if (hud && !window.isKeyLevelOn) {
                hud.style.display = 'none';
            }
        });


        function setKeyLevelCount(count) {
            if (String(window.keyLevelCount) === String(count)) {
                window.keyLevelCount = 'none';
            } else {
                window.keyLevelCount = count;
                localStorage.setItem('keylevel_count', count);
            }
            updateKeyLevelButtons();
            
            if (window.isKeyLevelOn) {
                clearKeyLevelOverlays(chart1);
                if (window.keyLevelCount !== 'none') {
                    runKeyLevel(chart1);
                } else {
                    const rrBadge = document.getElementById('keyLevelRrBadge');
                    if (rrBadge) {
                        rrBadge.innerText = 'R:R: --';
                        rrBadge.style.color = '#94a3b8';
                        rrBadge.style.borderColor = 'rgba(255,255,255,0.1)';
                        rrBadge.style.background = 'rgba(255,255,255,0.05)';
                    }
                }
            }
        }
        window.setKeyLevelCount = setKeyLevelCount;

        function toggleKeyLevelStatic() {
            window.keyLevelShowStatic = !window.keyLevelShowStatic;
            localStorage.setItem('keylevel_show_static', window.keyLevelShowStatic ? 'true' : 'false');
            updateKeyLevelButtons();
            if (window.isKeyLevelOn) {
                clearKeyLevelOverlays(chart1);
                runKeyLevel(chart1);
            }
        }
        window.toggleKeyLevelStatic = toggleKeyLevelStatic;

        function toggleKeyLevelDynamic() {
            window.keyLevelShowDynamic = !window.keyLevelShowDynamic;
            localStorage.setItem('keylevel_show_dynamic', window.keyLevelShowDynamic ? 'true' : 'false');
            if (window.keyLevelShowDynamic && !window.keyLevelGroup_flow && !window.keyLevelGroup_trend && !window.keyLevelGroup_volatility) {
                window.keyLevelGroup_flow = true;
                window.keyLevelGroup_trend = true;
                window.keyLevelGroup_volatility = true;
                localStorage.setItem('keylevel_group_flow', 'true');
                localStorage.setItem('keylevel_group_trend', 'true');
                localStorage.setItem('keylevel_group_volatility', 'true');
            }
            updateKeyLevelButtons();
            if (window.isKeyLevelOn) {
                clearKeyLevelOverlays(chart1);
                runKeyLevel(chart1);
            }
        }
        window.toggleKeyLevelDynamic = toggleKeyLevelDynamic;

        function toggleKeyLevelHud() {
            window.keyLevelHudVisible = !window.keyLevelHudVisible;
            localStorage.setItem('keylevel_hud_visible', window.keyLevelHudVisible ? 'true' : 'false');
            const hud = document.getElementById('keyLevelHudPanel');
            if (hud) {
                hud.style.display = (window.isKeyLevelOn && window.keyLevelHudVisible) ? 'block' : 'none';
            }
            updateKeyLevelButtons();
        }
        window.toggleKeyLevelHud = toggleKeyLevelHud;

        function toggleKeyLevelHudCollapse() {
            window.keyLevelHudCollapsed = !window.keyLevelHudCollapsed;
            localStorage.setItem('keylevel_hud_collapsed', window.keyLevelHudCollapsed ? 'true' : 'false');
            const body = document.getElementById('keyLevelHudBody');
            const mini = document.getElementById('keyLevelHudMini');
            const btnCollapse = document.getElementById('btnHudCollapse');
            const panel = document.getElementById('keyLevelHudPanel');
            if (body && mini) {
                if (window.keyLevelHudCollapsed) {
                    body.style.display = 'none';
                    mini.style.display = 'block';
                    if (btnCollapse) btnCollapse.innerText = '+';
                    if (panel) panel.style.width = 'auto';
                } else {
                    body.style.display = 'block';
                    mini.style.display = 'none';
                    if (btnCollapse) btnCollapse.innerText = '─';
                    if (panel) panel.style.width = '318px';
                }
            }
        }
        window.toggleKeyLevelHudCollapse = toggleKeyLevelHudCollapse;

        function toggleKeyLevelGroup(grp) {
            if (grp === 'static') {
                window.keyLevelShowStatic = !window.keyLevelShowStatic;
                localStorage.setItem('keylevel_show_static', window.keyLevelShowStatic ? 'true' : 'false');
                updateKeyLevelButtons();
                if (window.isKeyLevelOn) {
                    clearKeyLevelOverlays(chart1);
                    runKeyLevel(chart1);
                }
                return;
            }
            if (grp === 'flow') {
                window.keyLevelGroup_flow = !window.keyLevelGroup_flow;
                localStorage.setItem('keylevel_group_flow', window.keyLevelGroup_flow ? 'true' : 'false');
            } else if (grp === 'trend') {
                window.keyLevelGroup_trend = !window.keyLevelGroup_trend;
                localStorage.setItem('keylevel_group_trend', window.keyLevelGroup_trend ? 'true' : 'false');
            } else if (grp === 'volatility') {
                window.keyLevelGroup_volatility = !window.keyLevelGroup_volatility;
                localStorage.setItem('keylevel_group_volatility', window.keyLevelGroup_volatility ? 'true' : 'false');
            }

            const anyGroupActive = window.keyLevelGroup_flow || window.keyLevelGroup_trend || window.keyLevelGroup_volatility;
            window.keyLevelShowDynamic = anyGroupActive;
            localStorage.setItem('keylevel_show_dynamic', window.keyLevelShowDynamic ? 'true' : 'false');

            updateKeyLevelButtons();
            if (window.isKeyLevelOn) {
                clearKeyLevelOverlays(chart1);
                runKeyLevel(chart1);
            }
        }
        window.toggleKeyLevelGroup = toggleKeyLevelGroup;

        function clearKeyLevelOverlays(targetChart = chart1) {
            if (targetChart) {
                if (targetChart.keyLevelIds) {
                    targetChart.keyLevelIds.forEach(id => {
                        try { targetChart.removeOverlay(id); } catch(e) {}
                    });
                    targetChart.keyLevelIds = [];
                }
                if (targetChart.dynamicKeyLevelIds) {
                    targetChart.dynamicKeyLevelIds.forEach(id => {
                        try { targetChart.removeOverlay(id); } catch(e) {}
                    });
                    targetChart.dynamicKeyLevelIds = [];
                }
                targetChart.renderedStaticLevels = [];
                targetChart.renderedDynamicLevels = [];
            }
        }

        // Kéo thả Bảng HUD (Draggable)
        (function initKeyLevelHudDrag() {
            let isDragging = false;
            let startX, startY, startLeft, startTop;

            document.addEventListener('mousedown', function(e) {
                const header = document.getElementById('keyLevelHudHeader');
                const panel = document.getElementById('keyLevelHudPanel');
                if (!header || !panel) return;

                if (header.contains(e.target) && e.target.tagName !== 'BUTTON') {
                    isDragging = true;
                    startX = e.clientX;
                    startY = e.clientY;
                    const rect = panel.getBoundingClientRect();
                    const parentRect = panel.offsetParent ? panel.offsetParent.getBoundingClientRect() : { left: 0, top: 0 };
                    startLeft = rect.left - parentRect.left;
                    startTop = rect.top - parentRect.top;
                    panel.style.right = 'auto';
                    panel.style.left = startLeft + 'px';
                    panel.style.top = startTop + 'px';
                    e.preventDefault();
                }
            });

            document.addEventListener('mousemove', function(e) {
                if (!isDragging) return;
                const panel = document.getElementById('keyLevelHudPanel');
                if (!panel) return;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                panel.style.left = Math.max(10, startLeft + dx) + 'px';
                panel.style.top = Math.max(30, startTop + dy) + 'px';
            });

            document.addEventListener('mouseup', function() {
                isDragging = false;
            });

            const panel = document.getElementById('keyLevelHudPanel');
            if (panel) {
                ['mousedown', 'mousemove', 'mouseup', 'click', 'wheel', 'touchstart', 'touchend'].forEach(evt => {
                    panel.addEventListener(evt, e => e.stopPropagation());
                });
            }
        })();

                function isKeyLevelLineActive(lineId, groupKey) {
            if (groupKey === 'static' && !window.keyLevelShowStatic) return false;
            if (groupKey === 'flow' && !window.keyLevelGroup_flow) return false;
            if (groupKey === 'trend' && !window.keyLevelGroup_trend) return false;
            if (groupKey === 'volatility' && !window.keyLevelGroup_volatility) return false;
            
            if (window.keyLevelLineStates && window.keyLevelLineStates[lineId] !== undefined) {
                return !!window.keyLevelLineStates[lineId];
            }
            return true;
        }
        window.isKeyLevelLineActive = isKeyLevelLineActive;

        function toggleKeyLevelLine(lineId, groupKey) {
            if (!window.keyLevelLineStates) window.keyLevelLineStates = {};
            let cur = isKeyLevelLineActive(lineId, groupKey);
            window.keyLevelLineStates[lineId] = !cur;
            localStorage.setItem('keylevel_line_states', JSON.stringify(window.keyLevelLineStates));

            if (!cur) {
                if (groupKey === 'static') window.keyLevelShowStatic = true;
                if (groupKey === 'flow') window.keyLevelGroup_flow = true;
                if (groupKey === 'trend') window.keyLevelGroup_trend = true;
                if (groupKey === 'volatility') window.keyLevelGroup_volatility = true;
                window.keyLevelShowDynamic = window.keyLevelGroup_flow || window.keyLevelGroup_trend || window.keyLevelGroup_volatility;
                localStorage.setItem('keylevel_show_static', window.keyLevelShowStatic ? 'true' : 'false');
                localStorage.setItem('keylevel_group_flow', window.keyLevelGroup_flow ? 'true' : 'false');
                localStorage.setItem('keylevel_group_trend', window.keyLevelGroup_trend ? 'true' : 'false');
                localStorage.setItem('keylevel_group_volatility', window.keyLevelGroup_volatility ? 'true' : 'false');
                localStorage.setItem('keylevel_show_dynamic', window.keyLevelShowDynamic ? 'true' : 'false');
                updateKeyLevelButtons();
            }

            if (window.isKeyLevelOn && chart1) {
                clearKeyLevelOverlays(chart1);
                runKeyLevel(chart1);
            }
        }
        window.toggleKeyLevelLine = toggleKeyLevelLine;

        function toggleKeyLevelSection(groupKey) {
            toggleKeyLevelGroup(groupKey);
        }
        window.toggleKeyLevelSection = toggleKeyLevelSection;

        function updateKeyLevelHud(data) {
            window.lastHudData = data;
            const sym = (document.getElementById('currentSymbolDisplay') ? document.getElementById('currentSymbolDisplay').innerText.trim().toUpperCase() : '') || 'CỔ PHIẾU';
            const titleSym = document.getElementById('hudTitleSymbol');
            if (titleSym) titleSym.innerText = `ĐÁNH GIÁ KEY LEVEL`;

            const symBadge = document.getElementById('hudSymBadge');
            if (symBadge) symBadge.innerText = sym;

            const miniText = document.getElementById('hudMiniText');
            if (miniText) miniText.innerText = `🎯 HUD: ${sym} (${data.curPrice.toFixed(2)}) · R:R: ${data.rrRatioStr}`;

            const matrixContent = document.getElementById('hudMatrixContent');
            if (matrixContent) {
                const curP = data.curPrice;

                // Helper to get dynamic insight html
                function getDynTip(dynId, dynName, val, isAvwap) {
                    let dynObj = (data.dynamicLevelObjects || []).find(x => x.id === dynId);
                    if (!dynObj) {
                        dynObj = { id: dynId, name: dynName, val: val, isAvwap: isAvwap };
                    }
                    if (typeof getDynamicLevelInsightHtml === 'function') {
                        return getDynamicLevelInsightHtml(dynObj);
                    }
                    return '';
                }

                // ===== PHẦN 1: MỐC CẢN & ĐỠ TĨNH =====
                let staticActive = !!window.keyLevelShowStatic;
                let staticRowsHtml = '';
                if (data.selRes && data.selRes.length > 0) {
                    data.selRes.forEach((res, rIdx) => {
                        let lineId = `res_${rIdx}`;
                        let isActive = staticActive && isKeyLevelLineActive(lineId, 'static');
                        let dist = (((res.val - curP) / curP) * 100).toFixed(1);
                        let starBadge = res.starStr || '⭐⭐';
                        let tipHtml = typeof getKeyLevelInsightHtml === 'function' ? getKeyLevelInsightHtml(res) : '';
                        let rowStyle = isActive ? 'opacity: 1;' : 'opacity: 0.4; text-decoration: line-through;';
                        staticRowsHtml += `
                            <div class="trend-hud-item" onclick="toggleKeyLevelLine('${lineId}', 'static')" data-tip-text="${encodeURIComponent(tipHtml)}" style="display: flex; justify-content: space-between; align-items: center; padding: 2.5px 4px; cursor: pointer; border-radius: 4px; transition: all 0.15s; ${rowStyle}">
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    <span style="font-size: 9px; color: ${isActive ? '#34d399' : '#64748b'};">${isActive ? '●' : '○'}</span>
                                    <span style="color: #cbd5e1; font-weight: 600;">🛑 ${res.isConfluence ? '🏆 ' : ''}Cản ${rIdx + 1}:</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    <b style="color: #ef4444; font-family: var(--font-mono, monospace);">${res.val.toFixed(2)} (+${dist}%)</b>
                                    <span style="font-size: 9px; color: #fbbf24;">${starBadge}</span>
                                </div>
                            </div>
                        `;
                    });
                }

                if (data.selSup && data.selSup.length > 0) {
                    data.selSup.forEach((sup, sIdx) => {
                        let lineId = `sup_${sIdx}`;
                        let isActive = staticActive && isKeyLevelLineActive(lineId, 'static');
                        let dist = (((curP - sup.val) / curP) * 100).toFixed(1);
                        let starBadge = sup.starStr || '⭐⭐';
                        let tipHtml = typeof getKeyLevelInsightHtml === 'function' ? getKeyLevelInsightHtml(sup) : '';
                        let rowStyle = isActive ? 'opacity: 1;' : 'opacity: 0.4; text-decoration: line-through;';
                        staticRowsHtml += `
                            <div class="trend-hud-item" onclick="toggleKeyLevelLine('${lineId}', 'static')" data-tip-text="${encodeURIComponent(tipHtml)}" style="display: flex; justify-content: space-between; align-items: center; padding: 2.5px 4px; cursor: pointer; border-radius: 4px; transition: all 0.15s; ${rowStyle}">
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    <span style="font-size: 9px; color: ${isActive ? '#34d399' : '#64748b'};">${isActive ? '●' : '○'}</span>
                                    <span style="color: #cbd5e1; font-weight: 600;">🛡️ ${sup.isConfluence ? '🏆 ' : ''}Đỡ ${sIdx + 1}:</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    <b style="color: #10b981; font-family: var(--font-mono, monospace);">${sup.val.toFixed(2)} (-${dist}%)</b>
                                    <span style="font-size: 9px; color: #fbbf24;">${starBadge}</span>
                                </div>
                            </div>
                        `;
                    });
                }

                let rrTipHtml = typeof getKeyLevelRrInsightHtml === 'function' ? getKeyLevelRrInsightHtml() : '';
                let rrRowHtml = `
                    <div class="trend-hud-item" data-tip-text="${encodeURIComponent(rrTipHtml)}" style="display: flex; justify-content: space-between; align-items: center; padding: 2px 4px; cursor: help; border-radius: 4px; transition: background 0.15s; margin-top: 2px;">
                        <span style="color: #94a3b8; font-weight: 600;">⚖️ Tỷ lệ Lợi nhuận/Rủi ro:</span>
                        <b style="color: ${data.rrScore >= 1.8 ? '#34d399' : (data.rrScore >= 1.0 ? '#fbbf24' : '#f87171')}; font-family: var(--font-mono, monospace);">${data.rrRatioStr} (${data.rrScore >= 1.8 ? '🟢 Tối ưu' : (data.rrScore >= 1.0 ? '🟡 Cân bằng' : '🔴 Rủi ro')})</b>
                    </div>
                `;

                // ===== PHẦN 2: GIÁ VỐN TỔ CHỨC (FLOW) =====
                let flowActive = !!window.keyLevelGroup_flow;
                const isAboveAvwapL = curP >= data.avwapLow;
                const diffAvwapL = (((curP - data.avwapLow) / data.avwapLow) * 100).toFixed(1);
                const isAboveAvwapH = curP >= data.avwapHigh;
                const diffAvwapH = (((curP - data.avwapHigh) / data.avwapHigh) * 100).toFixed(1);
                const isAboveYtd = curP >= data.avwapYtd;
                const diffYtd = (((curP - data.avwapYtd) / data.avwapYtd) * 100).toFixed(1);

                let actAvwapL = flowActive && isKeyLevelLineActive('avwap_low', 'flow');
                let actAvwapH = flowActive && isKeyLevelLineActive('avwap_high', 'flow');
                let actAvwapYtd = flowActive && isKeyLevelLineActive('avwap_ytd', 'flow');

                let tipAvwapL = getDynTip('avwap_low', 'AVWAP Neo Đáy (Big Boys)', data.avwapLow, true);
                let tipAvwapH = getDynTip('avwap_high', 'AVWAP Neo Đỉnh (Kẹp Hàng)', data.avwapHigh, true);
                let tipAvwapYtd = getDynTip('avwap_ytd', 'YTD VWAP (Quỹ ETF)', data.avwapYtd, true);

                let flowRowsHtml = `
                    <div class="trend-hud-item" onclick="toggleKeyLevelLine('avwap_low', 'flow')" data-tip-text="${encodeURIComponent(tipAvwapL)}" style="display: flex; justify-content: space-between; align-items: center; padding: 2.5px 4px; cursor: pointer; border-radius: 4px; transition: all 0.15s; ${actAvwapL ? 'opacity: 1;' : 'opacity: 0.4; text-decoration: line-through;'}">
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <span style="font-size: 9px; color: ${actAvwapL ? '#a855f7' : '#64748b'};">${actAvwapL ? '●' : '○'}</span>
                            <span style="color: #c084fc; font-weight: 600;">• AVWAP Neo Đáy (Big Boys):</span>
                        </div>
                        <span style="font-family: var(--font-mono, monospace); font-weight: 700; color: ${isAboveAvwapL ? '#34d399' : '#f87171'};">${data.avwapLow.toFixed(2)} (${isAboveAvwapL ? '+' : ''}${diffAvwapL}%)</span>
                    </div>
                    <div class="trend-hud-item" onclick="toggleKeyLevelLine('avwap_high', 'flow')" data-tip-text="${encodeURIComponent(tipAvwapH)}" style="display: flex; justify-content: space-between; align-items: center; padding: 2.5px 4px; cursor: pointer; border-radius: 4px; transition: all 0.15s; ${actAvwapH ? 'opacity: 1;' : 'opacity: 0.4; text-decoration: line-through;'}">
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <span style="font-size: 9px; color: ${actAvwapH ? '#f43f5e' : '#64748b'};">${actAvwapH ? '●' : '○'}</span>
                            <span style="color: #f43f5e; font-weight: 600;">• AVWAP Neo Đỉnh (Kẹp Hàng):</span>
                        </div>
                        <span style="font-family: var(--font-mono, monospace); font-weight: 700; color: #f43f5e;">${data.avwapHigh.toFixed(2)} (${isAboveAvwapH ? '+' : ''}${diffAvwapH}%)</span>
                    </div>
                    <div class="trend-hud-item" onclick="toggleKeyLevelLine('avwap_ytd', 'flow')" data-tip-text="${encodeURIComponent(tipAvwapYtd)}" style="display: flex; justify-content: space-between; align-items: center; padding: 2.5px 4px; cursor: pointer; border-radius: 4px; transition: all 0.15s; ${actAvwapYtd ? 'opacity: 1;' : 'opacity: 0.4; text-decoration: line-through;'}">
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <span style="font-size: 9px; color: ${actAvwapYtd ? '#38bdf8' : '#64748b'};">${actAvwapYtd ? '●' : '○'}</span>
                            <span style="color: #38bdf8; font-weight: 600;">• YTD VWAP (Quỹ ETF):</span>
                        </div>
                        <span style="font-family: var(--font-mono, monospace); font-weight: 700; color: ${isAboveYtd ? '#34d399' : '#f87171'};">${data.avwapYtd.toFixed(2)} (${isAboveYtd ? '+' : ''}${diffYtd}%)</span>
                    </div>
                `;

                // ===== PHẦN 3: BỆ ĐỠ XU HƯỚNG (TREND) =====
                let trendActive = !!window.keyLevelGroup_trend;
                const isAboveEma20 = curP >= data.curEma20;
                const isAboveEma50 = curP >= data.curEma50;
                const isAboveEma89 = curP >= data.curEma89;
                const isAboveEma200 = curP >= data.curEma200;

                let actEma20 = trendActive && isKeyLevelLineActive('ema20', 'trend');
                let actEma50 = trendActive && isKeyLevelLineActive('ema50', 'trend');
                let actEma89 = trendActive && isKeyLevelLineActive('ema89', 'trend');
                let actEma200 = trendActive && isKeyLevelLineActive('ema200', 'trend');

                let tipEma20 = getDynTip('ema20', 'EMA 20 Ngày', data.curEma20, false);
                let tipEma50 = getDynTip('ema50', 'EMA 50 Ngày', data.curEma50, false);
                let tipEma89 = getDynTip('ema89', 'EMA 89 Ngày', data.curEma89, false);
                let tipEma200 = getDynTip('ema200', 'EMA 200 Ngày', data.curEma200, false);

                let trendRowsHtml = `
                    <div class="trend-hud-item" onclick="toggleKeyLevelLine('ema20', 'trend')" data-tip-text="${encodeURIComponent(tipEma20)}" style="display: flex; justify-content: space-between; align-items: center; padding: 2.5px 4px; cursor: pointer; border-radius: 4px; transition: all 0.15s; ${actEma20 ? 'opacity: 1;' : 'opacity: 0.4; text-decoration: line-through;'}">
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <span style="font-size: 9px; color: ${actEma20 ? '#06b6d4' : '#64748b'};">${actEma20 ? '●' : '○'}</span>
                            <span style="color: #06b6d4; font-weight: 600;">• EMA 20 (Ngắn hạn):</span>
                        </div>
                        <span style="font-family: var(--font-mono, monospace); font-weight: 700; color: ${isAboveEma20 ? '#34d399' : '#f87171'};">${data.curEma20.toFixed(2)} (${isAboveEma20 ? '▲ Tăng tốc' : '▼ Chỉnh'})</span>
                    </div>
                    <div class="trend-hud-item" onclick="toggleKeyLevelLine('ema50', 'trend')" data-tip-text="${encodeURIComponent(tipEma50)}" style="display: flex; justify-content: space-between; align-items: center; padding: 2.5px 4px; cursor: pointer; border-radius: 4px; transition: all 0.15s; ${actEma50 ? 'opacity: 1;' : 'opacity: 0.4; text-decoration: line-through;'}">
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <span style="font-size: 9px; color: ${actEma50 ? '#fbbf24' : '#64748b'};">${actEma50 ? '●' : '○'}</span>
                            <span style="color: #fbbf24; font-weight: 600;">• EMA 50 (Sóng Quỹ 10 tuần):</span>
                        </div>
                        <span style="font-family: var(--font-mono, monospace); font-weight: 700; color: ${isAboveEma50 ? '#34d399' : '#f87171'};">${data.curEma50.toFixed(2)} (${isAboveEma50 ? '▲ Sóng khỏe' : '▼ Dưới vốn'})</span>
                    </div>
                    <div class="trend-hud-item" onclick="toggleKeyLevelLine('ema89', 'trend')" data-tip-text="${encodeURIComponent(tipEma89)}" style="display: flex; justify-content: space-between; align-items: center; padding: 2.5px 4px; cursor: pointer; border-radius: 4px; transition: all 0.15s; ${actEma89 ? 'opacity: 1;' : 'opacity: 0.4; text-decoration: line-through;'}">
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <span style="font-size: 9px; color: ${actEma89 ? '#f97316' : '#64748b'};">${actEma89 ? '●' : '○'}</span>
                            <span style="color: #f97316; font-weight: 600;">• EMA 89 (Sóng Fibonacci):</span>
                        </div>
                        <span style="font-family: var(--font-mono, monospace); font-weight: 700; color: ${isAboveEma89 ? '#34d399' : '#f87171'};">${data.curEma89.toFixed(2)} (${isAboveEma89 ? '▲ Tốt' : '▼ Yếu'})</span>
                    </div>
                    <div class="trend-hud-item" onclick="toggleKeyLevelLine('ema200', 'trend')" data-tip-text="${encodeURIComponent(tipEma200)}" style="display: flex; justify-content: space-between; align-items: center; padding: 2.5px 4px; cursor: pointer; border-radius: 4px; transition: all 0.15s; ${actEma200 ? 'opacity: 1;' : 'opacity: 0.4; text-decoration: line-through;'}">
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <span style="font-size: 9px; color: ${actEma200 ? '#ef4444' : '#64748b'};">${actEma200 ? '●' : '○'}</span>
                            <span style="color: #ef4444; font-weight: 600;">• EMA 200 (Dài hạn 1 Năm):</span>
                        </div>
                        <span style="font-family: var(--font-mono, monospace); font-weight: 700; color: ${isAboveEma200 ? '#34d399' : '#f87171'};">${data.curEma200.toFixed(2)} (${isAboveEma200 ? '🏆 BULL' : '🐻 BEAR'})</span>
                    </div>
                `;

                // ===== PHẦN 4: BIẾN ĐỘNG & CÂN BẰNG (VOLATILITY) =====
                let volActive = !!window.keyLevelGroup_volatility;
                let actBollU = volActive && isKeyLevelLineActive('boll_upper', 'volatility');
                let actBollL = volActive && isKeyLevelLineActive('boll_lower', 'volatility');
                let actKijun = volActive && isKeyLevelLineActive('kijun26', 'volatility');

                let tipBollU = getDynTip('boll_upper', 'Bollinger Band Trên (+2σ)', data.curBollUpper, false);
                let tipBollL = getDynTip('boll_lower', 'Bollinger Band Dưới (-2σ)', data.curBollLower, false);
                let tipKijun = getDynTip('kijun26', 'Kijun-sen 26 Phiên', data.curKijun26, false);

                let volRowsHtml = `
                    <div class="trend-hud-item" onclick="toggleKeyLevelLine('boll_upper', 'volatility')" data-tip-text="${encodeURIComponent(tipBollU)}" style="display: flex; justify-content: space-between; align-items: center; padding: 2.5px 4px; cursor: pointer; border-radius: 4px; transition: all 0.15s; ${actBollU ? 'opacity: 1;' : 'opacity: 0.4; text-decoration: line-through;'}">
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <span style="font-size: 9px; color: ${actBollU ? '#06b6d4' : '#64748b'};">${actBollU ? '●' : '○'}</span>
                            <span style="color: #06b6d4; font-weight: 600;">• Bollinger Band Trên (+2σ):</span>
                        </div>
                        <b style="color: #06b6d4; font-family: var(--font-mono, monospace);">${data.curBollUpper.toFixed(2)}</b>
                    </div>
                    <div class="trend-hud-item" onclick="toggleKeyLevelLine('boll_lower', 'volatility')" data-tip-text="${encodeURIComponent(tipBollL)}" style="display: flex; justify-content: space-between; align-items: center; padding: 2.5px 4px; cursor: pointer; border-radius: 4px; transition: all 0.15s; ${actBollL ? 'opacity: 1;' : 'opacity: 0.4; text-decoration: line-through;'}">
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <span style="font-size: 9px; color: ${actBollL ? '#818cf8' : '#64748b'};">${actBollL ? '●' : '○'}</span>
                            <span style="color: #818cf8; font-weight: 600;">• Bollinger Band Dưới (-2σ):</span>
                        </div>
                        <b style="color: #818cf8; font-family: var(--font-mono, monospace);">${data.curBollLower.toFixed(2)}</b>
                    </div>
                    <div class="trend-hud-item" onclick="toggleKeyLevelLine('kijun26', 'volatility')" data-tip-text="${encodeURIComponent(tipKijun)}" style="display: flex; justify-content: space-between; align-items: center; padding: 2.5px 4px; cursor: pointer; border-radius: 4px; transition: all 0.15s; ${actKijun ? 'opacity: 1;' : 'opacity: 0.4; text-decoration: line-through;'}">
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <span style="font-size: 9px; color: ${actKijun ? '#10b981' : '#64748b'};">${actKijun ? '●' : '○'}</span>
                            <span style="color: #10b981; font-weight: 600;">• Kijun-sen 26 (Á Đông):</span>
                        </div>
                        <b style="color: #10b981; font-family: var(--font-mono, monospace);">${data.curKijun26.toFixed(2)}</b>
                    </div>
                `;

                // ===== PHẦN 5: TỬ HUYỆT HỘI TỤ VÀNG =====
                function getConfTipHtml(staticVal, dynName, diffPct) {
                    const dist = curP > 0 ? (((staticVal - curP) / curP) * 100).toFixed(1) : '0.0';
                    const isRes = staticVal >= curP;
                    return `
                        <div style="padding: 6px 4px; max-width: 330px; line-height: 1.45; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 5px;">
                                <div style="font-size: 12px; font-weight: 800; color: #fbbf24; display: flex; align-items: center; gap: 5px;">
                                    <span>🏆</span> <b>[VÙNG HỘI TỤ VÀNG] Mốc: ${staticVal.toFixed(2)}</b>
                                </div>
                                <span style="font-size: 10px; font-weight: 700; color: #fbbf24;">⭐⭐⭐ TỬ HUYỆT</span>
                            </div>
                            <div style="font-size: 10.5px; color: #94a3b8; margin-bottom: 5px;">
                                📊 Hội tụ giữa <b>${isRes ? 'Cản' : 'Đỡ'} Tĩnh</b> và <b>${dynName}</b> (Cách giá hiện tại: <b>${dist >= 0 ? '+' : ''}${dist}%</b>, chênh lệch: <b>Δ ${diffPct}%</b>).
                            </div>
                            <div style="font-size: 11px; color: #f1f5f9; font-weight: 600; margin-bottom: 4px;">
                                🧠 <b>Tâm lý Cung Cầu:</b>
                            </div>
                            <div style="font-size: 10.5px; color: #cbd5e1; margin-bottom: 6px;">
                                ${isRes 
                                    ? `Bệ cản <b>HỘI TỤ VÀNG (${staticVal.toFixed(2)})</b> là nơi hợp lưu giữa lượng cung kẹp hàng cũ và cản động tổ chức. Phe bán sẽ kích hoạt lệnh chốt lời rất mạnh.` 
                                    : `Bệ đỡ <b>HỘI TỤ VÀNG (${staticVal.toFixed(2)})</b> là điểm tựa vững chắc nhất của cổ phiếu. Lực cầu bắt đáy và dòng tiền tạo lập có xu hướng đồng thuận bảo vệ mốc này.`}
                            </div>
                            <div style="font-size: 10.5px; color: #38bdf8; background: rgba(56,189,248,0.1); border-left: 2.5px solid #38bdf8; padding: 4px 6px; border-radius: 2px;">
                                💡 <b>Khuyến nghị Thực chiến:</b> ${isRes ? `🎯 <b>MỤC TIÊU CHỐT LỜI TỐI ƯU.</b> Không mua đuổi khi giá chạm ${staticVal.toFixed(2)}.` : `🛡️ <b>ĐIỂM MUA GOM AN TOÀN TUYỆT ĐỐI (Pullback).</b> Mở mua khi giá test lại ${staticVal.toFixed(2)} kèm Vol cạn kiệt.`}
                            </div>
                        </div>
                    `;
                }

                let confRowsHtml = '';
                if (data.confluenceZones && data.confluenceZones.length > 0) {
                    data.confluenceZones.forEach((cz, czIdx) => {
                        let confTip = getConfTipHtml(cz.staticVal, cz.dynName, cz.diffPct.toFixed(1));
                        confRowsHtml += `
                            <div class="trend-hud-item" data-tip-text="${encodeURIComponent(confTip)}" style="display: flex; justify-content: space-between; align-items: center; padding: 2.5px 4px; cursor: help; border-radius: 4px; transition: background 0.15s;">
                                <span style="color: #fbbf24; font-weight: 700;">🏆 Hội Tụ: ${cz.staticVal.toFixed(2)}</span>
                                <span style="font-size: 10px; color: #cbd5e1;">${cz.dynName} (Δ ${cz.diffPct.toFixed(1)}%)</span>
                            </div>
                        `;
                    });
                } else {
                    confRowsHtml = `
                        <div style="font-size: 10px; color: #94a3b8; padding: 2px 4px;">
                            Hiện tại chưa có điểm giao nhau <= 1.5% giữa Mốc Tĩnh và Mốc Động.
                        </div>
                    `;
                }

                matrixContent.innerHTML = `
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        <!-- SECTION 1: CẢN & ĐỠ TĨNH -->
                        <div>
                            <div onclick="toggleKeyLevelSection('static')" style="font-size: 9.5px; font-weight: 700; color: #fbbf24; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px; border-bottom: 1px solid rgba(251,191,36,0.25); padding-bottom: 2px; display: flex; justify-content: space-between; cursor: pointer;" title="Nhấp để bật/tắt toàn bộ Mốc Tĩnh">
                                <span>🟡 MỐC CẢN & ĐỠ TĨNH ${staticActive ? '🟢 [BẬT]' : '⚪ [TẮT]'}</span>
                                <span style="font-size: 9px; color: #94a3b8;">${(data.selRes ? data.selRes.length : 0) + (data.selSup ? data.selSup.length : 0)} Mốc</span>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 2px;">
                                ${staticRowsHtml}
                                ${rrRowHtml}
                            </div>
                        </div>

                        <!-- SECTION 2: GIÁ VỐN TỔ CHỨC -->
                        <div>
                            <div onclick="toggleKeyLevelSection('flow')" style="font-size: 9.5px; font-weight: 700; color: #c084fc; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px; border-bottom: 1px solid rgba(192,132,252,0.25); padding-bottom: 2px; display: flex; justify-content: space-between; cursor: pointer;" title="Nhấp để bật/tắt nhóm Giá Vốn">
                                <span>🟣 GIÁ VỐN BIG BOYS (FLOW) ${flowActive ? '🟢 [BẬT]' : '⚪ [TẮT]'}</span>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 2px;">
                                ${flowRowsHtml}
                            </div>
                        </div>

                        <!-- SECTION 3: BỆ ĐỠ XU HƯỚNG -->
                        <div>
                            <div onclick="toggleKeyLevelSection('trend')" style="font-size: 9.5px; font-weight: 700; color: #34d399; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px; border-bottom: 1px solid rgba(52,211,153,0.25); padding-bottom: 2px; display: flex; justify-content: space-between; cursor: pointer;" title="Nhấp để bật/tắt nhóm Xu Hướng">
                                <span>🟢 BỆ ĐỠ XU HƯỚNG (EMA) ${trendActive ? '🟢 [BẬT]' : '⚪ [TẮT]'}</span>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 2px;">
                                ${trendRowsHtml}
                            </div>
                        </div>

                        <!-- SECTION 4: BIẾN ĐỘNG & CÂN BẰNG -->
                        <div>
                            <div onclick="toggleKeyLevelSection('volatility')" style="font-size: 9.5px; font-weight: 700; color: #38bdf8; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px; border-bottom: 1px solid rgba(56,189,248,0.25); padding-bottom: 2px; display: flex; justify-content: space-between; cursor: pointer;" title="Nhấp để bật/tắt nhóm Biến Động">
                                <span>🔵 BIẾN ĐỘNG & CÂN BẰNG ${volActive ? '🟢 [BẬT]' : '⚪ [TẮT]'}</span>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 2px;">
                                ${volRowsHtml}
                            </div>
                        </div>

                        <!-- SECTION 5: TỬ HUYỆT HỘI TỤ VÀNG -->
                        <div>
                            <div style="font-size: 9.5px; font-weight: 700; color: #fbbf24; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px; border-bottom: 1px solid rgba(251,191,36,0.25); padding-bottom: 2px;">
                                <span>🏆 TỬ HUYỆT HỘI TỤ VÀNG</span>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 2px;">
                                ${confRowsHtml}
                            </div>
                        </div>
                    </div>
                `;
            }

            const actionTip = document.getElementById('hudActionTip');
            if (actionTip) {
                let c1Val = data.c1 ? data.c1.val : data.curPrice * 1.08;
                let s1Val = data.s1 ? data.s1.val : data.curPrice * 0.95;
                let buyMin = s1Val;
                let buyMax = Math.max(s1Val * 1.01, data.curPrice <= s1Val ? s1Val * 1.01 : data.curPrice);
                if (buyMax > c1Val) buyMax = data.curPrice;
                let stoploss = s1Val * 0.985;
                let potProfit = (((c1Val - data.curPrice) / data.curPrice) * 100).toFixed(1);

                if (data.rrScore >= 1.8) {
                    actionTip.innerHTML = `🟢 <b>VỊ THẾ TỐI ƯU (R:R = ${data.rrScore.toFixed(1)}):</b> Vùng mua gom: <b>[${buyMin.toFixed(2)} ↔ ${buyMax.toFixed(2)}]</b> · Target: <b>${c1Val.toFixed(2)} (+${potProfit}%)</b> · Cắt lỗ: <b>&lt; ${stoploss.toFixed(2)}</b>.`;
                } else if (data.rrScore >= 1.0) {
                    actionTip.innerHTML = `🟡 <b>VỊ THẾ TRUNG TÍNH (R:R = ${data.rrScore.toFixed(1)}):</b> Thăm dò nhỏ tại <b>${data.curPrice.toFixed(2)}</b>. Chờ chỉnh về vùng gom <b>[${buyMin.toFixed(2)} ↔ ${(s1Val*1.01).toFixed(2)}]</b> để gom đủ. Target: <b>${c1Val.toFixed(2)}</b>.`;
                } else {
                    actionTip.innerHTML = `🔴 <b>RỦI RO CAO (R:R = ${data.rrScore.toFixed(1)}):</b> Sát cản <b>${c1Val.toFixed(2)}</b>. Tuyệt đối không mua đuổi, canh chốt lời và chờ nhịp rũ về <b>[${buyMin.toFixed(2)} ↔ ${(s1Val*1.01).toFixed(2)}]</b>.`;
                }
            }
        }
        function showHudSpecificStaticHover(e, el) {
            let jsonRaw = el.getAttribute('data-level-obj');
            if (jsonRaw) {
                try {
                    let lvl = JSON.parse(decodeURIComponent(jsonRaw));
                    let html = getKeyLevelInsightHtml(lvl);
                    if (html) showTrendTip(e, html);
                } catch(err) {}
            }
        }
        window.showHudSpecificStaticHover = showHudSpecificStaticHover;
function runKeyLevel(targetChart = chart1) {
            if (!targetChart || !targetChart.getDataList) return;
            const dataList = targetChart.getDataList();
            if (!dataList || dataList.length < 5) return;

            const len = dataList.length;
            const lastBar = dataList[len - 1];
            const currentPrice = lastBar.close;
            const startTs = dataList[0].timestamp;
            const avgInterval = len > 1 ? (dataList[len - 1].timestamp - dataList[0].timestamp) / (len - 1) : 86400000;
            const futureTs = lastBar.timestamp + 30 * avgInterval;

            const showStatic = !!window.keyLevelShowStatic && window.keyLevelCount !== 'none';
            const showDynamic = !!window.keyLevelShowDynamic && window.keyLevelCount !== 'none';
            const showGroupFlow = showDynamic && !!window.keyLevelGroup_flow;
            const showGroupTrend = showDynamic && !!window.keyLevelGroup_trend;
            const showGroupVol = showDynamic && !!window.keyLevelGroup_volatility;

            // 1. TÍNH TOÁN CÁC ĐƯỜNG ĐỘNG (GOM NHÓM CHIẾN LƯỢC)
            const closes = dataList.map(d => d.close);

            // A. Nhóm Xu hướng (EMA Series)
            function calcEmaSeries(arr, span) {
                let ema = [arr[0]];
                let alpha = 2.0 / (span + 1.0);
                for (let i = 1; i < arr.length; i++) {
                    ema.push(arr[i] * alpha + ema[i-1] * (1.0 - alpha));
                }
                return ema;
            }
            let ema20Series = calcEmaSeries(closes, 20);
            let ema50Series = calcEmaSeries(closes, 50);
            let ema89Series = calcEmaSeries(closes, Math.min(89, Math.max(20, len - 5)));
            let ema200Series = calcEmaSeries(closes, Math.min(200, Math.max(50, len - 5)));

            let curEma20 = ema20Series[len - 1];
            let curEma50 = ema50Series[len - 1];
            let curEma89 = ema89Series[len - 1];
            let curEma200 = ema200Series[len - 1];

            // B. Nhóm Giá vốn Big Boys (AVWAP Đáy, Đỉnh, YTD)
            let anchorLowIdx = len - 1;
            let minLowVal = dataList[len - 1].low;
            for (let i = len - 1; i >= Math.max(0, len - 60); i--) {
                if (dataList[i].low < minLowVal) {
                    minLowVal = dataList[i].low;
                    anchorLowIdx = i;
                }
            }
            let cumPvL = 0, cumVL = 0;
            let avwapLowSeries = [];
            for (let i = anchorLowIdx; i < len; i++) {
                let tp = (dataList[i].high + dataList[i].low + dataList[i].close) / 3.0;
                let v = dataList[i].volume || 1;
                cumPvL += tp * v;
                cumVL += v;
                avwapLowSeries.push({ ts: dataList[i].timestamp, val: cumPvL / cumVL });
            }
            let curAvwapLow = avwapLowSeries.length > 0 ? avwapLowSeries[avwapLowSeries.length - 1].val : currentPrice;

            let anchorHighIdx = len - 1;
            let maxHighVal = dataList[len - 1].high;
            for (let i = len - 1; i >= Math.max(0, len - 90); i--) {
                if (dataList[i].high > maxHighVal) {
                    maxHighVal = dataList[i].high;
                    anchorHighIdx = i;
                }
            }
            let cumPvH = 0, cumVH = 0;
            let avwapHighSeries = [];
            for (let i = anchorHighIdx; i < len; i++) {
                let tp = (dataList[i].high + dataList[i].low + dataList[i].close) / 3.0;
                let v = dataList[i].volume || 1;
                cumPvH += tp * v;
                cumVH += v;
                avwapHighSeries.push({ ts: dataList[i].timestamp, val: cumPvH / cumVH });
            }
            let curAvwapHigh = avwapHighSeries.length > 0 ? avwapHighSeries[avwapHighSeries.length - 1].val : currentPrice;

            // YTD VWAP
            let curYear = new Date(dataList[len - 1].timestamp).getFullYear();
            let ytdIdx = 0;
            for (let i = 0; i < len; i++) {
                if (new Date(dataList[i].timestamp).getFullYear() === curYear) {
                    ytdIdx = i;
                    break;
                }
            }
            let cumPvYtd = 0, cumVYtd = 0;
            let avwapYtdSeries = [];
            for (let i = ytdIdx; i < len; i++) {
                let tp = (dataList[i].high + dataList[i].low + dataList[i].close) / 3.0;
                let v = dataList[i].volume || 1;
                cumPvYtd += tp * v;
                cumVYtd += v;
                avwapYtdSeries.push({ ts: dataList[i].timestamp, val: cumPvYtd / cumVYtd });
            }
            let curAvwapYtd = avwapYtdSeries.length > 0 ? avwapYtdSeries[avwapYtdSeries.length - 1].val : currentPrice;

            // C. Nhóm Biến động & Cân bằng (Bollinger Bands, Kijun-sen)
            let bollUpperSeries = [], bollLowerSeries = [];
            for (let i = 0; i < len; i++) {
                if (i < 19) {
                    bollUpperSeries.push(closes[i]);
                    bollLowerSeries.push(closes[i]);
                } else {
                    let slice20 = closes.slice(i - 19, i + 1);
                    let sma = slice20.reduce((a, b) => a + b, 0) / 20.0;
                    let variance = slice20.reduce((a, b) => a + Math.pow(b - sma, 2), 0) / 20.0;
                    let stdDev = Math.sqrt(variance);
                    bollUpperSeries.push(sma + 2.0 * stdDev);
                    bollLowerSeries.push(sma - 2.0 * stdDev);
                }
            }
            let curBollUpper = bollUpperSeries[len - 1];
            let curBollLower = bollLowerSeries[len - 1];

            let slice26 = dataList.slice(Math.max(0, len - 26));
            let high26 = Math.max(...slice26.map(d => d.high));
            let low26 = Math.min(...slice26.map(d => d.low));
            let curKijun26 = (high26 + low26) / 2.0;
            let kijunSeries = [];
            for (let i = 0; i < len; i++) {
                let s = dataList.slice(Math.max(0, i - 25), i + 1);
                let h = Math.max(...s.map(d => d.high));
                let l = Math.min(...s.map(d => d.low));
                kijunSeries.push((h + l) / 2.0);
            }

            // GOM CÁC ĐƯỜNG ĐỘNG
            let dynamicLevelObjects = [
                { id: 'avwap_low', group: 'flow', name: 'Anchored VWAP Neo Đáy', val: curAvwapLow, role: 'Giá Vốn Big Boys Gom Hàng', series: avwapLowSeries, isAvwap: true, anchorIdx: anchorLowIdx, color: '#a855f7', stars: '⭐⭐⭐', starNum: 3 },
                { id: 'avwap_high', group: 'flow', name: 'Anchored VWAP Neo Đỉnh', val: curAvwapHigh, role: 'Giá Vốn Kẹp Hàng Đu Đỉnh', series: avwapHighSeries, isAvwap: true, anchorIdx: anchorHighIdx, color: '#f43f5e', stars: '⭐⭐⭐', starNum: 3 },
                { id: 'avwap_ytd', group: 'flow', name: 'YTD VWAP', val: curAvwapYtd, role: 'Giá Vốn Quỹ ETF Từ Đầu Năm', series: avwapYtdSeries, isAvwap: true, anchorIdx: ytdIdx, color: '#38bdf8', stars: '⭐⭐', starNum: 2 },
                
                { id: 'ema20', group: 'trend', name: 'EMA 20 Ngày', val: curEma20, role: 'Đỡ Tăng Tốc Ngắn Hạn', series: ema20Series, color: '#06b6d4', stars: '⭐⭐', starNum: 2 },
                { id: 'ema50', group: 'trend', name: 'EMA 50 Ngày', val: curEma50, role: 'Chi Phí Vốn Quỹ Đầu Tư', series: ema50Series, color: '#fbbf24', stars: '⭐⭐⭐', starNum: 3 },
                { id: 'ema89', group: 'trend', name: 'EMA 89 Ngày', val: curEma89, role: 'Bệ Đỡ Sóng Fibonacci', series: ema89Series, color: '#f97316', stars: '⭐⭐', starNum: 2 },
                { id: 'ema200', group: 'trend', name: 'EMA 200 Ngày', val: curEma200, role: 'Ranh Giới Bull / Bear', series: ema200Series, color: '#e11d48', stars: '⭐⭐⭐', starNum: 3 },

                { id: 'boll_upper', group: 'volatility', name: 'Bollinger Band Trên (2σ)', val: curBollUpper, role: 'Cản Quá Mua Biến Động', series: bollUpperSeries, color: '#06b6d4', stars: '⭐⭐', starNum: 2 },
                { id: 'boll_lower', group: 'volatility', name: 'Bollinger Band Dưới (-2σ)', val: curBollLower, role: 'Đỡ Quá Bán Biến Động', series: bollLowerSeries, color: '#818cf8', stars: '⭐⭐', starNum: 2 },
                { id: 'kijun26', group: 'volatility', name: 'Kijun-sen 26 Phiên', val: curKijun26, role: 'Nam Châm Hút Giá Cân Bằng', series: kijunSeries, color: '#10b981', stars: '⭐⭐⭐', starNum: 3 }
            ];

            // 2. TÍNH TOÁN CÁC MỐC TĨNH (STATIC PIVOTS & CLUSTERS)
            let pivotWindow = Math.max(3, Math.min(18, Math.floor(len / 10)));
            let rawPivots = [];
            for (let i = pivotWindow; i < len - pivotWindow; i++) {
                let isHigh = true, isLow = true;
                for (let j = i - pivotWindow; j <= i + pivotWindow; j++) {
                    if (i === j) continue;
                    if (dataList[j].high > dataList[i].high) isHigh = false;
                    if (dataList[j].low < dataList[i].low) isLow = false;
                }
                if (isHigh) rawPivots.push({ val: dataList[i].high, ts: dataList[i].timestamp, idx: i, type: 'HIGH', vol: dataList[i].volume || 0 });
                if (isLow) rawPivots.push({ val: dataList[i].low, ts: dataList[i].timestamp, idx: i, type: 'LOW', vol: dataList[i].volume || 0 });
            }

            let recentSlice = dataList.slice(Math.max(0, len - 150));
            let absHigh = recentSlice.reduce((m, b) => b.high > m.high ? b : m, recentSlice[0]);
            let absLow = recentSlice.reduce((m, b) => b.low < m.low ? b : m, recentSlice[0]);
            if (absHigh) rawPivots.push({ val: absHigh.high, ts: absHigh.timestamp, idx: len - 1, type: 'HIGH', vol: absHigh.volume || 0, isAbs: true });
            if (absLow) rawPivots.push({ val: absLow.low, ts: absLow.timestamp, idx: len - 1, type: 'LOW', vol: absLow.volume || 0, isAbs: true });

            let clusters = [];
            rawPivots.forEach(p => {
                let matched = clusters.find(c => Math.abs(c.val - p.val) / c.val < 0.018);
                if (matched) {
                    matched.val = (matched.val * matched.count + p.val) / (matched.count + 1);
                    matched.minVal = Math.min(matched.minVal, p.val);
                    matched.maxVal = Math.max(matched.maxVal, p.val);
                    matched.count++;
                    matched.totalVol += (p.vol || 0);
                    matched.pivots.push(p);
                    matched.ts = Math.min(matched.ts, p.ts);
                } else {
                    clusters.push({
                        val: p.val, minVal: p.val, maxVal: p.val, count: 1, totalVol: p.vol || 0,
                        pivots: [p], ts: p.ts, isAbs: !!p.isAbs
                    });
                }
            });

            let maxVol = Math.max(...clusters.map(c => c.totalVol), 1);
            clusters.forEach(c => {
                let touchScore = Math.min(c.count, 5) * 20;
                let volScore = (c.totalVol / maxVol) * 40;
                let absBonus = c.isAbs ? 30 : 0;
                c.score = touchScore + volScore + absBonus;
                c.stars = c.score >= 70 ? 3 : (c.score >= 40 ? 2 : 1);
                c.starStr = '⭐'.repeat(c.stars);
                c.type = c.val > currentPrice ? 'RESISTANCE' : 'SUPPORT';
            });

            let resistances = clusters.filter(c => c.type === 'RESISTANCE').sort((a, b) => a.val - b.val);
            let supports = clusters.filter(c => c.type === 'SUPPORT').sort((a, b) => b.val - a.val);

            // ATH / ATL Fallback
            if (resistances.length < 3) {
                let recentLowVal = absLow ? absLow.low : currentPrice * 0.85;
                let waveDiff = currentPrice - recentLowVal;
                if (waveDiff <= 0) waveDiff = currentPrice * 0.15;
                [1.272, 1.618, 2.618].forEach((fib, fIdx) => {
                    let fibVal = recentLowVal + waveDiff * fib;
                    if (fibVal > currentPrice && !resistances.some(r => Math.abs(r.val - fibVal) / fibVal < 0.02)) {
                        resistances.push({
                            val: fibVal, minVal: fibVal * 0.997, maxVal: fibVal * 1.003, count: 1, totalVol: 0, pivots: [],
                            ts: lastBar.timestamp, score: 80 - fIdx * 10, stars: fIdx === 0 ? 3 : 2, starStr: fIdx === 0 ? '⭐⭐⭐' : '⭐⭐',
                            type: 'RESISTANCE', isFibAth: true, fibName: `Fib Ext ${fib}`
                        });
                    }
                });
                resistances.sort((a, b) => a.val - b.val);
            }

            if (supports.length < 3) {
                [0.95, 0.90, 0.82].forEach((pct, pIdx) => {
                    let roundVal = Math.floor(currentPrice * pct);
                    if (roundVal > 0 && !supports.some(s => Math.abs(s.val - roundVal) / roundVal < 0.02)) {
                        supports.push({
                            val: roundVal, minVal: roundVal * 0.997, maxVal: roundVal * 1.003, count: 1, totalVol: 0, pivots: [],
                            ts: lastBar.timestamp, score: 70 - pIdx * 10, stars: pIdx === 0 ? 3 : 2, starStr: pIdx === 0 ? '⭐⭐⭐' : '⭐⭐',
                            type: 'SUPPORT', isAtl: true
                        });
                    }
                });
                supports.sort((a, b) => b.val - a.val);
            }

            let targetN = window.keyLevelCount === 'all' ? 12 : (parseInt(window.keyLevelCount) || 3);
            let selRes = resistances.slice(0, targetN);
            let selSup = supports.slice(0, targetN);
            let allStaticLevels = [...selRes, ...selSup];

            // 3. QUÉT MA TRẬN HỘI TỤ VÀNG (CONFLUENCE MATRIX <= 1.5%)
            let confluenceZones = [];
            allStaticLevels.forEach(sl => {
                dynamicLevelObjects.forEach(dl => {
                    let diffPct = Math.abs(sl.val - dl.val) / sl.val * 100;
                    if (diffPct <= 1.5) {
                        sl.isConfluence = true;
                        sl.confluencePartner = dl;
                        confluenceZones.push({
                            staticVal: sl.val,
                            dynVal: dl.val,
                            dynName: dl.name,
                            dynRole: dl.role,
                            diffPct: diffPct,
                            type: sl.type,
                            tierLabel: sl.tierLabel
                        });
                    }
                });
            });

            // 4. TÍNH TOÁN R:R VÀ CẬP NHẬT BADGE
            let c1 = selRes[0];
            let s1 = selSup[0];
            let rrRatioStr = '--';
            let rrScore = 1.0;
            if (c1 && s1 && currentPrice > s1.val && c1.val > currentPrice) {
                let potProfit = ((c1.val - currentPrice) / currentPrice) * 100;
                let potRisk = ((currentPrice - s1.val) / currentPrice) * 100;
                if (potRisk > 0) {
                    rrScore = potProfit / potRisk;
                    rrRatioStr = `R:R: ${rrScore.toFixed(1)}`;
                }
            }
            const rrBadge = document.getElementById('keyLevelRrBadge');
            if (rrBadge) {
                rrBadge.innerText = rrRatioStr;
                if (rrScore >= 1.8) {
                    rrBadge.style.color = '#34d399';
                    rrBadge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                    rrBadge.style.background = 'rgba(16, 185, 129, 0.15)';
                } else if (rrScore >= 1.0) {
                    rrBadge.style.color = '#fbbf24';
                    rrBadge.style.borderColor = 'rgba(245, 158, 11, 0.4)';
                    rrBadge.style.background = 'rgba(245, 158, 11, 0.15)';
                } else {
                    rrBadge.style.color = '#f87171';
                    rrBadge.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                    rrBadge.style.background = 'rgba(239, 68, 68, 0.15)';
                }
            }

            // 5. CẬP NHẬT BẢNG HUD THÔNG MINH
            updateKeyLevelHud({
                curPrice: currentPrice,
                avwapLow: curAvwapLow,
                avwapHigh: curAvwapHigh,
                avwapYtd: curAvwapYtd,
                curEma20: curEma20,
                curEma50: curEma50,
                curEma89: curEma89,
                curEma200: curEma200,
                curBollUpper: curBollUpper,
                curBollLower: curBollLower,
                curKijun26: curKijun26,
                confluenceZones: confluenceZones,
                c1: c1,
                s1: s1,
                selRes: selRes,
                selSup: selSup,
                allStaticLevels: allStaticLevels,
                dynamicLevelObjects: dynamicLevelObjects,
                rrScore: rrScore,
                rrRatioStr: rrRatioStr
            });

            // 6. VẼ OVERLAY LÊN BIỂU ĐỒ
            clearKeyLevelOverlays(targetChart);
            if (!targetChart.keyLevelIds) targetChart.keyLevelIds = [];
            if (!targetChart.dynamicKeyLevelIds) targetChart.dynamicKeyLevelIds = [];

            targetChart.activeKeyLevels = allStaticLevels;
            targetChart.activeDynamicLevels = dynamicLevelObjects;
            targetChart.activeConfluenceZones = confluenceZones;
            targetChart.renderedStaticLevels = [];
            targetChart.renderedDynamicLevels = [];

            const isLightMode = document.body.classList.contains('light-theme') || false;

            // A. VẼ CÁC MỐC TĨNH (STATIC)
            if (showStatic) {
                selRes.forEach((res, rIdx) => {
                    let lineId = `res_${rIdx}`;
                    if (!isKeyLevelLineActive(lineId, 'static')) return;
                    let isTop2 = rIdx < 2 && res.stars >= 2;
                    let isConf = !!res.isConfluence;
                    let lineColor = isConf ? '#f59e0b' : (isLightMode ? '#9333ea' : '#c084fc');
                    let zoneBg = isConf ? 'rgba(245, 158, 11, 0.16)' : (isLightMode ? 'rgba(147, 51, 234, 0.08)' : 'rgba(192, 132, 252, 0.12)');
                    let lineStyle = (isConf || res.stars >= 3) ? 'solid' : 'dashed';
                    let lineWidth = isConf ? 2.8 : (res.stars >= 3 ? 2.2 : (res.stars === 2 ? 1.5 : 1.0));
                    let distPct = (((res.val - currentPrice) / currentPrice) * 100).toFixed(1);

                    res.tierLabel = `Cản ${rIdx + 1}`;
                    res.distPct = distPct;

                    if (isTop2 || isConf) {
                        let zTop = res.val * 1.003;
                        let zBot = res.val * 0.997;
                        let zId = targetChart.createOverlay({
                            name: 'rect',
                            points: [{ timestamp: startTs, value: zTop }, { timestamp: futureTs, value: zBot }],
                            styles: { rect: { backgroundColor: zoneBg, borderColor: isConf ? 'rgba(245,158,11,0.4)' : 'transparent', borderWidth: isConf ? 1 : 0 } }
                        });
                        if (zId) targetChart.keyLevelIds.push(zId);
                    }

                    let lId = targetChart.createOverlay({
                        name: 'segment',
                        points: [{ timestamp: startTs, value: res.val }, { timestamp: futureTs, value: res.val }],
                        styles: { line: { color: lineColor, size: lineWidth, style: lineStyle } }
                    });
                    if (lId) targetChart.keyLevelIds.push(lId);

                    let confPrefix = isConf ? '🏆 HỘI TỤ ' : '';
                    let tagText = `${isConf ? '🏆' : '🛑'} ${confPrefix}Cản ${rIdx + 1}: ${res.val.toFixed(2)} (${res.starStr})`;
                    let tId = targetChart.createOverlay({
                        name: 'rightAlignedClickableText',
                        extendData: tagText,
                        points: [{ timestamp: futureTs, value: res.val }],
                        styles: {
                            text: {
                                paddingLeft: 6, paddingRight: 6, paddingTop: 2.5, paddingBottom: 2.5,
                                backgroundColor: isConf ? (isLightMode ? '#fffbeb' : 'rgba(24, 18, 5, 0.95)') : (isLightMode ? '#ffffff' : 'rgba(15, 23, 42, 0.92)'),
                                borderColor: lineColor, borderSize: isConf ? 1.5 : 1, color: lineColor,
                                size: 10.5, weight: 'bold', borderRadius: 3
                            }
                        }
                    });
                    if (tId) {
                        targetChart.keyLevelIds.push(tId);
                        targetChart.renderedStaticLevels.push(res);
                    }
                });

                selSup.forEach((sup, sIdx) => {
                    let lineId = `sup_${sIdx}`;
                    if (!isKeyLevelLineActive(lineId, 'static')) return;
                    let isTop2 = sIdx < 2 && sup.stars >= 2;
                    let isConf = !!sup.isConfluence;
                    let lineColor = isConf ? '#f59e0b' : (isLightMode ? '#059669' : '#34d399');
                    let zoneBg = isConf ? 'rgba(245, 158, 11, 0.16)' : (isLightMode ? 'rgba(5, 150, 105, 0.08)' : 'rgba(52, 211, 153, 0.12)');
                    let lineStyle = (isConf || sup.stars >= 3) ? 'solid' : 'dashed';
                    let lineWidth = isConf ? 2.8 : (sup.stars >= 3 ? 2.2 : (sup.stars === 2 ? 1.5 : 1.0));
                    let distPct = (((currentPrice - sup.val) / currentPrice) * 100).toFixed(1);

                    sup.tierLabel = `Đỡ ${sIdx + 1}`;
                    sup.distPct = distPct;

                    if (isTop2 || isConf) {
                        let zTop = sup.val * 1.003;
                        let zBot = sup.val * 0.997;
                        let zId = targetChart.createOverlay({
                            name: 'rect',
                            points: [{ timestamp: startTs, value: zTop }, { timestamp: futureTs, value: zBot }],
                            styles: { rect: { backgroundColor: zoneBg, borderColor: isConf ? 'rgba(245,158,11,0.4)' : 'transparent', borderWidth: isConf ? 1 : 0 } }
                        });
                        if (zId) targetChart.keyLevelIds.push(zId);
                    }

                    let lId = targetChart.createOverlay({
                        name: 'segment',
                        points: [{ timestamp: startTs, value: sup.val }, { timestamp: futureTs, value: sup.val }],
                        styles: { line: { color: lineColor, size: lineWidth, style: lineStyle } }
                    });
                    if (lId) targetChart.keyLevelIds.push(lId);

                    let confPrefix = isConf ? '🏆 HỘI TỤ ' : '';
                    let tagText = `${isConf ? '🏆' : '🛡️'} ${confPrefix}Đỡ ${sIdx + 1}: ${sup.val.toFixed(2)} (${sup.starStr})`;
                    let tId = targetChart.createOverlay({
                        name: 'rightAlignedClickableText',
                        extendData: tagText,
                        points: [{ timestamp: futureTs, value: sup.val }],
                        styles: {
                            text: {
                                paddingLeft: 6, paddingRight: 6, paddingTop: 2.5, paddingBottom: 2.5,
                                backgroundColor: isConf ? (isLightMode ? '#fffbeb' : 'rgba(24, 18, 5, 0.95)') : (isLightMode ? '#ffffff' : 'rgba(15, 23, 42, 0.92)'),
                                borderColor: lineColor, borderSize: isConf ? 1.5 : 1, color: lineColor,
                                size: 10.5, weight: 'bold', borderRadius: 3
                            }
                        }
                    });
                    if (tId) {
                        targetChart.keyLevelIds.push(tId);
                        targetChart.renderedStaticLevels.push(sup);
                    }
                });
            }

            // B. VẼ CÁC ĐƯỜNG ĐỘNG (DYNAMIC CURVES THEO TỪNG NHÓM ĐƯỢC CHỌN)
            if (showDynamic) {
                dynamicLevelObjects.forEach(dyn => {
                    let isGroupActive = (dyn.group === 'flow' && showGroupFlow) ||
                                        (dyn.group === 'trend' && showGroupTrend) ||
                                        (dyn.group === 'volatility' && showGroupVol);
                    if (!isGroupActive) return;
                    if (!isKeyLevelLineActive(dyn.id, dyn.group)) return;

                    let diffPct = Math.abs(currentPrice - dyn.val) / currentPrice * 100;
                    if (showStatic && diffPct > 5.0 && !dyn.isAvwap) return;

                    let startDynIdx = dyn.isAvwap ? (dyn.anchorIdx || 0) : Math.max(0, len - 45);
                    let pts = [];
                    for (let i = startDynIdx; i < len; i++) {
                        let v = dyn.isAvwap ? (dyn.series[i - (dyn.anchorIdx || 0)] ? dyn.series[i - (dyn.anchorIdx || 0)].val : dyn.val) : dyn.series[i];
                        if (v !== undefined) {
                            pts.push({ timestamp: dataList[i].timestamp, value: v });
                        }
                    }
                    pts.push({ timestamp: futureTs, value: dyn.val });

                    if (pts.length >= 2) {
                        for (let i = 0; i < pts.length - 1; i++) {
                            let sid = targetChart.createOverlay({
                                name: 'segment',
                                points: [pts[i], pts[i+1]],
                                styles: { line: { color: dyn.color, size: dyn.isAvwap ? 1.8 : (dyn.group === 'trend' ? 1.4 : 1.2), style: dyn.isAvwap ? 'solid' : 'dashed' } }
                            });
                            if (sid) targetChart.dynamicKeyLevelIds.push(sid);
                        }

                        let dynTag = `💫 ${dyn.name}: ${dyn.val.toFixed(2)}`;
                        let tid = targetChart.createOverlay({
                            name: 'rightAlignedClickableText',
                            extendData: dynTag,
                            points: [{ timestamp: futureTs, value: dyn.val }],
                            styles: {
                                text: {
                                    paddingLeft: 5, paddingRight: 5, paddingTop: 2, paddingBottom: 2,
                                    backgroundColor: isLightMode ? '#ffffff' : 'rgba(15, 23, 42, 0.90)',
                                    borderColor: dyn.color, borderSize: 1, color: dyn.color,
                                    size: 10, weight: 'bold', borderRadius: 3
                                }
                            }
                        });
                        if (tid) {
                            targetChart.dynamicKeyLevelIds.push(tid);
                            targetChart.renderedDynamicLevels.push(dyn);
                        }
                    }
                });
            }
        }
        window.runKeyLevel = runKeyLevel;

        function getKeyLevelRrInsightHtml() {
            const sym = (document.getElementById('currentSymbolDisplay') ? document.getElementById('currentSymbolDisplay').innerText.trim().toUpperCase() : '') || 'CỔ PHIẾU';
            const dataList = (chart1 && chart1.getDataList) ? chart1.getDataList() : [];
            if (!dataList || dataList.length === 0) return '';
            
            const curPrice = dataList[dataList.length - 1].close;
            const activeLevels = (chart1 && chart1.activeKeyLevels) ? chart1.activeKeyLevels : [];
            
            const resLevels = activeLevels.filter(lvl => lvl.type === 'RESISTANCE');
            const supLevels = activeLevels.filter(lvl => lvl.type === 'SUPPORT');
            
            const c1 = resLevels[0];
            const c2 = resLevels[1];
            const s1 = supLevels[0];
            
            if (!c1 || !s1) return '';
            
            const potProfit = ((c1.val - curPrice) / curPrice) * 100;
            const potRisk = ((curPrice - s1.val) / curPrice) * 100;
            const rrScore = potRisk > 0 ? (potProfit / potRisk) : (potProfit > 0 ? 10.0 : 1.0);

            // Tính toán vùng mua gom tối ưu
            let buyMin = s1.val;
            let buyMax = Math.max(s1.val * 1.01, curPrice <= s1.val ? s1.val * 1.01 : curPrice);
            if (buyMax > c1.val) buyMax = curPrice;
            
            // Điểm cắt lỗ: Thủng Đỡ 1 biên độ 1.5%
            let stoplossVal = s1.val * 0.985;
            let stoplossPct = curPrice > 0 ? (((curPrice - stoplossVal) / curPrice) * 100) : 1.5;
            
            let statusColor = '#34d399';
            let statusTag = '🟢 VỊ THẾ MUA HẤP DẪN (R:R VƯỢT TRỘI)';
            let psychDetail = '';
            let actionTip = '';
            
            if (rrScore >= 1.8) {
                statusColor = '#34d399';
                statusTag = '🟢 VỊ THẾ MUA HẤP DẪN (R:R VƯỢT TRỘI)';
                psychDetail = `Giá ${sym} (${curPrice.toFixed(2)}) đang ở rất gần đáy hỗ trợ <b>${s1.val.toFixed(2)}</b> (-${potRisk.toFixed(1)}%), trong khi địa hình tăng giá mở rộng lên cản trên <b>${c1.val.toFixed(2)}</b> (+${potProfit.toFixed(1)}%). Lực cầu gom hàng đang tạo bệ đỡ vững chắc.`;
                actionTip = `<b>Khuyến nghị Thực chiến:</b> Mở mua gom trong vùng <b>[${buyMin.toFixed(2)} ↔ ${buyMax.toFixed(2)}]</b>. Đặt mục tiêu chốt lời tại <b>${c1.val.toFixed(2)}</b> (+${potProfit.toFixed(1)}%) và chặn cắt lỗ nghiêm ngặt nếu thủng <b>${stoplossVal.toFixed(2)}</b>.`;
            } else if (rrScore >= 1.0) {
                statusColor = '#fbbf24';
                statusTag = '🟡 VỊ THẾ TRUNG TÍNH (THĂM DÒ TỶ TRỌNG NHỎ)';
                psychDetail = `Giá ${sym} (${curPrice.toFixed(2)}) đang vận động ở khoảng giữa hành lang [Đỡ: ${s1.val.toFixed(2)} ↔ Cản: ${c1.val.toFixed(2)}]. Tiềm năng tăng (+${potProfit.toFixed(1)}%) và rủi ro giảm (-${potRisk.toFixed(1)}%) đang ở thế giằng co cân bằng.`;
                actionTip = `<b>Khuyến nghị Thực chiến:</b> Chỉ giải ngân thăm dò 20-30% quanh <b>${curPrice.toFixed(2)}</b>. Kiên nhẫn chờ nhịp chỉnh về sát <b>[${buyMin.toFixed(2)} ↔ ${(s1.val*1.01).toFixed(2)}]</b> để gom đủ tỷ trọng với giá vốn an toàn nhất.`;
            } else {
                statusColor = '#f87171';
                statusTag = '🔴 RỦI RO CAO (KHÔNG MUA ĐUỔI - CANH CHỐT LỜI)';
                psychDetail = `Giá ${sym} (${curPrice.toFixed(2)}) đang ở <b>sát nút vùng cản ${c1.val.toFixed(2)}</b> (chỉ còn dư địa +${potProfit.toFixed(1)}%), trong khi nếu bị ép chỉnh về hỗ trợ ${s1.val.toFixed(2)} thì rủi ro mất -${potRisk.toFixed(1)}%. Áp lực chốt lời từ phe bán chặn đầu đang áp đảo.`;
                actionTip = `<b>Khuyến nghị Thực chiến:</b> <b>TUYỆT ĐỐI KHÔNG MUA ĐUỔI</b> ở mức giá ${curPrice.toFixed(2)}. Ưu tiên canh chốt lời từng phần (30-50%) tại cản <b>${c1.val.toFixed(2)}</b> và chờ nhịp rũ bỏ quay về vùng <b>[${buyMin.toFixed(2)} ↔ ${(s1.val*1.01).toFixed(2)}]</b> mới mua lại.`;
            }
            
            return `
                <div style="padding: 6px 4px; max-width: 330px; line-height: 1.45; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 5px;">
                        <div style="font-size: 12px; font-weight: 800; color: ${statusColor}; display: flex; align-items: center; gap: 5px;">
                            <span>⚖️</span> <b>TỶ LỆ LỢI NHUẬN / RỦI RO (R:R = ${rrScore.toFixed(1)})</b>
                        </div>
                        <span style="font-size: 10px; font-weight: 700; color: ${statusColor};">${rrScore >= 1.8 ? '🟢 TỐI ƯU' : (rrScore >= 1.0 ? '🟡 CÂN BẰNG' : '🔴 RỦI RO')}</span>
                    </div>

                    <!-- KHUNG KẾ HOẠCH GIẢI NGÂN CHI TIẾT -->
                    <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 6px 8px; margin-bottom: 6px; font-size: 10.5px; display: flex; flex-direction: column; gap: 4px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #34d399; font-weight: 700;">📥 VÙNG MUA GOM:</span>
                            <b style="color: #34d399; font-family: var(--font-mono, monospace); font-size: 11px;">[${buyMin.toFixed(2)} ↔ ${buyMax.toFixed(2)}]</b>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #ef4444; font-weight: 700;">🎯 MỤC TIÊU 1 (Cản 1):</span>
                            <b style="color: #ef4444; font-family: var(--font-mono, monospace); font-size: 11px;">${c1.val.toFixed(2)} (+${potProfit.toFixed(1)}%)</b>
                        </div>
                        ${c2 ? `
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #c084fc; font-weight: 700;">🎯 MỤC TIÊU 2 (Cản 2):</span>
                            <b style="color: #c084fc; font-family: var(--font-mono, monospace); font-size: 11px;">${c2.val.toFixed(2)} (+${(((c2.val - curPrice)/curPrice)*100).toFixed(1)}%)</b>
                        </div>` : ''}
                        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 3px; margin-top: 1px;">
                            <span style="color: #f87171; font-weight: 700;">🛑 ĐIỂM CẮT LỖ (Stoploss):</span>
                            <b style="color: #f87171; font-family: var(--font-mono, monospace); font-size: 11px;">&lt; ${stoplossVal.toFixed(2)} (-${stoplossPct.toFixed(1)}%)</b>
                        </div>
                    </div>

                    <div style="font-size: 11px; color: #f1f5f9; font-weight: 600; margin-bottom: 3px;">
                        🧠 <b>Tâm lý Thế Trận:</b>
                    </div>
                    <div style="font-size: 10.5px; color: #cbd5e1; margin-bottom: 6px;">
                        ${psychDetail}
                    </div>

                    <div style="font-size: 10.5px; color: #38bdf8; background: rgba(56,189,248,0.1); border-left: 2.5px solid #38bdf8; padding: 4px 6px; border-radius: 2px;">
                        💡 ${actionTip}
                    </div>
                </div>
            `;
        }
window.getKeyLevelRrInsightHtml = getKeyLevelRrInsightHtml;

        function showKeyLevelRrTooltip(e) {
            let insightHtml = getKeyLevelRrInsightHtml();
            if (insightHtml) {
                showTrendTip(e, insightHtml);
            }
        }
        window.showKeyLevelRrTooltip = showKeyLevelRrTooltip;

        function getKeyLevelInsightHtml(lvl) {
            const sym = (document.getElementById('currentSymbolDisplay') ? document.getElementById('currentSymbolDisplay').innerText.trim().toUpperCase() : '') || 'CỔ PHIẾU';
            const dataList = (chart1 && chart1.getDataList) ? chart1.getDataList() : [];
            if (!dataList || dataList.length === 0) return '';

            const len = dataList.length;
            const lastBar = dataList[len - 1];
            const curPrice = lastBar.close;
            const val = lvl.val ? lvl.val.toFixed(2) : '--';
            const isRes = lvl.type === 'RESISTANCE';
            const titleColor = lvl.isConfluence ? '#fbbf24' : (isRes ? '#c084fc' : '#34d399');
            const icon = lvl.isConfluence ? '🏆' : (isRes ? '🛑' : '🛡️');
            const tierName = lvl.isConfluence ? `VÙNG HỘI TỤ VÀNG` : (lvl.tierLabel || (isRes ? 'Kháng cự' : 'Hỗ trợ'));

            let distPctNum = curPrice > 0 ? (((lvl.val - curPrice) / curPrice) * 100) : 0;
            let absDist = Math.abs(distPctNum).toFixed(1);
            let distText = isRes ? `Cách giá hiện tại: +${absDist}%` : `Cách giá hiện tại: -${absDist}%`;

            const recent20 = dataList.slice(Math.max(0, len - 20));
            const ma20Vol = recent20.reduce((s, b) => s + (b.volume || 0), 0) / (recent20.length || 1);
            const dayVol = lastBar.volume || 0;
            const volRatio = ma20Vol > 0 ? (dayVol / ma20Vol) : 1.0;
            const dayVolM = (dayVol / 1000000).toFixed(1);
            const ma20VolM = (ma20Vol / 1000000).toFixed(1);

            const recent60 = dataList.slice(Math.max(0, len - 60));
            const low60 = recent60.reduce((m, b) => b.low < m.low ? b : m, recent60[0]);
            const gainFromLow = low60 && low60.low > 0 ? (((curPrice - low60.low) / low60.low) * 100).toFixed(1) : '0';

            const touches = lvl.count || (lvl.pivots ? lvl.pivots.length : 1);
            const levelVolM = lvl.totalVol ? (lvl.totalVol / 1000000).toFixed(1) : '0';
            const tierLabel = lvl.tierLabel || '';
            const isTop1 = tierLabel.includes('1');
            const isTop2 = tierLabel.includes('2');
            const isMajor = lvl.stars >= 3 || touches >= 3 || lvl.isConfluence;

            let originText = '';
            if (lvl.isConfluence && lvl.confluencePartner) {
                originText = `Hội tụ giữa <b>${isRes ? 'Cản' : 'Đỡ'} Tĩnh đỉnh cũ</b> và <b>${lvl.confluencePartner.name}</b> (${lvl.confluencePartner.role}).`;
            } else if (lvl.isFibAth) {
                originText = `Dự phóng mục tiêu vượt đỉnh mọi thời đại (${lvl.fibName || 'Fibonacci Extension'}).`;
            } else if (lvl.isAtl) {
                originText = `Mốc giá tròn tâm lý bảo vệ rủi ro vùng đáy chiết khấu sâu.`;
            } else if (lvl.pivots && lvl.pivots.length > 0) {
                originText = `Tạo bởi <b>${touches} lần đảo chiều</b> lịch sử · Cụm kẹp hàng: <b>${levelVolM > 0 ? levelVolM + ' Triệu CP' : 'Lớn'}</b>.`;
            } else {
                originText = `Mốc đảo chiều quan trọng trên biểu đồ kỹ thuật.`;
            }

            let psychText = '';
            let actionText = '';

            if (lvl.isConfluence) {
                if (isRes) {
                    psychText = `<b>${sym}</b> đang tiếp cận <b>VÙNG TỬ HUYỆT HỘI TỤ VÀNG (${val})</b>. Đây là nơi giao nhau giữa cản đỉnh cũ (${levelVolM}M CP) và đường cản động tổ chức. Với thanh khoản phiên nay ${dayVolM}M CP (${volRatio >= 1.2 ? 'bùng nổ gấp ' + volRatio.toFixed(1) + 'x MA20' : 'mức trung bình'}), phe bán tổ chức và nhỏ lẻ kẹp hàng sẽ xả hàng chặn đà tăng cực kỳ quyết liệt.`;
                    actionText = `<b>Khuyến nghị Thực chiến:</b> 🎯 <b>MỤC TIÊU CHỐT LỜI TỐI ƯU NHẤT.</b> Tuyệt đối không mua đón đầu sát ${val}. Chỉ gia tăng vị thế khi nến ngày đóng cửa dứt khoát vượt ${val} kèm thanh khoản đạt tối thiểu ${(ma20VolM * 1.5).toFixed(1)}M CP.`;
                } else {
                    psychText = `Bệ đỡ <b>HỘI TỤ VÀNG (${val})</b> đã hấp thụ toàn bộ lực cung bán tháo. ${sym} đã bứt phá qua mốc này để xác nhận đảo chiều tăng +${gainFromLow}% từ đáy, biến ${val} từ Cản cũ thành <b>Bệ Đỡ Mới Vững Chắc (S/R Flip)</b>. Phe bán giá rẻ đã cạn kiệt.`;
                    actionText = `<b>Khuyến nghị Thực chiến:</b> 🛡️ Đặt làm mốc <b>Chặn Lãi (Trailing Stop)</b> bảo toàn vốn. Nếu giá có nhịp lùi test lại ${val} kèm thanh khoản cạn kiệt ➔ Đây là <b>ĐIỂM MUA GIA TĂNG (Pullback)</b> an toàn nhất.`;
                }
            } else if (isRes) {
                if (isTop1) {
                    if (isMajor || touches >= 2) {
                        psychText = `<b>${sym}</b> đang hồi phục +${gainFromLow}% từ đáy và chỉ cách <b>Cửa Ải Số 1 (${val})</b> đúng +${absDist}%. Đây là vùng cản cứng với <b>${touches} lần đảo chiều</b> và lượng kẹp hàng <b>${levelVolM}M CP</b>. Dòng tiền phiên nay (${dayVolM}M CP, ${volRatio >= 1.2 ? 'bùng nổ x' + volRatio.toFixed(1) + ' MA20' : 'chưa đột biến'}) sẽ gặp rung lắc mạnh khi phe kẹp hàng cũ bán hòa vốn. Lực cầu cần duy trì tối thiểu >= ${(ma20VolM * 1.2).toFixed(1)}M CP/phiên mới bứt phá được.`;
                        actionText = `<b>Khuyến nghị Thực chiến:</b> <b>KHÔNG MUA ĐUỔI</b> khi giá vừa chạm ${val} trong phiên đầu tiên. Nếu xuất hiện nến rụt râu trên hoặc Vol suy yếu khi kéo sát ${val} ➔ Ưu tiên chốt lời 30-50%. Chỉ mua gia tăng khi nến vượt dứt khoát đóng cửa > ${val}.`;
                    } else {
                        psychText = `Mốc cản ngắn hạn ${val} (+${absDist}%) có lượng kẹp hàng mỏng (${levelVolM > 0 ? levelVolM + 'M CP' : 'nhỏ'}, chỉ 1 lần chạm). Với đà hồi phục và dòng tiền ${dayVolM}M CP hiện tại, áp lực cung tại đây không đáng kể.`;
                        actionText = `<b>Khuyến nghị Thực chiến:</b> Khả năng cao nến sẽ xuyên phá qua ${val} dễ dàng trong phiên. Nhà đầu tư đang có hàng tiếp tục nắm giữ hướng tới các mục tiêu cản cứng phía trên.`;
                    }
                } else if (isTop2) {
                    psychText = `Mục tiêu sóng trung hạn <b>${val} (+${absDist}%)</b>. Đây là đỉnh sóng cũ nơi có lượng kẹp hàng ${levelVolM}M CP. Khi ${sym} hấp thụ xong cản 1, quán tính dòng tiền sẽ đưa giá hướng thẳng lên thử thách vùng ${val}.`;
                    actionText = `<b>Khuyến nghị Thực chiến:</b> 🎯 Đặt làm <b>Mục tiêu chốt lời đợt 2 (Target 2)</b> cho các vị thế mua bắt đáy từ vùng giá thấp.`;
                } else {
                    psychText = `Vùng đỉnh cản lịch sử / Dài hạn <b>${val} (+${absDist}%)</b>. Vùng kháng cự tối cao chi phối toàn bộ khung xu hướng lớn của ${sym}.`;
                    actionText = `<b>Khuyến nghị Thực chiến:</b> 🏆 Mục tiêu chốt lời dài hạn (Major Target). Vùng giá này thường xuất hiện nhịp phân phối hoặc tái tích lũy lớn kéo dài nhiều tuần.`;
                }
            } else {
                if (isTop1) {
                    psychText = `Mốc nâng đỡ gần nhất <b>${val} (-${absDist}%)</b>. Vùng này đã phản ứng giữ giá thành công qua <b>${touches} lần chạm rút chân</b> với thanh khoản hấp thụ <b>${levelVolM}M CP</b>. Phe mua đang kiểm soát tốt thế trận để bảo vệ vùng giá này.`;
                    actionText = `<b>Khuyến nghị Thực chiến:</b> 🛡️ Mốc chặn lãi ngắn hạn (Trailing Stop). Tiếp tục nắm giữ khi giá vận động trên ${val}. Nếu xuất hiện nến đóng cửa gãy mốc này kèm Vol lớn ➔ Hạ 50% tỷ trọng lướt sóng.`;
                } else if (isTop2) {
                    psychText = `Vùng tích lũy / Chiết khấu an toàn <b>${val} (-${absDist}%)</b>. Nơi dòng tiền lớn đã tham gia gom hàng quyết liệt ở các nhịp điều chỉnh trước.`;
                    actionText = `<b>Khuyến nghị Thực chiến:</b> 📥 Vùng giải ngân bắt đáy an toàn (Pullback Zone). Canh mở mua gom nếu thị trường chung có nhịp rũ bỏ bất ngờ về sát ${val}.`;
                } else {
                    psychText = `Vùng đáy tử thủ lịch sử <b>${val} (-${absDist}%)</b>. Nơi kích hoạt dòng tiền tạo đáy lớn đưa ${sym} tăng trưởng trong quá khứ.`;
                    actionText = `<b>Khuyến nghị Thực chiến:</b> 🛑 <b>CHỐT CHẶN CẮT LỖ (STOPLOSS) TUYỆT ĐỐI.</b> Nếu mốc này bị thủng đóng nến, cấu trúc tăng trưởng dài hạn sẽ bị phá vỡ, bắt buộc phải cắt lỗ toàn bộ vị thế.`;
                }
            }

            return `
                <div style="padding: 6px 4px; max-width: 320px; line-height: 1.45; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 5px;">
                        <div style="font-size: 12px; font-weight: 800; color: ${titleColor}; display: flex; align-items: center; gap: 5px;">
                            <span>${icon}</span> <b>[${tierName}] Mốc: ${val}</b>
                        </div>
                        <span style="font-size: 10.5px; font-weight: 700; color: #fbbf24;">${lvl.starStr}</span>
                    </div>
                    <div style="font-size: 10.5px; color: #94a3b8; margin-bottom: 5px;">
                        📊 <i>${originText}</i> (${distText})
                    </div>
                    <div style="font-size: 11px; color: #f1f5f9; font-weight: 600; margin-bottom: 4px;">
                        🧠 <b>Tâm lý Cung Cầu:</b>
                    </div>
                    <div style="font-size: 10.5px; color: #cbd5e1; margin-bottom: 6px;">
                        ${psychText}
                    </div>
                    <div style="font-size: 10.5px; color: ${lvl.isConfluence ? '#fbbf24' : '#38bdf8'}; background: ${lvl.isConfluence ? 'rgba(245,158,11,0.1)' : 'rgba(56,189,248,0.1)'}; border-left: 2.5px solid ${lvl.isConfluence ? '#fbbf24' : '#38bdf8'}; padding: 4px 6px; border-radius: 2px;">
                        💡 ${actionText}
                    </div>
                </div>
            `;
        }

        function getDynamicLevelInsightHtml(dyn) {
            const sym = (document.getElementById('currentSymbolDisplay') ? document.getElementById('currentSymbolDisplay').innerText.trim().toUpperCase() : '') || 'CỔ PHIẾU';
            const dataList = (chart1 && chart1.getDataList) ? chart1.getDataList() : [];
            if (!dataList || dataList.length === 0) return '';

            const len = dataList.length;
            const lastBar = dataList[len - 1];
            const prevBar = len > 1 ? dataList[len - 2] : lastBar;
            const curPrice = lastBar.close;
            const val = dyn.val ? dyn.val.toFixed(2) : '--';
            const diffPctNum = curPrice > 0 ? (((curPrice - dyn.val) / curPrice) * 100) : 0;
            const absDiff = Math.abs(diffPctNum).toFixed(1);
            const isAbove = curPrice >= dyn.val;

            // Dòng tiền & Vol
            const recent20 = dataList.slice(Math.max(0, len - 20));
            const ma20Vol = recent20.reduce((s, b) => s + (b.volume || 0), 0) / (recent20.length || 1);
            const dayVol = lastBar.volume || 0;
            const volRatio = ma20Vol > 0 ? (dayVol / ma20Vol) : 1.0;
            const dayVolM = (dayVol / 1000000).toFixed(1);
            const ma20VolM = (ma20Vol / 1000000).toFixed(1);

            // Đo độ biến động Bollinger & SMA20
            const d = window.lastHudData || {};
            const curBollUpper = d.curBollUpper || (dyn.id === 'boll_upper' ? dyn.val : curPrice * 1.06);
            const curBollLower = d.curBollLower || (dyn.id === 'boll_lower' ? dyn.val : curPrice * 0.94);
            const sma20 = (curBollUpper + curBollLower) / 2.0;
            const bollWidthPct = ((curBollUpper - curBollLower) / (sma20 || 1) * 100).toFixed(1);
            const isBollSqueeze = parseFloat(bollWidthPct) < 9.0;

            let psychText = '';
            let actionText = '';
            let roleText = dyn.role || 'Đường chỉ báo động';
            let starBadge = dyn.stars || '⭐⭐';
            let titleColor = dyn.color || '#38bdf8';

            if (dyn.id === 'boll_upper') {
                titleColor = '#06b6d4';
                roleText = `Trần Biến Động (+2σ) · Biên độ dải: ${bollWidthPct}%`;
                starBadge = '⭐⭐';
                let potProfit = (((dyn.val - curPrice) / curPrice) * 100).toFixed(1);

                if (isAbove || Math.abs(parseFloat(potProfit)) <= 1.2) {
                    psychText = `<b>${sym} (${curPrice.toFixed(2)})</b> đang áp sát trần <b>Bollinger Band Trên (${val})</b> (+${potProfit}%). Thị giá chạm ngưỡng +2 độ lệch chuẩn thống kê, nơi <b>95% biến động giá có xu hướng bị chặn đứng và hạ nhiệt</b>. Phe mua ngắn hạn bắt đầu suy yếu lực đẩy, phe cầm hàng có xu hướng chốt lời quyết liệt.`;
                    actionText = `<b>Khuyến nghị Thực chiến:</b> 🛑 <b>KHÔNG MUA MỚI Ở VÙNG CĂNG BIẾN ĐỘNG NÀY.</b> Canh chốt lời từng phần (30-50%) quanh <b>${val}</b> khi nến xuất hiện râu trên hoặc thanh khoản không đủ vượt ${(ma20VolM * 1.5).toFixed(1)}M CP.`;
                } else if (isBollSqueeze) {
                    psychText = `Dải Bollinger đang <b>co thắt nén chặt năng lượng (${bollWidthPct}%)</b> quanh trục SMA20 (${sma20.toFixed(2)}). Giá hiện tại đang cách dải trên <b>+${potProfit}%</b>. Sau các pha nén chặt, thị trường thường xuất hiện một đợt bùng nổ biến động cực lớn mở dải đi lên.`;
                    actionText = `<b>Khuyến nghị Thực chiến:</b> ⚡ <b>CHUẨN BỊ VỊ THẾ BÙNG NỔ (Squeeze Breakout).</b> Đặt mốc <b>${val}</b> là điểm kích hoạt gia tăng tỷ trọng khi có cây nến đóng cửa vượt ${val} kèm Volume bùng nổ > ${(ma20VolM * 1.3).toFixed(1)}M CP.`;
                } else {
                    psychText = `Dải trên đang mở rộng ở mốc <b>${val} (+${potProfit}%)</b>. Đây là trần biên độ dao động kỳ vọng cho nhịp tăng hiện tại, giá còn dư địa <b>+${potProfit}%</b> trước khi gặp áp lực cản quá mua.`;
                    actionText = `<b>Khuyến nghị Thực chiến:</b> 🎯 Đặt mốc <b>${val}</b> làm <b>Target Chốt Lời Ngắn Hạn (T+)</b>. Nâng dần mốc chặn lãi theo đường SMA20 (${sma20.toFixed(2)}).`;
                }
            } else if (dyn.id === 'boll_lower') {
                titleColor = '#818cf8';
                roleText = `Sàn Nâng Đỡ (-2σ) · Biên độ dải: ${bollWidthPct}%`;
                starBadge = '⭐⭐';
                let potDrop = (((curPrice - dyn.val) / curPrice) * 100).toFixed(1);
                let reboundProfit = (((sma20 - dyn.val) / dyn.val) * 100).toFixed(1);

                if (!isAbove || Math.abs(parseFloat(potDrop)) <= 1.2) {
                    psychText = `<b>${sym} (${curPrice.toFixed(2)})</b> đã ép sát hoặc xuyên qua <b>Sàn Dưới Bollinger Bands (${val})</b> (-${potDrop}%). Vùng giá này đã rơi vào trạng thái <b>Quá Bán Cực Đại (-2σ)</b>. Lực bán tháo hoảng loạn đã cạn kiệt, thuật toán định lượng (Quant) và dòng tiền săn hàng chiết khấu sẽ kích hoạt nhịp nảy hồi phục (Mean Reversion) về lại trục giữa SMA20 (${sma20.toFixed(2)}).`;
                    actionText = `<b>Khuyến nghị Thực chiến:</b> 📥 <b>VÙNG BẮT ĐÁY KỸ THUẬT (Reversal Zone: ${val} ↔ ${(dyn.val*1.01).toFixed(2)}).</b> Không bán tháo giá rẻ. Mở mua thăm dò 30% khi nến chạm dải dưới rút chân, kỳ vọng ăn nhịp hồi phục về SMA20 (${sma20.toFixed(2)}) với biên lợi nhuận <b>+${reboundProfit}%</b>.`;
                } else {
                    psychText = `Dải dưới <b>Bollinger Bands (${val})</b> đang tạo thành sàn đệm bảo vệ cách giá hiện tại <b>-${potDrop}%</b>. Đây là chốt chặn phòng thủ biến động cuối cùng của ${sym} trong nhịp điều chỉnh.`;
                    actionText = `<b>Khuyến nghị Thực chiến:</b> Điểm tựa quản trị rủi ro. Chỉ khi nào nến ngày đóng cửa thủng qua ${val} mới cần kích hoạt kịch bản phòng thủ cắt lỗ.`;
                }
            } else if (dyn.id === 'kijun26') {
                titleColor = '#10b981';
                roleText = 'Trục Cân Bằng Cung Cầu Á Đông (Ichimoku)';
                starBadge = '⭐⭐⭐';

                if (absDiff <= 0.8) {
                    psychText = `<b>${sym} (${curPrice.toFixed(2)})</b> đang bám sát đúng mốc <b>Kijun-sen 26 Phiên (${val})</b> (độ lệch chỉ <b>${diffPctNum >= 0 ? '+' : ''}${absDiff}%</b>). Đường Kijun đang đi ngang phẳng xác nhận thế trận <b>Cung Cầu Cực Kỳ Cân Bằng</b> giữa phe mua và phe bán. Nền giá đang được nén chặt chuẩn bị cho pha biến động mới.`;
                    actionText = `<b>Khuyến nghị Thực chiến:</b> 🎯 <b>VÙNG TÍCH LŨY MUA GOM CHẶT CHẼ.</b> Mở mua gom quanh vùng <b>[${(dyn.val*0.995).toFixed(2)} ↔ ${(dyn.val*1.005).toFixed(2)}]</b>. Nếu nến bứt phá vượt hẳn khỏi mốc ${val} kèm Vol > ${ma20VolM}M CP ➔ Gia tăng tỷ trọng.`;
                } else if (isAbove) {
                    psychText = `<b>${sym} (${curPrice.toFixed(2)})</b> đang vận động cao hơn Kijun-sen (${val}) <b>+${absDiff}%</b>. Phe mua đang duy trì quyền chủ động trên trục cân bằng 26 phiên. Kijun-sen đóng vai trò là bệ đỡ động nâng đỡ các nhịp lùi test.`;
                    actionText = `<b>Khuyến nghị Thực chiến:</b> Giữ vững vị thế nắm giữ. Nếu có nhịp điều chỉnh lùi về test lại Kijun (${val}) và rút chân ➔ Đây là điểm mua gia tăng vị thế (Pullback).`;
                } else {
                    psychText = `<b>${sym} (${curPrice.toFixed(2)})</b> đang nằm dưới Kijun-sen (${val}) <b>-${absDiff}%</b>. Kijun-sen đang phát huy lực hút kỹ thuật mạnh mẽ kéo thị giá hồi phục trở lại mốc cân bằng ${val}.`;
                    actionText = `<b>Khuyến nghị Thực chiến:</b> Mốc <b>${val}</b> là mục tiêu hồi phục ngắn hạn. Canh chốt lời lướt sóng khi giá chạm mốc Kijun ${val} nếu thanh khoản không đủ mạnh.`;
                }
            } else if (dyn.id === 'avwap_low') {
                titleColor = '#a855f7';
                roleText = 'Giá Vốn Tạo Lập / Smart Money Neo Từ Đáy';
                starBadge = '⭐⭐⭐';

                if (isAbove) {
                    psychText = `<b>${sym} (${curPrice.toFixed(2)})</b> đang duy trì vận động cao hơn <b>+${absDiff}%</b> so với <b>Giá Vốn Bình Quân Big Boys (${val})</b> gom từ chân sóng gần nhất. Toàn bộ dòng tiền tổ chức đang có vị thế lãi và có xu hướng tiếp tục kéo giá bảo vệ thành quả.`;
                    actionText = `<b>Khuyến nghị Thực chiến:</b> 🛡️ Mốc neo giá vốn tin cậy nhất của tạo lập. Nếu ${sym} có nhịp rũ bỏ lùi sát vùng <b>${val}</b> kèm thanh khoản cạn kiệt ➔ Đây là <b>ĐIỂM MUA GIA TĂNG (Gom Cùng Tay To)</b> an toàn tuyệt đối.`;
                } else {
                    psychText = `<b>${sym}</b> đang bị ép giao dịch dưới Giá Vốn Big Boys (${val}) -${absDiff}%. Dòng tiền lớn tạm thời chưa sẵn sàng gom đẩy giá và đang chờ rũ bỏ cạn cung.`;
                    actionText = `<b>Khuyến nghị Thực chiến:</b> ⚠️ Chưa vội mua đuổi. Chờ xuất hiện cây nến bùng nổ đóng cửa vượt dứt khoát lên trên đường AVWAP <b>${val}</b> kèm Vol lớn.`;
                }
            } else if (dyn.id === 'avwap_high') {
                titleColor = '#f43f5e';
                roleText = 'Giá Vốn Phe Kẹp Hàng Neo Từ Đỉnh';
                starBadge = '⭐⭐⭐';

                if (!isAbove || absDiff <= 1.5) {
                    psychText = `<b>${sym}</b> đang áp sát <b>Giá Vốn Kẹp Hàng Đu Đỉnh (${val})</b> (+${absDiff}%). Lượng lớn nhà đầu tư đu đỉnh cũ đang chờ đợi giá chạm mốc này để bán hòa vốn (về bờ).`;
                    actionText = `<b>Khuyến nghị Thực chiến:</b> 🛑 <b>CẢN ĐỘNG KẸP HÀNG MẠNH NHẤT.</b> Canh chốt lời ngắn hạn 30-50% khi giá kéo sát <b>${val}</b>. Chỉ gia tăng khi có phiên đóng nến vượt qua ${val} với thanh khoản lớn.`;
                } else {
                    psychText = `<b>${sym}</b> đã bứt phá hoàn toàn vượt lên trên Giá Vốn Đu Đỉnh (${val}) (+${absDiff}%). Toàn bộ phe đu đỉnh cũ đã bị rũ bỏ hoặc hòa vốn thành công, đường tăng phía trước được giải phóng cung.`;
                    actionText = `<b>Khuyến nghị Thực chiến:</b> Tiếp tục nắm giữ gồng lãi, nâng mốc chặn lãi bám sát theo các đường xu hướng.`;
                }
            } else if (dyn.id === 'avwap_ytd') {
                titleColor = '#38bdf8';
                roleText = 'Giá Vốn Benchmark Quỹ Đầu Tư ETF Từ Đầu Năm';
                starBadge = '⭐⭐';
                psychText = `<b>YTD VWAP (${val})</b> là mốc chi phí vốn trung bình của các <b>Quỹ ETF và Quỹ Đầu Tư Tổ Chức</b> từ đầu năm. Giá hiện tại đang ${isAbove ? 'cao hơn +' : 'thấp hơn -'}${absDiff}%.`;
                actionText = `<b>Khuyến nghị Thực chiến:</b> ${isAbove ? 'Cổ phiếu nằm trong danh mục ưu tiên giải ngân tiếp tục của các quỹ tổ chức.' : 'Áp lực cơ cấu danh mục từ các quỹ khi hiệu suất dưới chuẩn NAV.'}`;
            } else if (dyn.id === 'ema20') {
                titleColor = '#06b6d4';
                roleText = 'Bệ Đỡ Ngắn Hạn (Tăng Tốc)';
                starBadge = '⭐⭐⭐';

                if (isAbove) {
                    if (diffPctNum >= 4.0) {
                        psychText = `<b>${sym}</b> đang trong nhịp tăng tốc mạnh mẽ, bỏ xa bệ đỡ ngắn hạn <b>EMA 20 (${val})</b> tới <b>+${absDiff}%</b>. Xu hướng tăng ngắn hạn cực khỏe nhưng bắt đầu xuất hiện trạng thái căng giá (Overextended).`;
                        actionText = `<b>Khuyến nghị Thực chiến:</b> Không mở mua mới khi giá đã rời quá xa EMA20 (>4%). Tiếp tục nắm giữ và nâng mốc chặn lãi (Trailing Stop) bám theo đường EMA20 (${val}).`;
                    } else {
                        psychText = `<b>${sym}</b> đang bám sát ngay trên bệ đỡ <b>EMA 20 (${val}) (+${absDiff}%)</b> với dòng tiền phiên nay đạt ${dayVolM}M CP (${volRatio >= 1.2 ? 'gấp ' + volRatio.toFixed(1) + 'x MA20' : 'trung bình'}). Phe mua ngắn hạn đang kiểm soát rất tốt thế trận.`;
                        actionText = `<b>Khuyến nghị Thực chiến:</b> Vùng tích lũy tăng tốc. Có thể mở mua lướt sóng ngắn hạn khi giá test lại đường EMA20 tại <b>${val}</b> và rút chân. Đặt cắt lỗ nếu nến ngày đóng cửa thủng ${val}.`;
                    }
                } else {
                    psychText = `<b>${sym}</b> đang nằm dưới đường EMA 20 (${val}) (-${absDiff}%). Nhịp tăng nóng ngắn hạn đã tạm thời bị chững lại và đang chuyển sang pha điều chỉnh / tích lũy lại.`;
                    actionText = `<b>Khuyến nghị Thực chiến:</b> Tạm thời đứng ngoài quan sát. Chờ giá tích lũy tạo nền hoặc vượt trở lại lên trên EMA20 (${val}) mới mở vị thế mua mới.`;
                }
            } else if (dyn.id === 'ema50') {
                titleColor = '#fbbf24';
                roleText = 'Đường Sinh Mệnh Trung Hạn (Sóng Quỹ 10 Tuần)';
                starBadge = '⭐⭐⭐';

                if (isAbove) {
                    psychText = `<b>${sym}</b> đang giữ vững cấu trúc tăng trung hạn 10 tuần trên <b>Đường Sinh Mệnh EMA 50 (${val}) (+${absDiff}%)</b>. Các quỹ đầu tư và dòng tiền lớn tổ chức đang nắm giữ vị thế chủ đạo.`;
                    actionText = `<b>Khuyến nghị Thực chiến:</b> 🎯 <b>VÙNG GOM SÓNG TRUNG HẠN (Major Pullback).</b> Mỗi khi thị trường có nhịp điều chỉnh sâu đưa ${sym} lùi về sát mốc EMA50 (${val}), đây luôn là cơ hội giải ngân tỷ trọng lớn an toàn.`;
                } else {
                    psychText = `<b>${sym}</b> đang vận động dưới đường EMA 50 (${val}) (-${absDiff}%). Xu hướng trung hạn đang chịu áp lực điều chỉnh.`;
                    actionText = `<b>Khuyến nghị Thực chiến:</b> Mốc cản động trung hạn then chốt. Cần một phiên bùng nổ thanh khoản lớn đóng cửa vượt ${val} để xác nhận xu hướng tăng quay trở lại.`;
                }
            } else if (dyn.id === 'ema89') {
                titleColor = '#f97316';
                roleText = 'Cân Bằng Sóng Fibonacci Elliott';
                starBadge = '⭐⭐';
                psychText = `<b>EMA 89 Ngày (${val})</b> là mốc cân bằng chu kỳ <b>Sóng Fibonacci Elliott</b>. Giá hiện tại đang ${isAbove ? 'vận động trên +' : 'nằm dưới -'}${absDiff}%.`;
                actionText = `<b>Khuyến nghị Thực chiến:</b> Điểm tựa xác nhận nhịp điều chỉnh sóng 2 và sóng 4 đã hoàn tất.`;
            } else if (dyn.id === 'ema200') {
                titleColor = '#ef4444';
                roleText = 'Ranh Giới Định Đoạt Bull / Bear Market (1 Năm)';
                starBadge = '⭐⭐⭐';

                if (isAbove) {
                    psychText = `<b>${sym} (${curPrice.toFixed(2)})</b> đã bứt phá thành công và đang giao dịch TRÊN ranh giới dài hạn <b>EMA 200 (${val}) (+${absDiff}%)</b>. ${sym} đã chính thức bước vào <b>CHU KỲ BULL MARKET (THỊ TRƯỜNG TĂNG GIÁ DÀI HẠN)</b>.`;
                    actionText = `<b>Khuyến nghị Thực chiến:</b> 🏆 Xu hướng lớn đã được mở rộng. Ưu tiên chiến lược Mua và Nắm giữ (Buy & Hold).`;
                } else {
                    psychText = `<b>${sym}</b> đang ở dưới ranh giới EMA 200 (${val}) (-${absDiff}%). Cổ phiếu vẫn đang trong pha tạo đáy dài hạn. Đường EMA 200 là bức tường cản động lớn nhất năm.`;
                    actionText = `<b>Khuyến nghị Thực chiến:</b> 🛑 <b>CẢN ĐỘNG TỬ HUYỆT DÀI HẠN.</b> Khi giá hồi phục tiếp cận sát ${val}, chắc chắn sẽ có rung lắc lớn.`;
                }
            }

            return `
                <div style="padding: 6px 4px; max-width: 330px; line-height: 1.45; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 5px;">
                        <div style="font-size: 12px; font-weight: 800; color: ${titleColor}; display: flex; align-items: center; gap: 5px;">
                            <span>💫</span> <b>[ĐƯỜNG ĐỘNG] ${dyn.name}: ${val}</b>
                        </div>
                        <span style="font-size: 10.5px; font-weight: 700; color: #fbbf24;">${starBadge}</span>
                    </div>
                    <div style="font-size: 10.5px; color: #94a3b8; margin-bottom: 5px;">
                        📊 <b>Vai trò:</b> ${roleText} · Giá ${isAbove ? 'cao hơn' : 'thấp hơn'}: <b>${absDiff}%</b>
                    </div>
                    <div style="font-size: 11px; color: #f1f5f9; font-weight: 600; margin-bottom: 4px;">
                        🧠 <b>Insight Dòng Tiền & Cung Cầu Thực Tế:</b>
                    </div>
                    <div style="font-size: 10.5px; color: #cbd5e1; margin-bottom: 6px;">
                        ${psychText}
                    </div>
                    <div style="font-size: 10.5px; color: #38bdf8; background: rgba(56,189,248,0.1); border-left: 2.5px solid #38bdf8; padding: 4px 6px; border-radius: 2px;">
                        💡 ${actionText}
                    </div>
                </div>
            `;
        }


        (function initKeyLevelHover() {
            let activeKeyLevelTip = false;

            document.addEventListener('mousemove', (e) => {
                if (!window.isKeyLevelOn || window.keyLevelCount === 'none' || !chart1) {
                    if (activeKeyLevelTip) {
                        hideTrendTip();
                        activeKeyLevelTip = false;
                    }
                    return;
                }

                // Nếu đang hover trên Bảng HUD hoặc Toolbar -> để HUD tự xử lý tooltip, không can thiệp từ canvas
                const hud = document.getElementById('keyLevelHudPanel');
                const tb = document.getElementById('keyLevelMiniToolbar');
                if ((hud && hud.contains(e.target)) || (tb && tb.contains(e.target))) {
                    return;
                }

                if (window.activeSwingTip) return;

                const chartWrap = document.getElementById('chart-wrapper') || document.getElementById('chart-container');
                if (!chartWrap) return;
                const rect = chartWrap.getBoundingClientRect();

                if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
                    if (activeKeyLevelTip) {
                        hideTrendTip();
                        activeKeyLevelTip = false;
                    }
                    return;
                }

                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                const dataList = chart1.getDataList ? chart1.getDataList() : [];
                if (!dataList || dataList.length === 0) return;

                const canShowStatic = !!window.keyLevelShowStatic;
                const canShowDynamic = !!window.keyLevelShowDynamic;

                // 1. Kiểm tra chính xác Mốc Tĩnh (Chỉ kích hoạt khi chuột nằm trong phạm vi sát đường <= 5px)
                let hoveredStatic = null;
                if (canShowStatic && chart1.renderedStaticLevels && chart1.renderedStaticLevels.length > 0) {
                    for (let lvl of chart1.renderedStaticLevels) {
                        if (!isKeyLevelLineActive(lvl.lineId || `res_0`, 'static')) continue;
                        try {
                            let pts = chart1.convertToPixel ? chart1.convertToPixel([{ timestamp: dataList[0].timestamp, value: lvl.val }], { paneId: 'candle_pane' }) : null;
                            let pt = (pts && Array.isArray(pts) && pts.length > 0) ? pts[0] : (pts && pt && pt.y !== undefined ? pts : null);
                            if (pt && typeof pt.y === 'number' && Math.abs(mouseY - pt.y) <= 5.5) {
                                hoveredStatic = lvl;
                                break;
                            }
                        } catch(err) {}
                    }
                }

                // 2. Kiểm tra chính xác Mốc Động (Kiểm tra đúng giá trị của curve tại vị trí nến mà chuột đang trỏ vào)
                let hoveredDyn = null;
                if (canShowDynamic && !hoveredStatic && chart1.renderedDynamicLevels && chart1.renderedDynamicLevels.length > 0) {
                    // Lấy vị trí nến tương ứng với mouseX
                    let curBarVal = null;
                    try {
                        if (chart1.convertFromPixel) {
                            let kCoord = chart1.convertFromPixel([{ x: mouseX, y: mouseY }], { paneId: 'candle_pane' });
                            if (kCoord && kCoord[0] && typeof kCoord[0].dataIndex === 'number') {
                                let cIdx = Math.max(0, Math.min(dataList.length - 1, kCoord[0].dataIndex));
                                for (let dyn of chart1.renderedDynamicLevels) {
                                    if (!isKeyLevelLineActive(dyn.id, dyn.group)) continue;
                                    let v = dyn.isAvwap 
                                        ? (dyn.series[cIdx - (dyn.anchorIdx || 0)] ? dyn.series[cIdx - (dyn.anchorIdx || 0)].val : null)
                                        : (dyn.series ? dyn.series[cIdx] : dyn.val);
                                    if (v !== null && v !== undefined) {
                                        let p = chart1.convertToPixel([{ timestamp: dataList[cIdx].timestamp, value: v }], { paneId: 'candle_pane' });
                                        if (p && p[0] && typeof p[0].y === 'number' && Math.abs(mouseY - p[0].y) <= 5.5) {
                                            hoveredDyn = dyn;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    } catch(e) {}
                }

                if (hoveredStatic) {
                    let tipContent = getKeyLevelInsightHtml(hoveredStatic);
                    showTrendTip(e, tipContent);
                    activeKeyLevelTip = true;
                } else if (hoveredDyn) {
                    let tipContent = getDynamicLevelInsightHtml(hoveredDyn);
                    showTrendTip(e, tipContent);
                    activeKeyLevelTip = true;
                } else if (activeKeyLevelTip) {
                    hideTrendTip();
                    activeKeyLevelTip = false;
                }
            });
        })();





if (typeof window !== 'undefined') {
    window.toggleTrend = toggleTrend;
    window.toggleKeyLevel = toggleKeyLevel;
    window.setTrendTfFilter = setTrendTfFilter;
    window.toggleTrendChannelOption = toggleTrendChannelOption;
    window.toggleTrendHudMatrix = toggleTrendHudMatrix;
    window.toggleKeyLevelStatic = toggleKeyLevelStatic;
    window.toggleKeyLevelDynamic = toggleKeyLevelDynamic;
    window.setKeyLevelCount = setKeyLevelCount;
    window.toggleKeyLevelHud = toggleKeyLevelHud;
    window.toggleKeyLevelHudCollapse = toggleKeyLevelHudCollapse;
    window.toggleKeyLevelGroup = toggleKeyLevelGroup;
    window.toggleKeyLevelLine = toggleKeyLevelLine;
    window.toggleKeyLevelSection = toggleKeyLevelSection;
    window.showHudSpecificStaticHover = showHudSpecificStaticHover;
    window.showKeyLevelRrTooltip = showKeyLevelRrTooltip;
    window.focusTrendHudItem = focusTrendHudItem;
    window.runTrend = runTrend;
    window.runKeyLevel = runKeyLevel;
    window.clearTrendOverlays = clearTrendOverlays;
    window.clearKeyLevelOverlays = clearKeyLevelOverlays;
    window.updateProSidebarItemStates = updateProSidebarItemStates;
}
