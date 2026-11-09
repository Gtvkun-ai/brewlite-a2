// Dữ liệu dành riêng cho E2E, tách khỏi tài khoản demo của seed.
// TODO: thêm tài khoản này vào seed hoặc bước setup của E2E khi API sẵn sàng.
export const E2E_USER = {
  email: process.env.E2E_USER_EMAIL ?? 'e2e.customer@brewlite.test',
  password: process.env.E2E_USER_PASSWORD ?? 'E2e-Only-Password1!',
};

// Quy ước Mock Gateway (api-contracts.md mục 2.4):
// accountRef kết thúc bằng 0000 => thanh toán THẤT BẠI.
export const E2E_OK_ACCOUNT_REF = '0901234567';
export const E2E_FAIL_ACCOUNT_REF = '0901230000';