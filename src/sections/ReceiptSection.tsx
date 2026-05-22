import { useRef, useEffect } from 'react';
import { ArrowDown, Wallet, TrendingUp, Shield, Lock, Eye } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function ReceiptSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.receipt-card', { opacity: 0, y: 24 }, {
        opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' }
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="receipt" className="py-20 md:py-28 px-5">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[11px] font-mono text-it-blue uppercase tracking-wider">Pre-Sign Receipt</span>
          <h2 className="text-2xl md:text-3xl font-bold text-it-text mt-2 tracking-tight">
            钱包应该在确认前说人话
          </h2>
          <p className="text-[13px] text-it-text-secondary mt-2 max-w-md mx-auto">
            每一笔质押交易，都先翻译成人话。用户看懂了，再签名。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* You Pay */}
          <div className="receipt-card opacity-0 p-5 rounded-3xl bg-white border border-red-100/60 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-red-500" />
              </div>
              <h3 className="text-[14px] font-semibold text-it-text">You Pay</h3>
            </div>
            <div className="p-3 rounded-2xl bg-red-50/50 border border-red-100/60">
              <p className="text-[11px] text-red-400">Amount</p>
              <p className="text-2xl font-bold text-red-500">0.05 ETH</p>
            </div>
            <div className="flex items-center justify-between py-2 mt-2 border-b border-gray-50">
              <span className="text-[12px] text-gray-400">Gas fee (est.)</span>
              <span className="text-[12px] text-it-text">~0.001 ETH</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[12px] text-gray-400">Target protocol</span>
              <span className="text-[12px] font-medium text-it-blue">Puffer</span>
            </div>
          </div>

          {/* Conversion arrow - md only */}
          <div className="hidden md:flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-it-blue to-puffer-cyan flex items-center justify-center shadow-lg shadow-blue-100">
                <ArrowDown className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] text-gray-400">rate from Step 3</span>
            </div>
          </div>

          {/* You Receive */}
          <div className="receipt-card opacity-0 p-5 rounded-3xl bg-white border border-emerald-100/60 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-[14px] font-semibold text-it-text">You Receive</h3>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100/60">
              <p className="text-[11px] text-emerald-500">Estimated pufETH</p>
              <p className="text-2xl font-bold text-emerald-500">0.04649</p>
              <p className="text-[9px] text-gray-400 mt-0.5">实际数值以第 3 步 source 为准</p>
            </div>
            <div className="flex items-center justify-between py-2 mt-2 border-b border-gray-50">
              <span className="text-[12px] text-gray-400">pufETH/ETH rate</span>
              <span className="text-[12px] font-mono text-gray-600">1 ETH ≈ 0.9298</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[12px] text-gray-400">Vault opportunity</span>
              <span className="text-[12px] font-mono text-gray-600">UniFi Vault</span>
            </div>
          </div>

          {/* You Control */}
          <div className="receipt-card opacity-0 p-5 rounded-3xl bg-white border border-it-blue/20 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <Shield className="w-4 h-4 text-it-blue" />
              </div>
              <h3 className="text-[14px] font-semibold text-it-text">You Control</h3>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50/50 border border-blue-100/60">
              <p className="text-[11px] text-it-blue/70">Final decision</p>
              <p className="text-lg font-bold text-it-blue">Sign locally</p>
              <p className="text-[9px] text-gray-400 mt-0.5">broadcast manually</p>
            </div>
            <div className="space-y-2 mt-3">
              {[
                { icon: Lock, text: 'Token Core 本地签名' },
                { icon: Shield, text: 'Broadcast Gate 拦截' },
                { icon: Eye, text: '最终权归用户' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2">
                  <item.icon className="w-3.5 h-3.5 text-it-blue/60 shrink-0" />
                  <span className="text-[11px] text-gray-500">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
