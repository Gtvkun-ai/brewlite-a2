# BÁO CÁO NGHIỆM THU & ĐỐI CHIẾU PHẢN BIỆN GIẢNG VIÊN (ROLE F - @chigiabao)

Dự án: **BrewLite - Monorepo (Next.js + NestJS + Prisma)**  
Thành viên: **Nguyễn Chí Gia Bảo (@chigiabao)**  
Vai trò: **F — Frontend Checkout & Auth** (Phối hợp kiểm thử toàn diện Sprint 1 & Sprint 2)  
Ngày cập nhật: **15/11/2026**

---

## 1. Khung trả lời chuẩn 30–60 giây cho Nguyễn Chí Gia Bảo (@chigiabao)

> *"Em chào Thầy/Cô, em là **Nguyễn Chí Gia Bảo (@chigiabao)**, phụ trách vai trò **F — Frontend Checkout & Auth**.  
> Người dùng bắt đầu bằng việc đăng nhập hoặc đăng ký tài khoản tại `/login` hoặc `/register` với cơ chế xác thực JWT Bearer lưu an toàn vào `LocalStorage`. Tại Navbar, hệ thống hiển thị tên người dùng và badge số lượng giỏ hàng thời gian thực.  
> Khi người dùng vào trang thanh toán `/checkout`, giao diện kiểm tra giỏ hàng và chặn truy cập nếu giỏ rỗng hoặc chưa đăng nhập.  
> Khi nhấn 'Đặt hàng và Thanh toán', hệ thống xử lý giao dịch 2 bước theo kiến trúc Server-authoritative:  
> 1. Bước 1: Gửi `POST /orders` tạo đơn hàng trạng thái `PENDING` (chỉ gửi danh sách món và tùy chọn, **tuyệt đối không gửi `amount`** để máy chủ tự tính giá chống gian lận).  
> 2. Bước 2: Tự động sinh `Idempotency-Key` (UUID v4) và gửi `POST /payments`.  
> Em đã kiểm thử toàn diện các tình huống thông thường và tình huống lỗi: Khi cổng thanh toán timeout hoặc mất mạng, hệ thống **không xóa giỏ hàng**, giữ nguyên `orderId` và `Idempotency-Key` để cho phép khách hàng nhấn 'Thử lại thanh toán' mà không bị trừ tiền hai lần hay tạo trùng đơn hàng. Giỏ hàng chỉ được dọn sạch (`clear cart`) khi máy chủ xác nhận trạng thái `PAID` và tự động điều hướng sang trang chi tiết đơn hàng của role G.  
> Toàn bộ 205+ tests (bao gồm 10 unit tests Auth và 10 unit tests Checkout phía Web, cùng các kịch bản Concurrency và RBAC phía API) đều đã PASS 100% trên CI/CD."*

---

## 2. Bằng chứng giải quyết 5 yêu cầu phản biện của Giảng viên

### Yêu cầu 1: Concurrency 2 khách cùng mua 2 ly cuối cùng trên Database thật
- **File kiểm thử:** `apps/api/src/orders/orders-concurrency-audit.spec.ts`
- **Kịch bản:** Giả lập kho chỉ còn đúng 2 ly cuối cùng (`stockQuantity: 2`). Hai khách hàng cùng bấm mua 2 ly cùng lúc (`Promise.all([order1, order2])`).
- **Cơ chế xử lý:** Sử dụng `tx.product.updateMany({ where: { stockQuantity: { gte: requiredQty } }, data: { stockQuantity: { decrement: requiredQty } } })`.
- **Kết quả nghiệm thu:** 
  - Đúng 1 khách mua thành công (201 Created).
  - Khách còn lại bị từ chối với mã lỗi `400 Bad Request` (`errorCode: OUT_OF_STOCK`).
  - Tồn kho sau giao dịch bằng đúng 0 (không bao giờ bị âm kho và không bao giờ bán lố thành 4 ly).

### Yêu cầu 2: Khách đã thanh toán (PAID) hủy đơn (CANCELLED) để đặt món khác
- **File kiểm thử:** `apps/api/src/orders/orders.service.spec.ts` & `orders-concurrency-audit.spec.ts`
- **Cơ chế xử lý:** `OrdersService.cancelOrder(orderId, userId)`:
  - Chỉ cho phép chủ đơn hủy khi đơn ở trạng thái `PENDING` hoặc `PAID`.
  - Khóa bi quan `SELECT FOR UPDATE` trong transaction.
  - Hoàn trả số lượng tồn kho nguyên tử (`stockQuantity: { increment }`).
  - Nếu đơn đã `PAID`, tự động cập nhật bản ghi thanh toán sang `REFUND_PENDING`.
- **Kết quả nghiệm thu:** Trạng thái đơn chuyển sang `CANCELLED`, kho được bù lại chính xác và khoản tiền được gắn cờ chờ hoàn trả.

### Yêu cầu 3: Chống can thiệp sửa giá qua Postman/curl (Server-authoritative Pricing)
- **File kiểm thử:** `apps/api/src/orders/orders.security.spec.ts`
- **Kịch bản:** Kẻ gian cố tình đính kèm trường `"price": 1000` vào payload gửi lên `POST /orders`.
- **Cơ chế bảo vệ:** `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`.
- **Kết quả nghiệm thu:** Máy chủ chặn ngay tại cổng HTTP với mã `400 Bad Request` (`price should not exist`), request không bao giờ lọt vào Service. Giá tiền luôn được máy chủ tự tính từ Database.

### Yêu cầu 4: Cổng thanh toán timeout/mất mạng & chặn thanh toán đơn CANCELLED
- **Phía Frontend (F):** `apps/web/app/checkout/page.tsx` & `tests/checkout.test.tsx`
  - Giữ nguyên `cart` và `idempotencyKey` khi gặp lỗi timeout/network error.
  - Cho phép khách bấm 'Thử lại thanh toán' tái sử dụng cùng `orderId` và `idempotencyKey`, không tạo thêm đơn mới.
- **Phía Backend (D):** `apps/api/src/payments/payments.service.ts` & `orders-concurrency-audit.spec.ts`
  - Nếu khách cố tình gửi thanh toán cho đơn hàng đã `CANCELLED`, máy chủ chặn ngay với mã `409 Conflict` (`errorCode: ORDER_NOT_PAYABLE`).

### Yêu cầu 5: Ma trận phân quyền RBAC phân biệt rõ ràng CUSTOMER, BARISTA và ADMIN
- **File kiểm thử:** `apps/api/src/auth/auth-roles-matrix.spec.ts`
- **Ma trận quyền hạn:**
  | Hành động / Endpoint | CUSTOMER | BARISTA | ADMIN |
  | :--- | :---: | :---: | :---: |
  | Đăng nhập, xem menu, tạo đơn, xem lịch sử đơn của mình | Cho phép (200/201) | Cho phép (200) | Cho phép (200) |
  | Cập nhật trạng thái chế biến (`PATCH /orders/:id/status`) | **Chặn 403 Forbidden** | **Cho phép (200 OK)** | **Cho phép (200 OK)** |
  | Quản trị thêm/sửa món (`POST/PUT /products`) | **Chặn 403 Forbidden** | **Chặn 403 Forbidden** | **Cho phép (201/200)** |

---

## 3. Danh sách commit & kiểm thử
- **Branch:** `feature/f-auth-checkout`
- **Tổng số bài test đạt:**
  - `apps/api`: **121/121 tests PASS** (Jest)
  - `apps/web`: **95/95 tests PASS** (Vitest)
  - **Tổng cộng: 216/216 tests PASS 100%**.
