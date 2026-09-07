/**
 * dong_tien_tab.js - Module quản lý giao diện và dữ liệu Tab Dòng tiền chuyên biệt
 * Phiên bản: 20260906_step1_subtabs (Bước 1: Tích hợp Sub-tab Biểu Đồ Xu Hướng)
 */

(function() {
    'use strict';

    window.DongTienTab = window.DongTienTab || {
        initialized: false,
        currentSubTab: 'table', // 'table' | 'chart'
        currentFloor: 'ALL', // 'ALL', 'HOSE,HSX', 'HNX', 'UPCOM'
        currentSortCol: 'change1d',
        currentSortDir: 'desc',
        rawSectorData: [],
        expandedSectors: {},
        allExpanded: false,
        searchQuery: '',
        isLoading: false,
        pollTimer: null,
        lastUpdated: null,
        isPolling: false,

        // Cấu hình Sub-tab Biểu đồ xu hướng
        chartSector: '8000',
        chartTimeframe: '5Y',
        chartResolution: '1D',
        trendChartData: null,
        isChartLoading: false,
        trendChartCache: {},
        echartsInstance: null
    };

    /**
     * Kiểm tra phiên giao dịch theo giờ Việt Nam (T2 - T6, 09:00 - 15:00)
     */
    window.DongTienTab.checkTradingHours = function() {
        const now = new Date();
        const day = now.getDay();
        const isWeekday = (day >= 1 && day <= 5);
        const hour = now.getHours();
        const minute = now.getMinutes();
        const currentMin = hour * 60 + minute;

        // Phiên sáng: 09:00 - 11:30 (540 - 690), Phiên chiều: 13:00 - 15:00 (780 - 900)
        const isMorning = (currentMin >= 540 && currentMin <= 690);
        const isAfternoon = (currentMin >= 780 && currentMin <= 900);
        const isOpen = isWeekday && (isMorning || isAfternoon);

        return {
            isOpen: isOpen,
            isWeekday: isWeekday,
            statusText: isOpen ? 'Realtime (15s)' : 'Thị trường Đóng'
        };
    };

    /**
     * Cập nhật trạng thái kết nối và mốc thời gian trên Header
     */
    window.DongTienTab.updateStatusBadge = function() {
        const dot = document.getElementById('dtStatusDot');
        const text = document.getElementById('dtStatusText');
        const time = document.getElementById('dtLastUpdatedText');
        const th = window.DongTienTab.checkTradingHours();

        if (dot) {
            dot.className = 'dt-status-dot ' + (th.isOpen ? 'dt-dot-green' : 'dt-dot-grey');
        }
        if (text) {
            text.innerText = th.isOpen ? 'Realtime (15s)' : 'Thị trường Đóng';
            text.style.color = th.isOpen ? '#4ade80' : '#94a3b8';
        }
        if (time && window.DongTienTab.lastUpdated) {
            const d = window.DongTienTab.lastUpdated;
            const hh = String(d.getHours()).padStart(2, '0');
            const mm = String(d.getMinutes()).padStart(2, '0');
            const ss = String(d.getSeconds()).padStart(2, '0');
            time.innerText = `${hh}:${mm}:${ss}`;
        }
    };

    /**
     * Khởi tạo giao diện nền tảng cho Tab Dòng tiền (Bao gồm Sub-tab Bảng & Biểu đồ)
     */
    window.initDongTienTab = function() {
        const container = document.getElementById('appContent_dongtien');
        if (!container) return;

        if (!window.DongTienTab.initialized) {
            container.innerHTML = `
                <div class="dt-main-container" style="display: flex; flex-direction: column; flex: 1; min-height: 100%; background: #131722; color: #d1d4dc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; position: relative;">
                    <!-- TOP HEADER BAR -->
                    <div class="dt-header" style="padding: 14px 20px; background: #1e222d; border-bottom: 1px solid #2a2e39; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 36px; height: 36px; border-radius: 8px; background: linear-gradient(135deg, #2563eb, #3b82f6); display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(37,99,235,0.35);">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                                </svg>
                            </div>
                            <div>
                                <div style="font-size: 16px; font-weight: 800; color: #f8fafc; letter-spacing: 0.3px;">DÒNG TIỀN THỊ TRƯỜNG & BIẾN ĐỘNG NHÓM NGÀNH</div>
                                <div style="font-size: 11.5px; color: #94a3b8; margin-top: 2px;">Theo dõi luân chuyển dòng tiền, phân bổ thanh khoản và xung lực các nhóm ngành ICB</div>
                            </div>
                        </div>

                        <!-- QUICK STATS & STATUS BADGES -->
                        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                            <!-- Trạng thái kết nối realtime -->
                            <div id="dtStatStatus" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 6px 12px; border-radius: 6px; font-size: 12px; display: flex; align-items: center; gap: 7px;">
                                <span id="dtStatusDot" class="dt-status-dot dt-dot-green"></span>
                                <span id="dtStatusText" style="color: #4ade80; font-weight: 600;">Realtime (15s)</span>
                                <span style="color: #64748b;">•</span>
                                <span id="dtLastUpdatedText" style="color: #94a3b8; font-family: monospace; font-size: 11.5px;">--:--:--</span>
                            </div>

                            <!-- Tổng giá trị giao dịch ngành -->
                            <div id="dtStatTotalVal" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 6px 14px; border-radius: 6px; font-size: 12.5px;">
                                <span style="color: #94a3b8;">Tổng GTGD Ngành:</span> <strong style="color: #38bdf8; font-family: monospace; font-size: 13px;" id="dtTotalValNum">-- tỷ</strong>
                            </div>

                            <!-- Phân bổ độ rộng nhóm ngành -->
                            <div id="dtStatBreadth" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 6px 14px; border-radius: 6px; font-size: 12.5px; font-family: monospace;" title="Số ngành Tăng | Giảm | Không đổi">
                                <span style="color: #00c073; font-weight: 700;">▲ <span id="dtSecAdvCount">--</span></span>
                                <span style="color: #64748b; margin: 0 5px;">|</span>
                                <span style="color: #ff5252; font-weight: 700;">▼ <span id="dtSecDecCount">--</span></span>
                                <span style="color: #64748b; margin: 0 5px;">|</span>
                                <span style="color: #fbbf24; font-weight: 700;">⬌ <span id="dtSecUncCount">--</span></span>
                            </div>
                        </div>
                    </div>

                    <!-- SUB-TAB BAR: BẢNG DÒNG TIỀN VS BIỂU ĐỒ XU HƯỚNG -->
                    <div class="dt-subtabs-nav" style="padding: 8px 20px; background: #161922; border-bottom: 1px solid #2a2e39; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <button id="dtSubTabBtn_table" class="dt-subtab-btn active" onclick="window.DongTienTab.switchSubTab('table')" style="padding: 6px 16px; font-size: 12px; font-weight: 700; border-radius: 6px; border: 1px solid #2563eb; background: #2563eb; color: #fff; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px;">
                                <span>📋</span> Bảng Dòng Tiền
                            </button>
                            <button id="dtSubTabBtn_chart" class="dt-subtab-btn" onclick="window.DongTienTab.switchSubTab('chart')" style="padding: 6px 16px; font-size: 12px; font-weight: 700; border-radius: 6px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); color: #94a3b8; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px;">
                                <span>📈</span> Biểu Đồ Xu Hướng
                            </button>
                        </div>
                        <div id="dtSubTabNote" style="font-size: 11.5px; color: #64748b;">
                            Theo dõi trực quan phân bổ thanh khoản & xu hướng chu kỳ ngành
                        </div>
                    </div>

                    <!-- ================= SUB-CONTENT 1: BẢNG DÒNG TIỀN ================= -->
                    <div id="dtSubContent_table" style="display: flex; flex-direction: column; flex: 1; overflow: hidden;">
                        <!-- TOOLBAR & FILTERS -->
                        <div class="dt-toolbar" style="padding: 10px 20px; background: #181b24; border-bottom: 1px solid #2a2e39; display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap;">
                            <!-- Sàn filter: Tách riêng HOSE và HNX rõ ràng -->
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-right: 4px;">Sàn:</span>
                                <button id="dtFloorBtn_ALL" class="dt-filter-btn active" onclick="window.DongTienTab.switchFloor('ALL')" style="padding: 5px 12px; font-size: 12px; font-weight: 700; border-radius: 6px; border: 1px solid #2563eb; background: #2563eb; color: #fff; cursor: pointer; transition: all 0.2s;">Tất Cả (ALL)</button>
                                <button id="dtFloorBtn_HOSE" class="dt-filter-btn" onclick="window.DongTienTab.switchFloor('HOSE,HSX')" style="padding: 5px 12px; font-size: 12px; font-weight: 600; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: #94a3b8; cursor: pointer; transition: all 0.2s;">HOSE / HSX</button>
                                <button id="dtFloorBtn_HNX" class="dt-filter-btn" onclick="window.DongTienTab.switchFloor('HNX')" style="padding: 5px 12px; font-size: 12px; font-weight: 600; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: #94a3b8; cursor: pointer; transition: all 0.2s;">HNX</button>
                                <button id="dtFloorBtn_UPCOM" class="dt-filter-btn" onclick="window.DongTienTab.switchFloor('UPCOM')" style="padding: 5px 12px; font-size: 12px; font-weight: 600; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: #94a3b8; cursor: pointer; transition: all 0.2s;">UPCoM</button>
                            </div>

                            <!-- Công cụ: Mở rộng tất cả, Tìm kiếm nhanh, Làm mới -->
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <button id="dtExpandAllBtn" onclick="window.DongTienTab.toggleExpandAll()" style="padding: 5px 11px; font-size: 11.5px; font-weight: 600; border-radius: 6px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); color: #94a3b8; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s;">
                                    <span>⊞</span> <span id="dtExpandAllLabel">Mở rộng tất cả</span>
                                </button>

                                <div style="position: relative;">
                                    <input type="text" id="dtSectorSearchInput" placeholder="Tìm tên hoặc mã ngành..." oninput="window.DongTienTab.filterSectors(this.value)" style="width: 210px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; padding: 5px 28px 5px 28px; font-size: 12px; color: #fff; outline: none; transition: border-color 0.2s;">
                                    <span style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); color: #64748b; font-size: 12px;">🔍</span>
                                    <span id="dtClearSearchBtn" onclick="window.DongTienTab.clearSearch()" style="display: none; position: absolute; right: 8px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 12px; cursor: pointer; padding: 2px;">✕</span>
                                </div>

                                <button id="dtReloadBtn" onclick="window.DongTienTab.reload()" style="padding: 5px 12px; font-size: 12px; font-weight: 600; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.06); color: #cbd5e1; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.2s;">
                                    <span id="dtReloadIcon" style="display: inline-block;">↻</span> Làm mới
                                </button>
                            </div>
                        </div>

                        <!-- TABLE CONTENT AREA -->
                        <div style="flex: 1; overflow-y: auto; padding: 14px 20px;">
                            <div style="background: #181b24; border: 1px solid #2a2e39; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.25);">
                                <table style="width: 100%; border-collapse: collapse; font-size: 12.5px; text-align: left;">
                                    <thead style="background: #151821; position: sticky; top: 0; z-index: 10; border-bottom: 1px solid #2a2e39;">
                                        <tr style="user-select: none;">
                                            <th style="padding: 10px 14px; color: #94a3b8; font-weight: 700; width: 65px; text-align: center;">MÃ</th>
                                            <th style="padding: 10px 12px; color: #94a3b8; font-weight: 700; width: 28%; cursor: pointer;" onclick="window.DongTienTab.sort('name')" title="Bấm để sắp xếp theo Tên ngành">
                                                <span id="dtSort_name">NGÀNH / PHÂN CẤP</span>
                                            </th>
                                            <th style="padding: 10px 8px; color: #94a3b8; font-weight: 700; text-align: center; width: 10%; cursor: pointer;" onclick="window.DongTienTab.sort('pe')" title="Bấm để sắp xếp theo P/E">
                                                <span id="dtSort_pe">P/E</span>
                                            </th>
                                            <th style="padding: 10px 12px; color: #94a3b8; font-weight: 700; text-align: right; width: 15%; cursor: pointer;" onclick="window.DongTienTab.sort('change1d')" title="Bấm để sắp xếp theo % Thay đổi">
                                                <span id="dtSort_change1d" style="border-bottom: 2px solid #8b5cf6; padding-bottom: 2px; color: #fff;">% THAY ĐỔI 1D ↓</span>
                                            </th>
                                            <th style="padding: 10px 14px; color: #94a3b8; font-weight: 700; text-align: center; width: 24%; cursor: pointer;" onclick="window.DongTienTab.sort('totalValue')" title="Bấm để sắp xếp theo Phân bổ dòng tiền">
                                                <span id="dtSort_totalValue">PHÂN BỔ DÒNG TIỀN</span>
                                            </th>
                                            <th style="padding: 10px 14px; color: #94a3b8; font-weight: 700; text-align: right; width: 14%; cursor: pointer;" onclick="window.DongTienTab.sort('totalValue')" title="Bấm để sắp xếp theo Giá trị giao dịch">
                                                <span>GTGD (TỶ)</span>
                                            </th>
                                            <th style="padding: 10px 12px; color: #94a3b8; font-weight: 700; text-align: center; width: 65px;">CHI TIẾT</th>
                                        </tr>
                                    </thead>
                                    <tbody id="dt_sectors_tbody">
                                        <tr>
                                            <td colspan="7" style="text-align: center; padding: 50px 20px; color: #787b86;">
                                                <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                                                    <div style="width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #38bdf8; border-radius: 50%; animation: dt-spin 0.8s linear infinite;"></div>
                                                    <span>Đang nạp dữ liệu dòng tiền nhóm ngành...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- ================= SUB-CONTENT 2: BIỂU ĐỒ XU HƯỚNG DÒNG TIỀN ================= -->
                    <div id="dtSubContent_chart" style="display: none; flex-direction: column; flex: 1; overflow-y: auto; padding: 14px 20px;">
                        <!-- TOOLBAR ĐIỀU KHIỂN BIỂU ĐỒ -->
                        <div style="padding: 10px 16px; background: #181b24; border: 1px solid #2a2e39; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 14px;">
                            <!-- Chọn ngành & Khung thời gian -->
                            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                                <div style="position: relative; display: flex; align-items: center;" id="dt_industry_tree_container">
                                    <button id="dt_industry_btn" onclick="window.DongTienTab.toggleIndustryTreePopover(event)" style="padding: 5px 12px; background: #1e222d; color: #ffffff; border: 1px solid #334155; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; min-width: 170px; max-width: 320px; text-align: left; display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                                        <span id="dt_industry_label" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Ngành: Tài chính (8000 - Cấp 1)</span>
                                        <span style="font-size: 9px; margin-left: 4px; color: #787b86;">▼</span>
                                    </button>
                                    
                                    <!-- Popover Dropdown Tree -->
                                    <div id="dt_industry_popover" style="display: none; position: absolute; top: calc(100% + 6px); left: 0; width: 340px; max-height: 420px; background: #1a202c; border: 1px solid #3b4253; border-radius: 8px; box-shadow: 0 12px 32px rgba(0,0,0,0.8); z-index: 10000; flex-direction: column; overflow: hidden;">
                                        <div style="padding: 8px; border-bottom: 1px solid #2a2e39;">
                                            <div style="display: flex; gap: 6px;">
                                                <input type="text" id="dt_industry_search" placeholder="Tìm kiếm ngành..." oninput="window.DongTienTab.filterIndustryTree(this.value)" style="flex: 1; padding: 6px 10px; background: #0e1118; border: 1px solid #2a2e39; color: #ffffff; border-radius: 4px; outline: none; font-size: 12px;">
                                                <button onclick="window.DongTienTab.clearIndustryTreeSearch()" style="padding: 0 12px; background: #ff4d4f; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold; transition: background 0.15s;" title="Xóa tìm kiếm">Xóa</button>
                                            </div>
                                        </div>
                                        <div id="dt_tree_special_all_compare" onclick="window.DongTienTab.selectTreeSector('ALL_COMPARE', '⚡ So Sánh Tương Quan Các Ngành Đầu Tàu (Base 100)')" style="padding: 7px 12px; border-bottom: 1px solid #2a2e39; cursor: pointer; font-size: 11.5px; font-weight: 700; color: #38bdf8; background: rgba(56,189,248,0.08); display: flex; align-items: center; gap: 6px; user-select: none;">
                                            <span>⚡ So Sánh Tương Quan Các Ngành Đầu Tàu (Base 100)</span>
                                        </div>
                                        <div id="dt_industry_tree" style="flex: 1; overflow-y: auto; padding: 8px; font-size: 12px; color: #ffffff; max-height: 340px;">
                                            <!-- Tree will be rendered here -->
                                        </div>
                                    </div>

                                    <!-- Compatibility hidden select -->
                                    <select id="dtChartSectorSelect" style="display: none;">
                                        <option value="ALL_COMPARE">⚡ So Sánh Tương Quan Các Ngành Đầu Tàu (Base 100)</option>
                                        <option value="8000" selected>Tài chính (8000 - Cấp 1)</option>
                                    </select>
                                </div>

                                <button id="dtBtnToggleCompare" onclick="window.DongTienTab.toggleComparisonMode()" style="padding: 5px 12px; font-size: 11.5px; font-weight: 700; border: 1px solid #334155; background: #1e222d; color: #38bdf8; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.15s ease;" title="So sánh tương quan % tăng trưởng của các ngành đầu tàu">
                                    <span>📊 So Sánh Đa Ngành</span>
                                </button>

                                <span style="color: #475569; margin: 0 4px;">|</span>

                                <span style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Khung:</span>
                                <div style="display: flex; align-items: center; background: #1e222d; padding: 2px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); gap: 2px;">
                                    <button class="dt-tf-btn" onclick="window.DongTienTab.setChartTimeframe('1M', this)" style="padding: 4px 10px; font-size: 11.5px; font-weight: 600; border: none; background: transparent; color: #94a3b8; border-radius: 4px; cursor: pointer;">1 Tháng</button>
                                    <button class="dt-tf-btn" onclick="window.DongTienTab.setChartTimeframe('6M', this)" style="padding: 4px 10px; font-size: 11.5px; font-weight: 600; border: none; background: transparent; color: #94a3b8; border-radius: 4px; cursor: pointer;">6 Tháng</button>
                                    <button class="dt-tf-btn" onclick="window.DongTienTab.setChartTimeframe('1Y', this)" style="padding: 4px 10px; font-size: 11.5px; font-weight: 600; border: none; background: transparent; color: #94a3b8; border-radius: 4px; cursor: pointer;">1 Năm</button>
                                    <button class="dt-tf-btn" onclick="window.DongTienTab.setChartTimeframe('3Y', this)" style="padding: 4px 10px; font-size: 11.5px; font-weight: 600; border: none; background: transparent; color: #94a3b8; border-radius: 4px; cursor: pointer;">3 Năm</button>
                                    <button class="dt-tf-btn active" onclick="window.DongTienTab.setChartTimeframe('5Y', this)" style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; border: none; background: #2563eb; color: #fff; border-radius: 4px; cursor: pointer;">5 Năm</button>
                                    <button class="dt-tf-btn" onclick="window.DongTienTab.setChartTimeframe('MAX', this)" style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; border: none; background: transparent; color: #c084fc; border-radius: 4px; cursor: pointer;" title="Toàn bộ lịch sử có sẵn">TẤT CẢ (MAX)</button>
                                </div>
                            </div>

                            <!-- Độ phân giải nến -->
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Nến:</span>
                                <div style="display: flex; align-items: center; background: #1e222d; padding: 2px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); gap: 2px;">
                                    <button class="dt-res-btn active" onclick="window.DongTienTab.setChartResolution('1D', this)" style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; border: none; background: #334155; color: #fff; border-radius: 4px; cursor: pointer;">Ngày (1D)</button>
                                    <button class="dt-res-btn" onclick="window.DongTienTab.setChartResolution('1W', this)" style="padding: 4px 10px; font-size: 11.5px; font-weight: 600; border: none; background: transparent; color: #94a3b8; border-radius: 4px; cursor: pointer;">Tuần (1W)</button>
                                    <button class="dt-res-btn" onclick="window.DongTienTab.setChartResolution('1M', this)" style="padding: 4px 10px; font-size: 11.5px; font-weight: 600; border: none; background: transparent; color: #94a3b8; border-radius: 4px; cursor: pointer;">Tháng (1M)</button>
                                </div>
                            </div>
                        </div>

                        <!-- KHU VỰC KHUNG BIỂU ĐỒ ĐA TẦNG (MULTI-PANE CHART WORKSPACE) -->
                        <div style="background: #181b24; border: 1px solid #2a2e39; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                            
                            <!-- STATS BAR: ĐỈNH, ĐÁY, CHU KỲ, THANH KHOẢN -->
                            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                                <div style="display: flex; align-items: center; gap: 14px; font-size: 12px;">
                                    <span style="font-weight: 700; color: #f8fafc;">CHỈ SỐ VỐN HÓA: <strong id="dtChartSectorTitle" style="color: #38bdf8; font-family: monospace;">TÀI CHÍNH (8000)</strong></span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 14px;">
                                    <div id="dtStatMaxVol" style="font-size: 11.5px; color: #94a3b8; font-family: monospace;">Đỉnh thanh khoản: -- tỷ/phiên</div>
                                    <div id="dtChartCycleReturn" style="font-size: 12.5px; color: #00e676; font-family: monospace; font-weight: 700;">+21.07% (Chu kỳ 5 năm)</div>
                                </div>
                            </div>
                            <div id="dtChartCycleStatsBar" style="display: flex; gap: 16px; align-items: center; font-size: 11.5px; color: #94a3b8; font-family: monospace; background: rgba(255,255,255,0.03); padding: 7px 14px; border-radius: 6px; flex-wrap: wrap;">
                                <span>👑 Đỉnh: <strong id="dtStatPeak" style="color: #f59e0b;">--</strong></span>
                                <span>🔻 Đáy: <strong id="dtStatTrough" style="color: #ef4444;">--</strong></span>
                                <span>📍 Hiện tại: <strong id="dtStatCurrent" style="color: #38bdf8;">--</strong></span>
                                <span>⚡ Số phiên: <strong id="dtStatDataPoints" style="color: #a855f7;">--</strong></span>
                                <span>🔥 % Rank Dòng tiền: <strong id="dtStatFlowRank" style="color: #10b981;">--</strong></span>
                                <span>🧭 Vị thế: <strong id="dtStatIndexRank" style="color: #38bdf8;">--</strong></span>
                            </div>

                            <!-- ECHARTS MULTI-PANE CANVAS -->
                            <div id="dtTrendMultiPaneChart" style="width: 100%; height: 500px; position: relative; background: #151821; border: 1px solid #242832; border-radius: 8px;">
                                <div id="dtChartLoadingOverlay" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(21,24,33,0.7); z-index: 10; color: #94a3b8; font-size: 12px; gap: 8px;">
                                    <div style="width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.1); border-top-color: #38bdf8; border-radius: 50%; animation: dt-spin 0.8s linear infinite;"></div>
                                    <span>Đang nạp đồ thị xu hướng đa tầng...</span>
                                </div>
                            </div>

                            <!-- GUIDE NOTE -->
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #64748b; font-family: -apple-system, sans-serif;">
                                <span id="dtChartGuideText">💡 <strong>Hướng dẫn tương tác:</strong> Lăn chuột trực tiếp trên đồ thị hoặc kéo 2 đầu thanh trượt DataZoom ở đáy để phóng to / thu nhỏ bất kỳ chu kỳ sóng ngành nào.</span>
                                <span style="color: #475569;">ECharts v5.5 • 60 FPS Canvas</span>
                            </div>

                        </div>
                    </div>

                    <!-- FLOATING POPOVER TOOLTIP FOR SECTOR FLOW -->
                    <div id="dt_sector_popover" style="display: none; position: fixed; z-index: 999999; background: #1e222d; color: #f8fafc; border: 1px solid #334155; padding: 10px 14px; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.6); pointer-events: none; font-size: 12px; line-height: 1.5; min-width: 190px; transform: translate(-50%, -100%) translateY(-10px); transition: opacity 0.12s ease;">
                        <div id="dt_pop_val" style="font-weight: 700; color: #38bdf8; margin-bottom: 6px; border-bottom: 1px solid #334155; padding-bottom: 4px;">Tổng GTGD: 0.00 tỷ</div>
                        <div style="display: flex; justify-content: space-between; gap: 12px; margin-bottom: 2px;">
                            <span style="color: #00c073; font-weight: 600;">▲ Tăng:</span>
                            <span id="dt_pop_green" style="font-weight: 700; color: #00c073;">0.00% (0 mã)</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; gap: 12px; margin-bottom: 2px;">
                            <span style="color: #fbbf24; font-weight: 600;">⬌ Tham chiếu:</span>
                            <span id="dt_pop_yellow" style="font-weight: 700; color: #fbbf24;">0.00% (0 mã)</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; gap: 12px;">
                            <span style="color: #ff5252; font-weight: 600;">▼ Giảm:</span>
                            <span id="dt_pop_red" style="font-weight: 700; color: #ff5252;">0.00% (0 mã)</span>
                        </div>
                    </div>
                </div>
                <style>
                    @keyframes dt-spin { to { transform: rotate(360deg); } }
                    @keyframes dt-pulse {
                        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
                        70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
                        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                    }
                    .dt-status-dot {
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        display: inline-block;
                    }
                    .dt-dot-green {
                        background: #22c55e;
                        animation: dt-pulse 2s infinite;
                    }
                    .dt-dot-grey {
                        background: #64748b;
                    }
                    .dt-spinning {
                        animation: dt-spin 0.8s linear infinite !important;
                    }
                    .dt-filter-btn.active {
                        border-color: #2563eb !important;
                        background: #2563eb !important;
                        color: #ffffff !important;
                    }
                    .dt-subtab-btn.active {
                        border-color: #2563eb !important;
                        background: #2563eb !important;
                        color: #ffffff !important;
                        box-shadow: 0 0 12px rgba(37,99,235,0.35);
                    }
                    .dt-sector-row:hover {
                        background: rgba(41,98,255,0.09) !important;
                    }
                    #dtSectorSearchInput:focus {
                        border-color: #2563eb !important;
                    }
                    .dt-tf-btn.active {
                        background: #2563eb !important;
                        color: #ffffff !important;
                    }
                    .dt-res-btn.active {
                        background: #334155 !important;
                        color: #ffffff !important;
                    }

                    /* RRG TreeView Styles */
                    .rrg-tree-ul { list-style-type: none; padding-left: 18px; position: relative; margin: 0; }
                    .rrg-tree-ul::before { content: ""; position: absolute; top: 0; left: 0; bottom: 0; border-left: 1px dotted #334155; }
                    .rrg-tree-li { position: relative; margin: 4px 0; }
                    .rrg-tree-li::before { content: ""; position: absolute; top: 12px; left: -18px; width: 18px; border-top: 1px dotted #334155; }
                    .rrg-tree-li:last-child::before { border-left: 1px dotted #334155; height: 13px; top: 0; bottom: auto; }
                    .rrg-tree-li:last-child::after { content: ""; position: absolute; top: 13px; left: -18px; bottom: 0; border-left: 1px solid #1a202c; }

                    .rrg-tree-node { display: flex; align-items: center; cursor: pointer; padding: 4px 6px; border-radius: 4px; gap: 4px; transition: background 0.15s; }
                    .rrg-tree-node:hover { background: rgba(255, 255, 255, 0.08); }
                    .rrg-tree-toggle { width: 16px; height: 16px; min-width: 16px; min-height: 16px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border: 1px solid #787b86; color: #d1d4dc; font-size: 11px; font-weight: bold; margin-right: 4px; border-radius: 3px; background: rgba(255, 255, 255, 0.05); user-select: none; line-height: 1; box-sizing: border-box; }
                    .rrg-tree-toggle:hover { border-color: #38bdf8; color: #38bdf8; background: rgba(56, 189, 248, 0.15); }
                    .rrg-tree-leaf-icon { width: 16px; height: 16px; min-width: 16px; min-height: 16px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; margin-right: 4px; font-size: 10px; color: #787b86; }
                    .rrg-tree-name { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 12px; }
                    .rrg-tree-match { color: #38bdf8; font-weight: bold; background: rgba(56, 189, 248, 0.2); padding: 0 2px; border-radius: 2px; }
                    #dt_industry_tree::-webkit-scrollbar { width: 6px; }
                    #dt_industry_tree::-webkit-scrollbar-track { background: #1a202c; }
                    #dt_industry_tree::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
                    #dt_industry_tree::-webkit-scrollbar-thumb:hover { background: #475569; }
                    #dt_tree_special_all_compare:hover { background: rgba(56, 189, 248, 0.18) !important; }
                </style>
            `;
            window.DongTienTab.initialized = true;

            // Đăng ký sự kiện đóng popover khi click ra ngoài
            document.addEventListener('click', (e) => {
                const container = document.getElementById('dt_industry_tree_container');
                const popover = document.getElementById('dt_industry_popover');
                if (popover && popover.style.display !== 'none') {
                    if (container && !container.contains(e.target)) {
                        popover.style.display = 'none';
                    }
                }
            });

            // Tải trước dữ liệu cây phân cấp ngành
            window.DongTienTab.loadIndustryTree();
        }

        // Tự động tải dữ liệu và bật polling
        window.DongTienTab.loadData(window.DongTienTab.currentFloor);
        window.DongTienTab.startPolling();
    };

    /**
     * Chuyển đổi qua lại giữa Sub-tab "Bảng Dòng Tiền" và "Biểu Đồ Xu Hướng"
     */
    window.DongTienTab.switchSubTab = function(subTab) {
        window.DongTienTab.currentSubTab = subTab;
        const btnTable = document.getElementById('dtSubTabBtn_table');
        const btnChart = document.getElementById('dtSubTabBtn_chart');
        const contTable = document.getElementById('dtSubContent_table');
        const contChart = document.getElementById('dtSubContent_chart');
        const noteEl = document.getElementById('dtSubTabNote');

        if (subTab === 'table') {
            if (btnTable) {
                btnTable.classList.add('active');
                btnTable.style.background = '#2563eb';
                btnTable.style.borderColor = '#2563eb';
                btnTable.style.color = '#fff';
            }
            if (btnChart) {
                btnChart.classList.remove('active');
                btnChart.style.background = 'rgba(255,255,255,0.04)';
                btnChart.style.borderColor = 'rgba(255,255,255,0.12)';
                btnChart.style.color = '#94a3b8';
            }
            if (contTable) contTable.style.display = 'flex';
            if (contChart) contChart.style.display = 'none';
            if (noteEl) noteEl.innerText = 'Theo dõi trực quan phân bổ thanh khoản & xu hướng chu kỳ ngành';
        } else {
            if (btnChart) {
                btnChart.classList.add('active');
                btnChart.style.background = '#2563eb';
                btnChart.style.borderColor = '#2563eb';
                btnChart.style.color = '#fff';
            }
            if (btnTable) {
                btnTable.classList.remove('active');
                btnTable.style.background = 'rgba(255,255,255,0.04)';
                btnTable.style.borderColor = 'rgba(255,255,255,0.12)';
                btnTable.style.color = '#94a3b8';
            }
            if (contTable) contTable.style.display = 'none';
            if (contChart) contChart.style.display = 'flex';
            // Tự động tải dữ liệu cho Sub-tab Biểu đồ xu hướng và đồng bộ kích thước
            window.DongTienTab.loadTrendChartData(window.DongTienTab.chartSector, window.DongTienTab.chartTimeframe, window.DongTienTab.chartResolution);
            setTimeout(() => {
                if (window.DongTienTab.echartsInstance) {
                    window.DongTienTab.echartsInstance.resize();
                }
            }, 60);
        }
    };

    /**
     * Cắt lát dữ liệu biểu đồ tức thì trên client (< 1ms) từ tập dữ liệu lớn hơn
     */
    window.DongTienTab.sliceChartData = function(baseData, numSessions, newTimeframe) {
        if (!baseData || !baseData.dates) return baseData;
        const total = baseData.dates.length;
        if (total <= numSessions && newTimeframe === baseData.timeframe) return baseData;

        const startIdx = Math.max(0, total - numSessions);
        const dates = baseData.dates.slice(startIdx);
        const indexPoints = (baseData.indexPoints || []).slice(startIdx);
        const ma50 = (baseData.ma50 || []).slice(startIdx);
        const ma200 = (baseData.ma200 || []).slice(startIdx);
        const seriesGreen = (baseData.seriesGreen || []).slice(startIdx);
        const seriesYellow = (baseData.seriesYellow || []).slice(startIdx);
        const seriesRed = (baseData.seriesRed || []).slice(startIdx);

        // Tính lại dòng tiền ròng tích luỹ cho khung thời gian này
        const cumNet = [];
        let curCum = 0;
        for (let i = 0; i < seriesGreen.length; i++) {
            curCum += ((seriesGreen[i] || 0) - (seriesRed[i] || 0));
            cumNet.push(Math.round(curCum * 100) / 100);
        }

        // Tính lại thông số đỉnh/đáy chu kỳ cho khung thời gian này
        let peakPt = 0, peakDate = '', troughPt = Infinity, troughDate = '';
        if (indexPoints.length > 0) {
            peakPt = Math.max(...indexPoints);
            const pIdx = indexPoints.indexOf(peakPt);
            peakDate = dates[pIdx] || '';

            troughPt = Math.min(...indexPoints);
            const tIdx = indexPoints.indexOf(troughPt);
            troughDate = dates[tIdx] || '';
        } else {
            troughPt = 0;
        }

        const startPt = indexPoints[0] || 1;
        const endPt = indexPoints[indexPoints.length - 1] || 1;
        const retPct = startPt > 0 ? Math.round(((endPt - startPt) / startPt) * 10000) / 100 : 0;

        return {
            icbCode: baseData.icbCode,
            sectorTitle: baseData.sectorTitle,
            timeframe: newTimeframe,
            resolution: baseData.resolution,
            mode: baseData.mode,
            dates: dates,
            indexPoints: indexPoints,
            ma50: ma50,
            ma200: ma200,
            cumulativeNetFlow: cumNet,
            seriesGreen: seriesGreen,
            seriesYellow: seriesYellow,
            seriesRed: seriesRed,
            cycleStats: {
                peakPoint: peakPt,
                peakDate: peakDate,
                troughPoint: troughPt === Infinity ? 0 : troughPt,
                troughDate: troughDate,
                totalReturnPct: retPct,
                currentPoint: endPt,
                flowRankPct: (baseData.cycleStats && baseData.cycleStats.flowRankPct) !== undefined ? baseData.cycleStats.flowRankPct : 50,
                flowStatus: (baseData.cycleStats && baseData.cycleStats.flowStatus) || '',
                indexRankPct: (baseData.cycleStats && baseData.cycleStats.indexRankPct) !== undefined ? baseData.cycleStats.indexRankPct : 50
            },
            labels: baseData.labels,
            unit: baseData.unit,
            _fetchLatencyMs: 0.2
        };
    };

    /**
     * Tổng hợp nén dữ liệu sang nến Tuần (1W) hoặc Tháng (1M) tức thì (< 0.5ms) trên client
     */
    window.DongTienTab.aggregateResolution = function(baseData, targetResolution) {
        if (!baseData || !baseData.dates || targetResolution === '1D') return baseData;
        const dates = baseData.dates;
        const indexPoints = baseData.indexPoints || [];
        const seriesGreen = baseData.seriesGreen || [];
        const seriesYellow = baseData.seriesYellow || [];
        const seriesRed = baseData.seriesRed || [];

        const aggDates = [];
        const aggPts = [];
        const aggGreen = [];
        const aggYellow = [];
        const aggRed = [];

        const groups = {};
        for (let i = 0; i < dates.length; i++) {
            const dStr = dates[i];
            let grpKey = dStr;
            try {
                if (targetResolution === '1W') {
                    const day = parseInt(dStr.substring(0, 2), 10);
                    const mon = parseInt(dStr.substring(3, 5), 10) - 1;
                    const yr = parseInt(dStr.substring(6, 10), 10);
                    const d = new Date(Date.UTC(yr, mon, day));
                    const dayNum = d.getUTCDay() || 7;
                    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
                    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
                    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
                    grpKey = `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
                } else if (targetResolution === '1M') {
                    grpKey = `${dStr.substring(6, 10)}-${dStr.substring(3, 5)}`;
                }
            } catch (e) {
                grpKey = dStr;
            }

            if (!groups[grpKey]) {
                groups[grpKey] = {
                    date: dStr,
                    point: indexPoints[i] || 0,
                    g: seriesGreen[i] || 0,
                    y: seriesYellow[i] || 0,
                    r: seriesRed[i] || 0
                };
            } else {
                groups[grpKey].date = dStr;
                groups[grpKey].point = indexPoints[i] || 0;
                groups[grpKey].g += (seriesGreen[i] || 0);
                groups[grpKey].y += (seriesYellow[i] || 0);
                groups[grpKey].r += (seriesRed[i] || 0);
            }
        }

        for (const grp of Object.values(groups)) {
            aggDates.push(grp.date);
            aggPts.push(Math.round(grp.point * 100) / 100);
            aggGreen.push(Math.round(grp.g * 100) / 100);
            aggYellow.push(Math.round(grp.y * 100) / 100);
            aggRed.push(Math.round(grp.r * 100) / 100);
        }

        const ma50 = [];
        const ma200 = [];
        for (let i = 0; i < aggPts.length; i++) {
            const start50 = Math.max(0, i - 49);
            const sub50 = aggPts.slice(start50, i + 1);
            ma50.push(Math.round((sub50.reduce((a, b) => a + b, 0) / sub50.length) * 100) / 100);

            const start200 = Math.max(0, i - 199);
            const sub200 = aggPts.slice(start200, i + 1);
            ma200.push(Math.round((sub200.reduce((a, b) => a + b, 0) / sub200.length) * 100) / 100);
        }

        const cumNet = [];
        let curCum = 0;
        for (let i = 0; i < aggGreen.length; i++) {
            curCum += (aggGreen[i] - aggRed[i]);
            cumNet.push(Math.round(curCum * 100) / 100);
        }

        let peakPt = 0, peakDate = '', troughPt = Infinity, troughDate = '';
        if (aggPts.length > 0) {
            peakPt = Math.max(...aggPts);
            const pIdx = aggPts.indexOf(peakPt);
            peakDate = aggDates[pIdx] || '';
            troughPt = Math.min(...aggPts);
            const tIdx = aggPts.indexOf(troughPt);
            troughDate = aggDates[tIdx] || '';
        } else {
            troughPt = 0;
        }

        const startPt = aggPts[0] || 1;
        const endPt = aggPts[aggPts.length - 1] || 1;
        const retPct = startPt > 0 ? Math.round(((endPt - startPt) / startPt) * 10000) / 100 : 0;

        return {
            icbCode: baseData.icbCode,
            sectorTitle: baseData.sectorTitle,
            timeframe: baseData.timeframe,
            resolution: targetResolution,
            mode: baseData.mode,
            dates: aggDates,
            indexPoints: aggPts,
            ma50: ma50,
            ma200: ma200,
            cumulativeNetFlow: cumNet,
            seriesGreen: aggGreen,
            seriesYellow: aggYellow,
            seriesRed: aggRed,
            cycleStats: {
                peakPoint: peakPt,
                peakDate: peakDate,
                troughPoint: troughPt === Infinity ? 0 : troughPt,
                troughDate: troughDate,
                totalReturnPct: retPct,
                currentPoint: endPt,
                flowRankPct: (baseData.cycleStats && baseData.cycleStats.flowRankPct) !== undefined ? baseData.cycleStats.flowRankPct : 50,
                flowStatus: (baseData.cycleStats && baseData.cycleStats.flowStatus) || '',
                indexRankPct: (baseData.cycleStats && baseData.cycleStats.indexRankPct) !== undefined ? baseData.cycleStats.indexRankPct : 50
            },
            labels: baseData.labels,
            unit: baseData.unit,
            _fetchLatencyMs: 0.1
        };
    };

    /**
     * Nạp dữ liệu lịch sử dài hạn (3-5-10 năm) cho Sub-tab Biểu đồ xu hướng
     */
    window.DongTienTab.loadTrendChartData = async function(icbCode, timeframe, resolution) {
        icbCode = icbCode || window.DongTienTab.chartSector || '8000';
        timeframe = timeframe || window.DongTienTab.chartTimeframe || '5Y';
        resolution = resolution || window.DongTienTab.chartResolution || '1D';

        const cacheKey = `${icbCode}_${timeframe}_${resolution}`;
        const cache = window.DongTienTab.trendChartCache;

        if (cache[cacheKey]) {
            const data = cache[cacheKey];
            window.DongTienTab.trendChartData = data;
            window.DongTienTab.updateTrendChartUI(data);
            return data;
        }

        // Chế độ So Sánh Đa Ngành
        if (icbCode === 'ALL_COMPARE') {
            window.DongTienTab.isChartLoading = true;
            try {
                const startTime = performance.now();
                const res = await fetch(`/api/market/sector-comparison?timeframe=${encodeURIComponent(timeframe)}&resolution=${encodeURIComponent(resolution)}`);
                if (!res.ok) throw new Error("HTTP error " + res.status);
                const data = await res.json();
                const latency = performance.now() - startTime;
                data._fetchLatencyMs = Math.round(latency * 10) / 10;
                data.isComparison = true;
                data.icbCode = 'ALL_COMPARE';

                cache[cacheKey] = data;
                window.DongTienTab.trendChartData = data;
                window.DongTienTab.updateTrendChartUI(data);
                return data;
            } catch (err) {
                console.error("DongTienTab comparison load error:", err);
            } finally {
                window.DongTienTab.isChartLoading = false;
            }
            return;
        }

        // Tối ưu hóa tức thì 1: Nếu cần 1W/1M và đã có dữ liệu 1D tương ứng, tổng hợp tức thì (< 0.5ms)
        if (resolution !== '1D') {
            const base1D = cache[`${icbCode}_${timeframe}_1D`] || cache[`${icbCode}_5Y_1D`];
            if (base1D && base1D.dates && base1D.dates.length > 0) {
                const derivedRes = window.DongTienTab.aggregateResolution(base1D, resolution);
                cache[cacheKey] = derivedRes;
                window.DongTienTab.trendChartData = derivedRes;
                window.DongTienTab.updateTrendChartUI(derivedRes);
                return derivedRes;
            }
        }

        // Tối ưu hóa tức thì 2: Cắt lát từ khung lớn hơn (5Y hoặc MAX) nếu đã có trong bộ đệm
        const tfNumMap = { '1M': 22, '3M': 65, '6M': 130, '1Y': 250, '3Y': 750, '5Y': 1250, 'MAX': 999999, 'ALL': 999999 };
        const numSessions = tfNumMap[timeframe] || 250;
        const largerMAX = cache[`${icbCode}_MAX_${resolution}`];
        const larger5Y = cache[`${icbCode}_5Y_${resolution}`];
        let baseSource = null;
        if (largerMAX && largerMAX.dates && largerMAX.dates.length > numSessions) {
            baseSource = largerMAX;
        } else if (timeframe !== 'MAX' && timeframe !== '5Y' && larger5Y && larger5Y.dates && larger5Y.dates.length > numSessions) {
            baseSource = larger5Y;
        }
        if (baseSource && baseSource.dates) {
            const derivedData = window.DongTienTab.sliceChartData(baseSource, numSessions, timeframe);
            cache[cacheKey] = derivedData;
            window.DongTienTab.trendChartData = derivedData;
            window.DongTienTab.updateTrendChartUI(derivedData);
            return derivedData;
        }

        window.DongTienTab.isChartLoading = true;
        try {
            const startTime = performance.now();
            const res = await fetch(`/api/market/sector-history-flow?icbCode=${encodeURIComponent(icbCode)}&timeframe=${encodeURIComponent(timeframe)}&resolution=${encodeURIComponent(resolution)}`);
            if (!res.ok) throw new Error("HTTP error " + res.status);
            const data = await res.json();
            const latency = performance.now() - startTime;
            data._fetchLatencyMs = Math.round(latency * 10) / 10;

            if (data && !data.error) {
                cache[cacheKey] = data;
                window.DongTienTab.trendChartData = data;
                window.DongTienTab.updateTrendChartUI(data);
                return data;
            }
        } catch (err) {
            console.error("DongTienTab.loadTrendChartData error:", err);
        } finally {
            window.DongTienTab.isChartLoading = false;
        }
    };

    /**
     * Cập nhật các chỉ số chu kỳ, đỉnh/đáy, thanh khoản trên giao diện biểu đồ
     */
    window.DongTienTab.updateTrendChartUI = function(data) {
        if (!data) return;

        const titleEl = document.getElementById('dtChartSectorTitle');
        const retEl = document.getElementById('dtChartCycleReturn');
        const maxVolEl = document.getElementById('dtStatMaxVol');
        const statsBar = document.getElementById('dtChartCycleStatsBar');

        // XỬ LÝ CHẾ ĐỘ SO SÁNH TƯƠNG QUAN ĐA NGÀNH
        if (data.isComparison) {
            if (titleEl) titleEl.innerText = `SO SÁNH TƯƠNG QUAN CÁC NGÀNH ĐẦU TÀU (BASE 100)`;
            if (retEl && data.leader) {
                retEl.innerText = `🏆 Dẫn đầu: ${data.leader.name} (+${data.leader.returnPct}%)`;
                retEl.style.color = '#00e676';
            }
            if (maxVolEl) {
                maxVolEl.innerText = `Khung so sánh: ${data.timeframe} (Mốc 100)`;
            }
            if (statsBar) {
                statsBar.innerHTML = `
                    <span>🏆 Dẫn sóng: <strong style="color: #10b981;">${data.leader ? data.leader.name + ' (+' + data.leader.returnPct + '%)' : '--'}</strong></span>
                    <span>🔻 Tụt hậu: <strong style="color: #ef4444;">${data.laggard ? data.laggard.name + ' (' + data.laggard.returnPct + '%)' : '--'}</strong></span>
                    <span>⚡ Số ngành: <strong style="color: #a855f7;">${data.sectors ? data.sectors.length : 0} ngành</strong></span>
                    <span>🎯 Chuẩn hóa: <strong style="color: #f59e0b;">Base 100 tại đầu chu kỳ</strong></span>
                `;
            }
            window.DongTienTab.renderComparisonChart(data);
            return;
        }

        // Cập nhật tiêu đề ngành
        if (titleEl && data.sectorTitle) {
            titleEl.innerText = data.sectorTitle;
        }

        // Cập nhật thống kê chu kỳ & % Rank lịch sử
        const stats = data.cycleStats;
        if (stats) {
            if (retEl) {
                const retVal = stats.totalReturnPct || 0;
                const sign = retVal > 0 ? '+' : '';
                retEl.innerText = `${sign}${retVal.toFixed(2)}% (Chu kỳ ${data.timeframe})`;
                retEl.style.color = retVal >= 0 ? '#00e676' : '#ff5252';
            }

            if (statsBar) {
                const flowRank = stats.flowRankPct !== undefined ? `${stats.flowRankPct}% (${stats.flowStatus || ''})` : '--';
                const indexRank = stats.indexRankPct !== undefined ? `${stats.indexRankPct}%` : '--';
                statsBar.innerHTML = `
                    <span>👑 Đỉnh: <strong id="dtStatPeak" style="color: #f59e0b;">${stats.peakPoint || '--'} (${stats.peakDate || ''})</strong></span>
                    <span>🔻 Đáy: <strong id="dtStatTrough" style="color: #ef4444;">${stats.troughPoint || '--'} (${stats.troughDate || ''})</strong></span>
                    <span>📍 Hiện tại: <strong id="dtStatCurrent" style="color: #38bdf8;">${stats.currentPoint || '--'}</strong></span>
                    <span>⚡ Số phiên: <strong id="dtStatDataPoints" style="color: #a855f7;">${data.dates ? data.dates.length : 0} phiên</strong></span>
                    <span>🔥 % Rank Dòng tiền: <strong id="dtStatFlowRank" style="color: #10b981;">${flowRank}</strong></span>
                    <span>🧭 Vị thế chu kỳ: <strong id="dtStatIndexRank" style="color: #38bdf8;">${indexRank}</strong></span>
                `;
            }
        }

        // Cập nhật Đỉnh thanh khoản
        if (maxVolEl && Array.isArray(data.seriesGreen) && Array.isArray(data.seriesRed)) {
            let maxDailyVol = 0;
            for (let i = 0; i < data.seriesGreen.length; i++) {
                const totalDay = (data.seriesGreen[i] || 0) + (data.seriesYellow ? data.seriesYellow[i] || 0 : 0) + (data.seriesRed[i] || 0);
                if (totalDay > maxDailyVol) maxDailyVol = totalDay;
            }
            maxVolEl.innerText = `Đỉnh thanh khoản: ${Number(maxDailyVol.toFixed(1)).toLocaleString('vi-VN')} ${data.unit || 'tỷ'}/phiên`;
        }

        // Cập nhật dòng hướng dẫn tương tác
        const guideEl = document.getElementById('dtChartGuideText');
        if (guideEl) {
            if (data.timeframe === 'MAX' || data.timeframe === 'ALL') {
                guideEl.innerHTML = '🔍 <strong>Khung MAX (14 năm):</strong> Đồ thị tự động phóng to 3 năm gần nhất để đọc nến sắc nét. Kéo thanh trượt DataZoom ở đáy hoặc lăn chuột để xem lại toàn bộ lịch sử từ 2013.';
            } else {
                guideEl.innerHTML = '💡 <strong>Hướng dẫn tương tác:</strong> Lăn chuột trực tiếp trên đồ thị hoặc kéo 2 đầu thanh trượt DataZoom ở đáy để phóng to / thu nhỏ bất kỳ chu kỳ sóng ngành nào.';
            }
        }

        // Kết xuất đồ thị ECharts đa tầng
        window.DongTienTab.renderTrendChart(data);
    };

    /**
     * Khởi tạo và kết xuất đồ thị ECharts đa tầng (Multi-pane Chart)
     * Tầng 1: Chỉ số vốn hóa ngành + MA50 + MA200 + Điểm Đỉnh/Đáy chu kỳ
     * Tầng 2: Phân bổ dòng tiền Mua/Tham chiếu/Bán + Dòng tiền ròng tích luỹ (Cumulative Net Flow)
     * Tầng 3: DataZoom tương tác đồng bộ toàn chu kỳ
     */
    window.DongTienTab.renderTrendChart = function(data) {
        if (!data || !window.echarts) return;
        const container = document.getElementById('dtTrendMultiPaneChart');
        if (!container) return;

        const overlay = document.getElementById('dtChartLoadingOverlay');
        if (overlay) overlay.style.display = 'none';

        if (!window.DongTienTab.echartsInstance) {
            window.DongTienTab.echartsInstance = echarts.init(container, null, { renderer: 'canvas' });
            window.addEventListener('resize', () => {
                if (window.DongTienTab.echartsInstance) {
                    window.DongTienTab.echartsInstance.resize();
                }
            });
        }

        const dates = data.dates || [];
        const indexPoints = data.indexPoints || [];
        const ma50 = data.ma50 || [];
        const ma200 = data.ma200 || [];
        const seriesGreen = data.seriesGreen || [];
        const seriesYellow = data.seriesYellow || [];
        const seriesRed = data.seriesRed || [];
        const cumulativeNetFlow = data.cumulativeNetFlow || [];
        const stats = data.cycleStats || {};

        // Đánh dấu mốc Đỉnh, Đáy và Điểm hiện tại trên đồ thị
        const markPointsData = [];
        if (stats.peakPoint && stats.peakDate) {
            const pIdx = dates.indexOf(stats.peakDate);
            if (pIdx !== -1) {
                markPointsData.push({
                    name: 'Đỉnh chu kỳ',
                    coord: [pIdx, stats.peakPoint],
                    value: `👑 ${stats.peakPoint}`,
                    itemStyle: { color: '#f59e0b' },
                    label: { fontSize: 11, fontWeight: 'bold', color: '#ffffff', offset: [0, -4] }
                });
            }
        }
        if (stats.troughPoint && stats.troughDate) {
            const tIdx = dates.indexOf(stats.troughDate);
            if (tIdx !== -1) {
                markPointsData.push({
                    name: 'Đáy chu kỳ',
                    coord: [tIdx, stats.troughPoint],
                    value: `🔻 ${stats.troughPoint}`,
                    itemStyle: { color: '#ef4444' },
                    label: { fontSize: 11, fontWeight: 'bold', color: '#ffffff', offset: [0, 4] }
                });
            }
        }
        if (indexPoints.length > 0) {
            const lastIdx = indexPoints.length - 1;
            const pIdx = stats.peakDate ? dates.indexOf(stats.peakDate) : -1;
            const tIdx = stats.troughDate ? dates.indexOf(stats.troughDate) : -1;
            if (lastIdx !== pIdx && lastIdx !== tIdx) {
                markPointsData.push({
                    name: 'Hiện tại',
                    coord: [lastIdx, indexPoints[lastIdx]],
                    value: `📍 ${indexPoints[lastIdx]}`,
                    itemStyle: { color: '#10b981' },
                    label: { fontSize: 11, fontWeight: 'bold', color: '#ffffff' }
                });
            }
        }

        const isMaxTimeframe = (data.timeframe === 'MAX' || data.timeframe === 'ALL');
        const zoomStart = (isMaxTimeframe && dates.length > 750) ? Math.max(0, Math.round(((dates.length - 750) / dates.length) * 100)) : 0;

        const option = {
            backgroundColor: 'transparent',
            animation: false,
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross',
                    crossStyle: { color: '#64748b', width: 1, type: 'dashed' },
                    label: { backgroundColor: '#1e222d', color: '#e2e8f0', borderColor: '#334155', borderWidth: 1 }
                },
                backgroundColor: 'rgba(21, 24, 33, 0.95)',
                borderColor: '#334155',
                borderWidth: 1,
                padding: [10, 14],
                textStyle: { color: '#f8fafc', fontSize: 12 },
                formatter: function(params) {
                    if (!params || params.length === 0) return '';
                    const idx = params[0].dataIndex;
                    const d = dates[idx] || '';
                    const pt = indexPoints[idx] !== undefined ? indexPoints[idx] : '--';
                    const m50 = ma50[idx] !== undefined ? ma50[idx] : '--';
                    const m200 = ma200[idx] !== undefined ? ma200[idx] : '--';
                    const g = seriesGreen[idx] !== undefined ? Number(seriesGreen[idx]).toLocaleString('vi-VN') : '0';
                    const y = seriesYellow[idx] !== undefined ? Number(seriesYellow[idx]).toLocaleString('vi-VN') : '0';
                    const r = seriesRed[idx] !== undefined ? Number(seriesRed[idx]).toLocaleString('vi-VN') : '0';
                    const net = (seriesGreen[idx] || 0) - (seriesRed[idx] || 0);
                    const netStr = (net >= 0 ? '+' : '') + Number(net.toFixed(1)).toLocaleString('vi-VN');
                    const cum = cumulativeNetFlow[idx] !== undefined ? (cumulativeNetFlow[idx] >= 0 ? '+' : '') + Number(cumulativeNetFlow[idx].toFixed(1)).toLocaleString('vi-VN') : '0';
                    const netColor = net >= 0 ? '#00c073' : '#ff5252';
                    const cumColor = (cumulativeNetFlow[idx] || 0) >= 0 ? '#c084fc' : '#f87171';

                    return `
                        <div style="font-family: -apple-system, BlinkMacSystemFont, monospace; font-size: 12px; line-height: 1.6;">
                            <div style="font-weight: 700; color: #38bdf8; border-bottom: 1px solid #334155; padding-bottom: 4px; margin-bottom: 6px; display: flex; justify-content: space-between;">
                                <span>📅 Ngày: ${d}</span>
                                <span style="color: #94a3b8;">${data.sectorTitle || ''}</span>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px 14px; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 6px;">
                                <div>Chỉ số ngành: <strong style="color: #38bdf8;">${pt}</strong></div>
                                <div>Ròng ngày: <strong style="color: ${netColor};">${netStr} tỷ</strong></div>
                                <div>MA50: <strong style="color: #3b82f6;">${m50}</strong></div>
                                <div>Ròng tích luỹ: <strong style="color: ${cumColor};">${cum} tỷ</strong></div>
                                <div>MA200: <strong style="color: #f59e0b;">${m200}</strong></div>
                            </div>
                            <div style="display: flex; gap: 12px; font-size: 11px;">
                                <span style="color: #00c073;">▲ Vào: <strong>${g}</strong></span>
                                <span style="color: #fbbf24;">⬌ TC: <strong>${y}</strong></span>
                                <span style="color: #ff5252;">▼ Ra: <strong>${r}</strong></span>
                            </div>
                        </div>
                    `;
                }
            },
            legend: {
                data: ['Chỉ số ngành', 'MA50', 'MA200', 'Dòng tiền Vào', 'Tham chiếu', 'Dòng tiền Ra', 'Ròng tích lũy (Net Flow)'],
                top: 4,
                left: 'center',
                textStyle: { color: '#94a3b8', fontSize: 11 },
                itemWidth: 14,
                itemHeight: 8
            },
            axisPointer: {
                link: [{ xAxisIndex: 'all' }]
            },
            grid: [
                { left: 55, right: 65, top: '9%', height: '54%' }, // Tầng 1: Price / Index & MA
                { left: 55, right: 65, top: '69%', height: '19%' }  // Tầng 2: Flow & Cumulative Net
            ],
            xAxis: [
                {
                    type: 'category',
                    gridIndex: 0,
                    data: dates,
                    boundaryGap: false,
                    axisLine: { lineStyle: { color: '#334155' } },
                    axisTick: { show: false },
                    axisLabel: { show: false },
                    splitLine: { show: true, lineStyle: { color: 'rgba(255, 255, 255, 0.04)', type: 'dashed' } }
                },
                {
                    type: 'category',
                    gridIndex: 1,
                    data: dates,
                    boundaryGap: true,
                    axisLine: { lineStyle: { color: '#334155' } },
                    axisTick: { lineStyle: { color: '#334155' } },
                    axisLabel: {
                        color: '#94a3b8',
                        fontSize: 10.5,
                        formatter: function(val) {
                            if (!val) return '';
                            const parts = val.split('-');
                            return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : val;
                        }
                    },
                    splitLine: { show: true, lineStyle: { color: 'rgba(255, 255, 255, 0.04)', type: 'dashed' } }
                }
            ],
            yAxis: [
                // YAxis 0: Điểm số vốn hóa ngành
                {
                    type: 'value',
                    gridIndex: 0,
                    scale: true,
                    splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)', type: 'dashed' } },
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: { color: '#94a3b8', fontSize: 11 }
                },
                // YAxis 1: Thanh khoản dòng tiền (Tầng 2 - Trái)
                {
                    type: 'value',
                    gridIndex: 1,
                    splitLine: { show: false },
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: {
                        color: '#94a3b8',
                        fontSize: 10,
                        formatter: function(v) {
                            return v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v;
                        }
                    }
                },
                // YAxis 2: Dòng tiền ròng tích lũy (Tầng 2 - Phải)
                {
                    type: 'value',
                    gridIndex: 1,
                    scale: true,
                    position: 'right',
                    splitLine: { show: false },
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: {
                        color: '#c084fc',
                        fontSize: 10,
                        formatter: function(v) {
                            return (v >= 0 ? '+' : '') + (Math.abs(v) >= 1000 ? (v / 1000).toFixed(1) + 'k' : v);
                        }
                    }
                }
            ],
            dataZoom: [
                {
                    type: 'slider',
                    xAxisIndex: [0, 1],
                    bottom: 4,
                    height: 20,
                    borderColor: '#2a2e39',
                    backgroundColor: '#151821',
                    fillerColor: 'rgba(37, 99, 235, 0.3)',
                    dataBackground: {
                        lineStyle: { color: '#38bdf8', width: 1 },
                        areaStyle: { color: 'rgba(56, 189, 248, 0.15)' }
                    },
                    selectedDataBackground: {
                        lineStyle: { color: '#3b82f6', width: 1.5 },
                        areaStyle: { color: 'rgba(59, 130, 246, 0.25)' }
                    },
                    handleStyle: { color: '#38bdf8', borderColor: '#fff', borderWidth: 1 },
                    textStyle: { color: '#64748b', fontSize: 10 },
                    start: zoomStart,
                    end: 100
                },
                {
                    type: 'inside',
                    xAxisIndex: [0, 1],
                    start: zoomStart,
                    end: 100
                }
            ],
            series: [
                {
                    name: 'Chỉ số ngành',
                    type: 'line',
                    xAxisIndex: 0,
                    yAxisIndex: 0,
                    data: indexPoints,
                    smooth: true,
                    symbol: 'none',
                    lineStyle: { width: 2.5, color: '#38bdf8' },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(56, 189, 248, 0.25)' },
                            { offset: 1, color: 'rgba(56, 189, 248, 0.0)' }
                        ])
                    },
                    markPoint: {
                        data: markPointsData
                    }
                },
                {
                    name: 'MA50',
                    type: 'line',
                    xAxisIndex: 0,
                    yAxisIndex: 0,
                    data: ma50,
                    smooth: true,
                    symbol: 'none',
                    lineStyle: { width: 1.8, color: '#3b82f6' }
                },
                {
                    name: 'MA200',
                    type: 'line',
                    xAxisIndex: 0,
                    yAxisIndex: 0,
                    data: ma200,
                    smooth: true,
                    symbol: 'none',
                    lineStyle: { width: 1.8, color: '#f59e0b' }
                },
                {
                    name: 'Dòng tiền Vào',
                    type: 'bar',
                    stack: 'flow',
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    data: seriesGreen,
                    itemStyle: { color: '#00c073', borderRadius: [2, 2, 0, 0] },
                    barMaxWidth: 14
                },
                {
                    name: 'Tham chiếu',
                    type: 'bar',
                    stack: 'flow',
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    data: seriesYellow,
                    itemStyle: { color: '#fbbf24' },
                    barMaxWidth: 14
                },
                {
                    name: 'Dòng tiền Ra',
                    type: 'bar',
                    stack: 'flow',
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    data: seriesRed,
                    itemStyle: { color: '#ff5252', borderRadius: [2, 2, 0, 0] },
                    barMaxWidth: 14
                },
                {
                    name: 'Ròng tích lũy (Net Flow)',
                    type: 'line',
                    xAxisIndex: 1,
                    yAxisIndex: 2,
                    data: cumulativeNetFlow,
                    smooth: true,
                    symbol: 'none',
                    lineStyle: { width: 2.2, color: '#c084fc' }
                }
            ]
        };

        window.DongTienTab.echartsInstance.setOption(option, true);
    };

    /**
     * Kết xuất đồ thị So Sánh Tương Quan Đa Ngành (Multi-sector Normalized Comparison)
     * Tất cả các ngành được chuẩn hóa về Base 100 tại điểm đầu chu kỳ
     */
    window.DongTienTab.renderComparisonChart = function(data) {
        if (!data || !window.echarts) return;
        const container = document.getElementById('dtTrendMultiPaneChart');
        if (!container) return;

        const overlay = document.getElementById('dtChartLoadingOverlay');
        if (overlay) overlay.style.display = 'none';

        if (!window.DongTienTab.echartsInstance) {
            window.DongTienTab.echartsInstance = echarts.init(container, null, { renderer: 'canvas' });
            window.addEventListener('resize', () => {
                if (window.DongTienTab.echartsInstance) {
                    window.DongTienTab.echartsInstance.resize();
                }
            });
        }

        const dates = data.dates || [];
        const sectors = data.sectors || [];
        const series = [];

        sectors.forEach((s) => {
            const isLeader = (s.rank === 1);
            series.push({
                name: `${s.name} (${s.returnPct >= 0 ? '+' : ''}${s.returnPct}%)`,
                type: 'line',
                data: s.normalized,
                smooth: true,
                showSymbol: false,
                lineStyle: {
                    width: isLeader ? 3 : 1.8,
                    color: s.color
                },
                itemStyle: { color: s.color },
                emphasis: {
                    focus: 'series',
                    lineStyle: { width: 3.5 }
                }
            });
        });

        const isMaxComp = (data.timeframe === 'MAX' || data.timeframe === 'ALL');
        const compDatesLen = (data.fullDates && data.fullDates.length) || dates.length || 0;
        const zoomStartComp = (isMaxComp && compDatesLen > 750) ? Math.max(0, Math.round(((compDatesLen - 750) / compDatesLen) * 100)) : 0;

        const option = {
            backgroundColor: 'transparent',
            animation: false,
            legend: {
                top: 6,
                left: 'center',
                textStyle: { color: '#cbd5e1', fontSize: 11, fontWeight: '500' },
                itemGap: 12,
                itemWidth: 16,
                itemHeight: 8
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross',
                    crossStyle: { color: '#64748b', width: 1, type: 'dashed' },
                    label: { backgroundColor: '#1e222d', color: '#e2e8f0', borderColor: '#334155', borderWidth: 1 }
                },
                backgroundColor: 'rgba(21, 24, 33, 0.95)',
                borderColor: '#334155',
                borderWidth: 1,
                padding: [10, 14],
                textStyle: { color: '#f8fafc', fontSize: 12 },
                formatter: function(params) {
                    if (!params || params.length === 0) return '';
                    const idx = params[0].dataIndex;
                    const d = (data.fullDates && data.fullDates[idx]) || dates[idx] || '';
                    let html = `<div style="font-weight:700; color:#38bdf8; margin-bottom:8px; border-bottom:1px solid #334155; padding-bottom:4px;">📅 Phiên: ${d} • So sánh tương quan (% vs Base 100)</div>`;
                    const sorted = [...params].sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0));
                    html += `<table style="width:100%; border-collapse:collapse; font-size:11.5px;">`;
                    sorted.forEach((p, r) => {
                        const val = Number(p.value) || 100;
                        const change = Math.round((val - 100) * 100) / 100;
                        const sign = change >= 0 ? '+' : '';
                        const color = change >= 0 ? '#00e676' : '#ff5252';
                        const medal = r === 0 ? '🥇 ' : r === 1 ? '🥈 ' : r === 2 ? '🥉 ' : '&nbsp;&nbsp;&nbsp;';
                        html += `<tr>
                            <td style="padding:2px 8px 2px 0;">${medal}<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px;"></span><strong>${p.seriesName.split('(')[0].trim()}</strong></td>
                            <td style="padding:2px 0; text-align:right; font-family:monospace; font-weight:700; color:${color};">${sign}${change}%</td>
                            <td style="padding:2px 0 2px 8px; text-align:right; font-family:monospace; color:#94a3b8;">(${val})</td>
                        </tr>`;
                    });
                    html += `</table>`;
                    return html;
                }
            },
            grid: {
                left: 55,
                right: 30,
                top: 45,
                bottom: 48
            },
            xAxis: {
                type: 'category',
                data: dates,
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: { color: '#94a3b8', fontSize: 10.5 },
                axisTick: { show: false }
            },
            yAxis: {
                type: 'value',
                scale: true,
                axisLabel: {
                    color: '#94a3b8',
                    fontSize: 10.5,
                    formatter: function(val) {
                        const diff = Math.round(val - 100);
                        return (diff >= 0 ? '+' : '') + diff + '%';
                    }
                },
                splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)', type: 'dashed' } }
            },
            dataZoom: [
                {
                    type: 'inside',
                    xAxisIndex: 0,
                    start: zoomStartComp,
                    end: 100
                },
                {
                    type: 'slider',
                    xAxisIndex: 0,
                    bottom: 8,
                    height: 18,
                    borderColor: '#242832',
                    backgroundColor: '#151821',
                    fillerColor: 'rgba(56, 189, 248, 0.15)',
                    handleStyle: { color: '#38bdf8' },
                    textStyle: { color: '#94a3b8', fontSize: 9 },
                    start: zoomStartComp,
                    end: 100
                }
            ],
            series: series
        };

        window.DongTienTab.echartsInstance.setOption(option, true);
    };

    /**
     * Bật / tắt chế độ So Sánh Đa Ngành
     */
    window.DongTienTab.toggleComparisonMode = function() {
        if (window.DongTienTab.chartSector === 'ALL_COMPARE') {
            window.DongTienTab.setChartSector('8000');
        } else {
            window.DongTienTab.setChartSector('ALL_COMPARE');
        }
    };

    /**
     * Thay đổi ngành trong tab Biểu đồ xu hướng
     */
    window.DongTienTab.setChartSector = function(icbCode) {
        window.DongTienTab.chartSector = icbCode;
        const select = document.getElementById('dtChartSectorSelect');
        const title = document.getElementById('dtChartSectorTitle');
        const label = document.getElementById('dt_industry_label');

        if (select) {
            select.value = icbCode;
            if (title && select.selectedIndex >= 0) {
                const txt = select.options[select.selectedIndex].text.split('(')[0].trim();
                title.innerText = (icbCode === 'ALL_COMPARE') ? txt : `${txt.toUpperCase()} (${icbCode})`;
            }
        }

        if (icbCode === 'ALL_COMPARE') {
            if (label) label.innerText = '⚡ So Sánh Đa Ngành';
            if (title) title.innerText = 'SO SÁNH TƯƠNG QUAN CÁC NGÀNH ĐẦU TÀU (BASE 100)';
        } else {
            const node = window.DongTienTab.findNodeInTree(window.DongTienTab.industryTreeData || [], icbCode);
            if (node) {
                if (label) label.innerText = `Ngành: ${node.icbName}`;
                if (title) {
                    const cleanName = node.icbName.split('(')[0].trim().toUpperCase();
                    title.innerText = `${cleanName} (${icbCode})`;
                }
            } else if (label && !label.innerText.includes(icbCode)) {
                label.innerText = `Ngành: ${icbCode}`;
            }
        }

        const btnComp = document.getElementById('dtBtnToggleCompare');
        if (btnComp) {
            if (icbCode === 'ALL_COMPARE') {
                btnComp.style.background = '#0284c7';
                btnComp.style.borderColor = '#38bdf8';
                btnComp.style.color = '#ffffff';
                btnComp.innerHTML = '<span>✓ Đang So Sánh Đa Ngành</span>';
            } else {
                btnComp.style.background = '#1e222d';
                btnComp.style.borderColor = '#334155';
                btnComp.style.color = '#38bdf8';
                btnComp.innerHTML = '<span>📊 So Sánh Đa Ngành</span>';
            }
        }

        window.DongTienTab.loadTrendChartData(icbCode, window.DongTienTab.chartTimeframe, window.DongTienTab.chartResolution);
    };

    // =========================================================================
    // QUẢN LÝ CÂY PHÂN CẤP NGÀNH (TREEVIEW POPOVER FOR TREND CHART)
    // =========================================================================

    window.DongTienTab.industryTreeData = null;

    /**
     * Bật / Tắt popover cây phân cấp ngành
     */
    window.DongTienTab.toggleIndustryTreePopover = function(e) {
        if (e) e.stopPropagation();
        const popover = document.getElementById('dt_industry_popover');
        if (!popover) return;
        const isHidden = (popover.style.display === 'none' || !popover.style.display);
        if (isHidden) {
            popover.style.display = 'flex';
            if (!window.DongTienTab.industryTreeData) {
                window.DongTienTab.loadIndustryTree();
            }
            const searchInput = document.getElementById('dt_industry_search');
            if (searchInput) {
                setTimeout(() => searchInput.focus(), 60);
            }
        } else {
            popover.style.display = 'none';
        }
    };

    /**
     * Đóng popover cây ngành
     */
    window.DongTienTab.closeIndustryTreePopover = function() {
        const popover = document.getElementById('dt_industry_popover');
        if (popover) popover.style.display = 'none';
    };

    /**
     * Tìm node trong cây theo mã icbCode đệ quy
     */
    window.DongTienTab.findNodeInTree = function(nodes, icbCode) {
        if (!nodes || !nodes.length) return null;
        for (const n of nodes) {
            if (String(n.icbCode) === String(icbCode)) return n;
            if (n.childs && n.childs.length > 0) {
                const found = window.DongTienTab.findNodeInTree(n.childs, icbCode);
                if (found) return found;
            }
        }
        return null;
    };

    /**
     * Tải dữ liệu cây ngành Fialda ICB Tree
     */
    window.DongTienTab.loadIndustryTree = async function() {
        if (window.DongTienTab.industryTreeData && window.DongTienTab.industryTreeData.length > 0) {
            const container = document.getElementById('dt_industry_tree');
            if (container && !container.hasChildNodes()) {
                window.DongTienTab.renderIndustryTree(window.DongTienTab.industryTreeData, container);
            }
            return;
        }

        try {
            let treeData = null;
            const res = await fetch('/api/fialda-icbtree').then(r => r.json()).catch(() => null);
            if (res && res.result && res.result.length > 0) {
                treeData = res.result;
            } else {
                const res2 = await fetch('/fialda_icbtree.json').then(r => r.json());
                treeData = res2.result || [];
            }
            window.DongTienTab.industryTreeData = treeData;
            const container = document.getElementById('dt_industry_tree');
            if (container) {
                window.DongTienTab.renderIndustryTree(treeData, container);
            }
            // Đồng bộ tên ngành hiện tại lên nút
            const curIcb = window.DongTienTab.chartSector || '8000';
            if (curIcb === 'ALL_COMPARE') {
                const label = document.getElementById('dt_industry_label');
                if (label) label.innerText = '⚡ So Sánh Đa Ngành';
            } else {
                const node = window.DongTienTab.findNodeInTree(treeData, curIcb);
                const label = document.getElementById('dt_industry_label');
                if (label && node) {
                    label.innerText = `Ngành: ${node.icbName}`;
                }
            }
        } catch (err) {
            console.error("DongTienTab.loadIndustryTree error:", err);
        }
    };

    /**
     * Render toàn bộ cây ngành vào container DOM
     */
    window.DongTienTab.renderIndustryTree = function(nodes, container) {
        if (!container) return;
        container.innerHTML = '';
        const ul = document.createElement('ul');
        ul.className = 'rrg-tree-ul';
        ul.style.paddingLeft = '0';

        nodes.forEach(node => {
            ul.appendChild(window.DongTienTab.createIndustryTreeNode(node));
        });

        container.appendChild(ul);
    };

    /**
     * Tạo một node li trong cây phân cấp
     */
    window.DongTienTab.createIndustryTreeNode = function(node) {
        const li = document.createElement('li');
        li.className = 'rrg-tree-li';
        li.dataset.name = ((node.icbName || '') + ' ' + (node.icbCode || '')).toLowerCase();
        li.dataset.code = node.icbCode || '';

        const nodeDiv = document.createElement('div');
        nodeDiv.className = 'rrg-tree-node';

        const hasChild = node.childs && node.childs.length > 0;

        if (hasChild) {
            const toggle = document.createElement('span');
            toggle.className = 'rrg-tree-toggle';
            toggle.innerText = '+';

            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const childUl = li.querySelector(':scope > .rrg-tree-ul');
                if (!childUl) return;
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
            window.DongTienTab.selectTreeSector(node.icbCode, node.icbName);
        });

        li.appendChild(nodeDiv);

        if (hasChild) {
            const childUl = document.createElement('ul');
            childUl.className = 'rrg-tree-ul';
            childUl.style.display = 'none';
            node.childs.forEach(child => {
                childUl.appendChild(window.DongTienTab.createIndustryTreeNode(child));
            });
            li.appendChild(childUl);
        }

        return li;
    };

    /**
     * Chọn ngành từ cây và cập nhật biểu đồ
     */
    window.DongTienTab.selectTreeSector = function(icbCode, icbName) {
        const popover = document.getElementById('dt_industry_popover');
        if (popover) popover.style.display = 'none';

        const label = document.getElementById('dt_industry_label');
        if (label) {
            label.innerText = (icbCode === 'ALL_COMPARE') ? '⚡ So Sánh Đa Ngành' : `Ngành: ${icbName}`;
        }

        const select = document.getElementById('dtChartSectorSelect');
        if (select) {
            let opt = select.querySelector(`option[value="${icbCode}"]`);
            if (!opt) {
                opt = document.createElement('option');
                opt.value = icbCode;
                opt.text = icbName;
                select.appendChild(opt);
            }
            select.value = icbCode;
        }

        window.DongTienTab.setChartSector(icbCode);
    };

    /**
     * Lọc tìm kiếm cây ngành theo từ khóa hoặc mã ICB
     */
    window.DongTienTab.filterIndustryTree = function(query) {
        const tree = document.getElementById('dt_industry_tree');
        if (!tree) return;
        const lis = tree.querySelectorAll('li');
        query = (query || '').toLowerCase().trim();

        if (!query) {
            lis.forEach(li => {
                li.style.display = 'block';
                const nameSpan = li.querySelector(':scope > .rrg-tree-node > .rrg-tree-name');
                if (nameSpan) nameSpan.innerHTML = nameSpan.textContent;
                const toggle = li.querySelector(':scope > .rrg-tree-node > .rrg-tree-toggle');
                if (toggle) {
                    toggle.innerText = '+';
                    const childUl = li.querySelector(':scope > .rrg-tree-ul');
                    if (childUl) childUl.style.display = 'none';
                }
            });
            return;
        }

        lis.forEach(li => {
            li.style.display = 'none';
            const nameSpan = li.querySelector(':scope > .rrg-tree-node > .rrg-tree-name');
            if (nameSpan) nameSpan.innerHTML = nameSpan.textContent;
        });

        lis.forEach(li => {
            const name = li.dataset.name || '';
            if (name.includes(query)) {
                li.style.display = 'block';
                const nameSpan = li.querySelector(':scope > .rrg-tree-node > .rrg-tree-name');
                if (nameSpan) {
                    const originalText = nameSpan.textContent;
                    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                    nameSpan.innerHTML = originalText.replace(regex, `<span class="rrg-tree-match">$1</span>`);
                }

                let parent = li.parentElement.closest('.rrg-tree-li');
                while (parent) {
                    parent.style.display = 'block';
                    const toggle = parent.querySelector(':scope > .rrg-tree-node > .rrg-tree-toggle');
                    if (toggle) toggle.innerText = '-';
                    const childUl = parent.querySelector(':scope > .rrg-tree-ul');
                    if (childUl) childUl.style.display = 'block';
                    parent = parent.parentElement.closest('.rrg-tree-li');
                }
            }
        });
    };

    /**
     * Xóa từ khóa tìm kiếm trên cây ngành
     */
    window.DongTienTab.clearIndustryTreeSearch = function() {
        const input = document.getElementById('dt_industry_search');
        if (input) input.value = '';
        window.DongTienTab.filterIndustryTree('');
    };

    /**
     * Thay đổi khung thời gian trong tab Biểu đồ xu hướng
     */
    window.DongTienTab.setChartTimeframe = function(tf, btn) {
        window.DongTienTab.chartTimeframe = tf;
        document.querySelectorAll('.dt-tf-btn').forEach(b => {
            b.classList.remove('active');
            b.style.background = 'transparent';
            b.style.color = (b.innerText.includes('MAX')) ? '#c084fc' : '#94a3b8';
        });
        if (btn) {
            btn.classList.add('active');
            btn.style.background = '#2563eb';
            btn.style.color = '#ffffff';
        }
        window.DongTienTab.loadTrendChartData(window.DongTienTab.chartSector, tf, window.DongTienTab.chartResolution);
    };

    /**
     * Thay đổi độ phân giải nến trong tab Biểu đồ xu hướng
     */
    window.DongTienTab.setChartResolution = function(res, btn) {
        window.DongTienTab.chartResolution = res;
        document.querySelectorAll('.dt-res-btn').forEach(b => {
            b.classList.remove('active');
            b.style.background = 'transparent';
            b.style.color = '#94a3b8';
        });
        if (btn) {
            btn.classList.add('active');
            btn.style.background = '#334155';
            btn.style.color = '#ffffff';
        }
        window.DongTienTab.loadTrendChartData(window.DongTienTab.chartSector, window.DongTienTab.chartTimeframe, res);
    };

    /**
     * Bắt đầu vòng lặp polling cập nhật dữ liệu tự động (mỗi 15 giây)
     */
    window.DongTienTab.startPolling = function() {
        if (window.DongTienTab.pollTimer) {
            clearInterval(window.DongTienTab.pollTimer);
            window.DongTienTab.pollTimer = null;
        }
        window.DongTienTab.isPolling = true;
        window.DongTienTab.updateStatusBadge();

        window.DongTienTab.pollTimer = setInterval(() => {
            const cont = document.getElementById('appContent_dongtien');
            // Chỉ fetch khi tab Dòng tiền đang được hiển thị và trình duyệt không bị ẩn
            if (!cont || cont.style.display === 'none' || document.hidden) {
                return;
            }
            window.DongTienTab.loadData(window.DongTienTab.currentFloor, true);
        }, 15000);
    };

    /**
     * Dừng vòng lặp polling khi chuyển sang tab khác
     */
    window.DongTienTab.stopPolling = function() {
        if (window.DongTienTab.pollTimer) {
            clearInterval(window.DongTienTab.pollTimer);
            window.DongTienTab.pollTimer = null;
        }
        window.DongTienTab.isPolling = false;
    };

    /**
     * Nạp dữ liệu ngành từ API /api/market/sector-dynamics
     * @param {string} floor Bộ lọc sàn ('ALL', 'HOSE,HSX', 'HNX', 'UPCOM')
     * @param {boolean} isSilent Nạp ngầm không làm gián đoạn hiển thị bảng
     */
    window.DongTienTab.loadData = async function(floor = 'ALL', isSilent = false) {
        const tbody = document.getElementById('dt_sectors_tbody');
        const reloadIcon = document.getElementById('dtReloadIcon');
        
        if (window.DongTienTab.isLoading) return;
        window.DongTienTab.isLoading = true;

        if (reloadIcon) reloadIcon.classList.add('dt-spinning');

        // Nếu bảng trống hoặc không phải chế độ ngầm, hiển thị spinner nếu chưa có dữ liệu
        if (!isSilent && (!window.DongTienTab.rawSectorData || window.DongTienTab.rawSectorData.length === 0)) {
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 50px 20px; color: #787b86;">
                            <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                                <div style="width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #38bdf8; border-radius: 50%; animation: dt-spin 0.8s linear infinite;"></div>
                                <span>Đang nạp dữ liệu dòng tiền nhóm ngành...</span>
                            </div>
                        </td>
                    </tr>
                `;
            }
        }

        try {
            const res = await fetch(`/api/market/sector-dynamics?floor=${encodeURIComponent(floor)}`);
            if (!res.ok) throw new Error("HTTP error " + res.status);
            const data = await res.json();

            if (Array.isArray(data) && data.length > 0) {
                window.DongTienTab.rawSectorData = data;
                window.DongTienTab.lastUpdated = new Date();
                window.DongTienTab.updateSummaryBadges(data);
                window.DongTienTab.updateStatusBadge();
                window.DongTienTab.renderTable();
            } else {
                if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #94a3b8;">Không có dữ liệu ngành cho sàn này.</td></tr>';
            }
        } catch (err) {
            console.error("DongTienTab.loadData error:", err);
            if (!isSilent && tbody) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; color: #ff5252;">Lỗi tải dữ liệu: ${err.message}</td></tr>`;
            }
        } finally {
            window.DongTienTab.isLoading = false;
            if (reloadIcon) reloadIcon.classList.remove('dt-spinning');
        }
    };

    /**
     * Cập nhật số liệu tóm tắt trên Header
     */
    window.DongTienTab.updateSummaryBadges = function(data) {
        let totalVal = 0;
        let adv = 0, dec = 0, unc = 0;

        data.forEach(s => {
            totalVal += (s.totalValue || 0);
            const chg = typeof s.change1d === 'number' ? s.change1d : 0;
            if (chg > 0) adv++;
            else if (chg < 0) dec++;
            else unc++;
        });

        const valEl = document.getElementById('dtTotalValNum');
        if (valEl) valEl.innerText = Number(totalVal).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' tỷ';

        const advEl = document.getElementById('dtSecAdvCount');
        if (advEl) advEl.innerText = adv;
        const decEl = document.getElementById('dtSecDecCount');
        if (decEl) decEl.innerText = dec;
        const uncEl = document.getElementById('dtSecUncCount');
        if (uncEl) uncEl.innerText = unc;
    };

    /**
     * Chuyển đổi bộ lọc sàn (Tách riêng HOSE và HNX)
     */
    window.DongTienTab.switchFloor = function(floor) {
        window.DongTienTab.currentFloor = floor;
        
        const btnMap = {
            'ALL': 'dtFloorBtn_ALL',
            'HOSE,HSX': 'dtFloorBtn_HOSE',
            'HNX': 'dtFloorBtn_HNX',
            'UPCOM': 'dtFloorBtn_UPCOM'
        };

        Object.keys(btnMap).forEach(k => {
            const btn = document.getElementById(btnMap[k]);
            if (btn) {
                if (k === floor) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
        });

        // Hiển thị trạng thái đang tải nhẹ trong bảng
        const tbody = document.getElementById('dt_sectors_tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px 20px; color: #787b86;">
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                            <div style="width: 22px; height: 22px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #38bdf8; border-radius: 50%; animation: dt-spin 0.8s linear infinite;"></div>
                            <span>Đang nạp dữ liệu sàn ${floor}...</span>
                        </div>
                    </td>
                </tr>
            `;
        }

        window.DongTienTab.loadData(floor, false);
    };

    /**
     * Bật/Tắt mở rộng nhóm ngành con
     */
    window.DongTienTab.toggleExpand = function(icbCode, e) {
        if (e) e.stopPropagation();
        window.DongTienTab.expandedSectors[icbCode] = !window.DongTienTab.expandedSectors[icbCode];
        window.DongTienTab.renderTable();
    };

    /**
     * Mở rộng hoặc thu gọn toàn bộ ngành con
     */
    window.DongTienTab.toggleExpandAll = function() {
        window.DongTienTab.allExpanded = !window.DongTienTab.allExpanded;
        const btnLabel = document.getElementById('dtExpandAllLabel');

        function setExpandRecursive(nodes, state) {
            nodes.forEach(n => {
                if (n.hasChildren && n.children && n.children.length > 0) {
                    window.DongTienTab.expandedSectors[n.icbCode] = state;
                    setExpandRecursive(n.children, state);
                }
            });
        }

        setExpandRecursive(window.DongTienTab.rawSectorData, window.DongTienTab.allExpanded);
        if (btnLabel) {
            btnLabel.innerText = window.DongTienTab.allExpanded ? 'Thu gọn tất cả' : 'Mở rộng tất cả';
        }
        window.DongTienTab.renderTable();
    };

    /**
     * Hiển thị Popover Tooltip khi di chuột qua thanh phân bổ dòng tiền
     */
    window.DongTienTab.showPopover = function(e, totalVal, gPct, yPct, rPct, cG, cY, cR) {
        const pop = document.getElementById('dt_sector_popover');
        if (!pop) return;

        document.getElementById('dt_pop_val').innerText = `Tổng GTGD: ${Number(totalVal).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} tỷ`;
        document.getElementById('dt_pop_green').innerText = `${Number(gPct).toFixed(1)}% (${cG} mã)`;
        document.getElementById('dt_pop_yellow').innerText = `${Number(yPct).toFixed(1)}% (${cY} mã)`;
        document.getElementById('dt_pop_red').innerText = `${Number(rPct).toFixed(1)}% (${cR} mã)`;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top;

        pop.style.left = `${x}px`;

        if (y < 160) {
            pop.style.top = `${rect.bottom + 8}px`;
            pop.style.transform = 'translate(-50%, 0)';
        } else {
            pop.style.top = `${y - 8}px`;
            pop.style.transform = 'translate(-50%, -100%)';
        }

        pop.style.display = 'block';
        pop.style.opacity = '1';
    };

    /**
     * Ẩn Popover Tooltip
     */
    window.DongTienTab.hidePopover = function() {
        const pop = document.getElementById('dt_sector_popover');
        if (pop) pop.style.display = 'none';
    };

    /**
     * Render bảng số liệu các nhóm ngành
     */
    window.DongTienTab.renderTable = function() {
        const tbody = document.getElementById('dt_sectors_tbody');
        if (!tbody || !window.DongTienTab.rawSectorData.length) return;

        function getAllSectorValues(nodes) {
            let vals = [];
            nodes.forEach(n => {
                vals.push(n.totalValue || 0);
                if (n.children && n.children.length > 0) {
                    vals.push(...getAllSectorValues(n.children));
                }
            });
            return vals;
        }

        const allVals = getAllSectorValues(window.DongTienTab.rawSectorData);
        const maxVal = Math.max(...allVals, 1);

        const { currentSortCol, currentSortDir } = window.DongTienTab;

        function sortNodes(nodes) {
            let sorted = [...nodes];
            sorted.sort((a, b) => {
                if (currentSortCol === 'name') {
                    const valA = a.shortName || a.name || '';
                    const valB = b.shortName || b.name || '';
                    return currentSortDir === 'asc' ? valA.localeCompare(valB, 'vi') : valB.localeCompare(valA, 'vi');
                }
                let valA = a[currentSortCol];
                let valB = b[currentSortCol];
                if (valA == null) valA = currentSortDir === 'asc' ? 999999 : -999999;
                if (valB == null) valB = currentSortDir === 'asc' ? 999999 : -999999;
                return currentSortDir === 'asc' ? (valA - valB) : (valB - valA);
            });
            return sorted;
        }

        function nodeMatchesSearch(node, q) {
            if (!q) return true;
            if (node.name.toLowerCase().includes(q) || String(node.icbCode).includes(q)) return true;
            if (node.children && node.children.length > 0) {
                return node.children.some(ch => nodeMatchesSearch(ch, q));
            }
            return false;
        }

        function collectVisibleRows(nodes, depth = 0) {
            let rows = [];
            const sorted = sortNodes(nodes);
            const q = window.DongTienTab.searchQuery.toLowerCase().trim();

            sorted.forEach(sec => {
                if (nodeMatchesSearch(sec, q)) {
                    rows.push({ sec, depth });
                    // Nếu đang tìm kiếm hoặc được mở rộng -> hiện các con
                    const shouldExpand = q ? true : !!window.DongTienTab.expandedSectors[sec.icbCode];
                    if (shouldExpand && sec.children && sec.children.length > 0) {
                        rows.push(...collectVisibleRows(sec.children, depth + 1));
                    }
                }
            });
            return rows;
        }

        const visibleList = collectVisibleRows(window.DongTienTab.rawSectorData);
        if (visibleList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #94a3b8;">Không tìm thấy ngành nào phù hợp với từ khóa.</td></tr>';
            return;
        }

        let html = '';
        visibleList.forEach(({ sec, depth }) => {
            const change = typeof sec.change1d === 'number' ? sec.change1d : 0;
            const col = change > 0 ? '#00e676' : (change < 0 ? '#ff5252' : '#ffeb3b');
            const sign = change > 0 ? '+' : '';
            const peStr = (sec.pe != null && !isNaN(sec.pe)) ? Number(sec.pe).toFixed(2) : '--';
            const totalValFormatted = Number(sec.totalValue || 0).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            const cGreen = (sec.flow && sec.flow.cGreen) || 0;
            const cYellow = (sec.flow && sec.flow.cYellow) || 0;
            const cRed = (sec.flow && sec.flow.cRed) || 0;
            const totalCount = cGreen + cYellow + cRed;

            const gPct = (sec.flow && sec.flow.greenPct) || 0;
            const yPct = (sec.flow && sec.flow.yellowPct) || 0;
            const rPct = (sec.flow && sec.flow.redPct) || 0;

            let visualGPct = 0, visualYPct = 0, visualRPct = 0;
            if (totalCount > 0) {
                visualGPct = (cGreen / totalCount) * 100;
                visualYPct = (cYellow / totalCount) * 100;
                visualRPct = (cRed / totalCount) * 100;
            }

            const barWidthPct = Math.max(25, Math.min(100, ((sec.totalValue || 0) / maxVal) * 100));
            const isExpanded = !!window.DongTienTab.expandedSectors[sec.icbCode] || !!window.DongTienTab.searchQuery;
            const hasChild = sec.hasChildren && sec.children && sec.children.length > 0;

            const padLeft = 14 + depth * 18;
            const rowBg = depth === 0 ? 'transparent' : (depth === 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)');
            const fontW = depth === 0 ? '700' : (depth === 1 ? '600' : '500');
            const textColor = depth === 0 ? '#f1f5f9' : (depth === 1 ? '#cbd5e1' : '#94a3b8');

            html += `
                <tr class="dt-sector-row" style="border-bottom: 1px solid #242832; background: ${rowBg}; cursor: pointer; transition: background 0.15s;"
                    onclick="if (typeof window.openSectorDetailModal === 'function') window.openSectorDetailModal('${sec.icbCode}')">
                    <td style="padding: 10px 12px; text-align: center; color: #64748b; font-family: monospace; font-size: 11.5px; font-weight: 600;">
                        ${sec.icbCode}
                    </td>
                    <td style="padding: 10px 12px; padding-left: ${padLeft}px; font-weight: ${fontW}; color: ${textColor}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 260px;" title="${sec.name}">
                        <div style="display: inline-flex; align-items: center; gap: 6px;">
                            ${hasChild ? `
                                <span onclick="window.DongTienTab.toggleExpand('${sec.icbCode}', event)" style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 4px; background: rgba(37,99,235,0.2); color: #60a5fa; font-size: 9px; font-weight: bold; flex-shrink: 0; transition: all 0.15s; cursor: pointer;" title="Bấm để mở rộng / thu gọn ngành con">
                                    ${isExpanded ? '▼' : '▶'}
                                </span>
                            ` : `<span style="display: inline-block; width: 16px; flex-shrink: 0; text-align: center; color: #475569; font-size: 10px;">•</span>`}
                            <span style="overflow: hidden; text-overflow: ellipsis;">${sec.name}</span>
                        </div>
                    </td>
                    <td style="padding: 10px 8px; text-align: center; font-weight: 600; color: #cbd5e1; font-family: monospace; font-size: 12px;">
                        ${peStr}
                    </td>
                    <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: ${col}; font-family: monospace; font-size: 12.5px;">
                        ${sign}${change.toFixed(2)}%
                    </td>
                    <td style="padding: 10px 14px; text-align: center;">
                        <div style="display: flex; justify-content: flex-start; align-items: center; width: 100%;">
                            <div class="dt-flow-bar" 
                                 style="width: ${barWidthPct}%; height: 12px; border-radius: 4px; overflow: hidden; display: flex; background: #242832; box-shadow: inset 0 1px 2px rgba(0,0,0,0.5); cursor: pointer; transition: transform 0.15s;"
                                 onmouseenter="window.DongTienTab.showPopover(event, ${sec.totalValue || 0}, ${gPct}, ${yPct}, ${rPct}, ${cGreen}, ${cYellow}, ${cRed})"
                                 onmouseleave="window.DongTienTab.hidePopover()">
                                 ${visualGPct > 0 ? `<div style="width: ${visualGPct}%; background: #00c073; height: 100%;"></div>` : ''}
                                 ${visualYPct > 0 ? `<div style="width: ${visualYPct}%; background: #eab308; height: 100%;"></div>` : ''}
                                 ${visualRPct > 0 ? `<div style="width: ${visualRPct}%; background: #ef4444; height: 100%;"></div>` : ''}
                            </div>
                        </div>
                    </td>
                    <td style="padding: 10px 14px; text-align: right; font-weight: 700; color: #38bdf8; font-family: monospace; font-size: 12.5px;">
                        ${totalValFormatted}
                    </td>
                    <td style="padding: 10px 12px; text-align: center;">
                        <button onclick="if (typeof window.openSectorDetailModal === 'function') { event.stopPropagation(); window.openSectorDetailModal('${sec.icbCode}'); }" 
                                style="padding: 3px 8px; font-size: 11px; font-weight: 600; border-radius: 4px; border: 1px solid rgba(56,189,248,0.3); background: rgba(56,189,248,0.1); color: #38bdf8; cursor: pointer; transition: all 0.15s;"
                                title="Mở biểu đồ chi tiết ngành">
                            👁️
                        </button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    };

    /**
     * Lọc ngành theo từ khóa tìm kiếm
     */
    window.DongTienTab.filterSectors = function(query) {
        window.DongTienTab.searchQuery = query || '';
        const clearBtn = document.getElementById('dtClearSearchBtn');
        if (clearBtn) {
            clearBtn.style.display = query ? 'block' : 'none';
        }
        window.DongTienTab.renderTable();
    };

    /**
     * Xóa tìm kiếm
     */
    window.DongTienTab.clearSearch = function() {
        const input = document.getElementById('dtSectorSearchInput');
        if (input) input.value = '';
        window.DongTienTab.filterSectors('');
    };

    /**
     * Sắp xếp bảng theo cột
     */
    window.DongTienTab.sort = function(col) {
        if (window.DongTienTab.currentSortCol === col) {
            window.DongTienTab.currentSortDir = window.DongTienTab.currentSortDir === 'asc' ? 'desc' : 'asc';
        } else {
            window.DongTienTab.currentSortCol = col;
            window.DongTienTab.currentSortDir = col === 'name' ? 'asc' : 'desc';
        }

        const cols = ['name', 'pe', 'change1d', 'totalValue'];
        const baseLabels = {
            'name': 'NGÀNH / PHÂN CẤP',
            'pe': 'P/E',
            'change1d': '% THAY ĐỔI 1D',
            'totalValue': 'PHÂN BỔ DÒNG TIỀN'
        };

        cols.forEach(c => {
            const el = document.getElementById('dtSort_' + c);
            if (el) {
                if (window.DongTienTab.currentSortCol === c) {
                    el.style.borderBottom = '2px solid #8b5cf6';
                    el.style.paddingBottom = '2px';
                    el.style.color = '#fff';
                    el.innerText = baseLabels[c] + (window.DongTienTab.currentSortDir === 'asc' ? ' ↑' : ' ↓');
                } else {
                    el.style.borderBottom = 'none';
                    el.style.paddingBottom = '0px';
                    el.style.color = '#94a3b8';
                    el.innerText = baseLabels[c];
                }
            }
        });

        window.DongTienTab.renderTable();
    };

    /**
     * Làm mới dữ liệu chủ động
     */
    window.DongTienTab.reload = function() {
        window.DongTienTab.loadData(window.DongTienTab.currentFloor, false);
    };

})();
