import { useEffect, useState, useCallback } from "react";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  plan: "Free" | "Basic" | "Pro" | "Elite";
  role: "member" | "trainer" | "admin";
  status: "active" | "paused" | "banned";
  joined: string; // ISO date
  spend: number;
};

export type RevenueEntry = {
  id: string;
  date: string; // ISO
  source: "Membership" | "Shop" | "Class" | "PT Session";
  amount: number;
  customer: string;
};

export type ExerciseMediaType = "gif" | "video" | "image";

export type Exercise = {
  id: string;
  name: string;
  mediaUrl: string;
  mediaType: ExerciseMediaType;
  sets: number;
  reps: string;
  rest: number;
  notes?: string;
  description?: string;
  difficulty?: 1 | 2 | 3;
};

export type ExercisePack = {
  id: string;
  name: string;
  description: string;
  category: "Strength" | "Cardio" | "Mobility" | "HIIT" | "Recovery";
  level: "Beginner" | "Inter." | "Advanced";
  durationMin: number;
  coverUrl?: string;
  publishedToDashboard: boolean;
  exercises: Exercise[];
};

const KEYS = {
  users: "admin_users_v1",
  revenue: "admin_revenue_v1",
  packs: "admin_packs_v2",
  library: "admin_exercise_library_v1",
};

const EVT = "admin_store_changed";

const seedUsers: AdminUser[] = [
  { id: "u1", name: "Ava Thompson", email: "ava@omnigym.fit", plan: "Pro", role: "member", status: "active", joined: "2024-11-12", spend: 480 },
  { id: "u2", name: "Diego Rivera", email: "diego@omnigym.fit", plan: "Elite", role: "trainer", status: "active", joined: "2023-04-02", spend: 0 },
  { id: "u3", name: "Maya Chen", email: "maya@omnigym.fit", plan: "Elite", role: "trainer", status: "active", joined: "2023-02-18", spend: 0 },
  { id: "u4", name: "Sam Patel", email: "sam@omnigym.fit", plan: "Elite", role: "trainer", status: "active", joined: "2023-06-21", spend: 0 },
  { id: "u5", name: "Jordan Lee", email: "jordan@omnigym.fit", plan: "Basic", role: "member", status: "paused", joined: "2025-01-04", spend: 120 },
  { id: "u6", name: "Priya Shah", email: "priya@omnigym.fit", plan: "Pro", role: "member", status: "active", joined: "2025-03-22", spend: 360 },
  { id: "u7", name: "Marco Bianchi", email: "marco@omnigym.fit", plan: "Free", role: "member", status: "active", joined: "2025-09-08", spend: 35 },
  { id: "u8", name: "Noor Hassan", email: "noor@omnigym.fit", plan: "Pro", role: "member", status: "banned", joined: "2024-07-15", spend: 540 },
];

