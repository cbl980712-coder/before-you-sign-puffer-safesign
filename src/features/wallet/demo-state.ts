import type { BroadcastGateState, BuddyBubble, PufferQuoteState, TokenCoreState } from '@/types';
import { formatPercent, formatRate, formatShort, formatUsd } from './puffer-data';

export const PUFFER_QUOTE_PENDING: PufferQuoteState = {
  amountEth: '0.05',
  estimatedPufEth: null,
  pufEthPerEth: null,
  ethPerPufEth: null,
  apy: null,
  tvlUsd: null,
  unifiVaultUsd: null,
  source: 'pending',
  updatedAt: null,
};

export const TOKEN_CORE_IDLE: TokenCoreState = {
  status: 'idle',
  wasmLoaded: false,
  keystoreCreated: false,
  network: 'Sepolia / TESTNET',
  chainId: 11155111,
  derivedAddress: null,
  txSigned: false,
  txSignature: null,
  txHash: null,
  messageSigned: false,
  messageSignature: null,
  seedPhraseRequested: false,
  privateKeyExported: false,
  logs: [],
};

export const BROADCAST_GATE_PENDING: BroadcastGateState = {
  status: 'pending',
  signatureGenerated: false,
  onchainSubmissions: 0,
  realAssetsTouched: false,
  reason: 'Local signature has not been generated yet.',
};

type BuddyMessage = BuddyBubble & {
  icon: string;
  tone: BuddyBubble['mood'];
};

function quoteAmount(quote: PufferQuoteState) {
  return quote.estimatedPufEth
    ? `${quote.amountEth} ETH -> ${quote.estimatedPufEth} pufETH`
    : `${quote.amountEth} ETH`;
}

function apiFallbackText(error?: string) {
  if (error?.includes('429')) {
    return 'Puffer 接口返回 429 限流。这里切到官方快照，并把错误保留在 API Evidence，不把快照伪装成实时数据。';
  }
  return 'Puffer live 暂时没有返回完整数据。这里切到官方快照，并把错误保留在 API Evidence。';
}

export function getBuddyMessage({
  step,
  pufferQuote,
  tokenCore,
  broadcastGate,
}: {
  step: number;
  pufferQuote: PufferQuoteState;
  tokenCore: TokenCoreState;
  broadcastGate: BroadcastGateState;
}): BuddyMessage {
  if (step === 1) {
    return {
      text: '起点是 imToken 钱包首页。用户不是来读活动说明的，而是从熟悉的「质押」入口进入一个签名前安全流程。',
      mood: 'info',
      icon: 'i',
      tone: 'info',
    };
  }

  if (step === 2) {
    return {
      text: '这里不是普通 Puffer 入口，而是新增的 SafeSign 入口：先生成报价，再翻译交易，再做风险扫描，最后才允许本地签名。',
      mood: 'info',
      icon: 'i',
      tone: 'info',
    };
  }

  if (step === 3) {
    if (pufferQuote.source === 'pending') {
      return {
        text: '正在读取 Puffer quote：rate、APY、TVL、UniFi Vault 会一起决定后面的确认单和风险扫描。',
        mood: 'pending',
        icon: '...',
        tone: 'pending',
      };
    }

    if (pufferQuote.source === 'puffer-live') {
      return {
        text: `Puffer 数据已进入流程：${quoteAmount(pufferQuote)}，rate ${formatRate(pufferQuote.pufEthPerEth)}，APY ${formatPercent(pufferQuote.apy)}，TVL ${formatUsd(pufferQuote.tvlUsd)}。`,
        mood: 'success',
        icon: 'ok',
        tone: 'success',
      };
    }

    return {
      text: apiFallbackText(pufferQuote.error),
      mood: 'warning',
      icon: '!',
      tone: 'warning',
    };
  }

  if (step === 4) {
    return {
      text: `确认单不是装饰：它正在使用第 3 步的 quote。你将付出 ${pufferQuote.amountEth} ETH，预计获得 ${pufferQuote.estimatedPufEth ?? '待计算'} pufETH；签名状态仍是未签名，广播状态仍是未上链。`,
      mood: 'info',
      icon: 'i',
      tone: 'info',
    };
  }

  if (step === 5) {
    const sourceLine =
      pufferQuote.source === 'puffer-live'
        ? '风险扫描使用 live quote。'
        : '风险扫描使用官方快照，并明确提示它不是实时收益。';
    return {
      text: `${sourceLine} 当前 rate=${formatRate(pufferQuote.pufEthPerEth)}，APY=${formatPercent(pufferQuote.apy)}，Token Core 状态=${tokenCore.status}。这些状态会改变扫描条目。`,
      mood: pufferQuote.source === 'puffer-live' ? 'info' : 'warning',
      icon: pufferQuote.source === 'puffer-live' ? 'i' : '!',
      tone: pufferQuote.source === 'puffer-live' ? 'info' : 'warning',
    };
  }

  if (step === 6) {
    if (tokenCore.status === 'running') {
      return {
        text: 'Token Core 正在浏览器本地运行：加载 wasm、创建测试 keystore、派生 Sepolia 地址、生成 sign_tx 和 sign_message。',
        mood: 'info',
        icon: '...',
        tone: 'info',
      };
    }

    if (tokenCore.status === 'success') {
      return {
        text: `本地签名完成。地址 ${formatShort(tokenCore.derivedAddress)}，tx ${formatShort(tokenCore.txHash ?? tokenCore.txSignature)}，message signature 已生成；下一步由用户确认完成 SafeSign 流程。`,
        mood: 'success',
        icon: 'ok',
        tone: 'success',
      };
    }

    if (tokenCore.status === 'error') {
      return {
        text: `Token Core 调用失败：${tokenCore.error ?? 'unknown error'}。页面不会用假日志冒充成功。`,
        mood: 'blocked',
        icon: 'x',
        tone: 'blocked',
      };
    }

    return {
      text: '点击开始后才会调用 tcx-wasm。未运行时，地址和签名都必须保持空，不能提前显示成功态。',
      mood: 'pending',
      icon: '...',
      tone: 'pending',
    };
  }

  if (step === 7) {
    if (broadcastGate.status === 'blocked') {
      return {
        text: 'SafeSign 流程完成：报价、风险扫描、本地签名和最终确认都已走完。真实产品可在下一步交给钱包广播；本 Demo 不发送真实 RPC。',
        mood: 'success',
        icon: 'ok',
        tone: 'success',
      };
    }

    if (broadcastGate.status === 'ready') {
      return {
        text: '签名已经生成。下一步是最终确认完成页，展示 SafeSign 安全流程已完成。',
        mood: 'info',
        icon: 'i',
        tone: 'info',
      };
    }

    return {
      text: '完成页等待第 6 步真实签名结果。没有 sign_tx / sign_message，就不能进入最终完成状态。',
      mood: 'pending',
      icon: '...',
      tone: 'pending',
    };
  }

  return {
    text: 'SafeSign 的主线是：报价 -> 翻译 -> 扫描 -> 本地签名 -> 暂停提交。每一步都应该让用户知道自己在控制什么。',
    mood: 'info',
    icon: 'i',
    tone: 'info',
  };
}
