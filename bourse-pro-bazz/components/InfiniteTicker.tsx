'use client';

import { useEffect, useState } from 'react';

type MacroItem = {
  label: string;
  symbol: string;
  type: string;
  value: number;
  change: number;
};

type MarketStatus = {
  isOpen: boolean;
  session: string;
  exchange: string;
};

export default function InfiniteTicker() {
  const [macro, setMacro] = useState<MacroItem[]>([]);
  const [market, setMarket] = useState<MarketStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMacro = async () => {
      try {
        const res = await fetch('/api/macro');
        const data = await res.json();
        setMacro(data.macro || []);
        setMarket(data.market || null);
      } catch (err) {
        console.error('Erreur fetch macro:', err);
      }
      setLoading(false);
    };

    fetchMacro();
    const interval = setInterval(fetchMacro, 300000); // refresh 5 min
    return () => clearInterval(interval);
  }, []);

  if (loading && macro.length === 0) {
    return (
      <div className="bg-white border-b border-neutral-200 px-6 py-2.5 overflow-hidden">
        <div className="flex items-center gap-2 text-[11px] text-neutral-400">
          <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 animate-pulse" />
          Chargement des données marché...
        </div>
      </div>
    );
  }

  // On double la liste pour créer l'effet infini continu
  const doubledMacro = [...macro, ...macro];

  return (
    <div className="bg-white border-b border-neutral-200 overflow-hidden relative">
      <div className="flex items-center">
        {/* Status marché fixe à gauche */}
        <div className="flex-shrink-0 px-4 py-2.5 border-r border-neutral-200 bg-neutral-50/50 z-10">
          <div className="flex items-center gap-2 text-[11px] whitespace-nowrap">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                market?.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'
              }`}
            />
            <span className="font-semibold text-neutral-700">
              {market?.isOpen ? 'Marché US ouvert' : 'Marché US fermé'}
            </span>
          </div>
        </div>

        {/* Ticker défilant */}
        <div className="flex-1 overflow-hidden relative">
          <div
            className="flex items-center gap-8 py-2.5 whitespace-nowrap"
            style={{
              animation: 'scroll-ticker 90s linear infinite',
              width: 'max-content',
            }}
          >
            {doubledMacro.map((m, i) => (
              <div key={`${m.symbol}-${i}`} className="flex items-center gap-2 px-2">
                <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                  {m.label}
                </span>
                <span className="text-[13px] font-semibold text-neutral-900 tabular-nums">
                  {m.value.toFixed(2)}
                </span>
                <span
                  className={`text-[11px] font-semibold tabular-nums ${
                    m.change >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {m.change >= 0 ? '+' : ''}
                  {m.change.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fade edges */}
      <div className="absolute top-0 right-0 h-full w-12 bg-gradient-to-l from-white to-transparent pointer-events-none" />
    </div>
  );
}
