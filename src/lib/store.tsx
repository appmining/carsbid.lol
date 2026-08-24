"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CARS } from "@/data/cars";
import type { Patron } from "@/lib/types";
import { supabasePublic } from "@/lib/supabase/publicClient";

const STORAGE_KEY = "carsbid_v1";
const VISIT_FLAG_KEY = "carsbid_visit_registered";

interface PersistedState {
  votedSlugs: string[];
}

interface CarsStoreValue {
  hydrated: boolean;
  online: number;
  getVotes: (slug: string) => number;
  hasVoted: (slug: string) => boolean;
  vote: (slug: string) => void;
  getPatron: (slug: string) => Patron | null;
  refreshPatrons: () => void;
  totalVotes: number;
  totalVisits: number;
  totalRevenue: number;
}

const CarsContext = createContext<CarsStoreValue | null>(null);

function loadState(): PersistedState {
  if (typeof window === "undefined") {
    return { votedSlugs: [] };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { votedSlugs: [] };
    const parsed = JSON.parse(raw);
    return { votedSlugs: parsed.votedSlugs ?? [] };
  } catch {
    return { votedSlugs: [] };
  }
}

export function CarsProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [votedSlugs, setVotedSlugs] = useState<Set<string>>(new Set());
  const [patrons, setPatrons] = useState<Record<string, Patron>>({});
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [visits, setVisits] = useState(0);
  const [online, setOnline] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshPatrons = useCallback(() => {
    fetch("/api/patrons")
      .then((res) => res.json())
      .then((data) => setPatrons(data.patrons ?? {}))
      .catch(() => {});
  }, []);

  const refreshStats = useCallback(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        setVotes(data.votes ?? {});
        setVisits(data.visits ?? 0);
      })
      .catch(() => {});
  }, []);

  // One-time hydration from localStorage after mount — must run after the
  // SSR-matching initial render, so this can't be a lazy useState initializer.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const state = loadState();
    setVotedSlugs(new Set(state.votedSlugs));
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    refreshPatrons();
    refreshStats();
  }, [refreshPatrons, refreshStats]);

  // Register a visit once per browser tab session (not on every render/HMR).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(VISIT_FLAG_KEY)) return;
    window.sessionStorage.setItem(VISIT_FLAG_KEY, "1");
    fetch("/api/visit", { method: "POST" })
      .then((res) => res.json())
      .then((data) => setVisits(data.visits ?? 0))
      .catch(() => {});
  }, []);

  // Real concurrent-visitor count via Supabase Realtime presence.
  useEffect(() => {
    const supabase = supabasePublic();
    const channel = supabase.channel("site-presence", {
      config: { presence: { key: crypto.randomUUID() } },
    });
    channel
      .on("presence", { event: "sync" }, () => {
        setOnline(Object.keys(channel.presenceState()).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const payload: PersistedState = { votedSlugs: Array.from(votedSlugs) };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }, 150);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [hydrated, votedSlugs]);

  const getVotes = useCallback((slug: string) => votes[slug] ?? 0, [votes]);

  const hasVoted = useCallback((slug: string) => votedSlugs.has(slug), [votedSlugs]);

  const vote = useCallback(
    (slug: string) => {
      if (votedSlugs.has(slug)) return;
      setVotedSlugs((prev) => {
        const next = new Set(prev);
        next.add(slug);
        return next;
      });
      fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (typeof data.votes === "number") {
            setVotes((prev) => ({ ...prev, [slug]: data.votes }));
          }
        })
        .catch(() => {});
    },
    [votedSlugs]
  );

  const getPatron = useCallback(
    (slug: string): Patron | null => {
      return patrons[slug] ?? null;
    },
    [patrons]
  );

  const totalVotes = useMemo(
    () => CARS.reduce((sum, c) => sum + (votes[c.slug] ?? 0), 0),
    [votes]
  );

  const totalRevenue = useMemo(() => {
    return CARS.reduce((sum, c) => sum + (patrons[c.slug]?.price ?? 0), 0);
  }, [patrons]);

  const value: CarsStoreValue = {
    hydrated,
    online,
    getVotes,
    hasVoted,
    vote,
    getPatron,
    refreshPatrons,
    totalVotes,
    totalVisits: visits,
    totalRevenue,
  };

  return <CarsContext.Provider value={value}>{children}</CarsContext.Provider>;
}

export function useCarsStore(): CarsStoreValue {
  const ctx = useContext(CarsContext);
  if (!ctx) throw new Error("useCarsStore must be used within CarsProvider");
  return ctx;
}
