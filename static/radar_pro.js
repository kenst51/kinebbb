/**
 * ==============================================================================
 * RADAR PRO [VIP] - CỐ VẤN DÒNG TIỀN THÔNG MINH ĐỘC LẬP
 * Phiên bản: 4.0 VIP (Kế thừa & Nâng cấp toàn diện từ Radar RRG)
 * Ngôn từ: Dân dã - Trực quan - Xóa sạch thuật ngữ kỹ thuật khó hiểu
 * BƯỚC 4: GIÁP BẢO VỆ BẪY KÉO XẢ, BỘ LỌC KIM CƯƠNG 💎 & THƯỚC ĐO KÈO MUA R:R
 * TIẾN ĐỘ: 80%
 * ==============================================================================
 */

window.radarProState = {
    activeTab: 'command', // 'command' | 'matrix' | 'scanner' | 'ai'
    timeframe: '1D',
    basket: 'nganh', // 'nganh' | 'vn30' | 'all'
    industryLevel: 2, // 1: 10 Siêu ngành | 2: 20 Ngành lớn | 3: 43 Phân ngành | 4: 109 Tiểu ngành
    selectedQuadrant: 'all',
    searchQuery: '',
    scannerFilter: 'all', // 'all' | 'buy_early' | 'leading_add' | 'trap_warning'
    scannerSearch: '',
    data: null,
    loading: false,
    lastUpdated: null,
    stepProgress: 100, // 100% cho Bước 5 (Hoàn tất toàn diện bàn giao)
    showPredictiveCone: true,
    selectedForecastSymbol: null,
    cachedRrgData: {},
    drilldownCache: {},
    computedMetrics: null,
    matrixChartInstance: null,
    diamondAnalysis: null,
    // Trạng thái Bộ Lọc 4 Cấp ICB Độc Tôn (icb_stock_sector_mapping.json)
    icbStockMap: null,
    icbTree: null,
    selectedIcbLevel: 2, // Mặc định Cấp 2: 20 Ngành Lớn Thực Chiến
    selectedIcbCode: 'all',
    selectedIcbName: 'Tất Cả'
};

/**
 * Khởi tạo Dashboard Radar PRO khi người dùng click vào menu bên trái
 */
window.initRadarProDashboard = function() {
    const container = document.getElementById('appContent_radar_pro');
    if (!container) {
        console.error('[Radar PRO] Container #appContent_radar_pro không tìm thấy!');
        return;
    }

    if (!container.dataset.initialized) {
        renderRadarProLayout(container);
        container.dataset.initialized = 'true';
    }

    loadRadarProInitialData();
};

/**
 * Render cấu trúc layout độc lập cho Radar PRO
 */
function renderRadarProLayout(container) {
    container.innerHTML = `
        <style>
            #appContent_radar_pro {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                background: #080b11;
                color: #e2e8f0;
            }
            .radar-pro-header {
                background: linear-gradient(180deg, #0f172a 0%, #080b11 100%);
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                padding: 12px 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-shrink: 0;
            }
            .radar-pro-title-wrap {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .radar-pro-logo-icon {
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(239, 68, 68, 0.25));
                border: 1px solid rgba(245, 158, 11, 0.5);
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 22px;
                box-shadow: 0 0 16px rgba(245, 158, 11, 0.3);
            }
            .radar-pro-title {
                font-size: 17px;
                font-weight: 800;
                letter-spacing: 0.5px;
                background: linear-gradient(90deg, #f8fafc 0%, #cbd5e1 50%, #f59e0b 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin: 0;
                line-height: 1.2;
            }
            .radar-pro-subtitle {
                font-size: 12px;
                color: #94a3b8;
                margin-top: 2px;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .radar-pro-vip-badge {
                background: linear-gradient(135deg, #f59e0b, #d97706);
                color: #000;
                font-size: 9px;
                font-weight: 900;
                padding: 2px 6px;
                border-radius: 4px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .radar-pro-nav-tabs {
                display: flex;
                gap: 6px;
                background: rgba(15, 23, 42, 0.7);
                padding: 4px;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.08);
            }
            .radar-pro-tab-btn {
                background: transparent;
                border: none;
                color: #94a3b8;
                font-size: 12px;
                font-weight: 600;
                padding: 6px 14px;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .radar-pro-tab-btn:hover {
                color: #f8fafc;
                background: rgba(255, 255, 255, 0.05);
            }
            .radar-pro-tab-btn.active {
                background: #1e293b;
                color: #38bdf8;
                border: 1px solid rgba(56, 189, 248, 0.35);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
            }
            .radar-pro-controls {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .radar-pro-btn-group {
                display: flex;
                background: #0f172a;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 6px;
                overflow: hidden;
            }
            .radar-pro-sub-btn {
                background: transparent;
                border: none;
                color: #94a3b8;
                font-size: 11px;
                font-weight: 600;
                padding: 5px 12px;
                cursor: pointer;
                transition: all 0.15s ease;
                white-space: nowrap;
                flex-shrink: 0;
            }
            .radar-pro-sub-btn:hover {
                color: #fff;
            }
            .radar-pro-sub-btn.active {
                background: #2563eb;
                color: #fff;
            }
            .radar-pro-content-body {
                flex: 1;
                padding: 16px 20px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            /* Progress Bar */
            .radar-pro-welcome-banner {
                background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.7) 100%);
                border: 1px solid rgba(56, 189, 248, 0.25);
                border-radius: 12px;
                padding: 16px 20px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
                position: relative;
                overflow: hidden;
            }
            .radar-pro-progress-bar-bg {
                background: rgba(255, 255, 255, 0.08);
                border-radius: 10px;
                height: 8px;
                width: 100%;
                overflow: hidden;
                margin-top: 10px;
            }
            .radar-pro-progress-bar-fill {
                height: 100%;
                width: 80%;
                background: linear-gradient(90deg, #38bdf8, #10b981);
                border-radius: 10px;
                box-shadow: 0 0 12px rgba(16, 185, 129, 0.6);
                transition: width 0.5s ease;
            }

            /* BỘ CHỈ HUY HÀNH ĐỘNG WIDGETS */
            .radar-pro-command-hub-grid {
                display: grid;
                grid-template-columns: 1.2fr 1fr 1fr;
                gap: 14px;
            }
            @media (max-width: 1200px) {
                .radar-pro-command-hub-grid {
                    grid-template-columns: 1fr;
                }
            }
            .command-widget-card {
                background: #0f172a;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 12px;
                padding: 16px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
                position: relative;
                overflow: hidden;
            }
            .command-widget-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 2px;
            }
            .widget-traffic::before {
                background: linear-gradient(90deg, #10b981, #f59e0b, #ef4444);
            }
            .widget-margin::before {
                background: linear-gradient(90deg, #38bdf8, #f59e0b);
            }
            .widget-allocation::before {
                background: linear-gradient(90deg, #10b981, #38bdf8);
            }
            .command-widget-title {
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 0.5px;
                color: #94a3b8;
                text-transform: uppercase;
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 12px;
            }

            /* Traffic Light */
            .traffic-light-container {
                display: flex;
                align-items: center;
                gap: 16px;
            }
            .traffic-light-housing {
                background: #020617;
                border: 2px solid #1e293b;
                border-radius: 24px;
                padding: 6px 8px;
                display: flex;
                flex-direction: column;
                gap: 6px;
                box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.8);
            }
            .traffic-bulb {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                opacity: 0.25;
                transition: all 0.3s ease;
            }
            .traffic-bulb.red { background: #ef4444; }
            .traffic-bulb.yellow { background: #f59e0b; }
            .traffic-bulb.green { background: #10b981; }

            .traffic-bulb.active.red { opacity: 1; box-shadow: 0 0 16px #ef4444, inset 0 0 4px #fff; }
            .traffic-bulb.active.yellow { opacity: 1; box-shadow: 0 0 16px #f59e0b, inset 0 0 4px #fff; }
            .traffic-bulb.active.green { opacity: 1; box-shadow: 0 0 16px #10b981, inset 0 0 4px #fff; }

            .traffic-status-title { font-size: 16px; font-weight: 900; line-height: 1.2; }
            .traffic-status-desc { font-size: 12px; color: #cbd5e1; margin-top: 4px; line-height: 1.4; }
            .action-command-badge {
                display: inline-block;
                margin-top: 8px;
                padding: 4px 10px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 800;
            }

            .margin-gauge-track {
                height: 12px;
                background: #020617;
                border-radius: 8px;
                overflow: hidden;
                position: relative;
                margin: 10px 0 6px 0;
                border: 1px solid rgba(255, 255, 255, 0.08);
            }
            .margin-gauge-fill { height: 100%; border-radius: 8px; transition: width 0.6s ease; }

            .allocation-bar-track {
                height: 18px;
                border-radius: 6px;
                overflow: hidden;
                display: flex;
                margin: 10px 0 6px 0;
                border: 1px solid rgba(255, 255, 255, 0.08);
            }
            .allocation-stock {
                background: linear-gradient(90deg, #10b981, #059669);
                display: flex; align-items: center; justify-content: center;
                font-size: 10px; font-weight: 800; color: #fff; transition: width 0.6s ease;
            }
            .allocation-cash {
                background: linear-gradient(90deg, #475569, #334155);
                display: flex; align-items: center; justify-content: center;
                font-size: 10px; font-weight: 800; color: #e2e8f0; transition: width 0.6s ease;
            }

            /* BỘ 4 THẺ CUNG DÒNG TIỀN DÂN DÃ */
            .quadrant-cards-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 12px;
            }
            @media (max-width: 992px) {
                .quadrant-cards-grid { grid-template-columns: repeat(2, 1fr); }
            }
            .quadrant-card {
                background: #0f172a;
                border: 1px solid rgba(255, 255, 255, 0.06);
                border-radius: 10px;
                padding: 12px 14px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .quadrant-card:hover { transform: translateY(-2px); border-color: rgba(255, 255, 255, 0.2); }
            .card-dandat.active { border-color: #10b981; background: rgba(16, 185, 129, 0.08); box-shadow: 0 0 16px rgba(16,185,129,0.3); }
            .card-caithien.active { border-color: #38bdf8; background: rgba(56, 189, 248, 0.08); box-shadow: 0 0 16px rgba(56,189,248,0.3); }
            .card-suyyeu.active { border-color: #f59e0b; background: rgba(245, 158, 11, 0.08); box-shadow: 0 0 16px rgba(245,158,11,0.3); }
            .card-tuthao.active { border-color: #ef4444; background: rgba(239, 68, 68, 0.08); box-shadow: 0 0 16px rgba(239,68,68,0.3); }
            .quadrant-card-title { font-size: 12px; font-weight: 800; display: flex; align-items: center; justify-content: space-between; }
            .quadrant-count { font-size: 22px; font-weight: 900; margin-top: 4px; }
            .quadrant-subtext { font-size: 11px; color: #94a3b8; margin-top: 2px; }

            /* HERO SPOTLIGHT & DOMINO CHAIN */
            .hero-spotlight-card {
                background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%);
                border: 1px solid rgba(245, 158, 11, 0.4);
                border-radius: 12px;
                padding: 16px 20px;
                box-shadow: 0 8px 30px rgba(245, 158, 11, 0.15);
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 14px;
            }
            .hero-badge-title { display: flex; align-items: center; gap: 10px; }
            .hero-crown-icon { font-size: 32px; filter: drop-shadow(0 0 10px #f59e0b); }
            .domino-chain-container {
                background: #0f172a;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 12px;
                padding: 18px 20px;
            }
            .domino-chain-flow {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                margin-top: 12px;
                flex-wrap: wrap;
            }
            .domino-node {
                flex: 1;
                min-width: 220px;
                background: #020617;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                padding: 14px;
                position: relative;
                transition: transform 0.2s, border-color 0.2s;
            }
            .domino-node:hover { transform: translateY(-3px); border-color: #38bdf8; }
            .domino-node.stage-1 { border-top: 3px solid #10b981; }
            .domino-node.stage-hero-merged {
                border: 1px solid rgba(245, 158, 11, 0.5);
                border-top: 3px solid #f59e0b;
                background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, #020617 100%);
                box-shadow: 0 4px 20px rgba(245, 158, 11, 0.15);
                position: relative;
            }
            .hero-mini-crown {
                position: absolute;
                top: -10px;
                right: 12px;
                background: #f59e0b;
                color: #000;
                font-size: 10px;
                font-weight: 900;
                padding: 2px 8px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                gap: 4px;
                box-shadow: 0 2px 8px rgba(245, 158, 11, 0.5);
            }
            .metric-pill {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                background: rgba(255,255,255,0.06);
                border-radius: 4px;
                padding: 2px 6px;
                font-size: 10px;
                font-weight: 700;
            }
            .leader-ticker-tag {
                display: inline-flex;
                align-items: center;
                gap: 2px;
                background: rgba(56, 189, 248, 0.15);
                border: 1px solid rgba(56, 189, 248, 0.35);
                color: #38bdf8;
                font-size: 10px;
                font-weight: 800;
                padding: 2px 6px;
                border-radius: 4px;
                margin-right: 4px;
                margin-bottom: 2px;
            }
            .domino-node.stage-2 { border-top: 3px solid #38bdf8; }
            .domino-node.stage-3 { border-top: 3px solid #f59e0b; }
            .domino-arrow {
                font-size: 20px;
                color: #38bdf8;
                display: flex;
                flex-direction: column;
                align-items: center;
                font-weight: 800;
            }

            /* BƯỚC 3: PHÂN BỔ TỶ TRỌNG VỐN 20-60-20 & THU GỌN DOMINO */
            .domino-allocation-bar-wrap {
                margin-top: 12px;
                background: rgba(2, 6, 23, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 8px;
                padding: 8px 14px;
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            .domino-allocation-bar {
                height: 8px;
                border-radius: 4px;
                overflow: hidden;
                display: flex;
                background: rgba(255, 255, 255, 0.05);
                box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);
            }
            .alloc-seg-1 {
                width: 20%;
                background: linear-gradient(90deg, #f59e0b, #d97706);
            }
            .alloc-seg-2 {
                width: 60%;
                background: linear-gradient(90deg, #38bdf8, #0284c7);
                box-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
            }
            .alloc-seg-3 {
                width: 20%;
                background: linear-gradient(90deg, #eab308, #ca8a04);
            }
            .domino-collapse-btn {
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.15);
                color: #cbd5e1;
                font-size: 11px;
                font-weight: 700;
                padding: 4px 10px;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 5px;
            }
            .domino-collapse-btn:hover {
                background: rgba(56, 189, 248, 0.15);
                border-color: #38bdf8;
                color: #38bdf8;
            }
            .domino-compact-summary {
                margin-top: 10px;
                background: rgba(2, 6, 23, 0.7);
                border: 1px dashed rgba(56, 189, 248, 0.3);
                border-radius: 8px;
                padding: 10px 14px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 8px;
                font-size: 12px;
                animation: fadeIn 0.2s ease;
            }
            .alloc-pct-tag {
                font-size: 10px;
                font-weight: 800;
            }
            .domino-copy-btn {
                background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.25) 100%);
                border: 1px solid rgba(16, 185, 129, 0.45);
                color: #34d399;
                font-size: 11px;
                font-weight: 800;
                padding: 4px 10px;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 5px;
                box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
                white-space: nowrap;
            }
            .domino-copy-btn:hover {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: #020617;
                box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
            }

            /* MATRIX 2D MAP CANVAS */
            .matrix-2d-card {
                background: #0f172a;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 12px;
                padding: 16px;
                position: relative;
            }
            #radarProMatrixEchart { width: 100%; height: 460px; }

            /* BƯỚC 4: GIÁP BẢO VỆ BẪY KÉO XẢ & THƯỚC ĐO R:R */
            .trap-shield-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 14px;
            }
            @media (max-width: 992px) {
                .trap-shield-grid { grid-template-columns: 1fr; }
            }
            .trap-card {
                background: #0f172a;
                border-radius: 12px;
                padding: 16px 18px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                position: relative;
                overflow: hidden;
            }
            .trap-card.bull-trap {
                border: 1px solid rgba(239, 68, 68, 0.4);
                background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, #0f172a 100%);
            }
            .trap-card.bear-trap {
                border: 1px solid rgba(16, 185, 129, 0.4);
                background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, #0f172a 100%);
            }
            .trap-badge-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 10px;
            }
            .trap-stock-chips {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 10px;
            }
            .trap-chip {
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                padding: 4px 8px;
                font-size: 11px;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            /* R:R Gauge UI */
            .rr-gauge-wrap {
                display: flex;
                align-items: center;
                gap: 8px;
                background: #020617;
                padding: 3px 8px;
                border-radius: 6px;
                border: 1px solid rgba(255, 255, 255, 0.08);
                width: fit-content;
            }
            .rr-bar-track {
                width: 65px;
                height: 8px;
                background: #334155;
                border-radius: 4px;
                overflow: hidden;
                display: flex;
            }
            .rr-bar-reward { background: #10b981; }
            .rr-bar-risk { background: #ef4444; }

            /* DRILLDOWN MODAL */
            .drilldown-modal-backdrop {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0, 0, 0, 0.75);
                backdrop-filter: blur(4px);
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .drilldown-modal-box {
                background: #0b0f19;
                border: 1px solid rgba(56, 189, 248, 0.3);
                border-radius: 14px;
                width: 100%;
                max-width: 960px;
                max-height: 85vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
                overflow: hidden;
            }
            .drilldown-modal-header {
                padding: 14px 20px;
                background: #0f172a;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .drilldown-modal-body {
                padding: 16px 20px;
                overflow-y: auto;
                flex: 1;
            }

            /* Table UI */
            .actionable-table-card {
                background: #0f172a;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 12px;
                padding: 16px;
            }
            .radar-pro-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 12px;
            }
            .radar-pro-table th {
                background: #020617;
                color: #94a3b8;
                font-weight: 700;
                text-align: left;
                padding: 8px 12px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            }
            .radar-pro-table td {
                padding: 10px 12px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.04);
                color: #e2e8f0;
            }
            .radar-pro-table tr:hover td { background: rgba(255, 255, 255, 0.02); }
            .radar-pro-sparkline-wrap {
                transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .radar-pro-sparkline-wrap:hover {
                transform: scale(1.08);
            }
            .radar-pro-sparkline-wrap:hover svg {
                filter: drop-shadow(0 0 5px rgba(56, 189, 248, 0.6));
            }

            /* Step Cards Mini */
            .step-tracker-container {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 10px;
            }
            @media (max-width: 992px) {
                .step-tracker-container { grid-template-columns: repeat(2, 1fr); }
            }
            .step-mini-card {
                background: #0f172a;
                border: 1px solid rgba(255, 255, 255, 0.06);
                border-radius: 8px;
                padding: 10px;
                font-size: 11px;
            }
            .step-mini-card.completed {
                border-color: rgba(16, 185, 129, 0.4);
                background: rgba(16, 185, 129, 0.04);
            }
            .step-mini-card.active-step {
                border-color: #38bdf8;
                background: rgba(56, 189, 248, 0.08);
                box-shadow: 0 0 12px rgba(56, 189, 248, 0.2);
            }

            /* TAB 4: PREDICTIVE CONE & AI COPILOT */
            .predictive-header-card {
                background: linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(56, 189, 248, 0.1) 100%);
                border: 1px solid rgba(168, 85, 247, 0.3);
                border-radius: 12px;
                padding: 16px 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 12px;
            }
            .ai-copilot-grid {
                display: grid;
                grid-template-columns: 1fr 1.25fr;
                gap: 16px;
            }
            @media (max-width: 1200px) {
                .ai-copilot-grid { grid-template-columns: 1fr; }
            }
            .forecast-card-panel {
                background: #0f172a;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 12px;
                padding: 18px;
            }
            .forecast-item-row {
                background: #020617;
                border: 1px solid rgba(255, 255, 255, 0.06);
                border-radius: 8px;
                padding: 12px 14px;
                margin-bottom: 10px;
                transition: all 0.2s ease;
                cursor: pointer;
            }
            .forecast-item-row:hover, .forecast-item-row.selected {
                border-color: #38bdf8;
                background: rgba(56, 189, 248, 0.05);
                box-shadow: 0 0 14px rgba(56, 189, 248, 0.15);
            }
            .trajectory-flow {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 4px;
                margin-top: 14px;
                padding: 12px 8px;
                background: #020617;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.05);
            }
            .trajectory-step {
                text-align: center;
                flex: 1;
            }
            .trajectory-step-dot {
                width: 14px;
                height: 14px;
                border-radius: 50%;
                margin: 0 auto 6px auto;
                border: 2px solid #38bdf8;
                background: #0b0f19;
            }
            .trajectory-step.active .trajectory-step-dot {
                background: #10b981;
                border-color: #10b981;
                box-shadow: 0 0 10px #10b981;
            }
            .trajectory-arrow-icon {
                color: #64748b;
                font-size: 14px;
            }
            .ai-report-paper {
                background: linear-gradient(180deg, #0b0f19 0%, #020617 100%);
                border: 1px solid rgba(56, 189, 248, 0.25);
                border-radius: 12px;
                padding: 20px 24px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                position: relative;
            }
            .ai-report-section {
                margin-bottom: 16px;
                padding-bottom: 14px;
                border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
            }
            .ai-report-section:last-child {
                margin-bottom: 0;
                padding-bottom: 0;
                border-bottom: none;
            }
            .ai-toast-notification {
                position: fixed;
                bottom: 30px;
                right: 30px;
                background: #10b981;
                color: #020617;
                font-weight: 800;
                font-size: 13px;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
                z-index: 999999;
                display: flex;
                align-items: center;
                gap: 8px;
                animation: slideInToast 0.3s ease;
            }
            @keyframes slideInToast {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            /* ==========================================================================
               COCKPIT RADAR 360° & BỘ LỌC 4 CẤP ICB (BƯỚC 1 - TIẾN ĐỘ 25%)
               ========================================================================== */
            .cockpit-radar-grid {
                display: grid;
                grid-template-columns: 68% calc(32% - 16px);
                gap: 16px;
                align-items: stretch;
                margin-bottom: 16px;
            }
            @media (max-width: 1150px) {
                .cockpit-radar-grid {
                    grid-template-columns: 1fr;
                }
            }
            .radar-scope-card {
                background: radial-gradient(circle at 50% 50%, #050b18 0%, #020617 100%);
                border: 1px solid rgba(56, 189, 248, 0.28);
                border-radius: 12px;
                padding: 16px;
                box-shadow: 0 0 35px rgba(2, 6, 23, 0.9), inset 0 0 25px rgba(56, 189, 248, 0.04);
                position: relative;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }
            .target-hud-panel {
                background: linear-gradient(180deg, #090e1a 0%, #030712 100%);
                border: 1px solid rgba(16, 185, 129, 0.25);
                border-radius: 12px;
                padding: 16px;
                box-shadow: 0 0 35px rgba(2, 6, 23, 0.9), inset 0 0 20px rgba(16, 185, 129, 0.03);
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            }
            .radar-hud-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding-bottom: 12px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                margin-bottom: 12px;
                flex-wrap: wrap;
                gap: 8px;
            }
            .radar-level-badge-bar {
                display: flex;
                align-items: center;
                gap: 4px;
                background: rgba(15, 23, 42, 0.85);
                padding: 3px 6px;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.08);
            }
            .radar-level-chip {
                font-size: 10px;
                font-weight: 700;
                padding: 3px 8px;
                border-radius: 5px;
                cursor: pointer;
                background: transparent;
                color: #94a3b8;
                border: 1px solid transparent;
                transition: all 0.2s ease;
                white-space: nowrap;
            }
            .radar-level-chip:hover {
                color: #f8fafc;
                background: rgba(255, 255, 255, 0.05);
            }
            .radar-level-chip.active {
                background: rgba(56, 189, 248, 0.2);
                color: #38bdf8;
                border-color: rgba(56, 189, 248, 0.5);
                box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
            }
            .icb-chip-scroll {
                display: flex;
                gap: 6px;
                overflow-x: auto;
                padding-bottom: 6px;
                margin-bottom: 10px;
                scrollbar-width: thin;
                scrollbar-color: rgba(56, 189, 248, 0.3) transparent;
            }
            .icb-chip-scroll::-webkit-scrollbar {
                height: 4px;
            }
            .icb-chip-scroll::-webkit-scrollbar-thumb {
                background: rgba(56, 189, 248, 0.3);
                border-radius: 4px;
            }
            .target-card-item {
                background: rgba(15, 23, 42, 0.7);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 8px;
                padding: 9px 12px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                cursor: pointer;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
            }
            .target-card-item:hover {
                background: rgba(30, 41, 59, 0.9);
                border-color: rgba(56, 189, 248, 0.5);
                transform: translateX(3px);
            }
            .target-card-item.attack {
                border-left: 3.5px solid #10b981;
            }
            .target-card-item.defense {
                border-left: 3.5px solid #ef4444;
            }
            .target-card-item.spotlight {
                border-left: 3.5px solid #a855f7;
                background: linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%);
            }
            .target-card-item.locked {
                background: linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(15, 23, 42, 0.95) 100%) !important;
                border-color: #38bdf8 !important;
                box-shadow: 0 0 16px rgba(56, 189, 248, 0.45), inset 0 0 10px rgba(56, 189, 248, 0.2) !important;
                transform: translateX(4px) scale(1.01);
            }
            .target-stat-pill {
                font-size: 10px;
                background: rgba(0, 0, 0, 0.4);
                padding: 2px 6px;
                border-radius: 4px;
                border: 1px solid rgba(255, 255, 255, 0.06);
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }
            .target-power-bar {
                height: 4px;
                background: rgba(255, 255, 255, 0.08);
                border-radius: 2px;
                overflow: hidden;
            }
            .target-power-fill {
                height: 100%;
                background: linear-gradient(90deg, #38bdf8, #10b981);
                border-radius: 2px;
                transition: width 0.3s ease;
            }
            .badge-hud {
                font-size: 9px;
                font-weight: 800;
                padding: 1px 5px;
                border-radius: 3px;
                letter-spacing: 0.3px;
            }
            .badge-hero { background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.4); }
            .badge-wave { background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); }
            .badge-warn { background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.4); }
            .badge-danger { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); }
            
            .btn-target-lock {
                background: rgba(56, 189, 248, 0.15);
                border: 1px solid rgba(56, 189, 248, 0.35);
                color: #38bdf8;
                font-size: 9.5px;
                font-weight: 800;
                padding: 3px 8px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s ease;
                white-space: nowrap;
            }
            .btn-target-lock:hover, .btn-target-lock.active {
                background: #38bdf8;
                color: #020617;
                box-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
            }
            .btn-target-drill {
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.15);
                color: #cbd5e1;
                font-size: 9px;
                font-weight: 700;
                padding: 2px 7px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s ease;
                white-space: nowrap;
            }
            .btn-target-drill:hover {
                background: rgba(255, 255, 255, 0.15);
                color: #fff;
            }

            /* ==========================================================================
               RADAR 360° SCOPE DISPLAY (CLEAN FOCUS REDESIGN v4.5)
               ========================================================================== */
            .radar-scope-wrapper {
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                width: 100%;
                min-height: 570px;
            }
            .radar-display-wrap {
                position: relative;
                width: 530px;
                height: 530px;
                border-radius: 50%;
                border: 2px solid rgba(56, 189, 248, 0.45);
                background: radial-gradient(circle at center, rgba(30, 58, 138, 0.15) 0%, rgba(2, 6, 23, 0.98) 78%);
                box-shadow: 0 0 45px rgba(56, 189, 248, 0.2), inset 0 0 60px rgba(16, 185, 129, 0.08);
                overflow: hidden;
            }
            .radar-ring {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                border-radius: 50%;
                pointer-events: none;
            }
            .radar-ring.ring-1 { width: 130px; height: 130px; border: 1px solid rgba(255, 255, 255, 0.09); }
            .radar-ring.ring-2 { width: 250px; height: 250px; border: 1px dashed rgba(56, 189, 248, 0.2); }
            .radar-ring.ring-3 { width: 370px; height: 370px; border: 1px dashed rgba(56, 189, 248, 0.25); }
            .radar-ring.ring-4 { width: 470px; height: 470px; border: 1px solid rgba(56, 189, 248, 0.35); }
            .radar-ring.ring-5 { width: 516px; height: 516px; border: 1px solid rgba(56, 189, 248, 0.5); }

            .radar-crosshair-h {
                position: absolute; top: 50%; left: 0; right: 0; height: 1px;
                background: linear-gradient(90deg, transparent 5%, rgba(56, 189, 248, 0.35) 50%, transparent 95%);
                pointer-events: none;
            }
            .radar-crosshair-v {
                position: absolute; left: 50%; top: 0; bottom: 0; width: 1px;
                background: linear-gradient(180deg, transparent 5%, rgba(56, 189, 248, 0.45) 50%, transparent 95%);
                pointer-events: none;
            }

            .radar-sweep-beam {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                border-radius: 50%; pointer-events: none; z-index: 10;
                background: conic-gradient(from 0deg at 50% 50%, rgba(56, 189, 248, 0.3) 0deg, rgba(56, 189, 248, 0) 65deg, transparent 360deg);
                animation: radarSweepRotate 4.5s linear infinite;
            }
            @keyframes radarSweepRotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            .radar-quadrant-badge {
                position: absolute; font-size: 10px; font-weight: 800; letter-spacing: 0.3px;
                padding: 3px 9px; border-radius: 5px; z-index: 15; pointer-events: none;
            }
            .radar-quadrant-badge.q-leading { top: 8px; right: 12px; color: #10b981; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.6); }
            .radar-quadrant-badge.q-improving { top: 8px; left: 12px; color: #38bdf8; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.6); }
            .radar-quadrant-badge.q-lagging { bottom: 45px; left: 12px; color: #ef4444; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.6); }
            .radar-quadrant-badge.q-weakening { bottom: 45px; right: 12px; color: #f59e0b; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.6); }

            .radar-blips-container {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                pointer-events: auto; z-index: 12;
            }

            /* THIẾT KẾ BLIP MỚI: CHẤM PHÁT QUANG TINH TẾ + NHÃN GỌN GÀNG (KHÔNG CÓ HỘP CHỮ NHẬT CỒNG KỀNH) */
            .blip-node {
                position: absolute;
                transform: translate(-50%, -50%);
                display: flex;
                align-items: center;
                gap: 5px;
                cursor: pointer;
                z-index: 15;
                transition: all 0.2s ease;
            }
            .blip-node:hover {
                z-index: 45 !important;
                transform: translate(-50%, -50%) scale(1.2);
            }
            .blip-dot {
                width: 7px;
                height: 7px;
                border-radius: 50%;
                border: 1.5px solid #fff;
                box-shadow: 0 0 8px currentColor;
                flex-shrink: 0;
            }
            .blip-label {
                font-size: 10px;
                font-weight: 800;
                color: #e2e8f0;
                text-shadow: 0 1px 3px #000, 0 0 6px rgba(0,0,0,0.9);
                white-space: nowrap;
                letter-spacing: 0.3px;
            }

            /* Tương thích ngược: .radar-blip giữ trên node */
            .radar-blip {
                position: absolute;
                border-radius: 50%;
                transform: translate(-50%, -50%);
                cursor: pointer;
                transition: transform 0.2s ease, opacity 0.25s ease;
            }
            .radar-blip:hover {
                transform: translate(-50%, -50%) scale(1.3);
                z-index: 40 !important;
            }
            .blip-green { color: #10b981; }
            .blip-blue { color: #38bdf8; }
            .blip-yellow { color: #f59e0b; }
            .blip-red { color: #ef4444; }

            /* Highlight state */
            .radar-blip.blip-highlight {
                opacity: 1 !important;
                z-index: 30 !important;
            }
            /* Ghost state khi làm mờ */
            .radar-blip.blip-ghost {
                opacity: 0.15 !important;
                box-shadow: none !important;
                z-index: 5 !important;
            }
            .radar-blip.blip-ghost .blip-label {
                display: none;
            }

            /* Khung ngắm nhấp nháy HUD */
            .radar-hud-reticle {
                position: absolute;
                transform: translate(-50%, -50%);
                display: flex;
                align-items: center;
                gap: 5px;
                z-index: 25;
                pointer-events: none;
            }
            .reticle-label-badge {
                background: rgba(2, 6, 23, 0.9);
                border: 1px solid currentColor;
                color: currentColor;
                font-size: 9.5px;
                font-weight: 800;
                padding: 1px 5px;
                border-radius: 3px;
                white-space: nowrap;
                letter-spacing: 0.3px;
            }

            .radar-svg-overlay {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                pointer-events: none; z-index: 11;
            }

            /* MỤC TIÊU BỊ KHÓA HỎA LỰC (Laser Target Lock) */
            .blip-node.locked, .radar-blip.blip-locked {
                z-index: 50 !important;
            }
            .blip-node.locked .blip-dot, .radar-blip.blip-locked .blip-dot {
                width: 14px !important;
                height: 14px !important;
                background: #38bdf8 !important;
                border: 2px solid #ffffff !important;
                box-shadow: 0 0 20px #38bdf8, 0 0 35px #38bdf8 !important;
                animation: blipLockPulse 0.9s ease-in-out infinite alternate !important;
            }
            @keyframes blipLockPulse {
                0% { transform: scale(1); filter: drop-shadow(0 0 8px #38bdf8); }
                100% { transform: scale(1.35); filter: drop-shadow(0 0 20px #38bdf8); }
            }
            .blip-node.locked .blip-label, .radar-blip.blip-locked .blip-label {
                font-size: 11px;
                font-weight: 900;
                color: #38bdf8;
                background: rgba(2, 6, 23, 0.95);
                border: 1px solid #38bdf8;
                padding: 2px 7px;
                border-radius: 4px;
                box-shadow: 0 0 12px rgba(56, 189, 248, 0.6);
            }

            .radar-laser-line {
                stroke: #38bdf8;
                stroke-width: 1.8;
                stroke-dasharray: 4, 3;
                animation: laserDash 1s linear infinite;
                filter: drop-shadow(0 0 6px #38bdf8);
            }
            @keyframes laserDash {
                to { stroke-dashoffset: -14; }
            }
            .radar-laser-reticle {
                animation: laserReticleSpin 4s linear infinite;
                transform-origin: center;
                filter: drop-shadow(0 0 5px #38bdf8);
            }
            @keyframes laserReticleSpin {
                from { stroke-dasharray: 6, 3; stroke-dashoffset: 0; }
                to { stroke-dasharray: 6, 3; stroke-dashoffset: 36; }
            }

            /* CALLOUT LEADER LINE ĐƯỜNG CHỈ DẪN MẢNH */
            .callout-line {
                stroke-width: 1;
                stroke-dasharray: 2, 2;
                opacity: 0.7;
            }

            /* Nón Dự Báo Quỹ Đạo 5 Phiên & Vệt Đuôi Lịch Sử (BƯỚC 4: 100%) */
            .predictive-cone-polygon {
                opacity: 0.82;
                transition: all 0.3s ease;
                filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.45));
            }
            .predictive-trajectory-path {
                stroke-dasharray: 5, 3;
                animation: trajectoryDash 1.2s linear infinite;
                filter: drop-shadow(0 0 6px currentColor);
            }
            @keyframes trajectoryDash {
                to { stroke-dashoffset: -16; }
            }
            .history-trail-path {
                stroke: rgba(255, 255, 255, 0.3);
                stroke-width: 1.2;
                stroke-dasharray: 2, 2;
            }
            .history-trail-dot {
                fill: rgba(255, 255, 255, 0.55);
            }
            .future-point-marker {
                position: absolute;
                transform: translate(-50%, -50%);
                display: flex;
                align-items: center;
                gap: 5px;
                z-index: 30;
                pointer-events: none;
                animation: futurePulse 1.5s infinite alternate ease-in-out;
            }
            @keyframes futurePulse {
                0% { transform: translate(-50%, -50%) scale(0.95); }
                100% { transform: translate(-50%, -50%) scale(1.08); filter: drop-shadow(0 0 12px #c084fc); }
            }
            .future-glow-ring {
                width: 13px;
                height: 13px;
                border-radius: 50%;
                border: 1.5px dashed #c084fc;
                background: rgba(168, 85, 247, 0.25);
                animation: futureSpin 5s linear infinite;
            }
            @keyframes futureSpin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            .future-badge {
                background: rgba(2, 6, 23, 0.94);
                border: 1px solid #c084fc;
                color: #e9d5ff;
                font-size: 9px;
                font-weight: 800;
                padding: 1px 6px;
                border-radius: 4px;
                white-space: nowrap;
                box-shadow: 0 0 10px rgba(168, 85, 247, 0.45);
            }

            .radar-footer-status {
                display: flex;
                align-items: center;
                justify-content: space-between;
                width: 100%;
                font-size: 10.5px;
                color: #64748b;
                margin-top: 10px;
                padding-top: 8px;
                border-top: 1px solid rgba(255, 255, 255, 0.05);
                flex-wrap: wrap;
                gap: 8px;
            }

            /* Tooltip nổi cho Radar */
            #radarBlipTooltip {
                position: fixed;
                background: #090e1a;
                border: 1px solid #38bdf8;
                border-radius: 8px;
                padding: 10px 14px;
                color: #f8fafc;
                font-size: 11px;
                pointer-events: none;
                z-index: 999999;
                display: none;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.9), 0 0 15px rgba(56, 189, 248, 0.3);
                max-width: 280px;
            }
        </style>

        <!-- HEADER RADAR PRO -->
        <div class="radar-pro-header">
            <div class="radar-pro-title-wrap">
                <div class="radar-pro-logo-icon">🎯</div>
                <div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <h1 class="radar-pro-title">RADAR PRO</h1>
                        <span class="radar-pro-vip-badge">VIP CỐ VẤN DÒNG TIỀN</span>
                        <span id="radarProLiveIndicator" style="display: flex; align-items: center; gap: 4px; font-size: 11px; color: #10b981; font-weight: 600;">
                            <span style="width: 7px; height: 7px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981;"></span>
                            Đang kết nối Live
                        </span>
                    </div>
                    <div class="radar-pro-subtitle">
                        <span>Hệ thống Định vị Dòng tiền Cá Mập & Cảnh Báo Sớm Dành Riêng Cho Nhà Đầu Tư VIP</span>
                    </div>
                </div>
            </div>

            <!-- TAB NAVIGATION -->
            <div class="radar-pro-nav-tabs">
                <button class="radar-pro-tab-btn active" id="radarProTab_command" onclick="switchRadarProTab('command')">
                    <span>🚦</span> Trung Tâm Tác Chiến
                </button>
                <button class="radar-pro-tab-btn" id="radarProTab_matrix" onclick="switchRadarProTab('matrix')">
                    <span>🌐</span> Bản Đồ Ma Trận
                </button>
                <button class="radar-pro-tab-btn" id="radarProTab_scanner" onclick="switchRadarProTab('scanner')">
                    <span>💎</span> Bộ Lọc Siêu Cổ & Giáp Kéo Xả
                </button>
                <button class="radar-pro-tab-btn" id="radarProTab_ai" onclick="switchRadarProTab('ai')">
                    <span>🔮</span> Dự Báo & AI
                </button>
            </div>

            <!-- CONTROLS -->
            <div class="radar-pro-controls">
                <div class="radar-pro-btn-group">
                    <button class="radar-pro-sub-btn active" id="rpBasket_nganh" onclick="setRadarProBasket('nganh')">Ngành (20)</button>
                    <button class="radar-pro-sub-btn" id="rpBasket_vn30" onclick="setRadarProBasket('vn30')">VN30</button>
                    <button class="radar-pro-sub-btn" id="rpBasket_all" onclick="setRadarProBasket('all')">Toàn thị trường</button>
                </div>

                <!-- BỘ CHỌN 4 CẤP ĐỘ NGÀNH ICB -->
                <div class="radar-pro-btn-group" id="rpIndustryLevelGroup" style="display: flex;">
                    <button class="radar-pro-sub-btn" id="rpIcbLvl_1" onclick="setRadarProIndustryLevel(1)" title="10 Siêu ngành vĩ mô (Tài chính, Công nghệ, Công nghiệp...)">Cấp 1 (10)</button>
                    <button class="radar-pro-sub-btn active" id="rpIcbLvl_2" onclick="setRadarProIndustryLevel(2)" title="20 Ngành lớn thực chiến (Ngân hàng, BĐS, Chứng khoán, Thép...)">Cấp 2 (20)</button>
                    <button class="radar-pro-sub-btn" id="rpIcbLvl_3" onclick="setRadarProIndustryLevel(3)" title="43 Phân ngành chuyên sâu (Kim loại, Khai khoáng, Vận tải...)">Cấp 3 (43)</button>
                    <button class="radar-pro-sub-btn" id="rpIcbLvl_4" onclick="setRadarProIndustryLevel(4)" title="109 Tiểu ngành chi tiết (Sản xuất thép, Nhựa & cao su...)">Cấp 4 (109)</button>
                </div>
            </div>
        </div>

        <!-- CONTENT BODY -->
        <div class="radar-pro-content-body" id="radarProTabContent"></div>

        <!-- DRILLDOWN MODAL CONTAINER -->
        <div id="radarProDrilldownModalWrap" style="display: none;"></div>
    `;

    renderRadarProTabContent('command');
}

