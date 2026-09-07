// ==============================================================================
// SECTOR ANALYSIS REPORTS FRONTEND MODULE (BÁO CÁO NGÀNH ĐỘC LẬP)
// ==============================================================================
// File độc lập hoàn toàn, không xung đột với analysis_reports.js
// Thiết kế: Chuẩn giao diện Dark Theme KlineChart, Phản hồi tức thì < 0.1s
// ==============================================================================

(function() {
    window.currentSectorReportsData = null;
    window.currentSectorFilterCategory = 'all';
    window.sectorReportSearchQuery = '';
    window.sectorReportCurrentPage = 1;
    const ITEMS_PER_PAGE = 8;

    // 1. Tự động tạo Modal DOM nếu chưa tồn tại
    function ensureSectorReportModalDOM() {
        if (document.getElementById('sectorReportModal')) return;

        const modalHtml = `
        <div id="sectorReportModal" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(5px); z-index: 2147483647; align-items: center; justify-content: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <div id="sectorReportContainer" style="background: #1e222d; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 12px; width: 92%; max-width: 1100px; height: 86vh; display: flex; flex-direction: column; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8); overflow: hidden; animation: secModalFadeIn 0.2s ease-out;">
                
                <!-- HEADER -->
                <div style="padding: 16px 22px; background: #181b24; border-bottom: 1px solid rgba(255, 255, 255, 0.08); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 38px; height: 38px; border-radius: 8px; background: linear-gradient(135deg, #7c4dff, #304ffe); display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 12px rgba(124, 77, 255, 0.35);">
                            📑
                        </div>
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <h3 id="secReportModalTitle" style="margin: 0; font-size: 17px; font-weight: 800; color: #ffffff; letter-spacing: 0.3px;">BÁO CÁO NGÀNH - BẤT ĐỘNG SẢN</h3>
                                <span id="secReportLevelBadge" style="padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; background: rgba(124, 77, 255, 0.2); color: #b388ff; border: 1px solid rgba(124, 77, 255, 0.4);">Cấp 2</span>
                            </div>
                            <div style="font-size: 12px; color: #8b949e; margin-top: 3px;">Tổng quan Chiến lược Ngành, Vĩ mô & Báo cáo Top Cổ phiếu Trụ dẫn dắt</div>
                        </div>
                    </div>

                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span id="secReportLatencyBadge" style="font-size: 11.5px; font-weight: 700; color: #00e676; background: rgba(0, 230, 118, 0.1); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(0, 230, 118, 0.25);">⚡ Phản hồi: 5ms</span>
                        <button onclick="window.closeSectorReportModal()" style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); color: #8b949e; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; transition: all 0.15s;" onmouseover="this.style.background='rgba(255,82,82,0.2)'; this.style.color='#ff5252';" onmouseout="this.style.background='rgba(255,255,255,0.06)'; this.style.color='#8b949e';">✕</button>
                    </div>
                </div>

                <!-- CONSENSUS STRIP (THANH ĐỒNG THUẬN NGÀNH) -->
                <div id="secReportConsensusBox" style="padding: 12px 22px; background: rgba(24, 27, 36, 0.7); border-bottom: 1px solid rgba(255, 255, 255, 0.06); flex-shrink: 0;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 12px; font-weight: 700; color: #8b949e; text-transform: uppercase;">Đồng thuận CTCK:</span>
                            <span id="secReportConsensusRating" style="padding: 3px 10px; border-radius: 5px; font-size: 12.5px; font-weight: 800; color: #00e676; background: rgba(0, 230, 118, 0.12); border: 1px solid rgba(0, 230, 118, 0.3);">🟢 TÍCH CỰC / KHẢ QUAN</span>
                            <span id="secReportTotalCountBadge" style="font-size: 12px; color: #8b949e;">(Tổng số 11 báo cáo)</span>
                        </div>
                        <div id="secReportConsensusLegend" style="font-size: 11.5px; color: #c9d1d9; display: flex; gap: 14px;">
                            <span><strong style="color: #00e676;">Mua:</strong> <span id="secLegBuy">8 (72.7%)</span></span>
                            <span><strong style="color: #ffab00;">Theo dõi:</strong> <span id="secLegHold">2 (18.2%)</span></span>
                            <span><strong style="color: #ff5252;">Thận trọng:</strong> <span id="secLegSell">1 (9.1%)</span></span>
                        </div>
                    </div>
                    <!-- Tri-color Progress Bar -->
                    <div style="width: 100%; height: 6px; background: rgba(255, 255, 255, 0.08); border-radius: 4px; overflow: hidden; display: flex;">
                        <div id="secBarBuy" style="width: 72.7%; height: 100%; background: #00e676; transition: width 0.3s ease;"></div>
                        <div id="secBarHold" style="width: 18.2%; height: 100%; background: #ffab00; transition: width 0.3s ease;"></div>
                        <div id="secBarSell" style="width: 9.1%; height: 100%; background: #ff5252; transition: width 0.3s ease;"></div>
                    </div>
                </div>

                <!-- CONTROLS: FILTER PILLS + SEARCH -->
                <div style="padding: 10px 22px; background: #1e222d; border-bottom: 1px solid rgba(255, 255, 255, 0.05); display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-shrink: 0; flex-wrap: wrap;">
                    <!-- Filter Pills -->
                    <div id="secReportFilterPills" style="display: flex; align-items: center; gap: 6px; overflow-x: auto; max-width: 70%; padding: 2px 0;">
                        <!-- Dynamic buttons will be inserted here -->
                    </div>

                    <!-- Search Input -->
                    <div style="position: relative; width: 260px;">
                        <input id="secReportSearchInput" type="text" placeholder="Tìm tiêu đề, CTCK, mã..." oninput="window.searchSectorReports(this.value)" style="width: 100%; box-sizing: border-box; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; padding: 7px 10px 7px 30px; color: #ffffff; font-size: 12.5px; outline: none; transition: border-color 0.2s;" onfocus="this.style.borderColor='#7c4dff';" onblur="this.style.borderColor='rgba(255,255,255,0.1)';">
                        <span style="position: absolute; left: 10px; top: 7px; color: #6e7681; font-size: 13px;">🔍</span>
                    </div>
                </div>

                <!-- TABLE AREA (SCROLLABLE) -->
                <div style="flex: 1; overflow-y: auto; position: relative;">
                    <div id="secReportLoading" style="display: none; position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: #7c4dff; font-weight: 700; font-size: 14px;">
                        <div style="margin-bottom: 8px; font-size: 26px;">⏳</div>
                        Đang tải danh mục báo cáo ngành...
                    </div>

                    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                        <thead style="position: sticky; top: 0; background: #181b24; z-index: 10; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
                            <tr style="color: #8b949e; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.5px;">
                                <th style="padding: 10px 14px; width: 95px; white-space: nowrap;">Ngày</th>
                                <th style="padding: 10px 10px; width: 85px; text-align: center;">Đối tượng</th>
                                <th style="padding: 10px 14px;">Tiêu đề Báo cáo & Luận điểm cốt lõi</th>
                                <th style="padding: 10px 14px; width: 130px;">Nguồn CTCK</th>
                                <th style="padding: 10px 10px; width: 110px; text-align: center;">Đánh giá</th>
                                <th style="padding: 10px 12px; width: 95px; text-align: right;">Giá MT</th>
                                <th style="padding: 10px 14px; width: 60px; text-align: center;">PDF</th>
                            </tr>
                        </thead>
                        <tbody id="secReportTableBody">
                            <!-- Rows will be injected dynamically -->
                        </tbody>
                    </table>
                </div>

                <!-- FOOTER / PAGINATION -->
                <div style="padding: 10px 22px; background: #181b24; border-top: 1px solid rgba(255, 255, 255, 0.06); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;">
                    <div id="secReportInfoFooter" style="font-size: 12px; color: #6e7681;">
                        Hiển thị 8 báo cáo mỗi trang
                    </div>
                    <div id="secReportPagination" style="display: flex; align-items: center; gap: 6px;">
                        <!-- Pagination buttons -->
                    </div>
                </div>

            </div>
        </div>
        <style>
            @keyframes secModalFadeIn {
                from { opacity: 0; transform: scale(0.97); }
                to { opacity: 1; transform: scale(1); }
            }
        </style>
        `;

        const div = document.createElement('div');
        div.innerHTML = modalHtml;
        document.body.appendChild(div.firstElementChild);

        // Đóng modal khi click ra ngoài backdrop hoặc ấn phím ESC
        const modalEl = document.getElementById('sectorReportModal');
        modalEl.addEventListener('click', function(e) {
            if (e.target === modalEl) window.closeSectorReportModal();
        });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modalEl.style.display === 'flex') {
                window.closeSectorReportModal();
            }
        });
    }

    // 2. Mở Modal Báo Cáo Ngành
    window.openSectorReportModal = function(sectorCode) {
        ensureSectorReportModalDOM();

        // Tự động suy luận mã ngành nếu không truyền vào
        let code = sectorCode;
        if (!code) {
            try {
                const el1 = document.getElementById('sisSymbol');
                const el2 = document.getElementById('currentSymbolDisplay');
                code = (el1 ? el1.innerText.trim() : '') || (el2 ? el2.innerText.trim() : '') || (window.currentActiveSymbol || '8600');
            } catch(e) {
                code = '8600';
            }
        }
        code = String(code || '8600').replace(':ICB', '').replace('ICB_', '').trim().toUpperCase();

        const modal = document.getElementById('sectorReportModal');
        if (!modal) return;

        modal.style.display = 'flex';
        window.currentSectorFilterCategory = 'all';
        window.sectorReportSearchQuery = '';
        window.sectorReportCurrentPage = 1;

        const searchInput = document.getElementById('secReportSearchInput');
        if (searchInput) searchInput.value = '';

        window.fetchSectorReportsData(code);
    };

    // 3. Đóng Modal
    window.closeSectorReportModal = function() {
        const modal = document.getElementById('sectorReportModal');
        if (modal) modal.style.display = 'none';
    };

    // 4. Lấy dữ liệu API
    window.fetchSectorReportsData = function(sectorCode) {
        const loading = document.getElementById('secReportLoading');
        const tbody = document.getElementById('secReportTableBody');
        if (loading) loading.style.display = 'block';
        if (tbody) tbody.innerHTML = '';

        const t0 = performance.now();
        fetch(`/api/sector_reports?sector_code=${encodeURIComponent(sectorCode)}&_t=${Date.now()}`)
            .then(res => res.json())
            .then(data => {
                const elapsed = Math.round(performance.now() - t0);
                if (loading) loading.style.display = 'none';
                window.currentSectorReportsData = data;

                // Update latency badge
                const latBadge = document.getElementById('secReportLatencyBadge');
                if (latBadge) {
                    latBadge.innerText = `⚡ Phản hồi: ${elapsed}ms (< 100ms: ✅)`;
                }

                // Render components
                updateHeaderInfo(data);
                updateConsensusBox(data);
                renderFilterPills(data);
                window.renderSectorReportTable();
            })
            .catch(err => {
                console.error('[SectorReports] Fetch error:', err);
                if (loading) loading.style.display = 'none';
                if (tbody) {
                    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #ff5252; padding: 40px; font-weight: 700;">Lỗi kết nối máy chủ khi tải báo cáo ngành: ${err.message}</td></tr>`;
                }
            });
    };

    // 5. Cập nhật Tiêu đề Header
    function updateHeaderInfo(data) {
        const titleEl = document.getElementById('secReportModalTitle');
        const levelEl = document.getElementById('secReportLevelBadge');
        if (titleEl) {
            titleEl.innerText = `BÁO CÁO NGÀNH - [${data.sector_code}] ${(data.sector_name || '').toUpperCase()}`;
        }
        if (levelEl) {
            levelEl.innerText = `Cấp ${data.level || 2}`;
        }
    }

    // 6. Cập nhật Box Đồng thuận (Consensus)
    function updateConsensusBox(data) {
        const cons = data.consensus || {};
        const ratingEl = document.getElementById('secReportConsensusRating');
        const totalEl = document.getElementById('secReportTotalCountBadge');

        if (ratingEl) {
            ratingEl.innerText = cons.rating || 'TÍCH CỰC';
            ratingEl.style.color = cons.color || '#00e676';
            ratingEl.style.background = `${cons.color || '#00e676'}18`;
            ratingEl.style.borderColor = `${cons.color || '#00e676'}40`;
        }
        if (totalEl) {
            totalEl.innerText = `(Tổng số ${cons.total_reports || data.total || 0} báo cáo)`;
        }

        const legBuy = document.getElementById('secLegBuy');
        const legHold = document.getElementById('secLegHold');
        const legSell = document.getElementById('secLegSell');
        if (legBuy) legBuy.innerText = `${cons.buy_count || 0} (${cons.buy_pct || 0}%)`;
        if (legHold) legHold.innerText = `${cons.hold_count || 0} (${cons.hold_pct || 0}%)`;
        if (legSell) legSell.innerText = `${cons.sell_count || 0} (${cons.sell_pct || 0}%)`;

        const barBuy = document.getElementById('secBarBuy');
        const barHold = document.getElementById('secBarHold');
        const barSell = document.getElementById('secBarSell');
        if (barBuy) barBuy.style.width = `${cons.buy_pct || 70}%`;
        if (barHold) barHold.style.width = `${cons.hold_pct || 20}%`;
        if (barSell) barSell.style.width = `${cons.sell_pct || 10}%`;
    }

    // 7. Tạo Filter Pills
    function renderFilterPills(data) {
        const container = document.getElementById('secReportFilterPills');
        if (!container) return;

        const allReports = data.reports || [];
        const sectorCount = allReports.filter(r => r.category === 'sector').length;
        const leaders = data.leaders || [];

        let html = `
            <button onclick="window.filterSectorReportCategory('all')" id="btnPill_all" class="sec-pill ${window.currentSectorFilterCategory === 'all' ? 'active' : ''}">
                Tất cả (${allReports.length})
            </button>
            <button onclick="window.filterSectorReportCategory('sector')" id="btnPill_sector" class="sec-pill ${window.currentSectorFilterCategory === 'sector' ? 'active' : ''}">
                📑 Toàn ngành (${sectorCount})
            </button>
        `;

        leaders.forEach(sym => {
            const symCount = allReports.filter(r => (r.ticker || '').toUpperCase() === sym.toUpperCase()).length;
            if (symCount > 0) {
                const isActive = window.currentSectorFilterCategory === sym;
                html += `
                    <button onclick="window.filterSectorReportCategory('${sym}')" id="btnPill_${sym}" class="sec-pill ${isActive ? 'active' : ''}">
                        🏢 ${sym} (${symCount})
                    </button>
                `;
            }
        });

        container.innerHTML = html;
        applyPillStyles();
    }

    function applyPillStyles() {
        const pills = document.querySelectorAll('.sec-pill');
        pills.forEach(p => {
            const isActive = p.classList.contains('active');
            p.style.padding = '4px 10px';
            p.style.borderRadius = '6px';
            p.style.fontSize = '11.5px';
            p.style.fontWeight = '700';
            p.style.cursor = 'pointer';
            p.style.whiteSpace = 'nowrap';
            p.style.transition = 'all 0.15s ease';
            if (isActive) {
                p.style.background = 'linear-gradient(135deg, #7c4dff, #304ffe)';
                p.style.color = '#ffffff';
                p.style.border = '1px solid #7c4dff';
                p.style.boxShadow = '0 2px 8px rgba(124, 77, 255, 0.4)';
            } else {
                p.style.background = 'rgba(255, 255, 255, 0.05)';
                p.style.color = '#9da2b4';
                p.style.border = '1px solid rgba(255, 255, 255, 0.08)';
                p.style.boxShadow = 'none';
            }
        });
    }

    // 8. Lọc & Tìm kiếm
    window.filterSectorReportCategory = function(cat) {
        window.currentSectorFilterCategory = cat;
        window.sectorReportCurrentPage = 1;
        const pills = document.querySelectorAll('.sec-pill');
        pills.forEach(p => {
            if (p.id === 'btnPill_' + cat) {
                p.classList.add('active');
            } else {
                p.classList.remove('active');
            }
        });
        applyPillStyles();
        window.renderSectorReportTable();
    };

    window.searchSectorReports = function(query) {
        window.sectorReportSearchQuery = (query || '').trim().toLowerCase();
        window.sectorReportCurrentPage = 1;
        window.renderSectorReportTable();
    };

    // 9. Render Bảng Dữ Liệu
    window.renderSectorReportTable = function() {
        const tbody = document.getElementById('secReportTableBody');
        const pagination = document.getElementById('secReportPagination');
        const infoFooter = document.getElementById('secReportInfoFooter');
        if (!tbody || !window.currentSectorReportsData) return;

        tbody.innerHTML = '';
        let list = window.currentSectorReportsData.reports || [];

        // Lọc category
        const cat = window.currentSectorFilterCategory;
        if (cat === 'sector') {
            list = list.filter(r => r.category === 'sector');
        } else if (cat === 'leader') {
            list = list.filter(r => r.category === 'leader');
        } else if (cat !== 'all') {
            list = list.filter(r => (r.ticker || '').toUpperCase() === cat.toUpperCase());
        }

        // Lọc tìm kiếm từ khóa
        if (window.sectorReportSearchQuery) {
            const q = window.sectorReportSearchQuery;
            list = list.filter(r => {
                const t = (r.title || '').toLowerCase();
                const s = (r.source || '').toLowerCase();
                const sym = (r.ticker || '').toLowerCase();
                const sm = (r.summary || '').toLowerCase();
                return t.includes(q) || s.includes(q) || sym.includes(q) || sm.includes(q);
            });
        }

        if (list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #8b949e; padding: 45px; font-size: 13.5px;">Không tìm thấy báo cáo ngành nào phù hợp với bộ lọc hiện tại.</td></tr>`;
            if (pagination) pagination.innerHTML = '';
            if (infoFooter) infoFooter.innerText = '0 báo cáo';
            return;
        }

        // Phân trang
        const totalPages = Math.ceil(list.length / ITEMS_PER_PAGE);
        if (window.sectorReportCurrentPage > totalPages) window.sectorReportCurrentPage = 1;
        const startIdx = (window.sectorReportCurrentPage - 1) * ITEMS_PER_PAGE;
        const pageData = list.slice(startIdx, startIdx + ITEMS_PER_PAGE);

        if (infoFooter) {
            infoFooter.innerText = `Hiển thị ${startIdx + 1} - ${Math.min(startIdx + ITEMS_PER_PAGE, list.length)} trên tổng số ${list.length} báo cáo`;
        }

        // Tạo từng hàng dữ liệu
        pageData.forEach(item => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
            tr.style.transition = 'background 0.15s ease';
            tr.onmouseenter = () => tr.style.background = 'rgba(255, 255, 255, 0.035)';
            tr.onmouseleave = () => tr.style.background = 'transparent';

            // Badge đối tượng (Ngành vs Mã Cổ phiếu)
            let objBadge = '';
            if (item.category === 'sector') {
                objBadge = `<span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 11px; font-weight: 800; color: #b388ff; background: rgba(124, 77, 255, 0.18); border: 1px solid rgba(124, 77, 255, 0.4);">NGÀNH</span>`;
            } else {
                objBadge = `<span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 11px; font-weight: 800; color: #40c4ff; background: rgba(41, 121, 255, 0.18); border: 1px solid rgba(41, 121, 255, 0.4);">${item.badge || item.ticker}</span>`;
            }

            // Badge Đánh giá
            const rText = item.recommendation || 'THEO DÕI';
            let rColor = '#c9d1d9';
            if (rText.includes('MUA') || rText.includes('KHẢ QUAN') || rText.includes('TÍCH CỰC') || rText.includes('TĂNG') || rText.includes('BUY')) {
                rColor = '#00e676';
            } else if (rText.includes('BÁN') || rText.includes('KÉM') || rText.includes('GIẢM') || rText.includes('SELL') || rText.includes('THẬN TRỌNG')) {
                rColor = '#ff5252';
            } else if (rText.includes('TRUNG LẬP') || rText.includes('NẮM GIỮ') || rText.includes('THEO DÕI')) {
                rColor = '#ffab00';
            }
            const recBadge = `<span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11.5px; font-weight: 800; color: ${rColor}; background: ${rColor}15; border: 1px solid ${rColor}35;">${rText}</span>`;

            // Giá MT
            const tpStr = item.targetPrice || '---';
            const tpDisplay = tpStr !== '---' ? `<span style="color: #40c4ff; font-weight: 800; font-family: monospace; font-size: 13px;">${tpStr}</span>` : '<span style="color: #6e7681;">---</span>';

            // Nút PDF
            const pdfUrl = item.pdf_url || item.url || '';
            let viewBtn = '<span style="color: #6e7681;">---</span>';
            if (pdfUrl) {
                const token = btoa(pdfUrl).split('').reverse().join('');
                const safeTitle = (item.title || 'Báo cáo ngành').replace(/"/g, '&quot;');
                viewBtn = `
                    <button data-title="${safeTitle}" 
                            onclick="window.open('/pdf_viewer.html?v=19&token=' + encodeURIComponent('${token}') + '&title=' + encodeURIComponent(this.dataset.title), '_blank')"
                            style="background: rgba(124, 77, 255, 0.12); color: #b388ff; border: 1px solid rgba(124, 77, 255, 0.35); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 6px; transition: all 0.2s;"
                            onmouseenter="this.style.background='rgba(124,77,255,0.3)'; this.style.color='#fff';"
                            onmouseleave="this.style.background='rgba(124,77,255,0.12)'; this.style.color='#b388ff';"
                            title="Xem PDF toàn văn">
                        📄
                    </button>
                `;
            }

            tr.innerHTML = `
                <td style="padding: 12px 14px; font-weight: 700; color: #8b949e; font-family: monospace; white-space: nowrap;">${item.date || '---'}</td>
                <td style="padding: 12px 10px; text-align: center; white-space: nowrap;">${objBadge}</td>
                <td style="padding: 12px 14px;">
                    <div style="font-weight: 700; font-size: 13.5px; color: #ffffff; line-height: 1.4; margin-bottom: 3px;">${item.title || '---'}</div>
                    <div style="font-size: 11.5px; color: #8b949e; line-height: 1.35;">${item.summary || ''}</div>
                </td>
                <td style="padding: 12px 14px; font-weight: 700; color: #d1d4dc; white-space: nowrap;">
                    <span style="background: rgba(255, 255, 255, 0.06); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.08);">${item.source || 'CTCK'}</span>
                </td>
                <td style="padding: 12px 10px; text-align: center; white-space: nowrap;">${recBadge}</td>
                <td style="padding: 12px 12px; text-align: right; white-space: nowrap;">${tpDisplay}</td>
                <td style="padding: 12px 14px; text-align: center; white-space: nowrap;">${viewBtn}</td>
            `;
            tbody.appendChild(tr);
        });

        // Render Pagination
        renderPaginationControls(totalPages);
    };

    function renderPaginationControls(totalPages) {
        const container = document.getElementById('secReportPagination');
        if (!container) return;
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '';
        if (window.sectorReportCurrentPage > 1) {
            html += `<button onclick="window.changeSectorReportPage(${window.sectorReportCurrentPage - 1})" style="padding: 4px 10px; background: rgba(255,255,255,0.06); color: #c9d1d9; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 700;">‹ Trước</button>`;
        }

        for (let i = 1; i <= totalPages; i++) {
            const isActive = i === window.sectorReportCurrentPage;
            const bg = isActive ? 'linear-gradient(135deg, #7c4dff, #304ffe)' : 'rgba(255,255,255,0.06)';
            const col = isActive ? '#fff' : '#9da2b4';
            const bdr = isActive ? '#7c4dff' : 'rgba(255,255,255,0.1)';
            html += `<button onclick="window.changeSectorReportPage(${i})" style="padding: 4px 10px; background: ${bg}; color: ${col}; border: 1px solid ${bdr}; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 700; min-width: 32px;">${i}</button>`;
        }

        if (window.sectorReportCurrentPage < totalPages) {
            html += `<button onclick="window.changeSectorReportPage(${window.sectorReportCurrentPage + 1})" style="padding: 4px 10px; background: rgba(255,255,255,0.06); color: #c9d1d9; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 700;">Sau ›</button>`;
        }

        container.innerHTML = html;
    }

    window.changeSectorReportPage = function(page) {
        window.sectorReportCurrentPage = page;
        window.renderSectorReportTable();
    };

    // 10. Tự động đồng bộ Nút Bento ở Right Sidebar ("Báo cáo ngành" vs "Báo cáo PT")
    window.updateBentoReportButton = function(symbol) {
        try {
            const btn = document.getElementById('btnAnalysisReport');
            if (!btn) return;

            let sym = symbol;
            if (!sym) {
                const el1 = document.getElementById('sisSymbol');
                const el2 = document.getElementById('currentSymbolDisplay');
                sym = (el1 ? el1.innerText.trim() : '') || (el2 ? el2.innerText.trim() : '') || (window.currentActiveSymbol || '');
            }
            sym = String(sym || '').trim().toUpperCase();
            const cleanCode = sym.replace(':ICB', '').replace('ICB_', '').trim();
            const isSector = (/^\d{4}$/.test(cleanCode)) || sym.includes(':ICB') || sym.startsWith('ICB_') || (window.globalAllSymbolsCache && window.globalAllSymbolsCache.some(s => (s.symbol === sym || s.symbol === cleanCode) && s.type === 'sector'));

            if (isSector) {
                btn.innerHTML = `<span>📑</span> Báo cáo ngành`;
                btn.style.display = 'flex';
                btn.style.alignItems = 'center';
                btn.style.justifyContent = 'center';
                btn.style.gap = '5px';
                btn.style.padding = '7px 6px';
                btn.style.borderRadius = '6px';
                btn.style.fontSize = '11px';
                btn.style.fontWeight = '700';
                btn.style.background = 'rgba(124, 77, 255, 0.14)';
                btn.style.color = '#b388ff';
                btn.style.border = '1px solid rgba(124, 77, 255, 0.35)';
                btn.style.cursor = 'pointer';
                btn.style.boxShadow = '0 2px 8px rgba(124, 77, 255, 0.2)';
                btn.onmouseover = function() {
                    this.style.background = 'rgba(124, 77, 255, 0.25)';
                    this.style.borderColor = '#7c4dff';
                };
                btn.onmouseout = function() {
                    this.style.background = 'rgba(124, 77, 255, 0.14)';
                    this.style.borderColor = 'rgba(124, 77, 255, 0.35)';
                };
                btn.onclick = function(e) {
                    if (e) e.preventDefault();
                    window.openSectorReportModal(cleanCode);
                };
                btn.title = 'Xem Báo Cáo Chiến Lược Ngành & Top Cổ Phiếu Trụ Dẫn Dắt';
            } else {
                btn.innerHTML = `<span>📄</span> Báo cáo PT`;
                btn.style.display = 'flex';
                btn.style.alignItems = 'center';
                btn.style.justifyContent = 'center';
                btn.style.gap = '5px';
                btn.style.padding = '7px 6px';
                btn.style.borderRadius = '6px';
                btn.style.fontSize = '11px';
                btn.style.fontWeight = '700';
                btn.style.background = 'rgba(255, 152, 0, 0.1)';
                btn.style.color = '#ffb74d';
                btn.style.border = '1px solid rgba(255, 152, 0, 0.25)';
                btn.style.cursor = 'pointer';
                btn.style.boxShadow = 'none';
                btn.onmouseover = function() {
                    this.style.background = 'rgba(255, 152, 0, 0.2)';
                    this.style.borderColor = '#ffa726';
                };
                btn.onmouseout = function() {
                    this.style.background = 'rgba(255, 152, 0, 0.1)';
                    this.style.borderColor = 'rgba(255, 152, 0, 0.25)';
                };
                btn.onclick = function(e) {
                    if (e) e.preventDefault();
                    if (typeof openAnalysisReportModal === 'function') {
                        openAnalysisReportModal();
                    }
                };
                btn.title = 'Xem Báo Cáo Phân Tích Doanh Nghiệp';
            }
        } catch(e) {
            console.error('[SectorReports] updateBentoReportButton error:', e);
        }
    };

    // Theo dõi tự động khi đổi mã trên Right Sidebar
    function initRightSidebarObserver() {
        const targetNode = document.getElementById('sisSymbol');
        if (targetNode) {
            const observer = new MutationObserver(() => {
                window.updateBentoReportButton();
            });
            observer.observe(targetNode, { characterData: true, childList: true, subtree: true });
        }
        window.updateBentoReportButton();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRightSidebarObserver);
    } else {
        setTimeout(initRightSidebarObserver, 300);
    }

    console.log('[SectorReports] Module initialized successfully.');
})();
