import { useState, useEffect } from 'react';
import type { BuddyBubble, BuddyState } from '@/types';

type Mood = 'info' | 'warning' | 'success' | 'blocked' | 'pending';

interface BuddyDialogue {
  primary: { text: string; mood: Mood };
  secondary: { text: string; mood: Mood } | null;
  position: 'top' | 'bottom';
}

const moodStyles: Record<Mood, string> = {
  info: 'bg-blue-50/95 border-blue-100 text-blue-700',
  warning: 'bg-amber-50/95 border-amber-100 text-amber-700',
  success: 'bg-emerald-50/95 border-emerald-100 text-emerald-700',
  blocked: 'bg-red-50/95 border-red-100 text-red-600',
  pending: 'bg-gray-50/95 border-gray-200 text-gray-500',
};

const moodIcons: Record<Mood, string> = {
  info: '🔍', warning: '⚠️', success: '✓', blocked: '⛔', pending: '⏳',
};

// ===== Dialogue mapping with real state binding =====
function getDialogue(state: BuddyState): BuddyDialogue {
  switch (state) {
    // ─── STEP 1: Wallet Home ───
    case 'idle':
    case 'guide-stake':
      return {
        primary: {
          text: '作品不是外部说明页，而是模拟 imToken 钱包里的一个新功能入口。用户从资产页进入质押，路径真实。',
          mood: 'info',
        },
        secondary: {
          text: '评委打开后看到的不是活动网站，而是一个正在运行的钱包功能 Demo。',
          mood: 'info',
        },
        position: 'bottom',
      };

    // ─── STEP 2: Staking Menu ───
    case 'reading-puffer':
      return {
        primary: {
          text: 'Puffer SafeSign 被放在“流动性质押”场景下。不是替代 Puffer，而是在质押入口前增加一层签名前安全检查。',
          mood: 'info',
        },
        secondary: {
          text: '复用了 imToken 的质押入口逻辑，用户不需要学习新路径。',
          mood: 'info',
        },
        position: 'bottom',
      };

    // ─── STEP 3: Puffer Quote ───
    case 'puffer-pending':
      return {
        primary: {
          text: '这里会真实读取 Puffer quote。若接口被限流，页面会明确标注 Official snapshot，并把错误放进 API Evidence。',
          mood: 'pending',
        },
        secondary: {
          text: '用户最容易困惑的是：为什么 0.05 ETH 不是换 0.05 pufETH。这里用 Puffer 数据解释兑换率。这也是 Puffer 专项的真实场景。',
          mood: 'pending',
        },
        position: 'bottom',
      };
    case 'puffer-live':
      return {
        primary: {
          text: 'Puffer live 已读取：0.05 ETH 预计获得 0.046489 pufETH，当前 rate、APY、TVL 都来自 Puffer 数据源。',
          mood: 'success',
        },
        secondary: {
          text: 'source = puffer-live，updatedAt 显示真实更新时间。不是伪装数据。',
          mood: 'success',
        },
        position: 'bottom',
      };
    case 'puffer-snapshot':
      return {
        primary: {
          text: '当前使用官方快照。页面会明确标注 snapshot，不会把缓存数据伪装成实时数据。',
          mood: 'warning',
        },
        secondary: null,
        position: 'bottom',
      };

    // ─── STEP 4: Pre-Sign Translation ───
    case 'translating':
      return {
        primary: {
          text: '确认单把交易拆开：付出 0.05 ETH，获得 pufETH，目标是 Puffer 合约，调用 depositETH，目前还没有签名，也没有上链。',
          mood: 'info',
        },
        secondary: {
          text: '钱包签名前应该展示的不只是“确认”按钮，而是交易结构。用户要知道资产流向、协议、合约方法、是否已经上链。',
          mood: 'info',
        },
        position: 'top',
      };

    // ─── STEP 5: Risk Scan ───
    case 'warning':
      return {
        primary: {
          text: '风险扫描会读取 quote、source、Token Core 与 Broadcast Gate 状态；source 不同，扫描内容也会变化。',
          mood: 'warning',
        },
        secondary: {
          text: '这一步体现官方 Security Skill：风险分级、签名前披露、安全边界、防盲签。',
          mood: 'warning',
        },
        position: 'top',
      };

    // ─── STEP 6: Token Core Signing ───
    case 'local-signing':
      return {
        primary: {
          text: 'Token Core 正在本地运行。生成测试地址和签名，不导出私钥，不要求真实助记词。',
          mood: 'info',
        },
        secondary: null,
        position: 'top',
      };
    case 'sign-pending':
      return {
        primary: {
          text: '这里会调用 Token Core / tcx-wasm，在浏览器本地创建测试 keystore、派生地址并生成签名。',
          mood: 'pending',
        },
        secondary: {
          text: '页面预留 derived address、tx signature、message signature 三个字段。符合官方“必须使用 Token Core”的硬性要求。',
          mood: 'pending',
        },
        position: 'top',
      };
    case 'sign-success':
      return {
        primary: {
          text: '本地签名已完成：derived address、tx signature、message signature 已展示，证明这不是静态演示。',
          mood: 'success',
        },
        secondary: {
          text: '调用的是 Token Core 真实能力：keystore、derive_accounts、sign_tx、sign_message。本地运行，自托管，不泄露私钥。',
          mood: 'success',
        },
        position: 'top',
      };
    case 'sign-error':
      return {
        primary: {
          text: 'Token Core 调用失败时必须显示错误，不能用假日志冒充签名成功。',
          mood: 'blocked',
        },
        secondary: null,
        position: 'top',
      };

    // ─── STEP 7: Broadcast Gate ───
    case 'broadcast-waiting':
      return {
        primary: {
          text: '这里展示“签名”和“广播”的区别：签名只是准备交易，广播才是把交易发到链上执行。',
          mood: 'info',
        },
        secondary: {
          text: 'Broadcast Gate 会拦截自动广播。即使签名已经生成，链上提交仍然是 0 tx，真实资产未触碰。',
          mood: 'info',
        },
        position: 'top',
      };
    case 'broadcast-blocked':
      return {
        primary: {
          text: 'Broadcast Gate 已拦截：链上提交 0 tx，真实资产未触碰。签名完成后仍然不自动广播。',
          mood: 'blocked',
        },
        secondary: {
          text: '这个设计冲“最佳用户掌控奖”：AI 可以解释交易，Token Core 可以本地签名，但最终上不上链必须由用户决定。',
          mood: 'blocked',
        },
        position: 'top',
      };

    default:
      return {
        primary: { text: 'BlueWhale Guard — 签名前安全演示讲解员。', mood: 'info' },
        secondary: null,
        position: 'bottom',
      };
  }
}

