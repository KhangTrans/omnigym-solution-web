export type PTMembership = {
  trainerId: string;
  months: 1 | 3 | 6;
  sessionsPerMonth: number;
  totalSessions: number;
  used: number;
  startDate: string; // ISO
  endDate: string; // ISO
  price: number;
};

export type BookingStatus = "confirmed" | "completed" | "cancelled";

export type PTBooking = {
  id: string;
  trainerId: string;
  date: string; // ISO date (yyyy-mm-dd)
  time: string; // "08:00"
  createdAt: string;
  status?: BookingStatus;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAvatar?: string;
  note?: string;
};

const MEM_KEY = "pt-memberships";
const BOOK_KEY = "pt-bookings";

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}
function write<T>(key: string, val: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    // Notify same-window listeners (storage event only fires cross-tab)
    window.dispatchEvent(new Event("pt_bookings_changed"));
  } catch {}
}

export const BOOKINGS_EVT = "pt_bookings_changed";

export function getMembership(trainerId: string): PTMembership | undefined {
  return read<PTMembership>(MEM_KEY).find((m) => m.trainerId === trainerId);
}

export function saveMembership(m: PTMembership) {
  const all = read<PTMembership>(MEM_KEY).filter((x) => x.trainerId !== m.trainerId);
  all.push(m);
  write(MEM_KEY, all);
}

export function getBookings(trainerId: string): PTBooking[] {
  return read<PTBooking>(BOOK_KEY).filter((b) => b.trainerId === trainerId);
}

export function addBooking(b: PTBooking) {
  const all = read<PTBooking>(BOOK_KEY);
  all.push({ status: "confirmed", ...b });
  write(BOOK_KEY, all);
  const mem = getMembership(b.trainerId);
  if (mem) {
    mem.used = Math.min(mem.totalSessions, mem.used + 1);
    saveMembership(mem);
  }
}

export function updateBooking(id: string, patch: Partial<PTBooking>) {
  const all = read<PTBooking>(BOOK_KEY);
  const i = all.findIndex((b) => b.id === id);
  if (i < 0) return;
  all[i] = { ...all[i], ...patch };
  write(BOOK_KEY, all);
}

export function deleteBooking(id: string) {
  const all = read<PTBooking>(BOOK_KEY).filter((b) => b.id !== id);
  write(BOOK_KEY, all);
}

export const PT_PLANS: { months: 1 | 3 | 6; sessionsPerMonth: number; pricePerSession: number; popular?: boolean; saveLabel?: string }[] = [
  { months: 1, sessionsPerMonth: 20, pricePerSession: 75 },
  { months: 3, sessionsPerMonth: 20, pricePerSession: 65, popular: true, saveLabel: "Save 13%" },
  { months: 6, sessionsPerMonth: 20, pricePerSession: 58, saveLabel: "Save 22%" },
];

export function planTotal(months: 1 | 3 | 6): number {
  const p = PT_PLANS.find((x) => x.months === months)!;
  return p.months * p.sessionsPerMonth * p.pricePerSession;
}