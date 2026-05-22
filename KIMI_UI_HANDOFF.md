# Kimi UI -> Codex Integration Handoff

Kimi 的 7 步视觉流程已保留。Codex 已在现有页面结构中接入真实能力，没有重做视觉。

## 已接入模块

- `src/features/wallet/puffer-data.ts`
  - 请求 Puffer API
  - 成功显示 `Puffer live`
  - 失败显示 `Official snapshot`
  - 输出 `source`、`updatedAt`、raw fields

- `src/features/wallet/tcx-core.ts`
  - 真实调用 `@consenlabs/tcx-wasm`
  - 执行 `create_keystore`
  - 执行 `derive_accounts`
  - 执行 `sign_tx`
  - 执行 `sign_message`
  - 执行 `clear_cached_keystore`

- `src/features/wallet/broadcast-gate.ts`
  - 只在本地签名成功后进入 ready
  - 点击 Try to Broadcast 不发 RPC
  - 前端拦截并显示 `blocked`
  - 链上提交保持 `0 tx`

- `src/features/wallet/demo-state.ts`
  - 统一 Puffer Quote、Token Core、Broadcast Gate 状态
  - 小蓝鲸助手读取真实状态生成台词

## 视觉边界

保留：

- imToken 风格手机钱包
- 7 步演示
- 小蓝鲸助手
- Puffer 深海视觉
- Broadcast Gate 记忆点

没有改成说明站，也没有堆官方材料卡片。

## 验收入口

主要体验位置：页面中的 `7 步安全流程演示`。

关键步骤：

- 第 3 步看 Puffer Quote 和 API Evidence
- 第 6 步点击 `开始本地签名`
- 第 7 步点击 `尝试广播`