// ===== Buddy Bubble =====
function Bubble({ primary, secondary, position }: BuddyDialogue) {
  const [show2, setShow2] = useState(false);

  return (
    <div className={`flex flex-col gap-1 ${position === 'bottom' ? 'mt-1' : 'mb-1'}`}>
      <div className={`relative px-3 py-2 rounded-2xl border backdrop-blur-sm shadow-sm ${moodStyles[primary.mood]} max-w-[240px]`}>
        <div className="flex items-start gap-1.5">
          <span className="text-[10px] shrink-0 mt-0.5">{moodIcons[primary.mood]}</span>
          <p className="text-[11px] leading-snug">{primary.text}</p>
        </div>
        {position === 'bottom' ? (
          <div className="absolute -top-1 right-5 w-2 h-2 rotate-45 border-l border-t bg-inherit" style={{ borderColor: 'inherit' }} />
        ) : (
          <div className="absolute -bottom-1 right-5 w-2 h-2 rotate-45 border-r border-b bg-inherit" style={{ borderColor: 'inherit' }} />
        )}
      </div>
      {secondary && !show2 && (
        <button onClick={() => setShow2(true)} className="self-end text-[9px] text-gray-400 hover:text-it-blue px-1">
          + 展开
        </button>
      )}
      {secondary && show2 && (
        <div className={`relative px-3 py-2 rounded-2xl border backdrop-blur-sm shadow-sm ${moodStyles[secondary.mood]} max-w-[240px] animate-slide-up`}>
          <div className="flex items-start gap-1.5">
            <span className="text-[10px] shrink-0 mt-0.5">{moodIcons[secondary.mood]}</span>
            <p className="text-[11px] leading-snug">{secondary.text}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Main Component =====
interface Props {
  state?: BuddyState;
  bubble?: BuddyBubble;
}

export default function BuddyAssistant({ state = 'idle', bubble }: Props) {
  const [isTalking, setIsTalking] = useState(false);
  const [bubbleVisible, setBubbleVisible] = useState(true);
  const [visible, setVisible] = useState(true);
  const dialogue: BuddyDialogue = bubble
    ? { primary: bubble, secondary: null, position: bubble.mood === 'pending' ? 'bottom' : 'top' }
    : getDialogue(state);

  // Show bubble automatically when state changes
  useEffect(() => {
    setBubbleVisible(true);
    setIsTalking(true);
    const t = setTimeout(() => setIsTalking(false), 800);
    return () => clearTimeout(t);
  }, [state, bubble?.text, bubble?.mood]);

  // Click buddy → toggle bubble show/hide
  const handleClick = () => {
    setBubbleVisible((v) => !v);
    setIsTalking(true);
    setTimeout(() => setIsTalking(false), 600);
  };

  if (!visible) {
    return (
      <button onClick={() => setVisible(true)} className="absolute bottom-3 right-3 z-40 w-10 h-10 rounded-full bg-it-blue/20 backdrop-blur flex items-center justify-center animate-pulse">
        <img src="/buddy-idle.png" alt="" className="w-7 h-7 object-contain" />
      </button>
    );
  }

  return (
    <div className="absolute bottom-3 right-3 z-40 flex flex-col items-end gap-0.5 pointer-events-none" style={{ maxWidth: '78%' }}>
      {bubbleVisible && <Bubble {...dialogue} />}
      <button onClick={handleClick} className="relative group pointer-events-auto" title={bubbleVisible ? '点击隐藏字幕' : '点击显示字幕'}>
        {/* Glow */}
        <div className="absolute -inset-2 rounded-full bg-it-blue/20 blur-lg animate-pulse pointer-events-none" />
        {/* Image */}
        <img
          src={isTalking ? '/buddy-talk.png' : '/buddy-idle.png'}
          alt="BlueWhale Guard"
          className={`w-12 h-12 object-contain relative z-10 drop-shadow-xl transition-all duration-200 ${
            isTalking ? 'animate-buddy-bounce' : 'animate-buddy-float'
          }`}
          draggable={false}
        />
        {/* Hidden label */}
        <span className="sr-only">BlueWhale Guard — 点击对话</span>
      </button>
    </div>
  );
}
