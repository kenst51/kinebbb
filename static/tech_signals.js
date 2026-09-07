// ==========================================================================
// TECHNICAL SIGNALS PRO - MODERN DARK NEON BENTO UI (SVG GAUGES)
// ==========================================================================

let currentTsData = null;
let currentTsSymbol = '';
let currentTsResolution = 'D';

window.openTechSignalsModal = function() {
    const sec = document.getElementById('techSignalsSection');
    if (!sec) return;
    
    const isShown = sec.classList.contains('active');
    if (!isShown) {
        sec.classList.add('active');
        sec.style.display = 'flex';
        sec.scrollTop = 0;
        window.scrollTo({ top: 0, behavior: 'instant' });
        
        let sym = 'FPT';
        const displayEl = document.getElementById('currentSymbolDisplay');
        if (displayEl) {
            sym = displayEl.innerText.trim().toUpperCase() || 'FPT';
        }
        
        if (sym !== currentTsSymbol || !currentTsData) {
            window.loadTechSignals(sym, currentTsResolution);
        } else {
            renderTechSignals();
        }
    } else {
        sec.classList.remove('active');
        sec.style.display = 'none';
    }
};

window.loadTechSignals = async function(symToLoad, resToLoad) {
    let sym = symToLoad || currentTsSymbol;
    if (!sym) {
        const displayEl = document.getElementById('currentSymbolDisplay');
        if (displayEl) sym = displayEl.innerText.trim().toUpperCase() || 'FPT';
    }
    
    let res = resToLoad || currentTsResolution || 'D';
    currentTsSymbol = sym;
    currentTsResolution = res;
    
    const sec = document.getElementById('techSignalsSection');
    if (!sec) return;
    
    // Render modern sleek loading state
    if (!currentTsData || symToLoad) {
        sec.innerHTML = `
            <div class="ts-header">
                <div class="ts-title-wrap">
                    <span class="ts-symbol-badge">${sym}</span>
                    <span class="ts-title-text">⚡ Phân Tích Tín Hiệu Kỹ Thuật & Sức Mạnh Thị Trường</span>
                </div>
                <button class="fd-close-btn" onclick="window.openTechSignalsModal()" title="Đóng" style="background: transparent; border: none; color: #a3a6af; font-size: 18px; cursor: pointer;">✕</button>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 420px; gap: 16px; color: #8b949e;">
                <div class="fd-spinner-small" style="width: 38px; height: 38px; border-width: 3px; border-color: rgba(41, 121, 255, 0.2); border-top-color: #2979ff; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                <div style="font-size: 14px; font-weight: 700; color: #d1d4dc;">Đang phân tích 24 chỉ báo kỹ thuật cho ${sym}...</div>
                <div style="font-size: 12px; color: #787b86;">Khung thời gian: ${res === 'D' ? '1 Ngày' : res === 'W' ? '1 Tuần' : res + ' phút'}</div>
            </div>
        `;
    }
    
    try {
        const fetchRes = await fetch(`/api/technical-signals?symbol=${sym}&resolution=${res}`);
        if (!fetchRes.ok) {
            throw new Error(`Lỗi phản hồi máy chủ: ${fetchRes.status}`);
        }
        const json = await fetchRes.json();
        
        if (json.status === 'success') {
            currentTsData = json.data;
            renderTechSignals();
        } else {
            throw new Error(json.message || 'Không có dữ liệu');
        }
    } catch (e) {
        console.error("loadTechSignals error:", e);
        sec.innerHTML = `
            <div class="ts-header">
                <div class="ts-title-wrap">
                    <span class="ts-symbol-badge">${currentTsSymbol}</span>
                    <span class="ts-title-text">⚡ Phân Tích Tín Hiệu Kỹ Thuật Pro</span>
                </div>
                <button class="fd-close-btn" onclick="window.openTechSignalsModal()" title="Đóng" style="background: transparent; border: none; color: #a3a6af; font-size: 18px; cursor: pointer;">✕</button>
            </div>
            <div style="padding: 60px 20px; text-align: center; color: #ff5252;">
                <div style="font-size: 32px; margin-bottom: 12px;">⚠️</div>
                <div style="font-size: 16px; font-weight: 800;">Lỗi tải tín hiệu kỹ thuật</div>
                <div style="font-size: 13px; color: #8b949e; margin-top: 6px;">${e.message}</div>
            </div>
        `;
    }
};

