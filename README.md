# Before You Sign — Puffer SafeSign

一个基于 Token Core 的 imToken 风格 Puffer 质押前安全签名层。

This is a testnet prototype. It uses Puffer data when available, uses Token Core / `tcx-wasm` for local demo signing, and blocks automatic broadcast so final on-chain submission stays under user control.

## Live Demo

https://cbl980712-coder.github.io/before-you-sign-puffer-safesign/

## Demo Flow

1. imToken 风格钱包首页
2. 质押入口
3. Puffer Quote: `0.05 ETH` -> estimated `pufETH`
4. 签名前确认单
5. 风险扫描
6. Token Core 本地签名
7. Broadcast Gate 广播闸门

## Real Integrations

- Puffer API: pufETH rate, estimated pufETH, APY, TVL, UniFi Vault, `source`, `updatedAt`.
- Token Core / `@consenlabs/tcx-wasm`: `create_keystore`, `derive_accounts`, `sign_tx`, `sign_message`, `clear_cached_keystore`.
- Broadcast Gate: `signature generated`, `broadcast blocked`, `0 tx on-chain`, `real assets untouched`.
- SafeSign Buddy: 小蓝鲸助手读取 Puffer Quote、Token Core Runtime 和 Broadcast Gate 的真实状态，不是固定文案。

## Safety Boundary

本作品是测试网原型。

- Sepolia / TESTNET only
- No real seed phrase
- No private key export
- No real asset handling
- No automatic broadcast
- Puffer API 失败时使用官方快照，并明确显示 `Official snapshot`
- Token Core 失败时显示真实错误，不用假日志冒充成功

## Local Run

```bash
npm install
npm run dev
npm run build
```

The Vite dev server proxies:

```text
/puffer-api -> https://api-v2.puffer.fi
```

Core files:

```text
src/features/wallet/puffer-data.ts
src/features/wallet/tcx-core.ts
src/features/wallet/broadcast-gate.ts
src/features/wallet/demo-state.ts
src/sections/PhoneDemoSection.tsx
src/sections/BuddyAssistant.tsx
```
