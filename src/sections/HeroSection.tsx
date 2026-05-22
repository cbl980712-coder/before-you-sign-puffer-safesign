import { useEffect, useRef } from 'react';
import { BarChart3, ChevronRight, Compass, Copy, Gem, History, Orbit, Play, QrCode, Send, User, Wallet } from 'lucide-react';
import gsap from 'gsap';

export default function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.hero-badge', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.2 });
      gsap.fromTo('.hero-title', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.4 });
      gsap.fromTo('.hero-subtitle', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.6 });
      gsap.fromTo('.hero-cta', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.8 });
      gsap.fromTo('.hero-phone', { opacity: 0, y: 30, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, delay: 0.5, ease: 'power2.out' });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  const scrollToDemo = () => document.querySelector('#demo')?.scrollIntoView({ behavior: 'smooth' });
  const actionItems = [
    { label: '转账', icon: Send },
    { label: '收款', icon: QrCode },
    { label: '记录', icon: History },
    { label: '质押', icon: Gem },
    { label: '生态', icon: Orbit },
  ];
  const navItems = [
    { label: '钱包', icon: Wallet },
    { label: '市场', icon: BarChart3 },
    { label: '浏览', icon: Compass },
    { label: '我', icon: User },
  ];

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center pt-14 pb-16 overflow-hidden">
      {/* Deep ocean gradient background */}
      <div className="absolute inset-0 ocean-gradient" />
      
      {/* Floating bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="bubble w-20 h-20 top-[20%] left-[10%]" style={{ animationDelay: '0s', animationDuration: '7s' }} />
        <div className="bubble w-14 h-14 top-[40%] left-[5%]" style={{ animationDelay: '2s', animationDuration: '9s' }} />
        <div className="bubble w-24 h-24 top-[15%] right-[8%]" style={{ animationDelay: '1s', animationDuration: '8s' }} />
        <div className="bubble w-16 h-16 top-[50%] right-[12%]" style={{ animationDelay: '3s', animationDuration: '6s' }} />
        <div className="bubble w-10 h-10 top-[70%] left-[15%]" style={{ animationDelay: '4s', animationDuration: '10s' }} />
        <div className="bubble w-18 h-18 top-[60%] right-[5%]" style={{ animationDelay: '1.5s', animationDuration: '7s' }} />
      </div>

      {/* Subtle wave pattern at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 opacity-30 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,212,255,0.08), transparent)' }} />

      <div className="max-w-6xl mx-auto px-5 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <div className="order-2 lg:order-1">
            <div className="hero-badge opacity-0 mb-5">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-it-blue bg-blue-50 rounded-full border border-blue-100">
                <span className="w-1.5 h-1.5 rounded-full bg-it-blue animate-pulse" />
                imToken 十周年 AI 共创
              </span>
            </div>

            <h1 className="hero-title text-3xl sm:text-4xl lg:text-[42px] font-bold text-it-text tracking-tight leading-[1.15] opacity-0">
              Before you stake,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-it-blue to-puffer-cyan">
                know what you sign.
              </span>
            </h1>

            <p className="hero-subtitle mt-4 text-[15px] text-it-text-secondary leading-relaxed max-w-md opacity-0">
              Puffer SafeSign 是一个基于 Token Core 的签名前安全舱。在你把 ETH 质押到 Puffer 前，先解释收益、合约、签名和广播风险。
            </p>

            <div className="hero-cta mt-7 flex flex-wrap gap-3 opacity-0">
              <button onClick={scrollToDemo}
                className="group inline-flex items-center gap-2 px-5 py-2.5 bg-it-blue text-white text-[13px] font-semibold rounded-2xl hover:bg-it-blue/90 transition-all shadow-glow">
                <Play className="w-4 h-4" />
                开始 60 秒演示
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button onClick={() => document.querySelector('#tokencore')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium text-it-text border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all">
                运行 Token Core
              </button>
            </div>

            {/* Quick stats */}
            <div className="hero-cta mt-8 flex gap-6 opacity-0">
              <div>
                <p className="text-lg font-bold text-it-text">7</p>
                <p className="text-[11px] text-it-text-tertiary">步安全流程</p>
              </div>
              <div className="w-px bg-gray-200" />
              <div>
                <p className="text-lg font-bold text-it-text">0.05 ETH</p>
                <p className="text-[11px] text-it-text-tertiary">演示质押金额</p>
              </div>
              <div className="w-px bg-gray-200" />
              <div>
                <p className="text-lg font-bold text-it-text">0 tx</p>
                <p className="text-[11px] text-it-text-tertiary">链上提交</p>
              </div>
            </div>
          </div>

          {/* Right: Phone Mockup */}
          <div className="hero-phone order-1 lg:order-2 flex justify-center opacity-0">
            <div className="phone-frame w-[280px] h-[560px]">
              <div className="phone-notch" />
              <div className="phone-home-bar" />
              
              {/* Phone Content - Mini Wallet Preview */}
              <div className="w-full h-full bg-white overflow-hidden flex flex-col">
                {/* Status bar */}
                <div className="h-8 bg-white flex items-center justify-between px-5 pt-2">
                  <span className="text-[10px] font-semibold text-it-text">9:41</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-full bg-gray-200" />
                    <div className="w-3 h-3 rounded-full bg-gray-200" />
                  </div>
                </div>

                {/* Account */}
                <div className="px-4 pt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-it-blue to-puffer-cyan flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">E</span>
                    </div>
                    <span className="text-[13px] font-semibold text-it-text">Account 01</span>
                  </div>
                </div>

                {/* Asset Card */}
                <div className="mx-4 mt-3 p-4 rounded-3xl asset-card-gradient text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-6 -translate-x-6" />
                  <p className="text-[11px] opacity-80">Total Balance</p>
                  <p className="text-2xl font-bold mt-0.5">$ 0</p>
                  <div className="flex items-center gap-1 mt-1">
                    <p className="text-[10px] opacity-70 font-mono">0x7337a6B4...AB998973c1</p>
                    <Copy className="w-3 h-3 opacity-50" />
                  </div>
                  <p className="text-[10px] opacity-80 mt-0.5">Ethereum</p>
                </div>

                {/* Action Buttons */}
                <div className="mx-4 mt-3 p-3 bg-gray-50 rounded-2xl flex justify-around">
                  {actionItems.map((item, i) => {
                    const Icon = item.icon;
                    return (
                    <div key={item.label} className="flex flex-col items-center gap-1">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${i === 3 ? 'bg-it-blue/10' : 'bg-white'}`}>
                        <Icon className={`w-5 h-5 ${i === 3 ? 'text-it-blue' : 'text-it-text'}`} strokeWidth={2.2} />
                      </div>
                      <span className={`text-[9px] ${i === 3 ? 'text-it-blue font-medium' : 'text-gray-500'}`}>{item.label}</span>
                    </div>
                    );
                  })}
                </div>

                {/* Token List */}
                <div className="px-4 mt-3 flex-1">
                  <div className="flex gap-4 text-[12px] font-medium mb-2">
                    <span className="text-it-text">代币</span>
                    <span className="text-it-text-tertiary">NFT</span>
                    <span className="text-it-text-tertiary">DeFi</span>
                  </div>
                  
                  {[
                    { symbol: 'ETH', name: 'Ether', change: '+1.59%', price: '$2,141.96' },
                    { symbol: 'USDT', name: 'Tether USD', change: '+0.01%', price: '$0.99' },
                  ].map((token) => (
                    <div key={token.symbol} className="flex items-center gap-3 py-2.5 border-b border-gray-50">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        token.symbol === 'ETH' ? 'bg-[#edefff] text-[#627eea]' : 'bg-[#26a17b] text-white'
                      }`}>
                        <span className="text-[10px] font-bold">{token.symbol === 'USDT' ? '₮' : '◆'}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-[12px] font-semibold text-it-text">{token.symbol}</p>
                        <p className="text-[10px] text-it-text-tertiary">{token.name}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-it-success bg-emerald-50 px-1.5 py-0.5 rounded">{token.change}</span>
                        <p className="text-[10px] text-it-text-tertiary mt-0.5">{token.price}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Nav */}
                <div className="mt-auto pb-6 pt-2 bg-white shadow-gutter flex justify-around items-center">
                  {navItems.map((item, i) => {
                    const Icon = item.icon;
                    return (
                    <div key={item.label} className="flex flex-col items-center gap-0.5">
                      <Icon className={`w-5 h-5 ${i === 0 ? 'text-it-blue' : 'text-gray-400'}`} strokeWidth={2.2} />
                      <span className={`text-[9px] ${i === 0 ? 'text-it-blue font-medium' : 'text-gray-400'}`}>{item.label}</span>
                    </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
