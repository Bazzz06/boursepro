import { NextRequest, NextResponse } from 'next/server';
import { getQuote, getProfile } from '@/lib/finnhub';
import { getInternationalQuote } from '@/lib/twelvedata';
import { withCache } from '@/lib/cache';

// Liste des tickers européens (nécessitent Twelve Data)
const EU_EXCHANGES = ['ASML', 'SAP', 'MC', 'OR', 'AIR', 'SAN', 'BNP'];

export async function GET(
  req: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker.toUpperCase();
  const isEU = EU_EXCHANGES.includes(ticker);

  try {
    if (isEU) {
      const quote = await withCache(
        `td-quote-${ticker}`,
        60,
        () => getInternationalQuote(ticker)
      );
      return NextResponse.json({
        symbol: ticker,
        price: parseFloat(quote.close),
        change: parseFloat(quote.change),
        changePercent: parseFloat(quote.percent_change),
        open: parseFloat(quote.open),
        high: parseFloat(quote.high),
        low: parseFloat(quote.low),
        previousClose: parseFloat(quote.previous_close),
        currency: quote.currency,
        name: quote.name,
        exchange: quote.exchange,
      });
    }

    const [quote, profile] = await Promise.all([
      withCache(`fh-quote-${ticker}`, 60, () => getQuote(ticker)),
      withCache(`fh-profile-${ticker}`, 86400, () => getProfile(ticker)),
    ]);

    return NextResponse.json({
      symbol: ticker,
      price: quote.c,
      change: quote.d,
      changePercent: quote.dp,
      open: quote.o,
      high: quote.h,
      low: quote.l,
      previousClose: quote.pc,
      currency: profile.currency || 'USD',
      name: profile.name || ticker,
      exchange: profile.exchange || 'NASDAQ',
      logo: profile.logo,
      sector: profile.finnhubIndustry,
      marketCap: profile.marketCapitalization,
    });
  } catch (err: any) {
    console.error(`Erreur quote ${ticker}:`, err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch quote' },
      { status: 500 }
    );
  }
}