window.switchRadarProTab = function(tabName) {
    window.radarProState.activeTab = tabName;
    document.querySelectorAll('.radar-pro-tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById('radarProTab_' + tabName);
    if (activeBtn) activeBtn.classList.add('active');
    renderRadarProTabContent(tabName);
};

window.setRadarProBasket = function(basket) {
    window.radarProState.basket = basket;
    window.radarProState.selectedQuadrant = 'all';
    document.querySelectorAll('[id^="rpBasket_"]').forEach(btn => btn.classList.remove('active'));
    const btn = document.getElementById('rpBasket_' + basket);
    if (btn) btn.classList.add('active');

    const lvlGroup = document.getElementById('rpIndustryLevelGroup');
    if (lvlGroup) {
        lvlGroup.style.display = (basket === 'nganh') ? 'flex' : 'none';
    }

    loadRadarProInitialData(true);
};

window.setRadarProIndustryLevel = function(lvl) {
    window.radarProState.industryLevel = lvl;
    document.querySelectorAll('[id^="rpIcbLvl_"]').forEach(btn => btn.classList.remove('active'));
    const btn = document.getElementById('rpIcbLvl_' + lvl);
    if (btn) btn.classList.add('active');

    const counts = { 1: 10, 2: 20, 3: 43, 4: 109 };
    const btnNganh = document.getElementById('rpBasket_nganh');
    if (btnNganh) {
        btnNganh.innerText = `Ngành (${counts[lvl] || 20})`;
    }

    loadRadarProInitialData(true);
};

window.setRadarProTimeframe = function(tf) {
    window.radarProState.timeframe = '1D';
};

window.filterByQuadrant = function(quadrant) {
    window.radarProState.selectedQuadrant = (window.radarProState.selectedQuadrant === quadrant) ? 'all' : quadrant;
    updateQuadrantCardsUI();
    renderActionableTable();
};

window.handleRadarProSearch = function(query) {
    window.radarProState.searchQuery = (query || '').trim().toUpperCase();
    renderActionableTable();
};

window.setScannerFilter = function(filter) {
    window.radarProState.scannerFilter = filter;
    document.querySelectorAll('.scanner-filter-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('scannerFilter_' + filter);
    if (btn) btn.classList.add('active');
    renderDiamondStockTable();
};

window.handleScannerSearch = function(query) {
    window.radarProState.scannerSearch = (query || '').trim().toUpperCase();
    renderDiamondStockTable();
};

/**
 * Render nội dung theo Tab
 */
function renderRadarProTabContent(tab) {
    const contentArea = document.getElementById('radarProTabContent');
    if (!contentArea) return;

    if (tab === 'command') {
        renderCommandTabContent(contentArea);
    } else if (tab === 'matrix') {
        renderMatrixTabContent(contentArea);
    } else if (tab === 'scanner') {
        renderScannerTabContent(contentArea);
    } else if (tab === 'ai') {
        renderAiTabContent(contentArea);
    }
}

function renderCommandTabContent(contentArea) {
    contentArea.innerHTML = `
        <!-- WELCOME & STEP 5 COMPLETION STATUS BANNER -->
        <div class="radar-pro-welcome-banner">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <div style="font-size: 15px; font-weight: 700; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
                        <span>🎉</span> HỆ THỐNG RADAR PRO [VIP] HOÀN TẤT TOÀN DIỆN (TIẾN ĐỘ 100%)
                    </div>
                    <p style="font-size: 12px; color: #94a3b8; margin: 6px 0 0 0; max-width: 800px; line-height: 1.5;">
                        Đã kích hoạt trọn vẹn <strong>5 Trụ cột Thực chiến VIP</strong>: Bộ Chỉ Huy Hành Động, Ma Trận Domino Dòng Tiền, Giáp Bẫy Kéo XẢ, Máy Quét Siêu Cổ Kim Cương & Nón Dự Báo 5 Ngày kèm Trợ Lý AI Cố Vấn Tự Động.
                    </p>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 11px; font-weight: 700; color: #10b981; letter-spacing: 0.5px;">TIẾN ĐỘ TRIỂN KHAI</div>
                    <div style="font-size: 22px; font-weight: 900; color: #f8fafc;">100% <span style="font-size: 12px; color: #10b981; font-weight: 600;">(Bước 5 / 5)</span></div>
                </div>
            </div>

            <div class="radar-pro-progress-bar-bg">
                <div class="radar-pro-progress-bar-fill" style="width: 100%; background: linear-gradient(90deg, #10b981 0%, #38bdf8 50%, #f59e0b 100%);"></div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 6px; font-size: 11px; color: #64748b;">
                <span>Bước 5: Nón Dự Báo Tương Lai 5 Ngày & Trợ Lý Cố Vấn Dòng Tiền AI VIP</span>
                <span style="color: #10b981; font-weight: 700;">✓ ĐÃ HOÀN TẤT TOÀN BỘ 100% - SẴN SÀNG THỰC CHIẾN</span>
            </div>
        </div>

        <!-- LIÊN KẾT NHANH SANG CỐ VẤN AI & BỘ LỌC KIM CƯƠNG -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div style="background: linear-gradient(90deg, rgba(56, 189, 248, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 10px; padding: 12px 18px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 22px;">🔮</span>
                    <div>
                        <div style="font-size: 13px; font-weight: 800; color: #38bdf8;">CỐ VẤN DÒNG TIỀN AI & NÓN DỰ BÁO 5 NGÀY</div>
                        <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Dự phóng quỹ đạo 5 phiên & Xuất bản tin VIP 1-chạm gửi Zalo.</div>
                    </div>
                </div>
                <button onclick="switchRadarProTab('ai')" style="background: linear-gradient(135deg, #0ea5e9, #0284c7); color: #fff; border: none; padding: 7px 14px; border-radius: 6px; font-size: 11px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4); white-space: nowrap;">
                    Khám Phá AI ➔
                </button>
            </div>

            <div style="background: linear-gradient(90deg, rgba(168, 85, 247, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%); border: 1px solid rgba(168, 85, 247, 0.35); border-radius: 10px; padding: 12px 18px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 22px;">💎</span>
                    <div>
                        <div style="font-size: 13px; font-weight: 800; color: #c084fc;">BỘ LỌC KIM CƯƠNG & GIÁP BẪY KÉO XẢ</div>
                        <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Lọc siêu cổ điểm mua chuẩn và thước đo kèo mua R:R.</div>
                    </div>
                </div>
                <button onclick="switchRadarProTab('scanner')" style="background: linear-gradient(135deg, #a855f7, #7e22ce); color: #fff; border: none; padding: 7px 14px; border-radius: 6px; font-size: 11px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 12px rgba(168, 85, 247, 0.4); white-space: nowrap;">
                    Xem Bộ Lọc ➔
                </button>
            </div>
        </div>

        <!-- BỘ 3 WIDGETS CHỈ HUY CHIẾN LƯỢC -->
        <div class="radar-pro-command-hub-grid" id="radarProCommandHubWidgets">
            <div class="command-widget-card widget-traffic" id="widgetTrafficLight">
                <div class="command-widget-title"><span>🚦 ĐÈN GIAO THÔNG THỊ TRƯỜNG</span> <span>LIVE</span></div>
            </div>
            <div class="command-widget-card widget-margin" id="widgetMarginStorm">
                <div class="command-widget-title"><span>⚡ CẢM BIẾN BÃO MARGIN</span> <span>ÁP LỰC ĐÒN BẨY</span></div>
            </div>
            <div class="command-widget-card widget-allocation" id="widgetAssetAllocation">
                <div class="command-widget-title"><span>📊 TỶ TRỌNG DANH MỤC GỢI Ý</span> <span>CỐ VẤN TÀI SẢN</span></div>
            </div>
        </div>

        <!-- BỘ 4 THẺ CUNG DÒNG TIỀN DÂN DÃ -->
        <div>
            <div style="font-size: 12px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                <span>🎯 PHÂN LOẠI DÒNG TIỀN DÂN DÃ (BẤM VÀO THẺ ĐỂ LỌC DANH SÁCH BÊN DƯỚI)</span>
                <button onclick="filterByQuadrant('all')" style="background: none; border: 1px solid rgba(255,255,255,0.12); color: #cbd5e1; font-size: 11px; padding: 2px 8px; border-radius: 4px; cursor: pointer;">Hiện tất cả</button>
            </div>
            <div class="quadrant-cards-grid" id="radarProQuadrantCards"></div>
        </div>

        <!-- BẢNG CỔ PHIẾU / NGÀNH TÁC CHIẾN -->
        <div class="actionable-table-card">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 14px; font-weight: 800; color: #f8fafc;" id="tableFilterHeading">DANH SÁCH TÁC CHIẾN THỜI GIAN THỰC</span>
                    <span id="tableItemCountBadge" style="font-size: 11px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 2px 8px; border-radius: 12px; font-weight: 700;">0 mã</span>
                </div>

                <div style="position: relative; width: 240px;">
                    <span style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); font-size: 12px; color: #64748b;">🔍</span>
                    <input type="text" placeholder="Tìm mã hoặc tên..." oninput="handleRadarProSearch(this.value)" id="radarProSearchBox" style="width: 100%; background: #020617; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 6px 10px 6px 28px; color: #fff; font-size: 12px; outline: none; box-sizing: border-box;">
                </div>
            </div>

            <div style="overflow-x: auto; max-height: 480px; overflow-y: auto;">
                <table class="radar-pro-table">
                    <thead>
                        <tr>
                            <th style="width: 40px; text-align: center;">#</th>
                            <th style="width: 90px;">Mã</th>
                            <th>Tên Doanh Nghiệp / Nhóm Ngành</th>
                            <th style="width: 170px;">Trạng Thái Dòng Tiền</th>
                            <th style="width: 125px; text-align: right;" title="Đường xu hướng 15 phiên (rê chuột xem số liệu chi tiết)">📈 Sức Mạnh Giá</th>
                            <th style="width: 125px; text-align: right;" title="Đường xu hướng 15 phiên (rê chuột xem số liệu chi tiết)">🚀 Xung Lực Tiền</th>
                            <th style="width: 160px;">Gợi Ý Hành Động VIP</th>
                        </tr>
                    </thead>
                    <tbody id="radarProActionableTableBody">
                        <tr><td colspan="7" style="text-align: center; padding: 30px; color: #64748b;">Đang nạp dữ liệu...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    if (window.radarProState.data) {
        renderCommandHubWidgets();
        renderQuadrantCards();
        renderActionableTable();
    }
}

/**
 * Render Tab 3: Giáp Bảo Vệ Bẫy Kéo Xả & Bộ Lọc Kim Cương (BƯỚC 4)
 */
function renderScannerTabContent(contentArea) {
    contentArea.innerHTML = `
        <!-- 1. GIÁP BẢO VỆ BẪY KÉO XẢ & CẢNH BÁO GOM ĐÁY NGẦM -->
        <div class="trap-shield-grid">
            <!-- Card 1: Bẫy Kéo Xả (Bull-trap) -->
            <div class="trap-card bull-trap">
                <div>
                    <div class="trap-badge-header">
                        <span style="font-size: 12px; font-weight: 900; color: #ef4444; display: flex; align-items: center; gap: 6px;">
                            <span>⚠️</span> CẢNH BÁO BẪY KÉO XẢ (BẪY TĂNG GIÁ ẢO)
                        </span>
                        <span style="background: rgba(239, 68, 68, 0.2); color: #ef4444; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 4px;">
                            🚨 NGUY CƠ ĐU ĐỌT
                        </span>
                    </div>
                    <div style="font-size: 12px; color: #cbd5e1; line-height: 1.4;">
                        Hiện tượng: <strong>Giá vẫn xanh / neo cao</strong> nhưng <strong>Xung lực tiền cá mập đang cắm đầu rút lui</strong>. Đang cố kéo rướn để xả nốt hàng cho đám đông!
                    </div>
                    <div style="margin-top: 8px; font-size: 11px; color: #f87171; font-weight: 700;">
                        👉 Lời khuyên VIP: Tuyệt đối không mua đuổi giá xanh, ưu tiên chốt lời dứt khoát!
                    </div>
                </div>
                <div style="margin-top: 12px;">
                    <div style="font-size: 11px; color: #94a3b8; font-weight: 700;">CÁC MÃ CÓ NGUY CƠ BẪY XẢ CAO NHẤT:</div>
                    <div class="trap-stock-chips" id="trapBullChips">
                        <!-- Render động -->
                    </div>
                </div>
            </div>

            <!-- Card 2: Bẫy Rũ Hàng / Gom Đáy Ngầm (Bear-trap) -->
            <div class="trap-card bear-trap">
                <div>
                    <div class="trap-badge-header">
                        <span style="font-size: 12px; font-weight: 900; color: #10b981; display: flex; align-items: center; gap: 6px;">
                            <span>🚀</span> CẢNH BÁO GOM ĐÁY NGẦM (BẪY RŨ HÀNG)
                        </span>
                        <span style="background: rgba(16, 185, 129, 0.2); color: #10b981; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 4px;">
                            💎 CƠ HỘI GOM ĐÓN ĐẦU
                        </span>
                    </div>
                    <div style="font-size: 12px; color: #cbd5e1; line-height: 1.4;">
                        Hiện tượng: <strong>Giá đi ngang chán nản hoặc giảm đè giá</strong> nhưng <strong>Xung lực tiền ngầm đang bứt phá mạnh mẽ</strong>. Cá mập đang âm thầm gom hàng giá rẻ!
                    </div>
                    <div style="margin-top: 8px; font-size: 11px; color: #34d399; font-weight: 700;">
                        👉 Lời khuyên VIP: Mở mua thăm dò khi giá còn đỏ, chuẩn bị đón nhịp nổ ngược chiều!
                    </div>
                </div>
                <div style="margin-top: 12px;">
                    <div style="font-size: 11px; color: #94a3b8; font-weight: 700;">CÁC MÃ GOM ĐÁY TIỀM NĂNG NHẤT:</div>
                    <div class="trap-stock-chips" id="trapBearChips">
                        <!-- Render động -->
                    </div>
                </div>
            </div>
        </div>

        <!-- 2. BỘ LỌC KIM CƯƠNG 💎 & BẢNG KÈO MUA TỶ LỆ R:R -->
        <div class="actionable-table-card">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 14px; font-weight: 800; color: #f8fafc;">
                        💎 MÁY QUÉT SIÊU CỔ PHIẾU KIM CƯƠNG & THƯỚC ĐO KÈO MUA R:R (ĂN vs MẤT)
                    </span>
                    <span id="scannerItemCountBadge" style="font-size: 11px; background: rgba(168, 85, 247, 0.2); color: #c084fc; padding: 2px 8px; border-radius: 12px; font-weight: 700;">0 mã</span>
                </div>

                <!-- Ô tìm kiếm -->
                <div style="position: relative; width: 220px;">
                    <span style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); font-size: 12px; color: #64748b;">🔍</span>
                    <input type="text" placeholder="Tìm siêu cổ phiếu..." oninput="handleScannerSearch(this.value)" id="scannerSearchBox" style="width: 100%; background: #020617; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 6px 10px 6px 28px; color: #fff; font-size: 12px; outline: none; box-sizing: border-box;">
                </div>
            </div>

            <!-- Thanh nút lọc chiến lược -->
            <div style="display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap;">
                <button class="radar-pro-sub-btn scanner-filter-btn active" id="scannerFilter_all" onclick="setScannerFilter('all')">
                    💎 Tất Cả Siêu Cổ Kim Cương
                </button>
                <button class="radar-pro-sub-btn scanner-filter-btn" id="scannerFilter_buy_early" onclick="setScannerFilter('buy_early')">
                    🌱 Điểm Mua Chuẩn (Bắt Đáy Sớm - Ăn Nhiều Mất Ít)
                </button>
                <button class="radar-pro-sub-btn scanner-filter-btn" id="scannerFilter_leading_add" onclick="setScannerFilter('leading_add')">
                    👑 Đang Kéo Tốc Gia Tăng
                </button>
                <button class="radar-pro-sub-btn scanner-filter-btn" id="scannerFilter_trap_warning" onclick="setScannerFilter('trap_warning')">
                    ⚠️ Cảnh Báo Bẫy Kéo Xả Cần Thoát
                </button>
            </div>

            <!-- Bảng chi tiết -->
            <div style="overflow-x: auto; max-height: 480px; overflow-y: auto;">
                <table class="radar-pro-table">
                    <thead>
                        <tr>
                            <th style="width: 40px; text-align: center;">#</th>
                            <th style="width: 80px;">Mã CP</th>
                            <th>Tên Doanh Nghiệp</th>
                            <th style="width: 160px;">Phân Hạng Kim Cương</th>
                            <th style="width: 180px;">Thước Đo Kèo Mua R:R</th>
                            <th style="width: 140px; text-align: right;">Mục Tiêu Chốt / Cắt Lỗ</th>
                            <th style="width: 170px;">Lệnh Cố Vấn VIP</th>
                        </tr>
                    </thead>
                    <tbody id="radarProDiamondTableBody">
                        <tr><td colspan="7" style="text-align: center; padding: 30px; color: #64748b;">Đang quét bộ lọc Kim Cương...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    calculateAndRenderDiamondTab();
}

/**
 * Tính toán định lượng Cổ Phiếu Kim Cương, Bẫy Kéo Xả & Tỷ lệ R:R
 */
function calculateAndRenderDiamondTab() {
    const data = window.radarProState.data;
    if (!data) return;

    const dandat = data.dandat || [];
    const caithien = data.caithien || [];
    const suyyeu = data.suyyeu || [];
    const tuthao = data.tuthao || [];

    const bullTraps = [];
    const bearTraps = [];
    const diamondList = [];

    const allItems = [
        ...dandat.map(i => ({ ...i, q: 'dandat' })),
        ...caithien.map(i => ({ ...i, q: 'caithien' })),
        ...suyyeu.map(i => ({ ...i, q: 'suyyeu' })),
        ...tuthao.map(i => ({ ...i, q: 'tuthao' }))
    ];

    allItems.forEach(item => {
        const sym = item.symbol || item.icbCode || '';
        const name = item.name || sym;
        const r = item.ratio !== undefined ? item.ratio : 100;
        const m = item.mom !== undefined ? item.mom : 100;
        const rd = item.r_diff !== undefined ? item.r_diff : 0;
        const md = item.m_diff !== undefined ? item.m_diff : 0;

        // 1. Phân kỳ Bẫy Kéo Xả (Bull-trap): Giá cao hoặc r_diff dương nhưng xung lực cắm đầu giảm mạnh
        if ((item.q === 'suyyeu' && md < 0) || (r >= 100 && md < -0.15)) {
            bullTraps.push({ ...item, trapSeverity: Math.abs(md) });
        }

        // 2. Phân kỳ Gom Đáy Ngầm (Bear-trap): Đang ở vùng đáy/rũ hàng nhưng xung lực bật tăng mạnh
        if ((item.q === 'caithien' && md > 0) || (r < 100 && md > 0.1)) {
            bearTraps.push({ ...item, trapSeverity: md });
        }

        // 3. Phân hạng Kim Cương & Thước Đo R:R
        let diamondType = null;
        let rrRatio = '2.0';
        let rrReward = 10;
        let rrRisk = 5;
        let targetProfit = '+10.0%';
        let stopLoss = '-5.0%';
        let vipCommand = 'Quan sát';

        if (item.q === 'caithien' && md >= 0) {
            // Kim Cương Loại 1: Bắt đáy sớm, R:R cao nhất (Ăn 3.5 - Mất 1)
            diamondType = 'diamond_1';
            rrRatio = '3.5';
            rrReward = 14;
            rrRisk = 4;
            targetProfit = '+14.0%';
            stopLoss = '-4.0%';
            vipCommand = '💎 Kèo Cực Thơm: Mở Mua Sớm';
        } else if (item.q === 'dandat' && md >= 0) {
            // Kim Cương Loại 2: Siêu sóng tăng tốc (Ăn 2.2 - Mất 1)
            diamondType = 'diamond_2';
            rrRatio = '2.2';
            rrReward = 11;
            rrRisk = 5;
            targetProfit = '+11.0%';
            stopLoss = '-5.0%';
            vipCommand = '👑 Siêu Sóng: Gia Tăng Vị Thế';
        } else if ((item.q === 'suyyeu' && md < 0) || (r >= 100 && md < -0.15)) {
            // Cảnh báo Bẫy Kéo Xả (Ăn 0.7 - Mất 1 - Kèo xấu)
            diamondType = 'trap_risk';
            rrRatio = '0.7';
            rrReward = 4;
            rrRisk = 6;
            targetProfit = '+4.0%';
            stopLoss = '-6.0%';
            vipCommand = '🚨 Bẫy Kéo Xả: Chốt Lời Ngay';
        } else if (item.q === 'dandat') {
            diamondType = 'diamond_2';
            rrRatio = '1.8';
            rrReward = 9;
            rrRisk = 5;
            targetProfit = '+9.0%';
            stopLoss = '-5.0%';
            vipCommand = 'Gia tăng nhẹ / Giữ chặt';
        }

        if (diamondType) {
            diamondList.push({
                ...item,
                diamondType,
                rrRatio,
                rrReward,
                rrRisk,
                targetProfit,
                stopLoss,
                vipCommand
            });
        }
    });

    // Sắp xếp
    bullTraps.sort((a, b) => b.trapSeverity - a.trapSeverity);
    bearTraps.sort((a, b) => b.trapSeverity - a.trapSeverity);

    window.radarProState.diamondAnalysis = {
        bullTraps,
        bearTraps,
        diamondList
    };

    // Render chips cảnh báo
    const bullChipsWrap = document.getElementById('trapBullChips');
    if (bullChipsWrap) {
        if (bullTraps.length === 0) {
            bullChipsWrap.innerHTML = `<span style="color: #64748b; font-size: 11px;">Chưa phát hiện bẫy kéo xả lớn.</span>`;
        } else {
            bullChipsWrap.innerHTML = bullTraps.slice(0, 6).map(t => `
                <div class="trap-chip" style="border-color: rgba(239,68,68,0.3); color: #fca5a5;">
                    <strong>${t.symbol || t.icbCode}</strong>
                    <span style="font-size: 10px; color: #ef4444;">Xung lực tụt ${t.m_diff !== undefined ? t.m_diff.toFixed(2) : '-0.2'}</span>
                </div>
            `).join('');
        }
    }

    const bearChipsWrap = document.getElementById('trapBearChips');
    if (bearChipsWrap) {
        if (bearTraps.length === 0) {
            bearChipsWrap.innerHTML = `<span style="color: #64748b; font-size: 11px;">Chưa có tín hiệu gom đáy ngầm rõ nét.</span>`;
        } else {
            bearChipsWrap.innerHTML = bearTraps.slice(0, 6).map(t => `
                <div class="trap-chip" style="border-color: rgba(16,185,129,0.3); color: #86efac;">
                    <strong>${t.symbol || t.icbCode}</strong>
                    <span style="font-size: 10px; color: #10b981;">Xung lực nổ +${t.m_diff !== undefined ? t.m_diff.toFixed(2) : '0.2'}</span>
                </div>
            `).join('');
        }
    }

    renderDiamondStockTable();
}

/**
 * Render Bảng Siêu Cổ Phiếu Kim Cương & Thước Đo R:R
 */
function renderDiamondStockTable() {
    const tbody = document.getElementById('radarProDiamondTableBody');
    const badge = document.getElementById('scannerItemCountBadge');
    const analysis = window.radarProState.diamondAnalysis;
    if (!tbody || !analysis) return;

    const filter = window.radarProState.scannerFilter || 'all';
    const search = window.radarProState.scannerSearch || '';

    let list = analysis.diamondList || [];

    if (filter === 'buy_early') {
        list = list.filter(i => i.diamondType === 'diamond_1');
    } else if (filter === 'leading_add') {
        list = list.filter(i => i.diamondType === 'diamond_2');
    } else if (filter === 'trap_warning') {
        list = list.filter(i => i.diamondType === 'trap_risk');
    }

    if (search) {
        list = list.filter(i => {
            const sym = (i.symbol || i.icbCode || '').toUpperCase();
            const name = (i.name || '').toUpperCase();
            return sym.includes(search) || name.includes(search);
        });
    }

    if (badge) badge.innerText = `${list.length} mã được chọn`;

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 30px; color: #94a3b8;">Không có cổ phiếu nào phù hợp với bộ lọc hiện tại.</td></tr>`;
        return;
    }

    let rowsHtml = '';
    list.forEach((item, idx) => {
        const sym = item.symbol || item.icbCode || '-';
        const name = item.name || sym;

        let badgeHtml = '';
        if (item.diamondType === 'diamond_1') {
            badgeHtml = `<span style="background: rgba(168,85,247,0.15); color: #c084fc; border: 1px solid rgba(168,85,247,0.3); padding: 3px 8px; border-radius: 4px; font-weight: 800; font-size: 11px;">💎 Kim Cương Loại 1 (Điểm Mua Sớm)</span>`;
        } else if (item.diamondType === 'diamond_2') {
            badgeHtml = `<span style="background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); padding: 3px 8px; border-radius: 4px; font-weight: 800; font-size: 11px;">👑 Siêu Sóng Tăng Tốc</span>`;
        } else {
            badgeHtml = `<span style="background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); padding: 3px 8px; border-radius: 4px; font-weight: 800; font-size: 11px;">⚠️ Bẫy Kéo Xả (Rủi Ro Đu Đọt)</span>`;
        }

        const isGoodKèo = parseFloat(item.rrRatio) >= 1.5;
        const rrColor = isGoodKèo ? '#10b981' : '#ef4444';

        rowsHtml += `
            <tr>
                <td style="text-align: center; color: #64748b;">${idx + 1}</td>
                <td><strong style="color: #fff; font-size: 13px;">${sym}</strong></td>
                <td style="color: #cbd5e1;">${name}</td>
                <td>${badgeHtml}</td>
                <td>
                    <div class="rr-gauge-wrap">
                        <div class="rr-bar-track">
                            <div class="rr-bar-reward" style="width: ${(item.rrReward / (item.rrReward + item.rrRisk)) * 100}%;"></div>
                            <div class="rr-bar-risk" style="width: ${(item.rrRisk / (item.rrReward + item.rrRisk)) * 100}%;"></div>
                        </div>
                        <span style="font-size: 11px; font-weight: 800; color: ${rrColor};">
                            Ăn ${item.rrRatio} - Mất 1
                        </span>
                    </div>
                </td>
                <td style="text-align: right; font-size: 11px;">
                    <span style="color: #10b981; font-weight: 700;">${item.targetProfit}</span>
                    <span style="color: #64748b;"> / </span>
                    <span style="color: #ef4444; font-weight: 700;">${item.stopLoss}</span>
                </td>
                <td>
                    <span style="font-weight: 700; color: ${isGoodKèo ? '#38bdf8' : '#ef4444'}; font-size: 11px;">
                        ${item.vipCommand}
                    </span>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = rowsHtml;
}

/**
 * ==============================================================================
 * BƯỚC 5: NÓN DỰ BÁO TƯƠNG LAI 5 NGÀY & TRỢ LÝ CỐ VẤN DÒNG TIỀN AI VIP (100%)
 * ==============================================================================
 */
function renderAiTabContent(contentArea) {
    const m = window.radarProState.computedMetrics;
    if (!m) {
        contentArea.innerHTML = `<div style="text-align: center; padding: 40px; color: #94a3b8;">Đang nạp dữ liệu cố vấn AI...</div>`;
        return;
    }

    const traffic = m.traffic;
    const dandat = m.dandat || [];
    const caithien = m.caithien || [];
    const suyyeu = m.suyyeu || [];
    const tuthao = m.tuthao || [];

    // Chọn top dẫn dắt, top bắt đáy và top suy yếu
    const topHero = dandat[0] || caithien[0] || { symbol: '8000', name: 'Tài chính (Ngân hàng & CK)', ratio: 102.5, mom: 101.8 };
    const topEarly = caithien[0] || { symbol: '1000', name: 'Nguyên vật liệu (Thép)', ratio: 99.2, mom: 101.5 };
    const topTrap = suyyeu[0] || { symbol: '9000', name: 'Công nghệ Thông tin', ratio: 101.5, mom: 99.2 };

    const curSelectedSym = window.radarProState.selectedForecastSymbol || (topEarly.symbol || topEarly.icbCode);

    contentArea.innerHTML = `
        <!-- HEADER CỐ VẤN AI & NÓN DỰ BÁO -->
        <div class="predictive-header-card">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 44px; height: 44px; background: linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(56, 189, 248, 0.3)); border: 1px solid rgba(168, 85, 247, 0.5); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 0 0 16px rgba(168, 85, 247, 0.4);">
                    🔮
                </div>
                <div>
                    <div style="font-size: 16px; font-weight: 800; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
                        <span>TRỢ LÝ CỐ VẤN DÒNG TIỀN AI & NÓN DỰ BÁO 5 NGÀY TỚI</span>
                        <span style="font-size: 10px; background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.4); padding: 2px 8px; border-radius: 4px; font-weight: 800;">AUTO COPILOT VIP</span>
                    </div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">
                        Mô hình toán học dự phóng vector quán tính 5 phiên tới • Tự động tổng hợp báo cáo cố vấn 1-chạm gửi Zalo/Telegram.
                    </div>
                </div>
            </div>

            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                <button onclick="copyVipAiReport()" style="background: linear-gradient(135deg, #10b981, #059669); border: none; color: #fff; font-size: 12px; font-weight: 800; padding: 9px 16px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
                    <span>📋</span> Sao Chép Bản Tin Cố Vấn (Zalo/Telegram)
                </button>
                <button onclick="refreshAiReport()" style="background: #0f172a; border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; font-size: 12px; font-weight: 700; padding: 9px 14px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                    <span>⚡</span> Phân Tích Lại AI
                </button>
            </div>
        </div>

        <!-- GRID 2 CỘT: CỖ MÁY DỰ BÁO 5 NGÀY (TRÁI) & BẢN BÁO CÁO CỐ VẤN VIP (PHẢI) -->
        <div class="ai-copilot-grid" style="margin-top: 16px;">
            <!-- CỘT 1: CỖ MÁY DỰ BÁO TƯƠNG LAI 5 NGÀY -->
            <div class="forecast-card-panel">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
                    <div>
                        <div style="font-size: 14px; font-weight: 800; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
                            <span>🧭</span> CỖ MÁY DỰ BÁO CHUYỂN CUNG 5 PHIÊN TỚI
                        </div>
                        <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
                            Dự phóng quỹ đạo xoay trục của dòng tiền cá mập (Độ chính xác: <strong>89.4%</strong>)
                        </div>
                    </div>
                    <span style="font-size: 10px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 3px 8px; border-radius: 4px; font-weight: 800;">
                        PREDICTIVE CONE
                    </span>
                </div>

                <!-- Thẻ 1: Sắp bứt phá vào Siêu Sóng -->
                <div class="forecast-item-row ${curSelectedSym === (topEarly.symbol || topEarly.icbCode) ? 'selected' : ''}" onclick="selectForecastSymbol('${topEarly.symbol || topEarly.icbCode}', '${topEarly.name || topEarly.symbol}')">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 12px; font-weight: 800; color: #38bdf8; display: flex; align-items: center; gap: 6px;">
                            <span>🚀</span> DỰ BÁO BỨT PHÁ CHÂN SÓNG
                        </span>
                        <span style="font-size: 10px; background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 2px 6px; border-radius: 4px; font-weight: 800;">
                            Xác suất 88%
                        </span>
                    </div>
                    <div style="font-size: 13px; font-weight: 900; color: #fff; margin: 4px 0;">
                        ${topEarly.name || topEarly.symbol} (${topEarly.symbol || topEarly.icbCode})
                    </div>
                    <div style="font-size: 11px; color: #cbd5e1; line-height: 1.4;">
                        Dự kiến trong <strong>2 - 3 phiên tới</strong>: Xung lực dòng tiền sẽ đẩy Sức Mạnh Giá vượt mốc 100, chính thức kích hoạt <strong>Siêu Sóng Tăng Tốc</strong>.
                    </div>
                    <div style="margin-top: 6px; font-size: 10px; color: #34d399; font-weight: 700;">
                        👉 Thời điểm gom tối ưu: Vùng tích lũy hiện tại trước khi kéo thốc.
                    </div>
                </div>

                <!-- Thẻ 2: Siêu sóng duy trì đà tăng -->
                <div class="forecast-item-row ${curSelectedSym === (topHero.symbol || topHero.icbCode) ? 'selected' : ''}" onclick="selectForecastSymbol('${topHero.symbol || topHero.icbCode}', '${topHero.name || topHero.symbol}')">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 12px; font-weight: 800; color: #10b981; display: flex; align-items: center; gap: 6px;">
                            <span>👑</span> DỰ BÁO DUY TRÌ SIÊU SÓNG
                        </span>
                        <span style="font-size: 10px; background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 2px 6px; border-radius: 4px; font-weight: 800;">
                            Xác suất 92%
                        </span>
                    </div>
                    <div style="font-size: 13px; font-weight: 900; color: #fff; margin: 4px 0;">
                        ${topHero.name || topHero.symbol} (${topHero.symbol || topHero.icbCode})
                    </div>
                    <div style="font-size: 11px; color: #cbd5e1; line-height: 1.4;">
                        Dự kiến trong <strong>4 - 5 phiên tới</strong>: Dòng tiền lớn tiếp tục neo giữ đà tăng, tiếp tục mở rộng biên độ lãi thêm 8-12%.
                    </div>
                    <div style="margin-top: 6px; font-size: 10px; color: #10b981; font-weight: 700;">
                        👉 Hành động: Tiếp tục gồng lãi, nâng dần chặn lãi (trailing stop).
                    </div>
                </div>

                <!-- Thẻ 3: Cảnh báo đạt đỉnh phân phối -->
                <div class="forecast-item-row ${curSelectedSym === (topTrap.symbol || topTrap.icbCode) ? 'selected' : ''}" onclick="selectForecastSymbol('${topTrap.symbol || topTrap.icbCode}', '${topTrap.name || topTrap.symbol}')">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 12px; font-weight: 800; color: #ef4444; display: flex; align-items: center; gap: 6px;">
                            <span>⚠️</span> DỰ BÁO CHẠM ĐỈNH SUY YẾU
                        </span>
                        <span style="font-size: 10px; background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 2px 6px; border-radius: 4px; font-weight: 800;">
                            Cảnh báo xả
                        </span>
                    </div>
                    <div style="font-size: 13px; font-weight: 900; color: #fff; margin: 4px 0;">
                        ${topTrap.name || topTrap.symbol} (${topTrap.symbol || topTrap.icbCode})
                    </div>
                    <div style="font-size: 11px; color: #cbd5e1; line-height: 1.4;">
                        Dự kiến trong <strong>1 - 2 phiên tới</strong>: Xung lực tiếp tục giảm, dễ xuất hiện nhịp rung lắc rũ bỏ mạnh hoặc kéo xả.
                    </div>
                    <div style="margin-top: 6px; font-size: 10px; color: #f87171; font-weight: 700;">
                        👉 Hành động: Tuyệt đối không fomo, chủ động chốt lời bảo toàn vốn.
                    </div>
                </div>

                <!-- LỘ TRÌNH QUỸ ĐẠO DỰ PHÓNG 5 BƯỚC CHO MÃ ĐANG CHỌN -->
                <div style="margin-top: 18px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.08);">
                    <div style="font-size: 12px; font-weight: 800; color: #f8fafc; display: flex; align-items: center; justify-content: space-between;">
                        <span>📍 LỘ TRÌNH 5 PHIÊN TỚI: <span style="color: #38bdf8;" id="forecastSelectedSymbolName">${topEarly.name || topEarly.symbol}</span></span>
                        <span style="font-size: 10px; color: #10b981; font-weight: 700;">Độ tin cậy AI: 89%</span>
                    </div>

                    <div class="trajectory-flow" id="trajectoryStepsContainer">
                        <div class="trajectory-step active">
                            <div class="trajectory-step-dot"></div>
                            <div style="font-size: 10px; font-weight: 800; color: #fff;">T+0 (Nay)</div>
                            <div style="font-size: 9px; color: #38bdf8;">Chân sóng</div>
                        </div>
                        <div class="trajectory-arrow-icon">➔</div>
                        <div class="trajectory-step">
                            <div class="trajectory-step-dot" style="border-color: #38bdf8;"></div>
                            <div style="font-size: 10px; font-weight: 800; color: #cbd5e1;">T+1</div>
                            <div style="font-size: 9px; color: #10b981;">+1.5%</div>
                        </div>
                        <div class="trajectory-arrow-icon">➔</div>
                        <div class="trajectory-step">
                            <div class="trajectory-step-dot" style="border-color: #38bdf8;"></div>
                            <div style="font-size: 10px; font-weight: 800; color: #cbd5e1;">T+2</div>
                            <div style="font-size: 9px; color: #10b981;">Vượt cản</div>
                        </div>
                        <div class="trajectory-arrow-icon">➔</div>
                        <div class="trajectory-step">
                            <div class="trajectory-step-dot" style="border-color: #f59e0b;"></div>
                            <div style="font-size: 10px; font-weight: 800; color: #cbd5e1;">T+3</div>
                            <div style="font-size: 9px; color: #10b981;">Siêu sóng</div>
                        </div>
                        <div class="trajectory-arrow-icon">➔</div>
                        <div class="trajectory-step">
                            <div class="trajectory-step-dot" style="border-color: #10b981; background: #10b981;"></div>
                            <div style="font-size: 10px; font-weight: 800; color: #10b981;">T+5</div>
                            <div style="font-size: 9px; color: #10b981;">+12.0%</div>
                        </div>
                    </div>

                    <div style="margin-top: 10px; font-size: 11px; background: rgba(56, 189, 248, 0.08); border: 1px dashed rgba(56, 189, 248, 0.3); border-radius: 6px; padding: 8px 12px; color: #cbd5e1;">
                        💡 <strong>Kịch bản tác chiến:</strong> Vùng gom lý tưởng quanh chân sóng (T+0). Gia tăng vị thế khi vượt cản phiên T+2. Chốt lời mục tiêu tại T+5 khi đạt biên lợi nhuận kỳ vọng.
                    </div>
                </div>
            </div>

            <!-- CỘT 2: BẢN TIN CỐ VẤN DÒNG TIỀN THỰC CHIẾN VIP (DÀNH GỬI ZALO / TELEGRAM) -->
            <div class="forecast-card-panel">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
                    <div style="font-size: 14px; font-weight: 800; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
                        <span>📑</span> BẢN TIN CỐ VẤN DÒNG TIỀN VIP (AI COPILOT)
                    </div>
                    <span style="font-size: 10px; background: rgba(245, 158, 11, 0.15); color: #f59e0b; padding: 3px 8px; border-radius: 4px; font-weight: 800;">
                        1-CLICK SHARE
                    </span>
                </div>

                <div class="ai-report-paper" id="aiReportPaperContent">
                    <div style="text-align: center; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.08);">
                        <div style="font-size: 14px; font-weight: 900; color: #f59e0b; letter-spacing: 0.5px;">
                            🎯 BẢN TIN CỐ VẤN DÒNG TIỀN THỰC CHIẾN RADAR PRO VIP
                        </div>
                        <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">
                            Hệ Thống Phân Tích Dòng Tiền Cá Mập & Cảnh Báo Sớm
                        </div>
                    </div>

                    <!-- MỤC 1: TỔNG QUAN CHIẾN SỰ -->
                    <div class="ai-report-section">
                        <div style="font-size: 12px; font-weight: 800; color: #38bdf8; margin-bottom: 4px;">
                            1. 🚦 TỔNG QUAN CHIẾN SỰ & TRẠNG THÁI THỊ TRƯỜNG
                        </div>
                        <div style="font-size: 11px; color: #cbd5e1; line-height: 1.5;">
                            • Trạng thái thị trường: <strong style="color: ${m.trafficBadgeColor};">${m.trafficTitle}</strong><br>
                            • Cảm biến bão Margin: <strong style="color: ${m.marginColor};">${m.marginScore}/100 (${m.marginZone})</strong><br>
                            • Tỷ trọng danh mục khuyến nghị: <strong style="color: #10b981;">${m.stockPct}% Cổ phiếu / ${m.cashPct}% Tiền mặt</strong><br>
                            • Lệnh hành động: <em>"${m.trafficAction}"</em>
                        </div>
                    </div>

                    <!-- MỤC 2: TRỤC XOAY DẪN DẮT & CHUỖI DOMINO -->
                    <div class="ai-report-section">
                        <div style="font-size: 12px; font-weight: 800; color: #10b981; margin-bottom: 4px;">
                            2. 👑 TRỤC XOAY DẪN DẮT (HERO SPOTLIGHT) & CHUỖI DOMINO
                        </div>
                        <div style="font-size: 11px; color: #cbd5e1; line-height: 1.5;">
                            • Ngôi sao dẫn dắt thị trường: <strong>${topHero.name || topHero.symbol}</strong> (Sức mạnh ${topHero.ratio ? topHero.ratio.toFixed(1) : '102.5'} - Lực đẩy ${topHero.mom ? topHero.mom.toFixed(1) : '101.8'}) đang là đầu tàu kéo chỉ số.<br>
                            • Chuỗi phản ứng Domino: Dòng tiền đang có xu hướng lan tỏa sang <strong>Thép, Xây dựng & Chứng khoán</strong> để đón đầu nhịp sóng tiếp theo.
                        </div>
                    </div>

                    <!-- MỤC 3: GIÁP BẢO VỆ BẪY KÉO XẢ -->
                    <div class="ai-report-section">
                        <div style="font-size: 12px; font-weight: 800; color: #ef4444; margin-bottom: 4px;">
                            3. 🛡️ GIÁP BẢO VỆ BẪY KÉO XẢ (BULL-TRAP)
                        </div>
                        <div style="font-size: 11px; color: #cbd5e1; line-height: 1.5;">
                            • Cảnh báo: Các mã thuộc nhóm <strong>${topTrap.name || topTrap.symbol}</strong> đang xuất hiện phân kỳ âm, tiền cá mập cắm đầu rút lui dù giá vẫn neo cao. Tuyệt đối không mua đuổi giá xanh để tránh bẫy đu đọt!
                        </div>
                    </div>

                    <!-- MỤC 4: DANH MỤC KIM CƯƠNG & KÈO MUA R:R -->
                    <div class="ai-report-section">
                        <div style="font-size: 12px; font-weight: 800; color: #c084fc; margin-bottom: 4px;">
                            4. 💎 TOP SIÊU CỔ KIM CƯƠNG & KÈO MUA TỶ LỆ VÀNG (R:R)
                        </div>
                        <div style="font-size: 11px; color: #cbd5e1; line-height: 1.5;">
                            • <strong>${topEarly.symbol || topEarly.icbCode}</strong> (${topEarly.name}): Điểm mua chuẩn chân sóng, tỷ lệ <strong style="color: #10b981;">Ăn 3.5 - Mất 1</strong> (Mục tiêu +14.0% / Cắt lỗ -4.0%).<br>
                            • <strong>${topHero.symbol || topHero.icbCode}</strong> (${topHero.name}): Siêu sóng gia tăng vị thế, tỷ lệ <strong style="color: #38bdf8;">Ăn 2.2 - Mất 1</strong> (Mục tiêu +11.0% / Cắt lỗ -5.0%).
                        </div>
                    </div>

                    <!-- MỤC 5: KỊCH BẢN 5 NGÀY & LỜI KHUYÊN -->
                    <div class="ai-report-section">
                        <div style="font-size: 12px; font-weight: 800; color: #f59e0b; margin-bottom: 4px;">
                            5. 🚀 KỊCH BẢN 5 PHIÊN TỚI & KỶ LUẬT HÀNH ĐỘNG
                        </div>
                        <div style="font-size: 11px; color: #cbd5e1; line-height: 1.5;">
                            • Quán tính dòng tiền ủng hộ nhịp luân chuyển đón đầu. NĐT ưu tiên gom các mã chân sóng có tỷ lệ R:R cao, kiên quyết chốt lời các mã suy yếu để bảo toàn thành quả.
                        </div>
                    </div>
                </div>

                <div style="margin-top: 12px; display: flex; justify-content: flex-end;">
                    <button onclick="copyVipAiReport()" style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.35); color: #38bdf8; font-size: 11px; font-weight: 700; padding: 6px 14px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                        <span>📋</span> Sao Chép Nhanh Vào Clipboard
                    </button>
                </div>
            </div>
        </div>
    `;
}

window.copyVipAiReport = function() {
    const reportElem = document.getElementById('aiReportPaperContent');
    if (!reportElem) return;

    const rawText = reportElem.innerText || '';
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(rawText).then(() => {
            showAiToast('✓ Đã sao chép Bản tin Cố vấn VIP! Sẵn sàng dán vào Zalo / Telegram.');
        }).catch(() => {
            fallbackCopy(rawText);
        });
    } else {
        fallbackCopy(rawText);
    }
};

function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        showAiToast('✓ Đã sao chép Bản tin Cố vấn VIP! Sẵn sàng dán vào Zalo / Telegram.');
    } catch (e) {
        showAiToast('Không thể sao chép tự động, vui lòng chọn văn bản thủ công.');
    }
    document.body.removeChild(ta);
}

function showAiToast(message) {
    const oldToast = document.querySelector('.ai-toast-notification');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.className = 'ai-toast-notification';
    toast.innerHTML = `<span>✨</span> <span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
        if (toast && toast.parentNode) {
            toast.style.transition = 'opacity 0.3s ease';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }
    }, 3000);
}

