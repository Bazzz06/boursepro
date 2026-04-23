'use client';

import { useState, useEffect } from 'react';

export type Position = {
  ticker: string;
  name: string;
  shares: number;
  avgPrice: number;
  sector?: string;
  currency?: string;
  addedAt: number;
};

export type LivePosition = Position & {
  currentPrice: number;
  dayChange: number;
  logo?: string;
  error?: boolean;
};

const STORAGE_KEY = 'bourse-pro-portfolio-v1';

export function usePortfolio() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [livePositions, setLivePositions] = useState<LivePosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  // Charger depuis localStorage au mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPositions(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Erreur lecture localStorage:', err);
    }
    setLoading(false);
  }, []);

  // Persister dans localStorage à chaque changement
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
      } catch (err) {
        console.error('Erreur écriture localStorage:', err);
      }
    }
  }, [positions, loading]);

  // Fetch quotes live
  const refreshQuotes = async () => {
    if (positions.length === 0) {
      setLivePositions([]);
      return;
    }

    const quotes = await Promise.all(
      positions.map(async (p) => {
        try {
          const res = await fetch(`/api/quote/${p.ticker}`);
          if (!res.ok) throw new Error('fetch failed');
          const data = await res.json();
          return {
            ...p,
            currentPrice: data.price || p.avgPrice,
            dayChange: data.changePercent || 0,
            logo: data.logo,
            sector: p.sector || data.sector,
            currency: p.currency || data.currency,
          };
        } catch (err) {
          console.error(`Erreur quote ${p.ticker}:`, err);
          return { ...p, currentPrice: p.avgPrice, dayChange: 0, error: true };
        }
      })
    );

    setLivePositions(quotes);
    setLastUpdate(Date.now());
  };

  // Refresh au mount + toutes les 60 secondes
  useEffect(() => {
    if (loading) return;
    refreshQuotes();
    const interval = setInterval(refreshQuotes, 60000);
    return () => clearInterval(interval);
  }, [positions, loading]);

  const addPosition = (pos: Omit<Position, 'addedAt'>) => {
    setPositions([...positions, { ...pos, addedAt: Date.now() }]);
  };

  const removePosition = (ticker: string) => {
    setPositions(positions.filter((p) => p.ticker !== ticker));
  };

  const updatePosition = (ticker: string, updates: Partial<Position>) => {
    setPositions(positions.map((p) => (p.ticker === ticker ? { ...p, ...updates } : p)));
  };

  return {
    positions: livePositions,
    rawPositions: positions,
    loading,
    lastUpdate,
    addPosition,
    removePosition,
    updatePosition,
    refreshQuotes,
  };
}
