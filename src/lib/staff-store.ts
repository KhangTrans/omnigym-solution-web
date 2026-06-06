import { useCallback, useEffect, useState } from "react";

export type StaffTrainer = {
  id: string;
  brandId: string;
  name: string;
  username: string;
  password: string;
  email: string;
  phone?: string;
  title: string;
  photo: string;
  bio: string;
  address: string;
  idNumber: string;
  idPhoto: string;
  certification: string;
  certificationIssuer: string;
  certificationNumber: string;
  certificationIssuedAt: string;
  certificationExpiresAt: string;
  certificationPhoto: string;
  cprCertified: boolean;
  cprExpiresAt: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insuranceExpiresAt: string;
  specialties: string[];
  yearsExperience: number;
  hourlyRate: number;
  /** Total revenue earned (mocked, for dashboard demo). */
  monthlyEarnings: number;
  /** Sessions delivered this month (mocked). */
  monthlySessions: number;
  active: boolean;
  approved?: boolean;
  pendingUserId?: string | number;
  createdAt: string;
};

const KEY = "gym_staff_trainers_v1";
const EVT = "gym_staff_trainers_changed";

function read(): StaffTrainer[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StaffTrainer[]) : [];
  } catch {
    return [];
  }
}

function write(value: StaffTrainer[]) {
  localStorage.setItem(KEY, JSON.stringify(value));
  window.dispatchEvent(new Event(EVT));
}

export type TrainerStatus = "active" | "waiting";

/**
 * A trainer profile is considered "complete" once the PT themself has filled
 * in every professional / safety field the Branch Manager cannot reasonably know.
 */
export function isTrainerProfileComplete(t: StaffTrainer): boolean {
  return Boolean(
    t.title?.trim() &&
      t.address?.trim() &&
      t.idNumber?.trim() &&
      t.idPhoto &&
      t.certification?.trim() &&
      t.certificationIssuer?.trim() &&
      t.certificationNumber?.trim() &&
      t.certificationExpiresAt &&
      t.certificationPhoto &&
      t.insuranceProvider?.trim(),
  );
}

/**
 * Status reflects only whether the PT has completed their professional
 * information. The Branch Manager's enable/disable toggle (`t.active`) only suspends
 * sign-in / activity and does NOT change this status.
 */
export function getTrainerStatus(t: StaffTrainer): TrainerStatus {
  return isTrainerProfileComplete(t) ? "active" : "waiting";
}

export function findTrainerByCredentials(
  username: string,
  password: string,
): StaffTrainer | null {
  const u = username.trim().toLowerCase();
  return (
    read().find(
      (t) => t.username.toLowerCase() === u && t.password === password,
    ) ?? null
  );
}

export function getTrainerById(id: string): StaffTrainer | null {
  return read().find((t) => t.id === id) ?? null;
}

export function useStaffTrainers(brandId?: string) {
  const [list, setList] = useState<StaffTrainer[]>([]);

  useEffect(() => {
    setList(read());
    const sync = () => setList(read());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const scoped = brandId ? list.filter((t) => t.brandId === brandId) : list;

  const create = useCallback((t: StaffTrainer) => {
    const next = [...read(), t];
    write(next);
    setList(next);
  }, []);

  const update = useCallback((id: string, patch: Partial<StaffTrainer>) => {
    const next = read().map((t) => (t.id === id ? { ...t, ...patch } : t));
    write(next);
    setList(next);
  }, []);

  const remove = useCallback((id: string) => {
    const next = read().filter((t) => t.id !== id);
    write(next);
    setList(next);
  }, []);

  return { trainers: scoped, create, update, remove };
}
