'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import NavBar from '@/components/NavBar';
import InfiniteTicker from '@/components/InfiniteTicker';
import { Plus, X, Bell } from 'lucide-react';

type WatchItem = {
  ticker: string;
  name?: string;
  targetPrice: number;
  currentPrice?: number;
  dayChange?: number;
  sector?: string;
  addedAt: number;
};

const STORAGE_KEY = 'bourse-pro-watchlist-v1';

function fmtPct(val: number): string {
  return `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;
}

export default function WatchlistPage() {
  const { data: session } = useSession();
  const [watchlist, setWatchlist] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ ticker: '', targetPrice: '' });

  // Load + enrich
  useEffect(() => {
    const load = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
          setLoading(false);
          return;
        }
        const items: WatchItem[] = JSON.parse(stored);

        const enriched = await Promise.all(
          items.map(async (item) => {
            try {
              const res = await fetch(`/api/quote/${item.ticker}`);
              const data = await res.json();
              return {
                ...item,
                name: data.name || item.ticker,
                currentPrice: data.price,
                dayChange: data.changePercent,
                sector: data.sector,
              };
            } catch {
              return item;
            }
          })
        );
        setWatchlist(enriched);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    load();
  }, []);

  // Persist (sans les données live)
  useEffect(() => {
    if (loading) return;
    const toStore = watchlist.map((w) => ({
      ticker: w.ticker,
      targetPrice: w.targetPrice,
      addedAt: w.addedAt,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  }, [watchlist, loading]);

  const handleAdd = async () => {
    if (!newItem.ticker || !newItem.targetPrice) return;
    const ticker = newItem.ticker.toUpperCase();
    try {
      const res = await fetch(`/api/quote/${ticker}`);
      const data = await res.json();
      setWatchlist([
        ...watchlist,
        {
          ticker,
          name: data.name || ticker,
          targetPrice: parseFloat(newItem.targetPrice),
          currentPrice: data.price,
          dayChange: data.changePercent,
          sector: data.sector,
          addedAt: Date.now(),
        },
      ]);
      setNewItem({ ticker: '', targetPrice: '' });
      setShowAdd(false);
    } catch (err) {
      alert('Erreur ticker invalide');
    }
  };

  const handleRemove = (ticker: string) => {
    setWatchlist(watchlist.filter((w) => w.ticker !== ticker));
  };

  return (
    <div className="min-h-screen">
      <NavBar userName={session?.user?.name?.split(' ')[0]} />
      <InfiniteTicker />

      <div className="p-6 max-w-[1600px] mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[24px] font-bold text-neutral-900 tracking-tight">Watchlist</h1>
            <p className="text-[12px] text-neutral-500 mt-0.5">
              {watchlist.length} cible{watchlist.length !== 1 ? 's' : ''} avec prix d&apos;entrée visé
            </p>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-neutral-900 text-white rounded-md px-4 py-2 text-[12px] font-semibold flex items-center gap-2 hover:bg-neutral-800"
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter cible
          </button>
        </div>

        {showAdd && (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200/60 p-4">
            <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-3">
              <input
                placeholder="Ticker"
                value={newItem.ticker}
                onChange={(e) => setNewItem({ ...newItem, ticker: e.target.value })}
                className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-[12px] outline-none focus:ring-2 focus:ring-neutral-900"
              />
              <input
                type="number"
                placeholder="Prix cible d'achat"
                value={newItem.targetPrice}
                onChange={(e) => setNewItem({ ...newItem, targetPrice: e.target.value })}
                className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-[12px] outline-none focus:ring-2 focus:ring-neutral-900"
              />
              <button
                onClick={handleAdd}
                className="bg-accent text-white rounded-md px-4 text-[12px] font-semibold"
              >
                Valider
              </button>
              <button onClick={() => setShowAdd(false)} className="text-neutral-400 hover:text-neutral-700 px-2">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200/60 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-[13px] text-neutral-500">Chargement...</div>
          ) : watchlist.length === 0 ? (
            <div className="p-12 text-center text-[13px] text-neutral-500">
              Aucune cible. Ajoute des titres à surveiller avec un prix d&apos;entrée visé.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-neutral-50/50">
                <tr className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-2.5">Titre</th>
                  <th className="text-right px-3 py-2.5">Cours actuel</th>
                  <th className="text-right px-3 py-2.5">Jour</th>
                  <th className="text-right px-3 py-2.5">Prix cible</th>
                  <th className="text-right px-3 py-2.5">Distance</th>
                  <th className="text-left px-3 py-2.5 w-1/4">Progression</th>
                  <th className="text-center px-3 py-2.5">Statut</th>
                  <th className="px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map((w) => {
                  const current = w.currentPrice || 0;
                  const distance = current > 0 ? ((current - w.targetPrice) / w.targetPrice) * 100 : 0;
                  const near = Math.abs(distance) < 10 && Math.abs(distance) > 0;
                  const atTarget = current > 0 && current <= w.targetPrice;
                  return (
                    <tr key={w.ticker} className="border-t border-neutral-100 hover:bg-neutral-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-[10px] font-bold bg-neutral-100 text-neutral-900 px-1.5 py-0.5 rounded">
                            {w.ticker}
                          </span>
                          <div>
                            <div className="text-[13px] font-semibold text-neutral-900">{w.name}</div>
                            <div className="text-[10px] text-neutral-500">{w.sector || '--'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-right px-3 py-3 text-[14px] font-bold tabular-nums">
                        {current > 0 ? `$${current.toFixed(2)}` : '--'}
                      </td>
                      <td
                        className={`text-right px-3 py-3 text-[12px] tabular-nums font-semibold ${
                          (w.dayChange || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {w.dayChange !== undefined ? fmtPct(w.dayChange) : '--'}
                      </td>
                      <td className="text-right px-3 py-3 text-[14px] font-bold text-accent tabular-nums">
                        ${w.targetPrice.toFixed(2)}
                      </td>
                      <td
                        className={`text-right px-3 py-3 text-[13px] tabular-nums font-semibold ${
                          atTarget ? 'text-emerald-600' : near ? 'text-amber-600' : 'text-neutral-600'
                        }`}
                      >
                        {current > 0 ? `${distance > 0 ? '-' : '+'}${Math.abs(distance).toFixed(1)}%` : '--'}
                      </td>
                      <td className="px-3 py-3">
                        <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-accent to-amber-400"
                            style={{ width: `${Math.max(0, Math.min(100, 100 - Math.abs(distance) * 5))}%` }}
                          />
                        </div>
                      </td>
                      <td className="text-center px-3 py-3">
                        {atTarget && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                            <Bell className="w-2.5 h-2.5" />
                            CIBLE ATTEINTE
                          </span>
                        )}
                        {near && !atTarget && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                            PROCHE
                          </span>
                        )}
                        {!near && !atTarget && current > 0 && (
                          <span className="text-[10px] text-neutral-400">En attente</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => handleRemove(w.ticker)}
                          className="text-neutral-300 hover:text-red-500 text-[16px]"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
