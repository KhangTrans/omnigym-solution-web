import { useCallback, useEffect, useState } from "react";

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type TrainerSession = {
  id: string;
  trainerId: string;
  day: DayKey;
  time: string; // "HH:MM"
  duration: number; // minutes
  title: string;
  location: string;
  level: "Beginner" | "Inter." | "Advanced" | "All";
  capacity: number;
  booked: number;
  notes: string;
  createdAt: string;
};

const KEY = "gym_trainer_sessions_v1";
const EVT = "gym_trainer_sessions_changed";

function read(): TrainerSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TrainerSession[]) : [];
  } catch {
    return [];
  }
}

function write(value: TrainerSession[]) {
  localStorage.setItem(KEY, JSON.stringify(value));
  window.dispatchEvent(new Event(EVT));
}

export function useTrainerSessions(trainerId?: string) {
  const [list, setList] = useState<TrainerSession[]>([]);

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

  const scoped = trainerId ? list.filter((s) => s.trainerId === trainerId) : list;

  const create = useCallback((s: TrainerSession) => {
    const next = [...read(), s];
    write(next);
    setList(next);
  }, []);

  const update = useCallback((id: string, patch: Partial<TrainerSession>) => {
    const next = read().map((s) => (s.id === id ? { ...s, ...patch } : s));
    write(next);
    setList(next);
  }, []);

  const remove = useCallback((id: string) => {
    const next = read().filter((s) => s.id !== id);
    write(next);
    setList(next);
  }, []);

  return { sessions: scoped, create, update, remove };
}

export const DAY_OPTIONS: { key: DayKey; label: string; date: string }[] = [
  { key: "mon", label: "Mon", date: "12" },
  { key: "tue", label: "Tue", date: "13" },
  { key: "wed", label: "Wed", date: "14" },
  { key: "thu", label: "Thu", date: "15" },
  { key: "fri", label: "Fri", date: "16" },
  { key: "sat", label: "Sat", date: "17" },
  { key: "sun", label: "Sun", date: "18" },
];