function getVerdictInfo(state) {
    if (state === 'MUA_MANH' || state === 'STRONG_BUY') return { label: '⚡ MUA MẠNH', color: '#00c853', bg: 'rgba(0, 200, 83, 0.18)', border: 'rgba(0, 200, 83, 0.5)' };
    if (state === 'MUA' || state === 'BUY') return { label: '🟢 MUA', color: '#00e676', bg: 'rgba(0, 230, 118, 0.15)', border: 'rgba(0, 230, 118, 0.45)' };
    if (state === 'BAN' || state === 'SELL') return { label: '🔴 BÁN', color: '#ff5252', bg: 'rgba(255, 82, 82, 0.15)', border: 'rgba(255, 82, 82, 0.45)' };
    if (state === 'BAN_MANH' || state === 'STRONG_SELL') return { label: '🔥 BÁN MẠNH', color: '#ff1744', bg: 'rgba(255, 23, 68, 0.18)', border: 'rgba(255, 23, 68, 0.45)' };
    return { label: '🟡 TRUNG TÍNH', color: '#ffab00', bg: 'rgba(255, 171, 0, 0.15)', border: 'rgba(255, 171, 0, 0.45)' };
}

function getSignalPill(sig) {
    if (sig === 'MUA') return `<span class="ts-sig-pill ts-sig-buy">MUA</span>`;
    if (sig === 'BAN') return `<span class="ts-sig-pill ts-sig-sell">BÁN</span>`;
    return `<span class="ts-sig-pill ts-sig-neutral">TR.TÍNH</span>`;
}

function createSVGNeonGauge(id, score, themeColor) {
    // score ranges from -1.0 (Full Sell) to +1.0 (Full Buy)
    // Map -1.0 to 1.0 -> -75deg to +75deg (0 is center)
    let s = Number(score);
    if (isNaN(s)) s = 0;
    if (s < -1) s = -1;
    if (s > 1) s = 1;
    
    let angle = s * 75; // -75 deg to +75 deg
    
    return `
        <div class="ts-neon-gauge-wrap">
            <svg viewBox="0 0 200 115" class="ts-neon-gauge-svg">
                <defs>
                    <linearGradient id="gaugeGrad_${id}" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#ff1744" />
                        <stop offset="25%" stop-color="#ff5252" />
                        <stop offset="50%" stop-color="#ffab00" />
                        <stop offset="75%" stop-color="#22c55e" />
                        <stop offset="100%" stop-color="#008a38" />
                    </linearGradient>
                </defs>
                
                <!-- Background Rail -->
                <path d="M 22 98 A 78 78 0 0 1 178 98" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="12" stroke-linecap="round"/>
                
                <!-- Neon Glowing Color Arc -->
                <path d="M 22 98 A 78 78 0 0 1 178 98" fill="none" stroke="url(#gaugeGrad_${id})" stroke-width="8" stroke-linecap="round" opacity="0.9"/>
                
                <!-- Center Tick Marker -->
                <line x1="100" y1="18" x2="100" y2="28" stroke="rgba(255, 171, 0, 0.6)" stroke-width="2"/>
                
                <!-- Dynamic Rotating Needle -->
                <g id="tsNeedle_${id}" style="transform: rotate(${angle}deg); transform-origin: 100px 98px; transition: transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);">
                    <polygon points="98,98 100,28 102,98" fill="${themeColor}" style="filter: drop-shadow(0 0 6px ${themeColor});"/>
                    <circle cx="100" cy="98" r="9" fill="#131722" stroke="${themeColor}" stroke-width="2.5"/>
                    <circle cx="100" cy="98" r="4.5" fill="${themeColor}"/>
                </g>
                
                <!-- Labels -->
                <text x="24" y="112" font-size="9.5" font-weight="800" fill="#ff5252" text-anchor="middle" font-family="monospace">BÁN</text>
                <text x="100" y="38" font-size="9" font-weight="800" fill="#ffab00" text-anchor="middle" font-family="monospace">TR.TÍNH</text>
                <text x="176" y="112" font-size="9.5" font-weight="800" fill="#00e676" text-anchor="middle" font-family="monospace">MUA</text>
            </svg>
        </div>
    `;
}

