import { useRef, useEffect } from 'react';
import { Cpu, Radio, Activity, WifiOff, Lock } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function TokenCoreSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.evidence-card', { opacity: 0, y: 24 }, {
        opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' }
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="tokencore" className="py-20 md:py-28 px-5 bg-gray-50/50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">Runtime Evidence</span>
          <h2 className="text-2xl md:text-3xl font-bold text-it-text mt-2 tracking-tight">
            真实能力已接到 7 步演示里
          </h2>
          <p className="text-[13px] text-it-text-secondary mt-2 max-w-lg mx-auto">
            第 3 步读取 Puffer 数据，第 6 步运行 Token Core 本地签名，第 7 步由 Broadcast Gate 拦截广播。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Puffer API Evidence */}
          <div className="evidence-card opacity-0 p-5 rounded-3xl bg-white border border-amber-100/60 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                <Activity className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-it-text">Puffer API</h3>
                <span className="text-[9px] font-mono text-emerald-500">Live or snapshot</span>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { label: 'source', value: 'puffer-live / snapshot', type: 'pending' },
                { label: 'rate', value: 'visible in Step 3', type: 'fixed' },
                { label: 'APY', value: 'visible in Step 3', type: 'fixed' },
                { label: 'TVL', value: 'visible in Step 3', type: 'fixed' },
                { label: 'estimated pufETH', value: 'calculated', type: 'fixed' },
                { label: 'updatedAt', value: 'visible in Step 3', type: 'fixed' },
              ].map((field) => (
                <div key={field.label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-[10px] font-mono text-gray-400">{field.label}</span>
                  <span className={`text-[10px] font-mono ${field.type === 'pending' ? 'text-amber-500' : 'text-gray-300'}`}>
                    {field.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 p-2.5 rounded-xl bg-amber-50/40 border border-amber-100/50">
              <div className="flex items-center gap-1.5">
                <WifiOff className="w-3 h-3 text-amber-400" />
                <span className="text-[9px] text-amber-600">API 失败时明确显示 Official snapshot</span>
              </div>
            </div>
          </div>

          {/* Token Core Evidence */}
          <div className="evidence-card opacity-0 p-5 rounded-3xl bg-white border border-purple-100/60 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-it-text">Token Core</h3>
                <span className="text-[9px] font-mono text-purple-500">tcx-wasm runtime</span>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { label: 'wasmLoaded', value: 'true after run', type: 'boolean' },
                { label: 'keystoreCreated', value: 'true after run', type: 'boolean' },
                { label: 'network', value: 'Sepolia / TESTNET', type: 'fixed' },
                { label: 'derivedAddress', value: 'visible in Step 6', type: 'fixed' },
                { label: 'txSignature', value: 'visible in Step 6', type: 'fixed' },
                { label: 'messageSignature', value: 'visible in Step 6', type: 'fixed' },
              ].map((field) => (
                <div key={field.label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-[10px] font-mono text-gray-400">{field.label}</span>
                  <span className={`text-[10px] font-mono ${
                    field.type === 'null' ? 'text-gray-300' : field.type === 'boolean' ? 'text-gray-400' : 'text-purple-400'
                  }`}>
                    {field.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-1.5">
              <span className="px-1.5 py-0.5 text-[8px] font-mono bg-emerald-50 text-emerald-500 rounded border border-emerald-100">
                seedPhrase: false
              </span>
              <span className="px-1.5 py-0.5 text-[8px] font-mono bg-emerald-50 text-emerald-500 rounded border border-emerald-100">
                keyExport: false
              </span>
            </div>

            <div className="mt-2 p-2.5 rounded-xl bg-purple-50/40 border border-purple-100/50">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-purple-400" />
                <span className="text-[9px] text-purple-600">点击第 6 步按钮后真实生成签名</span>
              </div>
            </div>
          </div>

          {/* Broadcast Gate Evidence */}
          <div className="evidence-card opacity-0 p-5 rounded-3xl bg-white border border-blue-100/60 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <Radio className="w-4 h-4 text-it-blue" />
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-it-text">Broadcast Gate</h3>
                <span className="text-[9px] font-mono text-it-blue">Blocked by design</span>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { label: 'status', value: 'ready / blocked', type: 'blocked' },
                { label: 'signatureGenerated', value: 'from Step 6', type: 'pending' },
                { label: 'onchainSubmissions', value: '0', type: 'zero' },
                { label: 'realAssetsTouched', value: 'false', type: 'safe' },
                { label: 'finalControl', value: 'user', type: 'user' },
              ].map((field) => (
                <div key={field.label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-[10px] font-mono text-gray-400">{field.label}</span>
                  <span className={`text-[10px] font-mono ${
                    field.type === 'blocked' ? 'text-it-blue font-semibold' :
                    field.type === 'safe' ? 'text-emerald-500' :
                    field.type === 'zero' ? 'text-gray-500' :
                    field.type === 'user' ? 'text-it-blue' :
                    'text-gray-400'
                  }`}>
                    {field.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 p-2.5 rounded-xl bg-blue-50/40 border border-blue-100/50">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-it-blue" />
                <span className="text-[9px] text-it-blue/70">安全设计：不自动广播，权归用户</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-400">
            真实结果不藏在控制台：请在手机演示第 3、6、7 步查看 source、updatedAt、address、signature、0 tx。
          </p>
        </div>
      </div>
    </section>
  );
}
