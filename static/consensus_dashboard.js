// ==========================================
// CONSENSUS DASHBOARD (SO SÁNH CÁC CTCK)
// ==========================================

window.triggerConsensusFetch = async function() {
    const root = document.getElementById('consensus-dashboard-root');
    if (!root) return;

    let symbol = '';
    try {
        const badge = document.getElementById('valModalSymbolBadge');
        if (badge && badge.innerText && badge.innerText.trim() !== 'ĐANG TẢI...') {
            symbol = badge.innerText.trim().toUpperCase();
        }
    } catch (e) {}
    if (!symbol || symbol === 'VNINDEX' || symbol === 'ĐANG TẢI...') {
        try {
            symbol = document.getElementById('currentSymbolDisplay').innerText.trim().toUpperCase();
        } catch (e) {}
    }

    if (!symbol || symbol === 'VNINDEX' || symbol === 'ĐANG TẢI...') {
        root.innerHTML = '<div style="text-align: center; color: #888; padding: 40px;">Vui lòng chọn một mã cổ phiếu cụ thể để so sánh định giá CTCK.</div>';
        return;
    }
    
    // Get CMP (Current Market Price)
    let cmp = 0;
    if (window.ValuationRedesign && window.ValuationRedesign.currentCmp) {
        cmp = window.ValuationRedesign.currentCmp;
    }
    if (!cmp) {
        try {
            const cmpEl = document.getElementById('valModalCmpText');
            if (cmpEl && cmpEl.innerText) {
                const s = cmpEl.innerText.replace(/[^0-9]/g, '');
                if (s) cmp = parseFloat(s);
            }
        } catch(e) {}
    }
    if (!cmp) {
        try {
            const priceStr = document.getElementById('sisPrice').innerText.trim();
            if (priceStr && priceStr !== '-') {
                cmp = parseFloat(priceStr.replace(/,/g, '')) * 1000;
            }
        } catch(e) {}
    }
    if (!cmp || isNaN(cmp)) cmp = 0;

    root.innerHTML = `<div style="text-align: center; color: #29b6f6; padding: 50px;"><i class="fas fa-spinner fa-spin" style="font-size: 26px; margin-bottom: 12px;"></i><br><span style="font-size: 13.5px; font-weight: 600;">Đang tổng hợp dữ liệu định giá từ các CTCK...</span></div>`;

    try {
        const t = new Date().getTime();
        const res = await fetch(`/api/analysis_reports?symbol=${symbol}&_t=${t}`);
        const result = await res.json();
        
        let rawReports = result.reports || result.company_reports || [];
        if (!rawReports || rawReports.length === 0) {
            root.innerHTML = `<div style="text-align: center; color: #8b949e; padding: 50px; font-size: 14px;">Chưa có báo cáo phân tích nào cho mã <b>${symbol}</b>.</div>`;
            return;
        }

        // Extract valid reports with target prices
        const validReports = [];
        const seenSources = new Set();

        for (const rep of rawReports) {
            let tpStr = rep.targetPrice || '';
            let title = rep.title || '';
            let source = rep.source || 'CTCK';

            // Try to extract from title if not set
            if (!tpStr || tpStr === '---') {
                const match = title.match(/(?:gi[aá]\s*MT|gi[aá]\s*m[uụ]c\s*ti[eê]u|target\s*price|gi[aá]\s*k[yỳ]\s*v[oọ]ng)[:\s]*([0-9.,]+)/i);
                if (match) {
                    let num = parseFloat(match[1].replace(/\./g, '').replace(/,/g, ''));
                    if (!isNaN(num) && num > 1000) {
                        tpStr = new Intl.NumberFormat('vi-VN').format(num);
                    }
                }
            }

            if (tpStr && tpStr !== '---') {
                let rec = rep.recommendation || 'THEO DÕI';
                // If rec is THEO DÕI, infer from title
                if (rec === 'THEO DÕI' || rec === 'KHÁC') {
                    const tUpper = title.toUpperCase();
                    if (tUpper.includes('MUA') || tUpper.includes('KHẢ QUAN') || tUpper.includes('TÍCH LŨY') || tUpper.includes('OUTPERFORM') || tUpper.includes('BUY')) rec = 'MUA';
                    else if (tUpper.includes('BÁN') || tUpper.includes('KÉM') || tUpper.includes('GIẢM') || tUpper.includes('UNDERPERFORM') || tUpper.includes('SELL')) rec = 'BÁN';
                    else if (tUpper.includes('NẮM GIỮ') || tUpper.includes('TRUNG LẬP') || tUpper.includes('HOLD')) rec = 'NẮM GIỮ';
                }

                validReports.push({
                    source: source,
                    targetPriceStr: tpStr,
                    recommendation: rec,
                    date: rep.date || '',
                    title: title,
                    pdf_url: rep.pdf_url || rep.url || ''
                });
                
                // Chỉ lấy đúng 5 báo cáo mới nhất có giá mục tiêu
                if (validReports.length >= 5) break;
            }
        }

        if (validReports.length === 0) {
            root.innerHTML = `
                <div style="text-align: center; color: #8b949e; padding: 60px 20px;">
                    <div style="font-size: 32px; margin-bottom: 12px;">📊</div>
                    <div style="font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 6px;">Chưa tìm thấy báo cáo nào có Giá mục tiêu rõ ràng</div>
                    <div style="font-size: 13px; color: #8b949e; max-width: 500px; margin: 0 auto;">Các báo cáo gần đây của mã <b>${symbol}</b> mang tính cập nhật KQKD chung mà không công bố định giá cụ thể.</div>
                </div>
            `;
            return;
        }

        const countBadge = document.getElementById('valConsensusCountBadge');
        if (countBadge && validReports.length > 0) {
            countBadge.textContent = '(' + validReports.length + ' Báo Cáo)';
        }
        window.renderConsensusDashboard(validReports, cmp, symbol);
        
    } catch(err) {
        console.error("Lỗi Consensus:", err);
        root.innerHTML = `<div style="text-align: center; color: #ff5252; padding: 40px;">Lỗi tải dữ liệu định giá: ${err.message}</div>`;
    }
};