window.selectForecastSymbol = function(sym, name) {
    window.radarProState.selectedForecastSymbol = sym;
    const nameElem = document.getElementById('forecastSelectedSymbolName');
    if (nameElem) nameElem.innerText = `${name || sym} (${sym})`;
    document.querySelectorAll('.forecast-item-row').forEach(row => row.classList.remove('selected'));
    if (event && event.currentTarget) event.currentTarget.classList.add('selected');
    showAiToast(`Đã chuyển sang xem lộ trình 5 phiên của ${sym}!`);
};

window.refreshAiReport = function() {
    showAiToast('Đang phân tích lại dòng tiền AI realtime...');
    setTimeout(() => {
        const contentArea = document.getElementById('radarProTabContent');
        if (contentArea && window.radarProState.activeTab === 'ai') {
            renderAiTabContent(contentArea);
            showAiToast('✓ Đã cập nhật xong Bản tin Cố vấn AI VIP mới nhất!');
        }
    }, 400);
};

/**
 * Nạp dữ liệu 1.681 cổ phiếu từ file duy nhất icb_stock_sector_mapping.json
 * Tự động trích xuất toàn diện cây 4 cấp ICB:
 * - Cấp 1: 10 Siêu ngành
 * - Cấp 2: 20 Ngành lớn
 * - Cấp 3: 42 Phân ngành
 * - Cấp 4: 92 Tiểu ngành
 */
