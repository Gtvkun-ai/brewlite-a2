# Test D – Quản Lý Tồn Kho Theo Định Mức Nguyên Liệu (BOM) & Nút Thắt Bottleneck

- Ngày kiểm tra ban đầu: 11/11/2026 (Chỉ xác nhận lý thuyết)
- Ngày hiện thực & nghiệm thu toàn diện: 16/11/2026
- Nguồn yêu cầu: `docs/evidence/lecturer-audit-report.md` (Mục 7 & 10: TEST D)
- Trạng thái hiện tại: **✅ 100% PASS** (Mã nguồn Backend, Bộ Test tự động Jest và Giao diện Quản trị Admin Web).

---

## 1. Dữ liệu đầu vào chuẩn theo Giảng viên

| Nguyên liệu | Tồn kho thực tế | Định mức / 1 ly | Khả năng tối đa | Ghi chú |
|---|---:|---:|---:|:---|
| **Cà phê hạt Robusta** | 500 g | 10 g | 50 ly | Đủ cho 50 ly |
| **Sữa tươi thanh trùng** | 1.000 ml | 50 ml | **20 ly** | **Điểm nghẽn (Bottleneck)** |
| **Đường tinh luyện** | 200 g | 5 g | 40 ly | Đủ cho 40 ly |

---

## 2. Mô hình toán học & Thuật toán Điểm nghẽn (Bottleneck Engine)

Số ly tối đa phục vụ được xác định bởi nguyên liệu chạm đáy đầu tiên:

$$Q = \min_{i=1}^{n} \left( \left\lfloor \frac{\text{Kho}_i}{\text{Định mức}_i} \right\rfloor \right) = \min\left( \left\lfloor \frac{500}{10} \right\rfloor, \left\lfloor \frac{1000}{50} \right\rfloor, \left\lfloor \frac{200}{5} \right\rfloor \right) = \min(50, 20, 40) = \mathbf{20\text{ ly}}$$

Sữa tươi là nguyên liệu nút thắt. Sau khi phục vụ đúng 20 ly Cà phê sữa đá:
- **Cà phê đã dùng:** $20 \times 10\text{g} = 200\text{g} \implies$ Còn lại: **300 g**.
- **Sữa tươi đã dùng:** $20 \times 50\text{ml} = 1.000\text{ml} \implies$ Còn lại: **0 ml**.
- **Đường đã dùng:** $20 \times 5\text{g} = 100\text{g} \implies$ Còn lại: **100 g**.

**Quy tắc nghiệp vụ bảo vệ:** Khi sữa tươi về 0ml, hệ thống chặn ngay lập tức yêu cầu đặt ly thứ 21 với mã lỗi:
`400 Bad Request: OUT_OF_STOCK_INGREDIENT (Không đủ Sữa tươi thanh trùng để pha chế món này)`.

---

## 3. Bằng chứng hiện thực trong Mã Nguồn

Hệ thống đã được hiện thực hóa trọn vẹn ở cả 3 tầng:

1. **Backend Service & API (`apps/api`):**
   - [`apps/api/src/inventory/inventory.types.ts`](../../../apps/api/src/inventory/inventory.types.ts): Định nghĩa kiểu dữ liệu `Ingredient`, `ProductRecipe`, `BottleneckForecast`, `TestDSimulationResult`.
   - [`apps/api/src/inventory/inventory.service.ts`](../../../apps/api/src/inventory/inventory.service.ts): Hiện thực thuật toán Bottleneck $Q = \min(Kho_i / Định mức_i)$, hàm trừ kho nguyên tử đa nguyên liệu và kịch bản mô phỏng Test D.
   - [`apps/api/src/inventory/inventory.controller.ts`](../../../apps/api/src/inventory/inventory.controller.ts): Cung cấp các endpoint:
     - `GET /inventory/materials`: Danh sách nguyên liệu và tồn kho thực tế.
     - `GET /inventory/recipes`: Bảng ma trận định mức công thức pha chế.
     - `GET /inventory/bottleneck-forecast`: Kết quả phân tích điểm nghẽn theo thời gian thực.
     - `POST /inventory/test-d-simulation`: Kích hoạt chạy kịch bản 20 ly + chặn ly 21.
     - `POST /inventory/reset-demo`: Khôi phục kho mẫu chuẩn.

2. **Bộ Kiểm thử tự động Jest (`apps/api/src/inventory/inventory.service.spec.ts`):**
   - Đạt **9/9 test cases PASS 100%**:
     - Kiểm tra khởi tạo kho và công thức định mức.
     - Kiểm tra phép tính điểm nghẽn Bottleneck chính xác 20 ly.
     - Kiểm tra trừ kho đa nguyên liệu atomic.
     - Kiểm tra bán trọn vẹn 20 ly và ném ngoại lệ chặn ly thứ 21.
     - Kiểm tra khôi phục kho về mức ban đầu.

3. **Giao diện Quản trị Web Elegant (`apps/web/app/admin/inventory/page.tsx`):**
   - Thẻ theo dõi tồn kho nguyên liệu trực quan (g Cà phê, ml Sữa, g Đường) kèm thanh tiến trình và cảnh báo tồn kho thấp.
   - Bảng phân tích công thức Bottleneck toán học thời gian thực.
   - Bảng Ma trận Định mức Công thức (BOM Matrix) cho từng món theo kích cỡ Regular/Large.
   - Nút bấm **`▶️ Chạy Mô Phỏng TEST D`** cho phép Quản lý / Giảng viên bấm chạy trực tiếp trên trình duyệt, xem log dòng chảy trừ kho và hộp thoại bắt lỗi ly thứ 21.
   - Nút **`Khôi phục mẫu chuẩn`** để reset nhanh chỉ sau 1 click.

---

## 4. Kết luận nghiệm thu

- **Kết quả:** **100% PASS** trên toàn bộ hệ thống.
- **Tuân thủ quy trình:** Hệ thống đáp ứng trọn vẹn yêu cầu ưu tiên cao P2 của Giảng viên trong tài liệu hướng dẫn review mà không phá vỡ tính nhất quán của cơ sở dữ liệu cốt lõi.