window.renderConsensusDashboard = function(reports, cmp, symbol) {
    const root = document.getElementById('consensus-dashboard-root');
    if (!root) return;
    
    // Parse target prices
    let tpValues = [];
    let recCounts = { positive: 0, neutral: 0, negative: 0, total: 0 };
    
    const parsedReports = reports.map(r => {
        let tpStr = String(r.targetPriceStr || '0');
        let tpVal = parseFloat(tpStr.replace(/\./g, '').replace(/,/g, ''));
        if (isNaN(tpVal)) tpVal = 0;
        
        let upside = 0;
        if (cmp > 0 && tpVal > 0) {
            upside = ((tpVal - cmp) / cmp) * 100;
        }
        
        if (tpVal > 0) tpValues.push(tpVal);
        
        // Analyze rec
        let rColor = '#ffab00';
        let rClass = 'neutral';
        const rText = (r.recommendation || '').toUpperCase();
        
        if (rText.includes('MUA') || rText.includes('KHẢ QUAN') || rText.includes('TÍCH LŨY') || rText.includes('TĂNG') || rText.includes('OUTPERFORM') || rText.includes('BUY')) {
            rColor = '#00c853'; rClass = 'positive'; recCounts.positive++; recCounts.total++;
        }
        else if (rText.includes('BÁN') || rText.includes('KÉM') || rText.includes('GIẢM') || rText.includes('UNDERPERFORM') || rText.includes('SELL')) {
            rColor = '#ff5252'; rClass = 'negative'; recCounts.negative++; recCounts.total++;
        }
        else {
            rColor = '#ffab00'; rClass = 'neutral'; recCounts.neutral++; recCounts.total++;
        }
        
        return {
            ...r,
            tpVal,
            upside,
            rColor,
            rClass
        };
    });
    
    // Calculate stats
    tpValues.sort((a,b) => a - b);
    let minTp = tpValues[0] || cmp;
    let maxTp = tpValues[tpValues.length - 1] || cmp;
    let medianTp = cmp;
    if (tpValues.length > 0) {
        if (tpValues.length % 2 === 0) {
            medianTp = (tpValues[tpValues.length/2 - 1] + tpValues[tpValues.length/2]) / 2;
        } else {
            medianTp = tpValues[Math.floor(tpValues.length/2)];
        }
    }
    
    let medianUpside = 0;
    if (cmp > 0 && medianTp > 0) medianUpside = ((medianTp - cmp) / cmp) * 100;
    
    // Benjamin Graham Margin of Safety relative to the most conservative (Min) Target Price
    let marginOfSafety = 0;
    if (cmp > 0 && minTp > 0) {
        marginOfSafety = ((minTp - cmp) / cmp) * 100;
    }
    
    const posPct = recCounts.total > 0 ? (recCounts.positive / recCounts.total * 100) : 0;
    const neuPct = recCounts.total > 0 ? (recCounts.neutral / recCounts.total * 100) : 0;
    const negPct = recCounts.total > 0 ? (recCounts.negative / recCounts.total * 100) : 0;
    
    const fmt = (num) => new Intl.NumberFormat('vi-VN').format(Math.round(num));
    const upColor = (val) => val > 15 ? '#00c853' : (val > 0 ? '#ffab00' : '#ff5252');
    const upFormat = (val) => (val > 0 ? '+' : '') + val.toFixed(1) + '%';
    
    // Calculate range bar scale
    const baseMin = cmp > 0 ? Math.min(minTp, cmp) : minTp;
    const baseMax = cmp > 0 ? Math.max(maxTp, cmp) : maxTp;
    const axisMin = baseMin * 0.94;
    const axisMax = baseMax * 1.06;
    let axisRange = axisMax - axisMin;
    if (axisRange <= 0) axisRange = 1;
    
    const minPos = Math.max(4, Math.min(96, ((minTp - axisMin) / axisRange) * 100));
    const maxPos = Math.max(4, Math.min(96, ((maxTp - axisMin) / axisRange) * 100));
    const medianPos = Math.max(4, Math.min(96, ((medianTp - axisMin) / axisRange) * 100));
    const cmpPos = cmp > 0 ? Math.max(4, Math.min(96, ((cmp - axisMin) / axisRange) * 100)) : 50;
    
    let html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #d1d4dc; padding-bottom: 20px;">
        
        <!-- TIER 1: MODERN BENTO KPI CARDS -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px; margin-bottom: 16px;">
            
            <div style="background: linear-gradient(180deg, #181d2a 0%, #121622 100%); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 16px; box-shadow: 0 6px 20px rgba(0,0,0,0.35);">
                <div style="font-size: 11.5px; font-weight: 800; color: #8b949e; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Giá hiện tại (CMP)</div>
                <div id="valConsensusCmpDisplay" style="font-size: 24px; font-weight: 900; color: #ffffff; font-family: monospace;">${fmt(cmp)} ₫</div>
            </div>
            
            <div style="background: linear-gradient(180deg, #181d2a 0%, #121622 100%); border: 1px solid rgba(41, 121, 255, 0.35); border-radius: 12px; padding: 16px; box-shadow: 0 6px 20px rgba(41, 121, 255, 0.12);">
                <div style="font-size: 11.5px; font-weight: 800; color: #40c4ff; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Mục tiêu Trung vị</div>
                <div id="valConsensusMedianTp" style="font-size: 24px; font-weight: 900; color: #40c4ff; font-family: monospace;">${fmt(medianTp)} ₫</div>
            </div>
            
            <div style="background: linear-gradient(180deg, #181d2a 0%, #121622 100%); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 16px; box-shadow: 0 6px 20px rgba(0,0,0,0.35);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <div style="font-size: 11.5px; font-weight: 800; color: #8b949e; text-transform: uppercase; letter-spacing: 0.5px;">Upside kỳ vọng</div>
                    <span style="font-size: 10.5px; font-weight: 700; color: #00c853; background: rgba(0,200,83,0.12); padding: 1px 6px; border-radius: 4px;">${recCounts.positive}/${recCounts.total} MUA</span>
                </div>
                <div id="valConsensusUpside" style="font-size: 24px; font-weight: 900; color: ${upColor(medianUpside)}; font-family: monospace;">${upFormat(medianUpside)}</div>
            </div>
            
            <div style="background: linear-gradient(180deg, ${marginOfSafety > 0 ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 171, 0, 0.1)'} 0%, #121622 100%); border: 1px solid ${marginOfSafety > 0 ? 'rgba(0, 230, 118, 0.35)' : 'rgba(255, 171, 0, 0.35)'}; border-radius: 12px; padding: 16px; box-shadow: 0 6px 20px rgba(0,0,0,0.35);">
                <div style="font-size: 11.5px; font-weight: 800; color: ${marginOfSafety > 0 ? '#69f0ae' : '#ffd54f'}; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 5px;">
                    <span>🛡️</span> BIÊN AN TOÀN TỐI THIỂU
                </div>
                <div id="valConsensusMarginOfSafety" style="font-size: 24px; font-weight: 900; color: ${marginOfSafety > 0 ? '#00e676' : '#ffab00'}; font-family: monospace;">
                    ${marginOfSafety > 0 ? ('+' + marginOfSafety.toFixed(1) + '%') : (marginOfSafety.toFixed(1) + '%')}
                </div>
                <div style="font-size: 10.5px; color: #8b949e; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">So với kịch bản bi quan (${fmt(minTp)} ₫)</div>
            </div>
        </div>
        
        <!-- TIER 2: RANGE BAR SPECTRUM & BENJAMIN GRAHAM MARGIN OF SAFETY -->
        <div style="background: #181d2a; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 20px 24px 24px; margin-bottom: 16px; box-shadow: 0 6px 20px rgba(0,0,0,0.35);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 42px;">
                <div style="font-size: 14px; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 8px;">
                    <span>🎯 Biên Độ Định Giá Của 5 CTCK Gần Nhất</span>
                </div>
                <div style="font-size: 12px; color: #8b949e;">Khoảng dự báo: <b style="color: #40c4ff; font-family: monospace;">${fmt(minTp)} ₫</b> – <b style="color: #00c853; font-family: monospace;">${fmt(maxTp)} ₫</b></div>
            </div>
            
            <div style="position: relative; height: 10px; background: rgba(255,255,255,0.06); border-radius: 5px; margin: 0 20px;">
                <!-- Dải Min-Max -->
                <div style="position: absolute; left: ${minPos}%; right: ${100 - maxPos}%; height: 100%; background: linear-gradient(90deg, #2979ff, #00c853); border-radius: 5px; box-shadow: 0 0 10px rgba(0, 200, 83, 0.3);"></div>
                
                <!-- Điểm Min -->
                <div style="position: absolute; left: ${minPos}%; top: -6px; bottom: -6px; width: 4px; background: #2979ff; border-radius: 2px; transform: translateX(-50%); box-shadow: 0 0 8px #2979ff;" title="Thấp nhất: ${fmt(minTp)} ₫"></div>
                <div style="position: absolute; left: ${minPos}%; top: 18px; font-size: 11px; color: #8b949e; transform: translateX(-50%); text-align: center; white-space: nowrap;">Thấp nhất<br><span style="color:#40c4ff; font-weight: 800; font-family: monospace;">${fmt(minTp)} ₫</span></div>
                
                <!-- Điểm Max -->
                <div style="position: absolute; left: ${maxPos}%; top: -6px; bottom: -6px; width: 4px; background: #00c853; border-radius: 2px; transform: translateX(-50%); box-shadow: 0 0 8px #00c853;" title="Cao nhất: ${fmt(maxTp)} ₫"></div>
                <div style="position: absolute; left: ${maxPos}%; top: 18px; font-size: 11px; color: #8b949e; transform: translateX(-50%); text-align: center; white-space: nowrap;">Cao nhất<br><span style="color:#00c853; font-weight: 800; font-family: monospace;">${fmt(maxTp)} ₫</span></div>
                
                <!-- Trung vị -->
                <div style="position: absolute; left: ${medianPos}%; top: -9px; bottom: -9px; width: 4px; background: #ab47bc; border-radius: 2px; transform: translateX(-50%); box-shadow: 0 0 10px #ab47bc; z-index: 5;" title="Trung vị: ${fmt(medianTp)} ₫"></div>
                <div style="position: absolute; left: ${medianPos}%; top: -26px; font-size: 12px; color: #ce93d8; font-weight: 900; transform: translateX(-50%); text-align: center; white-space: nowrap; font-family: monospace;">Trung vị: ${fmt(medianTp)} ₫</div>
                
                <!-- CMP Marker (Giá hiện tại) -->
                ${cmp > 0 ? `
                <div style="position: absolute; left: ${cmpPos}%; top: -14px; transform: translateX(-50%); z-index: 10;">
                    <div style="width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-top: 10px solid #ffab00; margin: 0 auto; filter: drop-shadow(0 2px 6px rgba(255, 171, 0, 0.6));"></div>
                </div>
                <div style="position: absolute; left: ${cmpPos}%; top: -33px; font-size: 11.5px; font-weight: 900; color: #ffab00; transform: translateX(-50%); text-align: center; white-space: nowrap; font-family: monospace;">Hiện tại: ${fmt(cmp)} ₫</div>
                ` : ''}
            </div>

            <!-- BENJAMIN GRAHAM CALLOUT BANNER -->
            <div id="valGrahamCalloutBanner" style="margin-top: 48px; padding: 14px 18px; border-radius: 10px; background: ${marginOfSafety > 0 ? 'rgba(0, 230, 118, 0.08)' : 'rgba(255, 171, 0, 0.08)'}; border: 1px solid ${marginOfSafety > 0 ? 'rgba(0, 230, 118, 0.25)' : 'rgba(255, 171, 0, 0.25)'}; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                <div style="font-size: 13px; color: ${marginOfSafety > 0 ? '#a7f3d0' : '#ffe082'}; display: flex; align-items: center; gap: 10px; line-height: 1.5;">
                    <span style="font-size: 18px;">🛡️</span>
                    <span><strong>Biên An Toàn Benjamin Graham:</strong> Thị giá <strong style="color: #ffffff; font-family: monospace;">${fmt(cmp)} ₫</strong> ${marginOfSafety > 0 ? `đang nằm thấp hơn <strong style="color: #00e676; font-family: monospace;">${marginOfSafety.toFixed(1)}%</strong> so với kịch bản bi quan nhất (<span style="font-family: monospace;">${fmt(minTp)} ₫</span>).` : `đang cao hơn kịch bản bi quan nhất (${fmt(minTp)} ₫) ${Math.abs(marginOfSafety).toFixed(1)}%.`}</span>
                </div>
                ${marginOfSafety > 0 ? `
                <span id="valSafeZoneBadge" style="padding: 5px 14px; background: rgba(0, 230, 118, 0.2); color: #00e676; font-weight: 800; font-size: 11.5px; border-radius: 6px; border: 1px solid rgba(0, 230, 118, 0.4); text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">
                    VÙNG MUA AN TOÀN
                </span>
                ` : `
                <span id="valSafeZoneBadge" style="padding: 5px 14px; background: rgba(255, 171, 0, 0.2); color: #ffab00; font-weight: 800; font-size: 11.5px; border-radius: 6px; border: 1px solid rgba(255, 171, 0, 0.4); text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">
                    THEO DÕI THÊM
                </span>
                `}
            </div>
        </div>
        
        <!-- TIER 3: DATA TABLE -->
        <div style="background: #181d2a; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; overflow: hidden; box-shadow: 0 6px 20px rgba(0,0,0,0.35);">
            <div style="padding: 12px 18px; background: #141824; border-bottom: 1px solid rgba(255, 255, 255, 0.06); font-size: 13.5px; font-weight: 800; color: #fff; display: flex; justify-content: space-between; align-items: center;">
                <span>📋 Danh sách Định giá từ các CTCK (5 báo cáo mới nhất)</span>
                <span style="font-size: 11.5px; color: #8b949e;">Sắp xếp theo ngày phát hành mới nhất</span>
            </div>
            
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
                    <thead>
                        <tr style="background: #131722; color: #8b949e; border-bottom: 1px solid rgba(255, 255, 255, 0.06); font-family: monospace; font-size: 11.5px;">
                            <th style="padding: 10px 16px;">Công ty CK</th>
                            <th style="padding: 10px 14px; text-align: right;">Giá Mục Tiêu</th>
                            <th style="padding: 10px 14px; text-align: right;">Upside</th>
                            <th style="padding: 10px 14px; text-align: center;">Khuyến nghị</th>
                            <th style="padding: 10px 14px; text-align: center;">Ngày</th>
                            <th style="padding: 10px 16px;">Tiêu đề Báo Cáo</th>
                            <th style="padding: 10px 14px; text-align: center;">PDF</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${parsedReports.map((r, i) => `
                            <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.04); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                                <td style="padding: 10px 16px; font-weight: 800; color: #ffffff;">
                                    <span style="background: rgba(41, 121, 255, 0.15); color: #40c4ff; border: 1px solid rgba(41, 121, 255, 0.35); padding: 2px 8px; border-radius: 4px; font-family: monospace;">${r.source}</span>
                                </td>
                                <td style="padding: 10px 14px; text-align: right; font-weight: 900; font-family: monospace; color: #40c4ff; font-size: 13px;">
                                    ${r.targetPriceStr} ₫
                                </td>
                                <td style="padding: 10px 14px; text-align: right; font-weight: 800; font-family: monospace; color: ${upColor(r.upside)};">
                                    ${upFormat(r.upside)}
                                </td>
                                <td style="padding: 10px 14px; text-align: center;">
                                    <span style="background: ${r.rColor}18; color: ${r.rColor}; border: 1px solid ${r.rColor}40; padding: 2px 10px; border-radius: 4px; font-weight: 800; font-size: 11px;">
                                        ${r.recommendation}
                                    </span>
                                </td>
                                <td style="padding: 10px 14px; text-align: center; color: #8b949e; font-family: monospace; font-size: 11.5px;">
                                    ${r.date}
                                </td>
                                <td style="padding: 10px 16px; color: #d1d4dc; max-width: 320px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${r.title}">
                                    ${r.title}
                                </td>
                                <td style="padding: 10px 14px; text-align: center;">
                                    ${r.pdf_url ? `
                                        <a href="${r.pdf_url}" target="_blank" style="background: rgba(41, 121, 255, 0.15); color: #40c4ff; border: 1px solid rgba(41, 121, 255, 0.3); padding: 4px 8px; border-radius: 4px; text-decoration: none; font-size: 11.5px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;" title="Mở file PDF">
                                            <span>📄 PDF</span>
                                        </a>
                                    ` : '<span style="color:#555;">-</span>'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    `;
    
    root.innerHTML = html;
};
