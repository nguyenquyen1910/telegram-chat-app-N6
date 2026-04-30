const formatDate = (date: Date) => {
  return date.toLocaleDateString();
};

/**
 * Định dạng số điện thoại Việt Nam cho hiển thị.
 * Xử lý cả hai dạng lưu: "+840971242451" hoặc "+84971242451"
 * Kết quả: "+84 97 124 24 51"
 *
 * Với các quốc gia khác: trả về nguyên dạng.
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';

  const raw = phone.replace(/^\+/, ''); // bỏ dấu + đầu

  // ── Việt Nam (+84) ─────────────────────────────────────────
  if (raw.startsWith('84')) {
    let national = raw.slice(2); // "0971242451" hoặc "971242451"
    if (national.startsWith('0')) national = national.slice(1); // bỏ leading 0 nếu có
    // 9 chữ số: chia theo nhóm 2-3-2-2 → "97 124 24 51"
    if (national.length >= 9) {
      const p1 = national.slice(0, 2);  // 97
      const p2 = national.slice(2, 5);  // 124
      const p3 = national.slice(5, 7);  // 24
      const p4 = national.slice(7, 9);  // 51
      return `+84 ${[p1, p2, p3, p4].filter(Boolean).join(' ')}`;
    }
    return `+84 ${national}`;
  }

  // ── Fallback: trả nguyên ────────────────────────────────────
  return phone;
}
