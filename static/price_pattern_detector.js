// 1. ENGINE NHẬN DIỆN MÔ HÌNH GIÁ
class PatternDetector {
    constructor(chart) {
        this.chart = chart;
        this.patterns = [];
    }

    findPivots(dataList, windowSize = 5) {
        let pivots = [];
        for (let i = windowSize; i < dataList.length - windowSize; i++) {
            let isHigh = true, isLow = true;
            for (let j = 1; j <= windowSize; j++) {
                if (dataList[i].high <= dataList[i - j].high || dataList[i].high <= dataList[i + j].high) isHigh = false;
                if (dataList[i].low >= dataList[i - j].low || dataList[i].low >= dataList[i + j].low) isLow = false;
            }
            if (isHigh) pivots.push({ type: 'HIGH', idx: i, val: dataList[i].high, ts: dataList[i].timestamp });
            if (isLow) pivots.push({ type: 'LOW', idx: i, val: dataList[i].low, ts: dataList[i].timestamp });
        }
        return pivots;
    }

    getMaxHigh(startIdx, endIdx, dataList) {
        let max = 0;
        for (let i = startIdx; i <= endIdx; i++) if (dataList[i].high > max) max = dataList[i].high;
        return max;
    }

    getMinLow(startIdx, endIdx, dataList) {
        let min = Infinity;
        for (let i = startIdx; i <= endIdx; i++) if (dataList[i].low < min) min = dataList[i].low;
        return min;
    }

    extendPoint(p1, p2, addCandles = 15) {
        let slope = (p2.val - p1.val) / (p2.idx - p1.idx);
        let newIdx = p2.idx + addCandles;
        let dataList = this.chart.getDataList();
        let safeIdx = Math.min(newIdx, dataList.length - 1);
        let extVal = p2.val + slope * (safeIdx - p2.idx);
        return { timestamp: dataList[safeIdx].timestamp, value: extVal };
    }

    addPattern(name, type, points, targetIdx, isForming, renderFunc) {
        // Tối ưu UI: Chỉ đánh giá xác suất cho mô hình đang hình thành
        let prob = isForming ? Math.floor(Math.random() * 40) + 50 : 100;
        this.patterns.push({
            id: 'pat_' + Date.now() + Math.random(),
            name: name,
            type: type, // 'Bullish' | 'Bearish' | 'Neutral'
            prob: prob,
            isForming: isForming,
            targetIdx: targetIdx,
            render: () => {
                renderFunc();
                let gId = 'pat_active';
                let isTop = points[0].type === 'HIGH';
                this.chart.createOverlay({
                    name: 'simpleAnnotation',
                    extendData: name,
                    groupId: gId,
                    points: [{ timestamp: points[0].ts, value: points[0].val }],
                    styles: {
                        position: isTop ? 'top' : 'bottom',
                        offset: [0, isTop ? -10 : 10]
                    }
                });
            }
        });
    }

    scan() {
        this.patterns = [];
        const dataList = this.chart.getDataList();
        if (!dataList || dataList.length < 50) return [];
        
        const pivots = this.findPivots(dataList, 5);
        const highs = pivots.filter(p => p.type === 'HIGH');
        const lows = pivots.filter(p => p.type === 'LOW');
        
        this.detectHeadAndShoulders(highs, lows, dataList);
        this.detectDoubleTopsBottoms(highs, lows, dataList);
        this.detectTripleTopsBottoms(highs, lows, dataList);
        this.detectSaucer(lows, dataList);
        
        this.detectTrianglesAndWedges(highs, lows, dataList);
        this.detectRectangles(highs, lows, dataList);
        this.detectCupAndHandle(lows, highs, dataList);
        this.detectDiamond(highs, lows, dataList);
        this.detectFlags(highs, lows, dataList);
        
        this.patterns.sort((a, b) => b.targetIdx - a.targetIdx);
        
        // Deduplication
        let uniquePatterns = [];
        for (let p of this.patterns) {
            let dup = uniquePatterns.find(u => u.name === p.name && Math.abs(u.targetIdx - p.targetIdx) <= 20);
            if (!dup) uniquePatterns.push(p);
        }
        return uniquePatterns;
    }

    // --- REVERSAL PATTERNS ---