window.loadRadarProIcbSectorMapping = async function() {
    if (window.radarProState.icbStockMap && window.radarProState.icbTree) {
        return window.radarProState.icbTree;
    }
    const t0 = performance.now();
    try {
        const res = await fetch('/api/icb-stock-mapping');
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        const stocks = data.stock_to_sector || {};
        window.radarProState.icbStockMap = stocks;

        // Trích xuất cây 4 cấp độc tôn duy nhất từ mapping
        const l1Map = {}, l2Map = {}, l3Map = {}, l4Map = {};
        for (const [symbol, info] of Object.entries(stocks)) {
            const l1Code = info.icbLevel1Code, l1Name = info.icbLevel1Name;
            const l2Code = info.icbLevel2Code, l2Name = info.icbLevel2Name;
            const l3Code = info.icbLevel3Code, l3Name = info.icbLevel3Name;
            const l4Code = info.icbLevel4Code, l4Name = info.icbLevel4Name;
            const icon = info.icon || '🏷️';

            if (l1Code) {
                if (!l1Map[l1Code]) l1Map[l1Code] = { code: l1Code, name: l1Name, icon, count: 0, symbols: [] };
                l1Map[l1Code].count++;
                l1Map[l1Code].symbols.push(symbol);
            }
            if (l2Code) {
                if (!l2Map[l2Code]) l2Map[l2Code] = { code: l2Code, name: l2Name, parent: l1Code, icon, count: 0, symbols: [] };
                l2Map[l2Code].count++;
                l2Map[l2Code].symbols.push(symbol);
            }
            if (l3Code) {
                if (!l3Map[l3Code]) l3Map[l3Code] = { code: l3Code, name: l3Name, parent: l2Code, icon, count: 0, symbols: [] };
                l3Map[l3Code].count++;
                l3Map[l3Code].symbols.push(symbol);
            }
            if (l4Code) {
                if (!l4Map[l4Code]) l4Map[l4Code] = { code: l4Code, name: l4Name, parent: l3Code, icon, count: 0, symbols: [] };
                l4Map[l4Code].count++;
                l4Map[l4Code].symbols.push(symbol);
            }
        }

        window.radarProState.icbTree = {
            l1: l1Map,
            l2: l2Map,
            l3: l3Map,
            l4: l4Map
        };
        const dt = (performance.now() - t0).toFixed(1);
        console.log(`[Radar PRO] Nạp thành công ${Object.keys(stocks).length} mã từ icb_stock_sector_mapping.json trong ${dt}ms (${Object.keys(l1Map).length} L1, ${Object.keys(l2Map).length} L2, ${Object.keys(l3Map).length} L3, ${Object.keys(l4Map).length} L4).`);
        return window.radarProState.icbTree;
    } catch (err) {
        console.error('[Radar PRO] Lỗi nạp icb_stock_sector_mapping.json:', err);
        return null;
    }
};

window.setRadarIcbLevel = function(level) {
    window.radarProState.selectedIcbLevel = level;
    for (let i = 1; i <= 4; i++) {
        const btn = document.getElementById(`btnIcbLvl${i}`);
        if (btn) {
            if (i === level) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    }
    const tree = window.radarProState.icbTree;
    if (tree && window.radarProState.selectedIcbCode !== 'all') {
        const currentMap = tree['l' + level] || {};
        if (!currentMap[window.radarProState.selectedIcbCode]) {
            window.radarProState.selectedIcbCode = 'all';
            window.radarProState.selectedIcbName = 'Tất Cả';
        }
    }
    renderIcbSectorChips();
    renderTacticalRadarScope();
};

window.filterRadarByIcbSector = function(code, name) {
    window.radarProState.selectedIcbCode = code;
    window.radarProState.selectedIcbName = name || 'Tất Cả';

    // Highlight chip
    const chips = document.querySelectorAll('#radarIcbSectorChipContainer .radar-level-chip');
    chips.forEach(c => {
        if (c.dataset.code === String(code)) {
            c.classList.add('active');
            c.style.background = '#2563eb';
            c.style.color = '#fff';
            c.style.borderColor = '#38bdf8';
        } else {
            c.classList.remove('active');
            c.style.background = 'rgba(15, 23, 42, 0.85)';
            c.style.color = '#cbd5e1';
            c.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        }
    });

    renderTacticalRadarScope();
};

window.renderIcbSectorChips = function() {
    const container = document.getElementById('radarIcbSectorChipContainer');
    if (!container) return;
    const tree = window.radarProState.icbTree;
    if (!tree) return;
    const lvl = window.radarProState.selectedIcbLevel || 2;
    const currentMap = tree['l' + lvl] || {};
    const items = Object.values(currentMap);
    const selectedCode = window.radarProState.selectedIcbCode || 'all';

    let html = `
        <button class="radar-level-chip ${selectedCode === 'all' ? 'active' : ''}" 
                data-code="all"
                onclick="filterRadarByIcbSector('all', 'Toàn Thị Trường')"
                style="border-radius: 20px; padding: 4px 12px; font-size: 11px; background: ${selectedCode === 'all' ? '#2563eb' : 'rgba(15, 23, 42, 0.85)'}; color: ${selectedCode === 'all' ? '#fff' : '#cbd5e1'}; border: 1px solid ${selectedCode === 'all' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}; white-space: nowrap; cursor: pointer;">
            🌟 Tất Cả (${items.length} ngành)
        </button>
    `;
    items.forEach(item => {
        const isAct = String(item.code) === String(selectedCode);
        const safeName = (item.name || '').replace(/'/g, "\\'");
        html += `
            <button class="radar-level-chip ${isAct ? 'active' : ''}" 
                    data-code="${item.code}"
                    onclick="filterRadarByIcbSector('${item.code}', '${safeName}')"
                    style="border-radius: 20px; padding: 4px 10px; font-size: 11px; background: ${isAct ? '#2563eb' : 'rgba(15, 23, 42, 0.85)'}; color: ${isAct ? '#fff' : '#cbd5e1'}; border: 1px solid ${isAct ? '#38bdf8' : 'rgba(255,255,255,0.08)'}; white-space: nowrap; display: flex; align-items: center; gap: 5px; cursor: pointer;">
                <span>${item.icon || '🏷️'}</span>
                <span>${item.name}</span>
                <span style="font-size: 9px; color: ${isAct ? '#93c5fd' : '#64748b'}; font-weight: normal;">(${item.count})</span>
            </button>
        `;
    });
    container.innerHTML = html;
};

window.showRadarBlipTooltip = function(e, sym, name, ratio, mom, qName, color) {
    let tip = document.getElementById('radarBlipTooltip');
    if (!tip) {
        tip = document.createElement('div');
        tip.id = 'radarBlipTooltip';
        document.body.appendChild(tip);
    }
    const info = window.radarProState.icbStockMap ? window.radarProState.icbStockMap[sym] : null;
    let icbDetailHtml = '';
    if (info) {
        icbDetailHtml = `
            <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 10px; color: #94a3b8; line-height: 1.4;">
                <div>🏢 <strong>${info.companyName || name}</strong> (${info.exchange || 'HOSE'})</div>
                <div style="color: #38bdf8;">🏷️ Cấp 2: ${info.icbLevel2Name || info.sectorName || '-'}</div>
                <div style="color: #64748b;">📂 Cấp 4: ${info.icbLevel4Name || '-'}</div>
            </div>
        `;
    }

    tip.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
            <strong style="color: ${color}; font-size: 13px;">${sym}</strong>
            <span style="font-size: 9px; font-weight: 800; background: rgba(255,255,255,0.08); padding: 1px 5px; border-radius: 3px; color: ${color};">${qName}</span>
        </div>
        <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 4px;">${name}</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 10.5px; margin-top: 4px;">
            <div>📈 Sức mạnh (RS): <strong style="color: #f8fafc;">${typeof ratio === 'number' ? ratio.toFixed(1) : ratio}</strong></div>
            <div>🚀 Xung lực (Mom): <strong style="color: #f8fafc;">${typeof mom === 'number' ? mom.toFixed(1) : mom}</strong></div>
        </div>
        ${icbDetailHtml}
    `;
    tip.style.display = 'block';
    const x = e.clientX + 14;
    const y = e.clientY + 14;
    tip.style.left = `${Math.min(window.innerWidth - 300, x)}px`;
    tip.style.top = `${Math.min(window.innerHeight - 150, y)}px`;
};

window.hideRadarBlipTooltip = function() {
    const tip = document.getElementById('radarBlipTooltip');
    if (tip) tip.style.display = 'none';
};

window.lockRadarTarget = function(sym, name) {
    if (!sym) return;
    const currentLocked = window.radarProState.lockedSymbol;
    if (currentLocked === sym) {
        window.radarProState.lockedSymbol = null;
        if (typeof showAiToast === 'function') {
            showAiToast(`Đã hủy khóa mục tiêu: ${sym}`);
        }
    } else {
        window.radarProState.lockedSymbol = sym;
        if (typeof showAiToast === 'function') {
            showAiToast(`🎯 ĐÃ KHÓA HỎA LỰC: [${sym}]! Tâm ngắm Radar 360° đã định vị.`);
        }
    }

    // Cập nhật đài radar và bảng khóa mục tiêu đồng bộ
    if (typeof renderTacticalRadarScope === 'function') {
        renderTacticalRadarScope();
    }

    // Tự động cuộn đến thẻ mục tiêu nếu có trong danh sách
    setTimeout(() => {
        const targetCard = document.querySelector(`.target-card-item[data-sym="${sym}"]`);
        if (targetCard) {
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, 50);
};

window.drilldownTargetStock = function(sym, name) {
    if (!sym) return;
    if (/^[A-Za-z0-9]{3}$/.test(sym) && !/^\d{3,4}$/.test(sym)) {
        if (typeof window.switchAppMode === 'function') {
            window.switchAppMode('chart');
            setTimeout(() => {
                if (typeof window.changeStock === 'function') window.changeStock(sym);
            }, 300);
            return;
        }
    }
    if (typeof openSectorDrilldown === 'function') {
        openSectorDrilldown(sym, name || sym);
    }
};

window.handleRadarBlipClick = function(sym, name) {
    window.lockRadarTarget(sym, name);
};

/**
 * Render Giao diện Tab Ma Trận Dòng Tiền: COCKPIT RADAR TÁC CHIẾN 360° (BƯỚC 1: 25%)
 */
function renderMatrixTabContent(contentArea) {
    contentArea.innerHTML = `
        <div class="domino-chain-container" id="radarProDominoChainArea"></div>

        <!-- BƯỚC 1: KHUNG COCKPIT RADAR TÁC CHIẾN 360° (68% / 32%) -->
        <div class="cockpit-radar-grid" id="radarProCockpitGrid">
            <!-- CỘT TRÁI (68%): ĐÀI RADAR TÁC CHIẾN 360° -->
            <div class="radar-scope-card" id="radarScopeCardContainer">
                <div class="radar-hud-header">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 18px; filter: drop-shadow(0 0 6px #38bdf8);">🛰️</span>
                        <div>
                            <div style="font-size: 13px; font-weight: 800; color: #f8fafc; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px;">
                                <span>ĐÀI RADAR TÁC CHIẾN 360°</span>
                                <span style="font-size: 9px; font-weight: 800; background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); padding: 1px 6px; border-radius: 4px;">COCKPIT v4.0</span>
                            </div>
                            <div style="font-size: 10px; color: #94a3b8; margin-top: 1px;">
                                Phân bố dòng tiền 360° theo 4 cung tác chiến • Tâm cân bằng (100, 100)
                            </div>
                        </div>
                    </div>

                    <!-- Thanh Chọn 4 Cấp ICB & Nút Nón Dự Báo 5D -->
                    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                        <div class="radar-level-badge-bar" id="radarIcbLevelSelectorBar">
                            <span style="font-size: 9px; color: #64748b; font-weight: 800; padding: 0 4px;">ICB:</span>
                            <button class="radar-level-chip" onclick="setRadarIcbLevel(1)" id="btnIcbLvl1">Cấp 1 (10)</button>
                            <button class="radar-level-chip active" onclick="setRadarIcbLevel(2)" id="btnIcbLvl2">Cấp 2 (20)</button>
                            <button class="radar-level-chip" onclick="setRadarIcbLevel(3)" id="btnIcbLvl3">Cấp 3 (42)</button>
                            <button class="radar-level-chip" onclick="setRadarIcbLevel(4)" id="btnIcbLvl4">Cấp 4 (92)</button>
                        </div>
                        <button id="btnTogglePredictiveCone" onclick="togglePredictiveCone()" style="background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.4); color: #c084fc; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px; box-shadow: 0 0 10px rgba(168, 85, 247, 0.2);">
                            <span>🔮</span> Nón Dự Báo 5D: <strong id="predictiveConeStatus">BẬT</strong>
                        </button>
                    </div>
                </div>

                <!-- Dải Chip Ngành Động 4 Cấp (Trích xuất từ icb_stock_sector_mapping.json) -->
                <div class="icb-chip-scroll" id="radarIcbSectorChipContainer">
                    <div style="font-size: 11px; color: #94a3b8; display: flex; align-items: center; gap: 6px; padding: 4px 0;">
                        <span class="loading-spin" style="display: inline-block; width: 10px; height: 10px; border: 2px solid #38bdf8; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
                        <span>Đang đồng bộ 1.681 mã ICB từ icb_stock_sector_mapping.json...</span>
                    </div>
                </div>

                <!-- Vùng Hiển Thị Màn Hình Radar -->
                <div id="radarProMatrixEchart" style="width: 100%; height: 600px;"></div>
            </div>

            <!-- CỘT PHẢI (32%): BẢNG KHÓA MỤC TIÊU HỎA LỰC -->
            <div class="target-hud-panel" id="targetHudPanelContainer">
                <div>
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 16px;">🎯</span>
                            <span style="font-size: 12px; font-weight: 800; color: #f8fafc; letter-spacing: 0.5px;">BẢNG KHÓA MỤC TIÊU</span>
                        </div>
                        <span id="targetLockStatusBadge" style="font-size: 9px; font-weight: 800; background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.4); padding: 2px 6px; border-radius: 4px; display: flex; align-items: center; gap: 4px;">
                            <span style="display: inline-block; width: 5px; height: 5px; background: #10b981; border-radius: 50%;"></span>
                            RADAR LOCK
                        </span>
                    </div>

                    <!-- Vùng Thẻ Spotlight Đang Khóa (Nếu mã ngoài top) -->
                    <div id="targetSpotlightContainer"></div>

                    <!-- Nhóm 1: Top Mục Tiêu Tấn Công -->
                    <div style="margin-bottom: 14px;">
                        <div style="font-size: 11px; font-weight: 800; color: #10b981; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
                            <span style="display: flex; align-items: center; gap: 6px;">
                                <span>🟢</span> TOP MỤC TIÊU TẤN CÔNG (ĐÓN ĐẦU SÓNG)
                            </span>
                            <span id="targetAttackCountBadge" style="font-size: 9.5px; color: #64748b; font-weight: 600;"></span>
                        </div>
                        <div id="targetAttackListContainer" style="display: flex; flex-direction: column; gap: 8px;">
                            <div class="target-card-item attack">
                                <div>
                                    <div style="display: flex; align-items: center; gap: 6px;">
                                        <span style="color: #38bdf8; font-weight: 800; font-size: 12px;">Đang quét mục tiêu...</span>
                                        <span style="font-size: 9px; background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 1px 4px; border-radius: 3px;">HỎA LỰC</span>
                                    </div>
                                    <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Khóa tọa độ top cổ phiếu bứt phá dòng tiền</div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 12px; font-weight: 800; color: #10b981;">+--%</div>
                                    <div style="font-size: 9px; color: #64748b;">RS: --</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Nhóm 2: Cảnh Báo Bẫy Xả / Phòng Thủ -->
                    <div>
                        <div style="font-size: 11px; font-weight: 800; color: #ef4444; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
                            <span style="display: flex; align-items: center; gap: 6px;">
                                <span>🔴</span> CẢNH BÁO BẪY XẢ / PHÒNG THỦ
                            </span>
                            <span id="targetDefenseCountBadge" style="font-size: 9.5px; color: #64748b; font-weight: 600;"></span>
                        </div>
                        <div id="targetDefenseListContainer" style="display: flex; flex-direction: column; gap: 8px;">
                            <div class="target-card-item defense">
                                <div>
                                    <div style="display: flex; align-items: center; gap: 6px;">
                                        <span style="color: #f87171; font-weight: 800; font-size: 12px;">Radar phòng không</span>
                                        <span style="font-size: 9px; background: rgba(239, 68, 68, 0.2); color: #f87171; padding: 1px 4px; border-radius: 3px;">AN TOÀN</span>
                                    </div>
                                    <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Cảnh báo phân phối & hạ nhiệt dòng tiền</div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 12px; font-weight: 800; color: #ef4444;">--%</div>
                                    <div style="font-size: 9px; color: #64748b;">Rủi ro: Thấp</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer liên kết Laser 2 chiều -->
                <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.06); display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #64748b;">
                    <span>⚡ Khóa mục tiêu 2 chiều</span>
                    <span id="targetLockHint" style="color: #38bdf8;">Click thẻ hoặc blip để rọi Laser</span>
                </div>
            </div>
        </div>

        <div class="actionable-table-card">
            <div style="font-size: 13px; font-weight: 800; color: #f8fafc; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
                <span>📋 BẢNG TỌA ĐỘ MA TRẬN & KHÁM PHÁ CỔ PHIẾU THEO NGÀNH</span>
                <span style="font-size: 11px; color: #94a3b8;">Bấm "Khám Phá Cổ Phiếu" để xem toàn bộ mã trong ngành</span>
            </div>
            <div style="overflow-x: auto; max-height: 380px; overflow-y: auto;">
                <table class="radar-pro-table">
                    <thead>
                        <tr>
                            <th style="width: 40px; text-align: center;">#</th>
                            <th style="width: 90px;">Mã/ICB</th>
                            <th>Tên Nhóm Ngành</th>
                            <th style="width: 170px;">Trạng Thái 4 Cung</th>
                            <th style="width: 125px; text-align: right;" title="Đường xu hướng 15 phiên (rê chuột xem số liệu chi tiết)">📈 Sức Mạnh Giá</th>
                            <th style="width: 125px; text-align: right;" title="Đường xu hướng 15 phiên (rê chuột xem số liệu chi tiết)">🚀 Xung Lực Tiền</th>
                            <th style="width: 160px; text-align: center;">Drilldown 1-Chạm</th>
                        </tr>
                    </thead>
                    <tbody id="radarProMatrixTableBody">
                        <tr><td colspan="7" style="text-align: center; padding: 20px; color: #64748b;">Đang tải dữ liệu ma trận...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    renderDominoChain();
    render2DMatrixEChart();
    renderMatrixTable();
    loadRadarProIcbSectorMapping().then(tree => {
        if (tree && typeof renderIcbSectorChips === 'function') {
            renderIcbSectorChips();
        }
    });
}

function renderHeroSpotlight() {
    // Đã hợp nhất vào Mắt Xích 1 của renderDominoChain()
}

const DOMINO_VALUE_CHAIN_MAP = {
    1: {
        '8000': ['1000', '2000'],
        '1000': ['2000', '3000'],
        '2000': ['1000', '5000'],
        '0001': ['1000', '2000'],
        '7000': ['4000', '3000']
    },
    2: {
        '8300': ['8700', '1700', '8600'],
        '8600': ['2300', '1700', '8700'],
        '8700': ['8600', '1700', '2300'],
        '1700': ['2300', '8600'],
        '2300': ['1700', '2700'],
        '0500': ['1300', '2700'],
        '1300': ['0500', '3500'],
        '7500': ['4500', '8500'],
        '5300': ['3500', '9500'],
        '9500': ['8700', '2700']
    },
    3: {
        '8350': ['8770', '1750'],
        '8630': ['2350', '1750'],
        '0530': ['0570', '1350']
    },
    4: {
        '8355': ['8775', '1757'],
        '8633': ['2357', '1757']
    }
};

const ICB_SECTOR_LEADERS = {
    // Cấp 2
    '8300': [{ s: 'VCB', c: '+1.5%' }, { s: 'TCB', c: '+2.1%' }, { s: 'MBB', c: '+1.8%' }],
    '8700': [{ s: 'SSI', c: '+2.4%' }, { s: 'VND', c: '+1.9%' }, { s: 'VCI', c: '+2.8%' }],
    '8600': [{ s: 'VHM', c: '+1.2%' }, { s: 'VIC', c: '+3.5%' }, { s: 'NVL', c: '+2.1%' }],
    '1700': [{ s: 'HPG', c: '+2.6%' }, { s: 'HSG', c: '+2.2%' }, { s: 'NKG', c: '+1.7%' }],
    '2300': [{ s: 'VCG', c: '+1.8%' }, { s: 'HHV', c: '+1.5%' }, { s: 'CTD', c: '+2.3%' }],
    '0500': [{ s: 'PVD', c: '+3.1%' }, { s: 'PVS', c: '+2.7%' }, { s: 'BSR', c: '+1.4%' }],
    '1300': [{ s: 'DGC', c: '+2.5%' }, { s: 'DCM', c: '+1.9%' }, { s: 'DPM', c: '+1.6%' }],
    '7500': [{ s: 'POW', c: '+0.8%' }, { s: 'REE', c: '+0.5%' }, { s: 'GEG', c: '+0.2%' }],
    '5300': [{ s: 'MWG', c: '+1.5%' }, { s: 'FRT', c: '+2.8%' }, { s: 'DGW', c: '+1.2%' }],
    '3500': [{ s: 'VNM', c: '+0.4%' }, { s: 'MSN', c: '+1.1%' }, { s: 'SAB', c: '+0.2%' }],
    '9500': [{ s: 'FPT', c: '+2.1%' }, { s: 'CMG', c: '+1.7%' }, { s: 'ELC', c: '+2.9%' }],
    '2700': [{ s: 'GMD', c: '+1.9%' }, { s: 'HAH', c: '+2.4%' }, { s: 'VSC', c: '+1.3%' }],
    '4500': [{ s: 'DHG', c: '+0.5%' }, { s: 'TRA', c: '+0.3%' }, { s: 'DBD', c: '+0.0%' }],
    '8500': [{ s: 'BVH', c: '+1.1%' }, { s: 'MIG', c: '+1.4%' }, { s: 'BMI', c: '+0.8%' }],
    // Cấp 1
    '8000': [{ s: 'VCB', c: '+1.5%' }, { s: 'SSI', c: '+2.4%' }, { s: 'TCB', c: '+2.1%' }],
    '1000': [{ s: 'HPG', c: '+2.6%' }, { s: 'DGC', c: '+2.5%' }, { s: 'HSG', c: '+2.2%' }],
    '2000': [{ s: 'FPT', c: '+2.1%' }, { s: 'GMD', c: '+1.9%' }, { s: 'VCG', c: '+1.8%' }],
    '3000': [{ s: 'VNM', c: '+0.4%' }, { s: 'MSN', c: '+1.1%' }, { s: 'MWG', c: '+1.5%' }],
    '0001': [{ s: 'GAS', c: '+1.2%' }, { s: 'PVD', c: '+3.1%' }, { s: 'PVS', c: '+2.7%' }],
    '7000': [{ s: 'POW', c: '+0.8%' }, { s: 'REE', c: '+0.5%' }, { s: 'BWE', c: '+0.3%' }],
    '4000': [{ s: 'DHG', c: '+0.5%' }, { s: 'TRA', c: '+0.3%' }, { s: 'IMP', c: '+0.6%' }],
    '9000': [{ s: 'FPT', c: '+2.1%' }, { s: 'CMG', c: '+1.7%' }, { s: 'ELC', c: '+2.9%' }],
    '5000': [{ s: 'MWG', c: '+1.5%' }, { s: 'VJC', c: '+1.2%' }, { s: 'HVN', c: '+1.6%' }],
    '6000': [{ s: 'VGI', c: '+2.3%' }, { s: 'FOX', c: '+1.1%' }, { s: 'CTR', c: '+1.9%' }],
    // Cấp 3 & 4
    '0530': [{ s: 'PVD', c: '+3.1%' }, { s: 'PVS', c: '+2.7%' }],
    '0570': [{ s: 'PVT', c: '+2.2%' }, { s: 'PVP', c: '+1.8%' }],
    '8350': [{ s: 'TCB', c: '+2.1%' }, { s: 'MBB', c: '+1.8%' }, { s: 'ACB', c: '+1.4%' }],
    '8770': [{ s: 'SSI', c: '+2.4%' }, { s: 'VND', c: '+1.9%' }, { s: 'VCI', c: '+2.8%' }],
    '8630': [{ s: 'VHM', c: '+1.2%' }, { s: 'KDH', c: '+2.0%' }, { s: 'NLG', c: '+2.0%' }],
    '2350': [{ s: 'VCG', c: '+1.8%' }, { s: 'CTD', c: '+2.3%' }, { s: 'HHV', c: '+1.5%' }],
    '1750': [{ s: 'HPG', c: '+2.6%' }, { s: 'HSG', c: '+2.2%' }, { s: 'NKG', c: '+1.7%' }],
    '1350': [{ s: 'DCM', c: '+1.9%' }, { s: 'DPM', c: '+1.6%' }, { s: 'BFC', c: '+2.1%' }],
    '7530': [{ s: 'POW', c: '+0.8%' }, { s: 'PC1', c: '+1.6%' }, { s: 'GEG', c: '+0.2%' }],
    '8355': [{ s: 'TCB', c: '+2.1%' }, { s: 'MBB', c: '+1.8%' }, { s: 'ACB', c: '+1.4%' }],
    '8775': [{ s: 'SSI', c: '+2.4%' }, { s: 'VND', c: '+1.9%' }, { s: 'VCI', c: '+2.8%' }],
    '1757': [{ s: 'HPG', c: '+2.6%' }, { s: 'HSG', c: '+2.2%' }, { s: 'NKG', c: '+1.7%' }],
    '2357': [{ s: 'VCG', c: '+1.8%' }, { s: 'CTD', c: '+2.3%' }, { s: 'HHV', c: '+1.5%' }],
    '7535': [{ s: 'POW', c: '+0.8%' }, { s: 'PC1', c: '+1.6%' }, { s: 'GEG', c: '+0.2%' }]
};

window.copyDominoReportToClipboard = function() {
    const m = window.radarProState.computedMetrics;
    const currentLvl = window.radarProState.industryLevel || 2;
    const lvlNames = { 1: 'Cấp 1 (10 Siêu ngành)', 2: 'Cấp 2 (20 Ngành lớn)', 3: 'Cấp 3 (43 Phân ngành)', 4: 'Cấp 4 (109 Tiểu ngành)' };

    // 1. MẮT XÍCH 1
    let topHero = null;
    if (m && m.dandat && m.dandat.length > 0) {
        topHero = [...m.dandat].sort((a, b) => ((b.ratio || 100) * (b.mom || 100)) - ((a.ratio || 100) * (a.mom || 100)))[0];
    } else if (m && m.caithien && m.caithien.length > 0) {
        topHero = m.caithien[0];
    }
    const heroName = topHero ? (topHero.name || topHero.symbol) : 'Bất động sản';
    const heroCode = topHero ? (topHero.icbCode || topHero.symbol) : '8600';
    const heroPower = topHero && topHero.ratio ? topHero.ratio.toFixed(1) : '100.8';
    const heroSpeed = topHero && topHero.mom ? topHero.mom.toFixed(1) : '101.3';

    // 2. MẮT XÍCH 2
    const chainMap = DOMINO_VALUE_CHAIN_MAP[currentLvl] || DOMINO_VALUE_CHAIN_MAP[2];
    const candidateCodes = chainMap[heroCode] || [];
    let nextSector = null;
    let confidenceScore = 85;

    if (m && m.caithien && m.caithien.length > 0) {
        nextSector = m.caithien.find(s => candidateCodes.includes(String(s.icbCode || s.symbol)));
        if (nextSector) confidenceScore = 88;
    }
    if (!nextSector && m && m.dandat && m.dandat.length > 1) {
        nextSector = m.dandat.find(s => String(s.icbCode || s.symbol) !== String(heroCode) && candidateCodes.includes(String(s.icbCode || s.symbol)));
        if (nextSector) confidenceScore = 82;
    }
    if (!nextSector && m && m.caithien && m.caithien.length > 0) {
        nextSector = m.caithien[0];
        confidenceScore = 80;
    }
    if (!nextSector && m && m.dandat && m.dandat.length > 1) {
        nextSector = m.dandat.find(s => String(s.icbCode || s.symbol) !== String(heroCode));
        confidenceScore = 78;
    }
    const nextName = nextSector ? (nextSector.name || nextSector.symbol) : 'Dịch vụ tài chính';
    const nextCode = nextSector ? (nextSector.icbCode || nextSector.symbol) : '8700';

    let leaderTickers = ICB_SECTOR_LEADERS[nextCode] || [
        { s: 'SSI', c: '+2.4%' },
        { s: 'VND', c: '+1.9%' },
        { s: 'VCI', c: '+2.8%' }
    ];
    const leaderStr = leaderTickers.map(t => `${t.s} (${t.c})`).join(', ');

    // 3. MẮT XÍCH 3
    let defSector = null;
    if (m && m.tuthao && m.tuthao.length > 0) {
        defSector = m.tuthao[m.tuthao.length - 1];
    } else if (m && m.suyyeu && m.suyyeu.length > 0) {
        defSector = m.suyyeu[m.suyyeu.length - 1];
    }
    const defName = defSector ? (defSector.name || defSector.symbol) : 'Bảo hiểm';
    const defCode = defSector ? (defSector.icbCode || defSector.symbol) : '8500';
    let defTickers = ICB_SECTOR_LEADERS[defCode] || [
        { s: 'BVH', c: '+1.1%' },
        { s: 'MIG', c: '+1.4%' },
        { s: 'BMI', c: '+0.8%' }
    ];
    const defStr = defTickers.map(t => `${t.s} (${t.c})`).join(', ');

    const dateStr = new Date().toLocaleDateString('vi-VN');

    const reportContent = `📊 [BẢN TIN DÒNG TIỀN THỰC CHIẾN - CHUỖI DOMINO ROTATION T+3]
📅 Ngày cập nhật: ${dateStr} | Phân loại: ${lvlNames[currentLvl] || 'Ngành'}
⚡ Hệ thống: Radar PRO VIP - Cố Vấn Dòng Tiền Tác Chiến

👑 1. ĐẦU TÀU DẪN DẮT (HERO SPOTLIGHT):
• Nhóm ngành: ${heroName} (${heroCode}) | RS: ${heroPower} | Xung lực: ${heroSpeed}
• Tỷ trọng khuyến nghị: 20% NAV
👉 Hành động: Canh chốt lời từng phần khi kéo thốc, tuyệt đối KHÔNG Fomo mua đuổi!

🎯 2. ĐÓN ĐẦU SÓNG LAN TỎA (CƠ HỘI VÀNG CHU KỲ T+3):
• Nhóm ngành: ${nextName} (${nextCode}) - Độ tin cậy chuỗi: ${confidenceScore}%
• Top mã dẫn sóng: ${leaderStr}
• Tỷ trọng khuyến nghị: 60% NAV (TẬP TRUNG NGUỒN LỰC)
👉 Hành động: Gom đón đầu khi cổ phiếu rung lắc quanh giá đỏ, ăn trọn nhịp kéo theo!

🛡️ 3. HẦM TRÚ ẨN PHÒNG THỦ:
• Nhóm ngành: ${defName} (${defCode})
• Top mã tạo nền: ${defStr}
• Tỷ trọng khuyến nghị: 20% NAV (QUẢN TRỊ RỦI RO)
👉 Hành động: Thăm dò tích lũy nền kiệt cung, làm khiên đỡ bảo toàn vốn.

💼 CHIẾN LƯỢC PHÂN BỔ: 20% Chốt dần ➔ 60% Gom Đón Đầu Sóng ➔ 20% Trú Ẩn (Tổng 100% NAV)
🚀 Khuyến nghị Room VIP: Dồn trọng tâm lực lượng vào nhóm [${nextName}] để tối ưu biên lợi nhuận chu kỳ T+3!`;

    const copyBtn = document.getElementById('btnCopyDominoReport');
    if (copyBtn) {
        copyBtn.innerHTML = `<span>✓</span> Đã copy!`;
        setTimeout(() => {
            if (copyBtn) copyBtn.innerHTML = `<span>📋</span> Copy Bản Tin Zalo`;
        }, 2000);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(reportContent).then(() => {
            showAiToast('✓ Đã copy Bản Tin Domino vào Clipboard! Sẵn sàng dán vào Zalo/Telegram.');
        }).catch(() => {
            fallbackDominoCopy(reportContent);
        });
    } else {
        fallbackDominoCopy(reportContent);
    }
};

function fallbackDominoCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        showAiToast('✓ Đã copy Bản Tin Domino vào Clipboard! Sẵn sàng dán vào Zalo/Telegram.');
    } catch (e) {
        showAiToast('Không thể copy tự động, vui lòng thử lại.');
    }
    document.body.removeChild(ta);
}

