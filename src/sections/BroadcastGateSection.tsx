import { useState, useRef, useEffect } from 'react';
import { Lock, Unlock, Shield, Radio, Clock } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function BroadcastGateSection() {
  const [gateClosed, setGateClosed] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.gate-content', { opacity: 0, y: 24 }, {
        opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' }
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="broadcastgate" className="py-20 md:py-28 px-5 relative overflow-hidden">
      <div className="absolute inset-0 ocean-gradient-deep" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="bubble w-16 h-16 top-[20%] left-[8%]" style={{ animationDelay: '0s' }} />
        <div className="bubble w-12 h-12 top-[60%] right-[10%]" style={{ animationDelay: '2s' }} />
        <div className="bubble w-20 h-20 top-[40%] left-[85%]" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="gate-content opacity-0 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 backdrop-blur mb-6">
            {gateClosed ? <Lock className="w-10 h-10 text-puffer-green" /> : <Unlock className="w-10 h-10 text-amber-400" />}
          </div>

          <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight mb-3">
            Signed locally. Not broadcasted.
          </h2>
          <p className="text-[15px] text-white/60 max-w-lg mx-auto mb-2">
            签名可以生成，但上链必须由用户决定
          </p>
          <p className="text-[13px] text-white/40 mb-10">
            The transaction is prepared, but never sent automatically.
          </p>

          <div className="relative max-w-md mx-auto mb-10">
            <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20">
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-center">
                  <Clock className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                  <p className="text-[11px] text-emerald-400 font-medium">签名状态</p>
                  <p className="text-[9px] text-white/40">第 6 步生成后可见</p>
                </div>
                <div className="p-3 rounded-2xl bg-it-blue/20 border border-it-blue/30 text-center">
                  <Lock className="w-5 h-5 text-it-blue mx-auto mb-1" />
                  <p className="text-[11px] text-it-blue font-medium">广播状态</p>
                  <p className="text-[9px] text-white/40">Blocked by design</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 py-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className={`w-2 rounded-full transition-all duration-700 ${gateClosed ? 'h-16 bg-puffer-green/60' : 'h-4 bg-amber-400/60'}`} style={{ transitionDelay: `${i * 100}ms` }} />
                ))}
              </div>

              <div className="flex items-center justify-around mt-4 pt-4 border-t border-white/10">
                <div className="text-center">
                  <p className="text-xl font-bold text-white">0</p>
                  <p className="text-[10px] text-white/40">链上提交</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-400">Ready</p>
                  <p className="text-[10px] text-white/40">签名状态</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-xl font-bold text-it-blue">Blocked</p>
                  <p className="text-[10px] text-white/40">广播状态</p>
                </div>
              </div>
            </div>

            <button onClick={() => setGateClosed(!gateClosed)}
              className="mt-4 mx-auto flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-white text-[12px] font-medium hover:bg-white/20 transition-all">
              {gateClosed ? <><Radio className="w-3.5 h-3.5" /> 演示切换</> : <><Lock className="w-3.5 h-3.5" /> 关闭闸门</>}
            </button>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20">
            <Shield className="w-4 h-4 text-puffer-green" />
            <span className="text-[12px] text-white/80 font-medium">Your digital world, under your control.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
