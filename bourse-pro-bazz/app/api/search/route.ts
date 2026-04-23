import { NextRequest, NextResponse } from 'next/server';
import { searchSymbol } from '@/lib/finnhub';
import { withCache } from '@/lib/cache';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');
  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] });
  }

  try {
    const data = await withCache(
      `search-${query.toLowerCase()}`,
      3600,
      () => searchSymbol(query)
    );

    const results = data.result
      .filter((r) => r.type === 'Common Stock' || r.type === 'ETF')
      .slice(0, 10)
      .map((r) => ({
        symbol: r.symbol,
        description: r.description,
        displaySymbol: r.displaySymbol,
        type: r.type,
      }));

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error('Erreur search:', err);
    return NextResponse.json({ error: err.message, results: [] }, { status: 500 });
  }
}
