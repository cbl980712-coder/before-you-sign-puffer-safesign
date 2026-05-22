import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  SCREEN_ORDER,
  SCREEN_LABELS,
  PUFFERVAULT_ADDRESS_SHORT,
} from '@/data/appData';
import type { PhoneScreen, PufferQuoteState, TokenCoreState, BroadcastGateState } from '@/types';
import {
  BROADCAST_GATE_PENDING,
  getBuddyMessage,
  PUFFER_QUOTE_PENDING,
  TOKEN_CORE_IDLE,
} from '@/features/wallet/demo-state';
import { getBroadcastGateState, tryBroadcast } from '@/features/wallet/broadcast-gate';
import { formatPercent, formatRate, formatShort, formatUsd, getPufferQuote } from '@/features/wallet/puffer-data';
import { runTokenCoreProof } from '@/features/wallet/tcx-core';
import {
  ChevronLeft, ChevronRight, Shield, Lock, Sparkles,
  ArrowRight, Check, AlertTriangle, Info, Zap, Key,
  FileCheck, WifiOff, Fingerprint, FileSignature,
  MessageSquare, Activity, Clock, RefreshCw,
  Gem, Plus, MoreHorizontal,
} from 'lucide-react';
import BuddyAssistant from './BuddyAssistant';

const STEPS: PhoneScreen[] = [...SCREEN_ORDER];

const walletActions = [
  { label: '转账', kind: 'send' },
  { label: '收款', kind: 'receive' },
  { label: '记录', kind: 'history' },
  { label: '质押', kind: 'stake' },
  { label: '生态', kind: 'eco' },
];

const bottomNavItems = [
  { label: '钱包', kind: 'wallet' },
  { label: '市场', kind: 'market' },
  { label: '浏览', kind: 'browser' },
  { label: '我', kind: 'me' },
];

type IconKind = 'send' | 'receive' | 'history' | 'stake' | 'eco' | 'wallet' | 'market' | 'browser' | 'me' | 'scan' | 'copy' | 'arrow' | 'native' | 'liquid' | 'solo';

function ImTokenIcon({ kind, className = '', active = false }: { kind: IconKind; className?: string; active?: boolean }) {
  const color = active ? '#2f6bff' : '#121833';
  const muted = active ? '#2f6bff' : '#6b7280';
  const common = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  if (kind === 'send') return <svg viewBox="0 0 32 32" className={className}><path {...common} d="M7 16 25 7l-8 18-3-9-7 0Z" stroke={color} strokeWidth="2.8" /></svg>;
  if (kind === 'receive') return <svg viewBox="0 0 32 32" className={className}><path {...common} d="M8 8h5v5H8V8Zm11 0h5v5h-5V8ZM8 19h5v5H8v-5Zm11 0h2m3 0v5m-5 0h5" stroke={color} strokeWidth="2.6" /><path d="M16 8h1.5M16 13h1.5M13 16h4" stroke={color} strokeWidth="2.6" strokeLinecap="round" /></svg>;
  if (kind === 'history') return <svg viewBox="0 0 32 32" className={className}><path {...common} d="M9 9a10 10 0 1 1-2 11" stroke={color} strokeWidth="2.8" /><path {...common} d="M6 8v7h7M16 10v7l5 3" stroke={color} strokeWidth="2.8" /></svg>;
  if (kind === 'stake') return <svg viewBox="0 0 32 32" className={className}><path d="M16 4 8.5 16 16 28 23.5 16 16 4Z" fill="none" stroke={active ? '#2f6bff' : '#111633'} strokeWidth="2.4" strokeLinejoin="round" /><path d="M16 4v24M8.5 16 16 13l7.5 3" stroke={active ? '#2f6bff' : '#111633'} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" /><path d="M23.5 5v7M20 8.5h7" stroke={active ? '#2f6bff' : '#111633'} strokeWidth="2.2" strokeLinecap="round" /></svg>;
  if (kind === 'eco') return <svg viewBox="0 0 32 32" className={className}><circle cx="16" cy="16" r="4.8" fill="none" stroke={color} strokeWidth="2.4" /><circle cx="8" cy="13" r="3.2" fill="none" stroke={color} strokeWidth="2.4" /><circle cx="24" cy="11" r="3.2" fill="none" stroke={color} strokeWidth="2.4" /><circle cx="23" cy="23" r="3.2" fill="none" stroke={color} strokeWidth="2.4" /></svg>;
  if (kind === 'wallet') return <svg viewBox="0 0 32 32" className={className}><path d="M16 3 27 9v14l-11 6L5 23V9l11-6Z" fill="none" stroke={active ? '#078cff' : muted} strokeWidth="2.5" strokeLinejoin="round" /><path d="M16 11 21 16l-5 5-5-5 5-5Z" fill="none" stroke={active ? '#078cff' : muted} strokeWidth="2.3" strokeLinejoin="round" /></svg>;
  if (kind === 'market') return <svg viewBox="0 0 32 32" className={className}><path d="M8 23V9M16 23V14M24 23V5M6 23h20" stroke={muted} strokeWidth="2.5" strokeLinecap="round" /><path d="M8 17c4 0 4-5 8-5s4 3 8 3" stroke={muted} strokeWidth="2.4" strokeLinecap="round" fill="none" /></svg>;
  if (kind === 'browser') return <svg viewBox="0 0 32 32" className={className}><circle cx="17" cy="15" r="8" fill="none" stroke={muted} strokeWidth="2.5" /><path d="M12 20 22 10M9 24l5-2" stroke={muted} strokeWidth="2.5" strokeLinecap="round" /></svg>;
  if (kind === 'me') return <svg viewBox="0 0 32 32" className={className}><circle cx="16" cy="10" r="4" fill="none" stroke={muted} strokeWidth="2.6" /><path d="M8 26c1.5-5 14.5-5 16 0" fill="none" stroke={muted} strokeWidth="2.6" strokeLinecap="round" /></svg>;
  if (kind === 'scan') return <svg viewBox="0 0 32 32" className={className}><path {...common} d="M8 4H4v4M24 4h4v4M4 24v4h4M28 24v4h-4M10 16h12" stroke="#111633" strokeWidth="2.4" /></svg>;
  if (kind === 'copy') return <svg viewBox="0 0 24 24" className={className}><rect x="8" y="8" width="10" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" /><rect x="5" y="5" width="10" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" opacity=".55" /></svg>;
  if (kind === 'arrow') return <svg viewBox="0 0 32 32" className={className}><path d="m13 9 7 7-7 7" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (kind === 'native') return <svg viewBox="0 0 40 40" className={className}><circle cx="20" cy="20" r="14" fill="none" stroke="#078cff" strokeWidth="3" /><path d="M20 8 13 20l7 12 7-12-7-12Z" fill="#078cff" opacity=".9" /></svg>;
  if (kind === 'liquid') return <svg viewBox="0 0 40 40" className={className}><circle cx="20" cy="20" r="13" fill="none" stroke="#078cff" strokeWidth="3" /><path d="M20 8 13 20l7 12 7-12-7-12Z" fill="#078cff" /><path d="M10 27c5 5 15 5 20 0" fill="none" stroke="#078cff" strokeWidth="3" strokeLinecap="round" /></svg>;
  return <svg viewBox="0 0 40 40" className={className}><path d="M11 11h18M11 20h18M11 29h18" stroke="#078cff" strokeWidth="3" strokeLinecap="round" /><ellipse cx="20" cy="11" rx="9" ry="4" fill="none" stroke="#078cff" strokeWidth="3" /><path d="M11 11v18c0 2.2 18 2.2 18 0V11" fill="none" stroke="#078cff" strokeWidth="3" /></svg>;
}

