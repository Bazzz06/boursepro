'use client';

import { LivePosition } from '@/lib/usePortfolio';

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

type Props = {
  positions: LivePosition[];
  lastUpdate: number;
  onDelete?: (ticker: string) => void;
  showDelete?: boolean;
  showAlerts?: boolean;
};

export default function PortfolioTable({
  positions,
  lastUpdate,
  onDelete,
  showDelete = false,
  showAlerts = true,
}: Props) {
  if (positions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200/60 p-12 text-center">
        <div className="text-[14px] font-semibold text-neutral-700 mb-2">
          Aucune position dans ton portefeuille
        </div>
        <div className="text-[12px] text-neutral-500">
          Ajoute tes premières positions depuis l&apos;onglet Portefeuille
        </div>
      </div>
    );
  }

  const totalValue = positions.reduce((s, p) => s + p.shares * p.currentPrice, 0);
  const totalCost = positions.reduce((s, p) => s + p.shares * p.avgPrice, 0);
  const totalPL = totalValue - totalCost;
  const totalPLPct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;
  const dayPL = positions.reduce(
    (s, p) => s + p.shares * p.currentPrice * (p.dayChange / 100),
    0
  );
  const dayPLPct = totalValue > 0 ? (dayPL / totalValue) * 100 : 0;

  const lastUpdateStr =
    lastUpdate > 0
      ? new Date(lastUpdate).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '--:--';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200/60 overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-[13px] font-semibold text-neutral-900">Mes positions</h2>
          <span className="text-[11px] text-neutral-500 tabular-nums">{positions.length} titres</span>
        </div>
        <span className="text-[10px] text-neutral-500">Dernière maj : {lastUpdateStr}</span>
      </div>

      <table className="w-full">
        <thead className="bg-neutral-50/50">
          <tr className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
            <th className="text-left px-4 py-2">Titre</th>
            <th className="text-right px-3 py-2">Cours</th>
            <th className="text-right px-3 py-2">Jour</th>
            <th className="text-right px-3 py-2">Qté</th>
            <th className="text-right px-3 py-2">PRU</th>
            <th className="text-right px-3 py-2">Valeur</th>
            <th className="text-right px-3 py-2">P/L €</th>
            <th className="text-right px-3 py-2">Perf %</th>
            <th className="text-right px-3 py-2">Poids</th>
            {showAlerts && <th className="text-center px-3 py-2">Alerte</th>}
            {showDelete && <th className="px-3 py-2"></th>}
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => {
            const value = p.shares * p.currentPrice;
            const pl = (p.currentPrice - p.avgPrice) * p.shares;
            const plPct = p.avgPrice > 0 ? ((p.currentPrice - p.avgPrice) / p.avgPrice) * 100 : 0;
            const weight = totalValue > 0 ? (value / totalValue) * 100 : 0;
            const bigMove = Math.abs(p.dayChange) > 3;

            return (
              <tr key={p.ticker} className="border-t border-neutral-100 hover:bg-neutral-50/50 transition-colors">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[10px] font-bold bg-neutral-100 text-neutral-900 px-1.5 py-0.5 rounded">
                      {p.ticker}
                    </span>
                    <div>
                      <div className="text-[13px] font-semibold text-neutral-900 leading-tight">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-neutral-500 leading-tight">{p.sector || '--'}</div>
                    </div>
                  </div>
                </td>
                <td className="text-right px-3 py-2.5 text-[13px] font-semibold text-neutral-900 tabular-nums">
                  {p.currentPrice.toFixed(2)}
                </td>
                <td
                  className={`text-right px-3 py-2.5 text-[12px] font-semibold tabular-nums ${
                    p.dayChange >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {fmtPct(p.dayChange)}
                </td>
                <td className="text-right px-3 py-2.5 text-[13px] text-neutral-700 tabular-nums">
                  {p.shares}
                </td>
                <td className="text-right px-3 py-2.5 text-[13px] text-neutral-700 tabular-nums">
                  {p.avgPrice.toFixed(2)}
                </td>
                <td className="text-right px-3 py-2.5 text-[13px] font-semibold text-neutral-900 tabular-nums">
                  {fmtCur(value, p.currency || 'EUR')}
                </td>
                <td
                  className={`text-right px-3 py-2.5 text-[13px] font-semibold tabular-nums ${
                    pl >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {pl >= 0 ? '+' : ''}
                  {pl.toFixed(0)}
                </td>
                <td
                  className={`text-right px-3 py-2.5 text-[13px] font-bold tabular-nums ${
                    plPct >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {fmtPct(plPct)}
                </td>
                <td className="text-right px-3 py-2.5">
                  <div className="flex items-center gap-2 justify-end">
                    <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-neutral-900" style={{ width: `${weight}%` }} />
                    </div>
                    <span className="text-[11px] tabular-nums text-neutral-700 w-8 text-right">
                      {weight.toFixed(0)}%
                    </span>
                  </div>
                </td>
                {showAlerts && (
                  <td className="text-center px-3 py-2.5">
                    {bigMove && (
                      <span className="text-[9px] font-bold bg-accent-soft text-accent px-1.5 py-0.5 rounded">
                        MOVE
                      </span>
                    )}
                  </td>
                )}
                {showDelete && onDelete && (
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => onDelete(p.ticker)}
                      className="text-neutral-300 hover:text-red-500 text-[16px] leading-none"
                      title="Supprimer"
                    >
                      ×
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-neutral-50/50 border-t-2 border-neutral-200">
          <tr className="text-[12px] font-bold">
            <td className="px-4 py-2 text-neutral-900">Total</td>
            <td></td>
            <td className={`text-right px-3 py-2 tabular-nums ${dayPLPct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {fmtPct(dayPLPct)}
            </td>
            <td></td>
            <td></td>
            <td className="text-right px-3 py-2 tabular-nums text-neutral-900">
              {fmtCur(totalValue, 'EUR')}
            </td>
            <td className={`text-right px-3 py-2 tabular-nums ${totalPL >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {totalPL >= 0 ? '+' : ''}
              {totalPL.toFixed(0)}
            </td>
            <td className={`text-right px-3 py-2 tabular-nums ${totalPLPct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {fmtPct(totalPLPct)}
            </td>
            <td className="text-right px-3 py-2 tabular-nums text-neutral-500">100%</td>
            {showAlerts && <td></td>}
            {showDelete && <td></td>}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