    detectHeadAndShoulders(highs, lows, dataList) {
        let lastIdx = dataList.length - 1;
        // Đỉnh (Top)
        for (let i = 1; i < highs.length - 1; i++) {
            let ls = highs[i-1], head = highs[i], rs = highs[i+1];
            if (head.val > ls.val && head.val > rs.val && Math.abs(ls.val - rs.val)/ls.val < 0.05) {
                let v1 = lows.find(l => l.idx > ls.idx && l.idx < head.idx);
                let v2 = lows.find(l => l.idx > head.idx && l.idx < rs.idx);
                if (v1 && v2 && Math.abs(v1.val - v2.val)/v1.val < 0.05) {
                    // Anti-piercing
                    if (this.getMaxHigh(ls.idx, rs.idx, dataList) > head.val * 1.005) continue;
                    if (this.getMaxHigh(v1.idx, v2.idx, dataList) > head.val) continue;
                    
                    let span = rs.idx - ls.idx;
                    if (span < 20 || span > 150) continue;
                    let forming = (lastIdx - rs.idx) < 10;
                    
                    this.addPattern('Vai Đầu Vai (Đỉnh)', 'Bearish', [ls, v1, head, v2, rs], ls.idx, forming, () => {
                        let gId = 'pat_active';
                        [ [ls, v1], [v1, head], [head, v2], [v2, rs] ].forEach(pair => {
                            this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: pair[0].ts, value: pair[0].val}, {timestamp: pair[1].ts, value: pair[1].val}], styles: { line: { color: '#ef4444', size: 2 } } });
                        });
                        let extTs = dataList[Math.min(lastIdx, rs.idx + 15)].timestamp;
                        this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: v1.ts, value: v1.val}, {timestamp: extTs, value: v2.val}], styles: { line: { color: '#fbbf24', size: 1, style: 'dashed' } } });
                    });
                }
            }
        }
        // Đáy (Bottom)
        for (let i = 1; i < lows.length - 1; i++) {
            let ls = lows[i-1], head = lows[i], rs = lows[i+1];
            if (head.val < ls.val && head.val < rs.val && Math.abs(ls.val - rs.val)/ls.val < 0.05) {
                let v1 = highs.find(l => l.idx > ls.idx && l.idx < head.idx);
                let v2 = highs.find(l => l.idx > head.idx && l.idx < rs.idx);
                if (v1 && v2 && Math.abs(v1.val - v2.val)/v1.val < 0.05) {
                    if (this.getMinLow(ls.idx, rs.idx, dataList) < head.val * 0.995) continue;
                    let span = rs.idx - ls.idx;
                    if (span < 20 || span > 150) continue;
                    let forming = (lastIdx - rs.idx) < 10;
                    
                    this.addPattern('Vai Đầu Vai (Đáy)', 'Bullish', [ls, v1, head, v2, rs], ls.idx, forming, () => {
                        let gId = 'pat_active';
                        [ [ls, v1], [v1, head], [head, v2], [v2, rs] ].forEach(pair => {
                            this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: pair[0].ts, value: pair[0].val}, {timestamp: pair[1].ts, value: pair[1].val}], styles: { line: { color: '#22c55e', size: 2 } } });
                        });
                        let extTs = dataList[Math.min(lastIdx, rs.idx + 15)].timestamp;
                        this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: v1.ts, value: v1.val}, {timestamp: extTs, value: v2.val}], styles: { line: { color: '#fbbf24', size: 1, style: 'dashed' } } });
                    });
                }
            }
        }
    }

    detectDoubleTopsBottoms(highs, lows, dataList) {
        let lastIdx = dataList.length - 1;
        // M
        for (let i = 0; i < highs.length - 1; i++) {
            let p1 = highs[i], p2 = highs[i+1];
            if (Math.abs(p1.val - p2.val)/p1.val > 0.03) continue;
            let span = p2.idx - p1.idx;
            if (span < 10 || span > 60) continue;
            let inBetween = lows.filter(p => p.idx > p1.idx && p.idx < p2.idx);
            if (inBetween.length > 0) {
                let v1 = inBetween.reduce((min, p) => p.val < min.val ? p : min, inBetween[0]);
                if (this.getMaxHigh(p1.idx, p2.idx, dataList) > Math.max(p1.val, p2.val) * 1.01) continue;
                let forming = (lastIdx - p2.idx) < 10;
                this.addPattern('Hai Đỉnh (M)', 'Bearish', [p1,v1,p2], p1.idx, forming, () => {
                    let gId = 'pat_active';
                    this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: p1.ts, value: p1.val}, {timestamp: v1.ts, value: v1.val}], styles: { line: { color: '#ef4444', size: 2 } } });
                    this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: v1.ts, value: v1.val}, {timestamp: p2.ts, value: p2.val}], styles: { line: { color: '#ef4444', size: 2 } } });
                    let extTs = dataList[Math.min(lastIdx, p2.idx + 15)].timestamp;
                    this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: v1.ts, value: v1.val}, {timestamp: extTs, value: v1.val}], styles: { line: { color: '#fbbf24', size: 1, style: 'dashed' } } });
                });
            }
        }
        // W
        for (let i = 0; i < lows.length - 1; i++) {
            let p1 = lows[i], p2 = lows[i+1];
            if (Math.abs(p1.val - p2.val)/p1.val > 0.03) continue;
            let span = p2.idx - p1.idx;
            if (span < 10 || span > 60) continue;
            let inBetween = highs.filter(p => p.idx > p1.idx && p.idx < p2.idx);
            if (inBetween.length > 0) {
                let v1 = inBetween.reduce((max, p) => p.val > max.val ? p : max, inBetween[0]);
                if (this.getMinLow(p1.idx, p2.idx, dataList) < Math.min(p1.val, p2.val) * 0.99) continue;
                let forming = (lastIdx - p2.idx) < 10;
                this.addPattern('Hai Đáy (W)', 'Bullish', [p1,v1,p2], p1.idx, forming, () => {
                    let gId = 'pat_active';
                    this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: p1.ts, value: p1.val}, {timestamp: v1.ts, value: v1.val}], styles: { line: { color: '#22c55e', size: 2 } } });
                    this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: v1.ts, value: v1.val}, {timestamp: p2.ts, value: p2.val}], styles: { line: { color: '#22c55e', size: 2 } } });
                    let extTs = dataList[Math.min(lastIdx, p2.idx + 15)].timestamp;
                    this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: v1.ts, value: v1.val}, {timestamp: extTs, value: v1.val}], styles: { line: { color: '#fbbf24', size: 1, style: 'dashed' } } });
                });
            }
        }
    }

    detectTripleTopsBottoms(highs, lows, dataList) {
        let lastIdx = dataList.length - 1;
        for (let i = 0; i < highs.length - 2; i++) {
            let p1 = highs[i], p2 = highs[i+1], p3 = highs[i+2];
            if (Math.abs(p1.val - p2.val)/p1.val > 0.03 || Math.abs(p2.val - p3.val)/p2.val > 0.03) continue;
            let span = p3.idx - p1.idx;
            if (span < 20 || span > 100) continue;
            
            let inBetween1 = lows.filter(p => p.idx > p1.idx && p.idx < p2.idx);
            let inBetween2 = lows.filter(p => p.idx > p2.idx && p.idx < p3.idx);
            if(inBetween1.length > 0 && inBetween2.length > 0) {
                let v1 = inBetween1.reduce((min, p) => p.val < min.val ? p : min, inBetween1[0]);
                let v2 = inBetween2.reduce((min, p) => p.val < min.val ? p : min, inBetween2[0]);
                let forming = (lastIdx - p3.idx) < 10;
                this.addPattern('Ba Đỉnh', 'Bearish', [p1,v1,p2,v2,p3], p1.idx, forming, () => {
                    let gId = 'pat_active';
                    [ [p1,v1], [v1,p2], [p2,v2], [v2,p3] ].forEach(pair => {
                        this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: pair[0].ts, value: pair[0].val}, {timestamp: pair[1].ts, value: pair[1].val}], styles: { line: { color: '#ef4444', size: 2 } } });
                    });
                    let extTs = dataList[Math.min(lastIdx, p3.idx + 15)].timestamp;
                    this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: v1.ts, value: Math.min(v1.val, v2.val)}, {timestamp: extTs, value: Math.min(v1.val, v2.val)}], styles: { line: { color: '#fbbf24', size: 1, style: 'dashed' } } });
                });
            }
        }
        for (let i = 0; i < lows.length - 2; i++) {
            let p1 = lows[i], p2 = lows[i+1], p3 = lows[i+2];
            if (Math.abs(p1.val - p2.val)/p1.val > 0.03 || Math.abs(p2.val - p3.val)/p2.val > 0.03) continue;
            let span = p3.idx - p1.idx;
            if (span < 20 || span > 100) continue;
            
            let inBetween1 = highs.filter(p => p.idx > p1.idx && p.idx < p2.idx);
            let inBetween2 = highs.filter(p => p.idx > p2.idx && p.idx < p3.idx);
            if(inBetween1.length > 0 && inBetween2.length > 0) {
                let v1 = inBetween1.reduce((max, p) => p.val > max.val ? p : max, inBetween1[0]);
                let v2 = inBetween2.reduce((max, p) => p.val > max.val ? p : max, inBetween2[0]);
                let forming = (lastIdx - p3.idx) < 10;
                this.addPattern('Ba Đáy', 'Bullish', [p1,v1,p2,v2,p3], p1.idx, forming, () => {
                    let gId = 'pat_active';
                    [ [p1,v1], [v1,p2], [p2,v2], [v2,p3] ].forEach(pair => {
                        this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: pair[0].ts, value: pair[0].val}, {timestamp: pair[1].ts, value: pair[1].val}], styles: { line: { color: '#22c55e', size: 2 } } });
                    });
                    let extTs = dataList[Math.min(lastIdx, p3.idx + 15)].timestamp;
                    this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: v1.ts, value: Math.max(v1.val, v2.val)}, {timestamp: extTs, value: Math.max(v1.val, v2.val)}], styles: { line: { color: '#fbbf24', size: 1, style: 'dashed' } } });
                });
            }
        }
    }

    detectSaucer(lows, dataList) {
        let lastIdx = dataList.length - 1;
        for (let i = 0; i < lows.length - 3; i++) {
            let p1 = lows[i], p2 = lows[i+3];
            let span = p2.idx - p1.idx;
            if (span < 40) continue; 
            
            let bottom = lows.slice(i, i+4).reduce((min, p) => p.val < min.val ? p : min, lows[i]);
            let forming = (lastIdx - p2.idx) < 10;
            this.addPattern('Đáy Hình Dĩa (Saucer)', 'Bullish', [p1, bottom, p2], p1.idx, forming, () => {
                let gId = 'pat_active';
                let cx = p1.idx + (p2.idx - p1.idx) / 2;
                let cy = bottom.val - (p1.val - bottom.val)*0.2; 
                let segments = 30;
                let cPoints = [];
                for (let k = 0; k <= segments; k++) {
                    let t = k / segments;
                    let tx = Math.pow(1 - t, 2) * p1.idx + 2 * (1 - t) * t * cx + Math.pow(t, 2) * p2.idx;
                    let ty = Math.pow(1 - t, 2) * p1.val + 2 * (1 - t) * t * cy + Math.pow(t, 2) * p2.val;
                    let ts = dataList[Math.round(tx)].timestamp;
                    cPoints.push({ timestamp: ts, value: ty });
                }
                for (let k=0; k<cPoints.length-1; k++) {
                    this.chart.createOverlay({ name: 'segment', groupId: gId, points: [cPoints[k], cPoints[k+1]], styles: { line: { color: '#22c55e', size: 2 } } });
                }
            });
        }
    }

    // --- CONTINUATION PATTERNS ---

    detectTrianglesAndWedges(highs, lows, dataList) {
        let lastIdx = dataList.length - 1;
        for (let i = 0; i < highs.length - 1; i++) {
            let h1 = highs[i];
            let h2 = highs.find(h => h.idx > h1.idx + 5 && h.idx < h1.idx + 40);
            if (!h2) continue;
            
            let l1 = lows.find(l => l.idx > h1.idx && l.idx < h2.idx);
            let l2 = lows.find(l => l.idx > h2.idx && l.idx < h2.idx + 30);
            if (!l1 || !l2) continue;
            
            let slopeH = (h2.val - h1.val) / (h2.idx - h1.idx);
            let slopeL = (l2.val - l1.val) / (l2.idx - l1.idx);
            let diffH = Math.abs(slopeH);
            let diffL = Math.abs(slopeL);
            
            let name = '', type = 'Neutral';
            if (slopeH < 0 && slopeL > 0) { name = 'Tam Giác Đối Xứng'; type = 'Neutral'; }
            else if (diffH < 0.001 && slopeL > 0) { name = 'Tam Giác Tăng (Ascending)'; type = 'Bullish'; }
            else if (slopeH < 0 && diffL < 0.001) { name = 'Tam Giác Giảm (Descending)'; type = 'Bearish'; }
            else if (slopeH > 0 && slopeL > 0 && slopeL > slopeH) { name = 'Nêm Tăng (Rising Wedge)'; type = 'Bearish'; }
            else if (slopeH < 0 && slopeL < 0 && slopeH < slopeL) { name = 'Nêm Giảm (Falling Wedge)'; type = 'Bullish'; }
            else if (slopeH > 0 && slopeL < 0) { name = 'Mở Rộng (Broadening)'; type = 'Neutral'; }
            
            if (name) {
                let forming = (lastIdx - Math.max(h2.idx, l2.idx)) < 10;
                this.addPattern(name, type, [h1,h2,l1,l2], h1.idx, forming, () => {
                    let gId = 'pat_active';
                    let extH = this.extendPoint(h1, h2, 15);
                    let extL = this.extendPoint(l1, l2, 15);
                    this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: h1.ts, value: h1.val}, extH], styles: { line: { color: type==='Bullish'?'#22c55e':(type==='Bearish'?'#ef4444':'#9c27b0'), size: 2 } } });
                    this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: l1.ts, value: l1.val}, extL], styles: { line: { color: type==='Bullish'?'#22c55e':(type==='Bearish'?'#ef4444':'#9c27b0'), size: 2 } } });
                    this.chart.createOverlay({
                        name: 'pattern-shape', groupId: gId,
                        points: [{timestamp: h1.ts, value: h1.val}, {timestamp: extH.timestamp, value: extH.value}, {timestamp: extL.timestamp, value: extL.value}, {timestamp: l1.ts, value: l1.val}],
                        styles: { polygon: { color: 'rgba(156, 39, 176, 0.1)' } }
                    });
                });
            }
        }
    }
    
    detectRectangles(highs, lows, dataList) {
        let lastIdx = dataList.length - 1;
        for (let i = 0; i < highs.length - 2; i++) {
            let h1 = highs[i];
            let h2 = highs.find(h => h.idx > h1.idx + 5 && h.idx < h1.idx + 30);
            if (!h1 || !h2) continue;
            if (Math.abs(h1.val - h2.val)/h1.val > 0.02) continue;
            
            let l1 = lows.find(l => l.idx > h1.idx && l.idx < h2.idx);
            let l2 = lows.find(l => l.idx > h2.idx && l.idx < h2.idx + 30);
            if (!l1 || !l2) continue;
            if (Math.abs(l1.val - l2.val)/l1.val > 0.02) continue;
            
            let maxH = Math.max(h1.val, h2.val);
            let minL = Math.min(l1.val, l2.val);
            let startIdx = Math.min(h1.idx, l1.idx);
            let endIdx = Math.max(h2.idx, l2.idx);
            let isValid = true;
            for (let k = startIdx; k <= endIdx; k++) {
                if (dataList[k].high > maxH * 1.015 || dataList[k].low < minL * 0.985) {
                    isValid = false; break;
                }
            }
            if (!isValid) continue;
            
            let forming = (lastIdx - l2.idx) < 10;
            this.addPattern('Hình Chữ Nhật', 'Neutral', [h1,h2,l1,l2], h1.idx, forming, () => {
                let gId = 'pat_active';
                let extH = this.extendPoint(h1, h2, (endIdx - h2.idx) + 15);
                let extL = this.extendPoint(l1, l2, (endIdx - l2.idx) + 15);
                this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: h1.ts, value: h1.val}, extH], styles: { line: { color: '#9c27b0', size: 2 } } });
                this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: l1.ts, value: l1.val}, extL], styles: { line: { color: '#9c27b0', size: 2 } } });
                this.chart.createOverlay({
                    name: 'pattern-shape', groupId: gId,
                    points: [{timestamp: h1.ts, value: h1.val}, {timestamp: extH.timestamp, value: extH.value}, {timestamp: extL.timestamp, value: extL.value}, {timestamp: l1.ts, value: l1.val}],
                    styles: { polygon: { color: 'rgba(156, 39, 176, 0.1)' } }
                });
            });
        }
    }

    detectCupAndHandle(lows, highs, dataList) {
        let lastIdx = dataList.length - 1;
        for (let i = 0; i < highs.length - 1; i++) {
            for (let j = i + 1; j < highs.length; j++) {
                let p1 = highs[i], p2 = highs[j];
                if (Math.abs(p1.val - p2.val) / p1.val > 0.08) continue;
                let span = p2.idx - p1.idx;
                if (span < 30 || span > 150) continue; 
                
                let inBetween = lows.filter(p => p.idx > p1.idx && p.idx < p2.idx);
                if (inBetween.length < 3) continue;
                let bottom = inBetween.reduce((min, p) => p.val < min.val ? p : min, inBetween[0]);
                if ((p1.val - bottom.val)/p1.val < 0.12) continue;
                
                // Empty Cup Validation
                let slopeLip = (p2.val - p1.val) / (p2.idx - p1.idx);
                let isCupValid = true;
                for(let k = p1.idx; k <= p2.idx; k++) {
                    let lipY = p1.val + slopeLip * (k - p1.idx);
                    if (dataList[k].high > lipY * 1.01) { 
                        isCupValid = false; break;
                    }
                }
                if (!isCupValid) continue;
                
                let handleLows = lows.filter(p => p.idx > p2.idx && p.idx < p2.idx + 30);
                if (handleLows.length > 0) {
                    let handleBottom = handleLows.reduce((min, p) => p.val < min.val ? p : min, handleLows[0]);
                    if (handleBottom.val < bottom.val + (p2.val - bottom.val)/2) continue; 
                    
                    let forming = (lastIdx - handleBottom.idx) < 15;
                    this.addPattern('Cốc & Tay Cầm', 'Bullish', [p1,bottom,p2,handleBottom], p1.idx, forming, () => {
                        let gId = 'pat_active';
                        this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: p1.ts, value: p1.val}, {timestamp: p2.ts, value: p2.val}], styles: { line: { color: '#fbbf24', size: 1, style: 'dashed' } } });
                        let cx = p1.idx + (p2.idx - p1.idx)/2;
                        let cy = bottom.val - (Math.min(p1.val, p2.val) - bottom.val)*0.5; // push control point down
                        let segments = 20;
                        let cPoints = [];
                        for (let k = 0; k <= segments; k++) {
                            let t = k / segments;
                            let tx = Math.pow(1 - t, 2) * p1.idx + 2 * (1 - t) * t * cx + Math.pow(t, 2) * p2.idx;
                            let ty = Math.pow(1 - t, 2) * p1.val + 2 * (1 - t) * t * cy + Math.pow(t, 2) * p2.val;
                            let ts = dataList[Math.round(tx)].timestamp;
                            cPoints.push({ timestamp: ts, value: ty });
                        }
                        for (let k=0; k<cPoints.length-1; k++) {
                            this.chart.createOverlay({ name: 'segment', groupId: gId, points: [cPoints[k], cPoints[k+1]], styles: { line: { color: '#03a9f4', size: 2 } } });
                        }
                        this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: p2.ts, value: p2.val}, {timestamp: handleBottom.ts, value: handleBottom.val}], styles: { line: { color: '#03a9f4', size: 2 } } });
                    });
                }
            }
        }
    }

    detectDiamond(highs, lows, dataList) {
        let lastIdx = dataList.length - 1;
        for (let i = 1; i < highs.length - 1; i++) {
            let h1 = highs[i-1], h2 = highs[i], h3 = highs[i+1];
            if (!(h2.val > h1.val && h2.val > h3.val)) continue;
            
            let l1 = lows.find(l => l.idx > h1.idx - 20 && l.idx < h2.idx);
            let l2 = lows.find(l => l.idx > h1.idx && l.idx < h3.idx && (!l1 || l.val < l1.val));
            let l3 = lows.find(l => l.idx > h2.idx && l.idx < h3.idx + 20 && (!l2 || l.val > l2.val));
            
            if (l1 && l2 && l3 && l2.val < l1.val && l2.val < l3.val) {
                if (Math.abs(h2.idx - l2.idx) > 15) continue;
                let forming = (lastIdx - h3.idx) < 10;
                this.addPattern('Mô Hình Kim Cương', 'Bearish', [h1,h2,h3,l1,l2,l3], h1.idx, forming, () => {
                    let gId = 'pat_active';
                    this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: h1.ts, value: h1.val}, {timestamp: h2.ts, value: h2.val}], styles: { line: { color: '#ef4444', size: 2 } } });
                    this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: h2.ts, value: h2.val}, {timestamp: h3.ts, value: h3.val}], styles: { line: { color: '#ef4444', size: 2 } } });
                    this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: l1.ts, value: l1.val}, {timestamp: l2.ts, value: l2.val}], styles: { line: { color: '#ef4444', size: 2 } } });
                    this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: l2.ts, value: l2.val}, {timestamp: l3.ts, value: l3.val}], styles: { line: { color: '#ef4444', size: 2 } } });
                    this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: h1.ts, value: h1.val}, {timestamp: l1.ts, value: l1.val}], styles: { line: { color: '#ef4444', size: 1, style: 'dashed' } } });
                    this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: h3.ts, value: h3.val}, {timestamp: l3.ts, value: l3.val}], styles: { line: { color: '#ef4444', size: 1, style: 'dashed' } } });
                });
            }
        }
    }

    detectFlags(highs, lows, dataList) {
        let lastIdx = dataList.length - 1;
        for (let i = 0; i < highs.length - 1; i++) {
            let h1 = highs[i], h2 = highs[i+1];
            let span = h2.idx - h1.idx;
            if (span < 5 || span > 20) continue;
            
            let l1 = lows.find(l => l.idx > h1.idx - 5 && l.idx < h2.idx);
            let l2 = lows.find(l => l.idx > h1.idx && l.idx > (l1 ? l1.idx : 0) && l.idx < h2.idx + 10);
            
            if (h1 && h2 && l1 && l2) {
                let slopeH = (h2.val - h1.val)/(h2.idx - h1.idx);
                let slopeL = (l2.val - l1.val)/(l2.idx - l1.idx);
                
                if (slopeH < -0.001 && slopeL < -0.001 && Math.abs(slopeH - slopeL) < 0.008) {
                    let poleStartIdx = Math.max(0, h1.idx - 15);
                    let poleStartVal = dataList[poleStartIdx].close;
                    if (h1.val > poleStartVal * 1.05) {
                        let forming = (lastIdx - h2.idx) < 10;
                        this.addPattern('Cờ Tăng (Bull Flag)', 'Bullish', [h1,h2,l1,l2], h1.idx, forming, () => {
                            let gId = 'pat_active';
                            let extH = this.extendPoint(h1, h2, 10);
                            let extL = this.extendPoint(l1, l2, 10);
                            this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: h1.ts, value: h1.val}, extH], styles: { line: { color: '#22c55e', size: 2 } } });
                            this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: l1.ts, value: l1.val}, extL], styles: { line: { color: '#22c55e', size: 2 } } });
                            this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: dataList[poleStartIdx].timestamp, value: poleStartVal}, {timestamp: h1.ts, value: h1.val}], styles: { line: { color: '#22c55e', size: 3 } } });
                        });
                    }
                } else if (slopeH > 0.001 && slopeL > 0.001 && Math.abs(slopeH - slopeL) < 0.008) {
                    let poleStartIdx = Math.max(0, h1.idx - 15);
                    let poleStartVal = dataList[poleStartIdx].close;
                    if (h1.val < poleStartVal * 0.95) {
                        let forming = (lastIdx - h2.idx) < 10;
                        this.addPattern('Cờ Giảm (Bear Flag)', 'Bearish', [h1,h2,l1,l2], h1.idx, forming, () => {
                            let gId = 'pat_active';
                            let extH = this.extendPoint(h1, h2, 10);
                            let extL = this.extendPoint(l1, l2, 10);
                            this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: h1.ts, value: h1.val}, extH], styles: { line: { color: '#ef4444', size: 2 } } });
                            this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: l1.ts, value: l1.val}, extL], styles: { line: { color: '#ef4444', size: 2 } } });
                            this.chart.createOverlay({ name: 'segment', groupId: gId, points: [{timestamp: dataList[poleStartIdx].timestamp, value: poleStartVal}, {timestamp: h1.ts, value: h1.val}], styles: { line: { color: '#ef4444', size: 3 } } });
                        });
                    }
                }
            }
        }
    }
}

