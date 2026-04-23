import { NextResponse } from 'next/server';
import { getQuote, getMarketStatus } from '@/lib/finnhub';
import { withCache } from '@/lib/cache';

// Symboles suivis pour le ticker défilant
// Finnhub utilise des symboles Yahoo-like pour ETF et indices
const MACRO_TICKERS = [
  { label: 'S&P 500', symbol: 'SPY', type: 'index' },     // ETF proxy
  { label: 'Nasdaq 100', symbol: 'QQQ', type: 'index' },  // ETF proxy
  { label: 'Dow Jones', symbol: 'DIA', type: 'index' },
  { label: 'Russell 2000', symbol: 'IWM', type: 'index' },
  { label: 'Europe', symbol: 'VGK', type: 'index' },
  { label: 'VIX', symbol: 'VIXY', type: 'index' },         // proxy
  { label: 'Or', symbol: 'GLD', type: 'com' },
  { label: 'Argent', symbol: 'SLV', type: 'com' },
  { label: 'Pétrole WTI', symbol: 'USO', type: 'com' },
  { label: 'US 10Y Bond', symbol: 'IEF', type: 'rate' },
  { label: 'Bitcoin', symbol: 'BITO', type: 'crypto' },
];

export async function GET() {
  try {
    const results = await Promise.allSettled(
      MACRO_TICKERS.map(async (m) => {
        const quote = await withCache(`macro-${m.symbol}`, 300, () => getQuote(m.symbol));
        return {
          label: m.label,
          symbol: m.symbol,
          type: m.type,
          value: quote.c,
          change: quote.dp,
        };
      })
    );

    const macroData = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map((r) => r.value);

    // Status marché US
    const marketStatus = await withCache(
      'market-status-us',
      300,
      () => getMarketStatus('US')
    );

    return NextResponse.json({
      macro: macroData,
      market: {
        isOpen: marketStatus.isOpen,
        session: marketStatus.session,
        exchange: 'US',
      },
      timestamp: Date.now(),
    });
  } catch (err: any) {
    console.error('Erreur macro:', err);
    return NextResponse.json(
      { error: err.message, macro: [], market: { isOpen: false } },
      { status: 500 }
    );
  }
}