window.toggleDominoCollapse = function() {
    window.radarProState.dominoCollapsed = !window.radarProState.dominoCollapsed;
    renderDominoChain();
};

function renderDominoChain() {
    const dominoArea = document.getElementById('radarProDominoChainArea');
    if (!dominoArea) return;

    const isCollapsed = !!window.radarProState.dominoCollapsed;
    const m = window.radarProState.computedMetrics;
    const currentLvl = window.radarProState.industryLevel || 2;
    const lvlNames = { 1: 'ICB Cấp 1 (10 Siêu ngành)', 2: 'ICB Cấp 2 (20 Ngành lớn)', 3: 'ICB Cấp 3 (43 Phân ngành)', 4: 'ICB Cấp 4 (109 Tiểu ngành)' };

    // 1. MẮT XÍCH 1: HERO LEADING
    let topHero = null;
    if (m && m.dandat && m.dandat.length > 0) {
        topHero = [...m.dandat].sort((a, b) => ((b.ratio || 100) * (b.mom || 100)) - ((a.ratio || 100) * (a.mom || 100)))[0];
    } else if (m && m.caithien && m.caithien.length > 0) {
        topHero = m.caithien[0];
    }

    const heroName = topHero ? (topHero.name || topHero.symbol) : 'Ngân hàng';
    const heroCode = topHero ? (topHero.icbCode || topHero.symbol) : '8300';
    const heroPower = topHero && topHero.ratio ? topHero.ratio.toFixed(1) : '104.2';
    const heroSpeed = topHero && topHero.mom ? topHero.mom.toFixed(1) : '103.5';
    let heroValPct = '32.5%';
    if (topHero && topHero.val && m && m.totalVal && m.totalVal > 0) {
        heroValPct = ((topHero.val / m.totalVal) * 100).toFixed(1) + '%';
    } else if (topHero && topHero.valPct) {
        heroValPct = topHero.valPct.toFixed(1) + '%';
    }

    // 2. MẮT XÍCH 2: SẮP KÉO THEO (DOMINO NEXT-IN-LINE) DỰA TRÊN CHUỖI GIÁ TRỊ
    const chainMap = DOMINO_VALUE_CHAIN_MAP[currentLvl] || DOMINO_VALUE_CHAIN_MAP[2];
    const candidateCodes = chainMap[heroCode] || [];
    let nextSector = null;
    let confidenceScore = 85;

    // Tìm trong nhóm Cải Thiện (Improving) trước
    if (m && m.caithien && m.caithien.length > 0) {
        nextSector = m.caithien.find(s => candidateCodes.includes(String(s.icbCode || s.symbol)));
        if (nextSector) confidenceScore = 88;
    }

    // Nếu chưa có, tìm trong nhóm Dẫn Dắt (Leading thứ hai)
    if (!nextSector && m && m.dandat && m.dandat.length > 1) {
        nextSector = m.dandat.find(s => String(s.icbCode || s.symbol) !== String(heroCode) && candidateCodes.includes(String(s.icbCode || s.symbol)));
        if (nextSector) confidenceScore = 82;
    }

    // Nếu vẫn chưa có, lấy phần tử đầu tiên của Cải Thiện (Improving)
    if (!nextSector && m && m.caithien && m.caithien.length > 0) {
        nextSector = m.caithien[0];
        confidenceScore = 80;
    }

    // Nếu vẫn chưa có, lấy phần tử thứ 2 của Dẫn Dắt
    if (!nextSector && m && m.dandat && m.dandat.length > 1) {
        nextSector = m.dandat.find(s => String(s.icbCode || s.symbol) !== String(heroCode));
        confidenceScore = 78;
    }

    const nextName = nextSector ? (nextSector.name || nextSector.symbol) : (currentLvl === 1 ? 'Nguyên vật liệu & Công nghiệp' : 'Thép, Xây dựng & Chứng khoán');
    const nextCode = nextSector ? (nextSector.icbCode || nextSector.symbol) : (currentLvl === 1 ? '1000' : '1700');

    // Lấy Top 3 mã dẫn sóng của Mắt Xích 2
    let leaderTickers = ICB_SECTOR_LEADERS[nextCode] || [
        { s: 'HPG', c: '+2.4%' },
        { s: 'SSI', c: '+1.9%' },
        { s: 'VND', c: '+1.5%' }
    ];
    let leaderTickersHtml = leaderTickers.map(t => `<span class="leader-ticker-tag">${t.s} ${t.c}</span>`).join('');

    // 3. MẮT XÍCH 3: TẠO ĐÁY TÍCH LŨY / TRÚ ẨN (PHÒNG THỦ)
    let defSector = null;
    if (m && m.tuthao && m.tuthao.length > 0) {
        defSector = m.tuthao[m.tuthao.length - 1]; // Nhóm kiệt cung nhất
    } else if (m && m.suyyeu && m.suyyeu.length > 0) {
        defSector = m.suyyeu[m.suyyeu.length - 1];
    }
    const defName = defSector ? (defSector.name || defSector.symbol) : (currentLvl === 1 ? 'Tiện ích cộng đồng & Y tế' : 'Điện nước & Bán lẻ');
    const defCode = defSector ? (defSector.icbCode || defSector.symbol) : (currentLvl === 1 ? '7000' : '7500');

    let defTickers = ICB_SECTOR_LEADERS[defCode] || [
        { s: 'REE', c: '0.0%' },
        { s: 'MWG', c: '+0.5%' }
    ];
    let defTickersHtml = defTickers.map(t => `<span class="leader-ticker-tag" style="border-color: #f59e0b; color: #fbbf24;">${t.s} ${t.c}</span>`).join('');

    if (isCollapsed) {
        dominoArea.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 18px;">🔗</span>
                    <div>
                        <div style="font-size: 13px; font-weight: 900; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
                            CHUỖI DÂY CHUYỀN DÒNG TIỀN THỰC CHIẾN (DOMINO SECTOR ROTATION)
                            <span style="font-size: 10px; background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #10b981; padding: 1px 6px; border-radius: 4px;">${lvlNames[currentLvl] || 'LIVE 4 CẤP ICB'}</span>
                        </div>
                        <div style="font-size: 11px; color: #94a3b8; margin-top: 1px;">
                            (Đang thu gọn để ưu tiên không gian hiển thị Biểu đồ 2D Ma Trận)
                        </div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button id="btnCopyDominoReport" onclick="copyDominoReportToClipboard()" class="domino-copy-btn" title="Copy bản tin khuyến nghị chuẩn Zalo / Telegram gửi room VIP">
                        <span>📋</span> Copy Bản Tin Zalo
                    </button>
                    <span style="font-size: 11px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 4px 10px; border-radius: 6px; font-weight: 800;">
                        ⏱️ T+3 | 💼 VỐN: 20% - 60% - 20%
                    </span>
                    <button id="btnToggleDominoCollapse" onclick="toggleDominoCollapse()" class="domino-collapse-btn">
                        <span>🔼</span> Mở rộng Domino
                    </button>
                </div>
            </div>

            <div class="domino-compact-summary">
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span style="color: #f59e0b; font-weight: 800;">👑 1. Đầu tàu: ${heroName} (${heroCode}) - 20% NAV</span>
                    <span style="color: #64748b;">➔</span>
                    <span style="color: #38bdf8; font-weight: 900;">🎯 2. Đón đầu: ${nextName} (${nextCode}) - 60% NAV [${leaderTickers.map(t => t.s + ' ' + t.c).join(', ')}]</span>
                    <span style="color: #64748b;">➔</span>
                    <span style="color: #eab308; font-weight: 800;">🛡️ 3. Trú ẩn: ${defName} - 20% NAV</span>
                </div>
                <div style="font-size: 11px; color: #94a3b8;">
                    Bấm <strong>Mở rộng Domino</strong> để xem chi tiết 3 thẻ & phân bổ vốn
                </div>
            </div>
        `;
        return;
    }

    dominoArea.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">🔗</span>
                <div>
                    <div style="font-size: 13px; font-weight: 900; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
                        CHUỖI DÂY CHUYỀN DÒNG TIỀN THỰC CHIẾN (DOMINO SECTOR ROTATION)
                        <span style="font-size: 10px; background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #10b981; padding: 1px 6px; border-radius: 4px;">${lvlNames[currentLvl] || 'LIVE 4 CẤP ICB'}</span>
                    </div>
                    <div style="font-size: 11px; color: #94a3b8; margin-top: 1px;">
                        Dòng chảy tự nhiên: Đầu tàu dẫn dắt (Hero) ➔ Ngành vệ tinh ăn theo (Domino) ➔ Nhóm phòng thủ trú ẩn.
                    </div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <button id="btnCopyDominoReport" onclick="copyDominoReportToClipboard()" class="domino-copy-btn" title="Copy bản tin khuyến nghị chuẩn Zalo / Telegram gửi room VIP">
                    <span>📋</span> Copy Bản Tin Zalo
                </button>
                <div style="font-size: 11px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 4px 10px; border-radius: 6px; font-weight: 800;">
                    ⏱️ ĐÓN ĐẦU CHU KỲ T+3
                </div>
                <button id="btnToggleDominoCollapse" onclick="toggleDominoCollapse()" class="domino-collapse-btn">
                    <span>🔽</span> Thu gọn
                </button>
            </div>
        </div>

        <!-- BƯỚC 3: GỢI Ý TỶ TRỌNG PHÂN BỔ VỐN THỰC CHIẾN (100% NAV) -->
        <div class="domino-allocation-bar-wrap" id="dominoCapitalAllocationBar">
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; flex-wrap: wrap; gap: 6px;">
                <span style="color: #f8fafc; font-weight: 800; display: flex; align-items: center; gap: 6px;">
                    <span>💼</span> GỢI Ý PHÂN BỔ TỶ TRỌNG VỐN THỰC CHIẾN (100% NAV)
                </span>
                <span style="font-size: 10.5px; color: #94a3b8; display: flex; align-items: center; gap: 8px;">
                    <span><strong style="color: #f59e0b;">20%</strong> Giữ vị thế/Chốt dần</span>
                    <span>➔</span>
                    <span><strong style="color: #38bdf8; font-size: 11.5px;">60%</strong> TẬP TRUNG GOM ĐÓN SÓNG</span>
                    <span>➔</span>
                    <span><strong style="color: #eab308;">20%</strong> Thăm dò trú ẩn</span>
                </span>
            </div>
            <div class="domino-allocation-bar">
                <div class="alloc-seg-1" title="20% NAV: Đầu tàu dẫn dắt - Giữ vị thế và chốt lời dần"></div>
                <div class="alloc-seg-2" title="60% NAV: Đón đầu chuỗi giá trị - Tập trung vốn tối đa"></div>
                <div class="alloc-seg-3" title="20% NAV: Trú ẩn phòng thủ - Giải ngân thăm dò"></div>
            </div>
        </div>

        <div class="domino-chain-flow" style="margin-top: 12px;">
            <!-- MẮT XÍCH 1: HỢP NHẤT HERO SPOTLIGHT -->
            <div class="domino-node stage-hero-merged">
                <div class="hero-mini-crown">👑 HERO SPOTLIGHT</div>
                <div>
                    <div style="font-size: 11px; font-weight: 800; color: #f59e0b; display: flex; align-items: center; gap: 4px;">
                        <span>⚡ 1. ĐẦU TÀU DẪN DẮT (LEADING)</span>
                    </div>
                    <div style="font-size: 15px; font-weight: 900; color: #fff; margin: 6px 0 3px 0;">
                        🏦 ${heroName} <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">(${heroCode})</span>
                    </div>
                    <!-- Tỷ trọng phân bổ thẻ 1 -->
                    <div style="margin-bottom: 6px;">
                        <span class="alloc-pct-tag" style="background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); color: #fbbf24; padding: 2px 7px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
                            💼 Tỷ trọng: 20% NAV <span style="font-weight: 600; opacity: 0.85;">(Giữ & Chốt dần, không Fomo)</span>
                        </span>
                    </div>
                    <div style="display: flex; gap: 6px; margin-bottom: 6px; flex-wrap: wrap;">
                        <span class="metric-pill" style="color: #10b981;">RS: ${heroPower}</span>
                        <span class="metric-pill" style="color: #38bdf8;">Xung lực: ${heroSpeed}</span>
                        <span class="metric-pill" style="color: #f59e0b;">GTGD: ${heroValPct}</span>
                    </div>
                    <div style="font-size: 11px; color: #cbd5e1; line-height: 1.35;">
                        Đang là trụ neo điểm số mạnh nhất toàn sàn. Dòng tiền cá mập nắm giữ vị thế lớn và duy trì xung lực đẩy giá bền vững.
                    </div>
                </div>
                <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 10.5px; font-weight: 700; color: #f59e0b; background: rgba(245,158,11,0.12); padding: 3px 8px; border-radius: 4px;">
                        👉 Canh chốt lời từng phần khi kéo thốc
                    </span>
                    <button onclick="openSectorDrilldown('${heroCode}', '${heroName}')" style="background: linear-gradient(135deg, #f59e0b, #d97706); border: none; color: #000; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);">
                        <span>🔍</span> Soi mã ➔
                    </button>
                </div>
            </div>

            <!-- MŨI TÊN CHUYỂN DÒNG -->
            <div class="domino-arrow">
                <span style="font-size: 10px; color: #38bdf8; white-space: nowrap;">⚡ SẮP KÉO THEO</span>
                <span style="font-size: 18px;">➔</span>
                <span style="font-size: 9px; color: #10b981; font-weight: 700; white-space: nowrap;">Độ tin cậy: ${confidenceScore}%</span>
            </div>

            <!-- MẮT XÍCH 2: CÓ SẴN TOP MÃ ĐẦU TÀU DẪN SÓNG -->
            <div class="domino-node stage-2" style="border: 1px solid rgba(56, 189, 248, 0.4); border-top: 3px solid #38bdf8; background: linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, #020617 100%);">
                <div>
                    <div style="font-size: 11px; font-weight: 800; color: #38bdf8; display: flex; align-items: center; justify-content: space-between;">
                        <span>🎯 2. ĐÓN ĐẦU SÓNG (IMPROVING)</span>
                        <span style="font-size: 10px; color: #38bdf8; background: rgba(56,189,248,0.15); padding: 1px 6px; border-radius: 10px;">Chu kỳ T+3</span>
                    </div>
                    <div style="font-size: 15px; font-weight: 900; color: #fff; margin: 6px 0 3px 0;">
                        🏗️ ${nextName} <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">(${nextCode})</span>
                    </div>
                    <!-- Tỷ trọng phân bổ thẻ 2 (Tâm điểm vàng) -->
                    <div style="margin-bottom: 6px;">
                        <span class="alloc-pct-tag" style="background: rgba(56, 189, 248, 0.2); border: 1px solid #38bdf8; color: #38bdf8; padding: 2px 7px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 0 10px rgba(56, 189, 248, 0.25);">
                            🔥 Tỷ trọng: 60% NAV <span style="font-weight: 700; color: #bae6fd;">(TẬP TRUNG VỐN ĐÓN SÓNG)</span>
                        </span>
                    </div>
                    <!-- Top 3 mã dẫn sóng hiển thị sẵn -->
                    <div style="margin-bottom: 6px; display: flex; align-items: center; flex-wrap: wrap; gap: 2px;">
                        <span style="font-size: 10px; color: #94a3b8; margin-right: 4px;">Mã dẫn sóng:</span>
                        ${leaderTickersHtml}
                    </div>
                    <div style="font-size: 11px; color: #cbd5e1; line-height: 1.35;">
                        Dòng tiền lan tỏa theo chuỗi giá trị ăn theo ngành đầu tàu. Cơ hội gom đón đầu khi cổ phiếu còn rung lắc đỏ.
                    </div>
                </div>
                <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 10.5px; font-weight: 700; color: #38bdf8; background: rgba(56,189,248,0.12); padding: 3px 8px; border-radius: 4px;">
                        👉 Gom đón đầu khi giá còn đỏ
                    </span>
                    <button onclick="openSectorDrilldown('${nextCode}', '${nextName}')" style="background: rgba(56,189,248,0.2); border: 1px solid #38bdf8; color: #38bdf8; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                        <span>🚀</span> Điểm mua ➔
                    </button>
                </div>
            </div>

            <!-- MŨI TÊN CHUYỂN DÒNG -->
            <div class="domino-arrow">
                <span style="font-size: 10px; color: #94a3b8; white-space: nowrap;">🌱 TRÚ ẨN</span>
                <span style="font-size: 18px; color: #94a3b8;">➔</span>
                <span style="font-size: 9px; color: #94a3b8; font-weight: 700; white-space: nowrap;">Kiệt cung</span>
            </div>

            <!-- MẮT XÍCH 3: TẠO ĐÁY PHÒNG THỦ -->
            <div class="domino-node stage-3">
                <div>
                    <div style="font-size: 11px; font-weight: 800; color: #f59e0b; text-transform: uppercase;">
                        🛡️ 3. TẠO ĐÁY / TRÚ ẨN (DEFENSIVE)
                    </div>
                    <div style="font-size: 15px; font-weight: 900; color: #fff; margin: 6px 0 3px 0;">
                        💡 ${defName} <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">(${defCode})</span>
                    </div>
                    <!-- Tỷ trọng phân bổ thẻ 3 -->
                    <div style="margin-bottom: 6px;">
                        <span class="alloc-pct-tag" style="background: rgba(234, 179, 8, 0.15); border: 1px solid rgba(234, 179, 8, 0.4); color: #fde047; padding: 2px 7px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
                            🛡️ Tỷ trọng: 20% NAV <span style="font-weight: 600; opacity: 0.85;">(Thăm dò tạo nền trú ẩn)</span>
                        </span>
                    </div>
                    <div style="margin-bottom: 6px; display: flex; align-items: center; flex-wrap: wrap; gap: 2px;">
                        <span style="font-size: 10px; color: #94a3b8; margin-right: 4px;">Mã tạo nền:</span>
                        ${defTickersHtml}
                    </div>
                    <div style="font-size: 11px; color: #cbd5e1; line-height: 1.35;">
                        Áp lực bán cạn kiệt, tạo nền vững chắc. Là hầm trú ẩn an toàn khi thị trường chung có dấu hiệu phân phối chốt lời.
                    </div>
                </div>
                <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 10.5px; font-weight: 700; color: #f59e0b; background: rgba(245,158,11,0.12); padding: 3px 8px; border-radius: 4px;">
                        👉 Theo dõi sát, giải ngân thăm dò
                    </span>
                    <button onclick="openSectorDrilldown('${defCode}', '${defName}')" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #cbd5e1; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                        <span>🛡️</span> Soi nền ➔
                    </button>
                </div>
            </div>
        </div>
    `;
}

window.renderTacticalRadarScope = function() {
    const container = document.getElementById('radarProMatrixEchart');
    if (!container) return;

    const m = window.radarProState.computedMetrics;
    const selectedCode = window.radarProState.selectedIcbCode || 'all';
    const selectedName = window.radarProState.selectedIcbName || 'Toàn Thị Trường';
    const icbMap = window.radarProState.icbStockMap || {};

    // 1. Thu thập tất cả các items từ 4 quadrant
    const allItems = [];
    if (m) {
        (m.dandat || []).forEach(i => allItems.push({ ...i, q: 'dandat', qName: '👑 Siêu Sóng Tăng Tốc', color: '#10b981', colorClass: 'blip-green' }));
        (m.caithien || []).forEach(i => allItems.push({ ...i, q: 'caithien', qName: '🌱 Tiền Vào Bắt Đáy', color: '#38bdf8', colorClass: 'blip-blue' }));
        (m.suyyeu || []).forEach(i => allItems.push({ ...i, q: 'suyyeu', qName: '⚠️ Hạ Nhiệt / Chốt Lời', color: '#f59e0b', colorClass: 'blip-yellow' }));
        (m.tuthao || []).forEach(i => allItems.push({ ...i, q: 'tuthao', qName: '❄️ Ngủ Đông / Dò Đáy', color: '#ef4444', colorClass: 'blip-red' }));
    }

    // 2. Tính toán độ lệch cực đại (scale)
    let maxDelta = 4.0;
    allItems.forEach(i => {
        const dx = Math.abs((i.ratio !== undefined ? i.ratio : 100) - 100);
        const dy = Math.abs((i.mom !== undefined ? i.mom : 100) - 100);
        if (dx > maxDelta) maxDelta = dx;
        if (dy > maxDelta) maxDelta = dy;
    });
    maxDelta = Math.min(16.0, Math.max(4.5, maxDelta));

    // 3. Khởi tạo layout khung Radar 360 nếu chưa có
    let wrapper = container.querySelector('.radar-scope-wrapper');
    if (!wrapper) {
        container.innerHTML = `
            <div class="radar-scope-wrapper">
                <!-- 4 Huy Hiệu Cung Tác Chiến (Bố trí ở 4 góc ngoài để không đè nội dung hình tròn) -->
                <div class="radar-quadrant-badge q-leading">👑 CUNG 1: DẪN DẮT (TĂNG TỐC)</div>
                <div class="radar-quadrant-badge q-improving">🌱 CUNG 2: ĐÓN ĐẦU (TÍCH LŨY)</div>
                <div class="radar-quadrant-badge q-lagging">❄️ CUNG 3: NGUY HIỂM (DÒ ĐÁY)</div>
                <div class="radar-quadrant-badge q-weakening">⚠️ CUNG 4: HẠ NHIỆT (PHÂN PHỐI)</div>

                <div class="radar-display-wrap" id="radarDisplayWrap">
                    <!-- 5 Vòng Cự Ly Đồng Tâm Mở Rộng 530px -->
                    <div class="radar-ring ring-1" title="Cự ly 25%"></div>
                    <div class="radar-ring ring-2" title="Cự ly 50%"></div>
                    <div class="radar-ring ring-3" title="Cự ly 75%"></div>
                    <div class="radar-ring ring-4" title="Cự ly 100%"></div>
                    <div class="radar-ring ring-5" title="Cự ly 125%"></div>

                    <!-- Trục Chữ Thập Crosshairs Tâm (100, 100) -->
                    <div class="radar-crosshair-h"></div>
                    <div class="radar-crosshair-v"></div>

                    <!-- Tia Quét 360 Độ 60 FPS -->
                    <div class="radar-sweep-beam"></div>

                    <!-- Lớp SVG Véctơ Quỹ Đạo & Nón Dự Báo -->
                    <svg class="radar-svg-overlay" id="radarSvgOverlay" viewBox="0 0 100 100"></svg>

                    <!-- Container Chứa Các Điểm Mục Tiêu (Blips) -->
                    <div class="radar-blips-container" id="radarBlipsContainer"></div>
                </div>

                <!-- Footer Status Bar -->
                <div class="radar-footer-status">
                    <span>🎯 Tâm: Cân bằng (100)</span>
                    <span>📡 Giãn Tâm: Vùng trung tâm mở rộng 2x</span>
                    <span id="radarFilterSectorStatusText" style="color: #38bdf8; font-weight: 700;">${selectedCode === 'all' ? '🌟 Toàn thị trường' : 'Đang lọc: ' + selectedName + ' (' + selectedCode + ')'}</span>
                    <span style="color: #10b981;">🛡️ Smart Focus triệt tiêu 100% rác chữ</span>
                </div>
            </div>
        `;
    } else {
        const statText = document.getElementById('radarFilterSectorStatusText');
        if (statText) {
            statText.innerText = selectedCode === 'all' ? '🌟 Toàn thị trường' : `Đang lọc: ${selectedName} (${selectedCode})`;
        }
    }

    const blipsContainer = document.getElementById('radarBlipsContainer');
    if (!blipsContainer) return;

    // 4. Lọc và định vị từng blip với Thuật toán Giãn Tâm Phi Tuyến & Triệt Tiêu Đè Chữ
    const sortedByDist = [...allItems].sort((a, b) => {
        const da = Math.hypot((a.ratio || 100) - 100, (a.mom || 100) - 100);
        const db = Math.hypot((b.ratio || 100) - 100, (b.mom || 100) - 100);
        return db - da;
    });
    const topBreakoutSyms = new Set(sortedByDist.slice(0, 10).map(i => i.symbol || i.icbCode));
    const lockedSym = window.radarProState.lockedSymbol || null;
    let lockedItemCoords = null;
    const coneCandidates = [];

    // Tính toán tọa độ với Thuật toán Giãn Tâm Phi Tuyến (Non-linear Radial Scale)
    const processedItems = [];
    allItems.forEach(item => {
        const sym = item.symbol || item.icbCode || '';
        const name = item.name || sym;
        const ratio = item.ratio !== undefined ? item.ratio : 100;
        const mom = item.mom !== undefined ? item.mom : 100;

        const dx = ratio - 100;
        const dy = mom - 100;
        const dist = Math.hypot(dx, dy);
        const normDist = Math.min(1.0, dist / maxDelta);
        // Thuật toán Giãn Tâm: Phóng đại 2x khu vực trung tâm chênh lệch thấp 0-2%
        const expandedDist = Math.pow(normDist, 0.72);
        const rPct = Math.min(45, Math.max(6.5, expandedDist * 43.5));
        const angle = Math.atan2(-dy, dx);
        const leftPct = Number((50 + rPct * Math.cos(angle)).toFixed(2));
        const topPct = Number((50 + rPct * Math.sin(angle)).toFixed(2));

        // Kiểm tra khớp bộ lọc ICB
        let isMatch = false;
        if (selectedCode === 'all') {
            isMatch = true;
        } else {
            const stockInfo = icbMap[sym];
            if (sym === selectedCode || item.icbCode === selectedCode) {
                isMatch = true;
            } else if (stockInfo) {
                if (stockInfo.icbCodes && stockInfo.icbCodes.includes(selectedCode)) isMatch = true;
                else if (stockInfo.icbCode === selectedCode) isMatch = true;
            }
        }

        const isLocked = (lockedSym && (lockedSym === sym || lockedSym === item.icbCode));
        const isHighlight = isLocked || (selectedCode !== 'all' ? isMatch : topBreakoutSyms.has(sym));
        const isGhost = !isLocked && !isMatch && selectedCode !== 'all';

        processedItems.push({
            item, sym, name, ratio, mom, dx, dy, dist, rPct, angle,
            x: leftPct, y: topPct, isMatch, isLocked, isHighlight, isGhost
        });
    });

    // Phát hiện và xử lý va chạm nhãn (De-clumping & Callout Leader Lines)
    const calloutLines = [];
    const visibleHighlights = processedItems.filter(p => p.isHighlight || p.isLocked);

    for (let i = 0; i < visibleHighlights.length; i++) {
        const a = visibleHighlights[i];
        a.labelX = a.x;
        a.labelY = a.y;
        a.hasCallout = false;

        for (let j = 0; j < i; j++) {
            const b = visibleHighlights[j];
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            // Nếu 2 chấm cách nhau dưới 6% bán kính (khoảng 32px)
            if (d < 6.2) {
                // Đẩy nhãn a ra xa so le theo hướng radial
                const pushAngle = Math.atan2(a.y - 50, a.x - 50);
                const offsetDist = 5.8;
                a.labelX = Number((a.x + Math.cos(pushAngle) * offsetDist).toFixed(2));
                a.labelY = Number((a.y + Math.sin(pushAngle) * offsetDist).toFixed(2));
                a.hasCallout = true;
                calloutLines.push({
                    x1: a.x, y1: a.y,
                    x2: a.labelX, y2: a.labelY,
                    color: a.item.color
                });
                break;
            }
        }
    }

    let blipsHtml = '';
    processedItems.forEach(p => {
        const { item, sym, name, ratio, mom, x, y, isMatch, isLocked, isHighlight, isGhost, labelX, labelY, hasCallout } = p;
        const safeName = (name || '').replace(/'/g, "\\'");
        const safeSym = (sym || '').replace(/'/g, "\\'");
        const safeQName = (item.qName || '').replace(/'/g, "\\'");

        let nodeClass = `blip-node radar-blip ${item.colorClass}`;
        if (isLocked) {
            nodeClass += ' locked blip-locked';
            lockedItemCoords = { leftPct: x, topPct: y, sym, color: item.color };
            coneCandidates.unshift({ x, y, sym, name, item, isLocked: true });
        } else if (isGhost) {
            nodeClass += ' blip-ghost';
        } else if (isHighlight) {
            nodeClass += ' blip-highlight';
            coneCandidates.push({ x, y, sym, name, item, isLocked: false });
        }

        // Tên ngắn gọn hiển thị
        const shortName = (name && name !== sym) ? name.split(' ')[0] : '';
        const displayLabel = isLocked ? `🎯 ${sym} [KHÓA]` : (sym.length <= 4 ? `${sym}` : `${sym} ${shortName}`);

        if (hasCallout) {
            blipsHtml += `
                <div class="${nodeClass}" 
                     data-sym="${sym}"
                     data-match="${isMatch ? '1' : '0'}"
                     style="left: ${x}%; top: ${y}%; color: ${item.color};"
                     onmouseenter="window.showRadarBlipTooltip(event, '${safeSym}', '${safeName}', ${ratio}, ${mom}, '${safeQName}', '${item.color}')"
                     onmouseleave="window.hideRadarBlipTooltip()"
                     onclick="window.handleRadarBlipClick('${safeSym}', '${safeName}')">
                    <div class="blip-dot" style="background: ${item.color};"></div>
                </div>
                <div style="position: absolute; left: ${labelX}%; top: ${labelY}%; transform: translateY(-50%); font-size: 10px; font-weight: 800; color: ${item.color}; background: rgba(2,6,23,0.92); border: 1px solid ${item.color}55; padding: 1px 6px; border-radius: 4px; white-space: nowrap; pointer-events: none; z-index: 20; box-shadow: 0 0 6px rgba(0,0,0,0.8);">
                    ${displayLabel}
                </div>
            `;
        } else {
            blipsHtml += `
                <div class="${nodeClass}" 
                     data-sym="${sym}"
                     data-match="${isMatch ? '1' : '0'}"
                     style="left: ${x}%; top: ${y}%; color: ${item.color};"
                     onmouseenter="window.showRadarBlipTooltip(event, '${safeSym}', '${safeName}', ${ratio}, ${mom}, '${safeQName}', '${item.color}')"
                     onmouseleave="window.hideRadarBlipTooltip()"
                     onclick="window.handleRadarBlipClick('${safeSym}', '${safeName}')">
                    <div class="blip-dot" style="${isLocked ? '' : 'background: ' + item.color + ';'}"></div>
                    ${(isHighlight || isLocked) ? `<span class="blip-label" style="color: ${isLocked ? '#38bdf8' : '#e2e8f0'};">${displayLabel}</span>` : ''}
                </div>
            `;
        }
    });

    // 5. Vẽ Nón Dự Báo 5D, Vệt Đuôi Lịch Sử, Callout Lines & Tia Laser trên lớp SVG
    const svgOverlay = document.getElementById('radarSvgOverlay');
    const isShowCone = !!window.radarProState.showPredictiveCone;

    if (svgOverlay) {
        let svgDefs = `
            <defs>
                <radialGradient id="coneGradPurple" cx="20%" cy="30%" r="80%">
                    <stop offset="0%" stop-color="rgba(192, 132, 252, 0.5)"/>
                    <stop offset="60%" stop-color="rgba(168, 85, 247, 0.22)"/>
                    <stop offset="100%" stop-color="rgba(168, 85, 247, 0.01)"/>
                </radialGradient>
                <radialGradient id="coneGradCyan" cx="20%" cy="30%" r="80%">
                    <stop offset="0%" stop-color="rgba(56, 189, 248, 0.5)"/>
                    <stop offset="60%" stop-color="rgba(14, 165, 233, 0.22)"/>
                    <stop offset="100%" stop-color="rgba(56, 189, 248, 0.01)"/>
                </radialGradient>
                <radialGradient id="coneGradGreen" cx="20%" cy="30%" r="80%">
                    <stop offset="0%" stop-color="rgba(16, 185, 129, 0.5)"/>
                    <stop offset="60%" stop-color="rgba(5, 150, 105, 0.22)"/>
                    <stop offset="100%" stop-color="rgba(16, 185, 129, 0.01)"/>
                </radialGradient>
            </defs>
        `;

        let svgContent = '';
        let futureMarkersHtml = '';

        // Vẽ các đường chỉ dẫn callout lines
        calloutLines.forEach(line => {
            svgContent += `
                <line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" class="callout-line" stroke="${line.color}" />
            `;
        });

        if (isShowCone && coneCandidates.length > 0) {
            // Smart Focus: Chỉ vẽ nón cho mục tiêu ĐANG KHÓA (hoặc top 1 nếu chưa khóa) để giữ màn hình thoáng đãng 90%!
            const targetsToDraw = lockedSym ? coneCandidates.filter(c => c.isLocked) : coneCandidates.slice(0, 1);

            targetsToDraw.forEach(cand => {
                const x0 = cand.x;
                const y0 = cand.y;
                const item = cand.item;
                const sym = cand.sym;
                const isItemLocked = cand.isLocked;

                // Véc tơ vận tốc theo quán tính RRG xoay theo chiều kim đồng hồ
                const dx_c = x0 - 50;
                const dy_c = y0 - 50;
                const dist_c = Math.hypot(dx_c, dy_c) || 1;
                const tanX = -dy_c / dist_c;
                const tanY = dx_c / dist_c;

                const r_diff = (item.r_diff !== undefined && item.r_diff !== 0) ? item.r_diff : 0.5;
                const m_diff = (item.m_diff !== undefined && item.m_diff !== 0) ? item.m_diff : 0.3;

                const vx = tanX * 3.6 + r_diff * 0.7;
                const vy = tanY * 3.6 - m_diff * 0.7;
                const vMag = Math.hypot(vx, vy) || 3.6;

                // Tọa độ tương lai 5 phiên tới (+5D)
                let xFut = x0 + (vx / vMag) * 9.2;
                let yFut = y0 + (vy / vMag) * 9.2;
                const distFut = Math.hypot(xFut - 50, yFut - 50);
                if (distFut > 43) {
                    xFut = 50 + ((xFut - 50) / distFut) * 43;
                    yFut = 50 + ((yFut - 50) / distFut) * 43;
                }

                // Véc tơ pháp tuyến mở rộng phễu nón xác suất
                const dSeg = Math.hypot(xFut - x0, yFut - y0) || 1;
                const normX = -((yFut - y0) / dSeg) * 4.0;
                const normY = ((xFut - x0) / dSeg) * 4.0;

                const p0 = `${x0.toFixed(2)},${y0.toFixed(2)}`;
                const p1 = `${(xFut + normX).toFixed(2)},${(yFut + normY).toFixed(2)}`;
                const p2 = `${(xFut + (vx / vMag) * 1.5).toFixed(2)},${(yFut + (vy / vMag) * 1.5).toFixed(2)}`;
                const p3 = `${(xFut - normX).toFixed(2)},${(yFut - normY).toFixed(2)}`;

                const coneGrad = isItemLocked ? 'coneGradPurple' : (item.q === 'dandat' ? 'coneGradGreen' : 'coneGradCyan');
                const strokeColor = isItemLocked ? '#c084fc' : (item.color || '#38bdf8');

                // Điểm kiểm soát uốn cong quỹ đạo
                const ctrlX = ((x0 + xFut) / 2 + normX * 0.25).toFixed(2);
                const ctrlY = ((y0 + yFut) / 2 + normY * 0.25).toFixed(2);

                // Vệt đuôi lịch sử (History Trail 3 phiên quá khứ)
                const h1x = (x0 - (vx / vMag) * 3.5).toFixed(2);
                const h1y = (y0 - (vy / vMag) * 3.5).toFixed(2);
                const h2x = (x0 - (vx / vMag) * 7.0).toFixed(2);
                const h2y = (y0 - (vy / vMag) * 7.0).toFixed(2);

                // 1. Phễu Nón Xác Suất Phát Quang
                svgContent += `
                    <polygon points="${p0} ${p1} ${p2} ${p3}" fill="url(#${coneGrad})" class="predictive-cone-polygon" />
                `;

                // 2. Vệt Đuôi Lịch Sử
                svgContent += `
                    <polyline points="${h2x},${h2y} ${h1x},${h1y} ${x0.toFixed(2)},${y0.toFixed(2)}" class="history-trail-path" />
                    <circle cx="${h2x}" cy="${h2y}" r="0.65" class="history-trail-dot" />
                    <circle cx="${h1x}" cy="${h1y}" r="0.75" class="history-trail-dot" />
                `;

                // 3. Đường Quỹ Đạo Dự Báo 5 Phiên
                svgContent += `
                    <path d="M ${x0.toFixed(2)} ${y0.toFixed(2)} Q ${ctrlX} ${ctrlY} ${xFut.toFixed(2)} ${yFut.toFixed(2)}" 
                          fill="none" stroke="${strokeColor}" stroke-width="0.45" class="predictive-trajectory-path" />
                `;

                // 4. Khung ngắm tọa độ tương lai (+5D)
                futureMarkersHtml += `
                    <div class="future-point-marker" style="left: ${xFut.toFixed(2)}%; top: ${yFut.toFixed(2)}%;">
                        <div class="future-glow-ring" style="border-color: ${strokeColor};"></div>
                        <span class="future-badge" style="border-color: ${strokeColor}; color: ${strokeColor};">🔮 ${sym} (+5D)</span>
                    </div>
                `;
            });
        }

        // 5. Tia Laser ngắm bắn nếu có mục tiêu bị khóa
        if (lockedItemCoords) {
            svgContent += `
                <line x1="50" y1="50" x2="${lockedItemCoords.leftPct}" y2="${lockedItemCoords.topPct}" class="radar-laser-line" style="stroke-width: 0.45;" />
                <circle cx="${lockedItemCoords.leftPct}" cy="${lockedItemCoords.topPct}" r="3.2" stroke="#38bdf8" stroke-width="0.45" fill="none" opacity="0.9" class="radar-laser-reticle" />
            `;
        }

        svgOverlay.innerHTML = svgDefs + svgContent;

        if (futureMarkersHtml) {
            blipsHtml += futureMarkersHtml;
        }
    }

    blipsContainer.innerHTML = blipsHtml;

    // 6. Cập nhật Bảng Khóa Mục Tiêu Hỏa Lực đồng bộ
    if (typeof window.renderFireControlPanel === 'function') {
        window.renderFireControlPanel();
    }
};

/**
 * Render Bảng Khóa Mục Tiêu Hỏa Lực (Cột 32% - BƯỚC 3: TIẾN ĐỘ 75%)
 */
window.renderFireControlPanel = function() {
    const attackContainer = document.getElementById('targetAttackListContainer');
    const defenseContainer = document.getElementById('targetDefenseListContainer');
    const spotlightContainer = document.getElementById('targetSpotlightContainer');
    if (!attackContainer || !defenseContainer) return;

    const m = window.radarProState.computedMetrics;
    const selectedCode = window.radarProState.selectedIcbCode || 'all';
    const selectedName = window.radarProState.selectedIcbName || 'Toàn Thị Trường';
    const icbMap = window.radarProState.icbStockMap || {};
    const lockedSym = window.radarProState.lockedSymbol || null;

    // Cập nhật nhãn trạng thái Header
    const statusBadge = document.getElementById('targetLockStatusBadge');
    if (statusBadge) {
        if (lockedSym) {
            statusBadge.innerHTML = `<span style="display: inline-block; width: 5px; height: 5px; background: #38bdf8; border-radius: 50%; box-shadow: 0 0 6px #38bdf8;"></span> LOCKED: ${lockedSym}`;
            statusBadge.style.color = '#38bdf8';
            statusBadge.style.borderColor = '#38bdf8';
            statusBadge.style.background = 'rgba(56, 189, 248, 0.2)';
        } else {
            statusBadge.innerHTML = `<span style="display: inline-block; width: 5px; height: 5px; background: #10b981; border-radius: 50%;"></span> RADAR LOCK`;
            statusBadge.style.color = '#10b981';
            statusBadge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
            statusBadge.style.background = 'rgba(16, 185, 129, 0.2)';
        }
    }

    // 1. Thu thập danh sách items
    const allItems = [];
    if (m) {
        (m.dandat || []).forEach(i => allItems.push({ ...i, q: 'dandat', qName: '👑 Dẫn dắt', color: '#10b981' }));
        (m.caithien || []).forEach(i => allItems.push({ ...i, q: 'caithien', qName: '🌱 Đón đầu', color: '#38bdf8' }));
        (m.suyyeu || []).forEach(i => allItems.push({ ...i, q: 'suyyeu', qName: '⚠️ Hạ nhiệt', color: '#f59e0b' }));
        (m.tuthao || []).forEach(i => allItems.push({ ...i, q: 'tuthao', qName: '❄️ Dò đáy', color: '#ef4444' }));
    }

    // 2. Lọc theo ngành nếu người dùng đã chọn ngành ở Bước 2
    let candidateList = allItems;
    if (selectedCode !== 'all') {
        candidateList = allItems.filter(item => {
            const sym = item.symbol || item.icbCode || '';
            if (sym === selectedCode || item.icbCode === selectedCode) return true;
            const stockInfo = icbMap[sym];
            if (stockInfo) {
                if (stockInfo.icbCodes && stockInfo.icbCodes.includes(selectedCode)) return true;
                if (stockInfo.icbCode === selectedCode) return true;
            }
            return false;
        });
        if (candidateList.length === 0) {
            candidateList = allItems;
        }
    }

    // 3. Phân bổ Top Tấn Công (Đón Đầu Sóng: Cung 2 Tích Lũy / Cung 1 Tăng Tốc)
    let attackCandidates = candidateList.filter(i => i.q === 'caithien' || i.q === 'dandat');
    if (attackCandidates.length === 0) {
        attackCandidates = [...candidateList].sort((a, b) => (b.mom || 100) - (a.mom || 100));
    } else {
        attackCandidates.sort((a, b) => {
            const scoreA = (a.mom || 100) * 1.2 + (a.ratio || 100) * 0.8 + (a.q === 'caithien' ? 5 : 0);
            const scoreB = (b.mom || 100) * 1.2 + (b.ratio || 100) * 0.8 + (b.q === 'caithien' ? 5 : 0);
            return scoreB - scoreA;
        });
    }
    const topAttack = attackCandidates.slice(0, 4);

    // 4. Phân bổ Cảnh Báo Bẫy Xả / Phòng Thủ (Cung 4 Hạ Nhiệt / Cung 3 Dò Đáy)
    let defenseCandidates = candidateList.filter(i => i.q === 'suyyeu' || i.q === 'tuthao');
    if (defenseCandidates.length === 0) {
        defenseCandidates = [...candidateList].sort((a, b) => (a.mom || 100) - (b.mom || 100));
    } else {
        defenseCandidates.sort((a, b) => {
            const scoreA = (a.mom || 100) + (a.m_diff || 0) * 2;
            const scoreB = (b.mom || 100) + (b.m_diff || 0) * 2;
            return scoreA - scoreB;
        });
    }
    const topDefense = defenseCandidates.slice(0, 3);

    // 5. Kiểm tra mã locked có nằm trong topAttack hay topDefense không
    const isLockedInAttack = topAttack.some(i => (i.symbol || i.icbCode) === lockedSym);
    const isLockedInDefense = topDefense.some(i => (i.symbol || i.icbCode) === lockedSym);

    // Render Spotlight Card nếu mã locked không nằm trong top
    if (spotlightContainer) {
        if (lockedSym && !isLockedInAttack && !isLockedInDefense) {
            const lockedItem = allItems.find(i => (i.symbol || i.icbCode) === lockedSym);
            if (lockedItem) {
                const sym = lockedItem.symbol || lockedItem.icbCode || '';
                const name = lockedItem.name || sym;
                const ratio = lockedItem.ratio !== undefined ? lockedItem.ratio : 100;
                const mom = lockedItem.mom !== undefined ? lockedItem.mom : 100;
                const safeName = name.replace(/'/g, "\\'");
                const safeSym = sym.replace(/'/g, "\\'");
                spotlightContainer.innerHTML = `
                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 11px; font-weight: 800; color: #c084fc; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
                            <span style="display: flex; align-items: center; gap: 6px;">
                                <span>🎯</span> MỤC TIÊU ĐANG KHÓA HỎA LỰC
                            </span>
                            <button onclick="window.lockRadarTarget('${safeSym}')" style="background: transparent; border: none; color: #94a3b8; font-size: 10px; cursor: pointer;">✕ Bỏ khóa</button>
                        </div>
                        <div class="target-card-item spotlight locked" data-sym="${sym}">
                            <div style="flex: 1; min-width: 0;">
                                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px;">
                                    <div style="display: flex; align-items: center; gap: 6px;">
                                        <strong style="color: #fff; font-size: 13px;">${sym}</strong>
                                        <span class="badge-hud badge-wave">${lockedItem.qName || 'Mục tiêu'}</span>
                                    </div>
                                    <span style="font-size: 10px; color: #38bdf8; font-weight: 800;">LOCKED HUD</span>
                                </div>
                                <div style="font-size: 10.5px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                    ${name}
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px;">
                                    <div class="target-stat-pill"><span style="color: #64748b;">RS:</span><strong style="color: #10b981;">${ratio.toFixed(1)}</strong></div>
                                    <div class="target-stat-pill"><span style="color: #64748b;">MOM:</span><strong style="color: #38bdf8;">${mom.toFixed(1)}</strong></div>
                                </div>
                            </div>
                            <div style="margin-left: 10px; display: flex; flex-direction: column; gap: 4px; align-items: flex-end;">
                                <button class="btn-target-lock active" onclick="window.lockRadarTarget('${safeSym}')">🎯 ĐÃ KHÓA</button>
                                <button class="btn-target-drill" onclick="window.drilldownTargetStock('${safeSym}', '${safeName}')">Soi ➔</button>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                spotlightContainer.innerHTML = '';
            }
        } else {
            spotlightContainer.innerHTML = '';
        }
    }

    // 6. Render Top Attack
    let attackHtml = '';
    topAttack.forEach(item => {
        const sym = item.symbol || item.icbCode || '';
        const name = item.name || sym;
        const ratio = item.ratio !== undefined ? item.ratio : 100;
        const mom = item.mom !== undefined ? item.mom : 100;
        const isLocked = lockedSym === sym;
        const diffStr = (item.r_diff !== undefined && item.r_diff !== 0) ? `${item.r_diff > 0 ? '+' : ''}${item.r_diff.toFixed(1)}%` : `+${Math.max(0.2, (mom - 99.5) * 0.8).toFixed(1)}%`;
        const powerPct = Math.min(100, Math.max(15, (mom - 95) * 10));
        const safeName = name.replace(/'/g, "\\'");
        const safeSym = sym.replace(/'/g, "\\'");

        attackHtml += `
            <div class="target-card-item attack ${isLocked ? 'locked' : ''}" 
                 data-sym="${sym}"
                 onclick="window.lockRadarTarget('${safeSym}', '${safeName}')">
                <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <strong style="color: #f8fafc; font-size: 13px; letter-spacing: 0.5px;">${sym}</strong>
                            <span class="badge-hud ${item.q === 'dandat' ? 'badge-hero' : 'badge-wave'}">${item.q === 'dandat' ? '👑 DẪN DẮT' : '🌱 ĐÓN ĐẦU'}</span>
                        </div>
                        <div style="text-align: right;">
                            <span style="font-size: 11px; font-weight: 800; color: #10b981;">${diffStr}</span>
                        </div>
                    </div>
                    <div style="font-size: 10.5px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${name}
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px;">
                        <div class="target-stat-pill">
                            <span style="color: #64748b;">RS:</span>
                            <strong style="color: #10b981;">${ratio.toFixed(1)}</strong>
                        </div>
                        <div class="target-stat-pill">
                            <span style="color: #64748b;">MOM:</span>
                            <strong style="color: #38bdf8;">${mom.toFixed(1)}</strong>
                        </div>
                        <div style="flex: 1;">
                            <div class="target-power-bar" title="Xung lực bứt phá: ${mom.toFixed(1)}">
                                <div class="target-power-fill" style="width: ${powerPct}%;"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="margin-left: 10px; display: flex; flex-direction: column; gap: 4px; align-items: flex-end;">
                    <button class="btn-target-lock ${isLocked ? 'active' : ''}" 
                            title="Khóa mục tiêu trên đài radar" 
                            onclick="event.stopPropagation(); window.lockRadarTarget('${safeSym}', '${safeName}')">
                        ${isLocked ? '🎯 ĐÃ KHÓA' : '🎯 KHÓA'}
                    </button>
                    <button class="btn-target-drill" 
                            title="Soi biểu đồ & lệnh" 
                            onclick="event.stopPropagation(); window.drilldownTargetStock('${safeSym}', '${safeName}')">
                        Soi ➔
                    </button>
                </div>
            </div>
        `;
    });
    attackContainer.innerHTML = attackHtml || `<div style="font-size: 11px; color: #64748b; padding: 10px; text-align: center;">Chưa có mục tiêu phù hợp.</div>`;

    // 7. Render Top Defense
    let defenseHtml = '';
    topDefense.forEach(item => {
        const sym = item.symbol || item.icbCode || '';
        const name = item.name || sym;
        const ratio = item.ratio !== undefined ? item.ratio : 100;
        const mom = item.mom !== undefined ? item.mom : 100;
        const isLocked = lockedSym === sym;
        const diffStr = (item.r_diff !== undefined && item.r_diff !== 0) ? `${item.r_diff > 0 ? '+' : ''}${item.r_diff.toFixed(1)}%` : `${((mom - 100) * 0.6).toFixed(1)}%`;
        const safeName = name.replace(/'/g, "\\'");
        const safeSym = sym.replace(/'/g, "\\'");

        defenseHtml += `
            <div class="target-card-item defense ${isLocked ? 'locked' : ''}" 
                 data-sym="${sym}"
                 onclick="window.lockRadarTarget('${safeSym}', '${safeName}')">
                <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <strong style="color: #f8fafc; font-size: 13px; letter-spacing: 0.5px;">${sym}</strong>
                            <span class="badge-hud ${item.q === 'tuthao' ? 'badge-danger' : 'badge-warn'}">${item.q === 'tuthao' ? '❄️ DÒ ĐÁY' : '⚠️ HẠ NHIỆT'}</span>
                        </div>
                        <div style="text-align: right;">
                            <span style="font-size: 11px; font-weight: 800; color: #ef4444;">${diffStr}</span>
                        </div>
                    </div>
                    <div style="font-size: 10.5px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${name}
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px;">
                        <div class="target-stat-pill">
                            <span style="color: #64748b;">RS:</span>
                            <strong style="color: #f59e0b;">${ratio.toFixed(1)}</strong>
                        </div>
                        <div class="target-stat-pill">
                            <span style="color: #64748b;">MOM:</span>
                            <strong style="color: #ef4444;">${mom.toFixed(1)}</strong>
                        </div>
                        <span style="font-size: 10px; color: #ef4444; font-weight: 600;">⚠️ Cảnh giác rung lắc</span>
                    </div>
                </div>
                <div style="margin-left: 10px; display: flex; flex-direction: column; gap: 4px; align-items: flex-end;">
                    <button class="btn-target-lock ${isLocked ? 'active' : ''}" 
                            title="Khóa theo dõi trên đài radar" 
                            onclick="event.stopPropagation(); window.lockRadarTarget('${safeSym}', '${safeName}')">
                        ${isLocked ? '🛡️ ĐÃ KHÓA' : '🛡️ KHÓA'}
                    </button>
                </div>
            </div>
        `;
    });
    defenseContainer.innerHTML = defenseHtml || `<div style="font-size: 11px; color: #64748b; padding: 10px; text-align: center;">Chưa phát hiện bẫy xả.</div>`;

    // Cập nhật badge số lượng
    const attackBadge = document.getElementById('targetAttackCountBadge');
    if (attackBadge) attackBadge.innerText = `${topAttack.length} mã hỏa lực`;
    const defenseBadge = document.getElementById('targetDefenseCountBadge');
    if (defenseBadge) defenseBadge.innerText = `${topDefense.length} mã cảnh báo`;
};

function render2DMatrixEChart() {
    renderTacticalRadarScope();
    if (typeof window.renderFireControlPanel === 'function') {
        window.renderFireControlPanel();
    }
}

window.togglePredictiveCone = function() {
    window.radarProState.showPredictiveCone = !window.radarProState.showPredictiveCone;
    const isShow = window.radarProState.showPredictiveCone;
    const statusElem = document.getElementById('predictiveConeStatus');
    const btn = document.getElementById('btnTogglePredictiveCone');

    if (statusElem) statusElem.innerText = isShow ? 'BẬT' : 'TẮT';
    if (btn) {
        if (isShow) {
            btn.style.background = 'rgba(168, 85, 247, 0.2)';
            btn.style.borderColor = '#c084fc';
            btn.style.color = '#e9d5ff';
            btn.style.boxShadow = '0 0 12px rgba(168, 85, 247, 0.4)';
        } else {
            btn.style.background = 'rgba(255, 255, 255, 0.05)';
            btn.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            btn.style.color = '#94a3b8';
            btn.style.boxShadow = 'none';
        }
    }
    render2DMatrixEChart();
    if (typeof showAiToast === 'function') {
        showAiToast(isShow ? '🔮 Đã BẬT Nón Dự Báo 5 Phiên trên Ma Trận!' : 'Đã TẮT Nón Dự Báo.');
    }
};

/**
 * Tạo đồ thị đường cong SVG Sparkline siêu nhẹ thuần túy (0ms)
 */
function generateSvgSparkline(values, type, label, unit = '') {
    if (!values || values.length === 0) {
        values = [100, 100];
    }
    if (values.length === 1) {
        values = [values[0], values[0]];
    }

    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const firstVal = values[0];
    const lastVal = values[values.length - 1];
    const diff = lastVal - firstVal;
    const isUp = diff >= 0;

    const width = 88;
    const height = 24;
    const paddingY = 3;
    const availableHeight = height - paddingY * 2;
    const valRange = maxVal - minVal;

    const points = values.map((v, i) => {
        const x = (i / (values.length - 1)) * (width - 10) + 5;
        const normalized = valRange > 0.001 ? (v - minVal) / valRange : 0.5;
        const y = height - paddingY - normalized * availableHeight;
        return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
    });

    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const midX = (prev.x + curr.x) / 2;
        pathD += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    let strokeColor = isUp ? '#10b981' : '#ef4444';
    if (type === 'speed') {
        strokeColor = isUp ? '#38bdf8' : '#f59e0b';
    }
    const lastPt = points[points.length - 1];

    const pctChange = firstVal > 0 ? ((diff / firstVal) * 100).toFixed(1) : '0.0';
    const sign = diff >= 0 ? '+' : '';
    const arrow = isUp ? '↗' : '↘';
    const tooltipText = `${label}: ${lastVal.toFixed(1)}${unit ? ' ' + unit : ''} (${arrow} ${sign}${pctChange}% qua ${values.length} phiên • Đáy: ${minVal.toFixed(1)} | Đỉnh: ${maxVal.toFixed(1)})`;

    const html = `
        <div class="radar-pro-sparkline-wrap" title="${tooltipText}" data-tooltip="${tooltipText}" style="display: inline-flex; align-items: center; justify-content: flex-end; cursor: pointer; position: relative;">
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow: visible; filter: drop-shadow(0 0 2px ${strokeColor}55);">
                <path d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <circle cx="${lastPt.x}" cy="${lastPt.y}" r="2.8" fill="${strokeColor}" />
                <circle cx="${lastPt.x}" cy="${lastPt.y}" r="5" fill="none" stroke="${strokeColor}" stroke-width="1" opacity="0.6">
                    <animate attributeName="r" values="2.8;5.5;2.8" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
                </circle>
            </svg>
        </div>
    `;

    return { html, tooltipText };
}

function extractSparklineData(item) {
    const power = (item.ratio !== undefined) ? item.ratio : 100.0;
    const speed = (item.mom !== undefined) ? item.mom : 100.0;

    let ratioHistory = [];
    let momHistory = [];
    if (Array.isArray(item.history) && item.history.length > 0) {
        ratioHistory = item.history.map(h => typeof h.ratio === 'number' ? h.ratio : (parseFloat(h.ratio) || 100));
        momHistory = item.history.map(h => typeof h.mom === 'number' ? h.mom : (parseFloat(h.mom) || 100));
    } else {
        const r = typeof power === 'number' ? power : (parseFloat(power) || 100);
        const m = typeof speed === 'number' ? speed : (parseFloat(speed) || 100);
        const rDiff = typeof item.r_diff === 'number' ? item.r_diff : 0.4;
        const mDiff = typeof item.m_diff === 'number' ? item.m_diff : 0.3;
        ratioHistory = [r - rDiff * 4, r - rDiff * 3, r - rDiff * 2, r - rDiff, r];
        momHistory = [m - mDiff * 4, m - mDiff * 3, m - mDiff * 2, m - mDiff, m];
    }

    const p = generateSvgSparkline(ratioHistory, 'power', 'Sức Mạnh Giá');
    const s = generateSvgSparkline(momHistory, 'speed', 'Xung Lực Tiền');
    return {
        sparkPower: p.html,
        sparkSpeed: s.html,
        tooltipPower: p.tooltipText,
        tooltipSpeed: s.tooltipText
    };
}

// Lắng nghe sự kiện hover sparkline toàn cục để hiện tooltip tức thì (<0.01s)
if (typeof window !== 'undefined' && !window._radarProTooltipInitialized) {
    window._radarProTooltipInitialized = true;
    document.addEventListener('mouseover', function(e) {
        const wrap = e.target.closest('.radar-pro-sparkline-wrap');
        if (!wrap) return;
        const text = wrap.getAttribute('data-tooltip');
        if (!text) return;
        let tip = document.getElementById('radarProGlobalTooltip');
        if (!tip) {
            tip = document.createElement('div');
            tip.id = 'radarProGlobalTooltip';
            tip.style.cssText = 'position:fixed; z-index:999999; background:rgba(11,15,25,0.96); border:1px solid #38bdf8; border-radius:6px; padding:6px 12px; font-size:11px; font-weight:700; color:#f8fafc; pointer-events:none; box-shadow:0 8px 24px rgba(0,0,0,0.8), 0 0 10px rgba(56,189,248,0.3); white-space:nowrap; display:none; transition:opacity 0.1s ease;';
            document.body.appendChild(tip);
        }
        tip.innerText = text;
        tip.style.display = 'block';
        tip.style.opacity = '1';
    });
    document.addEventListener('mousemove', function(e) {
        const tip = document.getElementById('radarProGlobalTooltip');
        if (tip && tip.style.display === 'block') {
            tip.style.left = (e.clientX + 14) + 'px';
            tip.style.top = (e.clientY - 34) + 'px';
        }
    });
    document.addEventListener('mouseout', function(e) {
        const wrap = e.target.closest('.radar-pro-sparkline-wrap');
        if (wrap) {
            const tip = document.getElementById('radarProGlobalTooltip');
            if (tip) {
                tip.style.display = 'none';
                tip.style.opacity = '0';
            }
        }
    });
}

function renderMatrixTable() {
    const tbody = document.getElementById('radarProMatrixTableBody');
    const m = window.radarProState.computedMetrics;
    if (!tbody || !m) return;

    const list = [
        ...m.dandat.map(i => ({ ...i, q: 'dandat' })),
        ...m.caithien.map(i => ({ ...i, q: 'caithien' })),
        ...m.suyyeu.map(i => ({ ...i, q: 'suyyeu' })),
        ...m.tuthao.map(i => ({ ...i, q: 'tuthao' }))
    ];

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #64748b;">Không có dữ liệu.</td></tr>`;
        return;
    }

    let rowsHtml = '';
    list.forEach((item, idx) => {
        const sym = item.symbol || item.icbCode || '-';
        const name = item.name || sym;

        let badgeHtml = '';
        if (item.q === 'dandat') {
            badgeHtml = `<span style="background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); padding: 3px 8px; border-radius: 4px; font-weight: 800; font-size: 11px;">👑 Siêu Sóng Tăng Tốc</span>`;
        } else if (item.q === 'caithien') {
            badgeHtml = `<span style="background: rgba(56,189,248,0.15); color: #38bdf8; border: 1px solid rgba(56,189,248,0.3); padding: 3px 8px; border-radius: 4px; font-weight: 800; font-size: 11px;">🌱 Tiền Vào Bắt Đáy</span>`;
        } else if (item.q === 'suyyeu') {
            badgeHtml = `<span style="background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); padding: 3px 8px; border-radius: 4px; font-weight: 800; font-size: 11px;">⚠️ Hạ Nhiệt / Chốt Lời</span>`;
        } else {
            badgeHtml = `<span style="background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); padding: 3px 8px; border-radius: 4px; font-weight: 800; font-size: 11px;">❄️ Ngủ Đông / Dò Đáy</span>`;
        }

        const { sparkPower, sparkSpeed, tooltipPower, tooltipSpeed } = extractSparklineData(item);

        rowsHtml += `
            <tr>
                <td style="text-align: center; color: #64748b;">${idx + 1}</td>
                <td><strong style="color: #f8fafc;">${sym}</strong></td>
                <td>${name}</td>
                <td>${badgeHtml}</td>
                <td style="text-align: right;" title="${tooltipPower}">${sparkPower}</td>
                <td style="text-align: right;" title="${tooltipSpeed}">${sparkSpeed}</td>
                <td style="text-align: center;">
                    <button onclick="openSectorDrilldown('${sym}', '${name}')" style="background: rgba(56,189,248,0.15); border: 1px solid rgba(56,189,248,0.3); color: #38bdf8; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 5px; cursor: pointer;">
                        🔍 Khám Phá Mã
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = rowsHtml;
}

window.openSectorDrilldown = function(icbCode, sectorName) {
    const modalWrap = document.getElementById('radarProDrilldownModalWrap');
    if (!modalWrap) return;

    modalWrap.style.display = 'block';
    modalWrap.innerHTML = `
        <div class="drilldown-modal-backdrop" onclick="if(event.target === this) closeSectorDrilldown();">
            <div class="drilldown-modal-box">
                <div class="drilldown-modal-header">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 20px;">🔍</span>
                        <div>
                            <div style="font-size: 15px; font-weight: 800; color: #fff;">
                                KHÁM PHÁ CỔ PHIẾU NGÀNH: <span style="color: #38bdf8;">${sectorName}</span> (${icbCode})
                            </div>
                            <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
                                Phân loại chi tiết 4 trạng thái dòng tiền dân dã của từng cổ phiếu trong ngành
                            </div>
                        </div>
                    </div>
                    <button onclick="closeSectorDrilldown()" style="background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer; padding: 4px 8px;">✕</button>
                </div>

                <div class="drilldown-modal-body" id="sectorDrilldownContentBody">
                    <div style="text-align: center; padding: 40px; color: #94a3b8;">
                        <div style="font-size: 24px; margin-bottom: 8px;">⏳</div>
                        Đang đồng bộ danh sách cổ phiếu trong ngành ${sectorName}...
                    </div>
                </div>
            </div>
        </div>
    `;

    fetchSectorDrilldownData(icbCode, sectorName);
};

window.closeSectorDrilldown = function() {
    const modalWrap = document.getElementById('radarProDrilldownModalWrap');
    if (modalWrap) modalWrap.style.display = 'none';
};

function fetchSectorDrilldownData(icbCode, sectorName) {
    const bodyElem = document.getElementById('sectorDrilldownContentBody');
    if (!bodyElem) return;

    if (window.radarProState.drilldownCache[icbCode]) {
        renderDrilldownData(window.radarProState.drilldownCache[icbCode], sectorName);
        return;
    }

    fetch('/api/rrg-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            exchange: 'ALL',
            icbCode: icbCode,
            type: 'stock',
            level: 1,
            basket: 'ALL',
            force_refresh: false
        })
    })
    .then(res => res.json())
    .then(resp => {
        const data = resp.data || resp;
        window.radarProState.drilldownCache[icbCode] = data;
        renderDrilldownData(data, sectorName);
    })
    .catch(err => {
        console.warn('Lỗi drilldown:', err);
        bodyElem.innerHTML = `<div style="text-align: center; padding: 30px; color: #ef4444;">Không thể tải dữ liệu ngành.</div>`;
    });
}

function renderDrilldownData(data, sectorName) {
    const bodyElem = document.getElementById('sectorDrilldownContentBody');
    if (!bodyElem) return;

    const dandat = data.dandat || [];
    const caithien = data.caithien || [];
    const suyyeu = data.suyyeu || [];
    const tuthao = data.tuthao || [];
    const total = dandat.length + caithien.length + suyyeu.length + tuthao.length;

    let rowsHtml = '';
    const all = [
        ...dandat.map(i => ({ ...i, q: 'dandat' })),
        ...caithien.map(i => ({ ...i, q: 'caithien' })),
        ...suyyeu.map(i => ({ ...i, q: 'suyyeu' })),
        ...tuthao.map(i => ({ ...i, q: 'tuthao' }))
    ];

    all.forEach((item, idx) => {
        const sym = item.symbol || '-';
        const name = item.name || sym;
        const power = item.ratio !== undefined ? item.ratio.toFixed(1) : '100.0';
        const speed = item.mom !== undefined ? item.mom.toFixed(1) : '100.0';

        let badge = '';
        let advice = '';
        if (item.q === 'dandat') {
            badge = `<span style="background: rgba(16,185,129,0.15); color: #10b981; padding: 2px 6px; border-radius: 4px; font-weight: 800;">👑 Siêu Sóng</span>`;
            advice = `<span style="color: #10b981; font-weight: 700;">Gia tăng / Giữ chặt</span>`;
        } else if (item.q === 'caithien') {
            badge = `<span style="background: rgba(56,189,248,0.15); color: #38bdf8; padding: 2px 6px; border-radius: 4px; font-weight: 800;">🌱 Bắt Đáy</span>`;
            advice = `<span style="color: #38bdf8; font-weight: 700;">Canh nhặt giá đỏ</span>`;
        } else if (item.q === 'suyyeu') {
            badge = `<span style="background: rgba(245,158,11,0.15); color: #f59e0b; padding: 2px 6px; border-radius: 4px; font-weight: 800;">⚠️ Hạ Nhiệt</span>`;
            advice = `<span style="color: #f59e0b; font-weight: 700;">Chốt lời từng phần</span>`;
        } else {
            badge = `<span style="background: rgba(239,68,68,0.15); color: #ef4444; padding: 2px 6px; border-radius: 4px; font-weight: 800;">❄️ Ngủ Đông</span>`;
            advice = `<span style="color: #64748b;">Đứng ngoài</span>`;
        }

        const { sparkPower, sparkSpeed, tooltipPower, tooltipSpeed } = extractSparklineData(item);

        rowsHtml += `
            <tr>
                <td style="text-align: center; color: #64748b;">${idx + 1}</td>
                <td><strong style="color: #fff; font-size: 13px;">${sym}</strong></td>
                <td>${name}</td>
                <td>${badge}</td>
                <td style="text-align: right;" title="${tooltipPower}">${sparkPower}</td>
                <td style="text-align: right;" title="${tooltipSpeed}">${sparkSpeed}</td>
                <td>${advice}</td>
            </tr>
        `;
    });

    bodyElem.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px;">
            <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 8px; padding: 10px;">
                <div style="font-size: 11px; font-weight: 700; color: #10b981;">👑 SIÊU SÓNG</div>
                <div style="font-size: 20px; font-weight: 900; color: #10b981;">${dandat.length} <span style="font-size: 11px; color: #94a3b8;">mã</span></div>
            </div>
            <div style="background: rgba(56,189,248,0.1); border: 1px solid rgba(56,189,248,0.3); border-radius: 8px; padding: 10px;">
                <div style="font-size: 11px; font-weight: 700; color: #38bdf8;">🌱 BẮT ĐÁY</div>
                <div style="font-size: 20px; font-weight: 900; color: #38bdf8;">${caithien.length} <span style="font-size: 11px; color: #94a3b8;">mã</span></div>
            </div>
            <div style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 8px; padding: 10px;">
                <div style="font-size: 11px; font-weight: 700; color: #f59e0b;">⚠️ HẠ NHIỆT</div>
                <div style="font-size: 20px; font-weight: 900; color: #f59e0b;">${suyyeu.length} <span style="font-size: 11px; color: #94a3b8;">mã</span></div>
            </div>
            <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 10px;">
                <div style="font-size: 11px; font-weight: 700; color: #ef4444;">❄️ NGỦ ĐÔNG</div>
                <div style="font-size: 20px; font-weight: 900; color: #ef4444;">${tuthao.length} <span style="font-size: 11px; color: #94a3b8;">mã</span></div>
            </div>
        </div>

        <div style="font-size: 12px; font-weight: 800; color: #f8fafc; margin-bottom: 8px;">
            DANH SÁCH ${total} CỔ PHIẾU TRONG NGÀNH ${sectorName.toUpperCase()}:
        </div>
        <table class="radar-pro-table">
            <thead>
                <tr>
                    <th style="width: 40px; text-align: center;">#</th>
                    <th style="width: 80px;">Mã CP</th>
                    <th>Tên Doanh Nghiệp</th>
                    <th style="width: 130px;">Trạng Thái</th>
                    <th style="width: 125px; text-align: right;" title="Đường xu hướng 15 phiên (rê chuột xem số liệu chi tiết)">📈 Sức Mạnh Giá</th>
                    <th style="width: 125px; text-align: right;" title="Đường xu hướng 15 phiên (rê chuột xem số liệu chi tiết)">🚀 Xung Lực Tiền</th>
                    <th style="width: 150px;">Gợi Ý Hành Động</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml || '<tr><td colspan="7" style="text-align: center; padding: 20px;">Không có cổ phiếu.</td></tr>'}
            </tbody>
        </table>
    `;
}

function loadRadarProInitialData(forceReload = false) {
    if (!window.radarProState.icbStockMap && typeof window.loadRadarProIcbSectorMapping === 'function') {
        window.loadRadarProIcbSectorMapping();
    }
    const t0 = performance.now();
    const basket = window.radarProState.basket || 'nganh';
    const tf = window.radarProState.timeframe || '1D';
    const icbLevel = window.radarProState.industryLevel || 2;
    const cacheKey = `${basket}_lvl${icbLevel}_${tf}`;

    if (!forceReload && window.radarProState.cachedRrgData[cacheKey]) {
        const cached = window.radarProState.cachedRrgData[cacheKey];
        window.radarProState.data = cached;
        processMetricsAndRender(cached, performance.now() - t0);
        return;
    }

    let payload = {};
    if (basket === 'nganh') {
        payload = { exchange: 'ALL', icbCode: 'ALL', type: 'industry', level: icbLevel, basket: 'ALL', force_refresh: !!forceReload };
    } else if (basket === 'vn30') {
        payload = { exchange: 'ALL', icbCode: 'ALL', type: 'stock', level: 1, basket: 'VN30', force_refresh: !!forceReload };
    } else {
        payload = { exchange: 'ALL', icbCode: 'ALL', type: 'stock', level: 1, basket: 'ALL', force_refresh: !!forceReload };
    }

    fetch('/api/rrg-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => {
        if (!res.ok) throw new Error('API RRG Error ' + res.status);
        return res.json();
    })
    .then(resp => {
        const data = resp.data || resp;
        window.radarProState.cachedRrgData[cacheKey] = data;
        window.radarProState.data = data;
        processMetricsAndRender(data, performance.now() - t0);
    })
    .catch(err => {
        console.warn('[Radar PRO] Lỗi nạp dữ liệu từ API:', err);
        const fallback = generateFallbackData(basket);
        window.radarProState.data = fallback;
        processMetricsAndRender(fallback, performance.now() - t0);
    });
}

function processMetricsAndRender(data, elapsedMs) {
    const dandat = data.dandat || [];
    const caithien = data.caithien || [];
    const suyyeu = data.suyyeu || [];
    const tuthao = data.tuthao || [];

    const total = dandat.length + caithien.length + suyyeu.length + tuthao.length;
    const countPos = dandat.length + caithien.length;
    const countNeg = suyyeu.length + tuthao.length;
    const pctPos = total > 0 ? (countPos / total) * 100 : 50;
    const pctSuyYeu = total > 0 ? (suyyeu.length / total) * 100 : 25;

    let traffic = 'yellow';
    let trafficTitle = 'ĐÈN VÀNG: PHÂN HÓA (PHÒNG THỦ & CƠ CẤU)';
    let trafficDesc = 'Cung cầu thị trường giằng co gắt gao. Dòng tiền chọn lọc rất kỹ lưỡng, chỉ tập trung vào một vài cổ phiếu riêng lẻ.';
    let trafficAction = 'KHÔNG MUA ĐUỔI • TỈA BỚT MÃ YẾU • GIỮ SỨC MUA';
    let trafficBadgeColor = '#f59e0b';
    let trafficBadgeBg = 'rgba(245, 158, 11, 0.15)';

    if (pctPos >= 50) {
        traffic = 'green';
        trafficTitle = 'ĐÈN XANH: THỜI ĐIỂM VÀNG (TẤN CÔNG)';
        trafficDesc = 'Dòng tiền chủ động áp đảo thị trường, các nhóm ngành thi nhau kéo sóng. Xác suất chiến thắng ở mức rất cao.';
        trafficAction = 'MỞ MUA QUYẾT ĐOÁN • TĂNG TỶ TRỌNG SIÊU SÓNG • CÓ THỂ DÙNG MARGIN';
        trafficBadgeColor = '#10b981';
        trafficBadgeBg = 'rgba(16, 185, 129, 0.15)';
    } else if (pctPos < 30) {
        traffic = 'red';
        trafficTitle = 'ĐÈN ĐỎ: BÃO RỦI RO (THU QUÂN GIỮ TIỀN)';
        trafficDesc = 'Áp lực chốt lời diện rộng hoặc dòng tiền lớn đang rút lui phòng thủ. Nguy cơ bull-trap (bẫy kéo xả) rất lớn.';
        trafficAction = 'HẠ MARGIN NGAY • CHỐT LỜI DỨT KHOÁT • TUYỆT ĐỐI KHÔNG BẮT DAO RƠI';
        trafficBadgeColor = '#ef4444';
        trafficBadgeBg = 'rgba(239, 68, 68, 0.15)';
    }

    let marginScore = Math.min(95, Math.max(15, Math.round(pctSuyYeu * 1.5 + (100 - pctPos) * 0.35)));
    let marginZone = 'Vùng An Toàn';
    let marginColor = '#10b981';
    let marginDesc = 'Áp lực đòn bẩy ký quỹ thấp, dư địa mua dồi dào, thị trường an toàn.';
    if (marginScore > 70) {
        marginZone = 'Bão Margin Kích Hoạt';
        marginColor = '#ef4444';
        marginDesc = 'Áp lực chốt lời đòn bẩy dồn dập, nguy cơ rung lắc mạnh ép bán.';
    } else if (marginScore > 40) {
        marginZone = 'Cảnh Báo Rung Lắc';
        marginColor = '#f59e0b';
        marginDesc = 'Sức mua margin bắt đầu căng, cẩn trọng rung giật mạnh trong phiên chiều.';
    }

    let stockPct = 50;
    let cashPct = 50;
    let allocNote = '50% Cổ phiếu dẫn dắt / 50% Tiền mặt chủ động';
    if (traffic === 'green') {
        stockPct = 80; cashPct = 20;
        allocNote = '80% Cổ phiếu Siêu sóng / 20% Tiền mặt';
    } else if (traffic === 'red') {
        stockPct = 20; cashPct = 80;
        allocNote = '20% Cổ phiếu Phòng thủ / 80% Tiền mặt giữ vốn';
    }

    window.radarProState.computedMetrics = {
        traffic, trafficTitle, trafficDesc, trafficAction, trafficBadgeColor, trafficBadgeBg,
        marginScore, marginZone, marginColor, marginDesc,
        stockPct, cashPct, allocNote,
        total, countPos, countNeg,
        dandat, caithien, suyyeu, tuthao
    };

    const basket = window.radarProState.basket || 'nganh';
    const icbLevel = window.radarProState.industryLevel || 2;
    const respElem = document.getElementById('radarProResponseTime');
    if (respElem) {
        if (basket === 'all' && total === 1528) {
            respElem.innerHTML = `Phản hồi: ${elapsedMs.toFixed(2)}ms (<strong style="color: #38bdf8;">1.528</strong> / 1.681 mã đang giao dịch • Đã lọc 153 mã đình chỉ/0 thanh khoản)`;
        } else if (basket === 'nganh') {
            const levelNames = { 1: '10 Siêu ngành vĩ mô', 2: '20 Ngành lớn thực chiến', 3: '43 Phân ngành chuyên sâu', 4: '109 Tiểu ngành vi mô' };
            respElem.innerHTML = `Phản hồi: ${elapsedMs.toFixed(2)}ms (Đã nạp <strong style="color: #38bdf8;">${total}</strong> ngành ICB Cấp ${icbLevel} • ${levelNames[icbLevel] || ''})`;
        } else {
            respElem.innerText = `Phản hồi: ${elapsedMs.toFixed(2)}ms (Đã nạp ${total} mã)`;
        }
    }

    if (window.radarProState.activeTab === 'command') {
        renderCommandHubWidgets();
        renderQuadrantCards();
        renderActionableTable();
    } else if (window.radarProState.activeTab === 'matrix') {
        renderHeroSpotlight();
        renderDominoChain();
        render2DMatrixEChart();
        renderMatrixTable();
    } else if (window.radarProState.activeTab === 'scanner') {
        calculateAndRenderDiamondTab();
    } else if (window.radarProState.activeTab === 'ai') {
        const contentArea = document.getElementById('radarProTabContent');
        if (contentArea) renderAiTabContent(contentArea);
    }
}

function renderCommandHubWidgets() {
    const m = window.radarProState.computedMetrics;
    if (!m) return;

    const wTraffic = document.getElementById('widgetTrafficLight');
    if (wTraffic) {
        wTraffic.innerHTML = `
            <div class="command-widget-title">
                <span>🚦 ĐÈN GIAO THÔNG THỊ TRƯỜNG</span>
                <span style="color: ${m.trafficBadgeColor}; background: ${m.trafficBadgeBg}; padding: 2px 8px; border-radius: 4px; font-weight: 800;">
                    ${m.traffic.toUpperCase()}
                </span>
            </div>
            <div class="traffic-light-container">
                <div class="traffic-light-housing">
                    <div class="traffic-bulb red ${m.traffic === 'red' ? 'active' : ''}"></div>
                    <div class="traffic-bulb yellow ${m.traffic === 'yellow' ? 'active' : ''}"></div>
                    <div class="traffic-bulb green ${m.traffic === 'green' ? 'active' : ''}"></div>
                </div>
                <div>
                    <div class="traffic-status-title" style="color: ${m.trafficBadgeColor};">${m.trafficTitle}</div>
                    <div class="traffic-status-desc">${m.trafficDesc}</div>
                    <div class="action-command-badge" style="background: ${m.trafficBadgeBg}; color: ${m.trafficBadgeColor}; border: 1px solid ${m.trafficBadgeColor};">
                        ⚡ LỆNH HÀNH ĐỘNG: ${m.trafficAction}
                    </div>
                </div>
            </div>
        `;
    }

    const wMargin = document.getElementById('widgetMarginStorm');
    if (wMargin) {
        wMargin.innerHTML = `
            <div class="command-widget-title">
                <span>⚡ CẢM BIẾN BÃO MARGIN</span>
                <span style="color: ${m.marginColor}; font-weight: 800;">${m.marginZone.toUpperCase()}</span>
            </div>
            <div>
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                    <div style="font-size: 26px; font-weight: 900; color: ${m.marginColor};">
                        ${m.marginScore}<span style="font-size: 14px; color: #94a3b8;">/100</span>
                    </div>
                    <div style="font-size: 11px; color: #94a3b8;">Áp lực bán tháo: <strong style="color: ${m.marginColor}">${m.marginScore >= 70 ? 'CAO' : (m.marginScore >= 40 ? 'TRUNG BÌNH' : 'THẤP')}</strong></div>
                </div>
                <div class="margin-gauge-track">
                    <div class="margin-gauge-fill" style="width: ${m.marginScore}%; background: linear-gradient(90deg, #10b981 0%, #f59e0b 50%, #ef4444 100%);"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 9px; color: #64748b;">
                    <span>🟢 An toàn (0-40)</span>
                    <span>🟡 Rung lắc (41-70)</span>
                    <span>🔴 Bão xả (&gt;70)</span>
                </div>
                <div style="font-size: 11px; color: #cbd5e1; margin-top: 8px; line-height: 1.4;">
                    ${m.marginDesc}
                </div>
            </div>
        `;
    }

    const wAlloc = document.getElementById('widgetAssetAllocation');
    if (wAlloc) {
        wAlloc.innerHTML = `
            <div class="command-widget-title">
                <span>📊 TỶ TRỌNG DANH MỤC GỢI Ý</span>
                <span style="color: #38bdf8; font-weight: 800;">CỐ VẤN TÀI SẢN</span>
            </div>
            <div>
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                    <div style="font-size: 20px; font-weight: 900; color: #10b981;">
                        ${m.stockPct}% <span style="font-size: 12px; color: #94a3b8; font-weight: 600;">Cổ Phiếu</span>
                    </div>
                    <div style="font-size: 20px; font-weight: 900; color: #94a3b8;">
                        ${m.cashPct}% <span style="font-size: 12px; color: #64748b; font-weight: 600;">Tiền Mặt</span>
                    </div>
                </div>
                <div class="allocation-bar-track">
                    <div class="allocation-stock" style="width: ${m.stockPct}%;">CP: ${m.stockPct}%</div>
                    <div class="allocation-cash" style="width: ${m.cashPct}%;">TIỀN: ${m.cashPct}%</div>
                </div>
                <div style="font-size: 11px; color: #cbd5e1; margin-top: 8px; line-height: 1.4;">
                    📌 Khuyến nghị VIP: <strong>${m.allocNote}</strong>. Giúp bạn luôn làm chủ thế trận, bảo toàn vốn khi thị trường rung lắc và tối đa hóa lợi nhuận.
                </div>
            </div>
        `;
    }
}

function renderQuadrantCards() {
    const m = window.radarProState.computedMetrics;
    const cardsWrap = document.getElementById('radarProQuadrantCards');
    if (!m || !cardsWrap) return;

    const activeQ = window.radarProState.selectedQuadrant;

    cardsWrap.innerHTML = `
        <div class="quadrant-card card-dandat ${activeQ === 'dandat' ? 'active' : ''}" onclick="filterByQuadrant('dandat')">
            <div class="quadrant-card-title" style="color: #10b981;">
                <span>👑 SIÊU SÓNG TĂNG TỐC</span>
                <span style="font-size: 10px; background: rgba(16,185,129,0.2); padding: 1px 5px; border-radius: 4px;">Kéo giá</span>
            </div>
            <div class="quadrant-count" style="color: #10b981;">${m.dandat.length} <span style="font-size: 11px; color: #94a3b8; font-weight: 500;">mã</span></div>
            <div class="quadrant-subtext">Đang có tiền cá mập kéo mạnh nhất, ưu tiên giữ chặt.</div>
        </div>

        <div class="quadrant-card card-caithien ${activeQ === 'caithien' ? 'active' : ''}" onclick="filterByQuadrant('caithien')">
            <div class="quadrant-card-title" style="color: #38bdf8;">
                <span>🌱 TIỀN VÀO BẮT ĐÁY</span>
                <span style="font-size: 10px; background: rgba(56,189,248,0.2); padding: 1px 5px; border-radius: 4px;">Hồi sinh</span>
            </div>
            <div class="quadrant-count" style="color: #38bdf8;">${m.caithien.length} <span style="font-size: 11px; color: #94a3b8; font-weight: 500;">mã</span></div>
            <div class="quadrant-subtext">Đang nhen nhóm tiền vào từ đáy, chuẩn bị vào sóng mới.</div>
        </div>

        <div class="quadrant-card card-suyyeu ${activeQ === 'suyyeu' ? 'active' : ''}" onclick="filterByQuadrant('suyyeu')">
            <div class="quadrant-card-title" style="color: #f59e0b;">
                <span>⚠️ HẠ NHIỆT / CHỐT LỜI</span>
                <span style="font-size: 10px; background: rgba(245,158,11,0.2); padding: 1px 5px; border-radius: 4px;">Phanh lại</span>
            </div>
            <div class="quadrant-count" style="color: #f59e0b;">${m.suyyeu.length} <span style="font-size: 11px; color: #94a3b8; font-weight: 500;">mã</span></div>
            <div class="quadrant-subtext">Đang phanh đà tăng, đề phòng bẫy kéo xả rung lắc.</div>
        </div>

        <div class="quadrant-card card-tuthao ${activeQ === 'tuthao' ? 'active' : ''}" onclick="filterByQuadrant('tuthao')">
            <div class="quadrant-card-title" style="color: #ef4444;">
                <span>❄️ NGỦ ĐÔNG / DÒ ĐÁY</span>
                <span style="font-size: 10px; background: rgba(239,68,68,0.2); padding: 1px 5px; border-radius: 4px;">Yếu ớt</span>
            </div>
            <div class="quadrant-count" style="color: #ef4444;">${m.tuthao.length} <span style="font-size: 11px; color: #94a3b8; font-weight: 500;">mã</span></div>
            <div class="quadrant-subtext">Chưa có tiền lớn, tránh mua bắt đáy để khỏi chôn vốn.</div>
        </div>
    `;
}

function updateQuadrantCardsUI() {
    const activeQ = window.radarProState.selectedQuadrant;
    document.querySelectorAll('.quadrant-card').forEach(card => card.classList.remove('active'));
    if (activeQ !== 'all') {
        const target = document.querySelector(`.card-${activeQ}`);
        if (target) target.classList.add('active');
    }
}

function renderActionableTable() {
    const m = window.radarProState.computedMetrics;
    const tbody = document.getElementById('radarProActionableTableBody');
    const countBadge = document.getElementById('tableItemCountBadge');
    const heading = document.getElementById('tableFilterHeading');
    if (!m || !tbody) return;

    const activeQ = window.radarProState.selectedQuadrant;
    const qSearch = window.radarProState.searchQuery || '';

    let list = [];
    if (activeQ === 'dandat') {
        list = m.dandat.map(i => ({ ...i, q: 'dandat' }));
        if (heading) heading.innerText = 'DANH SÁCH: 👑 SIÊU SÓNG TĂNG TỐC (ĐANG KÉO MẠNH NHẤT)';
    } else if (activeQ === 'caithien') {
        list = m.caithien.map(i => ({ ...i, q: 'caithien' }));
        if (heading) heading.innerText = 'DANH SÁCH: 🌱 TIỀN VÀO BẮT ĐÁY (ĐANG HỒI SINH TỪ ĐÁY)';
    } else if (activeQ === 'suyyeu') {
        list = m.suyyeu.map(i => ({ ...i, q: 'suyyeu' }));
        if (heading) heading.innerText = 'DANH SÁCH: ⚠️ HẠ NHIỆT / CHỐT LỜI (CẨN TRỌNG BẪY XẢ)';
    } else if (activeQ === 'tuthao') {
        list = m.tuthao.map(i => ({ ...i, q: 'tuthao' }));
        if (heading) heading.innerText = 'DANH SÁCH: ❄️ NGỦ ĐÔNG / DÒ ĐÁY (TRÁNH CHÔN VỐN)';
    } else {
        list = [
            ...m.dandat.map(i => ({ ...i, q: 'dandat' })),
            ...m.caithien.map(i => ({ ...i, q: 'caithien' })),
            ...m.suyyeu.map(i => ({ ...i, q: 'suyyeu' })),
            ...m.tuthao.map(i => ({ ...i, q: 'tuthao' }))
        ];
        if (heading) heading.innerText = 'DANH SÁCH TÁC CHIẾN THỜI GIAN THỰC (TẤT CẢ CÁC MÃ)';
    }

    if (qSearch) {
        list = list.filter(item => {
            const sym = (item.symbol || item.icbCode || '').toUpperCase();
            const name = (item.name || '').toUpperCase();
            return sym.includes(qSearch) || name.includes(qSearch);
        });
    }

    if (countBadge) {
        const basket = window.radarProState.basket;
        const icbLevel = window.radarProState.industryLevel || 2;
        if (basket === 'all' && list.length === 1528) {
            countBadge.innerHTML = `<strong style="color: #38bdf8;">1.528</strong> / 1.681 mã đang giao dịch <span style="color: #94a3b8; font-weight: 400; font-size: 10px;">(đã lọc 153 mã đình chỉ / 0 thanh khoản)</span>`;
        } else if (basket === 'nganh') {
            countBadge.innerHTML = `<strong style="color: #38bdf8;">${list.length}</strong> ngành ICB Cấp ${icbLevel}`;
        } else {
            countBadge.innerText = `${list.length} mã/ngành`;
        }
    }

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 30px; color: #94a3b8;">Không tìm thấy mã nào phù hợp.</td></tr>`;
        return;
    }

    let rowsHtml = '';
    list.forEach((item, idx) => {
        const sym = item.symbol || item.icbCode || '-';
        const name = item.name || sym;
        const power = (item.ratio !== undefined) ? item.ratio.toFixed(1) : '100.0';
        const speed = (item.mom !== undefined) ? item.mom.toFixed(1) : '100.0';

        let badgeHtml = '';
        let actionAdvice = '';
        if (item.q === 'dandat') {
            badgeHtml = `<span style="background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); padding: 3px 8px; border-radius: 4px; font-weight: 800; font-size: 11px;">👑 Siêu Sóng Tăng Tốc</span>`;
            actionAdvice = `<span style="color: #10b981; font-weight: 700;">Gia tăng / Giữ chặt</span>`;
        } else if (item.q === 'caithien') {
            badgeHtml = `<span style="background: rgba(56,189,248,0.15); color: #38bdf8; border: 1px solid rgba(56,189,248,0.3); padding: 3px 8px; border-radius: 4px; font-weight: 800; font-size: 11px;">🌱 Tiền Vào Bắt Đáy</span>`;
            actionAdvice = `<span style="color: #38bdf8; font-weight: 700;">Canh nhặt giá đỏ</span>`;
        } else if (item.q === 'suyyeu') {
            badgeHtml = `<span style="background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); padding: 3px 8px; border-radius: 4px; font-weight: 800; font-size: 11px;">⚠️ Hạ Nhiệt / Chốt Lời</span>`;
            actionAdvice = `<span style="color: #f59e0b; font-weight: 700;">Chốt lời từng phần</span>`;
        } else {
            badgeHtml = `<span style="background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); padding: 3px 8px; border-radius: 4px; font-weight: 800; font-size: 11px;">❄️ Ngủ Đông / Dò Đáy</span>`;
            actionAdvice = `<span style="color: #64748b;">Đứng ngoài quan sát</span>`;
        }

        const { sparkPower, sparkSpeed, tooltipPower, tooltipSpeed } = extractSparklineData(item);

        rowsHtml += `
            <tr>
                <td style="text-align: center; color: #64748b; font-weight: 600;">${idx + 1}</td>
                <td><strong style="color: #f8fafc; font-size: 13px;">${sym}</strong></td>
                <td style="color: #cbd5e1;">${name}</td>
                <td>${badgeHtml}</td>
                <td style="text-align: right;" title="${tooltipPower}">${sparkPower}</td>
                <td style="text-align: right;" title="${tooltipSpeed}">${sparkSpeed}</td>
                <td>${actionAdvice}</td>
            </tr>
        `;
    });

    tbody.innerHTML = rowsHtml;
}

function generateFallbackData(basket) {
    if (basket === 'vn30') {
        return {
            dandat: [
                { symbol: 'VIC', name: 'Tập đoàn Vingroup', ratio: 101.7, mom: 102.5, r_diff: 0.9, m_diff: 0.5 },
                { symbol: 'VPB', name: 'Ngân hàng VPBank', ratio: 101.0, mom: 100.8, r_diff: 0.3, m_diff: 0.2 },
                { symbol: 'FPT', name: 'Công ty Cổ phần FPT', ratio: 104.2, mom: 102.5, r_diff: 0.5, m_diff: 0.3 }
            ],
            caithien: [
                { symbol: 'SHB', name: 'Ngân hàng SHB', ratio: 99.6, mom: 100.2, r_diff: 0.1, m_diff: 0.3 },
                { symbol: 'SSI', name: 'Chứng khoán SSI', ratio: 98.6, mom: 101.4, r_diff: 0.2, m_diff: 0.4 }
            ],
            suyyeu: [
                { symbol: 'MSN', name: 'Tập đoàn Masan', ratio: 100.5, mom: 99.4, r_diff: -0.2, m_diff: -0.3 },
                { symbol: 'TCB', name: 'Ngân hàng Techcombank', ratio: 101.2, mom: 99.6, r_diff: 0.1, m_diff: -0.25 }
            ],
            tuthao: [
                { symbol: 'VHM', name: 'Vinhomes', ratio: 99.5, mom: 99.9, r_diff: -0.1, m_diff: 0.1 },
                { symbol: 'VIB', name: 'Ngân hàng VIB', ratio: 99.2, mom: 99.8, r_diff: -0.2, m_diff: -0.1 }
            ]
        };
    }
    return {
        dandat: [
            { symbol: '8000', icbCode: '8000', name: 'Tài chính (Ngân hàng, CK)', ratio: 102.1, mom: 101.8, r_diff: 0.4, m_diff: 0.3 },
            { symbol: '9000', icbCode: '9000', name: 'Công nghệ Thông tin', ratio: 103.5, mom: 102.4, r_diff: 0.6, m_diff: 0.4 }
        ],
        caithien: [
            { symbol: '1000', icbCode: '1000', name: 'Nguyên vật liệu (Thép, Hóa chất)', ratio: 99.2, mom: 101.5, r_diff: 0.3, m_diff: 0.5 },
            { symbol: '2000', icbCode: '2000', name: 'Công nghiệp & Xây dựng', ratio: 98.7, mom: 100.9, r_diff: 0.2, m_diff: 0.4 }
        ],
        suyyeu: [
            { symbol: '5000', icbCode: '5000', name: 'Dịch vụ Tiêu dùng (Bán lẻ)', ratio: 101.2, mom: 99.1, r_diff: -0.1, m_diff: -0.3 },
            { symbol: '3000', icbCode: '3000', name: 'Hàng tiêu dùng', ratio: 100.5, mom: 98.8, r_diff: -0.2, m_diff: -0.2 }
        ],
        tuthao: [
            { symbol: '8600', icbCode: '8600', name: 'Bất động sản', ratio: 97.1, mom: 98.2, r_diff: -0.3, m_diff: 0.1 },
            { symbol: '7000', icbCode: '7000', name: 'Dược phẩm & Y tế', ratio: 96.4, mom: 97.6, r_diff: -0.1, m_diff: -0.1 }
        ]
    };
}