function generateAIInsight(data) {
    if (!data) return '';
    const tabData = data.tab1 || {};
    const gOverall = tabData.gauge_overall || {};
    const values = data.values || {};
    const mas = data.mas || {};
    const price = Number(data.price) || 0;
    
    let rsi = values.RSI !== null && values.RSI !== undefined ? values.RSI : 50;
    let sma20 = mas.SMA_20 !== null && mas.SMA_20 !== undefined ? mas.SMA_20 : 0;
    
    let summary = '';
    if (gOverall.buy > gOverall.sell + 3) {
        summary = `Lực cầu chiếm ưu thế với ${gOverall.buy} chỉ báo Mua so với ${gOverall.sell} chỉ báo Bán.`;
    } else if (gOverall.sell > gOverall.buy + 3) {
        summary = `Áp lực bán đang chi phối với ${gOverall.sell} chỉ báo Bán so với ${gOverall.buy} chỉ báo Mua.`;
    } else {
        summary = `Thị trường giằng co, cung cầu cân bằng với ${gOverall.buy} tín hiệu Mua, ${gOverall.neutral} Trung tính và ${gOverall.sell} Bán.`;
    }
    
    let rsiDesc = '';
    if (rsi > 70) rsiDesc = `RSI (${rsi.toFixed(1)}) đang đi vào vùng quá mua ngắn hạn.`;
    else if (rsi < 30) rsiDesc = `RSI (${rsi.toFixed(1)}) ở vùng quá bán sâu, khả năng có nhịp hồi phục.`;
    else rsiDesc = `RSI (${rsi.toFixed(1)}) duy trì ở vùng trung lập tích lũy.`;
    
    let maDesc = '';
    if (price > 0 && sma20 > 0) {
        if (price > sma20) maDesc = `Giá (${price.toFixed(2)}) giữ vững trên đường MA20 (${sma20.toFixed(2)}) củng cố xu hướng tích cực.`;
        else maDesc = `Giá (${price.toFixed(2)}) đang nằm dưới đường MA20 (${sma20.toFixed(2)}) cần lực cầu gia tăng.`;
    }
    
    return `${summary} ${rsiDesc} ${maDesc}`;
}

