// Wrapper Finnhub API
// Docs : https://finnhub.io/docs/api

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

function getKey(): string {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error('FINNHUB_API_KEY manquante');
  return key;
}

async function finnhubFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${FINNHUB_BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  url.searchParams.append('token', getKey());

  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) {
    throw new Error(`Finnhub error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

// Quote temps réel (US principalement)
export type FinnhubQuote = {
  c: number;   // current price
  d: number;   // day change absolu
  dp: number;  // day change %
  h: number;   // high of day
  l: number;   // low of day
  o: number;   // open
  pc: number;  // previous close
  t: number;   // timestamp
};

export async function getQuote(symbol: string): Promise<FinnhubQuote> {
  return finnhubFetch<FinnhubQuote>('/quote', { symbol });
}

// Profile entreprise
export type FinnhubProfile = {
  country: string;
  currency: string;
  exchange: string;
  ipo: string;
  marketCapitalization: number;
  name: string;
  ticker: string;
  weburl: string;
  logo: string;
  finnhubIndustry: string;
};

export async function getProfile(symbol: string): Promise<FinnhubProfile> {
  return finnhubFetch<FinnhubProfile>('/stock/profile2', { symbol });
}

// News entreprise
export type FinnhubNews = {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
};

export async function getCompanyNews(symbol: string, from: string, to: string): Promise<FinnhubNews[]> {
  return finnhubFetch<FinnhubNews[]>('/company-news', { symbol, from, to });
}

// Earnings calendar
export type FinnhubEarning = {
  date: string;
  epsActual: number | null;
  epsEstimate: number | null;
  hour: 'bmo' | 'amc' | 'dmh' | '';
  quarter: number;
  revenueActual: number | null;
  revenueEstimate: number | null;
  symbol: string;
  year: number;
};

export async function getEarningsCalendar(from: string, to: string, symbol?: string): Promise<{ earningsCalendar: FinnhubEarning[] }> {
  const params: Record<string, string> = { from, to };
  if (symbol) params.symbol = symbol;
  return finnhubFetch('/calendar/earnings', params);
}

// Recherche ticker (autocomplete)
export type FinnhubSymbolSearch = {
  count: number;
  result: Array<{
    description: string;
    displaySymbol: string;
    symbol: string;
    type: string;
  }>;
};

export async function searchSymbol(query: string): Promise<FinnhubSymbolSearch> {
  return finnhubFetch<FinnhubSymbolSearch>('/search', { q: query });
}

// Market status (ouvert/fermé)
export type FinnhubMarketStatus = {
  exchange: string;
  holiday: string | null;
  isOpen: boolean;
  session: string;
  timezone: string;
  t: number;
};

export async function getMarketStatus(exchange = 'US'): Promise<FinnhubMarketStatus> {
  return finnhubFetch<FinnhubMarketStatus>('/stock/market-status', { exchange });
}

// Basic financials (ratios utiles pour scoring)
export type FinnhubBasicFinancials = {
  metric: {
    '10DayAverageTradingVolume'?: number;
    '52WeekHigh'?: number;
    '52WeekLow'?: number;
    peBasicExclExtraTTM?: number;
    roicTTM?: number;
    revenueGrowthTTMYoy?: number;
    grossMarginTTM?: number;
    operatingMarginTTM?: number;
    netMarginTTM?: number;
    totalDebtToEquityQuarterly?: number;
    [k: string]: number | undefined;
  };
  metricType: string;
  series: Record<string, unknown>;
  symbol: string;
};

export async function getBasicFinancials(symbol: string): Promise<FinnhubBasicFinancials> {
  return finnhubFetch<FinnhubBasicFinancials>('/stock/metric', { symbol, metric: 'all' });
}