function EthMark({ className = '', white = false }: { className?: string; white?: boolean }) {
  return (
    <svg viewBox="0 0 24 34" className={className}>
      <path d="M12 1 2 17l10-5 10 5L12 1Z" fill={white ? '#fff' : '#627eea'} />
      <path d="M2 19 12 33l10-14-10 6-10-6Z" fill={white ? '#fff' : '#8fa0ff'} />
      <path d="M12 12v13l10-6-10-7Z" fill={white ? '#eef7ff' : '#475dc9'} opacity=".65" />
    </svg>
  );
}

function TokenAvatar({ symbol, account = false }: { symbol: 'ETH' | 'USDT' | 'USDC'; account?: boolean }) {
  if (symbol === 'ETH') {
    return (
      <div className={`${account ? 'w-8 h-8 bg-[#35aeca]' : 'w-8 h-8 bg-[#edefff]'} rounded-full flex items-center justify-center`}>
        <EthMark className={account ? 'w-4 h-6' : 'w-4 h-6'} white={account} />
      </div>
    );
  }
  if (symbol === 'USDT') {
    return <div className="w-8 h-8 rounded-full bg-[#26a17b] flex items-center justify-center text-white text-[13px] font-black">₮</div>;
  }
  return <div className="w-8 h-8 rounded-full bg-[#2775ca] flex items-center justify-center text-white text-[13px] font-black border-2 border-blue-50">$</div>;
}

function buildRiskScanCards(
  pufferQuote: PufferQuoteState,
  tokenCore: TokenCoreState,
  broadcastGate: BroadcastGateState,
) {
  const dataSource =
    pufferQuote.source === 'puffer-live'
      ? 'Puffer live'
      : pufferQuote.source === 'official-snapshot'
        ? 'Official snapshot'
        : 'Pending';
  const fallbackReason = pufferQuote.error?.includes('429')
    ? 'Puffer API 当前返回 429 限流，不能把快照伪装成实时数据。'
    : 'Puffer live 未返回完整数据，页面使用官方快照并保留错误。';

  return [
    {
      tone: 'info',
      title: 'Info',
      icon: Info,
      rows: [
        `操作：准备把 ${pufferQuote.amountEth} ETH 存入 Puffer SafeSign 测试流程。`,
        `预计获得：${pufferQuote.estimatedPufEth ?? 'pending'} pufETH。`,
        `数据来源：${dataSource}；更新时间：${pufferQuote.updatedAt ?? 'pending'}。`,
      ],
    },
    {
      tone: 'warning',
      title: 'Warning',
      icon: AlertTriangle,
      rows: [
        pufferQuote.source === 'puffer-live'
          ? `APY ${formatPercent(pufferQuote.apy)} 是浮动收益，不是固定承诺。`
          : fallbackReason,
        `兑换率：${formatRate(pufferQuote.pufEthPerEth)}；pufETH 数量少于 ETH 不等于直接亏损。`,
        '交易一旦广播上链，不能像普通订单一样撤回。',
      ],
    },
    {
      tone: 'safe',
      title: 'Safe by Design',
      icon: Shield,
      rows: [
        tokenCore.status === 'success'
          ? `Token Core 已本地签名：${formatShort(tokenCore.derivedAddress)}，但广播仍由闸门控制。`
          : `Token Core 状态：${tokenCore.status}；未签名前不能进入广播。`,
        `Broadcast Gate：${broadcastGate.status}；链上提交 ${broadcastGate.onchainSubmissions} tx。`,
        'Seed phrase requested: No；Private key exported: No；Real assets touched: false。',
      ],
    },
  ];
}

function getRiskToneClass(tone: string) {
  if (tone === 'info') {
    return {
      card: 'bg-blue-50/60 border-blue-100/80',
      badge: 'bg-it-blue/15',
      icon: 'text-it-blue',
      title: 'text-it-blue',
      dot: 'bg-it-blue',
    };
  }
  if (tone === 'warning') {
    return {
      card: 'bg-amber-50/60 border-amber-100/80',
      badge: 'bg-amber-500/15',
      icon: 'text-amber-500',
      title: 'text-amber-600',
      dot: 'bg-amber-400',
    };
  }
  return {
    card: 'bg-emerald-50/60 border-emerald-100/80',
    badge: 'bg-emerald-500/15',
    icon: 'text-emerald-500',
    title: 'text-emerald-600',
    dot: 'bg-emerald-500',
  };
}