const seedPacks: ExercisePack[] = [
  {
    id: "pk1",
    name: "Upper Body Burn",
    description: "30-minute push/pull circuit focused on chest, back and arms.",
    category: "Strength",
    level: "Inter.",
    durationMin: 30,
    coverUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",
    publishedToDashboard: true,
    exercises: [
      { id: "ex1", name: "Push-Ups", mediaUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80", mediaType: "image", sets: 4, reps: "12", rest: 45, notes: "Keep elbows at 45°.", description: "Classic bodyweight push targeting chest, shoulders and triceps. Keep your core braced and body in one straight line from head to heels.", difficulty: 1 },
      { id: "ex2", name: "Bent-Over Row", mediaUrl: "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=800&q=80", mediaType: "image", sets: 4, reps: "10", rest: 60, description: "Hinge at the hips with a flat back and pull the bar to your lower ribs. Builds mid-back thickness and posture.", difficulty: 2 },
      { id: "ex3", name: "Shoulder Press", mediaUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80", mediaType: "image", sets: 3, reps: "12", rest: 60, description: "Press dumbbells overhead without flaring the ribs. Strict tempo, no leg drive.", difficulty: 3 },
    ],
  },
  {
    id: "pk2",
    name: "HIIT Express",
    description: "Quick 20-minute fat burner. Bodyweight only, no equipment.",
    category: "HIIT",
    level: "Beginner",
    durationMin: 20,
    coverUrl: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800&q=80",
    publishedToDashboard: true,
    exercises: [
      { id: "ex4", name: "Jumping Jacks", mediaUrl: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800&q=80", mediaType: "image", sets: 4, reps: "40s", rest: 20, description: "Full-body warm-up that raises the heart rate quickly. Land softly on the balls of your feet.", difficulty: 1 },
      { id: "ex5", name: "Burpees", mediaUrl: "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=800&q=80", mediaType: "image", sets: 4, reps: "30s", rest: 30, description: "Squat, kick back to a plank, push-up, jump back in, explode up. The ultimate full-body conditioning move.", difficulty: 3 },
      { id: "ex6", name: "Mountain Climbers", mediaUrl: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=800&q=80", mediaType: "image", sets: 4, reps: "40s", rest: 20, description: "From a tight plank, drive knees alternately to your chest at a fast tempo. Hips stay low.", difficulty: 2 },
    ],
  },
  {
    id: "pk3",
    name: "Mobility Reset",
    description: "Gentle 15-minute mobility flow for recovery days.",
    category: "Mobility",
    level: "Beginner",
    durationMin: 15,
    coverUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
    publishedToDashboard: false,
    exercises: [
      { id: "ex7", name: "Cat-Cow", mediaUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80", mediaType: "image", sets: 2, reps: "60s", rest: 15, description: "Gentle spinal mobilisation. Alternate between arching and rounding the back with the breath.", difficulty: 1 },
      { id: "ex8", name: "World's Greatest Stretch", mediaUrl: "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=800&q=80", mediaType: "image", sets: 2, reps: "8/side", rest: 15, description: "A multi-joint stretch that opens hips, T-spine and hamstrings in one flow.", difficulty: 2 },
    ],
  },
];

function genRevenue(): RevenueEntry[] {
  const entries: RevenueEntry[] = [];
  const sources: RevenueEntry["source"][] = ["Membership", "Shop", "Class", "PT Session"];
  const customers = ["Ava Thompson", "Jordan Lee", "Priya Shah", "Marco Bianchi", "Noor Hassan", "Liam Park", "Sofia Reyes"];
  const now = new Date();
  for (let i = 0; i < 90; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const count = 2 + Math.floor(Math.random() * 4);
    for (let j = 0; j < count; j++) {
      const src = sources[Math.floor(Math.random() * sources.length)];
      const base = src === "Membership" ? 49 : src === "Shop" ? 28 : src === "PT Session" ? 75 : 18;
      entries.push({
        id: `r-${i}-${j}`,
        date: d.toISOString(),
        source: src,
        amount: +(base + Math.random() * base * 0.6).toFixed(2),
        customer: customers[Math.floor(Math.random() * customers.length)],
      });
    }
  }
  return entries;
}

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
  const [items, setItems] = useState<T>(seed);

  useEffect(() => {
    setItems(read(key, seed));
    const sync = () => setItems(read(key, seed));
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
      setItems(next);
    },
    [key],
  );

  return [items, update] as const;
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useAdminUsers() {
  const [users, setUsers] = useStore<AdminUser[]>(KEYS.users, seedUsers);
  return {
    users,
    create: (u: Omit<AdminUser, "id">) => setUsers([{ ...u, id: uid("u") }, ...users]),
    update: (id: string, patch: Partial<AdminUser>) =>
      setUsers(users.map((u) => (u.id === id ? { ...u, ...patch } : u))),
    remove: (id: string) => setUsers(users.filter((u) => u.id !== id)),
    reset: () => setUsers(seedUsers),
  };
}

export function useAdminRevenue() {
  const [revenue, setRevenue] = useStore<RevenueEntry[]>(KEYS.revenue, []);
  // lazy seed on first mount
  useEffect(() => {
    if (revenue.length === 0) {
      const seed = genRevenue();
      setRevenue(seed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return {
    revenue,
    create: (r: Omit<RevenueEntry, "id">) => setRevenue([{ ...r, id: uid("r") }, ...revenue]),
    remove: (id: string) => setRevenue(revenue.filter((r) => r.id !== id)),
    reset: () => setRevenue(genRevenue()),
  };
}

export function useAdminPacks() {
  const [packs, setPacks] = useStore<ExercisePack[]>(KEYS.packs, seedPacks);
  return {
    packs,
    create: (p: Omit<ExercisePack, "id">) => setPacks([{ ...p, id: uid("pk") }, ...packs]),
    update: (id: string, patch: Partial<ExercisePack>) =>
      setPacks(packs.map((p) => (p.id === id ? { ...p, ...patch } : p))),
    remove: (id: string) => setPacks(packs.filter((p) => p.id !== id)),
    togglePublish: (id: string) =>
      setPacks(packs.map((p) => (p.id === id ? { ...p, publishedToDashboard: !p.publishedToDashboard } : p))),
    reset: () => setPacks(seedPacks),
  };
}

export function newExercise(): Exercise {
  return { id: uid("ex"), name: "", mediaUrl: "", mediaType: "gif", sets: 3, reps: "10", rest: 45, description: "", difficulty: 1 };
}

// ---------------- Exercise library ----------------

const seedLibrary: Exercise[] = (() => {
  const seen = new Map<string, Exercise>();
  for (const p of seedPacks) {
    for (const ex of p.exercises) {
      const key = ex.name.trim().toLowerCase();
      if (key && !seen.has(key)) seen.set(key, { ...ex });
    }
  }
  return Array.from(seen.values());
})();

export function useExerciseLibrary() {
  const [items, setItems] = useStore<Exercise[]>(KEYS.library, seedLibrary);
  return {
    exercises: items,
    create: (e: Omit<Exercise, "id">) =>
      setItems([{ ...e, id: uid("ex") }, ...items]),
    update: (id: string, patch: Partial<Exercise>) =>
      setItems(items.map((e) => (e.id === id ? { ...e, ...patch } : e))),
    remove: (id: string) => setItems(items.filter((e) => e.id !== id)),
    reset: () => setItems(seedLibrary),
  };
}