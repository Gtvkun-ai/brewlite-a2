# Nghiệm thu API BrewLite bằng Postman

- Ngày chạy 17/11/2026, giờ Việt Nam.
- Hai ca tích hợp chạy bằng Newman trên NestJS API cục bộ cổng `3102` và PostgreSQL 16 qua Docker. Thanh toán dùng Mock Gateway.
- Đầu vào là [collection Postman](../../../output/BrewLite-Concurrency-Demo.postman_collection.json). Kết quả thực thi và đối soát DB nằm trong [newman.txt](newman.txt).
- Kết quả Newman đạt 17/17 kiểm tra trên 27 request. Hai bộ hồi quy Jest cho kho và thanh toán đạt 13/13.

## Kết quả

| Ca kiểm thử | Kết quả HTTP và dữ liệu | Kết luận |
|---|---|---|
| TC-15, TC-24 · Hai khách tranh 2 bánh cuối | Hai JWT thuộc hai khách khác nhau. Mỗi khách gửi `POST /orders` cùng lúc để mua 2 bánh. Một request trả `201`, request kia trả `400 OUT_OF_STOCK`. Tồn kho đọc qua API lần lượt là `2 → 0 → 2` trước khi tạo, sau khi tạo và sau khi hủy đơn. | Pass |
| TC-12 · Gửi lại thanh toán cùng key | Hai request trả `200`, cùng `paymentId`, `transactionRef` và nội dung. Tồn kho giữ ở 1 sau lần gửi lại. PostgreSQL ghi đúng một bản ghi thanh toán cho đơn thử. | Pass |
| TC-13 · Cùng key, đổi nội dung | Đổi `accountRef` với cùng `Idempotency-Key` trả `409 IDEMPOTENCY_KEY_PAYLOAD_MISMATCH`. | Pass |
| TC-19 · Health | Cả hai ca xác nhận `GET /health` trả `200` và PostgreSQL báo `up`. | Pass |

Collection hủy đơn và tắt bán sản phẩm thử ở cuối mỗi ca. Mã đơn và mã giao dịch trong log thuộc dữ liệu demo.

## Chạy lại

Khởi động API demo theo [README của repo](../../../README.md#11-nghiệm-thu-api-với-postman). Trong Postman, chọn request cần demo, bấm **Send** và xem **Test Results**. Để chạy cả hai ca bằng Newman từ thư mục gốc repo:

```powershell
npx --yes newman@6 run output/BrewLite-Concurrency-Demo.postman_collection.json --timeout-request 5000 --timeout-script 15000
```

Để kiểm tra số bản ghi sau ca replay, mở PostgreSQL demo bằng lệnh dưới đây. Dùng `paymentId` của chính lượt chạy đang kiểm tra, lấy từ dòng `REPLAY`.

```powershell
docker compose -p brewlite-acceptance -f docker-compose.demo.yml exec demo-db psql -U brew_demo -d brewlite_demo
```

```sql
SELECT count(*) AS payment_rows
FROM "Payment"
WHERE "orderId" = (
  SELECT "orderId" FROM "Payment" WHERE id = '<paymentId từ dòng REPLAY>'
);
```

Kết quả mong đợi là `payment_rows = 1`. Trạng thái sau cleanup là `REFUND_PENDING` do đơn đã thanh toán được hủy.
