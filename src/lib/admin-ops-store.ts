import { useCallback, useEffect, useState } from "react";

/* ---------------- shared store helper ---------------- */

const EVT = "admin_ops_changed";

function read<T>(key: string, seed: T): T {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as T;
  } catch {
    return seed;
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(EVT));
}

function useStore<T>(key: string, seed: T) {
  const [state, setState] = useState<T>(seed);
  useEffect(() => {
    setState(read(key, seed));
    const sync = () => setState(read(key, seed));
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const update = useCallback(
    (next: T) => {
      write(key, next);
      setState(next);
    },
    [key],
  );
  return [state, update] as const;
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ---------------- refunds ---------------- */

export type RefundRequest = {
  id: string;
  customer: string;
  email: string;
  amount: number;
  reason: string;
  source: "Membership" | "Shop" | "Class" | "PT Session";
  status: "pending" | "approved" | "denied";
  requestedAt: string;
  resolvedAt?: string;
  note?: string;
};

const seedRefunds: RefundRequest[] = [
  {
    id: "rf-1001",
    customer: "Jordan Lee",
    email: "jordan@omnigym.fit",
    amount: 49,
    reason: "Cancelled membership within trial window.",
    source: "Membership",
    status: "pending",
    requestedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "rf-1002",
    customer: "Marco Bianchi",
    email: "marco@omnigym.fit",
    amount: 28,
    reason: "Wrong size shipped on shaker bottle.",
    source: "Shop",
    status: "pending",
    requestedAt: new Date(Date.now() - 18 * 3600000).toISOString(),
  },
  {
    id: "rf-1003",
    customer: "Noor Hassan",
    email: "noor@omnigym.fit",
    amount: 75,
    reason: "Trainer cancelled session.",
    source: "PT Session",
    status: "approved",
    requestedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    resolvedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    note: "Approved and refunded to card on file.",
  },
  {
    id: "rf-1004",
    customer: "Priya Shah",
    email: "priya@omnigym.fit",
    amount: 18,
    reason: "Couldn't attend booked class, no-show fee dispute.",
    source: "Class",
    status: "denied",
    requestedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    resolvedAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    note: "Outside 24h cancellation window.",
  },
];

export function useRefunds() {
  const [items, setItems] = useStore<RefundRequest[]>("admin_refunds_v1", seedRefunds);
  return {
    refunds: items,
    approve: (id: string, note?: string) =>
      setItems(
        items.map((r) =>
          r.id === id
            ? { ...r, status: "approved", resolvedAt: new Date().toISOString(), note }
            : r,
        ),
      ),
    deny: (id: string, note?: string) =>
      setItems(
        items.map((r) =>
          r.id === id
            ? { ...r, status: "denied", resolvedAt: new Date().toISOString(), note }
            : r,
        ),
      ),
    reset: () => setItems(seedRefunds),
  };
}

/* ---------------- content moderation ---------------- */

export type ContentReport = {
  id: string;
  contentType: "review" | "profile" | "gym" | "trainer";
  target: string;
  excerpt: string;
  reporter: string;
  reason: "spam" | "harassment" | "misinformation" | "inappropriate" | "other";
  status: "open" | "removed" | "dismissed";
  reportedAt: string;
};

const seedReports: ContentReport[] = [
  {
    id: "cr-1",
    contentType: "review",
    target: "OmniGym · Midtown branch",
    excerpt: "This place is full of scam — admins do not trust them ever!!!",
    reporter: "Ava Thompson",
    reason: "harassment",
    status: "open",
    reportedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: "cr-2",
    contentType: "trainer",
    target: "Trainer · Diego Rivera",
    excerpt: "Bio claims a certification that cannot be verified on the issuer site.",
    reporter: "Compliance bot",
    reason: "misinformation",
    status: "open",
    reportedAt: new Date(Date.now() - 26 * 3600000).toISOString(),
  },
  {
    id: "cr-3",
    contentType: "profile",
    target: "User · @gainz_machine",
    excerpt: "Profile image is an inappropriate meme.",
    reporter: "Sam Patel",
    reason: "inappropriate",
    status: "removed",
    reportedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "cr-4",
    contentType: "gym",
    target: "FlexFit Studio",
    excerpt: "Duplicate listing of an existing studio.",
    reporter: "Maya Chen",
    reason: "spam",
    status: "dismissed",
    reportedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

export function useContentReports() {
  const [items, setItems] = useStore<ContentReport[]>("admin_reports_v1", seedReports);
  return {
    reports: items,
    setStatus: (id: string, status: ContentReport["status"]) =>
      setItems(items.map((r) => (r.id === id ? { ...r, status } : r))),
    reset: () => setItems(seedReports),
  };
}

/* ---------------- gym payouts ---------------- */

export type GymPayout = {
  id: string;
  brandId: string;
  brandName: string;
  period: string; // e.g. "Apr 2026"
  gross: number;
  fees: number;
  net: number;
  status: "pending" | "approved" | "paid" | "rejected";
  submittedAt: string;
  decidedAt?: string;
};

const seedPayouts: GymPayout[] = [
  {
    id: "po-2001",
    brandId: "omnigym",
    brandName: "OmniGym",
    period: "Apr 2026",
    gross: 18400,
    fees: 1840,
    net: 16560,
    status: "pending",
    submittedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "po-2002",
    brandId: "flexfit",
    brandName: "FlexFit Studio",
    period: "Apr 2026",
    gross: 4200,
    fees: 420,
    net: 3780,
    status: "pending",
    submittedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "po-2003",
    brandId: "omnigym",
    brandName: "OmniGym",
    period: "Mar 2026",
    gross: 17200,
    fees: 1720,
    net: 15480,
    status: "paid",
    submittedAt: new Date(Date.now() - 32 * 86400000).toISOString(),
    decidedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: "po-2004",
    brandId: "flexfit",
    brandName: "FlexFit Studio",
    period: "Mar 2026",
    gross: 3900,
    fees: 390,
    net: 3510,
    status: "rejected",
    submittedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    decidedAt: new Date(Date.now() - 28 * 86400000).toISOString(),
  },
];

export function useGymPayouts() {
  const [items, setItems] = useStore<GymPayout[]>("admin_payouts_v1", seedPayouts);
  return {
    payouts: items,
    setStatus: (id: string, status: GymPayout["status"]) =>
      setItems(
        items.map((p) =>
          p.id === id ? { ...p, status, decidedAt: new Date().toISOString() } : p,
        ),
      ),
    reset: () => setItems(seedPayouts),
  };
}

/* ---------------- admin profile ---------------- */

export type AdminProfile = {
  name: string;
  email: string;
  role: "Owner" | "Operations" | "Support";
  phone: string;
  twoFactor: boolean;
  avatar: string;
  bio: string;
};

const seedProfile: AdminProfile = {
  name: "Sasha Admin",
  email: "sasha@omnigym.fit",
  role: "Owner",
  phone: "+1 (555) 010-2210",
  twoFactor: true,
  avatar:
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
  bio: "Running the OmniGym control center since day one.",
};

export function useAdminProfile() {
  const [profile, setProfile] = useStore<AdminProfile>("admin_profile_v1", seedProfile);
  return {
    profile,
    update: (patch: Partial<AdminProfile>) => setProfile({ ...profile, ...patch }),
    reset: () => setProfile(seedProfile),
  };
}

export { uid };