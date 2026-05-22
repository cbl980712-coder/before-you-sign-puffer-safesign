import type { BuddyBubble, BuddyState } from '@/types';
export {
  BROADCAST_GATE_PENDING,
  PUFFER_QUOTE_PENDING,
  TOKEN_CORE_IDLE as TOKEN_CORE_PENDING,
} from '@/features/wallet/demo-state';

// === 7 Step Order ===
export const SCREEN_ORDER = [
  'wallet-home',
  'staking-menu',
  'puffer-input',
  'pre-sign-translation',
  'risk-scan',
  'token-core-sign',
  'broadcast-gate',
] as const;

export const SCREEN_LABELS: Record<string, string> = {
  'wallet-home': '钱包首页',
  'staking-menu': '质押入口',
  'puffer-input': 'Puffer Quote',
  'pre-sign-translation': '签名前翻译',
  'risk-scan': '风险扫描',
  'token-core-sign': '本地签名',
  'broadcast-gate': '流程完成',
};

// === Puffer Vault Info ===
export const PUFFERVAULT_ADDRESS = '0xD9A442856C234a39a81a089C06451EBAa4306a72';
export const PUFFERVAULT_ADDRESS_SHORT = '0xD9A4...6a72';
export const DEPOSIT_SELECTOR = '0x2d2da806';

// === Buddy State Machine: State → Bubble + Mood ===
export const BUDDY_DIALOGUES: Record<BuddyState, BuddyBubble> = {
  'idle': {
    text: '准备质押 ETH？我会先帮你看懂这笔交易，再让你决定要不要签。',
    mood: 'info',
  },
  'guide-stake': {
    text: 'Puffer SafeSign 是签名前安全舱，不是直接质押。先看懂，再签名。',
    mood: 'info',
  },
  'reading-puffer': {
    text: '我会读取 Puffer 数据，告诉你预计获得多少 pufETH。',
    mood: 'info',
  },
  'puffer-pending': {
    text: '正在读取 Puffer API，失败时会明确切换到官方快照。',
    mood: 'pending',
  },
  'puffer-live': {
    text: '数据来自 Puffer live，已拿到最新 rate 和 APY。',
    mood: 'success',
  },
  'puffer-snapshot': {
    text: '当前使用官方快照，我不会把快照伪装成实时数据。',
    mood: 'warning',
  },
  'translating': {
    text: '我把这笔交易翻译成人话了：你付出 ETH，获得 pufETH，还没有签名，也没有上链。',
    mood: 'info',
  },
  'warning': {
    text: '我发现 3 类信息：操作本质、潜在风险、安全边界。先看完，再决定是否继续。',
    mood: 'warning',
  },
  'local-signing': {
    text: 'Token Core 正在本地生成签名，私钥不会离开你的设备。',
    mood: 'info',
  },
  'sign-pending': {
    text: '点击开始后会调用 Token Core，本地生成测试地址和签名。',
    mood: 'pending',
  },
  'sign-success': {
    text: '本地签名完成。测试地址和签名结果已生成，但交易还没有广播。',
    mood: 'success',
  },
  'sign-error': {
    text: 'Token Core 调用失败，我不会伪造成成功。',
    mood: 'blocked',
  },
  'broadcast-waiting': {
    text: '签名已经生成，但不会自动上链。最后一步必须由你确认。',
    mood: 'info',
  },
  'broadcast-blocked': {
    text: 'Broadcast Gate 已拦截。链上提交 0 笔，真实资产未触碰。',
    mood: 'blocked',
  },
};

// === Buddy Action Icons per state ===
export const BUDDY_ACTIONS: Record<BuddyState, string> = {
  'idle': 'float',
  'guide-stake': 'point',
  'reading-puffer': 'sparkle',
  'puffer-pending': 'wait',
  'puffer-live': 'check',
  'puffer-snapshot': 'warn',
  'translating': 'magnify',
  'warning': 'shield',
  'local-signing': 'key',
  'sign-pending': 'key-wait',
  'sign-success': 'key-check',
  'sign-error': 'key-error',
  'broadcast-waiting': 'stop',
  'broadcast-blocked': 'gate-close',
};

// === Step → Buddy State mapping ===
export const STEP_TO_BUDDY: Record<string, BuddyState> = {
  'wallet-home': 'guide-stake',
  'staking-menu': 'guide-stake',
  'puffer-input': 'puffer-pending',
  'pre-sign-translation': 'translating',
  'risk-scan': 'warning',
  'token-core-sign': 'sign-pending',
  'broadcast-gate': 'broadcast-waiting',
};

// === Evidence Items (Region E) ===
export const EVIDENCE_ITEMS = [
  {
    title: 'Token Core',
    desc: '用于本地 keystore、账户派生、签名',
    tags: ['@consenlabs/tcx-wasm', 'TESTNET'],
  },
  {
    title: 'Token UI',
    desc: 'imToken 风格钱包 UI 组件',
    tags: ['React', '大圆角', '白底蓝卡'],
  },
  {
    title: 'Security Skill',
    desc: '风险分级、签名前披露、安全边界',
    tags: ['Info/Warning/Danger/Block'],
  },
  {
    title: 'CLI Demo',
    desc: 'wallet → analyze → policy → sign → broadcast gate',
    tags: ['CLI Flow', 'Policy 预检'],
  },
  {
    title: 'Workshop',
    desc: '可运行 Demo、测试网、安全边界',
    tags: ['Sepolia', '空白钱包'],
  },
];
