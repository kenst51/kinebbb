// ==============================================================================
// ANALYSIS REPORTS LOGIC (BÁO CÁO PHÂN TÍCH DOANH NGHIỆP & BÁO CÁO NGÀNH)
// ==============================================================================
window.currentAnalysisReports = {
    symbol: '',
    reports: [],
    company_reports: [],
    industry_reports: []
};
window.activeAnalysisTab = 'company'; // 'company' | 'industry'
window.analysisSearchQuery = '';
window.currentAnalysisReportPage = 1;
window.currentAnalysisSymbol = '';

// Helper: An toàn mã hóa base64 đảo ngược để tạo token PDF
function createPdfViewerToken(url) {
    if (!url) return '';
    try {
        let b64 = btoa(unescape(encodeURIComponent(url)));
        return b64.split('').reverse().join('');
    } catch (e) {
        let b64 = btoa(url);
        return b64.split('').reverse().join('');
    }
}

// Helper: Định dạng ngày hiển thị yyyy-mm-dd
function getFormattedDate(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

window.openAnalysisReportModal = function(customSymbol) {
    try {
        const modal = document.getElementById('analysisReportModal');
        if (!modal) {
            console.error('LỖI: Không tìm thấy analysisReportModal!');
            return;
        }
        
        let symbol = customSymbol || '';
        if (!symbol) {
            try {
                const el2 = document.getElementById('currentSymbolDisplay');
                const el1 = document.getElementById('sisSymbol');
                symbol = (window.currentActiveSymbol || '') || (el2 ? el2.innerText.trim() : '') || (el1 ? el1.innerText.trim() : '') || 'HPG';
            } catch(e) {}
        }
        
        symbol = (symbol || 'HPG').trim().toUpperCase();
        if (symbol === 'VNINDEX' || symbol === 'ĐANG TẢI...') {
            symbol = 'HPG';
        }

        const cleanCheck = symbol.replace(':ICB', '').replace('ICB_', '').trim();
        const isSecCheck = (/^\d{4}$/.test(cleanCheck)) || symbol.includes(':ICB') || symbol.startsWith('ICB_') || (window.globalAllSymbolsCache && window.globalAllSymbolsCache.some(s => (s.symbol === symbol || s.symbol === cleanCheck) && s.type === 'sector'));
        if (isSecCheck && typeof window.openSectorReportModal === 'function') {
            window.openSectorReportModal(cleanCheck);
            return;
        }
        
        window.currentAnalysisSymbol = symbol;
        const titleSpan = document.getElementById('analysisReportSymbolTitle');
        if (titleSpan) titleSpan.innerText = `- ${symbol}`;

        const searchInput = document.getElementById('analysisReportSearch');
        if (searchInput) searchInput.value = '';
        window.analysisSearchQuery = '';

        // Khởi tạo ngày mặc định cho bộ lọc nếu chưa có: 1 năm trước -> hôm nay
        const toDateInput = document.getElementById('analysisToDate');
        const fromDateInput = document.getElementById('analysisFromDate');
        const today = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        
        if (toDateInput && !toDateInput.value) toDateInput.value = getFormattedDate(today);
        if (fromDateInput && !fromDateInput.value) fromDateInput.value = getFormattedDate(oneYearAgo);

        // Giữ hoặc đặt tab mặc định là doanh nghiệp khi mở modal
        window.switchAnalysisSubTab(window.activeAnalysisTab || 'company', false);

        modal.style.display = 'flex';
        modal.style.zIndex = '2147483647';
        window.fetchAnalysisReports(symbol);
    } catch(err) {
        console.error("LỖI JS openAnalysisReportModal: " + err.message);
    }
};

window.switchAnalysisSubTab = function(tab, shouldRender = true) {
    window.activeAnalysisTab = tab || 'company';
    window.currentAnalysisReportPage = 1;

    const btnCompany = document.getElementById('tabBtnCompanyReports');
    const btnIndustry = document.getElementById('tabBtnIndustryReports');
    const dateFilterBox = document.getElementById('analysisDateFilterBox');

    if (btnCompany && btnIndustry) {
        if (window.activeAnalysisTab === 'company') {
            btnCompany.style.background = '#2979ff';
            btnCompany.style.color = '#ffffff';
            btnCompany.style.boxShadow = '0 2px 8px rgba(41, 121, 255, 0.4)';
            btnIndustry.style.background = 'transparent';
            btnIndustry.style.color = '#9da2b4';
            btnIndustry.style.boxShadow = 'none';
            if (dateFilterBox) dateFilterBox.style.display = 'none';
        } else {
            btnCompany.style.background = 'transparent';
            btnCompany.style.color = '#9da2b4';
            btnCompany.style.boxShadow = 'none';
            btnIndustry.style.background = '#2979ff';
            btnIndustry.style.color = '#ffffff';
            btnIndustry.style.boxShadow = '0 2px 8px rgba(41, 121, 255, 0.4)';
            if (dateFilterBox) dateFilterBox.style.display = 'flex';
        }
    }

    if (shouldRender) {
        window.renderAnalysisReports();
    }
};

window.filterAnalysisReportsWithDates = function() {
    const fromDateInput = document.getElementById('analysisFromDate');
    const toDateInput = document.getElementById('analysisToDate');
    const fromDate = fromDateInput ? fromDateInput.value : '';
    const toDate = toDateInput ? toDateInput.value : '';
    const symbol = window.currentAnalysisSymbol || 'VCB';
    window.fetchAnalysisReports(symbol, fromDate, toDate);
};

window.fetchAnalysisReports = function(symbol, fromDate, toDate) {
    window.currentAnalysisReportPage = 1;
    try {
        const loading = document.getElementById('analysisReportLoading');
        if (loading) loading.style.display = 'block';
        
        const tbody = document.getElementById('analysisReportBody');
        if (tbody) tbody.innerHTML = '';
        
        let sym = symbol || window.currentAnalysisSymbol || 'HPG';
        sym = sym.trim().toUpperCase();
        window.currentAnalysisSymbol = sym;

        let url = `/api/analysis_reports?symbol=${encodeURIComponent(sym)}`;
        if (fromDate) url += `&fromDate=${encodeURIComponent(fromDate)}`;
        if (toDate) url += `&toDate=${encodeURIComponent(toDate)}`;
        url += `&_t=${new Date().getTime()}`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (loading) loading.style.display = 'none';
                window.currentAnalysisReports = data;
                
                // Cập nhật số lượng lên các Sub-tabs
                const compCount = (data.company_reports || data.reports || []).length;
                const indCount = (data.industry_reports || []).length;
                
                const tabCountCompany = document.getElementById('tabCountCompany');
                if (tabCountCompany) tabCountCompany.innerText = compCount;
                
                const tabCountIndustry = document.getElementById('tabCountIndustry');
                if (tabCountIndustry) tabCountIndustry.innerText = indCount;

                const tabIndustryPulse = document.getElementById('tabIndustryPulse');
                if (tabIndustryPulse) {
                    tabIndustryPulse.style.display = indCount > 0 ? 'inline-block' : 'none';
                }
                
                window.renderAnalysisReports();
            })
            .catch(err => {
                console.error(err);
                if (loading) loading.style.display = 'none';
                if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#ff5252;padding:30px;">Lỗi khi tải dữ liệu báo cáo</td></tr>';
            });
    } catch(err) {
        console.error('LỖI FETCH: ' + err.message);
    }
};

