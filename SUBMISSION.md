# Before You Sign：Puffer SafeSign

中文名：Puffer 签名前安全舱

## 作品简介

Puffer SafeSign 是一个基于 Token Core 的 Puffer 质押前安全签名层。它把 ETH -> pufETH 质押交易拆解成清晰的签名前确认单，说明资产流向、协议、合约方法、收益变量和广播边界；同时在浏览器本地调用 `@consenlabs/tcx-wasm` 生成测试签名，并通过 Broadcast Gate 阻止自动上链，把最终控制权交还给用户。

## 演示流程

1. 用户从 imToken 风格钱包首页进入质押。
2. 选择 Puffer SafeSign。
3. 第 3 步读取 Puffer Quote，显示 rate / estimated pufETH / APY / TVL / UniFi Vault / source / updatedAt。
4. 第 4 步生成签名前确认单，说明付出、获得、协议、合约、方法、收益性质、签名状态、广播状态。
5. 第 5 步做 Info / Warning / Safe by Design 风险扫描。
6. 第 6 步真实调用 Token Core / tcx-wasm，本地创建测试 keystore、派生 Sepolia 地址、执行 `sign_tx` 和 `sign_message`。
7. 第 7 步 Broadcast Gate 拦截广播，展示 `0 tx`、`real assets untouched`、`Final control: User`。

## 小蓝鲸助手

小蓝鲸助手负责在 7 步演示中解释当前状态。它读取 Puffer API、Token Core Runtime 和 Broadcast Gate 的真实状态，而不是播放固定文案。

## 使用的 Token Core 能力

- `create_keystore`
- `derive_accounts`
- `sign_tx`
- `sign_message`
- `clear_cached_keystore`

## 使用的 Puffer 数据

- pufETH rate
- estimated pufETH
- APY
- TVL
- UniFi Vault
- source / updatedAt

API 成功时显示 `Puffer live`。API 失败时显示 `Official snapshot`，不把快照伪装成实时数据。

## Broadcast Gate

- Signature generated
- Broadcast blocked
- On-chain submissions: 0 tx
- Real assets touched: false
- Final control: User

## 安全边界

- Sepolia / TESTNET only
- No real seed phrase
- No private key export
- No real asset handling
- No automatic broadcast
- No RPC broadcast is fired by `Try to Broadcast`

## 官方材料映射

- Token Core: 本地 keystore、账户派生、交易签名、消息签名。
- Token UI: imToken 风格钱包界面、卡片、按钮、底部导航。
- Security Skill: 风险分级、签名前披露、安全边界说明。
- Token Core CLI Demo: `wallet -> analyze -> policy -> sign -> broadcast gate` 被映射成产品流程。
- Workshop: 测试网安全演示、可运行 Demo、清楚说明作品边界。
