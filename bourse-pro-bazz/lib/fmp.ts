// Wrapper Financial Modeling Prep - pour fundamentals avancés
// Docs : https://site.financialmodelingprep.com/developer/docs

const FMP_BASE = 'https://financialmodelingprep.com/api/v3';

function getKey(): string {
  const key = process.env.FMP_API_KEY;
  if (!key) throw new Error('FMP_API_KEY manquante');
  return key;
}

async function fmpFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${FMP_BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  url.searchParams.append('apikey', getKey());

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } }); // cache 1h
  if (!res.ok) {
    throw new Error(`FMP error ${res.status}`);
  }
  return res.json();
}

export type FMPRatios = {
  symbol: string;
  date: string;
  priceEarningsRatio: number;
  returnOnInvestedCapital: number;
  debtEquityRatio: number;
  currentRatio: number;
  grossProfitMargin: number;
  operatingProfitMargin: number;
  netProfitMargin: number;
  priceToSalesRatio: number;
  pegRatio: number;
};

export async function getRatios(symbol: string): Promise<FMPRatios[]> {
  return fmpFetch<FMPRatios[]>(`/ratios-ttm/${symbol}`);
}

export type FMPKeyMetrics = {
  symbol: string;
  date: string;
  marketCap: number;
  peRatio: number;
  pbRatio: number;
  enterpriseValueOverEBITDA: number;
  roic: number;
  roe: number;
  freeCashFlowYield: number;
  debtToEquity: number;
};

export async function getKeyMetrics(symbol: string): Promise<FMPKeyMetrics[]> {
  return fmpFetch<FMPKeyMetrics[]>(`/key-metrics-ttm/${symbol}`);
}

// Income statement (croissance revenus)
export type FMPIncome = {
  date: string;
  symbol: string;
  revenue: number;
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  eps: number;
};

export async function getIncomeStatement(symbol: string, limit = 5): Promise<FMPIncome[]> {
  return fmpFetch<FMPIncome[]>(`/income-statement/${symbol}`, { limit: String(limit) });
}

// Stock screener
export type FMPScreenerResult = {
  symbol: string;
  companyName: string;
  marketCap: number;
  sector: string;
  industry: string;
  beta: number;
  price: number;
  lastAnnualDividend: number;
  volume: number;
  exchange: string;
  exchangeShortName: string;
  country: string;
};

export async function screenStocks(params: {
  marketCapMoreThan?: number;
  marketCapLowerThan?: number;
  sector?: string;
  industry?: string;
  country?: string;
  limit?: number;
}): Promise<FMPScreenerResult[]> {
  const stringParams: Record<string, string> = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) stringParams[k] = String(v);
  });
  return fmpFetch<FMPScreenerResult[]>('/stock-screener', stringParams);
}
