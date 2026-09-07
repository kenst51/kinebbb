# Kế Hoạch Triển Khai: Thống Kê RRG (API Native & Bổ Sung Bộ Lọc)

Mục tiêu: Dựng bảng Thống kê RRG y hệt giao diện Fialda sử dụng API trực tiếp. Đặc biệt, xây dựng thanh công cụ (Toolbar) có khả năng lọc đa dạng: Theo Sàn, theo Ngành (cây thư mục đa cấp độ chuẩn xác) và Tìm kiếm mã cục bộ.

## 1. Giao Diện (Frontend - HTML/CSS)

### 1.1 Thanh Công Cụ Bộ Lọc (Filter Toolbar)
Tạo thanh menu ngang phía trên bảng thống kê, bao gồm 3 cụm tính năng y hệt Fialda:
- **Cụm Lọc Sàn (Buttons):** Bao gồm nhãn "LỌC THEO:" và các nút `TẤT CẢ SÀN` (Active mặc định, màu nền tím), `HSX`, `HNX`, `UPCOM`. Chỉ cho phép chọn 1 trong 4 tại một thời điểm.
- **Cụm Tìm Kiếm Mã (Search Box):** Ô input `Nhập mã cần tìm kiếm...` có icon kính lúp nằm bên phải ngoài cùng.

### 1.2 Chi tiết Cây Thư Mục Lọc Ngành (Dropdown Tree)
Nút `NGÀNH` khi click vào sẽ mở ra một Popover Menu hiển thị hệ thống phân ngành ICB cực kỳ chi tiết:
- **Ô Tìm kiếm Ngành (Search Box nội bộ):** Nằm ngay trên cùng của menu sổ xuống, cho phép gõ ký tự để lọc nhanh tên ngành (Ví dụ gõ "Dầu khí").
- **Cấu trúc phân cấp sâu (4 Cấp độ):** Dữ liệu được nạp từ `fialda_icbtree.json`, bao phủ toàn bộ cấu trúc từ Cấp 1, Cấp 2, Cấp 3 đến Cấp 4 (Ví dụ: Dầu Khí Cấp 1 -> Cấp 2 -> Sản xuất Dầu khí Cấp 3 -> Sản xuất & Khai thác Cấp 4).
- **Trực quan hóa dạng cây (Tree Guidelines):** 
  - Sử dụng CSS (`border-left`, `::before`, `::after`) để vẽ các **đường gạch đứt (dotted lines)** kết nối từ thư mục cha xuống thư mục con, giúp dễ dàng nhận biết phân cấp.
  - **Icon thư mục:** Các nhánh có chứa con sẽ dùng icon hình vuông `[+]` (đóng) và `[-]` (mở).
  - **Icon lá (Leaf node):** Các nhánh cấp cuối cùng (không có con, thường là Cấp 4) sẽ dùng icon hình tờ giấy/văn bản `[📄]`.

### 1.3 Bảng Thống Kê RRG
- Bảng chia thành 4 Accordion tương ứng 4 góc phần tư RRG (Xanh lá, Xanh dương, Cam, Đỏ).
- Cột: Mã CP, Tên Doanh Nghiệp, Tương Quan, Ratio, Momentum.

## 2. Logic Xử Lý (Frontend JS & Backend Python)

### 2.1 Logic Gọi Dữ Liệu (API Call)
Tạo (hoặc nâng cấp) endpoint `GET /api/rrg-stats` (hoặc `POST`) để nhận thông tin bộ lọc.
- **Khi chọn Sàn:** Backend tự nạp toàn bộ mã của Sàn, truyền vào API Fialda.
- **Khi chọn Ngành (Bấm vào Tên Ngành trong Cây):** Lấy mã ICB của ngành đó (Ví dụ: `0533`), tự động thu gọn menu dropdown và gửi yêu cầu xuống Backend. Backend sẽ tìm toàn bộ mã thuộc nhánh ngành `0533` để lấy data RRG thống kê.

### 2.2 Logic Phân Nhóm 4 Rổ RRG (Tại Backend)
Sau khi nhận cục dữ liệu 90 ngày:
- Lấy thông số (Ratio, Momentum) của T và T-1.
- Gắn thẻ mã: 
  - 🟩 Dẫn dắt: Ratio >= 100, Mom >= 100
  - 🟦 Cải thiện: Ratio < 100, Mom >= 100
  - 🟥 Tụt hậu: Ratio < 100, Mom < 100
  - 🟧 Suy yếu: Ratio >= 100, Mom < 100
- Trả về JSON được nhóm sẵn 4 mảng.

### 2.3 Logic Tìm Kiếm 
- **Tìm Mã Cổ Phiếu:** Bắt sự kiện nhập text, client-side lọc ẩn/hiện các hàng `<tr>` trong bảng Thống kê.
- **Tìm Tên Ngành:** Khớp chuỗi ký tự nhập vào với tên ngành trong cây dropdown, tự động mở rộng (expand) các nhánh chứa ngành khớp từ khóa.

## 3. Cấu Trúc HTML Cốt Lõi (Tránh Lỗi Hiển Thị)
> [!IMPORTANT]
> - Vùng chứa nội dung RRG (`#nganh_view_rrg`) **bắt buộc phải được đặt đúng bên trong thẻ `<div id="appContent_nganh">`**.
> - Không được để lệch sang vùng nội dung khác như tab Dữ Liệu (`appContent_dulieu`) hoặc lồng sai vào nhóm con khác (như `content_thongke`).
> - Khi gọi hàm `switchNganhTab('rrg')`, đảm bảo toàn bộ vùng RRG được hiển thị (display: flex) và không bị cha của nó che giấu. Điều này để tránh tình trạng "Màn hình đen thui trống trơn" dù tab đã sáng xanh.
