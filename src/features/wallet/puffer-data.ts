import type { PufferQuoteState } from '@/types';

const BASE = import.meta.env.DEV
  ? '/puffer-api/imtoken-hackathon'
  : 'https://api-v2.puffer.fi/imtoken-hackathon';

const CACHE_KEY = 'puffer-safesign-quote-v2';
const CACHE_TTL_MS = 5 * 60 * 1000;

const SNAPSHOT = {
  pufEthPerEth: 0.9298,
  ethPerPufEth: 1.0755,
  apy: 2.638,
  tvlUsd: 60_170_000,
  unifiVaultUsd: 1_280_000,
  updatedAt: 'Official snapshot - 2026-05-21',
};

type EndpointResult = {
  data?: Record<string, unknown>;
  error?: string;
  path: string;
};

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const normalized = value.replace(/[$,%\s,]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function pickNumber(source: Record<string, unknown> | null | undefined, keys: string[]) {
  if (!source) return null;
  for (const key of keys) {
    const value = asNumber(source[key]);
    if (value !== null) return value;
  }
  return null;
}

function toIsoTime(value: unknown) {
  if (typeof value === 'string' && value.trim()) return value;
  return new Date().toISOString();
}

function estimate(amountEth: string, pufEthPerEth: number) {
  const amount = Number(amountEth);
  if (!Number.isFinite(amount)) return null;
  return (amount * pufEthPerEth).toFixed(6);
}

function explainError(error: string) {
  if (error.includes('429')) {
    return 'Puffer API returned 429 Too Many Requests. Using official snapshot instead of pretending this is live data.';
  }
  if (error.includes('aborted')) {
    return 'Puffer API request timed out. Using official snapshot and keeping the original error visible.';
  }
  return `Puffer API failed: ${error}. Using official snapshot and keeping the original error visible.`;
}

async function getJson(path: string, signal: AbortSignal) {
  const response = await fetch(`${BASE}${path}`, {
    headers: { accept: 'application/json' },
    signal,
  });

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

async function getEndpoint(path: string, signal: AbortSignal): Promise<EndpointResult> {
  try {
    return { data: await getJson(path, signal), path };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { error: message, path };
  }
}

function snapshotQuote(amountEth: string, error?: string): PufferQuoteState {
  return {
    amountEth,
    estimatedPufEth: estimate(amountEth, SNAPSHOT.pufEthPerEth),
    pufEthPerEth: SNAPSHOT.pufEthPerEth,
    ethPerPufEth: SNAPSHOT.ethPerPufEth,
    apy: SNAPSHOT.apy,
    tvlUsd: SNAPSHOT.tvlUsd,
    unifiVaultUsd: SNAPSHOT.unifiVaultUsd,
    source: 'official-snapshot',
    updatedAt: SNAPSHOT.updatedAt,
    rawFields: {
      snapshot: {
        pufEthPerEth: SNAPSHOT.pufEthPerEth,
        ethPerPufEth: SNAPSHOT.ethPerPufEth,
        apy: SNAPSHOT.apy,
        tvl_puffer_staking: SNAPSHOT.tvlUsd,
        unifi_total_usd: SNAPSHOT.unifiVaultUsd,
      },
      error,
    },
    error,
  };
}

function readCachedQuote(amountEth: string): PufferQuoteState | null {
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as PufferQuoteState & { cachedAt?: number };
    if (!cached.cachedAt || Date.now() - cached.cachedAt > CACHE_TTL_MS) return null;
    const pufEthPerEth = cached.pufEthPerEth ?? SNAPSHOT.pufEthPerEth;

    return {
      ...cached,
      amountEth,
      estimatedPufEth: estimate(amountEth, pufEthPerEth),
      rawFields: {
        ...(cached.rawFields ?? {}),
        cache: {
          hit: true,
          cachedAt: new Date(cached.cachedAt).toISOString(),
          ttlMs: CACHE_TTL_MS,
        },
      },
    };
  } catch {
    return null;
  }
}

function writeCachedQuote(quote: PufferQuoteState) {
  if (quote.source !== 'puffer-live') return;
  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...quote, cachedAt: Date.now() }));
  } catch {
    // Browser storage may be unavailable; the live quote is still displayed.
  }
}

