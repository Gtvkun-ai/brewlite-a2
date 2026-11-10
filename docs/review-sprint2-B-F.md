# Biên bản Nghiệm thu & Đánh giá Kỹ thuật (Code Review S2)

> **Người thực hiện đánh giá:** Tech Lead A (Scrum Master & Architect)  
> **Thời gian nghiệm thu:** 09/11/2026  
> **Phạm vi:** Nghiệm thu tích hợp thành phần của **Thành viên B** (Backend Auth) và **Thành viên F** (Frontend Auth, Cart & Checkout)  
> **Nhánh tích hợp:** `feature/f-auth-checkout` $\longrightarrow$ `sprint-2/checkout-delivery`  
> **Tiêu chí nghiệm thu:** Tuân thủ `docs/architecture/api-contracts.md`, Definition of Done (DoD), Lint 0 lỗi, Test pass 100%, Build thành công.

---

## 1. Đánh giá Chi tiết Thành viên B (Backend Auth & JWT - Thẻ B-10)

* **Người thực hiện:** `lamdat1005` (Commit `f7b0b85`)
* **Các file nộp:**
  * `apps/api/src/auth/auth.service.ts`
  * `apps/api/src/auth/auth.controller.ts`
  * `apps/api/src/auth/auth.dto.ts`
  * `apps/api/src/auth/jwt.strategy.ts`
  * `apps/api/src/auth/jwt-auth.guard.ts`
  * `apps/api/src/auth/current-user.decorator.ts`
  * `docs/auth-api.md`

###  Ưu điểm kỹ thuật:
1. **Bảo mật chuẩn mực:** Mật khẩu người dùng được băm an toàn bằng thuật toán `bcrypt` với độ phức tạp 10 salt rounds; logic `register()` ném lỗi `409 Conflict` nếu trùng email và tuyệt đối không trả trường `passwordHash` về client.
2. **Quản lý Token chuyên nghiệp:** Cấu hình `JwtStrategy` trích xuất Bearer token từ header `Authorization`, payload chuẩn hóa (`sub`, `email`, `role`).
3. **Tiện ích tích hợp cao:** Cung cấp decorator `@CurrentUser()` giúp các Controller khác (Orders, Payments) dễ dàng trích xuất thông tin người dùng mà không cần parse thủ công `req.user`.
4. **Tài liệu bàn giao rõ ràng:** Đã viết file tài liệu mô tả endpoint `docs/auth-api.md` kèm mẫu JSON thực tế.

### ⚠️ Điểm lưu ý / Đã xử lý khi tích hợp:
* Cần tích hợp khai báo `AuthModule` vào `apps/api/src/app.module.ts` (Tech Lead A đã wiring và kiểm tra kết nối với Prisma).

👉 **Kết luận nghiệm thu Vai trò B:** **ĐẠT YÊU CẦU (9.5/10)** — Sẵn sàng cho C và D sử dụng `@UseGuards(JwtAuthGuard)`.

---

## 2. Đánh giá Chi tiết Thành viên F (Frontend Auth, Cart & Checkout - Thẻ F-10 & F-20)

* **Người thực hiện:** `Nguyen Chi Gia Bao` (Commit `d79d6c5`)
* **Các file nộp:**
  * `apps/web/app/login/page.tsx` & `register/page.tsx`
  * `apps/web/components/Navbar.tsx` & `Providers.tsx`
  * `apps/web/context/AuthContext.tsx`
  * `apps/web/context/CartContext.tsx`
  * `apps/web/app/checkout/page.tsx`
  * `apps/web/lib/auth-api.ts` & `checkout-api.ts`
  * `apps/web/__tests__/auth.test.tsx` (10 tests)
  * `apps/web/__tests__/checkout.test.tsx` (9 tests)

###  Ưu điểm kỹ thuật nổi bật:
1. **Tuân thủ xuất sắc Server-authoritative Pricing:** Màn hình Checkout không tự ý gửi trường `amount` lên server để tránh gian lận thanh toán, đúng chuẩn thiết kế an toàn của `api-contracts.md`.
2. **Cơ chế Idempotency & Retry thông minh:**
   * Tự động sinh `Idempotency-Key` (UUID v4) cố định cho mỗi phiên đặt hàng.
   * Khi thanh toán bị từ chối hoặc gặp lỗi mạng, hệ thống **bảo lưu `orderId` và `idempotencyKey`**. Khách hàng bấm *"Thử lại thanh toán"* chỉ gọi lại Bước 2 (`POST /payments`), tuyệt đối **không tạo thêm đơn hàng trùng lặp**.
3. **Bảo toàn giỏ hàng hoàn hảo:** Giỏ hàng trong `CartContext` chỉ được xóa (`cart.clear()`) khi nhận trạng thái `PAID`. Khi thanh toán lỗi hoặc đơn bị từ chối, giỏ hàng giữ nguyên 100% để khách đổi phương thức hoặc thử lại.
4. **Độ bao phủ kiểm thử ấn tượng:** Viết tới 19 bài kiểm thử đơn vị tự động, bao quát từ validation form, lỗi 401/409, cart badge cập nhật real-time, chống double-click, đến luồng retry an toàn.

👉 **Kết luận nghiệm thu Vai trò F:** **XUẤT SẮC (10/10)** — Chất lượng code ở cấp độ Production.

---

## 3. Tổng kết Nghiệm thu Tích hợp (Tech Lead A – A-10)

1. **Giải quyết Xung đột (Conflict Resolution):** Đã hợp nhất an toàn `package-lock.json` và đồng bộ hóa các mã kiểm thử (`WEB-T04-AUTH`, `WEB-T05-CHECKOUT`, `WEB-T06-ORDERS`) trong [`docs/traceability-matrix.md`](file:///c:/Users/Gtvkun/Documents/GitHub/brewlite-a2/docs/traceability-matrix.md).
2. **Kết quả Quality Gate tự động:**
   * **Lint:** `npm run lint` $\rightarrow$ **0 Warning, 0 Error**.
   * **Test:** `npm test` $\rightarrow$ **54/54 tests PASS 100%** (6 Jest API + 48 Vitest Web).
   * **Build:** `npm run build` $\rightarrow$ **Biên dịch thành công cả 8 routes Web và API**.
3. **Mã Commit nghiệm thu:** `0694746` đã được đẩy lên nhánh `sprint-2/checkout-delivery`.
