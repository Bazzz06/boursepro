import { NextRequest, NextResponse } from 'next/server';
import { getEarningsCalendar } from '@/lib/finnhub';
import { withCache } from '@/lib/cache';

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const portfolioTickers = searchParams.get('tickers')?.split(',') || [];

    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 14); // 2 semaines à venir

    const data = await withCache(
      `earnings-${formatDate(from)}-${formatDate(to)}`,
      3600, // cache 1h
      () => getEarningsCalendar(formatDate(from), formatDate(to))
    );

    const portfolioSet = new Set(portfolioTickers.map((t) => t.toUpperCase()));

    const earnings = data.earningsCalendar
      .map((e) => ({
        date: e.date,
        ticker: e.symbol,
        epsEstimate: e.epsEstimate,
        time: e.hour, // 'bmo' = before market open, 'amc' = after market close
        quarter: e.quarter,
        year: e.year,
        inPortfolio: portfolioSet.has(e.symbol),
      }))
      .filter((e) => {
        // Garder les earnings du portefeuille + les gros tickers tech connus
        const bigTech = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'NFLX', 'AMD', 'INTC', 'CRM', 'ORCL', 'ASML'];
        return e.inPortfolio || bigTech.includes(e.ticker);
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ earnings });
  } catch (err: any) {
    console.error('Erreur earnings:', err);
    return NextResponse.json({ error: err.message, earnings: [] }, { status: 500 });
  }
}
