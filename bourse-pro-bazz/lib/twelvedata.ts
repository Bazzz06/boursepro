// Wrapper Twelve Data API - pour couverture internationale
// Docs : https://twelvedata.com/docs

const TD_BASE = 'https://api.twelvedata.com';

function getKey(): string {
  const key = process.env.TWELVEDATA_API_KEY;
  if (!key) throw new Error('TWELVEDATA_API_KEY manquante');
  return key;
}

async function tdFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TD_BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  url.searchParams.append('apikey', getKey());

  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) {
    throw new Error(`Twelve Data error ${res.status}`);
  }
  return res.json();
}

export type TDQuote = {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  close: string;
  change: string;
  percent_change: string;
  open: string;
  high: string;
  low: string;
  previous_close: string;
  volume: string;
};

export async function getInternationalQuote(symbol: string, exchange?: string): Promise<TDQuote> {
  const params: Record<string, string> = { symbol };
  if (exchange) params.exchange = exchange;
  return tdFetch<TDQuote>('/quote', params);
}

// Indices mondiaux (pour la barre macro)
export async function getIndexQuote(symbol: string): Promise<TDQuote> {
  return tdFetch<TDQuote>('/quote', { symbol });
}

// Exchange rate
export async function getExchangeRate(symbol: string): Promise<{ symbol: string; rate: number; timestamp: number }> {
  return tdFetch('/exchange_rate', { symbol });
}