window.filterAnalysisReportsSearch = function(query) {
    window.analysisSearchQuery = (query || '').trim().toLowerCase();
    window.currentAnalysisReportPage = 1;
    window.renderAnalysisReports();
};

window.renderAnalysisReports = function() {
    const tbody = document.getElementById('analysisReportBody');
    const paginationContainer = document.getElementById('analysisReportPagination');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    // Chọn danh sách theo tab đang kích hoạt
    let dataList = [];
    if (window.activeAnalysisTab === 'industry') {
        dataList = (window.currentAnalysisReports && window.currentAnalysisReports.industry_reports) || [];
    } else {
        dataList = (window.currentAnalysisReports && (window.currentAnalysisReports.company_reports || window.currentAnalysisReports.reports)) || [];
    }
    
    // Lọc theo từ khóa tìm kiếm (nếu có)
    if (window.analysisSearchQuery) {
        const q = window.analysisSearchQuery;
        dataList = dataList.filter(item => {
            const t = (item.title || '').toLowerCase();
            const s = (item.source || '').toLowerCase();
            const r = (item.recommendation || '').toLowerCase();
            return t.includes(q) || s.includes(q) || r.includes(q);
        });
    }
    
    const totalBadge = document.getElementById('analysisReportTotalBadge');
    if (totalBadge) totalBadge.innerText = `${dataList.length} báo cáo`;
    
    if (!dataList || dataList.length === 0) {
        const emptyMsg = window.activeAnalysisTab === 'industry' 
            ? 'Không tìm thấy báo cáo ngành nào trong khoảng thời gian này.' 
            : 'Không tìm thấy báo cáo phân tích doanh nghiệp nào phù hợp.';
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:#8b949e;font-size:14px;"><i class="fas fa-inbox" style="font-size:24px;margin-bottom:8px;display:block;opacity:0.6;"></i>${emptyMsg}</td></tr>`;
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    const ITEMS_PER_PAGE = 7;
    const totalPages = Math.ceil(dataList.length / ITEMS_PER_PAGE);
    if (!window.currentAnalysisReportPage) window.currentAnalysisReportPage = 1;
    if (window.currentAnalysisReportPage > totalPages) window.currentAnalysisReportPage = 1;
    
    const startIndex = (window.currentAnalysisReportPage - 1) * ITEMS_PER_PAGE;
    const pageData = dataList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    
    pageData.forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
        tr.style.transition = 'background 0.15s ease';
        tr.onmouseenter = () => tr.style.background = 'rgba(255, 255, 255, 0.04)';
        tr.onmouseleave = () => tr.style.background = 'transparent';
        
        let rText = item.recommendation || 'THEO DÕI';
        let tpText = item.targetPrice || '---';
        
        let rColor = '#c9d1d9';
        if (rText.includes('MUA') || rText.includes('KHẢ QUAN') || rText.includes('TÍCH LŨY') || rText.includes('TĂNG') || rText.includes('OUTPERFORM') || rText.includes('BUY')) {
            rColor = '#00e676';
        } else if (rText.includes('BÁN') || rText.includes('KÉM') || rText.includes('GIẢM') || rText.includes('UNDERPERFORM') || rText.includes('SELL')) {
            rColor = '#ff5252';
        } else if (rText.includes('TRUNG LẬP') || rText.includes('NẮM GIỮ')) {
            rColor = '#ffab00';
        }
        
        let recBadge = `<span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: 800; font-size: 11.5px; color: ${rColor}; background: ${rColor}15; border: 1px solid ${rColor}35;">${rText}</span>`;
        let tpDisplay = tpText !== '---' ? `<span style="color: #40c4ff; font-weight: 800; font-family: monospace; font-size: 13px;">${tpText}</span>` : '<span style="color: #6e7681;">---</span>';

        let safeTitle = (item.title || 'Báo cáo phân tích').replace(/"/g, '&quot;');
        let pdfUrl = item.pdf_url || item.url || '';
        let viewBtn = '<span style="color: #6e7681;">---</span>';
        
        if (pdfUrl) {
            let token = createPdfViewerToken(pdfUrl);
            viewBtn = `
                <button data-title="${safeTitle}" 
                        onclick="window.open('/pdf_viewer.html?v=19&token=' + encodeURIComponent('${token}') + '&title=' + encodeURIComponent(this.dataset.title), '_blank')" 
                        style="background: rgba(41, 121, 255, 0.12); color: #2979ff; border: 1px solid rgba(41, 121, 255, 0.3); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 6px; transition: all 0.2s;" 
                        onmouseenter="this.style.background='rgba(41, 121, 255, 0.3)'; this.style.color='#fff';" 
                        onmouseleave="this.style.background='rgba(41, 121, 255, 0.12)'; this.style.color='#2979ff';" 
                        title="Xem toàn văn PDF">
                    <i class="fas fa-eye"></i>
                </button>
            `;
        }

        tr.innerHTML = `
            <td style="padding: 12px 10px; font-weight: 700; color: #8b949e; white-space: nowrap; font-family: monospace;">${item.date || '---'}</td>
            <td style="padding: 12px 10px;">
                <div style="font-weight: 700; font-size: 13.5px; color: #ffffff; line-height: 1.4;">${item.title || '---'}</div>
            </td>
            <td style="padding: 12px 10px; font-weight: 700; color: #d1d4dc; white-space: nowrap;">
                <span style="background: rgba(255, 255, 255, 0.06); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.08);">${item.source || 'CTCK'}</span>
            </td>
            <td style="padding: 12px 10px; text-align: center; white-space: nowrap;">${recBadge}</td>
            <td style="padding: 12px 10px; text-align: right; white-space: nowrap;">${tpDisplay}</td>
            <td style="padding: 12px 10px; text-align: center; white-space: nowrap;">${viewBtn}</td>
        `;
        tbody.appendChild(tr);
    });

    if (paginationContainer) {
        let pageHtml = '';
        if (totalPages > 1) {
            if (window.currentAnalysisReportPage > 1) {
                pageHtml += `<button onclick="window.changeAnalysisReportPage(${window.currentAnalysisReportPage - 1})" style="padding: 4px 10px; background: rgba(255,255,255,0.06); color: #c9d1d9; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 12px;">‹ Trước</button>`;
            }
            
            let startP = Math.max(1, window.currentAnalysisReportPage - 2);
            let endP = Math.min(totalPages, startP + 4);
            if (endP - startP < 4) startP = Math.max(1, endP - 4);
            
            for (let i = startP; i <= endP; i++) {
                const isActive = (i === window.currentAnalysisReportPage);
                const bg = isActive ? 'linear-gradient(135deg, #2979ff, #1565c0)' : 'rgba(255,255,255,0.06)';
                const color = isActive ? '#ffffff' : '#9da2b4';
                const shadow = isActive ? 'box-shadow: 0 2px 6px rgba(41,121,255,0.4);' : '';
                pageHtml += `<button onclick="window.changeAnalysisReportPage(${i})" style="padding: 4px 10px; background: ${bg}; color: ${color}; border: 1px solid ${isActive ? 'rgba(41,121,255,0.5)' : 'rgba(255,255,255,0.1)'}; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 12px; min-width: 32px; ${shadow}">${i}</button>`;
            }
            
            if (window.currentAnalysisReportPage < totalPages) {
                pageHtml += `<button onclick="window.changeAnalysisReportPage(${window.currentAnalysisReportPage + 1})" style="padding: 4px 10px; background: rgba(255,255,255,0.06); color: #c9d1d9; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 12px;">Sau ›</button>`;
            }
            
            pageHtml += `<span style="color: #787b86; font-size: 12px; margin-left: 8px;">Trang ${window.currentAnalysisReportPage} / ${totalPages}</span>`;
        }
        paginationContainer.innerHTML = pageHtml;
    }
};

window.changeAnalysisReportPage = function(page) {
    window.currentAnalysisReportPage = page;
    window.renderAnalysisReports();
};
