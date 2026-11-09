const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

/** API trả tiền dạng chuỗi số nguyên VND, ví dụ "100000". */
export function formatVnd(amount: string): string {
  const n = Number(amount);
  return Number.isFinite(n) ? vnd.format(n) : amount;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}