export interface PufferQuoteState {
  amountEth: string;
  estimatedPufEth: string | null;
  pufEthPerEth: number | null;
  ethPerPufEth: number | null;
  apy: number | null;
  tvlUsd: number | null;
  unifiVaultUsd: number | null;
  source: 'pending' | 'puffer-live' | 'official-snapshot';
  updatedAt: string | null;
  rawFields?: Record<string, unknown>;
  error?: string;
}

export interface TokenCoreState {
  status: 'idle' | 'running' | 'success' | 'error';
  wasmLoaded: boolean;
  keystoreCreated: boolean;
  network: 'Sepolia / TESTNET';
  chainId: 11155111;
  derivedAddress: string | null;
  txSigned: boolean;
  txSignature: string | null;
  txHash?: string | null;
  messageSigned: boolean;
  messageSignature: string | null;
  seedPhraseRequested: false;
  privateKeyExported: false;
  logs: string[];
  error?: string;
}

export interface BroadcastGateState {
  status: 'pending' | 'ready' | 'blocked';
  signatureGenerated: boolean;
  onchainSubmissions: 0;
  realAssetsTouched: false;
  reason: string;
}

// === Buddy State Machine ===
export type BuddyState =
  | 'idle'
  | 'guide-stake'
  | 'reading-puffer'
  | 'puffer-pending'
  | 'puffer-live'
  | 'puffer-snapshot'
  | 'translating'
  | 'warning'
  | 'local-signing'
  | 'sign-pending'
  | 'sign-success'
  | 'sign-error'
  | 'broadcast-waiting'
  | 'broadcast-blocked';

// === Phone Screen Steps ===
export type PhoneScreen =
  | 'wallet-home'
  | 'staking-menu'
  | 'puffer-input'
  | 'pre-sign-translation'
  | 'risk-scan'
  | 'token-core-sign'
  | 'broadcast-gate';

// === Buddy Bubble ===
export interface BuddyBubble {
  text: string;
  mood: 'info' | 'warning' | 'success' | 'blocked' | 'pending';
}