function endpointMap(results: EndpointResult[]) {
  return Object.fromEntries(results.map((result) => [result.path, result.data ?? { error: result.error }]));
}

export async function getPufferQuote(amountEth: string): Promise<PufferQuoteState> {
  const cached = readCachedQuote(amountEth);
  if (cached) return cached;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 9000);

  try {
    const coreResults = await Promise.all([
      getEndpoint('/pufeth/rate', controller.signal),
      getEndpoint('/protocol/tvl', controller.signal),
    ]);

    const hasCoreLiveData = coreResults.some((result) => Boolean(result.data));
    if (!hasCoreLiveData) {
      const errorText = coreResults.map((result) => result.error).filter(Boolean).join(' | ');
      return snapshotQuote(amountEth, explainError(errorText || 'all core endpoints failed'));
    }

    const optionalResults = await Promise.all([
      getEndpoint('/vaults/apy', controller.signal),
      getEndpoint('/vaults/tvl', controller.signal),
    ]);

    const rate = coreResults.find((result) => result.path === '/pufeth/rate')?.data;
    const protocol = coreResults.find((result) => result.path === '/protocol/tvl')?.data;
    const vaultApy = optionalResults.find((result) => result.path === '/vaults/apy')?.data;
    const vaultTvl = optionalResults.find((result) => result.path === '/vaults/tvl')?.data;

    const pufEthPerEth =
      pickNumber(rate, ['pufEthPerEth', 'pufETHPerETH', 'rate', 'pufeth_per_eth']) ??
      SNAPSHOT.pufEthPerEth;
    const ethPerPufEth =
      pickNumber(rate, ['ethPerPufEth', 'ethPerPufETH', 'eth_per_pufeth']) ??
      1 / pufEthPerEth;
    const apy =
      pickNumber(protocol, ['apy', 'protocolApy', 'stakingApy']) ??
      pickNumber(vaultApy, ['apy']) ??
      SNAPSHOT.apy;
    const tvlUsd =
      pickNumber(protocol, ['tvl_puffer_staking', 'stakingTvlUsd', 'tvl', 'totalUsd']) ??
      SNAPSHOT.tvlUsd;
    const unifiVaultUsd =
      pickNumber(protocol, ['unifi_total_usd', 'unifiVaultUsd']) ??
      pickNumber(vaultTvl, ['unifi_eth_vault', 'unifi_usd_vault', 'unifi_btc_vault']) ??
      SNAPSHOT.unifiVaultUsd;

    const liveQuote: PufferQuoteState = {
      amountEth,
      estimatedPufEth: estimate(amountEth, pufEthPerEth),
      pufEthPerEth,
      ethPerPufEth,
      apy,
      tvlUsd,
      unifiVaultUsd,
      source: 'puffer-live',
      updatedAt: toIsoTime(protocol?.timestamp ?? rate?.timestamp ?? vaultApy?.timestamp),
      rawFields: endpointMap([...coreResults, ...optionalResults]),
    };

    writeCachedQuote(liveQuote);
    return liveQuote;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return snapshotQuote(amountEth, explainError(reason));
  } finally {
    window.clearTimeout(timeout);
  }
}

export function formatRate(value: number | null) {
  return value === null ? 'snapshot unavailable' : `1 ETH = ${value.toFixed(4)} pufETH`;
}

export function formatPercent(value: number | null) {
  return value === null ? 'snapshot unavailable' : `${value.toFixed(3)}%`;
}

export function formatUsd(value: number | null) {
  if (value === null) return 'snapshot unavailable';
  return new Intl.NumberFormat('en-US', {
    compactDisplay: 'short',
    currency: 'USD',
    maximumFractionDigits: 2,
    notation: 'compact',
    style: 'currency',
  }).format(value);
}

export function formatShort(value: string | null) {
  if (!value) return 'not generated';
  if (value.length <= 22) return value;
  return `${value.slice(0, 12)}...${value.slice(-8)}`;
}