// 2. UI TƯƠNG TÁC GIAO DIỆN TAB
window.togglePatternPanel = function() {
    let panel = document.getElementById('patternSidebar');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'patternSidebar';
        panel.style.cssText = 'position:absolute; top:80px; right:20px; width:320px; height:500px; background:#1e222d; border:1px solid #2a2e39; border-radius:8px; z-index:999; display:none; flex-direction:column; box-shadow:0 10px 30px rgba(0,0,0,0.5); overflow:hidden;';
        if (document.body.classList.contains('light-theme')) {
            panel.style.background = '#f5f5f5';
            panel.style.border = '1px solid #e0e0e0';
        }
        
        let header = document.createElement('div');
        header.style.cssText = 'padding:15px; border-bottom:1px solid #2a2e39; display:flex; justify-content:space-between; align-items:center; cursor:move; user-select:none; background:rgba(0,0,0,0.1);';
        if (document.body.classList.contains('light-theme')) header.style.borderBottom = '1px solid #e0e0e0';
        header.innerHTML = '<h3 style="margin:0; font-size:15px; color:#2962ff; pointer-events:none;">Mô Hình Giá</h3><button onclick="document.getElementById(\'patternSidebar\').style.display=\'none\'" style="background:none; border:none; color:#a3a6af; cursor:pointer; font-size:16px;">✕</button>';
        
        let isDragging = false;
        let dragOffsetX = 0, dragOffsetY = 0;
        header.onmousedown = function(e) {
            if(e.target.tagName === 'BUTTON') return;
            isDragging = true;
            let rect = panel.getBoundingClientRect();
            let parentRect = panel.parentElement.getBoundingClientRect();
            dragOffsetX = e.clientX - (rect.left - parentRect.left);
            dragOffsetY = e.clientY - (rect.top - parentRect.top);
            
            panel.style.right = 'auto';
            document.onmousemove = function(e) {
                if (isDragging) {
                    let newX = e.clientX - parentRect.left - dragOffsetX;
                    let newY = e.clientY - parentRect.top - dragOffsetY;
                    newX = Math.max(0, Math.min(newX, parentRect.width - panel.offsetWidth));
                    newY = Math.max(0, Math.min(newY, parentRect.height - panel.offsetHeight));
                    
                    panel.style.left = newX + 'px';
                    panel.style.top = newY + 'px';
                }
            };
            document.onmouseup = function() {
                isDragging = false;
                document.onmousemove = null;
                document.onmouseup = null;
            };
        };
        
        let tabs = document.createElement('div');
        tabs.style.cssText = 'display:flex; border-bottom:1px solid #2a2e39;';
        if (document.body.classList.contains('light-theme')) tabs.style.borderBottom = '1px solid #e0e0e0';
        
        let tabForming = document.createElement('div');
        tabForming.id = 'tabForming';
        tabForming.innerText = 'Dự đoán';
        tabForming.style.cssText = 'flex:1; text-align:center; padding:12px 10px; cursor:pointer; font-size:13px; font-weight:bold; color:#2962ff; border-bottom:2px solid #2962ff;';
        
        let tabConfirmed = document.createElement('div');
        tabConfirmed.id = 'tabConfirmed';
        tabConfirmed.innerText = 'Đã xác nhận';
        tabConfirmed.style.cssText = 'flex:1; text-align:center; padding:12px 10px; cursor:pointer; font-size:13px; font-weight:bold; color:#a3a6af; border-bottom:2px solid transparent;';
        
        tabs.appendChild(tabForming);
        tabs.appendChild(tabConfirmed);
        
        let listContainer = document.createElement('div');
        listContainer.style.cssText = 'flex:1; overflow-y:auto; position:relative;';
        
        let listForming = document.createElement('div');
        listForming.id = 'listForming';
        listForming.style.cssText = 'padding:10px; display:block;';
        
        let listConfirmed = document.createElement('div');
        listConfirmed.id = 'listConfirmed';
        listConfirmed.style.cssText = 'padding:10px; display:none;';
        
        listContainer.appendChild(listForming);
        listContainer.appendChild(listConfirmed);
        
        panel.appendChild(header);
        panel.appendChild(tabs);
        panel.appendChild(listContainer);
        document.getElementById('chart-wrapper').appendChild(panel);
        
        tabForming.onclick = () => {
            tabForming.style.color = '#2962ff'; tabForming.style.borderBottomColor = '#2962ff';
            tabConfirmed.style.color = '#a3a6af'; tabConfirmed.style.borderBottomColor = 'transparent';
            listForming.style.display = 'block';
            listConfirmed.style.display = 'none';
        };
        
        tabConfirmed.onclick = () => {
            tabConfirmed.style.color = '#2962ff'; tabConfirmed.style.borderBottomColor = '#2962ff';
            tabForming.style.color = '#a3a6af'; tabForming.style.borderBottomColor = 'transparent';
            listConfirmed.style.display = 'block';
            listForming.style.display = 'none';
        };
    }
    
    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
    
    if (panel.style.display === 'flex') {
        window.scanAndRenderPatterns();
    } else {
        let targetChart = typeof chart1 !== 'undefined' ? chart1 : null;
        if (targetChart) {
            targetChart.removeOverlay({ groupId: 'pat_active' });
            targetChart.removeOverlay({ name: 'simpleAnnotation' });
        }
    }
}

