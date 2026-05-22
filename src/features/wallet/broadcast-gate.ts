import type { BroadcastGateState, TokenCoreState } from '@/types';

export function getBroadcastGateState(tokenCore: TokenCoreState): BroadcastGateState {
  if (tokenCore.status === 'success' && tokenCore.txSigned && tokenCore.messageSigned) {
    return {
      status: 'ready',
      signatureGenerated: true,
      onchainSubmissions: 0,
      realAssetsTouched: false,
      reason: '签名已在本地生成。交易尚未提交，等待用户最终确认。',
    };
  }

  return {
    status: 'pending',
    signatureGenerated: false,
    onchainSubmissions: 0,
    realAssetsTouched: false,
    reason: '请先完成本地签名。',
  };
}

export function tryBroadcast(tokenCore: TokenCoreState): BroadcastGateState {
  if (tokenCore.status !== 'success' || !tokenCore.txSigned || !tokenCore.messageSigned) {
    return {
      status: 'pending',
      signatureGenerated: false,
      onchainSubmissions: 0,
      realAssetsTouched: false,
      reason: '请先完成本地签名。',
    };
  }

  return {
    status: 'blocked',
    signatureGenerated: true,
    onchainSubmissions: 0,
    realAssetsTouched: false,
    reason: 'SafeSign 演示流程已完成。真实产品可在下一步交由钱包广播；本 Demo 不发送真实 RPC。',
  };
}
