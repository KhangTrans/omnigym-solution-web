import { useCallback, useEffect, useState } from "react";
import {
  BRANDS as SEED_BRANDS,
  GYMS as SEED_GYMS,
  type Brand,
  type Gym,
  type Facility,
} from "./gyms-data";

const KEYS = {
  brands: "partner_brands_v2",
  gyms: "partner_gyms_v2",
  session: "partner_session_v2",
};

const EVT = "partner_store_changed";

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

export function useBrands() {
  const [brands, setBrands] = useStore<Brand[]>(KEYS.brands, SEED_BRANDS);
  return {
    brands,
    getBrand: (id: string) => brands.find((b) => b.id === id),
    update: (id: string, patch: Partial<Brand>) =>
      setBrands(brands.map((b) => (b.id === id ? { ...b, ...patch } : b))),
    create: (brand: Brand) => setBrands([...brands, brand]),
    upgradeToSystem: (id: string) =>
      setBrands(brands.map((b) => (b.id === id ? { ...b, type: "system" } : b))),
    reset: () => setBrands(SEED_BRANDS),
  };
}

export function useGyms() {
  const [gyms, setGyms] = useStore<Gym[]>(KEYS.gyms, SEED_GYMS);
  return {
    gyms,
    getGym: (id: string) => gyms.find((g) => g.id === id),
    branchesOf: (brandId: string) => gyms.filter((g) => g.brandId === brandId),
    update: (id: string, patch: Partial<Gym>) =>
      setGyms(gyms.map((g) => (g.id === id ? { ...g, ...patch } : g))),
    addGym: (gym: Gym) => setGyms([...gyms, gym]),
    removeGym: (id: string) => setGyms(gyms.filter((g) => g.id !== id)),
    updateFacility: (gymId: string, index: number, patch: Partial<Facility>) =>
      setGyms(
        gyms.map((g) =>
          g.id === gymId
            ? {
                ...g,
                facilities: g.facilities.map((f, i) =>
                  i === index ? { ...f, ...patch } : f,
                ),
              }
            : g,
        ),
      ),
    addFacility: (gymId: string, facility: Facility) =>
      setGyms(
        gyms.map((g) =>
          g.id === gymId ? { ...g, facilities: [...g.facilities, facility] } : g,
        ),
      ),
    removeFacility: (gymId: string, index: number) =>
      setGyms(
        gyms.map((g) =>
          g.id === gymId
            ? { ...g, facilities: g.facilities.filter((_, i) => i !== index) }
            : g,
        ),
      ),
    reset: () => setGyms(SEED_GYMS),
  };
}

export type PartnerSession = { brandId: string | null };

export function usePartnerSession() {
  const [session, setSession] = useStore<PartnerSession>(KEYS.session, {
    brandId: null,
  });
  return {
    session,
    signIn: (brandId: string) => setSession({ brandId }),
    signOut: () => setSession({ brandId: null }),
  };
}