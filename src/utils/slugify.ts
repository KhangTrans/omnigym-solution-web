export const slugify = (text: string): string => {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove non-word chars
    .replace(/\-\-+/g, '-'); // Replace multiple - with single -
};

/**
 * Tạo slug cho trainer: "nguyen-van-a-16"
 * Format: slugify(name)-{id}
 */
export const trainerSlug = (name: string | null | undefined, id: number | string): string => {
  const safeName = slugify(name || "trainer");
  return `${safeName}-${id}`;
};

/**
 * Trích xuất ID từ slug trainer.
 * "nguyen-van-a-16" → 16
 * Fallback: nếu slug chỉ là số (vd "16") thì trả về luôn.
 */
export const extractIdFromSlug = (slug: string): number | null => {
  // Thử lấy phần cuối sau dấu "-"
  const lastDash = slug.lastIndexOf("-");
  if (lastDash !== -1) {
    const idPart = slug.slice(lastDash + 1);
    const num = Number(idPart);
    if (Number.isFinite(num) && num > 0) return num;
  }
  // Fallback: slug chỉ là số (backward compatible)
  const num = Number(slug);
  if (Number.isFinite(num) && num > 0) return num;
  return null;
};