export default function PhoneDemoSection() {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [signProg, setSignProg] = useState(0);
  const [gateConfirm, setGateConfirm] = useState(false);
  const [tokenCoreRunMs, setTokenCoreRunMs] = useState<number | null>(null);
  const [showBuddy, setShowBuddy] = useState(true);
  const [showApiEvidence, setShowApiEvidence] = useState(false);
  const [pufferQuote, setPufferQuote] = useState<PufferQuoteState>(PUFFER_QUOTE_PENDING);
  const [tokenCore, setTokenCore] = useState<TokenCoreState>(TOKEN_CORE_IDLE);
  const [broadcastGate, setBroadcastGate] = useState<BroadcastGateState>(BROADCAST_GATE_PENDING);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentScreen = STEPS[stepIndex];
  const buddyMessage = useMemo(
    () => getBuddyMessage({ step: stepIndex + 1, pufferQuote, tokenCore, broadcastGate }),
    [stepIndex, pufferQuote, tokenCore, broadcastGate],
  );
  const tokenCoreReady = tokenCore.status === 'success' && tokenCore.txSigned && tokenCore.messageSigned;
  const riskCards = useMemo(
    () => buildRiskScanCards(pufferQuote, tokenCore, broadcastGate),
    [pufferQuote, tokenCore, broadcastGate],
  );
  const sourceLabel =
    pufferQuote.source === 'puffer-live'
      ? 'Puffer live'
      : pufferQuote.source === 'official-snapshot'
        ? 'Official snapshot'
        : 'Pending';

  // Auto-play
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setStepIndex((prev) => {
          if (prev >= STEPS.length - 1) { setIsPlaying(false); return prev; }
          return prev + 1;
        });
      }, 4000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying]);

  useEffect(() => {
    let cancelled = false;
    getPufferQuote(PUFFER_QUOTE_PENDING.amountEth).then((quote) => {
      if (!cancelled) setPufferQuote(quote);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (currentScreen === 'token-core-sign') {
      setSignProg(0);
      const interval = setInterval(() => {
        setSignProg(p => { if (p >= 100) { clearInterval(interval); return 100; } return p + 10; });
      }, 250);
      return () => clearInterval(interval);
    }
  }, [currentScreen]);

  useEffect(() => {
    setBroadcastGate((current) => {
      if (current.status === 'blocked') return current;
      return getBroadcastGateState(tokenCore);
    });
  }, [tokenCore]);

  const goNext = useCallback(() => {
    if (stepIndex < STEPS.length - 1) { setStepIndex(stepIndex + 1); setGateConfirm(false); }
  }, [stepIndex]);
  const goPrev = useCallback(() => {
    if (stepIndex > 0) { setStepIndex(stepIndex - 1); setGateConfirm(false); }
  }, [stepIndex]);
  const handlePlay = () => { setStepIndex(0); setGateConfirm(false); setIsPlaying(true); };
  const handleReset = () => { setIsPlaying(false); setStepIndex(0); setGateConfirm(false); setBroadcastGate(getBroadcastGateState(tokenCore)); };
  const handleRunTokenCore = useCallback(async () => {
    const startedAt = performance.now();
    setTokenCoreRunMs(null);
    setTokenCore({
      ...TOKEN_CORE_IDLE,
      status: 'running',
      logs: ['Starting Token Core local proof'],
    });
    setBroadcastGate(BROADCAST_GATE_PENDING);
    const result = await runTokenCoreProof(pufferQuote.amountEth, pufferQuote.estimatedPufEth);
    setTokenCoreRunMs(Math.round(performance.now() - startedAt));
    setTokenCore(result);
  }, [pufferQuote.amountEth, pufferQuote.estimatedPufEth]);

  const handleTryBroadcast = useCallback(() => {
    const result = tryBroadcast(tokenCore);
    setBroadcastGate(result);
    if (result.status === 'blocked') {
      setGateConfirm(true);
    }
  }, [tokenCore]);

  // ─── RENDER PHONE SCREENS ───
  const renderScreen = () => {
    switch (currentScreen) {
      // === STEP 1: Wallet Home ===
      case 'wallet-home':
        return (
          <div className="w-full h-full bg-white flex flex-col overflow-hidden">
            <div className="px-4 pt-10 pb-2 flex items-center gap-2">
              <TokenAvatar symbol="ETH" account />
              <span className="text-[10px] text-gray-400 -ml-1 self-start">1</span>
              <span className="text-[13px] font-semibold text-it-text">Account 01</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
              <ImTokenIcon kind="scan" className="ml-auto w-6 h-6" />
            </div>
            <div className="mx-4 mt-2 p-4 rounded-3xl asset-card-gradient text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-28 h-28 bg-white/8 rounded-full -translate-y-10 translate-x-10" />
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/8 rounded-full translate-y-8 -translate-x-8" />
              <p className="text-2xl font-bold mt-0.5">$ 0</p>
              <div className="flex items-center gap-1 mt-1">
                <p className="text-[10px] opacity-60 font-mono">0x7337a6B4...AB998973c1</p>
                <ImTokenIcon kind="copy" className="w-3.5 h-3.5 opacity-70 text-white" />
              </div>
              <p className="text-[10px] opacity-70 mt-0.5">Ethereum · Sepolia</p>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/25 flex items-center justify-center">
                <ImTokenIcon kind="arrow" className="w-6 h-6" />
              </div>
            </div>
            <div className="mx-4 mt-3 p-3 bg-gray-50 rounded-2xl grid grid-cols-5 gap-1">
              {walletActions.map((item, i) => (
                <button key={item.label} onClick={() => i === 3 && goNext()} className="flex flex-col items-center gap-1">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${i === 3 ? 'bg-it-blue/15 ring-2 ring-it-blue/20' : 'bg-white'}`}>
                    <ImTokenIcon kind={item.kind as IconKind} className="w-6 h-6" active={i === 3} />
                  </div>
                  <span className={`text-[9px] ${i === 3 ? 'text-it-blue font-semibold' : 'text-gray-400'}`}>{item.label}</span>
                </button>
              ))}
            </div>
            <div className="px-4 mt-3 flex-1">
              <div className="flex gap-4 text-[12px] font-semibold mb-2">
                <span className="text-it-text border-b-2 border-it-blue pb-0.5">代币</span>
                <span className="text-gray-300">NFT</span>
                <span className="text-gray-300">DeFi</span>
                <Plus className="ml-auto w-4 h-4 text-it-text" />
              </div>
              {[
                { sym: 'ETH', name: 'Ether', price: '$2,141.96', ch: '+1.59%' },
                { sym: 'USDT', name: 'Tether USD', price: '$0.99', ch: '+0.01%' },
                { sym: 'USDC', name: 'USD Coin', price: '$1.00', ch: '0.00%' },
              ].map((t) => (
                <div key={t.sym} className="flex items-center gap-3 py-2.5 border-b border-gray-50/80">
                  <TokenAvatar symbol={t.sym as 'ETH' | 'USDT' | 'USDC'} />
                  <div className="flex-1">
                    <p className="text-[12px] font-semibold text-it-text">{t.sym}</p>
                    <p className="text-[10px] text-gray-400">{t.name}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">{t.ch}</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">{t.price}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-auto pb-6 pt-2 bg-white shadow-gutter flex justify-around">
              {bottomNavItems.map((item, i) => (
                <div key={item.label} className="flex flex-col items-center gap-0.5">
                  <ImTokenIcon kind={item.kind as IconKind} className="w-6 h-6" active={i === 0} />
                  <span className={`text-[9px] ${i === 0 ? 'text-it-blue font-medium' : 'text-gray-400'}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        );

      // === STEP 2: Staking Menu ===
      case 'staking-menu':
        return (
          <div className="w-full h-full bg-white flex flex-col overflow-hidden">
            <div className="px-4 pt-10 pb-3 flex items-center gap-2">
              <button onClick={goPrev} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="w-6 h-6 rounded-full bg-[#edefff] flex items-center justify-center">
                <Gem className="w-3.5 h-3.5 text-it-blue" />
              </div>
              <span className="text-[14px] font-semibold">imToken 质押</span>
              <button className="ml-auto w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center">
                <MoreHorizontal className="w-4 h-4 text-it-text" />
              </button>
            </div>
            <div className="px-4 pb-3">
              <TokenAvatar symbol="ETH" />
              <p className="text-[15px] font-bold text-it-text leading-snug">维护以太坊网络<br/>并赚取奖励</p>
            </div>
            <div className="px-4 space-y-2.5 flex-1 overflow-y-auto">
              {[
                { kind: 'native', title: '原生质押', desc: '降低技术门槛，获取稳定收益', tags: ['32 ETH 起', '第三方托管'] },
                { kind: 'liquid', title: '流动性质押', desc: '任意数量 ETH 参与质押并获取奖励', tags: ['任意额度', '便捷灵活'] },
                { kind: 'solo', title: '独立质押', desc: '以太坊质押的黄金标准', tags: ['自主托管', '去中心化'] },
              ].map((opt) => (
                <div key={opt.title} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="flex items-start gap-3">
                    <ImTokenIcon kind={opt.kind as IconKind} className="w-10 h-10" />
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-it-text">{opt.title}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{opt.desc}</p>
                      <div className="flex gap-1.5 mt-2">{opt.tags.map((t) => <span key={t} className="token-tag">{t}</span>)}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 mt-1" />
                  </div>
                </div>
              ))}
              <button onClick={goNext} className="w-full p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 via-cyan-50/50 to-white border border-blue-100 text-left hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-it-blue to-puffer-cyan flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-it-text">Puffer SafeSign</p>
                      <span className="px-1.5 py-0.5 text-[8px] font-medium text-it-blue bg-blue-100 rounded">NEW</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">签名前先看懂交易，本地签名，不自动广播</p>
                    <div className="flex gap-1.5 mt-2">
                      {['pufETH', '本地签名', '安全舱'].map((t) => <span key={t} className="token-tag">{t}</span>)}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-it-blue mt-1" />
                </div>
              </button>
            </div>
          </div>
        );

      // === STEP 3: Puffer Quote ===
      case 'puffer-input':
        return (
          <div className="w-full h-full bg-white flex flex-col overflow-hidden">
            <div className="px-4 pt-10 pb-2 flex items-center gap-2">
              <button onClick={goPrev} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[14px] font-semibold">Puffer SafeSign</span>
              <span className={`ml-auto flex items-center gap-1 px-2 py-0.5 text-[9px] rounded-full ${
                pufferQuote.source === 'puffer-live'
                  ? 'bg-emerald-50 text-emerald-600'
                  : pufferQuote.source === 'official-snapshot'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-gray-100 text-gray-400'
              }`}>
                {pufferQuote.source === 'pending' ? <Clock className="w-2.5 h-2.5" /> : <Check className="w-2.5 h-2.5" />}
                {sourceLabel}
              </span>
            </div>

            {/* Puffer card */}
            <div className="mx-4 p-4 rounded-3xl ocean-gradient-deep text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-puffer-cyan/10 rounded-full -translate-y-12 translate-x-12" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-[14px]">🐡</div>
                  <span className="text-[12px] font-medium opacity-90">Puffer Finance</span>
                  <span className="ml-auto px-2 py-0.5 text-[9px] bg-white/15 rounded-full font-mono">Sepolia</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] opacity-60">你将存入</p>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-2xl font-bold">{pufferQuote.amountEth}</span>
                      <span className="text-[12px] bg-white/15 px-2 py-0.5 rounded-lg font-medium">ETH</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center py-0.5">
                    <ArrowRight className="w-4 h-4 opacity-40 rotate-90" />
                  </div>
                  <div>
                    <p className="text-[10px] opacity-60">你将获得</p>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      {pufferQuote.estimatedPufEth ? (
                        <>
                          <span className="text-2xl font-bold text-puffer-green">{pufferQuote.estimatedPufEth}</span>
                          <span className="text-[12px] bg-puffer-green/25 text-puffer-green px-2 py-0.5 rounded-lg font-semibold">pufETH</span>
                        </>
                      ) : (
                        <span className="text-lg font-medium text-white/40">读取中...</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Data rows */}
            <div className="px-4 mt-3 flex-1 overflow-y-auto">
              <div className="space-y-0">
                {[
                  { label: '兑换率', value: formatRate(pufferQuote.pufEthPerEth), icon: RefreshCw },
                  { label: 'APY', value: formatPercent(pufferQuote.apy), icon: Zap },
                  { label: 'Staking TVL', value: formatUsd(pufferQuote.tvlUsd), icon: Activity },
                  { label: 'UniFi Vault', value: formatUsd(pufferQuote.unifiVaultUsd), icon: ArrowRight },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <item.icon className="w-3.5 h-3.5 text-gray-300" />
                      <span className="text-[12px] text-gray-400">{item.label}</span>
                    </div>
                    <span className="text-[12px] font-medium text-it-text">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Source card */}
              <div className="mt-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <WifiOff className={`w-3 h-3 ${pufferQuote.source === 'puffer-live' ? 'text-emerald-500' : 'text-amber-500'}`} />
                  <span className="text-[10px] font-semibold text-gray-500 font-mono uppercase">Source</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">Status</span>
                    <span className={`flex items-center gap-1 text-[10px] font-mono ${
                      pufferQuote.source === 'puffer-live' ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      {pufferQuote.source === 'pending' ? <Clock className="w-2.5 h-2.5" /> : <Check className="w-2.5 h-2.5" />} {sourceLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">Updated At</span>
                    <span className="text-[10px] font-mono text-gray-500 text-right max-w-[150px] truncate">{pufferQuote.updatedAt ?? '—'}</span>
                  </div>
                  {pufferQuote.error && (
                    <div className="pt-1 text-[9px] text-amber-600 leading-snug">
                      {pufferQuote.error}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowApiEvidence((value) => !value)}
                  className="mt-2 text-[10px] text-it-blue font-medium"
                >
                  {showApiEvidence ? 'Hide' : 'View'} API Evidence
                </button>
                {showApiEvidence && (
                  <pre className="mt-2 max-h-24 overflow-auto rounded-lg bg-white p-2 text-[8px] text-gray-500">
                    {JSON.stringify(pufferQuote.rawFields ?? {}, null, 2)}
                  </pre>
                )}
              </div>
            </div>

            <div className="px-4 pb-6 pt-2">
              <button onClick={goNext} className="w-full py-3 rounded-2xl puffer-cta text-[13px] font-semibold flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" />
                先做签名前检查
              </button>
            </div>
          </div>
        );

      // === STEP 4: Pre-Sign Translation ===
      case 'pre-sign-translation':
        return (
          <div className="w-full h-full bg-white flex flex-col overflow-hidden relative">
            {isPlaying && <div className="scan-overlay" />}
            <div className="px-4 pt-10 pb-2 flex items-center gap-2">
              <button onClick={goPrev} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[14px] font-semibold">签名前翻译</span>
              <span className="ml-auto px-2 py-0.5 text-[9px] bg-blue-50 text-it-blue rounded-full border border-blue-100 font-medium">Pre-Sign</span>
            </div>
            <div className="px-4 flex-1 overflow-y-auto">
              <p className="text-[11px] text-gray-400 mb-3">钱包正在把这笔 Puffer 质押交易翻译成人话</p>
              <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                  <FileCheck className="w-5 h-5 text-it-blue" />
                  <span className="text-[13px] font-semibold text-it-text">签名前确认单</span>
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: '你将付出', value: '0.05 ETH', style: 'text-red-500 font-bold' },
                    { label: '你将获得', value: pufferQuote.estimatedPufEth ? `${pufferQuote.estimatedPufEth} pufETH` : '读取中', style: pufferQuote.estimatedPufEth ? 'text-emerald-500 font-bold' : 'text-gray-400' },
                    { label: '协议', value: 'Puffer Finance', style: 'text-it-text' },
                    { label: '资产凭证', value: 'pufETH', style: 'text-it-text font-mono' },
                    { label: '目标合约', value: `${PUFFERVAULT_ADDRESS_SHORT} · Demo contract target`, style: 'text-it-text font-mono text-[10px]' },
                    { label: '调用方法', value: 'depositETH(address)', style: 'text-it-text font-mono text-[10px]' },
                    { label: '收益性质', value: '浮动收益，不是固定收益', style: 'text-amber-600' },
                    { label: '签名状态', value: '尚未签名', style: 'text-gray-400' },
                    { label: '广播状态', value: '尚未上链', style: 'text-gray-400' },
                    { label: '最终控制权', value: '用户决定', style: 'text-emerald-600 font-bold' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start justify-between gap-2">
                      <span className="text-[11px] text-gray-400 shrink-0">{item.label}</span>
                      <span className={`text-[11px] text-right ${item.style}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 p-3 rounded-xl bg-blue-50/60 border border-blue-100/80 flex gap-2">
                <Info className="w-4 h-4 text-it-blue shrink-0 mt-0.5" />
                <p className="text-[10px] text-gray-600 leading-relaxed">
                  pufETH 数量少于 ETH，不代表直接亏损。pufETH 与 ETH 不是简单数量 1:1，兑换率会随底层资产和收益变化。本 Demo 使用 Sepolia 测试签名 envelope，不代表主网 Puffer 质押。
                </p>
              </div>
            </div>
            <div className="px-4 pb-6 pt-2">
              <button onClick={goNext} className="w-full py-3 rounded-2xl puffer-cta text-[13px] font-semibold">
                继续风险扫描
              </button>
            </div>
          </div>
        );

      // === STEP 5: Risk Scan ===
      case 'risk-scan':
        return (
          <div className="w-full h-full bg-white flex flex-col overflow-hidden">
            <div className="px-4 pt-10 pb-2 flex items-center gap-2">
              <button onClick={goPrev} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[14px] font-semibold">风险扫描</span>
            </div>
            <div className="px-4 flex-1 overflow-y-auto space-y-2.5">
              {riskCards.map((card) => {
                const tone = getRiskToneClass(card.tone);
                const Icon = card.icon;
                return (
                  <div key={card.title} className={`p-4 rounded-2xl border ${tone.card}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 rounded-full ${tone.badge} flex items-center justify-center`}>
                        <Icon className={`w-3.5 h-3.5 ${tone.icon}`} />
                      </div>
                      <span className={`text-[12px] font-semibold ${tone.title}`}>{card.title}</span>
                    </div>
                    <div className="space-y-1.5">
                      {card.rows.map((row) => (
                        <div key={row} className="flex items-start gap-2">
                          {card.tone === 'safe' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          ) : (
                            <div className={`w-1 h-1 rounded-full ${tone.dot} mt-1.5 shrink-0`} />
                          )}
                          <p className="text-[11px] text-gray-600 leading-relaxed">{row}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-4 pb-6 pt-2">
              <button onClick={goNext} className="w-full py-3 rounded-2xl puffer-cta text-[13px] font-semibold flex items-center justify-center gap-2">
                <Key className="w-4 h-4" />
                开始本地签名
              </button>
            </div>
          </div>
        );

      // === STEP 6: Token Core Local Signing ===
      case 'token-core-sign':
        return (
          <div className="w-full h-full bg-white flex flex-col overflow-hidden">
            <div className="px-4 pt-10 pb-2 flex items-center gap-2">
              <button onClick={goPrev} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[14px] font-semibold">Token Core 本地签名</span>
              <span className={`ml-auto flex items-center gap-1 px-2 py-0.5 text-[9px] rounded-full ${
                tokenCore.status === 'success'
                  ? 'bg-emerald-50 text-emerald-600'
                  : tokenCore.status === 'error'
                    ? 'bg-red-50 text-red-600'
                    : tokenCore.status === 'running'
                      ? 'bg-blue-50 text-it-blue'
                      : 'bg-gray-100 text-gray-400'
              }`}>
                {tokenCore.status === 'running' ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : tokenCore.status === 'success' ? <Check className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                {tokenCore.status === 'success' ? 'Local proof' : tokenCore.status}
              </span>
            </div>

            <div className="px-4 flex-1 overflow-y-auto">
              {/* Runtime progress */}
              <div className="w-full h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    tokenCore.status === 'success'
                      ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                      : tokenCore.status === 'error'
                        ? 'bg-red-400'
                        : 'bg-gradient-to-r from-it-blue to-puffer-cyan'
                  }`}
                  style={{ width: tokenCore.status === 'success' ? '100%' : tokenCore.status === 'running' ? `${Math.max(signProg, 20)}%` : tokenCore.status === 'error' ? '100%' : '8%' }}
                />
              </div>

              {tokenCore.status === 'success' && (
                <div className="mb-3 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-100">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <Fingerprint className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[10px] font-semibold text-emerald-700 font-mono uppercase">Real tcx-wasm result</span>
                    </div>
                    <span className="text-[9px] text-emerald-600 font-mono">{tokenCoreRunMs ?? '-'} ms</span>
                  </div>
                  <div className="grid grid-cols-[48px_1fr] gap-x-2 gap-y-1 text-[9px] font-mono">
                    <span className="text-emerald-600/70">address</span>
                    <span className="text-it-text truncate">{tokenCore.derivedAddress}</span>
                    <span className="text-emerald-600/70">txHash</span>
                    <span className="text-it-text truncate">{formatShort(tokenCore.txHash ?? null)}</span>
                    <span className="text-emerald-600/70">msgSig</span>
                    <span className="text-it-text truncate">{formatShort(tokenCore.messageSignature)}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {[
                  { label: '初始化 tcx-wasm', done: tokenCore.wasmLoaded },
                  { label: '创建 TESTNET keystore', done: tokenCore.keystoreCreated },
                  { label: '派生 Sepolia 测试账户', done: Boolean(tokenCore.derivedAddress) },
                  { label: '生成 Puffer 交易意图', done: tokenCore.status === 'success' || tokenCore.txSigned },
                  { label: '调用 sign_tx (EIP-1559)', done: tokenCore.txSigned },
                  { label: '调用 sign_message', done: tokenCore.messageSigned },
                  { label: '清理本地 keystore', done: tokenCore.logs.some((log) => log.includes('clear_cached_keystore')) },
                ].map((step) => (
                  <div key={step.label} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50/40 border border-gray-50">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${step.done ? 'bg-emerald-100' : 'bg-gray-200'}`}>
                      {step.done ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <div className="w-2 h-2 rounded-full bg-gray-400" />}
                    </div>
                    <span className={`text-[11px] ${step.done ? 'text-it-text' : 'text-gray-400'}`}>{step.label}</span>
                    <span className={`ml-auto text-[9px] font-mono ${step.done ? 'text-emerald-500' : 'text-gray-300'}`}>
                      {step.done ? 'Done' : tokenCore.status === 'running' ? 'Running' : 'Idle'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Runtime evidence */}
              <div className="mt-4 space-y-2">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Fingerprint className={`w-3.5 h-3.5 ${tokenCore.derivedAddress ? 'text-emerald-500' : 'text-gray-300'}`} />
                    <span className="text-[10px] font-semibold text-gray-400 font-mono uppercase">Derived Address · Sepolia</span>
                  </div>
                  <p className={`text-[11px] font-mono px-2 py-1.5 rounded break-all ${tokenCore.derivedAddress ? 'text-it-text bg-white' : 'text-gray-300 bg-gray-100/60'}`}>
                    {tokenCore.derivedAddress ?? '未运行 / 点击开始'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <FileSignature className={`w-3.5 h-3.5 ${tokenCore.txSigned ? 'text-emerald-500' : 'text-gray-300'}`} />
                    <span className="text-[10px] font-semibold text-gray-400 font-mono uppercase">sign_tx</span>
                  </div>
                  <p className={`text-[10px] font-mono px-2 py-1.5 rounded truncate ${tokenCore.txSignature ? 'text-it-text bg-white' : 'text-gray-300 bg-gray-100/60'}`}>
                    {formatShort(tokenCore.txSignature)}
                  </p>
                  <p className="text-[9px] text-gray-400 mt-1 font-mono truncate">
                    Tx hash: {formatShort(tokenCore.txHash ?? null)}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <MessageSquare className={`w-3.5 h-3.5 ${tokenCore.messageSigned ? 'text-emerald-500' : 'text-gray-300'}`} />
                    <span className="text-[10px] font-semibold text-gray-400 font-mono uppercase">sign_message</span>
                  </div>
                  <p className={`text-[10px] font-mono px-2 py-1.5 rounded truncate ${tokenCore.messageSignature ? 'text-it-text bg-white' : 'text-gray-300 bg-gray-100/60'}`}>
                    {formatShort(tokenCore.messageSignature)}
                  </p>
                </div>

                {tokenCore.error && (
                  <div className="p-2 rounded-xl bg-red-50 border border-red-100 text-[10px] text-red-600">
                    Token Core failed: {tokenCore.error}
                  </div>
                )}

                <div className="p-2 rounded-xl bg-white border border-gray-100">
                  <p className="text-[9px] font-mono text-gray-400 mb-1">Runtime Evidence</p>
                  <div className="mb-1.5 space-y-0.5 text-[8px] text-gray-500 font-mono">
                    <p>WASM loaded: {String(tokenCore.wasmLoaded)}</p>
                    <p>TESTNET keystore created: {String(tokenCore.keystoreCreated)}</p>
                    <p>Network: {tokenCore.network}</p>
                    <p>sign_tx: {tokenCore.txSigned ? 'completed' : 'idle'}</p>
                    <p>sign_message: {tokenCore.messageSigned ? 'completed' : 'idle'}</p>
                  </div>
                  <div className="max-h-16 overflow-auto text-[8px] text-gray-500 font-mono space-y-0.5">
                    {tokenCore.logs.length ? tokenCore.logs.map((log) => <p key={log}>{log}</p>) : <p>Click Start to run Token Core locally.</p>}
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="px-2 py-1 text-[8px] font-mono bg-emerald-50 text-emerald-500 rounded border border-emerald-100">
                    Seed phrase requested: No
                  </span>
                  <span className="px-2 py-1 text-[8px] font-mono bg-emerald-50 text-emerald-500 rounded border border-emerald-100">
                    Private key exported: No
                  </span>
                </div>
              </div>
            </div>

            <div className="px-4 pb-6 pt-2">
              {tokenCoreReady ? (
                <div className="grid grid-cols-[1fr_1.25fr] gap-2">
                  <button onClick={handleRunTokenCore}
                    className="py-3 rounded-2xl bg-white text-it-blue border border-blue-100 text-[12px] font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-50 transition-all">
                    <RefreshCw className="w-3.5 h-3.5" />
                    重新运行
                  </button>
                  <button onClick={goNext}
                    className="py-3 rounded-2xl bg-it-blue text-white text-[13px] font-semibold shadow-lg shadow-blue-200 flex items-center justify-center gap-2 hover:bg-it-blue/90 transition-all">
                    <Lock className="w-4 h-4" />
                    进入最终确认
                  </button>
                </div>
              ) : (
                <button onClick={handleRunTokenCore} disabled={tokenCore.status === 'running'}
                  className="w-full py-3 rounded-2xl bg-it-blue text-white text-[13px] font-semibold shadow-lg shadow-blue-200 flex items-center justify-center gap-2 hover:bg-it-blue/90 transition-all disabled:opacity-60">
                  <Key className="w-4 h-4" />
                  {tokenCore.status === 'running' ? 'Token Core 运行中...' : tokenCore.status === 'error' ? '重试本地签名' : '开始本地签名'}
                </button>
              )}
              <p className="text-center text-[9px] text-gray-300 mt-1.5">真实调用 @consenlabs/tcx-wasm，不输入真实助记词</p>
            </div>
          </div>
        );

      // === STEP 7: Broadcast Gate ===
      case 'broadcast-gate':
        return (
          <div className="w-full h-full bg-white flex flex-col overflow-hidden">
            <div className="px-4 pt-10 pb-2 flex items-center gap-2">
              <button onClick={goPrev} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[14px] font-semibold">流程完成</span>
              <span className="ml-auto flex items-center gap-1 px-2 py-0.5 text-[9px] bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                <Check className="w-2.5 h-2.5" />
                Success
              </span>
            </div>

            <div className="px-4 flex-1 flex flex-col overflow-y-auto">
              {!gateConfirm ? (
                <>
                  <div className="flex flex-col items-center pt-6 pb-5">
                    <div className="relative w-24 h-24 mb-4">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-100 to-blue-100 animate-pulse" />
                      <div className="absolute inset-3 rounded-full bg-white flex items-center justify-center border-2 border-emerald-200 shadow-sm">
                        <Check className="w-9 h-9 text-emerald-500" />
                      </div>
                    </div>
                    <p className="text-lg font-bold text-it-text">准备完成，等待最终确认</p>
                    <p className="text-[12px] text-gray-400 mt-1 text-center">
                      Token Core 已完成本地签名。确认后展示 SafeSign 完成页。
                    </p>
                  </div>

                  <div className="space-y-2 mb-5">
                    {[
                      { label: 'Puffer Quote', value: pufferQuote.source === 'puffer-live' ? 'Live data' : 'Snapshot', color: 'text-it-blue' },
                      { label: '风险扫描', value: '已完成', color: 'text-emerald-500' },
                      { label: '本地签名', value: tokenCoreReady ? '已完成' : '未完成', color: tokenCoreReady ? 'text-emerald-500' : 'text-gray-400' },
                      { label: '最终控制权', value: 'User', color: 'text-emerald-500' },
                    ].map((item) => (
                      <div key={item.label} className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                        <span className="text-[12px] font-semibold text-gray-500">{item.label}</span>
                        <span className={`text-[12px] font-semibold ${item.color}`}>{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <button onClick={handleTryBroadcast} disabled={!tokenCoreReady}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-it-blue to-puffer-cyan text-white text-[13px] font-semibold shadow-lg shadow-blue-200 flex items-center justify-center gap-2 hover:opacity-90 transition-all mb-1 disabled:opacity-45 disabled:cursor-not-allowed">
                    <Check className="w-4 h-4" />
                    确认完成 SafeSign 流程
                  </button>
                  <p className="text-center text-[9px] text-gray-300 mb-4">
                    参赛 Demo 不发送真实 RPC；真实产品可在下一步交给钱包广播。
                  </p>
                </>
              ) : (
                <div className="animate-scale-in flex flex-col items-center pt-6">
                  <div className="relative w-24 h-24 mb-4">
                    <div className="absolute inset-0 rounded-full bg-emerald-100 animate-pulse" />
                    <div className="absolute inset-2 rounded-full bg-emerald-500 flex items-center justify-center border-4 border-white shadow-lg">
                      <Check className="w-10 h-10 text-white" />
                    </div>
                  </div>

                  <p className="text-xl font-bold text-it-text mb-1">SafeSign 流程完成</p>
                  <p className="text-[12px] text-gray-500 text-center mb-4">
                    用户已看懂报价、风险和签名结果。最终控制权保留在用户手里。
                  </p>

                  <div className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 mb-4">
                    <div className="space-y-2">
                      {[
                        { label: '报价', value: pufferQuote.estimatedPufEth ? `${pufferQuote.amountEth} ETH -> ${pufferQuote.estimatedPufEth} pufETH` : '已完成', color: 'text-it-blue' },
                        { label: '风险扫描', value: '已完成', color: 'text-emerald-500' },
                        { label: 'Token Core 签名', value: '已完成（本地）', color: 'text-emerald-500' },
                        { label: '真实资产', value: '未触碰', color: 'text-emerald-500' },
                        { label: '最终控制权', value: 'User', color: 'text-emerald-500' },
                      ].map((s) => (
                        <div key={s.label} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                          <span className="text-[11px] text-gray-400">{s.label}</span>
                          <span className={`text-[11px] font-semibold ${s.color}`}>{s.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 rounded-xl bg-white/80 border border-gray-100 p-2 space-y-0.5 text-[8px] font-mono text-gray-500">
                      <p>Signature: {broadcastGate.signatureGenerated ? 'generated' : 'pending'}</p>
                      <p>Demo RPC sent: false</p>
                      <p>On-chain submissions in demo: {broadcastGate.onchainSubmissions} tx</p>
                      <p>Real assets touched: {String(broadcastGate.realAssetsTouched)}</p>
                      <p>Next in real wallet: user broadcast confirmation</p>
                    </div>
                  </div>

                  <div className="w-full p-4 rounded-2xl bg-gradient-to-br from-it-blue to-puffer-cyan text-white text-center">
                    <p className="text-[13px] font-semibold opacity-90">Your digital world,</p>
                    <p className="text-[16px] font-bold">under your control.</p>
                  </div>

                  <button onClick={() => setGateConfirm(false)} className="mt-4 text-[11px] text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
                    <ChevronLeft className="w-3 h-3" /> 返回完成前确认
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section id="demo" className="py-20 md:py-28 px-5">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10">
          <span className="text-[11px] font-mono text-it-blue uppercase tracking-wider">Interactive Demo</span>
          <h2 className="text-2xl md:text-3xl font-bold text-it-text mt-2 tracking-tight">
            7 步安全流程演示
          </h2>
          <p className="text-[13px] text-it-text-secondary mt-2 max-w-lg mx-auto">
            每一步都有 SafeSign Buddy 小助手解释当前状态。第 3 步读取 Puffer 数据，第 6 步本地签名，第 7 步完成用户确认。
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {!isPlaying ? (
            <button onClick={handlePlay} className="px-4 py-2 bg-it-blue text-white text-[12px] font-semibold rounded-xl hover:bg-it-blue/90 transition-all flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" /> 自动播放
            </button>
          ) : (
            <button onClick={() => setIsPlaying(false)} className="px-4 py-2 bg-gray-100 text-gray-600 text-[12px] font-semibold rounded-xl">暂停</button>
          )}
          <button onClick={handleReset} className="px-3 py-2 text-[12px] text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> 重置
          </button>
          <button onClick={() => setShowBuddy(!showBuddy)} className="px-3 py-2 text-[12px] text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
            {showBuddy ? '隐藏' : '显示'} Buddy
          </button>
          <div className="flex items-center gap-1 ml-2">
            <button onClick={goPrev} disabled={stepIndex === 0} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-30 transition-colors hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[12px] text-gray-400 px-2">{stepIndex + 1} / {STEPS.length}</span>
            <button onClick={goNext} disabled={stepIndex === STEPS.length - 1} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-30 transition-colors hover:bg-gray-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Phone + Side Info */}
        <div className="flex flex-col lg:flex-row items-start justify-center gap-8">
          {/* Phone Frame with Buddy */}
          <div className="mx-auto lg:mx-0 flex-shrink-0 relative">
            <div className="phone-frame w-[300px] h-[600px]">
              <div className="phone-notch" />
              <div className="phone-home-bar" />
              {renderScreen()}
              {/* Buddy Assistant */}
              {showBuddy && <BuddyAssistant bubble={buddyMessage} />}
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex-1 max-w-sm">
            {/* Step pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {STEPS.map((screen, idx) => (
                <button key={screen} onClick={() => { setStepIndex(idx); setGateConfirm(false); }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-medium transition-all ${
                    idx === stepIndex ? 'bg-it-blue text-white shadow-sm' :
                    idx < stepIndex ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    idx === stepIndex ? 'bg-white/20' : idx < stepIndex ? 'bg-emerald-200' : 'bg-gray-200'
                  }`}>
                    {idx < stepIndex ? <Check className="w-3 h-3" /> : idx + 1}
                  </span>
                  {SCREEN_LABELS[screen]}
                </button>
              ))}
            </div>

            {/* Step description */}
            <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-card">
              <h3 className="text-[15px] font-semibold text-it-text mb-2">
                步骤 {stepIndex + 1}: {SCREEN_LABELS[currentScreen]}
              </h3>
              <p className="text-[13px] text-it-text-secondary leading-relaxed">
                {currentScreen === 'wallet-home' && '用户从 imToken 钱包首页进入，点击「质押」按钮。这是钱包用户最熟悉的路径起点。'}
                {currentScreen === 'staking-menu' && 'ETH 质押页展示三个选项。Puffer SafeSign 作为「签名前安全舱」新选项出现，带 NEW 标签。'}
                {currentScreen === 'puffer-input' && `Puffer Quote 页面。当前 source = ${sourceLabel}，展示 rate / APY / TVL / estimatedPufETH / updatedAt，失败时明确显示 Official snapshot。`}
                {currentScreen === 'pre-sign-translation' && '产品核心：钱包把 Puffer 质押交易翻译成确认单。用户看清付出、获得、合约、风险、控制权后再签名。'}
                {currentScreen === 'risk-scan' && 'Info / Warning / Safe by Design 三级卡片。不是阻止用户，而是让用户在知情的前提下做决定。'}
                {currentScreen === 'token-core-sign' && 'Token Core 本地签名页面。点击开始后会真实调用 tcx-wasm，展示 Derived Address / Tx Signature / Message Signature 和运行日志。'}
                {currentScreen === 'broadcast-gate' && '最终确认：用户看完报价、风险和 Token Core 本地签名结果后，确认完成 SafeSign 流程。参赛 Demo 不发送真实 RPC；真实产品可在下一步交给钱包广播。'}
              </p>

              <div className="flex flex-wrap gap-1.5 mt-3">
                {currentScreen === 'wallet-home' && <><span className="token-tag">imToken 风格</span><span className="token-tag">钱包首页</span></>}
                {currentScreen === 'staking-menu' && <><span className="token-tag">质押入口</span><span className="token-tag">Puffer SafeSign</span></>}
                {currentScreen === 'puffer-input' && <><span className="token-tag">source: {pufferQuote.source}</span><span className="token-tag">updatedAt: {pufferQuote.updatedAt ?? 'pending'}</span><span className="token-tag">receive: {pufferQuote.estimatedPufEth ?? 'pending'}</span></>}
                {currentScreen === 'pre-sign-translation' && <><span className="token-tag">签名前翻译</span><span className="token-tag">确认单</span></>}
                {currentScreen === 'risk-scan' && <><span className="token-tag">Info</span><span className="token-tag">Warning</span><span className="token-tag">Safe</span></>}
                {currentScreen === 'token-core-sign' && <><span className="token-tag">address: {tokenCore.derivedAddress ? 'generated' : 'idle'}</span><span className="token-tag">sign_tx: {tokenCore.txSigned ? 'completed' : 'idle'}</span><span className="token-tag">sign_message: {tokenCore.messageSigned ? 'completed' : 'idle'}</span></>}
                {currentScreen === 'broadcast-gate' && <><span className="token-tag">status: {broadcastGate.status}</span><span className="token-tag">onchain: 0</span><span className="token-tag">用户掌控</span></>}
              </div>

              {/* Pending notices */}
              {currentScreen === 'puffer-input' && (
                <div className="mt-3 p-2.5 rounded-xl bg-blue-50/50 border border-blue-100/60 flex items-start gap-2">
                  <WifiOff className="w-3.5 h-3.5 text-it-blue shrink-0 mt-0.5" />
                  <p className="text-[10px] text-it-blue/70 leading-relaxed">
                    数据源会在页面内标注。live API 不可用时使用官方快照，不会显示 $0M 假数据。
                  </p>
                </div>
              )}
              {currentScreen === 'token-core-sign' && (
                <div className="mt-3 p-2.5 rounded-xl bg-blue-50/50 border border-blue-100/60 flex items-start gap-2">
                  <Key className="w-3.5 h-3.5 text-it-blue shrink-0 mt-0.5" />
                  <p className="text-[10px] text-it-blue/70 leading-relaxed">
                    真实调用 Token Core：create_keystore、derive_accounts、sign_tx、sign_message、clear_cached_keystore。
                  </p>
                </div>
              )}
              {currentScreen === 'broadcast-gate' && (
                <div className="mt-3 p-2.5 rounded-xl bg-blue-50/50 border border-blue-100/60 flex items-start gap-2">
                  <Shield className="w-3.5 h-3.5 text-it-blue shrink-0 mt-0.5" />
                  <p className="text-[10px] text-it-blue/70 leading-relaxed">
                    这不是错误页。这是产品表达：签名可以生成，但上链必须由用户决定。
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
