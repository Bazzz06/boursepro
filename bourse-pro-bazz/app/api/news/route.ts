import { NextRequest, NextResponse } from 'next/server';
import { getCompanyNews } from '@/lib/finnhub';
import { withCache } from '@/lib/cache';

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export async function POST(req: NextRequest) {
  try {
    const { tickers }: { tickers: string[] } = await req.json();
    if (!tickers || tickers.length === 0) {
      return NextResponse.json({ news: [] });
    }

    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 7); // 7 derniers jours

    const fromStr = formatDate(from);
    const toStr = formatDate(to);

    const results = await Promise.allSettled(
      tickers.map(async (ticker) => {
        const news = await withCache(
          `news-${ticker}-${fromStr}`,
          1800, // cache 30 min
          () => getCompanyNews(ticker, fromStr, toStr)
        );
        return news.slice(0, 3).map((n) => ({
          ticker,
          title: n.headline,
          summary: n.summary,
          url: n.url,
          source: n.source,
          datetime: n.datetime,
          image: n.image,
        }));
      })
    );

    const allNews = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .flatMap((r) => r.value)
      .sort((a, b) => b.datetime - a.datetime)
      .slice(0, 15);

    return NextResponse.json({ news: allNews });
  } catch (err: any) {
    console.error('Erreur news:', err);
    return NextResponse.json({ error: err.message, news: [] }, { status: 500 });
  }
}
