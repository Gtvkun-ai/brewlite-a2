const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const dir = path.resolve(__dirname, '../docs/evidence/demo-acceptance-2026-11-14');
const read = name => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
const report = read('results.json');
const checks = read('checks/results.json');
const desktop = read('desktop-flow.json');
const mobile = read('mobile-flow.json');
const admin = read('admin-flow.json');
const database = read('database-verification.json');
const dependencies = read('dependency-audit.json').metadata.vulnerabilities;
assert.equal(report.stats.expected, 6);
assert.equal(report.stats.unexpected, 0);
assert.equal(report.stats.skipped, 0);
assert(checks.every(check => check.exitCode === 0));
assert.equal(database.result, 'PASS');
const apiCount = Number(fs.readFileSync(path.join(dir, 'checks/api-tests.log'), 'utf8').match(/Tests:\s+(\d+) passed/)[1]);
const webCount = Number(fs.readFileSync(path.join(dir, 'checks/web-tests.log'), 'utf8').match(/Tests\s+(\d+) passed/)[1]);
const specs = [];
function visit(suites) {
  for (const suite of suites || []) {
    for (const spec of suite.specs || []) specs.push(spec);
    visit(suite.suites);
  }
}
visit(report.suites);
const relative = file => path.relative(dir, path.resolve(file)).split(path.sep).join('/');
const artifacts = specs.map(spec => {
  const result = spec.tests[0].results.at(-1);
  return { title: spec.title, duration: (result.duration / 1000).toFixed(1), video: result.attachments.find(a => a.name === 'video'), trace: result.attachments.find(a => a.name === 'trace') };
});
const recordedAt = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
const artifactRows = artifacts.map(a => `| ${a.title.replaceAll('|', '/')} | ${a.duration} | [video](${relative(a.video.path)}) | [trace.zip](${relative(a.trace.path)}) |`).join('\n');
const md = `# BrewLite — Báo cáo audit nghiệm thu demo

Ngày nghiệm thu: **14/11/2026**, giờ Việt Nam. Tổng hợp lúc ${recordedAt}. Kết luận: **PASS toàn bộ yêu cầu chức năng đã giao**, gồm điểm cộng Admin.

## 1. Phạm vi và môi trường

- Kế hoạch: [demo-acceptance-plan.md](../../demo-acceptance-plan.md); [ma trận truy vết](../../traceability-matrix.md).
- Web production build: http://localhost:3100; NestJS API: http://localhost:3101; PostgreSQL 16: database riêng \`brewlite_demo\` ở \`127.0.0.1:55432\`.
- Dữ liệu menu/đơn/thanh toán/quản trị được gửi qua HTTP thật và lưu PostgreSQL. \`NEXT_PUBLIC_USE_FIXTURES=false\`. Cổng thanh toán ở phía máy chủ là mô phỏng theo đề bài.
- Google Chrome **có cửa sổ hiển thị**, desktop 1440×1000 và viewport mobile 390×844; viewport mobile được kiểm tra trong Chrome desktop, chưa kiểm tra trên điện thoại vật lý.
- Browser suite tắt service worker để kết quả nhất quán. [Kiểm tra riêng ranh giới cache](service-worker-boundary.json) xác nhận API và trang động không bị SW cache. Chưa nghiệm thu cài PWA/offline shell toàn diện.
- Chạy local trên nhánh \`feature/admin-frontend\`; kết quả này không đại diện cho deployment live hay CI từ xa.

## 2. Đối chiếu yêu cầu

| Yêu cầu | Kết quả và bằng chứng |
|---|---|
| Cuộn menu, chuyển Cà phê / Trà / Bánh | PASS. Đếm số món theo dữ liệu API khi chọn từng danh mục. [Cà phê](screenshots/desktop-01-menu-Coffee.png), [Trà](screenshots/desktop-01-menu-Tea.png), [Bánh](screenshots/desktop-01-menu-Pastry.png). |
| Cà phê muối: đường 70%, đá 50%, Large, topping | PASS. [Ảnh cấu hình](screenshots/desktop-02-customization-70-50-large-topping.png); giữ cấu hình sau reload, gửi \`selectedSugar=70\`, \`selectedIce=LESS\`, \`selectedSize=LARGE\`, \`TRAN_CHAU\`. |
| Cart Drawer trượt ra, tự tính tổng | PASS. [Giỏ hàng](screenshots/desktop-03-cart-drawer-54000.png). Giá 39.000 + Large 10.000 + trân châu 5.000 = **54.000đ**; tăng 2 ly thành 108.000đ, giảm về 54.000đ; Escape đóng được. |
| Tiến hành đặt hàng → Thẻ/Ví → Xác nhận thanh toán | PASS. [Ví desktop](screenshots/desktop-04-wallet-checkout.png), [Thẻ mobile](screenshots/mobile-03-card-checkout.png). API tự tính tiền; payload khách không gửi tổng giá. |
| Tự chuyển chi tiết, mã đơn, stepper thời gian thực | PASS. Đơn **${desktop.order.code}** tự chuyển đúng ID, quan sát PAID → PREPARING → READY → COMPLETED không reload. Sau reload vẫn COMPLETED. [Chi tiết dữ liệu](desktop-flow.json). |
| Admin đăng nhập đúng tài khoản | PASS. \`admin@brewlite.vn / Password123!\`, vào \`/admin/products\` ngay sau login. [Trang quản trị](screenshots/admin-01-products.png). |
| Admin bật/tắt Còn hàng/Hết hàng | PASS. PATCH thật; phiên khách độc lập tải lại menu thấy hết món và nút thêm bị khóa. Bật lại sau test. [Admin tắt món](screenshots/admin-02-salt-unavailable.png), [khách hết món](screenshots/admin-03-customer-out-of-stock.png). |
| Admin thêm 1 món mới | PASS. Thêm **${admin.created.name}**, SKU \`${admin.created.code}\`, 42.000đ, tồn 12 bằng form ở viewport 390px; DB lưu và khách tải lại thấy món. [Form](screenshots/admin-04-create-product-form.png), [menu khách](screenshots/admin-06-new-product-customer-menu.png). |
| Mobile | PASS. Menu, tùy biến, drawer, checkout, chi tiết và form Admin không tràn ngang ở 390px. Kết quả chi tiết đơn: scrollWidth=${mobile.overflow.scroll}, viewport=${mobile.overflow.width}. [Ảnh](screenshots/mobile-04-order-detail.png). |

Realtime của đơn: frontend poll API mỗi 3 giây. Khi chạy demo, \`DEMO_ORDER_PROGRESSION=true\` và API ngoài production chuyển trạng thái thật trong DB sau khoảng 10–12 giây/step; đây là mô phỏng quầy pha chế. Khi tắt cờ, nhân viên cập nhật trạng thái qua API có phân quyền. Menu khách được nghiệm thu sau reload; cập nhật khi focus được kiểm thử bằng unit test, không tính là cam kết realtime đa cửa sổ.

## 3. Kiểm tra lỗi và toàn vẹn dữ liệu

- [Thanh toán thất bại rồi thử lại](payment-retry.json): \`DEMO-0000\` bị từ chối, tồn kho được trả lại; \`DEMO-1234\` thành công trên **cùng đơn**, đổi khóa thanh toán và trừ kho đúng một lần.
- [Mất mạng khi theo dõi](screenshots/desktop-06-tracking-offline-retains-order.png): giữ chi tiết cũ, hiển thị mất kết nối, hồi phục và theo dõi tiếp.
- [Khách chưa login và mất mạng khi checkout](guest-offline-flow.json): giỏ được giữ sau login; mất mạng báo lỗi và không bịa giao dịch thành công; kết nối lại đặt được đơn thật.
- [API negative cases](real-api-negative-cases.json): chưa login tạo món → **401**; CUSTOMER tạo món → **403**; sửa giá qua \`price=1\` → **400**; đường 69% → **400**.
- [Đối chiếu trực tiếp PostgreSQL](database-verification.json): kiểm tra 4 đơn từ browser, cấu hình 70/50, tổng 54.000đ, hai lần thử thanh toán FAILED/SUCCESS, món mới và trạng thái Cà phê muối đã bật lại.
- Browser suite kiểm tra không có JavaScript \`pageerror\`. Các lỗi mạng cố ý tạo trong test được ghi riêng trong trace.

## 4. Kết quả kiểm chứng

| Kiểm tra | Kết quả | Log |
|---|---|---|
| Lint cả monorepo | PASS | [lint.log](checks/lint.log) |
| Backend unit/integration | **${apiCount}/${apiCount} PASS** | [api-tests.log](checks/api-tests.log) |
| Frontend unit/component | **${webCount}/${webCount} PASS** | [web-tests.log](checks/web-tests.log) |
| NestJS + Next.js production build/typecheck | PASS | [build.log](checks/build.log) |
| Chrome thật / API thật | **6/6 PASS**, 0 skip, 0 retry | [results.json](results.json), [HTML Playwright](playwright-report/index.html) |
| Fixture suite cũ | 5 PASS, **6 SKIPPED**; không tính skipped thành pass | [fixture-suite.json](fixture-suite.json) |
| git diff --check | PASS | [diff-check.log](checks/diff-check.log) |

Tổng **${apiCount + webCount}** unit/integration/component test PASS. Các test thật nằm trong [demo-acceptance.spec.ts](../../../tests/real-browser/demo-acceptance.spec.ts); cấu hình [playwright.real.config.ts](../../../playwright.real.config.ts).

## 5. Lỗi đã phát hiện và xử lý

| Lỗi | Cách xử lý | Bằng chứng hồi quy |
|---|---|---|
| Đường/đá chỉ nằm trong ghi chú chung, món khác cấu hình bị gộp | Field từng item, migration bổ sung, DTO validation, nhận diện đầy đủ cấu hình | customization/cart test, orders-customization test, DB snapshot |
| Phản hồi login chỉ có token nhưng frontend tự gán CUSTOMER | Đọc profile xác thực từ /auth/me, chuẩn hóa userId → id, giữ role thật; xóa phiên không hợp lệ | auth-contract tests, admin browser |
| Thiếu accountRef và retry phát lại giao dịch FAILED | Tài khoản mô phỏng mặc định; khóa mới cho lần thử sau khi đã xác nhận FAILED | payment-retry.json |
| Thành công vẫn ở checkout; detail đứng yên | Điều hướng đúng order ID; polling có cleanup, giữ dữ liệu khi mất mạng | desktop-flow.json |
| Thiếu Cà phê muối trong seed; reseed ghi đè tồn kho | Thêm CF-SALT; seed giữ sản phẩm đã có | API catalog, DB |
| Admin mất lỗi, gửi trước xác thực, nhập 0 tồn kho thành 100 | Guard UI/API, trạng thái đang gửi, thông báo lỗi, validation và giữ 0 | admin/catalog tests |
| Form giá min=1, step=1000 chặn giá 42.000đ trước khi gọi API | Đổi bước nhập thành 1 đồng; kiểm tra native checkValidity | admin component regression, form Chrome mobile gửi POST 201 |
| Mobile tràn 614px ở viewport 390px | Navbar hai hàng, giới hạn nội dung; bảng admin cuộn ngang trong khung, form một cột | mobile-flow.json, ảnh Admin mobile |
| Đổi tab nhanh bỏ qua refresh do throttle | Bỏ throttle bỏ lượt; giữ cơ chế phản hồi mới nhất | menu regression dưới 500ms |
| API mất mạng tự trả catalog/auth/order/payment giả | Catalog/auth chỉ fixture khi bật rõ ràng; order/payment không tự tạo kết quả giả | catalog/auth/checkout API tests, guest browser |
| Demo worker có thể đụng cập nhật/hủy đơn | Hủy dùng row lock, staff update CAS; worker CAS DB, chỉ bật ngoài production | order service + worker tests |

Lịch sử chạy lỗi ban đầu: [initial-results.json](initial-results.json), [intermediate-results.json](intermediate-results.json), [focus-regression-results.json](focus-regression-results.json). Kết luận cuối dùng \`results.json\`; các ảnh \`FAILED-*\` là lịch sử, không phải ảnh kết quả cuối.

## 6. Điểm còn lại

\`npm audit --omit=dev\` ghi nhận **${dependencies.total} cảnh báo dependency**: ${dependencies.high} high, ${dependencies.moderate} moderate, ${dependencies.low} low, ${dependencies.critical} critical. Xem [dependency-audit.json](dependency-audit.json). Một số khuyến nghị nâng major Prisma/Next.js; chưa nâng major trong nhiệm vụ này. Đây là backlog an ninh trước production, tách khỏi kết luận nghiệm thu chức năng local.

Chưa nghiệm thu thiết bị mobile vật lý, live deployment, load test hay cổng thanh toán thật. Sáu placeholder skip trong fixture suite cũ vẫn được ghi nhận skip; bộ Chrome/API thật mới cung cấp bằng chứng cho luồng đã giao.

## 7. Chạy lại và xem evidence

Từ thư mục gốc dự án:

\`\`\`bash
npm install
node scripts/demo.cjs prepare
node scripts/verify-demo.cjs
node scripts/demo.cjs start
# Terminal khác, khi app đã chạy:
npx playwright test -c playwright.real.config.ts
node scripts/audit-demo-database.cjs
node scripts/render-demo-audit.cjs
npx playwright show-report docs/evidence/demo-acceptance-2026-11-14/playwright-report
\`\`\`

[Báo cáo ảnh mở trực tiếp](AUDIT.html). Mỗi video và trace dưới đây được tạo bởi lần chạy Chrome cuối:

| Kịch bản | Giây | Video | Trace |
|---|---:|---|---|
${artifactRows}

Mở trace bằng \`npx playwright show-trace <đường-dẫn-trace.zip>\`. [SHA-256 manifest](manifest-sha256.json) ghi kích thước và hash các artifact để đối chiếu. Tài khoản và token trong trace chỉ thuộc database demo cục bộ.
`;
fs.writeFileSync(path.join(dir, 'AUDIT.md'), md);
const escape = text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const photos = fs.readdirSync(path.join(dir, 'screenshots')).filter(name => name.endsWith('.png') && !name.startsWith('FAILED'));
const html = `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BrewLite — Audit nghiệm thu 14/11/2026</title><style>body{margin:0;background:#f6f3ee;color:#28211c;font:16px/1.6 system-ui}main{max-width:1120px;margin:auto;padding:36px 24px}h1{font-size:36px;line-height:1.2}a{color:#8b4f2d}.pill{display:inline-block;background:#e0f0de;color:#235b29;padding:8px 16px;border-radius:30px;font-weight:700}.stats{display:flex;gap:16px;flex-wrap:wrap}.stats p{background:white;padding:18px 24px;border-radius:14px}.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:20px}.gallery a{display:block;background:white;padding:14px;border-radius:12px;overflow:hidden;word-break:break-word}.gallery img{width:100%;height:260px;object-fit:contain;background:#eee8e0}table{width:100%;border-collapse:collapse;background:white}td,th{padding:12px;text-align:left;border-bottom:1px solid #ddd}code{background:#eae3da;padding:3px 6px;border-radius:4px}.notice{padding:18px;background:#fff1d5;border-radius:12px}footer{margin-top:36px}</style><main><span class="pill">6/6 Chrome thật PASS</span><h1>BrewLite · Audit nghiệm thu demo</h1><p>14/11/2026 · Chrome có cửa sổ · Next.js / NestJS / PostgreSQL thật</p><div class="stats"><p><strong>${apiCount}</strong> test API PASS</p><p><strong>${webCount}</strong> test frontend PASS</p><p><strong>Lint + Build</strong> PASS</p><p><strong>390px mobile</strong> PASS</p></div><p>Đơn <strong>${escape(desktop.order.code)}</strong>: Cà phê muối, 70% đường, 50% đá, Large, trân châu. Tổng tiền <strong>54.000đ</strong>. Đã thanh toán → Đang pha chế → Sẵn sàng → Hoàn tất từ trạng thái DB.</p><p><a href="AUDIT.md">Báo cáo chi tiết</a> · <a href="playwright-report/index.html">Playwright report</a> · <a href="database-verification.json">Đối chiếu database</a> · <a href="checks/results.json">Log kiểm chứng</a></p><p class="notice">Dependency audit: ${dependencies.total} cảnh báo (${dependencies.high} high). Xem <a href="dependency-audit.json">chi tiết</a>. Mobile là viewport Chrome desktop. Menu khách kiểm tra sau reload; realtime đơn dùng polling3s và worker demo cập nhật DB.</p><h2>Video và trace</h2><table><tr><th>Kịch bản</th><th>Giây</th><th>Evidence</th></tr>${artifacts.map(a => `<tr><td>${escape(a.title)}</td><td>${a.duration}</td><td><a href="${relative(a.video.path)}">Video</a> · <a href="${relative(a.trace.path)}">Trace</a></td></tr>`).join('')}</table><h2>Ảnh nghiệm thu</h2><div class="gallery">${photos.map(name => `<a href="screenshots/${encodeURIComponent(name)}"><img loading="lazy" src="screenshots/${encodeURIComponent(name)}" alt="${escape(name)}"><span>${escape(name.replace('.png', ''))}</span></a>`).join('')}</div><footer><p>Web demo: <a href="http://localhost:3100">localhost:3100</a> · Admin: <a href="http://localhost:3100/admin/products">/admin/products</a><br>Admin/Customer demo: <code>Password123!</code> · <a href="manifest-sha256.json">SHA-256 manifest</a></p></footer></main></html>`;
fs.writeFileSync(path.join(dir, 'AUDIT.html'), html);
const files = [];
function walk(folder) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name !== 'manifest-sha256.json') {
      const data = fs.readFileSync(file);
      files.push({ path: path.relative(dir, file).split(path.sep).join('/'), bytes: data.length, sha256: crypto.createHash('sha256').update(data).digest('hex') });
    }
  }
}
walk(dir);
fs.writeFileSync(path.join(dir, 'manifest-sha256.json'), JSON.stringify({ createdAt: new Date().toISOString(), files }, null, 2));
console.log(`Audit rendered: 6/6 browser PASS, ${apiCount + webCount} unit/component/integration PASS, ${photos.length} screenshots, ${artifacts.length} videos and traces.`);
