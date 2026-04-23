'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import NavBar from '@/components/NavBar';
import InfiniteTicker from '@/components/InfiniteTicker';
import PortfolioTable from '@/components/PortfolioTable';
import { usePortfolio } from '@/lib/usePortfolio';
import { Plus, X } from 'lucide-react';

export default function PortfolioPage() {
  const { data: session } = useSession();
  const { positions, rawPositions, lastUpdate, addPosition, removePosition } = usePortfolio();
  const [showAdd, setShowAdd] = useState(false);
  const [newPos, setNewPos] = useState({ ticker: '', shares: '', avgPrice: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!newPos.ticker || !newPos.shares || !newPos.avgPrice) return;
    setSubmitting(true);

    // Fetch info avant d'ajouter
    try {
      const res = await fetch(`/api/quote/${newPos.ticker.toUpperCase()}`);
      const data = await res.json();
      if (res.ok && data.name) {
        addPosition({
          ticker: newPos.ticker.toUpperCase(),
          name: data.name,
          shares: parseFloat(newPos.shares),
          avgPrice: parseFloat(newPos.avgPrice),
          sector: data.sector,
          currency: data.currency || 'USD',
        });
      } else {
        // Fallback sans enrichissement
        addPosition({
          ticker: newPos.ticker.toUpperCase(),
          name: newPos.ticker.toUpperCase(),
          shares: parseFloat(newPos.shares),
          avgPrice: parseFloat(newPos.avgPrice),
          currency: 'USD',
        });
      }
      setNewPos({ ticker: '', shares: '', avgPrice: '' });
      setShowAdd(false);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'ajout. Vérifie le ticker.');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen">
      <NavBar userName={session?.user?.name?.split(' ')[0]} />
      <InfiniteTicker />

      <div className="p-6 max-w-[1600px] mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[24px] font-bold text-neutral-900 tracking-tight">Portefeuille</h1>
            <p className="text-[12px] text-neutral-500 mt-0.5">
              {rawPositions.length} position{rawPositions.length !== 1 ? 's' : ''} · Stocké localement sur ton navigateur
            </p>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-neutral-900 text-white rounded-md px-4 py-2 text-[12px] font-semibold flex items-center gap-2 hover:bg-neutral-800"
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter position
          </button>
        </div>

        {showAdd && (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200/60 p-4">
            <div className="grid grid-cols-[1fr_1fr_1fr_auto_auto] gap-3">
              <input
                placeholder="Ticker (ex: NVDA, ASML)"
                value={newPos.ticker}
                onChange={(e) => setNewPos({ ...newPos, ticker: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-[12px] outline-none focus:ring-2 focus:ring-neutral-900"
              />
              <input
                type="number"
                placeholder="Nombre d'actions"
                value={newPos.shares}
                onChange={(e) => setNewPos({ ...newPos, shares: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-[12px] outline-none focus:ring-2 focus:ring-neutral-900"
              />
              <input
                type="number"
                placeholder="Prix de revient unitaire"
                value={newPos.avgPrice}
                onChange={(e) => setNewPos({ ...newPos, avgPrice: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-[12px] outline-none focus:ring-2 focus:ring-neutral-900"
              />
              <button
                onClick={handleAdd}
                disabled={submitting}
                className="bg-accent text-white rounded-md px-4 text-[12px] font-semibold disabled:opacity-50"
              >
                {submitting ? '...' : 'Valider'}
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="text-neutral-400 hover:text-neutral-700 px-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-neutral-500 mt-2">
              Tickers US : NVDA, MSFT, GOOGL. Tickers EU via Twelve Data : ASML, SAP.
            </p>
          </div>
        )}

        <PortfolioTable
          positions={positions}
          lastUpdate={lastUpdate}
          onDelete={removePosition}
          showDelete
          showAlerts={false}
        />
      </div>
    </div>
  );
}
