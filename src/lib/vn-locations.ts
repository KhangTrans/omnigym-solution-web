import { useEffect, useState } from "react";

export type VnDistrict = { code: number; name: string };
export type VnProvince = { code: number; name: string; districts: VnDistrict[] };

const API = "https://provinces.open-api.vn/api/v1/?depth=2";
const CACHE_KEY = "vn_provinces_v1";

let inflight: Promise<VnProvince[]> | null = null;

export async function fetchProvinces(): Promise<VnProvince[]> {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) return JSON.parse(raw) as VnProvince[];
    } catch {
      /* ignore */
    }
  }
  if (!inflight) {
    inflight = fetch(API)
      .then((r) => {
        if (!r.ok) throw new Error(`Provinces API failed: ${r.status}`);
        return r.json() as Promise<VnProvince[]>;
      })
      .then((data) => {
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch {
          /* ignore quota */
        }
        return data;
      })
      .catch((err) => {
        inflight = null;
        throw err;
      });
  }
  return inflight;
}

export function useProvinces() {
  const [provinces, setProvinces] = useState<VnProvince[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchProvinces()
      .then((data) => {
        if (!cancelled) setProvinces(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? "Failed to load provinces");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { provinces, loading, error };
}