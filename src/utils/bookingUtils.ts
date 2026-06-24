/**
 * Utility functions for Booking operations (UC-18, UC-20, UC-93)
 */

/**
 * Helper to combine date (YYYY-MM-DD or ISO) and time (HH:mm) strings into a Date object.
 * Correctly accounts for timezone and formatting details.
 */
export const getBookingDateTime = (dateStr: string, timeStr: string): Date => {
  const cleanDate = typeof dateStr === 'string' ? dateStr.slice(0, 10) : new Date(dateStr).toISOString().slice(0, 10);
  const cleanTime = timeStr.slice(0, 5);
  return new Date(`${cleanDate}T${cleanTime}:00`);
};

/**
 * Format a date string (YYYY-MM-DD or ISO) into a Vietnamese readable format
 */
export const formatDateDisplay = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

/**
 * Calculate the end time of a PT session (starts at HH:mm, duration is 90 mins)
 */
export const calculateEndTime = (startTime: string): string => {
  try {
    const [h, m] = startTime.split(":").map(Number);
    let totalMin = h * 60 + m + 90;
    let newH = Math.floor(totalMin / 60) % 24;
    let newM = totalMin % 60;
    return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
  } catch {
    return "";
  }
};

/**
 * Check if the slot can be rescheduled (>= 2 hours before start time)
 */
export const isBookingReschedulable = (dateStr: string, timeStr: string, status: string): boolean => {
  if (status !== "confirmed") return false;
  try {
    const now = new Date();
    const scheduledDateTime = getBookingDateTime(dateStr, timeStr);
    const diffMs = scheduledDateTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours >= 2;
  } catch {
    return false;
  }
};

/**
 * Check if the slot can be cancelled (>= 4 hours before start time)
 */
export const isBookingCancellable = (dateStr: string, timeStr: string, status: string): boolean => {
  if (status !== "confirmed") return false;
  try {
    const now = new Date();
    const scheduledDateTime = getBookingDateTime(dateStr, timeStr);
    const diffMs = scheduledDateTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours >= 4;
  } catch {
    return false;
  }
};

/**
 * Format a Date object or string into a short Vietnamese readable format
 * e.g., "Thứ Hai, 25 thg 6"
 */
export const formatDateShort = (date: Date | string): string => {
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return String(date);
  }
};

/**
 * Format a Date object or string into a long Vietnamese readable format
 * e.g., "Thứ Hai, 25 tháng 6"
 */
export const formatDateLong = (date: Date | string): string => {
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  } catch {
    return String(date);
  }
};

