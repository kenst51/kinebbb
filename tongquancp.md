# Kế hoạch Triển khai Tab "Tổng quan Cổ phiếu"

Dựa trên hình ảnh bạn cung cấp, giao diện "Tổng quan Cổ phiếu" của Fialda bao gồm một bảng dữ liệu chi tiết cho toàn bộ mã chứng khoán trên thị trường, kèm theo các bộ lọc sàn và ngành. 

Dưới đây là kế hoạch chi tiết để xây dựng tính năng này vào dự án `projectkline` của bạn **(chưa triển khai code)**:

## 1. Phân tích Giao diện (UI/UX)
Giao diện sẽ được chia làm 2 phần chính:

### A. Thanh công cụ (Top Bar)
- **Thiết kế gộp chung (Unified Top Bar):** Sẽ gộp chung hàng chứa các Tab chức năng và bộ lọc lên **cùng một thanh công cụ duy nhất** (tương tự như ảnh Fialda bạn vừa gửi). 
- Sử dụng Flexbox (`justify-content: space-between`) để chia làm 2 cụm:
  - **Cụm bên TRÁI (Tabs):** Các tab điều hướng (như *Tổng quan, Thống kê giao dịch, Cơ bản, Kỹ thuật*). Tab "Tổng quan" sẽ được active.
  - **Cụm bên PHẢI (Filters):** Sẽ tái sử dụng nguyên bản cấu trúc bộ lọc của "Thống kê RRG" sang, bao gồm: Nhóm nút lọc theo sàn (Tất cả, HSX, HNX, UPCOM), Dropdown chọn ngành (ICB) và Ô input tìm kiếm mã.
- Layout này giúp tiết kiệm không gian và mang lại cảm giác chuyên nghiệp, gọn gàng 100% giống bản gốc.

### B. Bảng dữ liệu chính (Data Table)
Bảng có thanh cuộn dọc (scrollable) với tiêu đề cố định (sticky header), bao gồm các cột:
1. `#` (Số thứ tự)
2. `MÃ` (Mã cổ phiếu)
3. `SÀN` (Sàn giao dịch)
4. `TÊN DOANH NGHIỆP`
5. `Đồ thị Mini` (Sparkline - biểu đồ đường nhỏ thể hiện biến động giá gần đây)
6. `GIÁ` (Định dạng: *Giá hiện tại | +/- Giá | +/- %*)
7. `KHỐI LƯỢNG` (Tổng khối lượng khớp)
8. `GIÁ TRỊ (TRIỆU)` (Tổng giá trị giao dịch)
9. `RS (52W)` (Sức mạnh giá tương đối trong 52 tuần)
10. `% MUA CHỦ ĐỘNG`
11. `% BÁN CHỦ ĐỘNG`

---

## 2. Chiến lược lấy Dữ liệu (Data Sources)

Hệ thống đã có sẵn nhiều nguồn dữ liệu, ta sẽ tận dụng tối đa để không phải gọi thêm API bên ngoài không cần thiết:

*   **Thông tin cơ bản (Mã, Sàn, Tên DN):** Đã có sẵn file `symbols.json` và `floor_map.json` chứa thông tin danh sách mã, tên công ty và sàn tương ứng trong hệ thống. Chỉ cần load 1 lần khi khởi tạo.
*   **Dữ liệu Real-time (Giá, Khối lượng, Thay đổi):** Tận dụng endpoint có sẵn `/api/liveboard` (hàm `get_live_board()` trong `main.py`) đang lấy dữ liệu snapshot từ VPS. API này cung cấp đầy đủ `lastPrice` và `lot` (khối lượng).
*   **Chỉ số RS (52W) & Các tỷ số tài chính:** Dựa trên source code hiện tại, hệ thống đã có sẵn logic gọi dữ liệu từ `https://khoanguyeninvest.vn/dashboard_data.js` (lưu vào biến `window.SUMMARY`). Ta sẽ tận dụng biến `window.SUMMARY` này để lấy chính xác điểm `rs` cho từng mã, đảm bảo đồng nhất hoàn toàn với số liệu đang có.
*   **Đồ thị Mini (Sparkline):** Dùng endpoint `/api/history` (hàm `get_vndirect_history()` trong `main.py`) để lấy dữ liệu nến lịch sử rồi vẽ bằng thẻ `<canvas>` nhỏ.
*   **% Mua chủ động & % Bán chủ động:** 
    *   *Yêu cầu bắt buộc:* Hiển thị chính xác tỷ lệ %.
    *   *Công thức tính:* `% Mua chủ động = (Khối lượng mua chủ động / Tổng khối lượng khớp lệnh) * 100%`.
    *   *Nguồn dữ liệu:* Gọi API Intraday (sử dụng hàm `get_intraday` hoặc tương đương) để lấy tổng khối lượng mua chủ động hiện tại của mỗi mã và đưa vào công thức trên. (Sẽ tích hợp vào Virtual Scroll để không gọi 1600 API cùng lúc).

---

## 3. Kiến trúc Mã nguồn (Proposed Changes)

Dự kiến sẽ cần tạo/sửa các file sau:

### [MODIFY] `static/index.html`
- Thêm HTML layout cho bộ lọc (Sàn, Ngành, Search).
- Tạo cấu trúc `<table>` trong thẻ `div#nganh_view_tongquan` với các tiêu đề cột.

### [NEW] `static/tongquan_cophieu.js`
Tạo một file JS mới hoàn toàn để không can thiệp vào code cũ. File này sẽ chứa:
- Hàm `fetchStockList()`: Lấy danh sách toàn bộ mã từ local files.
- Hàm `fetchMarketData()`: Lấy dữ liệu giá real-time từ `/api/liveboard`.
- **Hàm `renderTable()` với Virtual Scrolling:** Quản lý việc hiển thị dữ liệu ra DOM, áp dụng Virtual Scrolling ("Kéo xuống tới đâu hiện tới đó").
- Hàm `drawSparkline(canvas, symbol)`: Hàm vẽ biểu đồ mini bằng HTML5 Canvas. Sẽ chỉ kích hoạt khi DOM element của dòng đó lọt vào khung nhìn màn hình.
- Logic xử lý Filter (Sàn, Ngành) và Search.
- Logic Sort (Sắp xếp theo Giá, RS, Khối lượng khi click vào tiêu đề cột).

### [NEW] `static/tongquan.css` (Tùy chọn)
- Chứa các class CSS riêng biệt cho bảng Tổng quan để giống hệt giao diện Fialda (màu sắc, spacing, hover effects, CSS cho scrollbar).

---

## 4. Giải pháp Hiệu năng (Performance) Đã Chốt

*   **Virtual Scrolling / Lazy Loading ("Kéo xuống tới đâu hiện tới đó"):** 
    Bảng dữ liệu có 1600+ mã chứng khoán cùng với biểu đồ mini (Sparkline). Để tránh gây giật lag hoặc treo trình duyệt, hệ thống sẽ **chỉ render DOM và tính toán vẽ biểu đồ Canvas / Gọi API Mua bán chủ động cho những mã (khoảng 20-30 dòng) đang thực sự nằm trong tầm nhìn của màn hình**. Khi người dùng cuộn (scroll), các dòng cũ sẽ được tái sử dụng để nạp dữ liệu mới một cách mượt mà nhất.

---
*Bản kế hoạch đã hoàn chỉnh mọi yêu cầu và thống nhất phương án xử lý (Virtual Scroll, dữ liệu % Mua/Bán chủ động, dữ liệu RS). KHÔNG YÊU CẦU TRIỂN KHAI CODE.*
