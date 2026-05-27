import { useCallback, useEffect, useState } from "react";

export type UserRole = "customer" | "gym" | "trainer";

export type AppUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  /** brandId when role === "gym", trainerId when role === "trainer" */
  linkedId?: string;
  avatar?: string;
  createdAt: string;
};

const KEY = "app_current_user_v1";
const EVT = "app_user_changed";

function read(): AppUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AppUser) : null;
  } catch {
    return null;
  }
}

function write(value: AppUser | null) {
  if (value) localStorage.setItem(KEY, JSON.stringify(value));
  else localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVT));
}

export function useCurrentUser() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setUser(read());
    setLoaded(true);
    const sync = () => setUser(read());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const signUp = useCallback(
    (data: Omit<AppUser, "id" | "role" | "createdAt"> & { role?: UserRole }) => {
      const next: AppUser = {
        id: `u-${Date.now().toString(36)}`,
        role: data.role ?? "customer",
        createdAt: new Date().toISOString(),
        ...data,
      };
      write(next);
      setUser(next);
      return next;
    },
    [],
  );

  const update = useCallback((patch: Partial<AppUser>) => {
    const curr = read();
    if (!curr) return;
    const next = { ...curr, ...patch };
    write(next);
    setUser(next);
  }, []);

  const signOut = useCallback(() => {
    write(null);
    setUser(null);
  }, []);

  return { user, loaded, signUp, update, signOut };
}
