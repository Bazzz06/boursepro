import { NextRequest, NextResponse } from 'next/server';
import { getEarningsCalendar } from '@/lib/finnhub';
import { getCached } from '@/lib/cache';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tickersParam = searchParams.get('tickers') || '';
    const portfolioTickers = new Set(
      tickersParam
        .split(',')
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean)
    );

    const today = new Date();
    const twoWeeksLater = new Date(today);
    twoWeeksLater.setDate(today.getDate() + 14);

    const from = today.toISOString().split('T')[0];
    const to = twoWeeksLater.toISOString().split('T')[0];

    const earnings = await getCached(`earnings-${from}-${to}`, 3600, async () => {
      try {
        return await getEarningsCalendar(from, to);
      } catch {
        return [];
      }
    });

    const enriched = earnings
      .filter((e: any) => e.epsEstimate !== null)
      .map((e: any) => ({
        date: e.date,
        ticker: e.symbol,
        epsEstimate: e.epsEstimate,
        time: e.hour === 'amc' ? 'amc' : 'bmo',
        inPortfolio: portfolioTickers.has(e.symbol),
      }))
      .sort((a: any, b: any) => {
        if (a.inPortfolio !== b.inPortfolio) return a.inPortfolio ? -1 : 1;
        return a.date.localeCompare(b.date);
      });

    return NextResponse.json({ earnings: enriched });
  } catch (error: any) {
    return NextResponse.json({ earnings: [] });
  }
}
