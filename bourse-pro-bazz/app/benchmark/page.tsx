'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import NavBar from '@/components/NavBar';
import InfiniteTicker from '@/components/InfiniteTicker';
import KpiCard from '@/components/KpiCard';
import { usePortfolio } from '@/lib/usePortfolio';

function fmtPct(val: number): string {
  return `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;
}

// Composant AreaChart SVG natif
function AreaChart({
  series,
  labels,
  height = 360,
}: {
  series: Array<{
    name: string;
    data: number[];
    color: string;
    strokeWidth?: number;
    fill?: boolean;
    dashed?: boolean;
  }>;
  labels: string[];
  height?: number;
}) {
  const width = 1000;
  const padding = { top: 15, right: 20, bottom: 30, left: 40 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const allValues = series.flatMap((s) => s.data);
  const minY = Math.min(...allValues) * 0.99;
  const maxY = Math.max(...allValues) * 1.01;

  const xScale = (i: number) => padding.left + (i / (labels.length - 1)) * innerW;
  const yScale = (v: number) => padding.top + innerH - ((v - minY) / (maxY - minY)) * innerH;

  const ySteps = [0, 0.25, 0.5, 0.75, 1].map((p) => minY + (maxY - minY) * p);

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF5C38" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#FF5C38" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ySteps.map((v, i) => (
        <g key={i}>
          <line
            x1={padding.left}
            y1={yScale(v)}
            x2={width - padding.right}
            y2={yScale(v)}
            stroke="#f0f0f0"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <text x={padding.left - 8} y={yScale(v) + 4} fontSize="10" fill="#a3a3a3" textAnchor="end">
            {v.toFixed(0)}
          </text>
        </g>
      ))}
      {labels.map((l, i) => (
        <text key={i} x={xScale(i)} y={height - 10} fontSize="10" fill="#a3a3a3" textAnchor="middle">
          {l}
        </text>
      ))}
      {series.map((s, idx) => {
        const points = s.data.map((v, i) => `${xScale(i)},${yScale(v)}`);
        const linePath = `M ${points.join(' L ')}`;
        const areaPath = `${linePath} L ${xScale(s.data.length - 1)},${padding.top + innerH} L ${xScale(0)},${padding.top + innerH} Z`;
        return (
          <g key={idx}>
            {s.fill && <path d={areaPath} fill="url(#areaGrad)" />}
            <path
              d={linePath}
              fill="none"
              stroke={s.color}
              strokeWidth={s.strokeWidth || 2}
              strokeDasharray={s.dashed ? '4 4' : 'none'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        );
      })}
    </svg>
  );
}

// Données de benchmark simulées (à connecter ultérieurement avec historical data)
const BENCHMARK_LABELS = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû'];

export default function BenchmarkPage() {
  const { data: session } = useSession();
  const { positions } = usePortfolio();

  const totalValue = positions.reduce((s, p) => s + p.shares * p.currentPrice, 0);
  const totalCost = positions.reduce((s, p) => s + p.shares * p.avgPrice, 0);
  const perf = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

  // Simulation de courbe portefeuille basée sur la perf actuelle
  // Pour une vraie courbe historique, il faudrait stocker des snapshots quotidiens
  const simulatedPortfolio = BENCHMARK_LABELS.map((_, i) => {
    return 100 + (perf / (BENCHMARK_LABELS.length - 1)) * i;
  });

  const benchmarkSeries = [
    { name: 'Portefeuille', data: simulatedPortfolio, color: '#FF5C38', strokeWidth: 2.5, fill: true },
    { name: 'Nasdaq 100', data: [100, 102.4, 105.8, 107.2, 109.5, 111.2, 113.8, 115.4], color: '#0a0a0a', strokeWidth: 1.5, dashed: true },
    { name: 'S&P 500', data: [100, 101.8, 103.2, 104.5, 106.1, 107.8, 109.2, 110.5], color: '#a3a3a3', strokeWidth: 1.5, dashed: true },
  ];

  return (
    <div className="min-h-screen">
      <NavBar userName={session?.user?.name?.split(' ')[0]} />
      <InfiniteTicker />

      <div className="p-6 max-w-[1600px] mx-auto space-y-4">
        <div>
          <h1 className="text-[24px] font-bold text-neutral-900 tracking-tight">Benchmark</h1>
          <p className="text-[12px] text-neutral-500 mt-0.5">
            Performance portefeuille vs indices de référence · YTD 2026
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <KpiCard label="Portefeuille" value={fmtPct(perf)} subValue={`Écart NDX : ${fmtPct(perf - 15.4)}`} variant="dark" />
          <KpiCard label="Nasdaq 100" value="+15.40%" subValue="Benchmark tech principal" trend={15.4} />
          <KpiCard label="S&P 500" value="+10.50%" subValue="Référence US large" trend={10.5} />
          <KpiCard label="MSCI World" value="+9.20%" subValue="Référence mondiale" trend={9.2} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold text-neutral-900">Évolution comparée, base 100</h3>
            <div className="flex items-center gap-4 text-[11px]">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-accent rounded" />
                <span className="text-neutral-700 font-medium">Portefeuille</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-neutral-900 rounded" />
                <span className="text-neutral-700">Nasdaq 100</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-neutral-400 rounded" />
                <span className="text-neutral-700">S&P 500</span>
              </div>
            </div>
          </div>
          <AreaChart series={benchmarkSeries} labels={BENCHMARK_LABELS} height={320} />
          <div className="text-[11px] text-neutral-400 mt-3 pt-3 border-t border-neutral-100">
            Note V1 : la courbe portefeuille est simulée linéairement. En V1.1, des snapshots quotidiens de la valeur portefeuille seront stockés pour tracer la vraie courbe historique.
          </div>
        </div>
      </div>
    </div>
  );
}
