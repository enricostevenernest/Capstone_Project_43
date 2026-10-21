"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { fetchReferenceData, staticReference, type ReferenceData, type ReferenceSource } from "@/lib/reference";

interface ReferenceContextValue {
  data: ReferenceData;
  source: ReferenceSource;
  loading: boolean;
  /** Muat ulang setelah admin mengubah lowongan atau target */
  reload: () => Promise<void>;
}

const ReferenceContext = createContext<ReferenceContextValue>({
  data: staticReference,
  source: "static",
  loading: false,
  reload: async () => {},
});

export function ReferenceProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ReferenceData>(staticReference);
  const [source, setSource] = useState<ReferenceSource>("static");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const res = await fetchReferenceData();
    setData(res.data);
    setSource(res.source);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchReferenceData().then((res) => {
      if (cancelled) return;
      setData(res.data);
      setSource(res.source);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return <ReferenceContext.Provider value={{ data, source, loading, reload }}>{children}</ReferenceContext.Provider>;
}

export function useReferenceData() {
  return useContext(ReferenceContext);
}
