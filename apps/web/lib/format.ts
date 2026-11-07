const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

/** API trả tiền dạng chuỗi số nguyên VND (hoặc số number), ví dụ "100000" hoặc 100000. */
export function formatVnd(amount: string | number): string {
  const n = typeof amount === 'number' ? amount : Number(amount);
  return Number.isFinite(n) ? vnd.format(n) : String(amount);
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}