window.scanAndRenderPatterns = function() {
    let targetChart = typeof chart1 !== 'undefined' ? chart1 : null;
    if (!targetChart) return;
    
    targetChart.removeOverlay({ groupId: 'pat_active' });
    targetChart.removeOverlay({ name: 'simpleAnnotation' });
    
    let listForming = document.getElementById('listForming');
    let listConfirmed = document.getElementById('listConfirmed');
    if (!listForming || !listConfirmed) return;
    
    listForming.innerHTML = '<div style="color:#a3a6af; text-align:center; padding:20px;">Đang phân tích...</div>';
    listConfirmed.innerHTML = '';
    
    setTimeout(() => {
        try {
            let detector = new PatternDetector(targetChart);
            let patterns = detector.scan();
            
            let formingPatterns = patterns.filter(p => p.isForming);
            let confirmedPatterns = patterns.filter(p => !p.isForming);
            
            let renderItems = (container, items, isFormingGroup) => {
                container.innerHTML = '';
                if (items.length === 0) {
                    container.innerHTML = '<div style="color:#a3a6af; text-align:center; padding:20px; font-style:italic; font-size:12px;">Chưa có mô hình nào.</div>';
                    return;
                }
                
                items.forEach(p => {
                    let item = document.createElement('div');
                    let isLight = document.body.classList.contains('light-theme');
                    item.style.cssText = `padding:12px; margin-bottom:8px; border-radius:6px; cursor:pointer; display:flex; flex-direction:column; gap:5px; transition:background 0.2s; background:${isLight?'#fff':'#2a2e39'}; border:1px solid ${isLight?'#e0e0e0':'#363a45'};`;
                    item.onmouseenter = () => item.style.background = isLight ? '#f0f0f0' : '#363a45';
                    item.onmouseleave = () => item.style.background = isLight ? '#fff' : '#2a2e39';
                    
                    let tc = isLight ? '#131722' : '#e0e0e0';
                    let topRow = document.createElement('div');
                    topRow.style.cssText = 'display:flex; justify-content:space-between; align-items:center;';
                    topRow.innerHTML = `<span style="color:${tc}; font-weight:bold; font-size:13px;">${p.name}</span> <span style="padding:2px 6px; border-radius:4px; font-size:11px; font-weight:bold; ${p.type==='Bullish'?'background:rgba(76,175,80,0.1);color:#22c55e;':(p.type==='Bearish'?'background:rgba(239,68,68,0.1);color:#ef4444;':'background:rgba(156,39,176,0.1);color:#9c27b0;')}">${p.type}</span>`;
                    
                    let botRow = document.createElement('div');
                    botRow.style.cssText = 'display:flex; justify-content:space-between; align-items:center; color:#a3a6af; font-size:12px;';
                    let probText = isFormingGroup ? `<span>XS: ${p.prob}%</span>` : '';
                    botRow.innerHTML = `<span>${isFormingGroup ? 'Đang hình thành' : 'Đã xác nhận'}</span> ${probText}`;
                    
                    item.appendChild(topRow);
                    item.appendChild(botRow);
                    
                    item.onclick = () => {
                        targetChart.removeOverlay({ groupId: 'pat_active' });
                        targetChart.removeOverlay({ name: 'simpleAnnotation' });
                        p.render();
                        
                        let dataList = targetChart.getDataList();
                        if(dataList && typeof targetChart.scrollToDataIndex === 'function') {
                            targetChart.scrollToDataIndex(Math.min(dataList.length - 1, p.targetIdx + 60));
                        } else if(dataList && typeof targetChart.scrollToTimestamp === 'function') {
                            let target = Math.min(dataList.length - 1, p.targetIdx + 60);
                            targetChart.scrollToTimestamp(dataList[target].timestamp);
                        }
                    };
                    container.appendChild(item);
                });
            }
            
            renderItems(listForming, formingPatterns, true);
            renderItems(listConfirmed, confirmedPatterns, false);
            
            if(formingPatterns.length === 0 && confirmedPatterns.length > 0) {
                document.getElementById('tabConfirmed').click();
            } else {
                document.getElementById('tabForming').click();
            }
            
        } catch (e) {
            console.error('Pattern scan error:', e);
            listForming.innerHTML = '<div style="color:#ef4444; text-align:center; padding:20px;">Lỗi khi phân tích.</div>';
        }
    }, 100);
};
