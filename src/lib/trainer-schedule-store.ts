import { useCallback, useEffect, useState } from "react";

/**
 * A trainer "closure" — the trainer has marked this 90-minute window as
 * unavailable. By default every future slot is OPEN for student booking;
 * trainers only need to record exceptions (vacation, sickness, gym closed,
 * personal time, etc.) with a reason that students can see.
 *
 * `date` is `YYYY-MM-DD`, `time` is `HH:MM`.
 */
export type TrainerClosure = {
  id: string;
  trainerId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (start)
  reason: string;
  createdAt: string;
};

/** Fixed 90-minute slots, 06:00 → 21:00 (matches the customer booking grid). */
export const SCHEDULE_SLOTS = [
  "06:00",
  "07:30",
  "09:00",
  "10:30",
  "12:00",
  "13:30",
  "15:00",
  "16:30",
  "18:00",
  "19:30",
] as const;

export const SESSION_LEN_MIN = 90;

const KEY = "gym_trainer_closures_v1";
const EVT = "gym_trainer_closures_changed";

function read(): TrainerClosure[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TrainerClosure[]) : [];
  } catch {
    return [];
  }
}

function write(value: TrainerClosure[]) {
  localStorage.setItem(KEY, JSON.stringify(value));
  window.dispatchEvent(new Event(EVT));
}

/** Read closures for a trainer (safe to call outside React). */
export function getClosures(trainerId: string): TrainerClosure[] {
  return read().filter((c) => c.trainerId === trainerId);
}

export function useTrainerClosures(trainerId?: string) {
  const [list, setList] = useState<TrainerClosure[]>([]);

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

  const scoped = trainerId
    ? list.filter((c) => c.trainerId === trainerId)
    : list;

  /** Close a 90-min slot with a reason (no-op if already closed). */
  const close = useCallback(
    (tid: string, date: string, time: string, reason: string) => {
      const all = read();
      const existing = all.find(
        (c) => c.trainerId === tid && c.date === date && c.time === time,
      );
      if (existing) {
        const next = all.map((c) =>
          c.id === existing.id ? { ...c, reason } : c,
        );
        write(next);
        setList(next);
        return;
      }
      const closure: TrainerClosure = {
        id: `tc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        trainerId: tid,
        date,
        time,
        reason,
        createdAt: new Date().toISOString(),
      };
      const next = [...all, closure];
      write(next);
      setList(next);
    },
    [],
  );

  /** Re-open a 90-min slot (delete its closure). */
  const reopen = useCallback((id: string) => {
    const next = read().filter((c) => c.id !== id);
    write(next);
    setList(next);
  }, []);

  /** Remove every closure matching a predicate. */
  const reopenMany = useCallback((predicate: (c: TrainerClosure) => boolean) => {
    const next = read().filter((c) => !predicate(c));
    write(next);
    setList(next);
  }, []);

  return { closures: scoped, close, reopen, reopenMany };
}

// ---------------------------------------------------------------------------
// Trainer days off — a whole-day lock. When set, every slot on that date is
// rendered as unavailable and CANNOT be edited individually (the trainer must
// remove the day-off first to regain per-slot control).
// ---------------------------------------------------------------------------

export type TrainerDayOff = {
  id: string;
  trainerId: string;
  date: string; // YYYY-MM-DD
  reason: string;
  createdAt: string;
};

const DAYOFF_KEY = "gym_trainer_days_off_v1";
const DAYOFF_EVT = "gym_trainer_days_off_changed";

function readDaysOff(): TrainerDayOff[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DAYOFF_KEY);
    return raw ? (JSON.parse(raw) as TrainerDayOff[]) : [];
  } catch {
    return [];
  }
}

function writeDaysOff(value: TrainerDayOff[]) {
  localStorage.setItem(DAYOFF_KEY, JSON.stringify(value));
  window.dispatchEvent(new Event(DAYOFF_EVT));
}

/** Read days off for a trainer (safe to call outside React). */
export function getDaysOff(trainerId: string): TrainerDayOff[] {
  return readDaysOff().filter((d) => d.trainerId === trainerId);
}

export function useTrainerDaysOff(trainerId?: string) {
  const [list, setList] = useState<TrainerDayOff[]>([]);

  useEffect(() => {
    setList(readDaysOff());
    const sync = () => setList(readDaysOff());
    window.addEventListener(DAYOFF_EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DAYOFF_EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const scoped = trainerId
    ? list.filter((d) => d.trainerId === trainerId)
    : list;

  /** Mark a whole day off (updates the reason if already set). */
  const setDayOff = useCallback(
    (tid: string, date: string, reason: string) => {
      const all = readDaysOff();
      const existing = all.find(
        (d) => d.trainerId === tid && d.date === date,
      );
      if (existing) {
        const next = all.map((d) =>
          d.id === existing.id ? { ...d, reason } : d,
        );
        writeDaysOff(next);
        setList(next);
        return;
      }
      const entry: TrainerDayOff = {
        id: `td_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        trainerId: tid,
        date,
        reason,
        createdAt: new Date().toISOString(),
      };
      const next = [...all, entry];
      writeDaysOff(next);
      setList(next);
    },
    [],
  );

  /** Remove a day-off entry by id. */
  const removeDayOff = useCallback((id: string) => {
    const next = readDaysOff().filter((d) => d.id !== id);
    writeDaysOff(next);
    setList(next);
  }, []);

  return { daysOff: scoped, setDayOff, removeDayOff };
}