function renderTechSignals() {
    if (!currentTsData) return;
    const sec = document.getElementById('techSignalsSection');
    if (!sec) return;
    
    const tabData = currentTsData.tab1 || {};
    const gOsc = tabData.gauge_osc || { sell: 0, neutral: 0, buy: 0, score: 0, state: 'TRUNG_TINH' };
    const gOverall = tabData.gauge_overall || { sell: 0, neutral: 0, buy: 0, score: 0, state: 'TRUNG_TINH' };
    const gMa = tabData.gauge_ma || { sell: 0, neutral: 0, buy: 0, score: 0, state: 'TRUNG_TINH' };
    
    const totalVotes = (gOverall.sell + gOverall.neutral + gOverall.buy) || 1;
    const pctSell = (gOverall.sell / totalVotes) * 100;
    const pctNeutral = (gOverall.neutral / totalVotes) * 100;
    const pctBuy = (gOverall.buy / totalVotes) * 100;
    
    const vOsc = getVerdictInfo(gOsc.state);
    const vOverall = getVerdictInfo(gOverall.state);
    const vMa = getVerdictInfo(gMa.state);
    
    const values = currentTsData.values || {};
    const mas = currentTsData.mas || {};
    const price = Number(currentTsData.price) || 0;
    
    const aiInsight = generateAIInsight(currentTsData);
    
    // Timeframe Buttons
    const tfList = [
        { key: '1', label: '1p' },
        { key: '5', label: '5p' },
        { key: '15', label: '15p' },
        { key: '30', label: '30p' },
        { key: '60', label: '1 giờ' },
        { key: 'D', label: '1 ngày' },
        { key: 'W', label: '1 tuần' }
    ];
    let tfHTML = '';
    tfList.forEach(tf => {
        let activeClass = currentTsResolution === tf.key ? 'active' : '';
        tfHTML += `<span class="ts-tf-pill ${activeClass}" onclick="window.loadTechSignals('${currentTsSymbol}', '${tf.key}')">${tf.label}</span>`;
    });
    
    // 12 Oscillators Table Rows (6 rows x 2 cols)
    const oscOrder = ['RSI', 'STOCHK', 'STOCHRSI_FASTK', 'MACD', 'MACD_HISTOGRAM', 'ADX', 'WPR', 'CCI', 'ROC', 'SAR', 'ULTOSC', 'BB_WIDTH'];
    const oscNames = {
        'RSI': 'RSI (14)', 'STOCHK': 'Stochastic (%K)', 'STOCHRSI_FASTK': 'Stoch RSI Fast', 
        'MACD': 'MACD (12,26)', 'MACD_HISTOGRAM': 'MACD Histogram', 'ADX': 'ADX (14)',
        'WPR': 'Williams %R', 'CCI': 'CCI (20)', 'ROC': 'ROC (9)', 'SAR': 'Parabolic SAR',
        'ULTOSC': 'Ultimate Osc', 'BB_WIDTH': 'Bollinger Bandwidth'
    };
    
    let oscHtml = '';
    for (let i = 0; i < 6; i++) {
        let k1 = oscOrder[i];
        let k2 = oscOrder[i + 6];
        
        let v1 = values[k1] !== null && values[k1] !== undefined ? Number(values[k1]).toFixed(2) : '-';
        let v2 = values[k2] !== null && values[k2] !== undefined ? Number(values[k2]).toFixed(2) : '-';
        
        let s1 = tabData.signals ? tabData.signals[k1] : 'TRUNG_TINH';
        let s2 = tabData.signals ? tabData.signals[k2] : 'TRUNG_TINH';
        
        oscHtml += `
            <tr>
                <td style="font-weight: 700; color: #ffffff;">${oscNames[k1]}</td>
                <td style="text-align: right; color: #40c4ff; font-weight: 700;">${v1}</td>
                <td style="text-align: right; padding-right: 18px; border-right: 1px solid rgba(255,255,255,0.06);">${getSignalPill(s1)}</td>
                
                <td style="font-weight: 700; color: #ffffff; padding-left: 18px;">${oscNames[k2]}</td>
                <td style="text-align: right; color: #40c4ff; font-weight: 700;">${v2}</td>
                <td style="text-align: right;">${getSignalPill(s2)}</td>
            </tr>
        `;
    }
    
    // MA Table Rows
    const maOrder = [5, 10, 20, 50, 100, 200];
    let maHtml = '';
    maOrder.forEach(p => {
        let smaKey = `SMA_${p}`;
        let emaKey = `EMA_${p}`;
        
        let smaVal = mas[smaKey] !== null && mas[smaKey] !== undefined ? Number(mas[smaKey]).toFixed(2) : '-';
        let emaVal = mas[emaKey] !== null && mas[emaKey] !== undefined ? Number(mas[emaKey]).toFixed(2) : '-';
        
        let smaSig = tabData.ma_signals ? tabData.ma_signals[smaKey] : 'TRUNG_TINH';
        let emaSig = tabData.ma_signals ? tabData.ma_signals[emaKey] : 'TRUNG_TINH';
        
        let smaColor = (price > 0 && Number(mas[smaKey]) > 0 && price >= Number(mas[smaKey])) ? '#00e676' : '#ff5252';
        let emaColor = (price > 0 && Number(mas[emaKey]) > 0 && price >= Number(mas[emaKey])) ? '#00e676' : '#ff5252';
        
        maHtml += `
            <tr>
                <td style="font-weight: 800; color: #ffffff;">MA${p}</td>
                <td style="text-align: right;">
                    <span style="color: ${smaColor}; font-weight: 700; margin-right: 8px;">${smaVal}</span>
                    ${getSignalPill(smaSig)}
                </td>
                <td style="text-align: right;">
                    <span style="color: ${emaColor}; font-weight: 700; margin-right: 8px;">${emaVal}</span>
                    ${getSignalPill(emaSig)}
                </td>
            </tr>
        `;
    });

    const html = `
        <!-- HEADER -->
        <div class="ts-header">
            <div class="ts-title-wrap">
                <span class="ts-symbol-badge">${currentTsSymbol}</span>
                <span class="ts-title-text">⚡ Phân Tích Tín Hiệu Kỹ Thuật & Sức Mạnh Thị Trường</span>
                ${price > 0 ? `<span style="font-size: 13px; font-weight: 800; color: #40c4ff; background: rgba(64, 196, 255, 0.12); padding: 3px 10px; border-radius: 6px; font-family: monospace;">Giá: ${price.toFixed(2)}</span>` : ''}
            </div>
            
            <div style="display: flex; align-items: center; gap: 14px;">
                <div class="ts-timeframe-bar">
                    ${tfHTML}
                </div>
                <button class="fd-close-btn" onclick="window.openTechSignalsModal()" title="Đóng" style="background: transparent; border: none; color: #a3a6af; font-size: 18px; cursor: pointer;">✕</button>
            </div>
        </div>
        
        <!-- HERO BENTO GRID (3 GAUGES) -->
        <div class="ts-hero-grid">
            
            <!-- LEFT GAUGE: OSCILLATORS -->
            <div class="ts-gauge-card">
                <div class="ts-gauge-card-header">
                    <span class="ts-gauge-card-title" style="color: #ffab00;">🎯 Bộ Dao Động</span>
                    <span style="font-size: 11px; font-weight: 700; color: #8b949e; background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 4px;">12 chỉ báo</span>
                </div>
                
                ${createSVGNeonGauge('osc', gOsc.score, vOsc.color)}
                
                <div class="ts-verdict-pill" style="color: ${vOsc.color}; background: ${vOsc.bg}; border: 1px solid ${vOsc.border}; font-size: 12px; padding: 3px 12px;">
                    ${vOsc.label}
                </div>
                
                <div class="ts-counters-row">
                    <div class="ts-counter-item">
                        <span class="ts-counter-num" style="color: #ff5252;">${gOsc.sell}</span>
                        <span class="ts-counter-lbl">Bán</span>
                    </div>
                    <div class="ts-counter-item">
                        <span class="ts-counter-num" style="color: #ffab00;">${gOsc.neutral}</span>
                        <span class="ts-counter-lbl">Tr.Tính</span>
                    </div>
                    <div class="ts-counter-item">
                        <span class="ts-counter-num" style="color: #00e676;">${gOsc.buy}</span>
                        <span class="ts-counter-lbl">Mua</span>
                    </div>
                </div>
            </div>
            
            <!-- CENTER MASTER GAUGE: CONSENSUS -->
            <div class="ts-gauge-card master" style="border-top: 3px solid ${vOverall.color};">
                <div class="ts-gauge-card-header">
                    <span class="ts-gauge-card-title" style="color: #ffffff; font-size: 13.5px;">⚡ Tổng Hợp Khuyến Nghị</span>
                    <span style="font-size: 11px; font-weight: 700; color: #8b949e; background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 4px;">24 chỉ số</span>
                </div>
                
                ${createSVGNeonGauge('overall', gOverall.score, vOverall.color)}
                
                <div class="ts-verdict-pill" style="color: ${vOverall.color}; background: ${vOverall.bg}; border: 1px solid ${vOverall.border};">
                    ${vOverall.label}
                </div>
                
                <!-- Bull vs Bear Market Power Bar -->
                <div class="ts-power-bar-wrap">
                    <div class="ts-power-bar-track">
                        <div class="ts-power-segment sell" style="width: ${pctSell}%;" title="Bán: ${gOverall.sell} (${pctSell.toFixed(0)}%)"></div>
                        <div class="ts-power-segment neutral" style="width: ${pctNeutral}%;" title="Trung tính: ${gOverall.neutral} (${pctNeutral.toFixed(0)}%)"></div>
                        <div class="ts-power-segment buy" style="width: ${pctBuy}%;" title="Mua: ${gOverall.buy} (${pctBuy.toFixed(0)}%)"></div>
                    </div>
                </div>
                
                <div class="ts-counters-row">
                    <div class="ts-counter-item">
                        <span class="ts-counter-num" style="color: #ff5252;">${gOverall.sell}</span>
                        <span class="ts-counter-lbl">Bán (${pctSell.toFixed(0)}%)</span>
                    </div>
                    <div class="ts-counter-item">
                        <span class="ts-counter-num" style="color: #ffab00;">${gOverall.neutral}</span>
                        <span class="ts-counter-lbl">Tr.Tính (${pctNeutral.toFixed(0)}%)</span>
                    </div>
                    <div class="ts-counter-item">
                        <span class="ts-counter-num" style="color: #00e676;">${gOverall.buy}</span>
                        <span class="ts-counter-lbl">Mua (${pctBuy.toFixed(0)}%)</span>
                    </div>
                </div>
            </div>
            
            <!-- RIGHT GAUGE: MOVING AVERAGES -->
            <div class="ts-gauge-card">
                <div class="ts-gauge-card-header">
                    <span class="ts-gauge-card-title" style="color: #00e676;">📈 Đường Trung Bình</span>
                    <span style="font-size: 11px; font-weight: 700; color: #8b949e; background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 4px;">12 khung</span>
                </div>
                
                ${createSVGNeonGauge('ma', gMa.score, vMa.color)}
                
                <div class="ts-verdict-pill" style="color: ${vMa.color}; background: ${vMa.bg}; border: 1px solid ${vMa.border}; font-size: 12px; padding: 3px 12px;">
                    ${vMa.label}
                </div>
                
                <div class="ts-counters-row">
                    <div class="ts-counter-item">
                        <span class="ts-counter-num" style="color: #ff5252;">${gMa.sell}</span>
                        <span class="ts-counter-lbl">Bán</span>
                    </div>
                    <div class="ts-counter-item">
                        <span class="ts-counter-num" style="color: #ffab00;">${gMa.neutral}</span>
                        <span class="ts-counter-lbl">Tr.Tính</span>
                    </div>
                    <div class="ts-counter-item">
                        <span class="ts-counter-num" style="color: #00e676;">${gMa.buy}</span>
                        <span class="ts-counter-lbl">Mua</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- AI TECHNICAL INTELLIGENCE BOX -->
        <div class="ts-ai-box">
            <div class="ts-ai-icon">💡</div>
            <div class="ts-ai-content">
                <span class="ts-ai-title">AI Chiến Lược Giao Dịch & Nhận Định Nhanh (${currentTsSymbol})</span>
                <span class="ts-ai-desc">${aiInsight}</span>
            </div>
        </div>
        
        <!-- 2 DEEP DIVE TABLES -->
        <div class="ts-tables-grid">
            
            <!-- OSCILLATORS TABLE -->
            <div class="ts-card">
                <div class="ts-card-header">
                    <span class="ts-card-title">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: #ffab00; box-shadow: 0 0 8px #ffab00;"></span>
                        <span>12 Chỉ Báo Dao Động Kỹ Thuật (Oscillators)</span>
                    </span>
                    <span style="font-size: 11px; font-weight: 700; color: #8b949e;">Chi tiết tín hiệu</span>
                </div>
                <div style="overflow-x: auto;">
                    <table class="ts-table">
                        <thead>
                            <tr>
                                <th>Chỉ báo</th>
                                <th style="text-align: right;">Giá trị</th>
                                <th style="text-align: right; padding-right: 18px; border-right: 1px solid rgba(255,255,255,0.06);">Tín hiệu</th>
                                <th style="padding-left: 18px;">Chỉ báo</th>
                                <th style="text-align: right;">Giá trị</th>
                                <th style="text-align: right;">Tín hiệu</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${oscHtml}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- MOVING AVERAGES TABLE -->
            <div class="ts-card">
                <div class="ts-card-header">
                    <span class="ts-card-title">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: #00e676; box-shadow: 0 0 8px #00e676;"></span>
                        <span>Đường Trung Bình Động (SMA & EMA)</span>
                    </span>
                    <span style="font-size: 11px; font-weight: 700; color: #8b949e;">Đa khung</span>
                </div>
                <div style="overflow-x: auto;">
                    <table class="ts-table">
                        <thead>
                            <tr>
                                <th>Khung</th>
                                <th style="text-align: right;">Hàm đơn (SMA)</th>
                                <th style="text-align: right;">Hàm mũ (EMA)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${maHtml}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    sec.innerHTML = html;
}
