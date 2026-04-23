import { NextRequest, NextResponse } from 'next/server';
import { getBasicFinancials } from '@/lib/finnhub';
import { withCache } from '@/lib/cache';

// Univers tech initial : on limite à des tickers connus pour économiser le quota.
// En V1.2 on pourra l'étendre via un job batch nocturne.
const TECH_UNIVERSE = [
  // Semi-conducteurs
  { ticker: 'NVDA', name: 'NVIDIA', sector: 'Semi', region: 'US' },
  { ticker: 'AMD', name: 'AMD', sector: 'Semi', region: 'US' },
  { ticker: 'TSM', name: 'TSMC', sector: 'Semi', region: 'Asie' },
  { ticker: 'AVGO', name: 'Broadcom', sector: 'Semi', region: 'US' },
  { ticker: 'QCOM', name: 'Qualcomm', sector: 'Semi', region: 'US' },
  { ticker: 'INTC', name: 'Intel', sector: 'Semi', region: 'US' },
  { ticker: 'MU', name: 'Micron', sector: 'Semi', region: 'US' },
  { ticker: 'AMAT', name: 'Applied Materials', sector: 'Semi', region: 'US' },
  { ticker: 'LRCX', name: 'Lam Research', sector: 'Semi', region: 'US' },
  { ticker: 'KLAC', name: 'KLA Corp', sector: 'Semi', region: 'US' },
  { ticker: 'ASML', name: 'ASML Holding', sector: 'Semi', region: 'EU' },

  // Software
  { ticker: 'MSFT', name: 'Microsoft', sector: 'Software', region: 'US' },
  { ticker: 'ORCL', name: 'Oracle', sector: 'Software', region: 'US' },
  { ticker: 'CRM', name: 'Salesforce', sector: 'Software', region: 'US' },
  { ticker: 'ADBE', name: 'Adobe', sector: 'Software', region: 'US' },
  { ticker: 'NOW', name: 'ServiceNow', sector: 'Software', region: 'US' },
  { ticker: 'INTU', name: 'Intuit', sector: 'Software', region: 'US' },
  { ticker: 'SAP', name: 'SAP', sector: 'Software', region: 'EU' },

  // Internet / plateformes
  { ticker: 'GOOGL', name: 'Alphabet', sector: 'Internet', region: 'US' },
  { ticker: 'META', name: 'Meta Platforms', sector: 'Internet', region: 'US' },
  { ticker: 'AMZN', name: 'Amazon', sector: 'Internet', region: 'US' },
  { ticker: 'NFLX', name: 'Netflix', sector: 'Internet', region: 'US' },
  { ticker: 'UBER', name: 'Uber', sector: 'Internet', region: 'US' },
  { ticker: 'SHOP', name: 'Shopify', sector: 'Internet', region: 'US' },
  { ticker: 'SPOT', name: 'Spotify', sector: 'Internet', region: 'EU' },

  // Hardware / plateformes
  { ticker: 'AAPL', name: 'Apple', sector: 'Hardware', region: 'US' },

  // Cybersécurité
  { ticker: 'CRWD', name: 'CrowdStrike', sector: 'Cyber', region: 'US' },
  { ticker: 'ZS', name: 'Zscaler', sector: 'Cyber', region: 'US' },
  { ticker: 'NET', name: 'Cloudflare', sector: 'Cyber', region: 'US' },
  { ticker: 'S', name: 'SentinelOne', sector: 'Cyber', region: 'US' },

  // Cloud infra
  { ticker: 'DDOG', name: 'Datadog', sector: 'Software', region: 'US' },
  { ticker: 'SNOW', name: 'Snowflake', sector: 'Software', region: 'US' },
  { ticker: 'MDB', name: 'MongoDB', sector: 'Software', region: 'US' },
];

// Calcul d'un score composite 0-100
function computeScore(metrics: any): number {
  const roic = metrics.roicTTM || 0;
  const growth = metrics.revenueGrowthTTMYoy || 0;
  const grossMargin = metrics.grossMarginTTM || 0;
  const pe = metrics.peBasicExclExtraTTM || 999;

  // Scoring quality + growth avec bias tech
  let score = 0;
  if (roic > 30) score += 30;
  else if (roic > 20) score += 25;
  else if (roic > 15) score += 20;
  else if (roic > 10) score += 15;
  else if (roic > 5) score += 10;

  if (growth > 50) score += 30;
  else if (growth > 25) score += 25;
  else if (growth > 15) score += 20;
  else if (growth > 8) score += 15;
  else if (growth > 3) score += 8;

  if (grossMargin > 70) score += 20;
  else if (grossMargin > 55) score += 15;
  else if (grossMargin > 40) score += 10;
  else if (grossMargin > 25) score += 5;

  // Pénalité P/E excessif
  if (pe > 0 && pe < 25) score += 15;
  else if (pe < 40) score += 10;
  else if (pe < 60) score += 5;
  else if (pe < 100) score += 2;

  return Math.min(Math.round(score), 100);
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const minScore = parseInt(searchParams.get('minScore') || '0');
  const sector = searchParams.get('sector');
  const region = searchParams.get('region');

  try {
    const results = await Promise.allSettled(
      TECH_UNIVERSE.map(async (stock) => {
        const metrics = await withCache(
          `financials-${stock.ticker}`,
          86400, // cache 24h (les fundamentals ne bougent pas souvent)
          () => getBasicFinancials(stock.ticker)
        );
        const m = metrics.metric;
        return {
          ...stock,
          price: m['52WeekHigh'] ? (m['52WeekHigh'] * 0.9) : 0, // fallback si pas de prix direct
          pe: m.peBasicExclExtraTTM || 0,
          roic: m.roicTTM || 0,
          revenueGrowth: m.revenueGrowthTTMYoy || 0,
          grossMargin: m.grossMarginTTM || 0,
          netMargin: m.netMarginTTM || 0,
          debtEquity: m.totalDebtToEquityQuarterly || 0,
          score: computeScore(m),
          high52: m['52WeekHigh'] || 0,
          low52: m['52WeekLow'] || 0,
        };
      })
    );

    let stocks = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map((r) => r.value)
      .filter((s) => s.score >= minScore);

    if (sector && sector !== 'all') {
      stocks = stocks.filter((s) => s.sector === sector);
    }
    if (region && region !== 'all') {
      stocks = stocks.filter((s) => s.region === region);
    }

    stocks.sort((a, b) => b.score - a.score);

    return NextResponse.json({ stocks, total: stocks.length });
  } catch (err: any) {
    console.error('Erreur screener:', err);
    return NextResponse.json({ error: err.message, stocks: [] }, { status: 500 });
  }
}
