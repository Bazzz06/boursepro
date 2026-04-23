'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import NavBar from '@/components/NavBar';
import InfiniteTicker from '@/components/InfiniteTicker';
import PortfolioTable from '@/components/PortfolioTable';
import KpiCard from '@/components/KpiCard';
import { usePortfolio } from '@/lib/usePortfolio';
import { Zap, Bell, Calendar, Globe } from 'lucide-react';

function fmtCur(val: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(val);
}

function fmtPct(val: number): string {
  return `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;
}

type News = {
  ticker: string;
  title: string;
  source: string;
  datetime: number;
  url: string;
};

type Earning = {
  date: string;
  ticker: string;
  epsEstimate: number | null;
  time: string;
  inPortfolio: boolean;
};

const MACRO_EVENTS = [
  { date: '23/04', label: 'PMI Flash US', impact: 'high' },
  { date: '25/04', label: 'PIB US Q1', impact: 'high' },
  { date: '30/04', label: 'Inflation PCE', impact: 'high' },
  { date: '07/05', label: 'FOMC Meeting', impact: 'critical' },
];

export default function HomePage() {
  const { data: session } = useSession();
  const { positions, lastUpdate, loading } = usePortfolio();
  const [news, setNews] = useState<News[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);

  // Fetch news quand portfolio change
  useEffect(() => {
    if (positions.length === 0) return;
    const tickers = positions.map((p) => p.ticker);
    fetch('/api/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tickers }),
    })
      .then((r) => r.json())
      .then((d) => setNews(d.news || []))
      .catch(console.error);
  }, [positions.length]);

  // Fetch earnings
  useEffect(() => {
    const tickers = positions.map((p) => p.ticker).join(',');
    fetch(`/api/earnings?tickers=${tickers}`)
      .then((r) => r.json())
      .then((d) => setEarnings((d.earnings || []).slice(0, 6)))
      .catch(console.error);
  }, [positions.length]);

  // Fetch opportunités
  useEffect(() => {
    fetch('/api/screener?minScore=85')
      .then((r) => r.json())
      .then((d) => {
        const portfolioSet = new Set(positions.map((p) => p.ticker));
        setOpportunities(
          (d.stocks || [])
            .filter((s: any) => !portfolioSet.has(s.ticker))
            .slice(0, 5)
        );
      })
      .catch(console.error);
  }, [positions.length]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <NavBar userName={session?.user?.name?.split(' ')[0]} />
        <div className="p-6 text-center text-neutral-500">Chargement...</div>
      </div>
    );
  }

  // Calculs portefeuille
  const totalValue = positions.reduce((s, p) => s + p.shares * p.currentPrice, 0);
  const totalCost = positions.reduce((s, p) => s + p.shares * p.avgPrice, 0);
  const totalPL = totalValue - totalCost;
  const totalPLPct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;
  const dayPL = positions.reduce((s, p) => s + p.shares * p.currentPrice * (p.dayChange / 100), 0);
  const dayPLPct = totalValue > 0 ? (dayPL / totalValue) * 100 : 0;

  return (
    <div className="min-h-screen">
      <NavBar userName={session?.user?.name?.split(' ')[0]} />
      <InfiniteTicker />

      <div className="p-6 max-w-[1600px] mx-auto space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-5 gap-3">
          <KpiCard
            label="Valeur portefeuille"
            value={fmtCur(totalValue, 'EUR')}
            subValue={`Coût : ${fmtCur(totalCost, 'EUR')}`}
          />
          <KpiCard
            label="Perf aujourd'hui"
            value={`${dayPL >= 0 ? '+' : ''}${fmtCur(dayPL, 'EUR')}`}
            subValue={fmtPct(dayPLPct)}
            trend={dayPL}
          />
          <KpiCard
            label="Plus-value totale"
            value={`${totalPL >= 0 ? '+' : ''}${fmtCur(totalPL, 'EUR')}`}
            subValue={fmtPct(totalPLPct)}
            trend={totalPL}
          />
          <KpiCard
            label="vs Nasdaq 100 YTD"
            value="À calculer"
            subValue={`Ptf ${fmtPct(totalPLPct)}`}
          />
          <KpiCard
            label="Cash disponible"
            value={fmtCur(0, 'EUR')}
            subValue="À renseigner manuellement"
            variant="dark"
          />
        </div>

        {/* Tableau positions */}
        <PortfolioTable positions={positions} lastUpdate={lastUpdate} />

        {/* 3 colonnes : Opportunités / News / Earnings + Macro */}
        <div className="grid grid-cols-3 gap-4">
          {/* OPPORTUNITÉS */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200/60">
            <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-accent" />
                <h3 className="text-[13px] font-semibold text-neutral-900">Opportunités détectées</h3>
              </div>
              <span className="text-[10px] font-bold bg-accent-soft text-accent px-1.5 py-0.5 rounded">
                {opportunities.length}
              </span>
            </div>
            {opportunities.length === 0 ? (
              <div className="p-6 text-center text-[12px] text-neutral-400">
                Aucune opportunité détectée
              </div>
            ) : (
              <div>
                {opportunities.map((o, i) => (
                  <div
                    key={o.ticker}
                    className={`px-4 py-3 flex items-center gap-3 hover:bg-neutral-50/50 cursor-pointer transition-colors ${
                      i < opportunities.length - 1 ? 'border-b border-neutral-100' : ''
                    }`}
                  >
                    <span className="font-mono text-[10px] font-bold bg-neutral-900 text-white px-1.5 py-0.5 rounded">
                      {o.ticker}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold text-neutral-900 leading-tight truncate">
                        {o.name}
                      </div>
                      <div className="text-[10px] text-neutral-500 leading-tight mt-0.5">
                        {o.sector} · ROIC {o.roic?.toFixed(0)}% · P/E {o.pe?.toFixed(1)}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[13px] font-bold text-accent tabular-nums leading-tight">
                        {o.score}
                      </div>
                      <div className="text-[10px] text-emerald-600 tabular-nums font-semibold">
                        +{o.revenueGrowth?.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* NEWS */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200/60">
            <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-neutral-700" />
                <h3 className="text-[13px] font-semibold text-neutral-900">News critiques portefeuille</h3>
              </div>
              <span className="text-[10px] text-neutral-400">{news.length}</span>
            </div>
            {news.length === 0 ? (
              <div className="p-6 text-center text-[12px] text-neutral-400">
                {positions.length === 0
                  ? 'Ajoute des positions pour voir les news'
                  : 'Aucune news récente'}
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                {news.slice(0, 8).map((n, i) => {
                  const timeStr = new Date(n.datetime * 1000).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                  });
                  return (
                    <a
                      key={i}
                      href={n.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-3 flex gap-3 hover:bg-neutral-50/50 cursor-pointer transition-colors border-b border-neutral-100 last:border-0"
                    >
                      <div className="w-0.5 flex-shrink-0 rounded-full bg-neutral-300" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] font-bold bg-neutral-100 text-neutral-900 px-1.5 py-0.5 rounded">
                            {n.ticker}
                          </span>
                          <span className="text-[10px] text-neutral-500">
                            {timeStr} · {n.source}
                          </span>
                        </div>
                        <div className="text-[12px] text-neutral-800 leading-snug">{n.title}</div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* EARNINGS + MACRO */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200/60">
              <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-neutral-700" />
                  <h3 className="text-[13px] font-semibold text-neutral-900">Earnings à venir</h3>
                </div>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                  {earnings.filter((e) => e.inPortfolio).length} en ptf
                </span>
              </div>
              {earnings.length === 0 ? (
                <div className="p-6 text-center text-[12px] text-neutral-400">
                  Aucun earnings dans les 2 prochaines semaines
                </div>
              ) : (
                <div>
                  {earnings.slice(0, 6).map((e, i) => {
                    const d = new Date(e.date);
                    return (
                      <div
                        key={`${e.ticker}-${e.date}`}
                        className={`px-4 py-2 flex items-center gap-3 hover:bg-neutral-50/50 cursor-pointer transition-colors ${
                          i < earnings.length - 1 ? 'border-b border-neutral-100' : ''
                        } ${e.inPortfolio ? 'bg-amber-50/30' : ''}`}
                      >
                        <div className="text-center w-10 flex-shrink-0">
                          <div className="text-[9px] text-neutral-500 uppercase">
                            {d.toLocaleDateString('fr-FR', { weekday: 'short' })}
                          </div>
                          <div className="text-[13px] font-bold text-neutral-900 tabular-nums leading-none">
                            {d.getDate()}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold bg-neutral-100 text-neutral-900 px-1.5 py-0.5 rounded">
                              {e.ticker}
                            </span>
                            {e.inPortfolio && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
                          </div>
                          <div className="text-[11px] text-neutral-600 mt-0.5">
                            {e.time === 'amc' ? 'Après clôture' : 'Avant ouverture'}
                            {e.epsEstimate && ` · EPS est. ${e.epsEstimate.toFixed(2)}$`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-neutral-200/60">
              <div className="px-4 py-3 border-b border-neutral-200 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-neutral-700" />
                <h3 className="text-[13px] font-semibold text-neutral-900">Événements macro</h3>
              </div>
              <div>
                {MACRO_EVENTS.map((e, i) => (
                  <div
                    key={i}
                    className={`px-4 py-2 flex items-center gap-3 ${
                      i < MACRO_EVENTS.length - 1 ? 'border-b border-neutral-100' : ''
                    }`}
                  >
                    <div className="text-[11px] tabular-nums font-bold text-neutral-900 w-10">
                      {e.date}
                    </div>
                    <div className="flex-1 text-[12px] text-neutral-700">{e.label}</div>
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        e.impact === 'critical'
                          ? 'bg-accent'
                          : e.impact === 'high'
                          ? 'bg-amber-500'
                          : 'bg-neutral-300'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
