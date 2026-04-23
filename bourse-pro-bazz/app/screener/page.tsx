'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import NavBar from '@/components/NavBar';
import InfiniteTicker from '@/components/InfiniteTicker';
import { ArrowUpRight } from 'lucide-react';
import { usePortfolio } from '@/lib/usePortfolio';

type Stock = {
  ticker: string;
  name: string;
  sector: string;
  region: string;
  pe: number;
  roic: number;
  revenueGrowth: number;
  grossMargin: number;
  netMargin: number;
  score: number;
  high52: number;
  low52: number;
};

export default function ScreenerPage() {
  const { data: session } = useSession();
  const { addPosition } = usePortfolio();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    minScore: 70,
    sector: 'all',
    region: 'all',
  });

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      minScore: String(filters.minScore),
      sector: filters.sector,
      region: filters.region,
    });
    fetch(`/api/screener?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setStocks(d.stocks || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [filters]);

  return (
    <div className="min-h-screen">
      <NavBar userName={session?.user?.name?.split(' ')[0]} />
      <InfiniteTicker />

      <div className="p-6 max-w-[1600px] mx-auto space-y-4">
        <div>
          <h1 className="text-[24px] font-bold text-neutral-900 tracking-tight">Screener</h1>
          <p className="text-[12px] text-neutral-500 mt-0.5">
            Univers tech filtré par critères fondamentaux · {stocks.length} titres
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200/60 p-4 grid grid-cols-3 gap-6">
          <div>
            <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">
              Score min : <span className="text-accent font-bold">{filters.minScore}</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.minScore}
              onChange={(e) => setFilters({ ...filters, minScore: +e.target.value })}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">
              Secteur
            </label>
            <select
              value={filters.sector}
              onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
              className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-md text-[12px] outline-none"
            >
              <option value="all">Tous</option>
              <option value="Semi">Semi-conducteurs</option>
              <option value="Software">Software</option>
              <option value="Internet">Internet</option>
              <option value="Cyber">Cybersécurité</option>
              <option value="Hardware">Hardware</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">
              Région
            </label>
            <select
              value={filters.region}
              onChange={(e) => setFilters({ ...filters, region: e.target.value })}
              className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-md text-[12px] outline-none"
            >
              <option value="all">Toutes</option>
              <option value="US">US</option>
              <option value="EU">Europe</option>
              <option value="Asie">Asie</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200/60 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-[13px] text-neutral-500">
              Analyse de l&apos;univers en cours...
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-neutral-50/50">
                <tr className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-2.5">#</th>
                  <th className="text-left px-3 py-2.5">Titre</th>
                  <th className="text-right px-3 py-2.5">Score</th>
                  <th className="text-right px-3 py-2.5">P/E</th>
                  <th className="text-right px-3 py-2.5">ROIC</th>
                  <th className="text-right px-3 py-2.5">Croissance</th>
                  <th className="text-right px-3 py-2.5">Marge brute</th>
                  <th className="text-right px-3 py-2.5">52W H/L</th>
                  <th className="text-center px-3 py-2.5">Région</th>
                  <th className="px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((s, i) => (
                  <tr key={s.ticker} className="border-t border-neutral-100 hover:bg-neutral-50/50">
                    <td className="px-4 py-2.5 text-[11px] tabular-nums text-neutral-400 font-semibold">
                      {i + 1}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[10px] font-bold bg-neutral-100 text-neutral-900 px-1.5 py-0.5 rounded">
                          {s.ticker}
                        </span>
                        <div>
                          <div className="text-[13px] font-semibold text-neutral-900 leading-tight">
                            {s.name}
                          </div>
                          <div className="text-[10px] text-neutral-500">{s.sector}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-right px-3 py-2.5">
                      <span
                        className={`text-[14px] font-bold tabular-nums ${
                          s.score >= 90 ? 'text-accent' : s.score >= 80 ? 'text-neutral-900' : 'text-neutral-400'
                        }`}
                      >
                        {s.score}
                      </span>
                    </td>
                    <td className="text-right px-3 py-2.5 text-[13px] tabular-nums text-neutral-700">
                      {s.pe > 0 ? s.pe.toFixed(1) : '--'}
                    </td>
                    <td className="text-right px-3 py-2.5 text-[13px] tabular-nums text-neutral-700">
                      {s.roic > 0 ? `${s.roic.toFixed(1)}%` : '--'}
                    </td>
                    <td
                      className={`text-right px-3 py-2.5 text-[13px] tabular-nums font-semibold ${
                        s.revenueGrowth > 0 ? 'text-emerald-600' : 'text-neutral-400'
                      }`}
                    >
                      {s.revenueGrowth > 0 ? `+${s.revenueGrowth.toFixed(0)}%` : '--'}
                    </td>
                    <td className="text-right px-3 py-2.5 text-[13px] tabular-nums text-neutral-700">
                      {s.grossMargin > 0 ? `${s.grossMargin.toFixed(0)}%` : '--'}
                    </td>
                    <td className="text-right px-3 py-2.5 text-[11px] tabular-nums text-neutral-500">
                      {s.high52 > 0 ? `${s.high52.toFixed(0)} / ${s.low52.toFixed(0)}` : '--'}
                    </td>
                    <td className="text-center px-3 py-2.5">
                      <span className="text-[10px] font-semibold bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded">
                        {s.region}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button className="text-neutral-400 hover:text-accent">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
